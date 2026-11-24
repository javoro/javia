import type { Novedad } from '../../shared/tipos.ts';

// De dónde sale JavIA: el release más reciente del repositorio público, sin token ni API.
export const URL_RELEASE = 'https://github.com/javoro/javia/releases/latest';
const URL_PAQUETE = `${URL_RELEASE}/download/harness.json`;
const ESPERA_MS = 30_000;

/** Lo que genera generar-paquete.mjs y se publica en cada release. */
export interface Paquete {
  version: string;
  /** Versión del exe publicado en el mismo release. */
  instalador: string;
  /** De la más reciente a la más antigua. */
  novedades: Novedad[];
  archivos: Record<string, string>;
}

export async function descargarPaquete(pedir: (url: string, opciones: RequestInit) => Promise<Response>): Promise<Paquete> {
  const respuesta = await pedir(URL_PAQUETE, { cache: 'no-store', signal: AbortSignal.timeout(ESPERA_MS) });
  if (!respuesta.ok) throw new Error(`GitHub respondió ${respuesta.status}`);
  return validarPaquete(await respuesta.json());
}

/** Ruta relativa que no puede salirse de la carpeta destino ni es una ruta especial de Windows. */
export function rutaSegura(rel: string): boolean {
  return !/[\\:\0]/.test(rel) && rel.split('/').every((parte) => parte !== '' && parte !== '.' && parte !== '..');
}

const esTexto = (valor: unknown): valor is string => typeof valor === 'string';

export function validarPaquete(dato: unknown): Paquete {
  const p = dato as Paquete | null;
  const valido =
    esTexto(p?.version) &&
    esTexto(p.instalador) &&
    Array.isArray(p.novedades) &&
    p.novedades.every(
      (n) => esTexto(n?.version) && esTexto(n.fecha) && Array.isArray(n.cambios) && n.cambios.every((c) => esTexto(c?.que) && esTexto(c.paraQue)),
    ) &&
    typeof p.archivos === 'object' &&
    p.archivos !== null &&
    'AGENTS.md' in p.archivos &&
    Object.entries(p.archivos).every(([rel, contenido]) => rutaSegura(rel) && esTexto(contenido));
  if (!valido) throw new Error('harness.json no tiene el formato esperado');
  return p;
}

/** Las novedades publicadas después de la versión instalada; todas si no se sabe cuál es. */
export function novedadesDesde(novedades: Novedad[], instalada: string | null): Novedad[] {
  const indice = novedades.findIndex((n) => n.version === instalada);
  return indice === -1 ? novedades : novedades.slice(0, indice);
}

export function esMayor(a: string, b: string): boolean {
  return a.localeCompare(b, undefined, { numeric: true }) > 0;
}
