import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Cambios, Estado, IdProveedor } from '../../shared/tipos.ts';
import { type Paquete, rutaSegura } from './github.ts';

const PUENTE =
  '# JavIA\n\nLa especificación de este espacio de trabajo es `AGENTS.md`, en la raíz de esta carpeta. Léelo completo y síguelo antes de hacer cualquier cosa.\n';

interface Proveedor {
  id: IdProveedor;
  nombre: string;
  detalle: string;
  /** Carpetas, relativas a la carpeta del usuario, que delatan que la herramienta está instalada. */
  carpetasEquipo: string[];
  /** Ruta en el destino que indica que lo de este asistente ya está instalado. */
  marca: string;
  /** Archivos puente propios del asistente, además del harness común. */
  archivos: Record<string, string>;
}

export const PROVEEDORES: Proveedor[] = [
  {
    id: 'claude',
    nombre: 'Claude Code',
    detalle: 'Anthropic · CLAUDE.md y carpeta .claude',
    carpetasEquipo: ['.claude'],
    marca: '.claude/skills/nuevo-pendiente',
    archivos: {}, // CLAUDE.md viene del harness; .claude se enlaza en enlazarClaude
  },
  {
    id: 'codex',
    nombre: 'Codex',
    detalle: 'OpenAI · solo necesita AGENTS.md',
    carpetasEquipo: ['.codex'],
    marca: 'AGENTS.md',
    archivos: {},
  },
  {
    id: 'gemini',
    nombre: 'Gemini CLI',
    detalle: 'Google · agrega GEMINI.md',
    carpetasEquipo: ['.gemini'],
    marca: 'GEMINI.md',
    archivos: { 'GEMINI.md': `@./AGENTS.md\n\n${PUENTE}` },
  },
  {
    id: 'cursor',
    nombre: 'Cursor',
    detalle: 'Anysphere · regla en .cursor/rules',
    carpetasEquipo: ['.cursor'],
    marca: '.cursor/rules/javia.mdc',
    archivos: { '.cursor/rules/javia.mdc': `---\ndescription: Especificación de JavIA\nalwaysApply: true\n---\n\n${PUENTE}` },
  },
  {
    id: 'copilot',
    nombre: 'GitHub Copilot',
    detalle: 'GitHub · copilot-instructions.md',
    carpetasEquipo: ['.copilot', '.config/github-copilot', 'AppData/Local/github-copilot'],
    marca: '.github/copilot-instructions.md',
    archivos: { '.github/copilot-instructions.md': PUENTE },
  },
  {
    id: 'otro',
    nombre: 'Otro asistente',
    detalle: 'Cualquiera que lea AGENTS.md',
    carpetasEquipo: [],
    marca: 'AGENTS.md',
    archivos: {},
  },
];

// Archivos del harness que solo se instalan para un asistente.
const EXCLUSIVOS: Record<string, IdProveedor> = { 'CLAUDE.md': 'claude' };

const CARPETAS_DE_PROVEEDOR = ['.agents', '.claude', '.codex', '.gemini', '.cursor'];

/**
 * Carpeta donde se instala a partir de la que eligió la persona. Si está vacía o ya es un proyecto
 * (tiene JavIA o carpetas de algún asistente) se usa tal cual, para completar sin duplicar; si es
 * una carpeta con otras cosas (Documentos, Escritorio) se crea "JavIA" adentro.
 * La carpeta del usuario nunca cuenta como proyecto: sus .claude/.codex son la configuración global.
 */
export function resolverDestino(elegida: string, home: string): string {
  const contenido = existsSync(elegida) ? readdirSync(elegida) : [];
  const esProyecto = contenido.includes('AGENTS.md') || CARPETAS_DE_PROVEEDOR.some((c) => contenido.includes(c));
  const esHome = existsSync(elegida) && realpathSync.native(elegida) === realpathSync.native(home);
  return !esHome && (contenido.length === 0 || esProyecto) ? elegida : join(elegida, 'JavIA');
}

/** Lo que JavIA dejó en la carpeta: así se distingue lo que cambió la persona de lo que cambió JavIA. */
interface Registro {
  version: string;
  huellas: Record<string, string>;
}

const REGISTRO = '.javia.json';

function leerRegistro(destino: string): Registro | null {
  try {
    const dato = JSON.parse(readFileSync(join(destino, REGISTRO), 'utf8'));
    return typeof dato?.version === 'string' && dato.huellas && typeof dato.huellas === 'object' ? dato : null;
  } catch {
    return null; // no existe o está dañado: se trata como una instalación anterior al registro
  }
}

