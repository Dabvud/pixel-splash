import type { RegisterSWOptions } from 'vite-plugin-pwa/types';

/** Der Client lädt nach Übernahme einer neuen Version automatisch genau einmal neu. */
export function registerAppUpdate(register: (options: RegisterSWOptions) => (reloadPage?: boolean) => Promise<void>,
  reload = () => window.location.reload()): void {
  let updating = false, reloading = false;
  const update = register({ immediate: true, onNeedReload() {
    if (reloading) return;
    reloading = true;
    reload();
  }, onNeedRefresh() {
    if (updating) return;
    updating = true;
    void update(true);
  } });
}
