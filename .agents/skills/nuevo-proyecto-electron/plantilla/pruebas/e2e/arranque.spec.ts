import { expect, test } from '@playwright/test';
import { abrirApp } from './abrirApp.ts';

test('la app abre y muestra su versión', async () => {
  const { app, ventana } = await abrirApp();

  await expect(ventana.getByTestId('version')).toContainText(/Versión \d/);
  await ventana.screenshot({ path: 'docs/capturas/01-arranque.png' });

  await app.close();
});
