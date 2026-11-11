import { describe, expect, it } from 'vitest';
import { arrowEndFill, meterDisplayFill, FINISH_RETURN, command, createPlayState, step, type EngineConfig } from '../src/play/engine';
import { PLAYS } from '../src/play/plays';
import { createHud } from '../src/ui/hud';

describe('Abschluss-Meter mit Spitze oben', () => {
  it('läuft beim Abschluss bis zur Spitze und 35 % zurück, beim Catch-and-Shoot wie bisher bis 1,6', () => {
    expect(FINISH_RETURN).toBeCloseTo(0.35, 10);
    expect(arrowEndFill('finish')).toBeCloseTo(1.35, 10);
    expect(arrowEndFill('alleyoop')).toBeCloseTo(1.35, 10);
    expect(arrowEndFill('catchshoot')).toBeCloseTo(1.6, 10);
  });

  it('zeigt den Füllstand gespiegelt: hoch bis zur Spitze, danach wieder herunter', () => {
    expect(meterDisplayFill('finish', 0.5)).toBeCloseTo(0.5, 10);
    expect(meterDisplayFill('finish', 1)).toBeCloseTo(1, 10);
    expect(meterDisplayFill('finish', 1.2)).toBeCloseTo(0.8, 10);
    expect(meterDisplayFill('alleyoop', 1.35)).toBeCloseTo(0.65, 10);
    expect(meterDisplayFill('catchshoot', 1.2)).toBeCloseTo(1.2, 10);
  });

  it('beendet das Abschluss-Meter ohne Eingabe nach 1,35 Anzeigedauern als Fehlversuch', () => {
    const cfg: EngineConfig = {
      finishArrow: true, slowmo: 0.3, decisionS: 2, animSpeed: 1, foulMult: 0, zoneFloor: 0.7, tempoSpread: 0,
      shot: { meterMs: 700, greenZone: 0.07, aimDeg: 6, influence: 0.6 },
      finish: { meterMs: 450, greenZone: 0.1, aimDeg: 8 },
    };
    const rng = () => 0.5;
    const s = createPlayState(PLAYS.fastbreak, cfg, rng);
    for (let i = 0; i < 4000 && s.phase !== 'decision'; i++) step(s, 1 / 240, cfg, rng);
    command(s, { kind: 'drive', lane: 0 }, cfg, rng);
    for (let i = 0; i < 4000 && !s.arrowMeter; i++) step(s, 1 / 240, cfg, rng);
    const m = s.arrowMeter!;
    for (let t = 0; t < (m.meterMs * 1.3) / 1000; t += 1 / 240) step(s, 1 / 240, cfg, rng);
    expect(m.fill).toBeNull();
    for (let t = 0; t < (m.meterMs * 0.1) / 1000; t += 1 / 240) step(s, 1 / 240, cfg, rng);
    expect(m.fill).toBeCloseTo(1.35, 5);
    expect(m.feedback).toBe('ZU LANGSAM');
  });
});

describe('HUD: grüne Zone an der Spitze', () => {
  it('ragt nicht über den Balken hinaus, wenn die Spitze oben ist', () => {
    document.body.innerHTML = '';
    const hud = createHud(document.body);
    hud.setMeter(1, { g: 0.1, a: 8 }, 1, true);
    const green = document.querySelector<HTMLElement>('.hud-green')!;
    expect(parseFloat(green.style.bottom)).toBeCloseTo(90, 5);
    expect(parseFloat(green.style.height)).toBeCloseTo(10, 5);
  });
});

describe('HUD: Markierung an angezeigter Stelle', () => {
  it('setzt die Markierung auf die angezeigte Höhe, bewertet Grün aber nach dem echten Füllstand', () => {
    document.body.innerHTML = '';
    const hud = createHud(document.body);
    hud.setMeter(0.8, { g: 0.1, a: 8 }, 1, true);
    hud.markRelease(1.2, true, { g: 0.1, a: 8 }, 0.8);
    const mark = document.querySelector<HTMLElement>('.hud-mark')!;
    expect(parseFloat(mark.style.bottom)).toBeCloseTo(80, 5);
    expect(mark.classList.contains('good')).toBe(false);
  });
});
