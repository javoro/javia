import { contextBridge, ipcRenderer } from 'electron';
import { type ApiApp, CANAL } from '../shared/tipos.ts';

// El renderer solo ve estas funciones; nunca se expone ipcRenderer completo.
const api: ApiApp = {
  version: () => ipcRenderer.invoke(CANAL.version),
};

contextBridge.exposeInMainWorld('api', api);
