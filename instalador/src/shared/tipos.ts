// Contrato entre main, preload y renderer: todo canal IPC se declara aquí.
export const CANAL = {
  estado: 'instalador:estado',
  elegirCarpeta: 'instalador:elegir-carpeta',
  instalar: 'instalador:instalar',
  novedades: 'instalador:novedades',
  actualizar: 'instalador:actualizar',
  abrirCarpeta: 'instalador:abrir-carpeta',
  abrirDescarga: 'instalador:abrir-descarga',
} as const;

export const ID_PROVEEDORES = ['claude', 'codex', 'gemini', 'cursor', 'copilot', 'otro'] as const;
export type IdProveedor = (typeof ID_PROVEEDORES)[number];

export interface EstadoProveedor {
  id: IdProveedor;
  nombre: string;
  detalle: string;
  /** La herramienta parece estar instalada en este equipo (tiene su carpeta en la carpeta del usuario). */
  enEquipo: boolean;
  /** La carpeta destino ya tiene lo de este asistente: no se vuelve a instalar. */
  enDestino: boolean;
}

export interface Estado {
  destino: string;
  yaTieneJavia: boolean;
  proveedores: EstadoProveedor[];
}

export type Resultado =
  | {
      ok: true;
      creados: number;
      /** Ya existían con el mismo contenido. */
      iguales: number;
      /** Ya existían con otro contenido: no se tocaron. */
      distintos: string[];
    }
  | { ok: false; error: string };

/** Una versión publicada del harness (novedades.json). */
export interface Novedad {
  version: string;
  fecha: string;
  cambios: { que: string; paraQue: string }[];
}

/** Rutas de los archivos que cambian al actualizar. */
export interface Cambios {
  nuevos: string[];
  actualizados: string[];
  /** La persona los cambió: se respaldan antes de reemplazarlos. */
  respaldados: string[];
  /** La versión nueva ya no los usa. */
  retirados: string[];
}

export type ResultadoNovedades =
  | {
      ok: true;
      /** Versión de JavIA publicada en GitHub. */
      version: string;
      /** Versión de la carpeta; null si no tiene JavIA o se instaló antes de que se registrara. */
      instalada: string | null;
      hayNovedades: boolean;
      novedades: Novedad[];
      cambios: Cambios;
      /** Hay un exe más reciente que este. */
      instaladorNuevo: boolean;
    }
  | { ok: false; error: string };

export type ResultadoActualizar =
  | { ok: true; version: string; cambios: Cambios; respaldo: string | null }
  | { ok: false; error: string };

// Lo que el renderer puede pedirle al proceso principal (window.api).
// La carpeta destino la guarda main: el renderer nunca envía rutas.
export interface ApiApp {
  estado(): Promise<Estado>;
  elegirCarpeta(): Promise<Estado>;
  instalar(proveedores: IdProveedor[]): Promise<Resultado>;
  /** Consulta GitHub y lo compara con la carpeta destino. */
  novedades(): Promise<ResultadoNovedades>;
  /** Descarga a la carpeta destino lo que mostró novedades(). */
  actualizar(): Promise<ResultadoActualizar>;
  abrirCarpeta(): Promise<void>;
  abrirDescarga(): Promise<void>;
}
