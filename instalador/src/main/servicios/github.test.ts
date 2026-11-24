import assert from 'node:assert/strict';
import { test } from 'node:test';
import { descargarPaquete, esMayor, novedadesDesde, rutaSegura, validarPaquete } from './github.ts';

const novedad = (version: string) => ({ version, fecha: '2026-11-24', cambios: [{ que: 'a', paraQue: 'b' }] });
const VALIDO = { version: '1.1.0', instalador: '1.1.0', novedades: [novedad('1.1.0')], archivos: { 'AGENTS.md': 'x' } };

test('acepta un paquete bien formado y rechaza lo demás', () => {
  assert.equal(validarPaquete(VALIDO), VALIDO);
  for (const malo of [
    null,
    'texto',
    {},
    { ...VALIDO, version: 1 },
    { ...VALIDO, novedades: [{ version: '1.1.0' }] },
    { ...VALIDO, archivos: {} },
    { ...VALIDO, archivos: { 'AGENTS.md': 'x', '../fuera.txt': 'x' } },
    { ...VALIDO, archivos: { 'AGENTS.md': 5 } },
  ]) {
    assert.throws(() => validarPaquete(malo), JSON.stringify(malo));
  }
});

test('una ruta no puede salirse de la carpeta', () => {
  assert.ok(rutaSegura('.agents/roles/qa.md'));
  for (const mala of ['../x', 'a/../../x', '/x', 'C:/x', 'a\\..\\x', 'a//x', './x', '']) assert.ok(!rutaSegura(mala), mala);
});

test('un error de GitHub no se toma como paquete', async () => {
  await assert.rejects(descargarPaquete(async () => new Response('Not Found', { status: 404 })), /404/);
  const paquete = await descargarPaquete(async () => Response.json(VALIDO));
  assert.equal(paquete.version, '1.1.0');
});

test('solo se listan las novedades posteriores a la versión instalada', () => {
  const lista = [novedad('1.10.0'), novedad('1.9.0'), novedad('1.8.0')];
  assert.deepEqual(novedadesDesde(lista, '1.8.0').map((n) => n.version), ['1.10.0', '1.9.0']);
  assert.deepEqual(novedadesDesde(lista, '1.10.0'), []);
  assert.deepEqual(novedadesDesde(lista, null), lista);
});

test('compara versiones por número', () => {
  assert.ok(esMayor('1.10.0', '1.9.0'));
  assert.ok(!esMayor('1.1.0', '1.1.0'));
});
