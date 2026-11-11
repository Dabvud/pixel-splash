import { describe, expect, it } from 'vitest';
import { createPlayHud } from '../src/ui/play-hud';

describe('Foul-Einblendung', () => {
  it('zeigt FOUL! und kein AND-ONE bei normalem Foul', () => {
    document.body.innerHTML = '';
    const hud = createPlayHud(document.body);
    hud.foulCall(false);
    const foul = document.querySelector<HTMLElement>('.phud-foul')!, andOne = document.querySelector<HTMLElement>('.phud-andone')!;
    expect(foul.hidden).toBe(false);
    expect(foul.textContent).toBe('FOUL!');
    expect(foul.classList.contains('run')).toBe(true);
    expect(andOne.hidden).toBe(true);
  });

  it('ersetzt beim And-one das FOUL durch AND-ONE!', () => {
    document.body.innerHTML = '';
    const hud = createPlayHud(document.body);
    hud.foulCall(true);
    const andOne = document.querySelector<HTMLElement>('.phud-andone')!;
    expect(andOne.hidden).toBe(false);
    expect(andOne.textContent).toBe('AND-ONE!');
    expect(document.querySelector('.phud-foul')!.classList.contains('struck')).toBe(true);
  });

  it('hält die Animationen in der Pause an', () => {
    document.body.innerHTML = '';
    const hud = createPlayHud(document.body);
    hud.setPaused(true);
    expect(document.querySelector('.phud')!.classList.contains('paused')).toBe(true);
    hud.setPaused(false);
    expect(document.querySelector('.phud')!.classList.contains('paused')).toBe(false);
  });
});
