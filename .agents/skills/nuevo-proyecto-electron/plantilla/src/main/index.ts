import { join } from 'node:path';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { CANAL } from '../shared/tipos.ts';

function crearVentana(): void {
  const ventana = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 560,
    show: false,
    autoHideMenuBar: true,
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
  ipcMain.handle(CANAL.version, () => app.getVersion());

  crearVentana();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
