#!/usr/bin/env node
// Prepara el harness en este equipo: verifica las herramientas del stack, instala las skills
// externas y enlaza roles/reglas/skills para Claude Code. Se puede correr las veces que haga
// falta: no repite lo que ya está hecho.
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, symlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const faltas = [];
const avisos = [];
const ok = (texto) => console.log(`  ok     ${texto}`);

function salida(comando) {
  try {
    return execSync(comando, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return null;
  }
}

// 1. Herramientas del stack
console.log('Herramientas');
const [mayor, menor] = process.versions.node.split('.').map(Number);
if (mayor > 22 || (mayor === 22 && menor >= 18)) ok(`Node.js ${process.versions.node}`);
else faltas.push(`Node.js ${process.versions.node}: se necesita 22.18 o superior`);

for (const [nombre, comando] of [['npm', 'npm --version'], ['Git', 'git --version']]) {
  const version = salida(comando);
  if (version) ok(`${nombre} ${version.replace('git version ', '')}`);
  else faltas.push(`${nombre} no está instalado`);
}
if (!salida('gh --version')) {
  avisos.push('GitHub CLI (gh) no está instalado: solo hace falta para publicar actualizaciones automáticas.');
}
if (process.env.ELECTRON_RUN_AS_NODE) {
  avisos.push('ELECTRON_RUN_AS_NODE está definida en esta terminal: quítala antes de "npm run dev" o la app no abrirá.');
}

// 2. Skills externas. "--agent codex" las deja en .agents/skills, la carpeta común a todos los agentes.
console.log('Skills externas');
const SKILLS_EXTERNAS = { impeccable: 'pbakaus/impeccable' };
for (const [nombre, repo] of Object.entries(SKILLS_EXTERNAS)) {
  if (existsSync(join(raiz, '.agents/skills', nombre))) {
    ok(nombre);
    continue;
  }
  try {
    execSync(`npx -y skills@latest add ${repo} --skill ${nombre} --agent codex --yes`, { cwd: raiz, stdio: 'ignore' });
    ok(`${nombre} (instalada)`);
  } catch {
    avisos.push(`No se pudo instalar la skill "${nombre}" (¿sin internet?). Vuelve a correr este script.`);
  }
}

// 3. Enlaces para Claude Code. La fuente de verdad es .agents/; .claude/ solo apunta ahí.
console.log('Enlaces para Claude Code');
function enlazar(destino, origen) {
  if (existsSync(destino)) return;
  rmSync(destino, { recursive: true, force: true }); // enlace roto: la carpeta del harness se movió
  mkdirSync(dirname(destino), { recursive: true });
  try {
    symlinkSync(origen, destino, 'junction'); // junction: en Windows no pide permisos de administrador
  } catch {
    cpSync(origen, destino, { recursive: true });
    avisos.push(`No se pudo enlazar ${destino}; se copió. Si editas ${origen}, borra la copia y corre este script.`);
  }
}
enlazar(join(raiz, '.claude/agents'), join(raiz, '.agents/roles'));
enlazar(join(raiz, '.claude/rules'), join(raiz, '.agents/reglas'));
for (const skill of readdirSync(join(raiz, '.agents/skills'))) {
  enlazar(join(raiz, '.claude/skills', skill), join(raiz, '.agents/skills', skill));
}
ok('.claude/agents, .claude/rules y .claude/skills');

// Resultado
console.log('');
for (const aviso of avisos) console.log(`  aviso  ${aviso}`);
if (faltas.length > 0) {
  for (const falta of faltas) console.log(`  FALTA  ${falta}`);
  console.log('\nEntorno incompleto: sigue .agents/skills/preparar-entorno/SKILL.md y vuelve a correr este script.');
  process.exit(1);
}
console.log('\nEntorno listo.');
