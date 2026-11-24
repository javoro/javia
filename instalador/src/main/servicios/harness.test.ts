import assert from 'node:assert/strict';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import type { Paquete } from './github.ts';
import { actualizar, instalar, leerEstado, resolverDestino, revisarCambios, versionInstalada } from './harness.ts';

const paquete = (version: string, archivos: Record<string, string>): Paquete => ({ version, instalador: version, novedades: [], archivos });

const HARNESS = paquete('1.0.0', {
  'AGENTS.md': 'especificación',
  'CLAUDE.md': '@AGENTS.md',
  '.agents/roles/qa.md': 'rol qa',
  '.agents/reglas/electron.md': 'regla',
  '.agents/skills/nuevo-pendiente/SKILL.md': 'skill',
});
const temporal = (): string => mkdtempSync(join(tmpdir(), 'javia-'));

test('instala lo común, lo del asistente y enlaza .claude', () => {
  const destino = temporal();
  const informe = instalar(destino, ['claude', 'gemini'], HARNESS);

  assert.equal(informe.creados, 6); // 5 del harness + GEMINI.md
  assert.equal(readFileSync(join(destino, '.claude/skills/nuevo-pendiente/SKILL.md'), 'utf8'), 'skill');
  assert.equal(readFileSync(join(destino, '.claude/agents/qa.md'), 'utf8'), 'rol qa');
  assert.ok(existsSync(join(destino, '.claude/rules/electron.md')));
  assert.ok(existsSync(join(destino, 'GEMINI.md')));
  assert.ok(!existsSync(join(destino, '.cursor')));
});

test('sin Claude no se instala CLAUDE.md ni .claude', () => {
  const destino = temporal();
  instalar(destino, ['codex'], HARNESS);

  assert.ok(existsSync(join(destino, 'AGENTS.md')));
  assert.ok(!existsSync(join(destino, 'CLAUDE.md')));
  assert.ok(!existsSync(join(destino, '.claude')));
});

test('volver a instalar no duplica ni pisa lo que la persona cambió', () => {
  const destino = temporal();
  instalar(destino, ['claude'], HARNESS);
  writeFileSync(join(destino, 'AGENTS.md'), 'editado por la persona');

  const informe = instalar(destino, ['claude', 'cursor'], HARNESS);

  assert.equal(informe.creados, 1); // solo la regla de Cursor
  assert.equal(informe.iguales, 4);
  assert.deepEqual(informe.distintos, ['AGENTS.md']);
  assert.equal(readFileSync(join(destino, 'AGENTS.md'), 'utf8'), 'editado por la persona');
});

test('una carpeta .claude propia se completa sin perder lo que tenía', () => {
  const destino = temporal();
  mkdirSync(join(destino, '.claude/agents'), { recursive: true });
  writeFileSync(join(destino, '.claude/agents/mio.md'), 'mi agente');
  writeFileSync(join(destino, '.claude/agents/qa.md'), 'mi qa');

  instalar(destino, ['claude'], HARNESS);

  assert.equal(readFileSync(join(destino, '.claude/agents/mio.md'), 'utf8'), 'mi agente');
  assert.equal(readFileSync(join(destino, '.claude/agents/qa.md'), 'utf8'), 'mi qa');
  assert.equal(readFileSync(join(destino, '.agents/roles/qa.md'), 'utf8'), 'rol qa');
});

test('el estado detecta asistentes en el equipo y lo ya instalado en el destino', () => {
  const home = temporal();
  const destino = temporal();
  mkdirSync(join(home, '.gemini'));
  instalar(destino, ['claude'], HARNESS);

  const estado = leerEstado(destino, home);
  const de = (id: string) => estado.proveedores.find((p) => p.id === id)!;

  assert.equal(estado.yaTieneJavia, true);
  assert.deepEqual([de('claude').enDestino, de('claude').enEquipo], [true, false]);
  assert.deepEqual([de('gemini').enDestino, de('gemini').enEquipo], [false, true]);
});

test('el destino: tal cual si está vacía o ya es un proyecto, subcarpeta JavIA si tiene otras cosas', () => {
  const home = temporal();
  const vacia = temporal();
  const proyecto = temporal();
  const documentos = temporal();
  mkdirSync(join(proyecto, '.codex'));
  writeFileSync(join(documentos, 'tesis.docx'), '');
  mkdirSync(join(home, '.claude'));

  assert.equal(resolverDestino(vacia, home), vacia);
  assert.equal(resolverDestino(proyecto, home), proyecto);
  assert.equal(resolverDestino(documentos, home), join(documentos, 'JavIA'));
  assert.equal(resolverDestino(home, home), join(home, 'JavIA')); // .claude del usuario es la config global
});

const leer = (destino: string, rel: string): string => readFileSync(join(destino, rel), 'utf8');
const V1 = paquete('1.0.0', { ...HARNESS.archivos, 'memoria/Indice.md': 'plantilla', '.agents/skills/vieja/SKILL.md': 'vieja', '.agents/roles/tecla.md': 'v1' });
const V2 = paquete('2.0.0', {
  ...HARNESS.archivos,
  'AGENTS.md': 'especificación 2',
  'memoria/Indice.md': 'plantilla 2',
  '.agents/roles/qa.md': 'rol qa 2',
  '.agents/roles/tecla.md': 'v1',
  '.agents/skills/nueva/SKILL.md': 'nueva',
});

