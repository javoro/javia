---
name: nuevo-proyecto-electron
description: Crea una app de escritorio nueva con el stack del harness (Electron + electron-vite + React + TypeScript + Tailwind + shadcn/ui) a partir de la plantilla incluida, la deja compilando y con su prueba de arranque en verde. Úsala cuando el pendiente es una app que aún no existe en `proyectos/`.
---

# Crear una app de escritorio nueva

La app se crea copiando `plantilla/` (junto a este archivo). **No uses generadores** (`npm create ...`) ni cambies versiones: la plantilla ya trae el stack exacto, la seguridad configurada y la prueba de arranque, y está verificada de punta a punta (compila, abre, se empaqueta).

## Pasos

1. **Nombre.** Carpeta `proyectos/{app}/`, en minúsculas con guiones, sin acentos ni espacios (`control-inventario`). Acuerda también con el usuario el **nombre visible** ("Control de Inventario").

2. **Copiar la plantilla** (desde la raíz del harness; incluye los archivos que empiezan con punto):

   ```
   PowerShell:  Copy-Item -Recurse .agents/skills/nuevo-proyecto-electron/plantilla proyectos/{app}
   bash:        mkdir -p proyectos && cp -r .agents/skills/nuevo-proyecto-electron/plantilla proyectos/{app}
   ```

3. **Personalizar** (solo estos puntos):

   | Archivo | Qué cambiar |
   |---|---|
   | `package.json` | `name` (= carpeta), `description`, `author` (el de `memoria/Indice.md`) |
   | `electron-builder.yml` | `appId` (`com.{autor-u-organizacion}.{app}`, sin guiones raros) y `productName` (nombre visible) |
   | `src/renderer/index.html` | `<title>` |
   | `src/renderer/src/App.tsx` | el título de la pantalla inicial |

4. **Instalar y verificar**, dentro de `proyectos/{app}/`:

   ```
   npm install
   npm run verificar
   npm run e2e
   ```

   Los tres deben terminar sin errores antes de escribir una sola línea del pendiente. `npm run e2e` abre la app real un momento y deja `docs/capturas/01-arranque.png`: ábrela y confirma que se ve la pantalla inicial.

5. **Control de versiones.** `git init` dentro de `proyectos/{app}/` (cada app es su propio repositorio). El primer commit se hace cuando el usuario lo apruebe.

6. **Diseño.** Antes de la primera pantalla real, crear `PRODUCT.md` y `DESIGN.md` con la skill `impeccable` (`impeccable init`), a partir de lo que el usuario dijo en la Fase 1. Los tokens resultantes van en `src/renderer/src/estilos.css`.

7. **Icono.** Cuando el nombre, la función y los colores estén definidos, y siempre antes del primer instalador, crearlo con la skill `icono-app`. Sin él la app sale con el icono genérico de Electron.

8. **Registrar** la app en `memoria/Indice.md` con su nota `memoria/{app}.md`.

## Qué trae la plantilla

```
proyectos/{app}/
├── package.json              scripts: dev · build · check · test · e2e · verificar · dist
├── electron.vite.config.ts   compila main, preload (CommonJS) y renderer (React + Tailwind)
├── electron-builder.yml      instalador: NSIS (Windows), dmg (macOS), AppImage (Linux)
├── tsconfig.json             estricto; alias @/ → src/renderer/src
├── components.json           configuración de shadcn/ui
├── playwright.config.ts
├── src/
│   ├── main/index.ts         ventana segura + manejadores IPC
│   ├── preload/index.ts      window.api (puente)
│   ├── shared/tipos.ts       contrato IPC: CANAL + ApiApp
│   └── renderer/
│       ├── index.html        con Content-Security-Policy
│       └── src/              main.tsx · App.tsx · estilos.css (tokens) · env.d.ts
└── pruebas/e2e/              abrirApp.ts (ayudante) · arranque.spec.ts (modelo)
```

Carpetas que aparecen con el uso: `src/main/servicios/` (lógica de negocio + sus `*.test.ts`), `src/renderer/src/components/` (y `components/ui/` de shadcn), `docs/`, `build/` (iconos), `out/` y `release/` (generadas; no se versionan).

## Comandos de una app

| Comando | Para qué |
|---|---|
| `npm run dev` | Abrir la app en modo desarrollo (recarga al guardar) |
| `npm run check` | Revisar tipos |
| `npm test` | Pruebas unitarias (`src/**/*.test.ts`, con el ejecutor de Node) |
| `npm run verificar` | La compuerta: tipos + pruebas + compilación |
| `npm run e2e` | Compilar y probar la app real con Playwright |
| `npm run dist` | Generar el instalador en `release/` (skill `empaquetar-app`) |

## Agregar una capacidad nueva (patrón)

Para que la interfaz pueda hacer algo del sistema (leer un archivo, llamar un servicio):

1. `src/shared/tipos.ts`: agregar el canal a `CANAL` y la firma a `ApiApp`.
2. `src/main/`: la lógica en `servicios/{tema}.ts` (función pura con su prueba) y el `ipcMain.handle(CANAL.x, ...)` que valida, la llama y responde.
3. `src/preload/index.ts`: la función correspondiente en `api`.
4. `src/renderer/`: usar `window.api.x()`.

Reglas completas: `.agents/reglas/electron.md` e `interfaz.md`.
