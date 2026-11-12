import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { command, createPlayState, step } from '../src/play/engine';
import type { PlayState } from '../src/play/engine';
import { startPlayLab } from '../src/modes/play-lab';
import { DEFAULTS } from '../src/settings';
import type { Mode } from '../src/modes/mode';
import { PLAYS } from '../src/play/plays';
import { HERO_ID, castWithHero, registerHero, unregisterHero } from '../src/career/hero';
import { TEAMS } from '../src/career/league';
import { seededRng } from '../src/career/create';
import { SAMPLE } from './career-state.test';
import type { SceneSpec } from '../src/career/scene-types';

const sceneSpies = vi.hoisted(() => ({ update: vi.fn(), cheer: vi.fn(), net: vi.fn(), render: vi.fn(), sync: vi.fn(), glass: vi.fn() }));
vi.mock('../src/render/scene', async () => {
  const THREE = await import('three');
  return { createScene: () => ({ scene: new THREE.Scene(), ball: new THREE.Object3D(), updateNet: sceneSpies.net,
    hoop: { setGlassBroken: sceneSpies.glass },
    crowd: { update: sceneSpies.update, cheer: sceneSpies.cheer } }) };
});
vi.mock('../src/render/pixel', () => ({ createPixelRenderer: () => ({ renderer: { render: sceneSpies.render, dispose: vi.fn() }, resize: vi.fn() }) }));
vi.mock('../src/figure/atlas', async () => {
  const THREE = await import('three');
  return { buildAtlas: vi.fn(() => ({ texture: new THREE.Texture(), uv: () => [0, 0, 1, 1] })) };
});
vi.mock('../src/render/actors', async importOriginal => ({
  ...await importOriginal<typeof import('../src/render/actors')>(),
  createActors: () => ({ sync: sceneSpies.sync, dispose: vi.fn() }),
}));
vi.mock('../src/input/gesture', () => ({ attachGesture: vi.fn(() => vi.fn()) }));
vi.mock('../src/play/engine', async importOriginal => {
  const actual = await importOriginal<typeof import('../src/play/engine')>();
  return { ...actual, command: vi.fn(actual.command), createPlayState: vi.fn(actual.createPlayState), step: vi.fn(actual.step) };
});
// restoreAllMocks leert getMockImplementation(); die Originalfunktionen bleiben hier verfügbar.
const actualEngine = await vi.importActual<typeof import('../src/play/engine')>('../src/play/engine');

