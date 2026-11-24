---
name: icono-app
description: Crea el icono de una app de escritorio de Electron - el agente dibuja propuestas acordes al nombre y la función de la app, el usuario elige viendo una lámina, y el icono queda puesto y comprobado en el programa. Úsala en toda app nueva antes de su primer instalador, o cuando el usuario pida crear o cambiar el icono.
---

# Icono de una app de escritorio

El icono **lo creas tú**, el agente: no se le pide al usuario ni se baja de internet. Todo se corre dentro de `proyectos/{app}/`, con `npm install` ya hecho.

`{skill}` = ruta de esta carpeta desde la app (`../../.agents/skills/icono-app`).

## 1. Entender qué debe decir

Lee `PRODUCT.md`, `DESIGN.md` (colores), `docs/` y el `productName`. Escribe en una frase **qué hace la app** y saca de ahí 2–3 ideas distintas entre sí:

- una que diga el **nombre** (inicial o juego con el nombre),
- una que diga la **función** (el objeto o la acción principal: una etiqueta, una caja, una gráfica),
- si sale natural, una que una las dos.

Si la app no tiene función clara todavía, pregúntala antes de dibujar.

## 2. Dibujar 2–3 propuestas

En una carpeta temporal, un archivo por propuesta:

- **SVG (lo normal):** escríbelo tú, con `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">`. Sin texto tipográfico (dibuja la letra con trazos), sin imágenes ni fuentes externas.
- **Si tienes un generador de imágenes** y la idea lo amerita: PNG cuadrado de 1024×1024, plano, sin texto y con fondo transparente alrededor de la forma.

Reglas de dibujo:

- **Una sola idea**, máximo 2 elementos. Se tiene que reconocer a 16×16: sin líneas finas (en 1024, ningún trazo menor a 64), sin sombras ni detalles pequeños.
- Forma contenedora: cuadrado redondeado que ocupa casi todo (`x=64 y=64 width=896 height=896 rx=208`); fuera de ella, transparente.
- Colores de `DESIGN.md` (o de los tokens de `estilos.css`), máximo 3, con buen contraste. Debe verse sobre barra de tareas clara y oscura.
- **Sin doble sentido:** geometría limpia. Evita trazos largos con remate redondo o abultado, pares de círculos y cualquier figura que se preste a burla. Mira cada propuesta con esa lente y descarta la que deje duda.
- **Original:** no copies ni imites logos de otras marcas, ni uses el de una marca del usuario sin que él lo pida.

## 3. Ver las propuestas tú primero

```
npx electron {skill}/renderizar-icono.mjs muestra docs/capturas/icono-propuestas.png <propuesta1> <propuesta2> ...
```

Sale una lámina: una fila numerada por propuesta, sobre fondo claro y oscuro, a 256, 64, 48, 32 y 16 px. **Ábrela y mírala.** Corrige o descarta lo que no se lea a 16 px, quede descentrado o se pierda en un fondo.

Si el comando no hace nada o falla diciendo que `app` no existe, quita la variable `ELECTRON_RUN_AS_NODE` (trampa conocida en `.agents/reglas/electron.md`).

## 4. Que el usuario elija

Ábrele la lámina en pantalla y pregúntale cuál queda, con una recomendada y el porqué en una frase; una de las opciones es "otras propuestas". No sigas sin su elección.

## 5. Dejarlo puesto

1. Guarda el dibujo elegido como `build/icono.svg` (o `build/icono.png`): es el original editable.
2. Genera el que usa electron-builder:

   ```
   npx electron {skill}/renderizar-icono.mjs icono build/icono.svg build/icon.png
   ```

   Con `build/icon.png` de 1024×1024 basta: electron-builder saca de ahí los de Windows, macOS y Linux. No hagas `.ico` ni `.icns` a mano; si existen de antes, bórralos o ganarán ellos.
3. Se versionan los dos archivos. Las propuestas descartadas se borran.

## 6. Comprobarlo en el programa

`npm run dist` ya no debe mostrar "default Electron icon is used". En Windows, saca el icono del programa generado y **ábrelo para verlo**:

```
PowerShell:  Add-Type -AssemblyName System.Drawing; [Drawing.Icon]::ExtractAssociatedIcon((Resolve-Path 'release/win-unpacked/{productName}.exe')).ToBitmap().Save("$PWD/docs/capturas/icono-exe.png")
```

Si el Explorador sigue mostrando el icono viejo, es la caché de Windows: se quita al cambiar el nombre del archivo (por ejemplo, al subir la versión).

Anota en `memoria/{app}.md` qué icono se eligió y por qué.
