import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPlayHud } from '../src/ui/play-hud';

const q = (selector: string) => document.querySelector<HTMLElement>(selector)!;

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe('Spielzug-HUD-Pause', () => {
  it('haelt eine Kurzmeldung fuer 10 s an und nutzt danach die Restzeit von 0,8 s', () => {
    const hud = createPlayHud(document.body);
    hud.flash('DUNK!');
    const flash = q('.phud-flash');
    expect(flash.hidden).toBe(false);
    vi.advanceTimersByTime(100);
    hud.setPaused(true);
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10000);
    expect(flash.hidden).toBe(false);
    hud.setPaused(false);
    vi.advanceTimersByTime(799);
    expect(flash.hidden).toBe(false);
    vi.advanceTimersByTime(1);
    expect(flash.hidden).toBe(true);
    hud.dispose();
  });

  it('bewahrt die Restzeit bei wiederholtem Pausieren und Fortsetzen', () => {
    const hud = createPlayHud(document.body);
    hud.flash('KONTAKT!');
    vi.advanceTimersByTime(300);
    hud.setPaused(true);
    vi.advanceTimersByTime(5000);
    hud.setPaused(true);
    vi.advanceTimersByTime(5000);
    hud.setPaused(false);
    vi.advanceTimersByTime(200);
    hud.setPaused(false);
    hud.setPaused(true);
    vi.advanceTimersByTime(10000);
    hud.setPaused(false);
    vi.advanceTimersByTime(399);
    expect(q('.phud-flash').hidden).toBe(false);
    vi.advanceTimersByTime(1);
    expect(q('.phud-flash').hidden).toBe(true);
    hud.dispose();
  });

  it('ersetzt eine Kurzmeldung waehrend der Pause mit voller Anzeigedauer', () => {
    const hud = createPlayHud(document.body);
    hud.flash('POSTER?');
    vi.advanceTimersByTime(500);
    hud.setPaused(true);
    hud.flash('DUNK!');
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10000);
    expect(q('.phud-flash').textContent).toBe('DUNK!');
    expect(q('.phud-flash').hidden).toBe(false);
    hud.setPaused(false);
    vi.advanceTimersByTime(899);
    expect(q('.phud-flash').hidden).toBe(false);
    vi.advanceTimersByTime(1);
    expect(q('.phud-flash').hidden).toBe(true);
    hud.dispose();
  });

  it('belaesst Sterne und Abschlusswort bei einer langen Pause sichtbar', () => {
    const hud = createPlayHud(document.body);
    hud.setFinishFeedback('PERFEKT');
    hud.setPoster(123, 234, true, .4);
    const stars = [...q('.phud-poster').querySelectorAll<HTMLElement>('span')];
    const transforms = stars.map(star => star.style.transform);
    hud.setPaused(true);
    vi.advanceTimersByTime(10000);
    expect(q('.phud-finish-feedback').hidden).toBe(false);
    expect(q('.phud-finish-feedback').textContent).toBe('PERFEKT');
    expect(q('.phud-poster').hidden).toBe(false);
    expect(stars.map(star => star.style.transform)).toEqual(transforms);
    hud.setPaused(false);
    hud.setFinishFeedback(null);
    hud.setPoster(0, 0, false);
    expect(q('.phud-finish-feedback').hidden).toBe(true);
    expect(q('.phud-poster').hidden).toBe(true);
    hud.dispose();
  });

  it.each([false, true])('dispose beendet alle Timer und entfernt nur HUD-Elemente (pausiert=%s)', paused => {
    const sibling = document.createElement('div');
    document.body.append(sibling);
    const hud = createPlayHud(document.body);
    hud.flash('DUNK!');
    hud.setFinishFeedback('PERFEKT');
    hud.setPoster(123, 234, true);
    expect(vi.getTimerCount()).toBe(1);
    if (paused) hud.setPaused(true);
    hud.dispose();
    hud.dispose();
    expect([...document.body.children]).toEqual([sibling]);
    expect(vi.getTimerCount()).toBe(0);
    hud.setPaused(false);
    hud.flash('KONTAKT!');
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10000);
    expect([...document.body.children]).toEqual([sibling]);
  });
});