function guardarRegistro(destino: string, version: string, paquete: Paquete, previo: Registro | null): void {
  const huellas = { ...previo?.huellas };
  for (const [rel, contenido] of Object.entries(paquete.archivos)) {
    if (huellaDe(join(destino, rel)) === huella(contenido)) huellas[rel] = huella(contenido);
  }
  writeFileSync(join(destino, REGISTRO), JSON.stringify({ version, huellas }, null, 2));
}

const huella = (contenido: string | Buffer): string => createHash('sha256').update(contenido).digest('hex');
const huellaDe = (ruta: string): string | null => (existsSync(ruta) ? huella(readFileSync(ruta)) : null);

const estaInstalado = (destino: string, id: IdProveedor): boolean =>
  existsSync(join(destino, PROVEEDORES.find((p) => p.id === id)!.marca));

/** La carpeta tiene JavIA; un AGENTS.md suelto puede ser de otro proyecto. */
export const tieneHarness = (destino: string): boolean => existsSync(join(destino, '.agents/skills/nuevo-pendiente/SKILL.md'));

export const versionInstalada = (destino: string): string | null => leerRegistro(destino)?.version ?? null;

export function leerEstado(destino: string, home: string): Estado {
  return {
    destino,
    yaTieneJavia: existsSync(join(destino, 'AGENTS.md')),
    proveedores: PROVEEDORES.map(({ id, nombre, detalle, carpetasEquipo }) => ({
      id,
      nombre,
      detalle,
      enEquipo: carpetasEquipo.some((c) => existsSync(join(home, c))),
      enDestino: estaInstalado(destino, id),
    })),
  };
}

export interface Informe {
  creados: number;
  iguales: number;
  distintos: string[];
}

/** Instala el harness para los asistentes indicados. Nunca sobrescribe: lo que ya existe se conserva. */
export function instalar(destino: string, ids: IdProveedor[], paquete: Paquete): Informe {
  const informe: Informe = { creados: 0, iguales: 0, distintos: [] };
  const registro = leerRegistro(destino);
  const anteriorAlRegistro = !registro && tieneHarness(destino);

  const escribir = (rel: string, contenido: string): void => {
    const ruta = join(destino, rel);
    mkdirSync(dirname(ruta), { recursive: true });
    try {
      writeFileSync(ruta, contenido, { flag: 'wx' }); // wx: falla si ya existe
      informe.creados++;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      if (readFileSync(ruta, 'utf8') === contenido) informe.iguales++;
      else informe.distintos.push(rel);
    }
  };

  for (const [rel, contenido] of Object.entries(paquete.archivos)) {
    const exclusivoDe = EXCLUSIVOS[rel];
    if (!exclusivoDe || ids.includes(exclusivoDe)) escribir(rel, contenido);
  }
  for (const proveedor of PROVEEDORES) {
    if (!ids.includes(proveedor.id)) continue;
    for (const [rel, contenido] of Object.entries(proveedor.archivos)) escribir(rel, contenido);
  }
  if (ids.includes('claude')) enlazarClaude(destino);
  // Sin registro, lo que quedó distinto se daría por ajeno y ya no se actualizaría: lo crea actualizar().
  if (!anteriorAlRegistro) guardarRegistro(destino, registro?.version ?? paquete.version, paquete, registro);

  return informe;
}

/** Qué cambiaría al actualizar. La memoria de la persona y los archivos que no puso JavIA no cuentan. */
export function revisarCambios(destino: string, paquete: Paquete): Cambios {
  const cambios: Cambios = { nuevos: [], actualizados: [], respaldados: [], retirados: [] };
  const registro = leerRegistro(destino);

  for (const [rel, contenido] of Object.entries(paquete.archivos)) {
    const exclusivoDe = EXCLUSIVOS[rel];
    if (exclusivoDe && !estaInstalado(destino, exclusivoDe)) continue;
    const local = huellaDe(join(destino, rel));
    const anterior = registro?.huellas[rel];
    const nueva = huella(contenido);
    // Ya está al día, o la versión nueva no lo cambió (si es distinto, lo cambió la persona).
    if (local === nueva || anterior === nueva) continue;
    if (local === null) cambios.nuevos.push(rel);
    else if (rel.startsWith('memoria/') || (registro && !anterior)) continue;
    else if (local === anterior) cambios.actualizados.push(rel);
    else cambios.respaldados.push(rel);
  }
  for (const [rel, anterior] of Object.entries(registro?.huellas ?? {})) {
    if (rel in paquete.archivos || rel.startsWith('memoria/') || !rutaSegura(rel)) continue;
    if (huellaDe(join(destino, rel)) === anterior) cambios.retirados.push(rel);
  }
  return cambios;
}

