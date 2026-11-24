// Genera en release/ lo que se publica junto al instalador: harness.json (lo que descarga el exe)
// y notas.md (el texto del release). Esta es la única lista de qué forma parte de JavIA: lo que no
// esté aquí no llega a quien lo instala.
import assert from 'node:assert/strict';
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const INCLUIR = ['AGENTS.md', 'CLAUDE.md', 'LEEME.md', '.gitignore', 'scripts', 'memoria/Indice.md', '.agents'];
// Las skills externas las instala scripts/preparar-entorno.mjs en el equipo destino.
const OMITIR = ['.agents/skills/impeccable'];

const archivos = {};
function agregar(rel) {
  if (OMITIR.includes(rel)) return;
  if (statSync(raiz + rel).isDirectory()) {
    for (const nombre of readdirSync(raiz + rel)) agregar(`${rel}/${nombre}`);
    return;
  }
  const contenido = readFileSync(raiz + rel, 'utf8');
  if (contenido.includes('\0')) throw new Error(`${rel} no es texto: el instalador solo reparte archivos de texto`);
  archivos[rel] = contenido;
}
INCLUIR.forEach(agregar);

const novedades = JSON.parse(readFileSync(raiz + 'novedades.json', 'utf8'));
for (const { version, fecha, cambios } of novedades) {
  assert.match(version, /^\d+\.\d+\.\d+$/, `novedades.json: versión inválida "${version}"`);
  assert.match(fecha, /^\d{4}-\d{2}-\d{2}$/, `novedades.json ${version}: la fecha va como AAAA-MM-DD`);
  assert.ok(cambios.length > 0 && cambios.every((c) => c.que && c.paraQue), `novedades.json ${version}: cada cambio lleva "que" y "paraQue"`);
}
// La versión del harness es la de la novedad más reciente (la primera); la del exe, la de package.json.
const version = novedades[0].version;
const instalador = JSON.parse(readFileSync(new URL('package.json', import.meta.url), 'utf8')).version;
// En GitHub, la etiqueta que disparó la publicación debe ser esa misma versión.
if (process.env.GITHUB_REF_TYPE === 'tag') assert.equal(process.env.GITHUB_REF_NAME, `v${version}`, 'la etiqueta no coincide con novedades.json');

const salida = new URL('release/', import.meta.url);
mkdirSync(salida, { recursive: true });
writeFileSync(new URL('harness.json', salida), JSON.stringify({ version, instalador, novedades, archivos }));
writeFileSync(new URL('notas.md', salida), novedades[0].cambios.map((c) => `- **${c.que}.** ${c.paraQue}\n`).join(''));
console.log(`release/harness.json: JavIA ${version}, ${Object.keys(archivos).length} archivos`);
