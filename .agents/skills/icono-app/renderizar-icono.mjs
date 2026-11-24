// Convierte el dibujo del icono (SVG, o PNG cuadrado) en los archivos que usa la app. Se corre con el Electron de la app:
//   npx electron <este archivo> muestra <salida.png> <dibujo> [dibujo...]   lámina para comparar propuestas y tamaños
//   npx electron <este archivo> icono <dibujo> <salida.png>                 icono final de 1024×1024
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { app, BrowserWindow } from 'electron';

const LADO = 1024;
const TAMANOS = [256, 64, 48, 32, 16];
const TIPOS = { svg: 'image/svg+xml', png: 'image/png' };

// Corre dentro de la ventana: dibuja en un lienzo, así el tamaño no depende de la escala de la pantalla.
async function dibujar({ modo, dibujos, LADO, TAMANOS }) {
  const imagenes = await Promise.all(
    dibujos.map(async ({ ruta, url, svg }) => {
      const imagen = new Image();
      imagen.src = url;
      await imagen.decode().catch(() => {
        throw new Error(`${ruta}: no se pudo leer la imagen (¿SVG mal formado?)`);
      });
      if (imagen.naturalWidth !== imagen.naturalHeight) throw new Error(`${ruta}: debe ser cuadrada (en SVG, viewBox="0 0 1024 1024" con width y height)`);
      if (!svg && imagen.naturalWidth < 512) throw new Error(`${ruta}: un PNG debe medir al menos 512×512`);
      return imagen;
    }),
  );
  const lienzo = document.createElement('canvas');
  const c = lienzo.getContext('2d');
  const pintar = (imagen, x, y, lado) => {
    c.imageSmoothingQuality = 'high';
    c.drawImage(imagen, x, y, lado, lado);
  };
  if (modo === 'icono') {
    lienzo.width = lienzo.height = LADO;
    pintar(imagenes[0], 0, 0, LADO);
    return lienzo.toDataURL('image/png');
  }
  // Cada propuesta en una fila, sobre fondo claro y sobre fondo oscuro.
  const margen = 32;
  const mitad = TAMANOS.reduce((suma, t) => suma + t + margen, margen);
  const alto = TAMANOS[0] + margen * 2;
  lienzo.width = mitad * 2;
  lienzo.height = alto * imagenes.length;
  imagenes.forEach((imagen, fila) => {
    ['#f3f3f3', '#202020'].forEach((fondo, columna) => {
      c.fillStyle = fondo;
      c.fillRect(columna * mitad, fila * alto, mitad, alto);
      let x = columna * mitad + margen;
      for (const tamano of TAMANOS) {
        pintar(imagen, x, fila * alto + (alto - tamano) / 2, tamano);
        x += tamano + margen;
      }
      c.fillStyle = columna ? '#fff' : '#000';
      c.font = 'bold 20px sans-serif';
      c.fillText(String(fila + 1), columna * mitad + 8, fila * alto + 24);
    });
  });
  return lienzo.toDataURL('image/png');
}

async function principal() {
  const [modo, ...rutas] = process.argv.slice(process.argv.findIndex((a) => a.endsWith('renderizar-icono.mjs')) + 1);
  const [salida, entradas] = modo === 'icono' ? [rutas[1], rutas.slice(0, 1)] : [rutas[0], rutas.slice(1)];
  if (!['icono', 'muestra'].includes(modo) || !salida?.endsWith('.png') || entradas.length === 0) {
    throw new Error('Uso: muestra <salida.png> <dibujo...>  |  icono <dibujo> <salida.png>');
  }
  const dibujos = entradas.map((ruta) => {
    const tipo = TIPOS[ruta.split('.').pop().toLowerCase()];
    if (!tipo) throw new Error(`${ruta}: solo SVG o PNG`);
    return { ruta, svg: tipo === TIPOS.svg, url: `data:${tipo};base64,${readFileSync(ruta).toString('base64')}` };
  });
  const ventana = new BrowserWindow({ show: false, webPreferences: { sandbox: true, contextIsolation: true } });
  await ventana.loadURL('about:blank');
  const { error, url } = await ventana.webContents.executeJavaScript(
    `(${dibujar})(${JSON.stringify({ modo, dibujos, LADO, TAMANOS })}).then((url) => ({ url }), (e) => ({ error: e.message }))`,
  );
  if (error) throw new Error(error);
  mkdirSync(dirname(salida), { recursive: true });
  writeFileSync(salida, Buffer.from(url.split(',')[1], 'base64'));
  console.log(`${salida} listo`);
}

// Sin await al nivel del módulo: Electron no termina de arrancar hasta que el módulo carga.
app.whenReady().then(principal).then(
  () => app.exit(0),
  (error) => {
    console.error(error.message);
    app.exit(1);
  },
);
