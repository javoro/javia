---
paths:
  - "proyectos/**/src/main/**"
  - "proyectos/**/src/preload/**"
  - "proyectos/**/src/shared/**"
  - "proyectos/**/electron.vite.config.ts"
  - "proyectos/**/electron-builder.yml"
---

# Electron: procesos, IPC y seguridad

Una app de Electron son tres mundos. Cada cosa va en el suyo:

| Carpeta | Proceso | Qué va | Qué no va |
|---|---|---|---|
| `src/main/` | Principal (Node) | Ventanas, archivos, red, base de datos, secretos, lógica de negocio | Nada de interfaz |
| `src/preload/` | Puente | Solo `contextBridge.exposeInMainWorld('api', ...)` con funciones concretas | Lógica, acceso a disco |
| `src/renderer/` | Interfaz (navegador) | React, estado de pantalla, validación de formularios | `fs`, `require`, secretos, llamadas directas a APIs con token |
| `src/shared/` | Los tres | Tipos y constantes del contrato (`tipos.ts`); solo código sin dependencias de Node ni del DOM | — |

## Reglas duras

- **No relajar la ventana:** `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`. Nunca `webSecurity: false`, `<webview>` ni `remote`.
- **Todo cruce renderer → main es un canal declarado** en `src/shared/tipos.ts` (`CANAL` + la firma en `ApiApp`), implementado con `ipcMain.handle` en main y expuesto como función en preload. Para agregar una capacidad se tocan esos tres archivos, en ese orden.
- **El manejador valida lo que recibe** antes de usarlo: tipo, rango y, sobre todo, rutas. Una ruta de archivo sale de un diálogo del sistema (`dialog.showOpenDialog` en main) o se valida contra una carpeta permitida; nunca se confía en una ruta armada en el renderer.
- **Secretos** (tokens, contraseñas, cadenas de conexión): se leen en main en tiempo de ejecución, de `.env` (con `process.env`) o de `safeStorage`. **Nunca** con `import.meta.env`: esa vía copia el valor dentro del archivo compilado. `.env` va en `.gitignore`; se versiona un `.env.example` sin valores.
- **Enlaces externos:** `shell.openExternal` y solo `https://`. La ventana no navega a sitios externos.
- **No relajar la CSP** de `src/renderer/index.html`. Si una función necesita un origen nuevo (una API, imágenes remotas), se agrega ese origen exacto y se justifica en el plan.
- **Trabajo pesado fuera del hilo principal:** procesar muchos archivos, PDFs, hojas de cálculo grandes o cálculos largos bloquea la app y Windows la da por colgada. Va en `worker_threads` o `utilityProcess`, con progreso hacia la interfaz (eventos con límite de frecuencia) y lectura/escritura en *streaming* cuando el archivo puede ser grande.
- **Archivos del usuario:** no se sobrescriben; se escribe una copia (`nombre_procesado.ext`) salvo que el plan diga otra cosa. Los datos propios de la app van en `app.getPath('userData')`, nunca junto al ejecutable.
- **Errores:** el manejador IPC atrapa el error, lo registra en main y devuelve un mensaje entendible en español; el renderer lo muestra. Sin `catch` vacíos, sin secretos ni rutas internas en el mensaje.

## Convenciones

- El paquete es ESM (`"type": "module"`): en main se usa `import.meta.dirname`, no `__dirname`. El preload se compila a CommonJS (`index.cjs`) porque una ventana con sandbox no carga otra cosa; no cambiarlo.
- Los imports relativos llevan la extensión `.ts`/`.tsx` (así las pruebas corren directo con `node --test`). Sin `enum` ni `namespace` (`erasableSyntaxOnly`): usa objetos `as const`.
- Una librería que solo existe como ESM o que trae binarios nativos puede necesitar `asarUnpack` en `electron-builder.yml`; se prueba con el instalador, no solo en desarrollo.
- La lógica de negocio va en funciones puras (`src/main/servicios/*.ts`) con su `*.test.ts` al lado; el manejador IPC solo valida, llama y responde.

## Trampas conocidas

- **`ELECTRON_RUN_AS_NODE`**: la terminal integrada de VS Code la define y hace que Electron arranque como Node (la app "no abre"). Antes de `npm run dev` desde ahí: PowerShell `Remove-Item Env:ELECTRON_RUN_AS_NODE`, bash `unset ELECTRON_RUN_AS_NODE`.
- La carpeta de datos (`userData`) toma el `name` de `package.json`, no el `productName`.
- `out/`, `release/` y `node_modules/` pesan cientos de MB por app: se borran sin miedo (se regeneran) y nunca se versionan.
