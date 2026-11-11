import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import type { GestureEvent } from '../src/input/gesture';
import { attachGesture } from '../src/input/gesture';
import { command, createPlayState, step } from '../src/play/engine';
import type { PlayState } from '../src/play/engine';
import { startPlayLab } from '../src/modes/play-lab';
import { DEFAULTS } from '../src/settings';
import { MAX_FILL } from '../src/shot/resolve';
import type { Mode } from '../src/modes/mode';
import { ACTORS, RED, BLUE, BENCH_RED, BENCH_BLUE, DOC, MEDIC2 } from '../src/play/teams';
// Die zehn Teamspieler (ohne Schiri)
const PLAYERS = [...RED, ...BLUE];
import { PLAYS } from '../src/play/plays';
import { benchCameraPose, finishCameraPose, playCameraPose } from '../src/render/camera-pose';
import { MOVES } from '../src/figure/moves';
import { frameAt , spriteJointWorld } from '../src/render/actors';
import { buildAtlas } from '../src/figure/atlas';

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

let mode: Mode, frame: FrameRequestCallback, now: number;
function advance(seconds: number): void {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) { now += 1000 / 60; frame(now); }
}
function state(): PlayState { return vi.mocked(createPlayState).mock.results.at(-1)!.value; }
function gesture(e: GestureEvent): void { vi.mocked(attachGesture).mock.calls.at(-1)![1](e); }

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
  mode = startPlayLab(document.querySelector('#app')!, { ...DEFAULTS, mode: 'play', play: 'pnr', defenseRandom: false });
});
afterEach(() => { mode.stop(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('Spielzug-Labor Integration', () => {
  const benchViews = () => sceneSpies.sync.mock.calls.map(c => c[0] as import('../src/render/actors').ActorView[])
    .filter(v => v.some(a => a.id === BENCH_RED[0].id)).at(-1)!;

  it('verdrahtet beide Sanitäter im kleinen Bank-Atlas und räumt die Trage beim Neustart und Stoppen auf', () => {
    const call = vi.mocked(buildAtlas).mock.calls.find(c => DOC.id in c[0])!;
    expect(call[0][MEDIC2.id]).toBe(MEDIC2);
    for (const a of [DOC, MEDIC2]) expect(call[1]!.moves![a.id]).toEqual(['idle', 'carry']);
    mode.apply({ ...DEFAULTS, mode: 'play', play: 'pnr', defenseRandom: false, forceFaint: true });
    vi.mocked(step).mockImplementation((s, dt) => { s.realTime += dt; s.gameT += dt; return []; });
    vi.mocked(step).mockReturnValueOnce([{ type: 'glass' }]); advance(2);
    const scene = sceneSpies.render.mock.calls.at(-1)![0] as import('three').Scene;
    const bed = scene.children.find(o => o.name === 'bench-stretcher')!;
    expect(bed.visible).toBe(true);
    expect([DOC, MEDIC2].every(a => benchViews().find(v => v.id === a.id)!.visible)).toBe(true);
    mode.restart!(); advance(1 / 60);
    expect(bed.visible).toBe(false);
    mode.stop(); expect(scene.children).not.toContain(bed);
  });

  it('reicht forceFaint an die Bank durch, pausiert sie mit und setzt sie beim newPlay zurück', () => {
    mode.apply({ ...DEFAULTS, mode: 'play', play: 'pnr', defenseRandom: false, forceFaint: true });
    vi.mocked(step).mockImplementation((s, dt) => { s.realTime += dt; s.gameT += dt; return []; });
    vi.mocked(step).mockReturnValueOnce([{ type: 'glass' }]); advance(.3);
    expect(benchViews().filter(v => v.move === 'bench_cheer')).toHaveLength(3);
    mode.setPaused!(true); advance(2); mode.setPaused!(false);
    expect(benchViews().some(v => v.move === 'knocked_down')).toBe(false);
    advance(.8);
    expect(benchViews().filter(v => v.move === 'knocked_down')).toHaveLength(1);
    expect(vi.mocked(step).mock.calls.at(-1)![2]).not.toHaveProperty('forceFaint');
    mode.restart!(); advance(1 / 60);
    expect(benchViews().filter(v => v.visible && v.move === 'sit')).toHaveLength(6);
    expect([DOC, MEDIC2].every(a => !benchViews().find(v => v.id === a.id)!.visible)).toBe(true);
  });

  it('lässt beim Block die blaue Bank jubeln und zeigt sie auch im Replay im aktuellen Zustand', () => {
    vi.spyOn(Math, 'random').mockReturnValue(.5);
    vi.mocked(step).mockImplementation((s, dt) => { s.realTime += dt; s.gameT += dt; return []; });
    advance(.4);
    const s = state();
    vi.mocked(step).mockReturnValueOnce([{ type: 'result', made: false, banner: 'WEGGEBLOCKT' }]); advance(.3);
    for (const a of BENCH_BLUE) expect(benchViews().find(v => v.id === a.id)!.move).toBe('bench_cheer');
    s.poster = { victim: s.handler, kind: 'block', variant: 'classic', startedAt: s.realTime };
    vi.mocked(step).mockReturnValueOnce([{ type: 'result', made: false, banner: 'GEBLOCKT' }]); advance(1 / 60);
    const before = structuredClone(benchViews());
    sceneSpies.sync.mockClear(); advance(.1);
    expect(benchViews()).toEqual(before);
    document.querySelector('#stage')!.dispatchEvent(new Event('pointerdown'));
  });

  it('zeigt nach dem Umfallen die Bank-Kamera und startet newPlay erst nach der Tragen-Szene', () => {
    const look = vi.spyOn(PerspectiveCamera.prototype, 'lookAt');
    mode.apply({ ...DEFAULTS, mode: 'play', play: 'pnr', defenseRandom: false, forceFaint: true });
    vi.mocked(step).mockImplementation((s, dt) => { s.realTime += dt; s.gameT += dt; return []; });
    const previous = state();
    vi.mocked(step).mockReturnValueOnce([{ type: 'glass' }, { type: 'end', verdict: 'VERLOREN' }]);
    advance(1.1);
    expect(benchViews().filter(v => v.move === 'knocked_down')).toHaveLength(1);
    const down = benchViews().find(v => v.move === 'knocked_down')!;
    const camera = look.mock.contexts.at(-1) as PerspectiveCamera;
    const pose = benchCameraPose(down, camera.aspect);
    expect(camera.position.toArray()).toEqual([pose.pos.x, pose.pos.y, pose.pos.z]);
    const direction = new Vector3(pose.look.x, pose.look.y, pose.look.z).sub(camera.position).normalize();
    expect(camera.getWorldDirection(new Vector3()).distanceTo(direction)).toBeLessThan(1e-10);
    expect(camera.fov).toBe(60);
    advance(1.1);
    expect(state()).toBe(previous);
    advance(2.3);
    expect(state()).toBe(previous);
    expect([DOC, MEDIC2].every(a => benchViews().find(v => v.id === a.id)!.visible)).toBe(true);
    const scene = sceneSpies.render.mock.calls.at(-1)![0] as import('three').Scene;
    expect(scene.children.find(o => o.name === 'bench-stretcher')!.visible).toBe(true);
    advance(2.8);
    expect(state()).not.toBe(previous);
    expect(benchViews().filter(v => v.visible && v.move === 'sit')).toHaveLength(6);
    expect([DOC, MEDIC2].every(a => !benchViews().find(v => v.id === a.id)!.visible)).toBe(true);
  });

  it('gibt dem Replay Vorrang und zeigt danach die pausierte Ohnmacht mit der Bank-Kamera', () => {
    const look = vi.spyOn(PerspectiveCamera.prototype, 'lookAt');
    mode.apply({ ...DEFAULTS, mode: 'play', play: 'pnr', defenseRandom: false, forceFaint: true });
    vi.mocked(step).mockImplementation((s, dt) => { s.realTime += dt; s.gameT += dt; return []; });
    vi.mocked(step).mockReturnValueOnce([{ type: 'glass' }]);
    advance(1.1);
    const down = benchViews().find(v => v.move === 'knocked_down')!;
    vi.mocked(step).mockReturnValueOnce([{ type: 'result', made: true, banner: 'POSTER!' }, { type: 'end', verdict: 'VERLOREN' }]);
    advance(.1);
    expect(document.querySelector<HTMLElement>('.replay-badge')!.hidden).toBe(false);
    const camera = look.mock.contexts.at(-1) as PerspectiveCamera;
    expect(camera.position.y).toBe(3.6);
    const previous = state(), time = previous.realTime;
    advance(.3); expect(previous.realTime).toBe(time);
    document.querySelector('#stage')!.dispatchEvent(new Event('pointerdown'));
    advance(1 / 60);
    const pose = benchCameraPose(down, camera.aspect);
    expect(camera.position.toArray()).toEqual([pose.pos.x, pose.pos.y, pose.pos.z]);
    advance(2.1); expect(state()).toBe(previous);
    advance(4); expect(state()).not.toBe(previous);
  });

  it('erkennt auch einen getroffenen Brett-Dreier über die drei hinzugekommenen Punkte', () => {
    vi.spyOn(Math, 'random').mockReturnValue(.5);
    vi.mocked(step).mockImplementation((s, dt) => { s.realTime += dt; s.gameT += dt; return []; });
    state().points = 3;
    vi.mocked(step).mockReturnValueOnce([{ type: 'result', made: true, banner: 'ÜBERS BRETT' }]);
    advance(.3);
    for (const a of BENCH_RED) expect(benchViews().find(v => v.id === a.id)!.move).toBe('bench_cheer');
    for (const a of BENCH_BLUE) expect(benchViews().find(v => v.id === a.id)!.move).toBe('sit');
  });
  it('zeigt Glas-Flash, Scherben, Mop und Reparatur und setzt beim Neustart alles zurück', () => {
    mode.apply({ ...DEFAULTS, mode: 'play', play: 'pnr', forceGlass: true });
    const s = state();
    s.glass = { since: s.realTime };
    s.actors.mop = { id: 'mop', pos: { x: 0, z: .6 }, y: 0, facing: 0, move: 'mop_sweep', moveT: 0 };
    vi.mocked(step).mockReturnValueOnce([{ type: 'glass' }]);
    advance(1 / 60);
    expect(vi.mocked(step).mock.calls.at(-1)![2].forceGlass).toBe(true);
    expect(document.querySelector('.phud-flash')!.textContent).toBe('BRETT ZERBROCHEN!');
    expect(sceneSpies.cheer).toHaveBeenLastCalledWith(1);
    expect(sceneSpies.glass).toHaveBeenLastCalledWith(true);
    const scene = sceneSpies.render.mock.calls.at(-1)![0] as import('three').Scene;
    const pieces = scene.children.filter(o => o.name === 'glass-shard');
    expect(pieces.filter(o => o.visible)).toHaveLength(30);
    expect(sceneSpies.sync.mock.calls.at(-1)![0]).toContainEqual(expect.objectContaining({ id: 'mop', visible: true, move: 'mop_sweep' }));
    s.glassSweep = .5; advance(1 / 60);
    expect(pieces.filter(o => o.visible)).toHaveLength(15);
    s.glass = null; delete s.actors.mop;
    vi.mocked(step).mockReturnValueOnce([{ type: 'glassFixed' }]); advance(1 / 60);
    expect(sceneSpies.glass).toHaveBeenLastCalledWith(false);
    expect(pieces.some(o => o.visible)).toBe(false);
    expect(sceneSpies.sync.mock.calls.at(-1)![0]).toContainEqual(expect.objectContaining({ id: 'mop', visible: false }));
    s.glass = { since: s.realTime }; vi.mocked(step).mockReturnValueOnce([{ type: 'glass' }]); advance(1 / 60);
    mode.restart!();
    expect(sceneSpies.glass).toHaveBeenLastCalledWith(false);
    expect(pieces.some(o => o.visible)).toBe(false);
  });

  it('pausiert die Mop-Szene während des And-one-Replays und startet danach kein zweites Replay', () => {
    vi.mocked(step).mockImplementation((s, dt) => { s.realTime += dt; s.gameT += dt; return []; });
    advance(.4);
    const s = state();
    s.glass = { since: s.realTime };
    vi.mocked(step).mockReturnValueOnce([{ type: 'glass' }, { type: 'result', made: true, banner: 'DUNK! + AND-ONE' }]);
    advance(1 / 60);
    const time = s.realTime, calls = vi.mocked(step).mock.calls.length;
    expect(document.querySelector<HTMLElement>('.replay-badge')!.hidden).toBe(false);
    advance(.4);
    expect(s.realTime).toBe(time);
    expect(vi.mocked(step).mock.calls.length).toBe(calls);
    document.querySelector('#stage')!.dispatchEvent(new Event('pointerdown'));
    s.glass = null;
    vi.mocked(step).mockReturnValueOnce([{ type: 'glassFixed' }, { type: 'freethrow', left: 1 }, { type: 'foul', andOne: true }]);
    advance(1 / 60);
    expect(document.querySelector<HTMLElement>('.replay-badge')!.hidden).toBe(true);
    expect(document.querySelector<HTMLElement>('.phud-andone')!.hidden).toBe(false);
  });
  it('reicht die Poster-Variante weiter und startet beim Block ein Replay mit Opfer-Sternen', () => {
    mode.apply({ ...DEFAULTS, mode: 'play', play: 'pnr', posterVariant: 'grave' });
    const s = state(), a = s.actors[s.handler];
    a.move = 'knocked_down';
    s.poster = { victim: a.id, kind: 'block', variant: 'classic', startedAt: s.realTime };
    vi.mocked(step).mockReturnValueOnce([{ type: 'result', made: false, banner: 'GEBLOCKT' }]);
    advance(1 / 60);
    expect(vi.mocked(step).mock.calls.at(-1)![2].posterVariant).toBe('grave');
    expect(document.querySelector<HTMLElement>('.replay-badge')!.hidden).toBe(false);
    expect(document.querySelector<HTMLElement>('.phud-poster')!.hidden).toBe(false);
    document.querySelector('#stage')!.dispatchEvent(new Event('pointerdown'));
    vi.mocked(step).mockReturnValueOnce([{ type: 'result', made: false, banner: 'DANEBEN' }]);
    advance(1 / 60);
    expect(document.querySelector<HTMLElement>('.replay-badge')!.hidden).toBe(true);
  });
  it('zeigt bei Abflug erst nach Landung Sterne und bei Grabstein keine', () => {
    const s = state(), d = s.actors.b1;
    vi.mocked(step).mockImplementation((s, dt) => { s.realTime += dt; return []; });
    d.move = 'knocked_down'; d.y = 2.8;
    s.poster = { victim: d.id, kind: 'poster', variant: 'flyout', startedAt: Infinity };
    advance(1 / 60);
    const stars = document.querySelector<HTMLElement>('.phud-poster')!;
    expect(stars.hidden).toBe(true);
    d.y = 0; s.poster.startedAt = s.realTime;
    advance(1 / 60); expect(stars.hidden).toBe(false);
    s.poster.variant = 'grave'; d.y = -ACTORS[d.id].heightM;
    advance(1 / 60);
    expect(stars.hidden).toBe(true);
    expect((sceneSpies.sync.mock.calls.at(-1)![0] as import('../src/render/actors').ActorView[]).find(v => v.id === d.id)!.visible).toBe(false);
  });
  it('zeigt den Grabstein im Replay erst ab since und entfernt ihn beim Neustart', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ fillRect: vi.fn(), fillText: vi.fn() } as unknown as CanvasRenderingContext2D);
    vi.mocked(step).mockImplementation((s, dt) => { s.realTime += dt; s.gameT += dt; return []; });
    advance(.2);
    const s = state(), d = s.actors.b1;
    s.poster = { victim: d.id, kind: 'poster', variant: 'grave', startedAt: s.realTime };
    s.grave = { x: d.pos.x, z: d.pos.z, since: s.realTime + .1 };
    d.move = 'knocked_down'; d.y = -ACTORS[d.id].heightM;
    advance(.05);
    const scene = sceneSpies.render.mock.calls.at(-1)![0] as import('three').Scene;
    const stone = scene.getObjectByName('poster-grave')!;
    expect(stone.visible).toBe(false);
    advance(.25); expect(stone.visible).toBe(true);
    vi.mocked(step).mockReturnValueOnce([{ type: 'result', made: true, banner: 'POSTER!' }]);
    advance(1 / 60);
    advance(1 / 60); expect(stone.visible).toBe(false);
    advance(.9); expect(stone.visible).toBe(true);
    document.querySelector('#stage')!.dispatchEvent(new Event('pointerdown'));
    mode.restart!(); expect(stone.visible).toBe(false);
  });
  it('reicht geänderte Test-Szenarien an die Engine durch', () => {
    mode.apply({ ...DEFAULTS, mode: 'play', play: 'pnr', finishFoulChance: .75, forcePoster: true });
    advance(1 / 60);
    expect(vi.mocked(step).mock.calls.at(-1)![2]).toMatchObject({ finishFoulOverride: .75, forcePoster: true });
    mode.apply({ ...DEFAULTS, mode: 'play', play: 'pnr' });
    advance(1 / 60);
    expect(vi.mocked(step).mock.calls.at(-1)![2]).toMatchObject({ finishFoulOverride: -1, forcePoster: false });
  });
  it('wendet den geänderten Fenster-Regler auch im laufenden Modus mit vollen vier Spielsekunden an', () => {
    mode.apply({ ...DEFAULTS, mode: 'play', play: 'pnr', defenseRandom: false, decisionS: 4 });
    for (let i = 0; i < 200 && state().phase !== 'decision'; i++) advance(1 / 60);
    const s = state(), start = s.gameT;
    vi.mocked(step).mockClear();
    let selected = false;
    for (let i = 0; i < 1200 && !selected; i++) {
      advance(1 / 60);
      selected = (vi.mocked(step).mock.results.at(-1)!.value as ReturnType<typeof step>)
        .some(e => e.type === 'decision' && e.options.length === 1);
    }
    expect(selected).toBe(true);
    expect(s.gameT - start).toBeCloseTo(4, 1);
    expect(vi.mocked(step).mock.calls[0][2]).toMatchObject({ decisionLead: 4, decisionS: 4 });
  });
  it('simuliert Hintergrundzeit und große Zeitsprünge nicht nach, kurze Aussetzer schon', () => {
    advance(2.3);
    const s = state(), before = s.realTime;
    now += 300_000; frame(now);
    expect(s.realTime).toBe(before);
    now += 150; frame(now);
    expect(s.realTime - before).toBeCloseTo(.15, 8);
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    const atHide = s.realTime;
    advance(2);
    expect(s.realTime).toBe(atHide);
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
    advance(.1);
    expect(s.realTime - atHide).toBeCloseTo(.1, 8);
  });
  it('pausiert Banner, Kontaktmeldung, Netz und Publikum und entsorgt HUD-Timer', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    vi.mocked(step).mockReturnValueOnce([{ type: 'combo', fouled: true, contact: false },
      { type: 'result', made: false, banner: 'FEHLWURF' }]);
    advance(1 / 60); mode.setPaused!(true); advance(1 / 60);
    const netAt = sceneSpies.net.mock.calls.at(-1)![0], count = sceneSpies.update.mock.calls.length;
    advance(5); vi.advanceTimersByTime(5000);
    expect(document.querySelector<HTMLElement>('#hud-banner')!.hidden).toBe(false);
    expect(document.querySelector<HTMLElement>('.phud-flash')!.hidden).toBe(false);
    expect(sceneSpies.update).toHaveBeenCalledTimes(count);
    mode.setPaused!(false); advance(.1);
    expect(sceneSpies.net.mock.calls.at(-1)![0] - netAt).toBeCloseTo(100, 6);
    expect(sceneSpies.update.mock.calls.at(-1)![0]).toBe(sceneSpies.net.mock.calls.at(-1)![0]);
    mode.stop(); expect(vi.getTimerCount()).toBe(0);
  });
  it('verwendet ActorView-Puffer wieder und rendert eine unveränderte Pause nicht erneut', () => {
    advance(1 / 60);
    const views = sceneSpies.sync.mock.calls.at(-1)![0], first = views[0];
    advance(1 / 60);
    expect(sceneSpies.sync.mock.calls.at(-1)![0]).toBe(views);
    expect(views[0]).toBe(first);
    mode.setPaused!(true); advance(1 / 60);
    const renders = sceneSpies.render.mock.calls.length;
    const observer = new MutationObserver(() => {});
    observer.observe(document.querySelector('.play-lab')!, { subtree: true, attributes: true, childList: true, characterData: true });
    advance(1);
    expect(sceneSpies.render).toHaveBeenCalledTimes(renders);
    expect(observer.takeRecords()).toEqual([]); observer.disconnect();
  });
  it.each([['TREFFER', .6], ['DUNK!', .9], ['POSTER!', .9]] as const)('jubelt bei %s mit Stärke %s und bei GAMEWINNER mit 1', (banner, strength) => {
    vi.mocked(step).mockReturnValueOnce([{ type: 'result', banner, made: true }]);
    advance(1 / 60); expect(sceneSpies.cheer).toHaveBeenLastCalledWith(strength);
    // POSTER startet ein Instant Replay; Tippen überspringt es
    const badge = document.querySelector<HTMLElement>('.replay-badge')!;
    expect(badge.hidden).toBe(banner !== 'POSTER!');
    document.querySelector('#stage')!.dispatchEvent(new Event('pointerdown'));
    expect(badge.hidden).toBe(true);
    vi.mocked(step).mockReturnValueOnce([{ type: 'end', verdict: 'GAMEWINNER' }]);
    advance(1 / 60); expect(sceneSpies.cheer).toHaveBeenLastCalledWith(1);
  });
  it('baut beim Fast Break nur die beteiligten Akteure bedarfsgesteuert auf', () => {
    mode.apply({ ...DEFAULTS, mode: 'play', play: 'fastbreak', defenseRandom: false });
    const call = vi.mocked(buildAtlas).mock.calls.at(-1)!;
    // Beteiligte Spieler plus Schiri (erscheint nur bei Fouls)
    expect(Object.keys(call[0]).sort()).toEqual([...PLAYS.fastbreak.actors, 'ref', 'mop'].sort());
    expect(call[1]).toEqual({ lazy: true });
  });
  it('übergibt alle Baukasten-Merkmale der zehn Teamspieler an den Atlas', () => {
    const looks = vi.mocked(buildAtlas).mock.calls[0][0];
    expect(Object.keys(looks)).toHaveLength(12); // zehn Spieler + Schiri + Mop-Boy
    for (const a of PLAYERS) {
      expect(looks[a.id]).toMatchObject({
        hair: a.hair, beard: a.beard, headband: a.headband,
        armSleeve: a.armSleeve, shoes: a.shoes, socks: a.socks,
      });
    }
  });
  it('projiziert Poster-Sterne über den liegenden Kopf, pausiert ihre Frist und entfernt sie nach 1,5 s auch in ended', () => {
    const look = vi.spyOn(PerspectiveCamera.prototype, 'lookAt');
    const stage = document.querySelector<HTMLElement>('#stage')!;
    Object.defineProperties(stage, { clientWidth: { value: 800 }, clientHeight: { value: 600 } });
    const s = state(), d = s.actors.b1;
    s.phase = 'ballflight';
    s.poster = { victim: d.id, kind: 'poster', variant: 'classic', startedAt: s.realTime };
    d.move = 'knocked_down'; d.moveT = .35; d.y = 0; d.facing = .7;
    vi.mocked(step).mockImplementation((s, dt) => { s.realTime += dt; return []; });
    advance(1 / 60);
    const stars = document.querySelector<HTMLElement>('.phud-poster')!;
    // Kopf so, wie er im Pixel-Sprite liegt (Billboard zur Kamera), nicht die 3D-Pose
    const cam = look.mock.contexts.at(-1) as PerspectiveCamera, fwd = cam.getWorldDirection(new Vector3());
    const yaw = Math.atan2(fwd.x, -fwd.z);
    const hp = spriteJointWorld({ id: d.id, x: d.pos.x, y: d.y, z: d.pos.z, facing: d.facing, move: d.move, moveT: d.moveT, visible: true, moveSide: d.moveSide },
      'head', ACTORS[d.id].heightM, yaw);
    const v = new Vector3(hp.x, hp.y + .25, hp.z).project(cam);
    const sign = v.z > 1 ? -1 : 1;
    expect(stars.hidden).toBe(false);
    expect(stars.style.transform).toBe(`translate(${(v.x * sign + 1) / 2 * 800}px, ${(1 - v.y * sign) / 2 * 600}px)`);
    advance(.6);
    mode.setPaused!(true); advance(5); mode.setPaused!(false);
    expect(stars.hidden).toBe(false);
    vi.mocked(step).mockImplementationOnce(() => {
      s.phase = 'ended'; return [{ type: 'end', verdict: 'OVERTIME' }];
    });
    advance(.7);
    expect(stars.hidden).toBe(false);
    advance(.3);
    expect(stars.hidden).toBe(true);
    expect(d.move).toBe('knocked_down');
  });

  it('zeigt das Abschlusswort sofort beim Loslassen, hält Pfeil und Markierung bis result und räumt beim Neustart auf', () => {
    advance(2.3);
    const s = state(), c = vi.mocked(step).mock.calls.at(-1)![2];
    command(s, { kind: 'drive', lane: 0 }, c, () => 1);
    for (let i = 0; i < 300 && s.phase !== 'takeoff'; i++) advance(1 / 60);
    expect(s.phase).toBe('takeoff');
    gesture({ type: 'start' });
    advance(1 / 60);
    const feedback = document.querySelector<HTMLElement>('.phud-finish-feedback')!;
    const arrow = document.querySelector<HTMLElement>('.hud-arrow')!;
    const mark = document.querySelector<HTMLElement>('.hud-mark')!;
    expect(feedback.hidden).toBe(true);
    expect(mark.hidden).toBe(true);
    expect(s.phase).toBe('takeoff');
    gesture({ type: 'tap' });
    expect(feedback.textContent).toBe('ZU FRÜH');
    expect(feedback.hidden).toBe(false);
    frame(now);
    const bottom = arrow.style.bottom;
    advance(.4);
    expect(arrow.style.bottom).toBe(bottom);
    expect(mark.style.bottom).toBe(bottom);
    expect(mark.hidden).toBe(false);
    for (let i = 0; i < 400 && s.phase !== 'ended'; i++) {
      if (s.phase === 'freethrows') {
        advance(3); // Pfiff, ggf. And-one-Feier und Aufstellung vor der Wurf-Kombi
        gesture({ type: 'start' }); gesture({ type: 'hold' });
        now += s.combo!.meterMs;
        gesture({ type: 'release', holdMs: s.combo!.meterMs + 200, angleDeg: 0 });
      }
      advance(1 / 60);
    }
    expect(s.phase).toBe('ended');
    expect(feedback.hidden).toBe(true);
    expect(document.querySelector('.hud-hint')!.textContent).toContain(actualEngine.lastHint(s));
    expect(document.querySelector<HTMLElement>('#hud-meter')!.hidden).toBe(true);
    mode.restart!(); advance(1 / 60);
    expect(feedback.hidden).toBe(true);
    expect(document.querySelector<HTMLElement>('.phud-poster')!.hidden).toBe(true);
  });

  it('zeigt das Brett-Fenster aus der Engine bei Halte-Kombi und Pfeil', () => {
    advance(2.3);
    gesture({ type: 'start' });
    gesture({ type: 'hold' });
    advance(1 / 60);
    const stripe = document.querySelector<HTMLElement>('.hud-bank')!;
    const window = state().combo!.bankWindow!;
    expect(stripe.hidden).toBe(false);
    expect(parseFloat(stripe.style.bottom)).toBeCloseTo(window.lo / MAX_FILL * 100, 8);
    mode.apply({ ...DEFAULTS, mode: 'play', play: 'kickout', defenseRandom: false });
    const s = catchArrow();
    advance(1 / 60);
    expect(stripe.hidden).toBe(s.arrowMeter!.bankWindow === null);
    if (s.arrowMeter!.bankWindow) {
      expect(parseFloat(stripe.style.bottom)).toBeCloseTo(s.arrowMeter!.bankWindow.lo / MAX_FILL * 100, 8);
    }
  });
  it.each(['auto', 'high'] as const)('rahmt beim Kick-out in %s schon im ersten Entscheidungsframe alle Ziele ein', cameraMode => {
    const look = vi.spyOn(PerspectiveCamera.prototype, 'lookAt');
    mode.apply({ ...DEFAULTS, mode: 'play', play: 'kickout', defenseRandom: false, camera: cameraMode });
    advance(1 / 60);
    const camera = look.mock.contexts.at(-1) as PerspectiveCamera;
    camera.aspect = 390 / 844;
    camera.updateProjectionMatrix();
    for (let i = 0; i < 240 && state().phase !== 'decision'; i++) advance(1 / 60);
    expect(state().phase).toBe('decision');
    camera.updateMatrixWorld(true);
    for (const id of [state().handler, 'r11', 'r3']) {
      const p = state().actors[id].pos;
      for (const y of [0, 2.2]) {
        const v = new Vector3(p.x, y, p.z).project(camera);
        expect(Math.abs(v.x)).toBeLessThanOrEqual(.84 + 1e-10);
        expect(Math.abs(v.y)).toBeLessThanOrEqual(.84 + 1e-10);
        expect(Math.abs(v.z)).toBeLessThan(1);
      }
    }
    const rim = new Vector3(0, 3.05, 0).project(camera);
    expect(Math.abs(rim.x)).toBeLessThanOrEqual(.84 + 1e-10);
    expect(Math.abs(rim.y)).toBeLessThanOrEqual(.84 + 1e-10);
  });
  it.each(['auto', 'high'] as const)('fährt beim Catch-and-Shoot in %s auch mit fehlenden Passzielen schon vor dem Tipp tief', cameraMode => {
    const look = vi.spyOn(PerspectiveCamera.prototype, 'lookAt');
    mode.apply({ ...DEFAULTS, mode: 'play', play: 'pnr', defenseRandom: false, camera: cameraMode });
    const s = catchArrow();
    const camera = look.mock.contexts.at(-1) as PerspectiveCamera;
    camera.aspect = 390 / 844;
    camera.updateProjectionMatrix();
    s.actors.r3.pos = { x: -6.9, z: 10 };
    vi.mocked(step).mockReturnValueOnce([{ type: 'decision', options: [{ kind: 'shoot' }, { kind: 'pass', to: 'r3' }] }]);
    advance(1 / 60);
    expect(camera.fov).toBeLessThan(60);
    // Das künstliche Ziel bleibt trotz der jetzt bewegten Daten außerhalb des Bildes.
    const actualStep = actualEngine.step;
    try {
      vi.mocked(step).mockImplementation((state, dt, c, rng) => {
        const events = actualStep(state, dt, c, rng);
        state.actors.r3.pos = { x: -6.9, z: 10 };
        return events;
      });
      advance(.3);
    } finally { vi.mocked(step).mockImplementation(actualStep); }
    expect(s.arrowMeter!.fill).toBeNull();
    expect(camera.fov).toBeLessThan(51);
    const target = new Vector3(s.actors.r3.pos.x, 1, s.actors.r3.pos.z).project(camera);
    expect(Math.abs(target.x)).toBeGreaterThan(1);
    gesture({ type: 'start' });
    gesture({ type: 'tap' });
    expect(s.phase).toBe('ballflight');
    advance(.5);
    expect(camera.fov).toBeLessThan(51);
  });
  it.each(['auto', 'high'] as const)('nutzt beim Catch-and-Shoot ohne fehlende Ziele und beim Abschluss in %s die tiefe Kamera', cameraMode => {
    const look = vi.spyOn(PerspectiveCamera.prototype, 'lookAt');
    mode.apply({ ...DEFAULTS, mode: 'play', play: 'pnr', defenseRandom: false, camera: cameraMode });
    const s = catchArrow();
    advance(.5);
    const camera = look.mock.contexts.at(-1) as PerspectiveCamera;
    expect(camera.fov).toBeLessThan(51);
    gesture({ type: 'start' });
    gesture({ type: 'tap' });
    advance(.5);
    const aim = playCameraPose('aim', s.actors[s.handler].pos);
    expect(camera.fov).toBeCloseTo(aim.fov, 0);
    expect(camera.position.y).toBeCloseTo(aim.pos.y, 0);
  });
  it('aktualisiert die Tafel beim Korb und jedem Freiwurf sofort und setzt sie beim neuen Spielzug zurück', () => {
    const s = state();
    advance(1 / 60);
    const red = () => document.querySelector('.phud-score-red')!.textContent;
    expect(red()).toBe('98');
    expect(document.querySelector('.play-lab #hud-stats')).not.toBeNull();
    mode.setPaused!(true);
    s.points = 3;
    s.phase = 'freethrows';
    s.clock = 0;
    advance(1 / 60);
    expect(red()).toBe('101');
    for (const points of [4, 5]) {
      s.points = points;
      mode.apply({ ...DEFAULTS, mode: 'play', play: 'pnr', defenseRandom: false }); // pausiertes Bild gezielt invalidieren
      advance(1 / 60);
      expect(red()).toBe(String(98 + points));
      expect(document.querySelector('.phud-game-clock')!.textContent).toBe('0.0');
      expect(document.querySelector('.phud-score-blue')!.textContent).toBe('100');
    }
    mode.apply({ ...DEFAULTS, mode: 'play', play: 'fastbreak', defenseRandom: false });
    expect(red()).toBe('98');
  });
  function catchArrow(): PlayState {
    advance(2.3);
    const s = state(), c = vi.mocked(step).mock.calls.at(-1)![2];
    command(s, { kind: 'pass', to: 'r11' }, c, () => 1);
    for (let i = 0; i < 240 && !s.arrowMeter; i++) advance(1 / 60);
    expect(s.arrowMeter?.kind).toBe('catchshoot');
    return s;
  }
  function swipeTo(id: string): { dx: number; dy: number } {
    const look = vi.spyOn(PerspectiveCamera.prototype, 'lookAt');
    const stage = document.querySelector<HTMLElement>('#stage')!;
    Object.defineProperties(stage, { clientWidth: { value: 800, configurable: true }, clientHeight: { value: 600, configurable: true } });
    advance(1 / 60);
    const s = state(), camera = look.mock.contexts.at(-1) as PerspectiveCamera;
    const h = s.actors[s.handler].pos, to = id === 'rim' ? { x: 0, z: 0 } : s.actors[id].pos;
    const origin = new Vector3(h.x, 1, h.z).project(camera);
    const target = new Vector3(to.x, id === 'rim' ? 3.05 : 1, to.z).project(camera);
    const dx = (target.x - origin.x) * 400, dy = (origin.y - target.y) * 300, len = Math.hypot(dx, dy);
    return { dx: dx / len * 80, dy: dy / len * 80 };
  }
  it.each([false, true])('zieht ohne Loslassen und löst bei Füllstand 1 aus (vorher abheben=%s)', liftEarly => {
    mode.apply({ ...DEFAULTS, mode: 'play', play: 'pnr', defenseRandom: false, fouls: 'off', camera: 'low' });
    advance(2.3);
    const s = state();
    swipeTo('rim'); // Sichtbare Bühne und aktuelle Kamera auch für die laufende Zielwahl.
    gesture({ type: 'start' });
    gesture({ type: 'drag', dx: 0, dy: -59 });
    expect(s.phase).toBe('decision');
    gesture({ type: 'drag', dx: 0, dy: -80 });
    expect(s.phase).toBe('driving');
    expect(s.fingerDown).toBe(true);
    if (liftEarly) {
      gesture({ type: 'flick', dx: 0, dy: -80, holdMs: 100 });
      expect(s.phase).toBe('driving');
      expect(s.fingerDown).toBe(false);
    }
    for (let i = 0; i < 300 && s.phase !== 'takeoff'; i++) advance(1 / 60);
    expect(s.phase).toBe('takeoff');
    expect(s.arrowMeter!.fill).toBeNull();
    expect(s.fingerDown).toBe(!liftEarly);
    if (liftEarly) {
      advance(.1);
      expect(s.arrowMeter!.fill).toBeNull();
      gesture({ type: 'start' });
    }
    now += (s.arrowMeter!.startTime + s.arrowMeter!.meterMs / 1000 - s.realTime) * 1000;
    gesture(liftEarly ? { type: 'tap' } : { type: 'flick', dx: 0, dy: -80, holdMs: 1500 });
    expect(s.phase).toBe('ballflight');
    expect(s.arrowMeter!.fill).toBeCloseTo(1, 8);
    expect(s.arrowMeter!.feedback).toBe('PERFEKT');
    expect(s.fingerDown).toBe(false);
    for (let i = 0; i < 300 && s.phase !== 'ended'; i++) advance(1 / 60);
    expect(s.points).toBe(2);
  });
  it('startet bei durchgehender Geste Richtung Mitspieler den Zug zum Korb', () => {
    advance(2.3);
    const s = state(), vector = swipeTo('r50');
    gesture({ type: 'start' });
    gesture({ type: 'drag', ...vector });
    expect(s.phase).toBe('driving');
    expect(s.fingerDown).toBe(true);
    gesture({ type: 'flick', dx: vector.dx * 1.5, dy: vector.dy * 1.5, holdMs: 100 });
    expect(s.phase).toBe('driving');
    expect(s.arrowMeter).toBeNull();
    expect(s.handler).toBe('r3');
  });
  it.each([true, false])('Flick nach oben passt nur bei Mitspieler in Korbrichtung (vorhanden=%s)', present => {
    mode.apply({ ...DEFAULTS, mode: 'play', play: 'pnr', camera: 'low', defenseRandom: false });
    advance(2.3);
    const s = state();
    s.actors[s.handler].pos = { x: 0, z: 7 };
    s.actors.r50.pos = present ? { x: 0, z: 0 } : { x: 6, z: 8 };
    vi.mocked(step).mockReturnValue([{ type: 'decision', options: [{ kind: 'drive' }, { kind: 'pass', to: 'r50' }] }]);
    swipeTo('rim');
    gesture({ type: 'start' }); gesture({ type: 'flick', dx: 0, dy: -80, holdMs: 80 });
    expect(s.phase).toBe(present ? 'passing' : 'decision');
    if (present) expect(vi.mocked(command).mock.calls.some(([, c]) => c.kind === 'pass' && c.to === 'r50' && c.quality === 1)).toBe(true);
  });
  it('berechnet Passqualität aus dem Loslassvektor des Flicks', () => {
    advance(2.3);
    const s = state();
    vi.mocked(step).mockReturnValue([{ type: 'decision', options: [{ kind: 'pass', to: 'r50' }] }]);
    const v = swipeTo('r50');
    const angle = 25 * Math.PI / 180;
    gesture({ type: 'start' });
    gesture({ type: 'flick', dx: v.dx * Math.cos(angle) - v.dy * Math.sin(angle),
      dy: v.dx * Math.sin(angle) + v.dy * Math.cos(angle), holdMs: 80 });
    const pass = vi.mocked(command).mock.calls.map(([, c]) => c).reverse().find(c => c.kind === 'pass');
    expect(pass).toMatchObject({ kind: 'pass', to: 'r50', quality: expect.closeTo(.5, 8) });
    expect(s.phase).toBe('passing');
  });
  it('startet Ziehen auch beim Catch-and-Shoot mit 80 px schon vor dem Loslassen', () => {
    const s = catchArrow(), vector = swipeTo('rim');
    gesture({ type: 'start' });
    gesture({ type: 'drag', ...vector });
    expect(s.phase).toBe('driving');
    expect(s.fingerDown).toBe(true);
    expect(s.arrowMeter).toBeNull();
  });
  it.each([false, true])('zeigt über takeoff und ballflight alle Abschlussbilder und hält finishCameraPose bis result (halten=%s)', hold => {
    mode.apply({ ...DEFAULTS, mode: 'play', play: 'pnr', defenseRandom: false, fouls: 'off', finishMeterMs: 450 });
    const look = vi.spyOn(PerspectiveCamera.prototype, 'lookAt');
    advance(2.3);
    const s = state(), c = vi.mocked(step).mock.calls.at(-1)![2];
    command(s, { kind: 'drive', lane: 0 }, c, () => 1);
    for (let i = 0; i < 300 && s.phase !== 'takeoff'; i++) advance(1 / 60);
    expect(s.phase).toBe('takeoff');
    const a = s.actors[s.handler], expected = finishCameraPose(a.pos), move = a.move;
    const indices = [frameAt(move, a.moveT)];
    const recordFrame = () => {
      const index = frameAt(move, a.moveT);
      if (index !== indices.at(-1)) indices.push(index);
    };
    expect(indices).toEqual([0]);
    if (hold) gesture({ type: 'start' });
    const peakAt = now + (s.arrowMeter!.startTime + s.arrowMeter!.meterMs / 1000 - s.realTime) * 1000;
    while (peakAt - now > 1e-7) {
      now += Math.min(1000 / 60, peakAt - now);
      frame(now);
      expect(s.phase).toBe('takeoff');
      expect(a.move).toBe(move);
      recordFrame();
    }
    const windup = a.moveT, started = s.gameT, startedReal = s.realTime;
    expect(windup).toBeCloseTo(.75 * MOVES[move].rimFrame! / MOVES[move].fps, 8);
    if (!hold) gesture({ type: 'start' });
    gesture({ type: 'tap' });
    expect(s.phase).toBe('ballflight');
    expect(a.move).toBe(move);
    expect(a.moveT).toBe(windup);
    recordFrame();
    let result = false;
    for (let i = 0; i < 300 && !result; i++) {
      advance(1 / 60);
      result = (vi.mocked(step).mock.results.at(-1)!.value as ReturnType<typeof step>).some(e => e.type === 'result');
      if (result) break;
      expect(s.phase).toBe('ballflight');
      expect(s.gameT - started).toBeCloseTo((s.realTime - startedReal) * c.animSpeed, 8);
      const camera = look.mock.contexts.at(-1) as PerspectiveCamera;
      expect(camera.fov).toBeCloseTo(expected.fov, 0);
      expect(Math.atan2(camera.position.x, camera.position.z)).toBeCloseTo(Math.atan2(expected.pos.x, expected.pos.z), 8);
      expect(camera.position.y).toBeCloseTo(expected.pos.y, 0);
      if (a.move === move) {
        expect(a.moveT).toBeCloseTo(windup + s.gameT - started, 8);
        recordFrame();
      }
    }
    expect(result).toBe(true);
    expect(s.gameT - started).toBeGreaterThanOrEqual(.6);
    expect(indices).toEqual(Array.from({ length: MOVES[move].frames }, (_, i) => i));
    expect(s.points).toBe(2);
  });
  it('bestätigt den Pfeil-Tipp mit Loslasszeit und hält seine grüne Markierung fest', () => {
    const s = catchArrow();
    gesture({ type: 'start' });
    expect(s.phase).toBe('decision');
    now += (s.arrowMeter!.startTime + s.arrowMeter!.meterMs / 1000 - s.realTime) * 1000;
    gesture({ type: 'tap' });
    frame(now);
    expect(s.phase).toBe('ballflight');
    expect(s.arrowMeter!.fill).toBeCloseTo(1, 8);
    const arrow = document.querySelector<HTMLElement>('.hud-arrow')!;
    const mark = document.querySelector<HTMLElement>('.hud-mark')!;
    expect(mark.classList.contains('good')).toBe(true);
    expect(arrow.classList.contains('good')).toBe(true);
    expect(arrow.hidden).toBe(false);
    const bottom = arrow.style.bottom;
    expect(mark.style.bottom).toBe(bottom);
    advance(.5);
    expect(arrow.style.bottom).toBe(bottom);
    expect(mark.style.bottom).toBe(bottom);
  });
  it('unterdrückt hold und release derselben Pfeil-Berührung und lässt danach normale Kombis zu', () => {
    const s = catchArrow();
    gesture({ type: 'start' });
    now += 200;
    gesture({ type: 'hold' });
    expect(s.combo).toBeNull();
    gesture({ type: 'release', holdMs: 250, angleDeg: 0 });
    expect(s.phase).toBe('decision');
    for (let i = 0; i < 120 && s.arrowMeter; i++) advance(1 / 60);
    gesture({ type: 'start' });
    gesture({ type: 'hold' });
    expect(s.phase).toBe('combo');
  });
  it('lässt eine durchgehende 80-px-Geste während Catch-and-Shoot ziehen, auch während der Kamerafahrt', () => {
    const look = vi.spyOn(PerspectiveCamera.prototype, 'lookAt');
    const stage = document.querySelector<HTMLElement>('#stage')!;
    Object.defineProperties(stage, { clientWidth: { value: 800 }, clientHeight: { value: 600 } });
    const s = catchArrow();
    expect(vi.mocked(attachGesture).mock.calls.at(-1)![2]()).toBe(false);
    const camera = look.mock.contexts.at(-1) as PerspectiveCamera;
    const h = s.actors[s.handler].pos;
    const origin = new Vector3(h.x, 1, h.z).project(camera), rim = new Vector3(0, 3.05, 0).project(camera);
    const dx = (rim.x - origin.x) * 400, dy = (origin.y - rim.y) * 300, len = Math.hypot(dx, dy);
    gesture({ type: 'start' });
    now += 100;
    gesture({ type: 'drag', dx: dx / len * 80, dy: dy / len * 80 });
    expect(s.phase).toBe('driving');
    expect(s.arrowMeter).toBeNull();
  });
  it('pausiert den Pfeil und verwirft einen noch unbestätigten Tipp beim Menüöffnen', () => {
    const s = catchArrow();
    gesture({ type: 'start' });
    mode.setPaused!(true);
    const snapshot = JSON.stringify(s);
    advance(5);
    expect(JSON.stringify(s)).toBe(snapshot);
    mode.setPaused!(false);
    gesture({ type: 'tap' });
    expect(s.phase).toBe('decision');
    expect(s.arrowMeter!.fill).toBeNull();
  });
  it('verliert nach einem 500-ms-Frameaussetzer keine Pfeil-Echtzeit', () => {
    const s = catchArrow(), before = s.realTime;
    now += 500;
    frame(now);
    expect(s.realTime - before).toBeCloseTo(.5, 8);
    expect(parseFloat(document.querySelector<HTMLElement>('.hud-arrow')!.style.bottom))
      .toBeCloseTo((s.realTime - s.arrowMeter!.startTime) * 1000 / s.arrowMeter!.meterMs / MAX_FILL * 100, 8);
  });
  it('erlaubt den Lob-Tipp während des Passflugs und unterdrückt hold derselben Berührung', () => {
    mode.apply({ ...DEFAULTS, mode: 'play', play: 'inbound', defenseRandom: false });
    advance(1.3);
    const s = state(), c = vi.mocked(step).mock.calls.at(-1)![2];
    command(s, { kind: 'pass', to: 'r50' }, c, () => 1);
    for (let i = 0; i < 120 && s.realTime < s.arrowMeter!.startTime; i++) advance(1 / 60);
    expect(s.phase).toBe('passing');
    expect(vi.mocked(attachGesture).mock.calls.at(-1)![2]()).toBe(false);
    gesture({ type: 'start' });
    now += 200;
    gesture({ type: 'hold' });
    expect(s.phase).toBe('passing');
    gesture({ type: 'tap' });
    expect(s.arrowMeter!.fill).not.toBeNull();
    for (let i = 0; i < 120 && s.handler === 'r3'; i++) advance(1 / 60);
    expect(s.handler).toBe('r50');
    expect(s.phase).toBe('ballflight');
    expect(document.querySelector<HTMLElement>('.hud-mark')!.hidden).toBe(false);
  });
  it('verwendet nach 500 ms Frameaussetzer dieselbe Echtzeit für Kombianzeige und Release', () => {
    advance(2.3);
    gesture({ type: 'start' });
    now += 200;
    gesture({ type: 'hold' });
    const meterMs = state().combo!.meterMs;
    vi.mocked(step).mockClear();
    now += 500;
    frame(now);
    const fill = document.querySelector<HTMLElement>('.hud-fill')!;
    const displayed = fill.style.height;
    expect(parseFloat(displayed)).toBeCloseTo(500 / meterMs / MAX_FILL * 100, 8);
    const intervals = vi.mocked(step).mock.calls.map(call => call[1]);
    expect(intervals.reduce((a, b) => a + b, 0)).toBeCloseTo(.5, 10);
    expect(intervals.every(dt => dt <= .05)).toBe(true);
    gesture({ type: 'release', holdMs: 700, angleDeg: 0 });
    frame(now);
    expect(state().phase).toBe('ballflight');
    expect(fill.style.height).toBe(displayed);
    expect(document.querySelector<HTMLElement>('.hud-mark')!.style.bottom).toBe(displayed);
  });

  function aiShootWindow(): number {
    const create = actualEngine.createPlayState;
    vi.mocked(createPlayState).mockImplementationOnce((play, c, rng) => {
      const fixture = structuredClone(play), end = fixture.segments[fixture.start].decisionAt!;
      for (const v of fixture.variants) for (const id of Object.keys(v.defPaths[fixture.start])) {
        // Nur die KI-Wahl isolieren; Engine, Fenster und Zeitmodell laufen unverändert.
        v.defPaths[fixture.start][id] = [{ t: 0, x: id === 'b1' ? 0 : 7,
          z: id === 'b1' ? 5 : 12, act: 'defend' }, { t: end, x: id === 'b1' ? 0 : 7,
          z: id === 'b1' ? 5 : 12, act: 'defend' }];
      }
      return create(fixture, c, rng);
    });
    mode.restart!();
    for (let i = 0; i < 300 && state().phase !== 'decision'; i++) advance(1 / 60);
    expect(state().phase).toBe('decision');
    const c = vi.mocked(step).mock.calls.at(-1)![2];
    expect(c.decisionLead).toBe(2.5);
    return (PLAYS.pnr.segments.setup.decisionAt! - state().gameT) / (c.slowmo * c.animSpeed);
  }

  it('verliert bei langen Frames kein Entscheidungsfenster und pausiert Spielzeit und Echtzeit im Menü', () => {
    const remaining = aiShootWindow();
    advance(remaining - .5);
    const before = state().clock, snapshot = JSON.stringify(state());
    expectDecisionMarkers();
    mode.setPaused!(true);
    now += 5000;
    frame(now);
    expect(JSON.stringify(state())).toBe(snapshot);
    mode.setPaused!(false);
    now += 1000;
    frame(now);
    expect(state().phase).toBe('decision');
    expect(document.querySelector('.phud-markers')!.children).toHaveLength(1);
    expect(document.querySelector('.phud-m-shoot')).not.toBeNull();
    expect(state().clock).toBeCloseTo(before - DEFAULTS.slowmo, 8);
    gesture({ type: 'start' });
    gesture({ type: 'hold' });
    const meterMs = state().combo!.meterMs;
    now += 500;
    frame(now);
    expect(parseFloat(document.querySelector<HTMLElement>('.hud-fill')!.style.height))
      .toBeCloseTo(500 / meterMs / MAX_FILL * 100, 8);
  });

  it('startet die Kombianzeige bei verspätetem hold am ursprünglichen Schwellenzeitpunkt', () => {
    advance(2.3);
    gesture({ type: 'start' });
    const startedAt = now + 200;
    now += 700;
    gesture({ type: 'hold', startedAt });
    frame(now);
    expect(parseFloat(document.querySelector<HTMLElement>('.hud-fill')!.style.height))
      .toBeCloseTo(500 / state().combo!.meterMs / MAX_FILL * 100, 8);
    gesture({ type: 'release', holdMs: 700, angleDeg: 0 });
    expect(state().phase).toBe('ballflight');
  });

  it.each([[99, 'ballflight'], [100, 'ended'], [101, 'ended']] as const)(
    'wertet Release nach %s ms zwischen Frames nur strikt vor Uhrablauf (%s)', (elapsed, phase) => {
      advance(2.3);
      gesture({ type: 'start' });
      gesture({ type: 'hold' });
      state().clock = .1 * DEFAULTS.slowmo;
      now += elapsed;
      gesture({ type: 'release', holdMs: 200 + elapsed, angleDeg: 0 });
      expect(state().phase).toBe(phase);
      if (phase === 'ended') {
        expect(state().clock).toBe(0);
        expect(state().banner).toBe('ZEIT ABGELAUFEN');
        expect(state().points).toBe(0);
      }
    });

  it.each([
    { type: 'start' }, { type: 'hold' }, { type: 'tap' }, { type: 'cancel' },
    { type: 'flick', dx: 100, dy: 0, holdMs: 101 },
  ] satisfies GestureEvent[])('schreibt vor $type die Simulation bis zur Eingabe fort', event => {
    advance(2.3);
    state().clock = .1 * DEFAULTS.slowmo;
    now += 101;
    gesture(event);
    expect(state().phase).toBe('ended');
    expect(state().banner).toBe('ZEIT ABGELAUFEN');
  });

  it.each(['intro', 'running', 'passing', 'combo', 'ballflight', 'freethrows'] as const)(
    'zeigt in %s einen weißen Positionsring und den Spielerpfeil', phase => {
      mode.setPaused!(true);
      state().phase = phase;
      advance(1 / 60);
      const ring = document.querySelector<HTMLElement>('.phud-ring')!;
      const arrow = document.querySelector<HTMLElement>('.phud-handler')!;
      expect(ring.hidden).toBe(false);
      expect(ring.style.borderColor).toBe('white');
      expect(arrow.hidden).toBe(false);
      expect(arrow.textContent).toBe('▼');
    });
  it.each(['decision', 'driving', 'takeoff'] as const)(
    'behält in %s die Positionsfarbe am sichtbaren Ring', phase => {
      mode.setPaused!(true);
      state().phase = phase;
      advance(1 / 60);
      const ring = document.querySelector<HTMLElement>('.phud-ring')!;
      expect(ring.hidden).toBe(false);
      expect(ring.style.borderColor).not.toBe('');
      expect(ring.style.borderColor).not.toBe('white');
    });
  it('lässt Ring und Spielerpfeil nach einem Pass dem handler folgen und projiziert den Pfeil über dem Kopf', () => {
    const lookAt = vi.spyOn(PerspectiveCamera.prototype, 'lookAt');
    const stage = document.querySelector<HTMLElement>('#stage')!;
    Object.defineProperties(stage, { clientWidth: { value: 800 }, clientHeight: { value: 600 } });
    const projected = (x: number, y: number, z: number) => {
      const camera = lookAt.mock.contexts.at(-1) as PerspectiveCamera;
      const v = new Vector3(x, y, z).project(camera);
      const f = v.z > 1 ? -1 : 1;
      return `translate(${(v.x * f + 1) / 2 * 800}px, ${(1 - v.y * f) / 2 * 600}px)`;
    };
    const checkPositions = () => {
      const h = state().actors[state().handler];
      expect(document.querySelector<HTMLElement>('.phud-ring')!.style.transform).toBe(projected(h.pos.x, 0, h.pos.z));
      expect(document.querySelector<HTMLElement>('.phud-handler')!.style.transform)
        .toBe(projected(h.pos.x, h.y + ACTORS[h.id].heightM + .35, h.pos.z));
    };
    advance(2.3);
    expect(state().phase).toBe('decision');
    checkPositions();
    const shoot = document.querySelector<HTMLElement>('.phud-m-shoot')!;
    const arrow = document.querySelector<HTMLElement>('.phud-handler')!;
    expect(parseFloat(shoot.style.transform.split(',')[1]))
      .toBeLessThan(parseFloat(arrow.style.transform.split(',')[1]) - 32);
    const before = document.querySelector<HTMLElement>('.phud-handler')!.style.transform;
    const cfg = vi.mocked(step).mock.calls.at(-1)![2];
    command(state(), { kind: 'pass', to: 'r50' }, cfg, () => 1);
    advance(1 / 60);
    expect(state().phase).toBe('passing');
    expect(document.querySelector<HTMLElement>('.phud-ring')!.style.borderColor).toBe('white');
    checkPositions();
    for (let i = 0; i < 120 && state().phase === 'passing'; i++) advance(1 / 60);
    expect(state().handler).toBe('r50');
    expect(document.querySelector<HTMLElement>('.phud-handler')!.style.transform).not.toBe(before);
    checkPositions();
    mode.setPaused!(true);
    state().phase = 'freethrows';
    state().freeThrows = { shooter: state().handler, left: 2 };
    state().actors[state().handler].y = .6;
    advance(1 / 60);
    checkPositions();
    expect(document.querySelector<HTMLElement>('.phud-ring')!.style.borderColor).toBe('white');
  });
  it('blendet Positionsring und Spielerpfeil in ended aus', () => {
    mode.setPaused!(true);
    advance(1 / 60);
    state().phase = 'ended';
    mode.apply({ ...DEFAULTS, mode: 'play', play: 'pnr', defenseRandom: false }); // pausiertes Bild gezielt invalidieren
    advance(1 / 60);
    expect(document.querySelector<HTMLElement>('.phud-ring')!.hidden).toBe(true);
    expect(document.querySelector<HTMLElement>('.phud-handler')!.hidden).toBe(true);
  });
  it('pausiert Spielzeit und Fristen bei offenem Menü und startet nach Spielzugwechsel pausiert neu', () => {
    advance(1);
    mode.setPaused!(true);
    const snapshot = JSON.stringify(state()), calls = vi.mocked(step).mock.calls.length;
    advance(5);
    expect(JSON.stringify(state())).toBe(snapshot);
    expect(vi.mocked(step).mock.calls).toHaveLength(calls);
    mode.apply({ ...DEFAULTS, mode: 'play', play: 'inbound', defenseRandom: false });
    expect(state().play.id).toBe('inbound');
    advance(3);
    expect(state().phase).toBe('intro');
    mode.setPaused!(false);
    advance(1);
    expect(state().phase).not.toBe('intro');
  });
  it('verwirft eine aktive Geste beim Menüöffnen und kann danach erneut gestartet werden', () => {
    advance(2.3);
    gesture({ type: 'start' });
    gesture({ type: 'hold' });
    expect(state().phase).toBe('combo');
    mode.setPaused!(true);
    expect(state().fingerDown).toBe(false);
    expect(state().phase).toBe('decision');
    mode.setPaused!(false);
    gesture({ type: 'start' });
    gesture({ type: 'hold' });
    now += state().combo!.meterMs;
    gesture({ type: 'release', holdMs: 200 + state().combo!.meterMs, angleDeg: 0 });
    expect(state().phase).toBe('ballflight');
  });
  it('kehrt bei Abbruch an den Entscheidungspunkt zurück und rechnet die Halteschwelle einmal ab', () => {
    advance(2.3);
    gesture({ type: 'start' }); gesture({ type: 'hold' }); gesture({ type: 'cancel' });
    expect(state().phase).toBe('decision');
    gesture({ type: 'start' }); gesture({ type: 'hold' });
    const meter = state().combo!.meterMs;
    now += meter;
    gesture({ type: 'release', holdMs: meter + 200, angleDeg: 0 });
    advance(4);
    expect(state().points).toBeGreaterThanOrEqual(2);
  });
  it('entfernt Optionsmarker nach der Entscheidung aus dem sichtbaren HUD', () => {
    advance(2.3);
    const markers = document.querySelector('.phud-markers')!;
    expect(markers.children.length).toBeGreaterThan(0);
    gesture({ type: 'start' }); gesture({ type: 'hold' });
    advance(1 / 60);
    expect(markers.children).toHaveLength(0);
  });
  function expectDecisionMarkers(): void {
    const teammates = Object.values(state().actors).filter(a => ACTORS[a.id].team === 'off' && a.id !== state().handler);
    const markers = document.querySelector('.phud-markers')!;
    // Werfen + Ziehen + jeder Mitspieler, auch die zusätzlichen Passziele.
    expect(markers.children).toHaveLength(2 + teammates.length);
    expect(markers.querySelectorAll('.phud-m-shoot')).toHaveLength(1);
    expect(markers.querySelectorAll('.phud-m-drive')).toHaveLength(1);
    expect([...markers.querySelectorAll('.phud-m-pass b')].map(label => label.textContent).sort())
      .toEqual(teammates.map(a => `#${ACTORS[a.id].num}`).sort());
  }
  it('zeigt erst am Wegende nach KI-Werfen nur noch den verbindlichen Wurfmarker', () => {
    const remaining = aiShootWindow();
    advance(remaining - .1);
    expectDecisionMarkers();
    advance(.2);
    expect(state().phase).toBe('decision');
    const markers = document.querySelector('.phud-markers')!;
    expect(markers.children).toHaveLength(1);
    expect(markers.firstElementChild!.classList.contains('phud-m-shoot')).toBe(true);
    const c = vi.mocked(step).mock.calls.at(-1)![2];
    expect(command(state(), { kind: 'pass', to: 'r11' }, c, () => 1)).toEqual([]);
    expect(command(state(), { kind: 'drive', lane: 0 }, c, () => 1)).toEqual([]);
    gesture({ type: 'start' }); gesture({ type: 'hold' });
    expect(state().phase).toBe('combo');
  });
  it('hält Wurfanzeige und Loslass-Markierung bis zum Ergebnis sichtbar und eingefroren', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    advance(2.3);
    mode.apply({ ...DEFAULTS, mode: 'play', play: 'pnr', defenseRandom: false, animSpeed: .5 });
    gesture({ type: 'start' }); gesture({ type: 'hold' });
    const comboStartedAt = now;
    advance(1 / 60);
    const meter = document.querySelector<HTMLElement>('#hud-meter')!;
    const fill = meter.querySelector<HTMLElement>('.hud-fill')!;
    const mark = meter.querySelector<HTMLElement>('.hud-mark')!;
    now = comboStartedAt + state().combo!.meterMs * .6;
    gesture({ type: 'release', holdMs: 200 + state().combo!.meterMs * .6, angleDeg: 0 });
    advance(1 / 60);
    const releasedHeight = fill.style.height, releasedBottom = mark.style.bottom;
    expect(parseFloat(releasedHeight)).toBeCloseTo(.6 / MAX_FILL * 100, 8);
    expect(releasedBottom).toBe(releasedHeight);
    advance(1.6);
    vi.advanceTimersByTime(1600);
    expect(state().phase).toBe('ballflight');
    expect(meter.hidden).toBe(false);
    expect(mark.hidden).toBe(false);
    expect(fill.style.height).toBe(releasedHeight);
    expect(mark.style.bottom).toBe(releasedBottom);
    mode.setPaused!(true);
    advance(1);
    expect(meter.hidden).toBe(false);
    expect(mark.hidden).toBe(false);
    expect(fill.style.height).toBe(releasedHeight);
    mode.setPaused!(false);
    for (let i = 0; i < 600 && state().phase === 'ballflight'; i++) advance(1 / 60);
    expect(state().phase).not.toBe('ballflight');
    expect(meter.hidden).toBe(true);
    expect(mark.hidden).toBe(true);
  });
  it('übernimmt die aim-Mittelachse unter 0,5 m auch in die gerenderte Kamera', () => {
    const lookAt = vi.spyOn(PerspectiveCamera.prototype, 'lookAt');
    mode.apply({ ...DEFAULTS, mode: 'play', play: 'pnr', defenseRandom: false, camera: 'low' });
    mode.setPaused!(true);
    state().actors[state().handler].pos = { x: -.2, z: .3 };
    advance(1 / 60);
    const camera = lookAt.mock.contexts.at(-1) as PerspectiveCamera;
    expect(camera.position.x).toBe(0);
    expect(camera.position.z).toBeCloseTo(Math.hypot(.2, .3) + 7.5, 8);
    expect(camera.position.y).toBeCloseTo(4.2, 8);
  });
  it('hält das Ergebnis genau zwei aktive Sekunden und entsorgt Gesten beim Stoppen', () => {
    state().phase = 'ended';
    // Das End-Ereignis wird wie aus der Engine zugestellt.
    vi.mocked(step).mockReturnValueOnce([{ type: 'end', verdict: 'VERLOREN' }]);
    advance(1 / 60);
    const before = vi.mocked(createPlayState).mock.calls.length;
    advance(1);
    mode.setPaused!(true); advance(5); mode.setPaused!(false);
    expect(vi.mocked(createPlayState).mock.calls).toHaveLength(before);
    advance(1.1);
    expect(vi.mocked(createPlayState).mock.calls).toHaveLength(before + 1);
    const detach = vi.mocked(attachGesture).mock.results.at(-1)!.value;
    mode.stop();
    expect(detach).toHaveBeenCalled();
    expect(document.querySelector('#stage')).toBeNull();
  });
});

describe('Replay-Schild und Foul-Texte', () => {
  it('blendet das Replay-Schild per CSS aus, solange kein Replay läuft', async () => {
    const { readFileSync } = await import('node:fs');
    const css = readFileSync('src/style.css', 'utf8');
    expect(css).toMatch(/\.replay-badge\[hidden\]\s*\{\s*display:\s*none/);
  });
});
