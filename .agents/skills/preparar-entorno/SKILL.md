---
name: preparar-entorno
description: Deja un equipo listo para desarrollar apps de escritorio con el stack del harness (Node.js, Git, enlaces del harness y skills externas) y lo comprueba con el script de verificación. Úsala la primera vez que se abre el harness en un equipo, cuando `node scripts/preparar-entorno.mjs` reporta faltantes o cuando un comando del stack no se encuentra.
---

# Preparar el entorno de desarrollo

El objetivo es que `node scripts/preparar-entorno.mjs` termine en **"Entorno listo."** Tú instalas lo que falte; al usuario solo se le pide aprobar instalaciones y, si el sistema lo exige, escribir su contraseña de administrador.

## 1. Detectar qué falta

```
node --version
git --version
```

Se necesita **Node.js 22.18 o superior** (incluye `npm`) y **Git**. Si `node` existe, salta al paso 3: el script dice exactamente qué falta.

## 2. Instalar lo que falte

Antes de instalar, dile al usuario qué vas a instalar y para qué, y espera su visto bueno.

| Sistema | Node.js LTS | Git |
|---|---|---|
| Windows 10/11 | `winget install OpenJS.NodeJS.LTS` | `winget install Git.Git` |
| macOS | `brew install node` (o el instalador de nodejs.org) | `xcode-select --install` |
| Linux (Debian/Ubuntu) | con `nvm`: `nvm install --lts` (el paquete de `apt` suele ser viejo) | `sudo apt install git` |

- Tras instalar, **abre una terminal nueva** (la anterior no ve los programas recién instalados) y repite el paso 1.
- En Windows, si `winget` no existe: instaladores de <https://nodejs.org> (LTS) y <https://git-scm.com>, con las opciones por defecto.
- En Linux, para que las pruebas abran la app hace falta un entorno gráfico o `xvfb-run`, más las bibliotecas que pide Electron; consúltalas en la documentación vigente de Electron para esa distribución.
- **GitHub CLI (`gh`) es opcional**: solo se usa para publicar actualizaciones automáticas (skill `empaquetar-app`). Windows: `winget install GitHub.cli`.
- No hace falta instalar Electron, TypeScript ni nada más de forma global: cada app trae sus herramientas en su propio `node_modules`.

## 3. Verificar y enlazar

Desde la raíz del harness:

```
node scripts/preparar-entorno.mjs
```

El script:

1. Comprueba Node.js, npm y Git.
2. Instala en `.agents/skills/` las skills externas que usa el flujo (`impeccable`, para diseño de interfaz). Necesita internet la primera vez.
3. Crea en `.claude/` los enlaces a `.agents/roles`, `.agents/reglas` y `.agents/skills` para que Claude Code cargue roles, reglas y skills de forma nativa. Los demás agentes leen `.agents/` directamente.

Si reporta `FALTA`, corrige eso y vuelve a correrlo. Los `aviso` no bloquean; léelos y actúa si aplican.

## 4. Datos del autor (una sola vez)

Si `memoria/Indice.md` aún dice "POR DEFINIR" en el autor, pregunta al usuario su nombre (el que firmará los documentos y las apps) y anótalo ahí.

## 5. Prueba de humo (recomendada la primera vez)

Si es la primera vez en este equipo, comprueba la cadena completa creando una app de prueba con la skill `nuevo-proyecto-electron` (nombre `prueba-entorno`) hasta que `npm run verificar` y `npm run e2e` pasen. Después borra `proyectos/prueba-entorno/`.

## Problemas frecuentes

- **`npm` no se reconoce** tras instalar Node: falta abrir una terminal nueva.
- **La app no abre con `npm run dev`** desde la terminal de VS Code: la variable `ELECTRON_RUN_AS_NODE` está definida. PowerShell: `Remove-Item Env:ELECTRON_RUN_AS_NODE`; bash: `unset ELECTRON_RUN_AS_NODE`.
- **`npm install` falla al descargar Electron** (red corporativa, proxy, antivirus): reintentar; si persiste, es bloqueo de red y hay que pedir acceso a `github.com` y `npmjs.org`.
- **Disco lleno:** cada app ocupa cientos de MB en `node_modules/`, `out/` y `release/`. Se pueden borrar siempre; se regeneran con `npm install` y `npm run build`.
- **PowerShell bloquea `npm`** ("la ejecución de scripts está deshabilitada"): usar `npm.cmd` en vez de `npm`, o la terminal Git Bash.
