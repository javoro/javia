import { contextBridge, ipcRenderer } from 'electron';
import { type ApiApp, CANAL } from '../shared/tipos.ts';

// El renderer solo ve estas funciones; nunca se expone ipcRenderer completo.
const api: ApiApp = {
  estado: () => ipcRenderer.invoke(CANAL.estado),
  elegirCarpeta: () => ipcRenderer.invoke(CANAL.elegirCarpeta),
  instalar: (proveedores) => ipcRenderer.invoke(CANAL.instalar, proveedores),
  novedades: () => ipcRenderer.invoke(CANAL.novedades),
  actualizar: () => ipcRenderer.invoke(CANAL.actualizar),
  abrirCarpeta: () => ipcRenderer.invoke(CANAL.abrirCarpeta),
  abrirDescarga: () => ipcRenderer.invoke(CANAL.abrirDescarga),
};

contextBridge.exposeInMainWorld('api', api);