test('actualiza, respalda lo que cambió la persona, retira lo obsoleto y respeta la memoria', () => {
  const destino = temporal();
  instalar(destino, ['claude'], V1);
  writeFileSync(join(destino, 'AGENTS.md'), 'mi versión');
  writeFileSync(join(destino, '.agents/roles/tecla.md'), 'mío'); // la versión nueva no lo cambia: se queda
  writeFileSync(join(destino, 'memoria/Indice.md'), 'mi memoria');

  assert.deepEqual(revisarCambios(destino, V2), {
    nuevos: ['.agents/skills/nueva/SKILL.md'],
    actualizados: ['.agents/roles/qa.md'],
    respaldados: ['AGENTS.md'],
    retirados: ['.agents/skills/vieja/SKILL.md'],
  });

  const { respaldo } = actualizar(destino, V2);

  assert.equal(leer(destino, 'AGENTS.md'), 'especificación 2');
  assert.equal(leer(destino, `${respaldo}/AGENTS.md`), 'mi versión');
  assert.equal(leer(destino, 'memoria/Indice.md'), 'mi memoria');
  assert.equal(leer(destino, '.agents/roles/tecla.md'), 'mío');
  assert.equal(leer(destino, '.claude/agents/qa.md'), 'rol qa 2');
  assert.equal(leer(destino, '.claude/skills/nueva/SKILL.md'), 'nueva');
  assert.ok(!existsSync(join(destino, '.agents/skills/vieja')));
  assert.equal(lstatSync(join(destino, '.claude/skills/vieja'), { throwIfNoEntry: false }), undefined);
  assert.equal(versionInstalada(destino), '2.0.0');
  assert.deepEqual(revisarCambios(destino, V2), { nuevos: [], actualizados: [], respaldados: [], retirados: [] });
});

test('retirar el último archivo de una carpeta enlazada no rompe lo demás', () => {
  const destino = temporal();
  instalar(destino, ['claude'], V1);
  const { '.agents/roles/tecla.md': _retirado, ...resto } = V1.archivos;
  actualizar(destino, paquete('1.1.0', resto));

  assert.ok(!existsSync(join(destino, '.claude/agents/tecla.md')));
  assert.equal(leer(destino, '.claude/agents/qa.md'), 'rol qa');
});

test('si .claude es una copia, se actualiza salvo lo que la persona cambió ahí', () => {
  const destino = temporal();
  mkdirSync(join(destino, '.claude/agents'), { recursive: true });
  writeFileSync(join(destino, '.claude/agents/tecla.md'), 'mi tecla');
  instalar(destino, ['claude'], V1);
  actualizar(destino, paquete('2.0.0', { ...V2.archivos, '.agents/roles/tecla.md': 'v2' }));

  assert.equal(leer(destino, '.claude/agents/qa.md'), 'rol qa 2');
  assert.equal(leer(destino, '.claude/agents/tecla.md'), 'mi tecla');
  assert.equal(leer(destino, '.agents/roles/tecla.md'), 'v2');
});

test('un AGENTS.md ajeno nunca se reemplaza y CLAUDE.md no llega a quien no usa Claude', () => {
  const destino = temporal();
  writeFileSync(join(destino, 'AGENTS.md'), 'de otro proyecto');
  instalar(destino, ['codex'], V1);
  actualizar(destino, V2);

  assert.equal(leer(destino, 'AGENTS.md'), 'de otro proyecto');
  assert.ok(!existsSync(join(destino, 'CLAUDE.md')));
});

test('una instalación anterior al registro se actualiza con respaldo, aunque antes se agregue un asistente', () => {
  const destino = temporal();
  instalar(destino, ['claude'], V1);
  rmSync(join(destino, '.javia.json'));
  instalar(destino, ['claude', 'gemini'], V2);
  assert.equal(versionInstalada(destino), null);

  const { cambios, respaldo } = actualizar(destino, V2);
  assert.deepEqual(cambios.respaldados, ['AGENTS.md', '.agents/roles/qa.md']);
  assert.equal(leer(destino, `${respaldo}/.agents/roles/qa.md`), 'rol qa');
  assert.equal(versionInstalada(destino), '2.0.0');
});

test('agregar un asistente sin actualizar conserva la versión instalada', () => {
  const destino = temporal();
  instalar(destino, ['codex'], V1);
  instalar(destino, ['gemini'], V2);

  assert.equal(versionInstalada(destino), '1.0.0');
  assert.deepEqual(revisarCambios(destino, V2).actualizados, ['AGENTS.md', '.agents/roles/qa.md']);
});

test('un registro alterado no puede retirar archivos fuera de la carpeta', () => {
  const raiz = temporal();
  const destino = join(raiz, 'JavIA');
  instalar(destino, ['codex'], V1);
  writeFileSync(join(raiz, 'ajeno.txt'), 'x');
  const registro = JSON.parse(leer(destino, '.javia.json'));
  registro.huellas['../ajeno.txt'] = '2d711642b726b04401627ca9fbac32f5c8530fb1903cc4db02258717921a4881'; // sha256 de "x"
  writeFileSync(join(destino, '.javia.json'), JSON.stringify(registro));
  actualizar(destino, V2);

  assert.ok(existsSync(join(raiz, 'ajeno.txt')));
});

test('una nota de memoria borrada no reaparece al agregar un asistente ni al actualizar', () => {
  const destino = temporal();
  const conNota = paquete('1.0.0', { ...V1.archivos, 'memoria/nota.md': 'hola' });
  instalar(destino, ['codex'], conNota);
  rmSync(join(destino, 'memoria/nota.md'));
  instalar(destino, ['gemini'], conNota);
  actualizar(destino, paquete('2.0.0', { ...V2.archivos, 'memoria/nota.md': 'hola' }));

  assert.ok(!existsSync(join(destino, 'memoria/nota.md')));
});