/** Lleva la carpeta a la versión del paquete. Lo que la persona cambió se respalda antes de reemplazarlo. */
export function actualizar(destino: string, paquete: Paquete): { cambios: Cambios; respaldo: string | null } {
  const registro = leerRegistro(destino);
  const cambios = revisarCambios(destino, paquete);
  const conClaude = estaInstalado(destino, 'claude');

  const respaldo = `.javia-respaldo/${new Date().toLocaleString('sv').replace(' ', '_').replaceAll(':', '-')}`;
  for (const rel of cambios.respaldados) cpSync(join(destino, rel), join(destino, respaldo, rel));

  // El archivo y, si .claude es una copia (no se pudo enlazar) que la persona no cambió, también esa copia.
  const rutasDe = (rel: string): string[] => {
    const ruta = join(destino, rel);
    const copia = copiaEnClaude(destino, rel);
    const esCopiaIntacta =
      copia && existsSync(copia) && existsSync(ruta) && realpathSync.native(copia) !== realpathSync.native(ruta) && huellaDe(copia) === registro?.huellas[rel];
    return esCopiaIntacta ? [ruta, copia] : [ruta];
  };

  for (const rel of [...cambios.nuevos, ...cambios.actualizados, ...cambios.respaldados]) {
    for (const ruta of rutasDe(rel)) {
      mkdirSync(dirname(ruta), { recursive: true });
      writeFileSync(ruta, paquete.archivos[rel]!);
    }
  }
  for (const rel of cambios.retirados) {
    for (const ruta of rutasDe(rel)) retirar(ruta, destino);
    if (!rel.startsWith('.agents/skills/')) continue;
    const enlace = join(destino, '.claude/skills', rel.split('/')[2]!);
    if (!existsSync(enlace)) rmSync(enlace, { recursive: true, force: true }); // el enlace de una skill retirada queda roto
  }
  if (conClaude) enlazarClaude(destino);
  guardarRegistro(destino, paquete.version, paquete, registro);

  return { cambios, respaldo: cambios.respaldados.length > 0 ? respaldo : null };
}

// Borra el archivo y las carpetas que queden vacías.
function retirar(ruta: string, destino: string): void {
  rmSync(ruta, { force: true });
  for (let carpeta = dirname(ruta); carpeta !== destino; carpeta = dirname(carpeta)) {
    try {
      rmdirSync(carpeta);
    } catch {
      return; // no está vacía
    }
  }
}

function copiaEnClaude(destino: string, rel: string): string | null {
  for (const [enlace, origen] of [['agents', 'roles'], ['rules', 'reglas'], ['skills', 'skills']]) {
    if (rel.startsWith(`.agents/${origen}/`)) return join(destino, rel.replace(`.agents/${origen}`, `.claude/${enlace}`));
  }
  return null;
}

// Claude Code busca roles, reglas y skills en .claude/; se enlazan a .agents/ (la fuente de verdad).
function enlazarClaude(destino: string): void {
  const enlazar = (enlace: string, objetivo: string): void => {
    const ruta = join(destino, '.claude', enlace);
    const origen = join(destino, '.agents', objetivo);
    if (existsSync(ruta)) {
      // Ya es nuestro enlace, o es una carpeta propia de la persona: se completa sin pisar nada.
      if (realpathSync.native(ruta) !== realpathSync.native(origen)) cpSync(origen, ruta, { recursive: true, force: false });
      return;
    }
    rmSync(ruta, { recursive: true, force: true }); // enlace roto: la carpeta se movió de lugar
    mkdirSync(dirname(ruta), { recursive: true });
    try {
      symlinkSync(origen, ruta, 'junction'); // junction: en Windows no pide permisos de administrador
    } catch {
      cpSync(origen, ruta, { recursive: true });
    }
  };

  enlazar('agents', 'roles');
  enlazar('rules', 'reglas');
  for (const skill of readdirSync(join(destino, '.agents/skills'))) enlazar(`skills/${skill}`, `skills/${skill}`);
}
