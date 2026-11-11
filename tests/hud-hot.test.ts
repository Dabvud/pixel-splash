import { describe, expect, it } from 'vitest';
import { createHud } from '../src/ui/hud';

describe('Heiß-Abzeichen im HUD', () => {
  it('erzeugt das Abzeichen erst bei Bedarf, zeigt es und versteckt es wieder', () => {
    const root = document.createElement('div'), hud = createHud(root);
    expect(root.querySelector('.hud-hot')).toBeNull();
    hud.setHot(true);
    const badge = root.querySelector<HTMLElement>('.hud-hot')!;
    expect(badge.textContent).toBe('🔥 HEISS');
    expect(badge.hidden).toBe(false);
    hud.setHot(false);
    expect(badge.hidden).toBe(true);
    hud.setHot(true);
    expect(root.querySelectorAll('.hud-hot')).toHaveLength(1);
    expect(badge.hidden).toBe(false);
    hud.dispose();
    expect(root.querySelector('.hud-hot')).toBeNull();
  });

  it('schreibt unveränderte Heiß-Werte nicht erneut ins DOM', () => {
    const root = document.createElement('div'), hud = createHud(root);
    hud.setHot(true);
    const observer = new MutationObserver(() => {});
    observer.observe(root, { attributes: true, childList: true, subtree: true });
    hud.setHot(true);
    expect(observer.takeRecords()).toEqual([]);
    observer.disconnect();
    hud.dispose();
  });
});
