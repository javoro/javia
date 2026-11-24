import type { ApiApp } from '../../shared/tipos.ts';

declare global {
  interface Window {
    api: ApiApp;
  }
}
