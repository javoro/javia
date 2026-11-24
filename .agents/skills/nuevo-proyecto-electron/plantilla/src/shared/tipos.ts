// Contrato entre main, preload y renderer: todo canal IPC se declara aquí.
export const CANAL = {
  version: 'app:version',
} as const;

// Lo que el renderer puede pedirle al proceso principal (window.api).
export interface ApiApp {
  version(): Promise<string>;
}
