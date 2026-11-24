import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { type ElectronApplication, expect, type Page, test } from '@playwright/test';
import { abrirApp } from './abrirApp.ts';

// Lo genera generar-paquete.mjs (npm run e2e): es lo mismo que se publica en el release.
const PAQUETE = JSON.parse(readFileSync('release/harness.json', 'utf8'));
const VERSION_NUEVA = '9.9.9';
const PAQUETE_NUEVO = {
  ...PAQUETE,
  version: VERSION_NUEVA,
  instalador: VERSION_NUEVA,
  novedades: [
    { version: VERSION_NUEVA, fecha: '2026-12-01', cambios: [{ que: 'Skill de reportes', paraQue: 'Pedir un reporte en PDF con tus palabras.' }] },
    ...PAQUETE.novedades,
  ],
  archivos: { ...PAQUETE.archivos, 'AGENTS.md': 'especificación nueva', '.agents/skills/reportes/SKILL.md': 'reportes' },
};

// GitHub se sustituye en el proceso principal; null simula que no hay internet.
async function simularGithub(app: ElectronApplication, ventana: Page, paquete: object | null): Promise<void> {
  // La consulta del arranque va al GitHub real: se deja terminar para que no se cruce con la simulada.
  await expect(ventana.getByTestId('estado-github')).not.toHaveText(/Buscando/, { timeout: 40_000 });
  await app.evaluate(({ net }, respuesta) => {
    net.fetch = async () => {
      if (!respuesta) throw new Error('net::ERR_INTERNET_DISCONNECTED');
      return Response.json(respuesta);
    };
  }, paquete);
}

async function elegirCarpeta(app: ElectronApplication, ventana: Page, destino: string): Promise<void> {
  // El diálogo del sistema no se puede manejar desde la prueba: se sustituye por la carpeta temporal.
  await app.evaluate(({ dialog }, carpeta) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [carpeta] });
  }, destino);
  await ventana.getByRole('button', { name: 'Cambiar carpeta' }).click();
}

async function marcarSolo(ventana: Page, nombres: RegExp[]): Promise<void> {
  // Sin depender de lo que se detecte en este equipo.
  for (const casilla of await ventana.getByRole('checkbox').all()) await casilla.uncheck();
  for (const name of nombres) await ventana.getByRole('checkbox', { name }).check();
}

test('instala el harness para los asistentes elegidos y no lo duplica al volver', async () => {
  const destino = mkdtempSync(join(tmpdir(), 'javia-e2e-'));
  const { app, ventana } = await abrirApp();
  await simularGithub(app, ventana, PAQUETE);

  await elegirCarpeta(app, ventana, destino);
  await expect(ventana.getByTestId('destino')).toHaveText(destino);
  await ventana.screenshot({ path: 'docs/capturas/01-seleccion.png' });

  await marcarSolo(ventana, [/Claude Code/, /Gemini CLI/]);
  await ventana.getByRole('button', { name: 'Instalar' }).click();

  await expect(ventana.getByRole('heading', { name: /Listo/ })).toBeVisible();
  await ventana.screenshot({ path: 'docs/capturas/02-listo.png' });
  for (const archivo of ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md', '.claude/skills/nuevo-pendiente/SKILL.md', '.claude/agents/arquitecto.md']) {
    expect(existsSync(join(destino, archivo)), archivo).toBe(true);
  }
  expect(existsSync(join(destino, '.cursor'))).toBe(false);

  // De vuelta en la selección, lo ya instalado aparece marcado y bloqueado.
  await ventana.getByRole('button', { name: 'Agregar otro asistente' }).click();
  await expect(ventana.getByRole('checkbox', { name: /Claude Code/ })).toBeDisabled();
  await expect(ventana.getByRole('checkbox', { name: /Cursor/ })).toBeEnabled();
  await expect(ventana.getByText('Esta carpeta ya tiene JavIA')).toBeVisible();
  await expect(ventana.getByTestId('estado-github')).toHaveText(/Al día/);
  await ventana.screenshot({ path: 'docs/capturas/03-ya-instalado.png' });

  await app.close();
});

