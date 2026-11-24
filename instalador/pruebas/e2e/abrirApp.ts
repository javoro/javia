import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test';

// Abre la app para una prueba. Con APP_EMPAQUETADA=<ruta al ejecutable de release/*-unpacked>
// prueba la app ya empaquetada; sin ella, la compilada en out/.
export async function abrirApp(carpetaDatos = mkdtempSync(join(tmpdir(), 'e2e-'))): Promise<{ app: ElectronApplication; ventana: Page }> {
  // ELECTRON_RUN_AS_NODE (lo trae la terminal de VS Code) haría que Electron arranque como Node.
  const { ELECTRON_RUN_AS_NODE: _omitida, ...entorno } = process.env;
  // Carpeta de datos temporal: la prueba nunca toca los datos de la app instalada.
  const datos = `--user-data-dir=${carpetaDatos}`;
  const empaquetada = process.env.APP_EMPAQUETADA;

  const app = await electron.launch({
    ...(empaquetada ? { executablePath: empaquetada, args: [datos] } : { args: ['.', datos] }),
    env: entorno as Record<string, string>,
  });
  return { app, ventana: await app.firstWindow() };
}
