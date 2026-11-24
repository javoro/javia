import { defineConfig } from '@playwright/test';

// Una sola instancia a la vez: cada prueba abre la app de escritorio completa.
export default defineConfig({ testDir: 'pruebas/e2e', workers: 1, reporter: 'list' });
