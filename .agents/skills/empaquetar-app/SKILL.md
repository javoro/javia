---
name: empaquetar-app
description: Genera el instalador de una app de escritorio (electron-builder), lo verifica ya empaquetado antes de entregarlo y, si el usuario lo pide, configura las actualizaciones automáticas. Úsala en la fase de instalador del flujo `nuevo-pendiente` o cuando el usuario pida "el instalador", "el .exe" o "publicar una versión".
---

# Empaquetar y entregar una app

Todo se corre dentro de `proyectos/{app}/`.

## 1. Antes de empaquetar

- `npm run verificar` y `npm run e2e` en verde.
- `electron-builder.yml` tiene el `appId` y el `productName` definitivos. **El `appId` no se cambia después de la primera entrega**: Windows trataría la app como otra distinta.
- Subir la versión en `package.json` (`npm version patch --no-git-tag-version`; `minor` si hay funciones nuevas). Nunca entregar dos instaladores distintos con la misma versión.
- Icono en `build/` si el usuario dio uno.
- Las librerías que usa el **renderer** van en `devDependencies` (Vite ya las mete en el compilado); en `dependencies` solo lo que `main` carga al ejecutarse. Lo que esté de más en `dependencies` engorda el instalador.

## 2. Generar

```
npm run dist
```

Resultado en `release/`: `{name}-{versión}-setup.exe` en Windows (`.dmg` en macOS, `.AppImage` en Linux) y la carpeta `win-unpacked/` con la app sin instalar. **Solo se genera el instalador del sistema operativo donde se corre**; para otro sistema hay que correrlo en ese sistema.

Los avisos "default Electron icon is used" y "no code signing certificate" son normales si no hay icono ni certificado.

## 3. Verificar la app empaquetada (obligatorio)

Lo que funciona en desarrollo puede fallar empaquetado (rutas dentro del `.asar`, workers, librerías nativas). Corre las mismas pruebas e2e contra la app empaquetada:

```
PowerShell:  $env:APP_EMPAQUETADA = "release/win-unpacked/{productName}.exe"; npx playwright test; Remove-Item Env:APP_EMPAQUETADA
bash:        APP_EMPAQUETADA="release/win-unpacked/{productName}.exe" npx playwright test
```

Después, con permiso del usuario, instala el `setup.exe` en el equipo y abre la app instalada una vez. Solo entonces se entrega.

## 4. Entregar

- Se entrega **solo** el instalador (`*-setup.exe`). Cópialo a la carpeta que indique el usuario.
- **Aviso de Windows:** como el instalador no está firmado, Windows muestra "Windows protegió su PC". Se continúa con **Más información → Ejecutar de todas formas**. Díselo al usuario y anótalo en el manual. Quitar ese aviso requiere un certificado de firma de código (de paga); se plantea solo si el usuario lo pide.
- Anota versión, fecha y dónde quedó el instalador en `memoria/{app}.md`.

## 5. Actualizaciones automáticas (solo si el usuario las pide)

Patrón: el código queda privado y los instaladores se publican como *releases* en un repositorio **público** de GitHub aparte, para que la app instalada no necesite ningún token.

1. `npm install electron-updater` (va en `dependencies`: lo carga `main`).
2. En `electron-builder.yml`:
   ```yaml
   publish:
     provider: github
     owner: {usuario-u-organizacion}
     repo: {app}-releases
     releaseType: release   # por defecto quedaría como borrador y el actualizador lo ignoraría
   ```
3. En `src/main/`, solo cuando `app.isPackaged`: `autoUpdater.checkForUpdatesAndNotify()` al arrancar, registrando los errores sin tumbar la app.
4. Publicar (requiere `gh` con sesión iniciada y `GH_TOKEN` en el ambiente): crear primero el release y luego subir.
   ```
   gh release create v{versión} -R {owner}/{app}-releases --title {versión} --notes ""
   npx electron-vite build && npx electron-builder --publish always
   ```
   Crear el release antes evita un error 422 intermitente de electron-builder que lo deja sin `latest.yml`.
5. **Comprobar** que el release contiene `latest.yml`: sin ese archivo las apps instaladas no detectan nada. Si falta, borrar el release (`gh release delete`) y publicar de nuevo.
6. La prueba real es instalar la versión anterior, publicar la nueva y ver que se actualiza. Publicar es una acción hacia afuera: **siempre con confirmación del usuario**.

## Problemas frecuentes

- **"Cannot create symbolic link"** al empaquetar en Windows: activar el *Modo de desarrollador* (Configuración → Sistema → Para desarrolladores) o correr la terminal como administrador esa vez.
- **La app instalada abre en blanco:** una ruta que en desarrollo apuntaba a `src/` o a `node_modules/`. Revisar con `APP_EMPAQUETADA` (paso 3) y la consola de la ventana.
- **Un worker o una librería nativa no carga empaquetada:** necesita `asarUnpack` en `electron-builder.yml`.
- **El antivirus borra o bloquea el instalador:** pasa con instaladores sin firmar; se agrega una excepción o se firma el instalador.
