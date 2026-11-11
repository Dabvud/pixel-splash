import { readFileSync } from 'node:fs';
import { expect, it, vi } from 'vitest';
import { registerAppUpdate } from '../src/pwa-update';
import type { RegisterSWOptions } from 'vite-plugin-pwa/types';

it('registriert den Update-Client sofort und übernimmt eine neue Version automatisch', () => {
  const update = vi.fn(async () => {});
  const register = vi.fn((_options: RegisterSWOptions) => update);
  const reload = vi.fn();
  registerAppUpdate(register, reload);
  const options = register.mock.calls[0][0];
  expect(options.immediate).toBe(true);
  options.onNeedRefresh!(); options.onNeedRefresh!();
  expect(update).toHaveBeenCalledExactlyOnceWith(true);
  options.onNeedReload!(); options.onNeedReload!();
  expect(reload).toHaveBeenCalledTimes(1);
  expect(readFileSync('src/main.ts', 'utf8')).toContain('virtual:pwa-register');
  expect(readFileSync('tsconfig.json', 'utf8')).toContain('vite-plugin-pwa/client');
});