test('al abrir lista las novedades con su utilidad y las descarga solo si se acepta', async () => {
  const destino = mkdtempSync(join(tmpdir(), 'javia-e2e-'));
  const { app, ventana } = await abrirApp();
  await simularGithub(app, ventana, PAQUETE);
  await elegirCarpeta(app, ventana, destino);
  await marcarSolo(ventana, [/Claude Code/]);
  await ventana.getByRole('button', { name: 'Instalar' }).click();
  await expect(ventana.getByRole('heading', { name: /Listo/ })).toBeVisible();
  writeFileSync(join(destino, 'AGENTS.md'), 'cambiado por la persona');
  writeFileSync(join(destino, 'memoria/Indice.md'), 'mi memoria');

  // Recargar equivale a volver a abrir la ventana: la carpeta se recuerda y se consulta GitHub.
  await simularGithub(app, ventana, PAQUETE_NUEVO);
  await ventana.reload();
  await expect(ventana.getByRole('heading', { name: 'Hay novedades de JavIA' })).toBeVisible();
  await expect(ventana.getByText('Skill de reportes')).toBeVisible();
  await expect(ventana.getByText('Pedir un reporte en PDF con tus palabras.')).toBeVisible();
  await expect(ventana.getByText(PAQUETE.novedades[0].cambios[0].que)).toBeHidden(); // esa ya la tenía
  await expect(ventana.getByText('1 archivo que cambiaste')).toBeVisible();
  await expect(ventana.getByRole('button', { name: /instalador más reciente/ })).toBeVisible();
  await ventana.screenshot({ path: 'docs/capturas/04-novedades.png' });

  await ventana.getByRole('button', { name: 'Ahora no' }).click();
  await expect(ventana.getByTestId('destino')).toHaveText(destino);
  expect(existsSync(join(destino, '.agents/skills/reportes'))).toBe(false);

  await ventana.reload();
  await ventana.getByRole('button', { name: 'Descargar novedades' }).click();
  await expect(ventana.getByRole('heading', { name: `JavIA quedó en la versión ${VERSION_NUEVA}` })).toBeVisible();
  await ventana.screenshot({ path: 'docs/capturas/05-actualizado.png' });
  expect(readFileSync(join(destino, 'AGENTS.md'), 'utf8')).toBe('especificación nueva');
  expect(readFileSync(join(destino, '.claude/skills/reportes/SKILL.md'), 'utf8')).toBe('reportes');
  expect(readFileSync(join(destino, 'memoria/Indice.md'), 'utf8')).toBe('mi memoria');
  const respaldo = await ventana.getByText(/^\.javia-respaldo/).textContent();
  expect(readFileSync(join(destino, respaldo!, 'AGENTS.md'), 'utf8')).toBe('cambiado por la persona');

  await ventana.getByRole('button', { name: 'Continuar' }).click();
  await expect(ventana.getByTestId('estado-github')).toHaveText(/Al día: versión 9\.9\.9/);

  await app.close();
});

test('sin internet lo dice, no instala nada y deja reintentar', async () => {
  const destino = mkdtempSync(join(tmpdir(), 'javia-e2e-'));
  const { app, ventana } = await abrirApp();
  await simularGithub(app, ventana, null);
  await elegirCarpeta(app, ventana, destino);
  await expect(ventana.getByTestId('estado-github')).toHaveText(/No se pudo consultar GitHub/);
  await ventana.screenshot({ path: 'docs/capturas/06-sin-internet.png' });

  await simularGithub(app, ventana, PAQUETE);
  await ventana.getByRole('button', { name: 'Reintentar' }).click();
  await expect(ventana.getByTestId('estado-github')).toHaveText(/en GitHub/);

  await app.close();
});

test('la carpeta usada se recuerda al volver a abrir el programa', async () => {
  const destino = mkdtempSync(join(tmpdir(), 'javia-e2e-'));
  const datos = mkdtempSync(join(tmpdir(), 'e2e-'));
  const primera = await abrirApp(datos);
  await simularGithub(primera.app, primera.ventana, PAQUETE);
  await elegirCarpeta(primera.app, primera.ventana, destino);
  await marcarSolo(primera.ventana, [/Codex/]);
  await primera.ventana.getByRole('button', { name: 'Instalar' }).click();
  await expect(primera.ventana.getByRole('heading', { name: /Listo/ })).toBeVisible();
  await primera.app.close();

  const segunda = await abrirApp(datos);
  await expect(segunda.ventana.getByText(destino).first()).toBeVisible({ timeout: 40_000 });
  await segunda.app.close();
});
