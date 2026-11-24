import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { app, BrowserWindow, dialog, ipcMain, net, shell } from 'electron';
import { CANAL, ID_PROVEEDORES, type IdProveedor, type Resultado, type ResultadoActualizar, type ResultadoNovedades } from '../shared/tipos.ts';
import { descargarPaquete, esMayor, novedadesDesde, type Paquete, URL_RELEASE } from './servicios/github.ts';
import { actualizar, instalar, leerEstado, resolverDestino, revisarCambios, tieneHarness, versionInstalada } from './servicios/harness.ts';

const ERROR_RED = 'No se pudo consultar GitHub. Revisa tu conexión a internet y vuelve a intentarlo.';

// La carpeta destino vive aquí: sale del valor sugerido, de la última usada o del diálogo del sistema, nunca del renderer.
let destino = '';
// Lo último descargado de GitHub: se instala exactamente lo que se le mostró a la persona.
let paquete: Paquete | null = null;

const rutaAjustes = (): string => join(app.getPath('userData'), 'ajustes.json');

function ultimoDestino(): string | null {
  try {
    const { destino: ultimo } = JSON.parse(readFileSync(rutaAjustes(), 'utf8'));
    return typeof ultimo === 'string' && existsSync(ultimo) ? ultimo : null;
  } catch {
    return null; // primera vez que se abre
  }
}

function recordarDestino(): void {
  try {
    writeFileSync(rutaAjustes(), JSON.stringify({ destino }));
  } catch (error) {
    console.error(error); // solo se pierde la comodidad de recordar la carpeta
  }
}

// net.fetch respeta el proxy del sistema; fetch de Node no.
const bajarPaquete = (): Promise<Paquete> => descargarPaquete((url, opciones) => net.fetch(url, opciones));

function crearVentana(): void {
  const ventana = new BrowserWindow({
    width: 760,
    height: 720,
    resizable: false,
    show: false,
    autoHideMenuBar: true,
    title: 'Instalador de JavIA',
    webPreferences: {
      preload: join(import.meta.dirname, '../preload/index.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  ventana.once('ready-to-show', () => ventana.show());

  // Los enlaces externos se abren en el navegador del sistema, nunca dentro de la app.
  ventana.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });

  // En desarrollo electron-vite sirve el renderer por HTTP; ya compilado se carga del disco.
  if (process.env.ELECTRON_RENDERER_URL) void ventana.loadURL(process.env.ELECTRON_RENDERER_URL);
  else void ventana.loadFile(join(import.meta.dirname, '../renderer/index.html'));
}

app.whenReady().then(() => {
  destino = resolverDestino(ultimoDestino() ?? app.getPath('documents'), homedir());

  ipcMain.handle(CANAL.estado, () => leerEstado(destino, homedir()));

  ipcMain.handle(CANAL.elegirCarpeta, async (evento) => {
    const { canceled, filePaths } = await dialog.showOpenDialog(BrowserWindow.fromWebContents(evento.sender)!, {
      title: 'Elige dónde quieres tu carpeta de JavIA',
      defaultPath: app.getPath('documents'),
      properties: ['openDirectory', 'createDirectory'],
    });
    if (!canceled && filePaths[0]) destino = resolverDestino(filePaths[0], homedir());
    return leerEstado(destino, homedir());
  });

  ipcMain.handle(CANAL.instalar, async (_evento, ids: unknown): Promise<Resultado> => {
    const validos =
      Array.isArray(ids) && ids.length > 0 && ids.every((id) => ID_PROVEEDORES.includes(id as IdProveedor));
    if (!validos) return { ok: false, error: 'Marca al menos un asistente.' };
    try {
      paquete ??= await bajarPaquete();
    } catch (error) {
      console.error(error);
      return { ok: false, error: ERROR_RED };
    }
    try {
      const informe = instalar(destino, ids as IdProveedor[], paquete);
      recordarDestino();
      return { ok: true, ...informe };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        error: 'No se pudo guardar en esa carpeta. Elige otra, o revisa que tengas permiso para guardar ahí.',
      };
    }
  });

  ipcMain.handle(CANAL.novedades, async (): Promise<ResultadoNovedades> => {
    try {
      paquete = await bajarPaquete();
      const instalada = versionInstalada(destino);
      return {
        ok: true,
        version: paquete.version,
        instalada,
        hayNovedades: tieneHarness(destino) && instalada !== paquete.version,
        novedades: novedadesDesde(paquete.novedades, instalada),
        cambios: revisarCambios(destino, paquete),
        instaladorNuevo: esMayor(paquete.instalador, app.getVersion()),
      };
    } catch (error) {
      console.error(error);
      return { ok: false, error: ERROR_RED };
    }
  });

  ipcMain.handle(CANAL.actualizar, (): ResultadoActualizar => {
    if (!paquete || !tieneHarness(destino)) return { ok: false, error: ERROR_RED };
    try {
      const resultado = actualizar(destino, paquete);
      recordarDestino();
      return { ok: true, version: paquete.version, ...resultado };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        error: 'No se pudo terminar la actualización. Cierra los programas que estén usando esa carpeta y vuelve a intentarlo; no se perdió nada.',
      };
    }
  });

  ipcMain.handle(CANAL.abrirDescarga, () => shell.openExternal(URL_RELEASE));

  ipcMain.handle(CANAL.abrirCarpeta, async () => {
    await shell.openPath(destino);
  });

  crearVentana();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana();
  });
});

app.on('window-all-closed', () => app.quit());