let mode: Mode | undefined, frame: FrameRequestCallback, now: number;
function advance(seconds: number): void {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) { now += 1000 / 60; frame(now); }
}
function state(): PlayState { return vi.mocked(createPlayState).mock.results.at(-1)!.value; }

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(step).mockReset().mockImplementation(actualEngine.step);
  vi.mocked(command).mockReset().mockImplementation(actualEngine.command);
  vi.mocked(createPlayState).mockReset().mockImplementation(actualEngine.createPlayState);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ fillRect: vi.fn(), fillText: vi.fn() } as unknown as CanvasRenderingContext2D);
  now = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { frame = callback; return 1; }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  document.body.innerHTML = '<div id="app"></div>';
});
afterEach(() => { mode?.stop(); unregisterHero(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function startScene(seed = 1, deficit = 2, clockS = 12) {
  // fester Zufall: keine zufällige Bank-Ohnmacht/Replays, die das Ende in CI unterschiedlich weit verschieben
  vi.spyOn(Math, 'random').mockImplementation(seededRng(seed + 1000));
  registerHero({ ...SAMPLE.player, position: 'guard' }, TEAMS[0]);
  const spec: SceneSpec = { play: castWithHero(PLAYS.pnr, 'guard', seededRng(seed)), deficit, clockS,
    title: '4. VIERTEL · 0:12 · −2', subtitle: 'Christmas Game', controlled: HERO_ID };
  const onEnd = vi.fn();
  mode = startPlayLab(document.querySelector('#app')!, { ...DEFAULTS, mode: 'career' }, { spec, onEnd });
  return { spec, onEnd };
}

describe('Spielzug-Labor als Karriere-Szene', () => {
  it('startet genau den übergebenen Spielzug mit Rückstand, Uhr und eigenem Spieler', () => {
    const { spec } = startScene(1, 4, 9);
    const s = state();
    expect(s.play.id).toBe('pnr');
    expect(s.deficit).toBe(4);
    expect(s.clock).toBe(9);
    expect(s.actors[HERO_ID]).toBeDefined();
    const cfg = vi.mocked(createPlayState).mock.calls.at(-1)![1];
    expect(cfg).toMatchObject({ controlled: HERO_ID, ratingMeters: true, situationRandom: false });
    expect(document.body.textContent).toContain(spec.subtitle);
  });
  it('meldet das Ende genau einmal und startet keinen neuen Spielzug', async () => {
    const { onEnd } = startScene();
    advance(70); // ohne Eingabe: KI-Timeout / Zeit läuft ab
    expect(state().phase).toBe('ended');
    advance(10);
    await new Promise(r => setTimeout(r, 0)); // Ende wird nach dem Bild gemeldet
    expect(onEnd).toHaveBeenCalledOnce();
    expect(vi.mocked(createPlayState)).toHaveBeenCalledOnce();
    const r = onEnd.mock.calls[0][0];
    expect(typeof r.won).toBe('boolean');
    expect(r).toMatchObject({ pts: expect.any(Number), ast: expect.any(Number), verdict: expect.any(String) });
  });
  it('won nur bei GAMEWINNER; Punkte des eigenen Spielers', async () => {
    const { onEnd } = startScene();
    const s = state();
    vi.mocked(step).mockImplementation((st, dt, c, r) => {
      const ev = actualEngine.step(st, dt, c, r);
      if (st.phase !== 'ended') { st.points = st.deficit + 1; st.box[HERO_ID] = { pts: 3, ast: 1 } as never; }
      return ev;
    });
    expect(s).toBeDefined();
    advance(80);
    await new Promise(r => setTimeout(r, 0));
    expect(onEnd).toHaveBeenCalledOnce();
    if (onEnd.mock.calls.length) {
      const r = onEnd.mock.calls[0][0];
      // im letzten Engine-Schritt kann noch ein echter Korb/Assist dazukommen
      expect(r.pts).toBeGreaterThanOrEqual(3); expect(r.ast).toBeGreaterThanOrEqual(1);
      expect(r.won).toBe(r.verdict === 'GAMEWINNER');
    }
  });
  it('ohne Szene verhält sich das Labor wie bisher (neuer Spielzug nach dem Ende)', () => {
    vi.spyOn(Math, 'random').mockImplementation(seededRng(5));
    mode = startPlayLab(document.querySelector('#app')!, { ...DEFAULTS, mode: 'play', play: 'pnr', defenseRandom: false });
    advance(80);
    expect(vi.mocked(createPlayState).mock.calls.length).toBeGreaterThan(1);
  });
});

describe('Karriere-Schwierigkeit in der Szene', () => {
  it('grüne Zone, Meter-Dauer und KI-Faktor kommen in der Engine an', () => {
    registerHero({ ...SAMPLE.player, position: 'guard' }, TEAMS[0]);
    const spec: SceneSpec = { play: castWithHero(PLAYS.pnr, 'guard', seededRng(1)), deficit: 2, clockS: 12, title: 't', subtitle: 's',
      controlled: HERO_ID, tuning: { zone: .8, meter: .9, ai: .85 } };
    vi.spyOn(Math, 'random').mockImplementation(seededRng(3));
    mode = startPlayLab(document.querySelector('#app')!, { ...DEFAULTS, mode: 'career' }, { spec, onEnd: vi.fn() });
    const cfg = vi.mocked(createPlayState).mock.calls.at(-1)![1];
    expect(cfg.shot.greenZone).toBeCloseTo(DEFAULTS.greenZone * .8, 9);
    expect(cfg.finish.meterMs).toBeCloseTo(DEFAULTS.finishMeterMs * .9, 9);
    expect(cfg.aiDifficulty).toBe(.85);
  });
});

describe('Frühe Karriere-Szenen zeigen keinen Spielausgang', () => {
  it.each([false, true])('final=%s: Ende zeigt %s', final => {
    registerHero({ ...SAMPLE.player, position: 'guard' }, TEAMS[0]);
    vi.spyOn(Math, 'random').mockImplementation(seededRng(4));
    const spec: SceneSpec = { play: castWithHero(PLAYS.pnr, 'guard', seededRng(2)), deficit: 2, clockS: 12, title: 't', subtitle: 's',
      controlled: HERO_ID, final };
    mode = startPlayLab(document.querySelector('#app')!, { ...DEFAULTS, mode: 'career' }, { spec, onEnd: vi.fn() });
    advance(40);
    expect(state().phase).toBe('ended');
    const banner = document.querySelector('.hud-title')!.textContent!;
    if (final) expect(['GAMEWINNER', 'OVERTIME', 'VERLOREN', 'DOPPEL-OVERTIME']).toContain(banner);
    else expect(banner).toMatch(/^(\+\d+ PUNKTE?|KEIN TREFFER)$/);
  });
});
