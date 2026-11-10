import * as THREE from "three";
import { FOUL_MULT, INFLUENCE, type Settings } from "../settings";
import { MAX_FILL, type ShotResult } from "../shot/resolve";
import { attachGesture, type GestureEvent } from "../input/gesture";
import { createScene } from "../render/scene";
import { createPixelRenderer } from "../render/pixel";
import { overviewPose, playCameraPose } from "../render/camera-pose";
import { createActors, type ActorView } from "../render/actors";
import { buildAtlas } from "../figure/atlas";
import type { Look } from "../figure/raster";
import { ACTORS } from "../play/teams";
import { PLAYS } from "../play/plays";
import type { Option, PlayId } from "../play/types";
import { command, createPlayState, step, type ArrowMeter, type EngineConfig, type EngineEvent, type PlayState } from "../play/engine";
import { positionValue } from "../play/position";
import { laneFromAngle, passQuality, pickTargetWithAngle, type ScreenTarget } from "../play/pass";
import { createHud } from "../ui/hud";
import { createPlayHud, formatPlayClock, type Marker } from "../ui/play-hud";
import type { Mode } from "./mode";

const HOLD_MS = 200; // ab hier gilt die Geste als Wurf statt als Kurzwisch
const NEXT_PLAY_S = 2;
const CAM_SETTLE_S = 0.4; // nach Ballwechsel: Kamera erst auf die neue Achse fahren lassen
const PLAY_IDS = Object.keys(PLAYS) as PlayId[];

function seeded(seed: number): () => number {
  // mulberry32: fester Ablauf, wenn der Verteidigungs-Zufall aus ist
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function startPlayLab(app: HTMLElement, initial: Settings): Mode {
  const root = document.createElement("div");
  root.className = "play-lab";
  app.append(root);
  const stage = document.createElement("div");
  stage.id = "stage";
  root.append(stage);

  let settings = initial;
  const { scene, ball, updateNet } = createScene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  const px = createPixelRenderer(stage);
  const looks: Record<string, Look> = {};
  for (const a of Object.values(ACTORS)) looks[a.id] = { heightM: a.heightM, build: a.build, skin: a.skin, hair: a.hair, jersey: a.jersey, shorts: a.shorts, num: a.num };
  const atlas = buildAtlas(looks);
  const actors = createActors(scene, atlas, Object.keys(ACTORS));
  const hud = createHud(root);
  const phud = createPlayHud(root);
  const statsEl = root.querySelector<HTMLElement>("#hud-stats")!;
  const stats: Record<string, { tries: number; points: number; turnovers: number }> = {};

  const cfg = (): EngineConfig => ({
    decisionLead: 1,
    slowmo: settings.slowmo,
    decisionS: settings.decisionS,
    animSpeed: settings.animSpeed,
    foulMult: FOUL_MULT[settings.fouls],
    zoneFloor: settings.zoneFloor,
    tempoSpread: settings.tempoSpread,
    passDelayMax: settings.passDelayMax,
    closeoutRandom: settings.closeoutRandom,
    shot: { meterMs: settings.meterMs, greenZone: settings.greenZone, aimDeg: settings.aimDeg, influence: INFLUENCE[settings.influence] },
    finish: { meterMs: settings.finishMeterMs, greenZone: settings.finishGreen, aimDeg: settings.finishAim },
  });

  let rng: () => number = Math.random;
  let s!: PlayState;
  let options: Option[] = [];
  let comboT0: number | null = null; // Echtzeit-Start der sichtbaren Anzeige
  let releasedFill: number | null = null;
  let arrowTouch: ArrowMeter | null = null;
  let endedAt: number | null = null;
  let menuOpen = false;
  let camHold = 0; // Sekunden, in denen nach einem Ballwechsel keine Kombi startet
  let lastHandler = "";
  let raf = 0;
  let last = performance.now();
  let lastFrame = last;
  let activeNow = 0;
  let detach = () => {};
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  let camInit = false;

  function showStats(): void {
    const st = stats[s.play.id];
    statsEl.textContent = st ? `${s.play.name}: ${st.points} Pkt / ${st.tries} Versuche · ${st.turnovers} BV` : s.play.name;
  }

  function newPlay(): void {
    rng = settings.defenseRandom ? Math.random : seeded(7);
    const id = settings.play === "random" ? PLAY_IDS[Math.min(PLAY_IDS.length - 1, Math.floor(rng() * PLAY_IDS.length))] : settings.play;
    s = createPlayState(PLAYS[id], cfg(), rng);
    options = [];
    comboT0 = releasedFill = endedAt = null;
    arrowTouch = null;
    lastHandler = s.handler;
    camHold = 0;
    camInit = false;
    detach();
    detach = menuOpen ? () => {} : attach();
    hud.setMeter(null, { g: 0, a: 0 }, MAX_FILL);
    phud.setMarkers([]);
    phud.setSituation(`4. VIERTEL · ${formatPlayClock(s.clock, false)} · −${s.deficit}`, s.play.name);
    phud.setScoreboard(s.clock, s.deficit, s.points);
    showStats();
  }

  function screen(x: number, y: number, z: number): { x: number; y: number } {
    const v = new THREE.Vector3(x, y, z).project(camera);
    // Punkte hinter der Kamera spiegeln, damit die Richtung für Randpfeile stimmt
    const f = v.z > 1 ? -1 : 1;
    return { x: ((v.x * f + 1) / 2) * stage.clientWidth, y: ((1 - v.y * f) / 2) * stage.clientHeight };
  }

  function handle(events: EngineEvent[]): void {
    for (const e of events) {
      if (e.type === "decision") options = e.options;
      else if (e.type === "arrowStart") {
        comboT0 = releasedFill = null;
        hud.setMeter(null, { g: 0, a: 0 }, MAX_FILL);
      } else if (e.type === "arrowTap") hud.markRelease(e.fill, true);
      else if (e.type === "arrowEnd") hud.setMeter(null, { g: 0, a: 0 }, MAX_FILL);
      else if (e.type === "pass" || e.type === "caught") options = [];
      else if (e.type === "pocket") {
        if (e.quality >= .9) phud.flash("IN DIE POCKET!");
        else if (e.quality <= .4) phud.flash("UNGENAU");
      }
      else if (e.type === "takeoff") {
        options = [];
        if (e.kind === "contact_dunk") phud.flash("POSTER?");
        else if (e.kind === "dunk") phud.flash("DUNK!");
      } else if (e.type === "combo") {
        if (e.fouled) phud.flash("KONTAKT!");
      } else if (e.type === "result") {
        hud.showResult({ banner: e.banner, hint: "", made: e.made } as ShotResult);
        comboT0 = null;
      } else if (e.type === "freethrow") {
        phud.flash(e.left === 1 ? "LETZTER FREIWURF" : `${e.left} FREIWÜRFE`);
        releasedFill = null;
      } else if (e.type === "end") {
        options = [];
        const st = (stats[s.play.id] ??= { tries: 0, points: 0, turnovers: 0 });
        st.tries++;
        st.points += s.points;
        st.turnovers += s.turnovers;
        showStats();
        hud.showResult({ banner: e.verdict, hint: s.banner ?? "", made: e.verdict !== "VERLOREN" } as ShotResult);
        endedAt = activeNow;
      }
    }
  }

  function onGesture(e: GestureEvent): void {
    if (menuOpen) return;
    const now = performance.now();
    const inputAt = e.type === "hold" ? Math.min(now, e.startedAt ?? now) : now;
    advanceTo(inputAt);
    if (s.phase === "ended") return;
    const c = cfg();
    if (e.type === "start") {
      handle(command(s, { kind: "finger", down: true }, c, rng));
      arrowTouch = s.arrowMeter?.fill === null && s.realTime >= s.arrowMeter.startTime ? s.arrowMeter : null;
      return;
    }
    if (arrowTouch) {
      // Erst beim Loslassen unterscheiden wir Tipp und Kurzwisch. Die Engine hat
      // Zeitpunkt und P bereits beim Aufsetzen gesichert, auch über das Laufende hinaus.
      if (e.type === "hold") { advanceTo(now); return; }
      const flick = e.type === "flick" && arrowTouch.kind === "catchshoot";
      if (e.type === "tap" && arrowTouch === s.arrowMeter) handle(command(s, { kind: "tap" }, c, rng));
      arrowTouch = null;
      if (!flick) {
        handle(command(s, { kind: "finger", down: false }, c, rng));
        return;
      }
    }
    if (e.type === "hold") {
      const canCombo =
        (s.phase === "decision" && options.some((o) => o.kind === "shoot")) || s.phase === "takeoff" || s.phase === "freethrows" || s.phase === "combo";
      if (canCombo && camHold <= 0) {
        handle(command(s, { kind: "comboStart" }, c, rng));
        if (s.phase !== "combo") return;
        comboT0 = activeNow - Math.max(0, last - inputAt);
        releasedFill = null;
      }
      advanceTo(now);
      return;
    }
    if (e.type === "flick" && s.phase === "decision" && !s.combo) {
      const h = s.actors[s.handler];
      const origin = screen(h.pos.x, 1, h.pos.z);
      const targets: ScreenTarget[] = [];
      for (const o of options) {
        if (o.kind === "pass" && o.to) {
          const a = s.actors[o.to];
          targets.push({ id: o.to, ...screen(a.pos.x, 1, a.pos.z), distM: Math.hypot(a.pos.x - h.pos.x, a.pos.z - h.pos.z) });
        } else if (o.kind === "drive") targets.push({ id: "rim", ...screen(0, 3.05, 0), distM: Math.hypot(h.pos.x, h.pos.z) });
      }
      const swipe = { dx: e.dx, dy: e.dy };
      const target = pickTargetWithAngle(origin, swipe, targets);
      if (target?.id === "rim") {
        const lane = laneFromAngle(target.angleDeg);
        handle(command(s, { kind: "drive", lane }, c, rng));
      } else if (target) handle(command(s, { kind: "pass", to: target.id, quality: passQuality(target.angleDeg) }, c, rng));
    } else if (e.type === "release" && s.combo && comboT0 !== null) {
      const holdMs = Math.max(0, activeNow - comboT0);
      releasedFill = Math.min(holdMs / s.combo.meterMs, MAX_FILL);
      hud.markRelease(releasedFill, true);
      handle(command(s, { kind: "comboRelease", holdMs, angleDeg: e.angleDeg }, c, rng));
    } else if (e.type === "cancel" || e.type === "tap") {
      comboT0 = null;
    }
    // Loslassen wird zuerst ausgewertet; ohne Release bedeutet Finger-Ende einen Abbruch.
    handle(command(s, { kind: "finger", down: false }, c, rng));
  }
  const attach = () => attachGesture(stage, onGesture,
    () => {
      if (menuOpen) return true;
      advanceTo(performance.now());
      if (s.arrowMeter?.fill === null && s.realTime >= s.arrowMeter.startTime) return false;
      return camHold > 0 || !["decision", "takeoff", "freethrows", "combo"].includes(s.phase);
    },
    { flicks: true, holdThresholdMs: HOLD_MS });

  const resize = () => px.resize(settings.pixelHeight, camera);

  // Dieselbe pausierbare Echtzeit treibt Anzeige, Release und Engine-Fristen.
  function advanceTo(now: number): void {
    let left = Math.max(0, now - last);
    last = Math.max(last, now);
    if (menuOpen) return;
    const c = cfg();
    while (left > 1e-8) {
      const ms = Math.min(50, left), dt = ms / 1000;
      activeNow += ms;
      if (endedAt !== null) {
        if ((activeNow - endedAt) / 1000 >= NEXT_PLAY_S) newPlay();
      } else handle(step(s, dt, c, rng));
      camHold = Math.max(0, camHold - dt);
      if (s.handler !== lastHandler) {
        lastHandler = s.handler;
        camHold = CAM_SETTLE_S;
      }
      left -= ms;
    }
  }

  function frame(now: number): void {
    const dt = Math.max(0, (now - lastFrame) / 1000);
    lastFrame = now;
    advanceTo(now);

    // Entscheidungen rahmen alle Optionen ein; Kombis und Abschlüsse bleiben tief.
    const h = s.actors[s.handler];
    const catchArrow = s.arrowMeter?.kind === "catchshoot" && s.arrowMeter.fill === null;
    const aimPhase = s.phase === "combo" || s.phase === "takeoff" || s.phase === "ballflight" || s.phase === "freethrows" || catchArrow;
    const view = settings.camera === "low" || aimPhase ? "aim" : "wide";
    const targets = options.filter(o => o.kind === "pass" && o.to).map(o => s.actors[o.to!].pos);
    // Auch bei fehlenden Passzielen bleibt das Catch-and-Shoot-Pfeil-Meter tief.
    const overview = settings.camera !== "low" && s.phase === "decision" && !catchArrow;
    const pose = overview ? overviewPose(h.pos, targets, camera.aspect) : playCameraPose(view, h.pos);
    const k = !camInit || overview ? 1 : 1 - Math.exp(-(menuOpen ? 0 : dt) * 9);
    camInit = true;
    // Die Übersicht kann auf der Schwerpunktachse stehen; der Wurf folgt der Korbachse.
    const len = Math.hypot(pose.pos.x, pose.pos.z), ux = len > 0 ? pose.pos.x / len : 0, uz = len > 0 ? pose.pos.z / len : 1;
    const radius = THREE.MathUtils.lerp(Math.hypot(camPos.x, camPos.z), Math.hypot(pose.pos.x, pose.pos.z), k);
    const lookRadius = THREE.MathUtils.lerp(Math.hypot(camLook.x, camLook.z), Math.hypot(pose.look.x, pose.look.z), k);
    camPos.set(ux * radius, THREE.MathUtils.lerp(camPos.y, pose.pos.y, k), uz * radius);
    camLook.set(ux * lookRadius, THREE.MathUtils.lerp(camLook.y, pose.look.y, k), uz * lookRadius);
    camera.position.copy(camPos);
    camera.lookAt(camLook);
    if (overview || Math.abs(camera.fov - pose.fov) > 0.01) {
      camera.fov += (pose.fov - camera.fov) * k;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld(true);
    const yaw = Math.atan2(camLook.x - camPos.x, -(camLook.z - camPos.z));

    const views: ActorView[] = Object.values(s.actors).map((a) => ({ id: a.id, x: a.pos.x, y: a.y, z: a.pos.z, facing: a.facing, move: a.move, moveT: a.moveT, visible: true }));
    for (const id of Object.keys(ACTORS)) if (!s.actors[id]) views.push({ id, x: 0, y: 0, z: 0, facing: 0, move: "idle", moveT: 0, visible: false });
    actors.sync(views, yaw);
    ball.position.set(s.ball.x, s.ball.y, s.ball.z);

    // HUD
    phud.setScoreboard(s.clock, s.deficit, s.points);
    if (s.phase !== "intro") phud.setSituation(null);
    const head = screen(h.pos.x, h.y + ACTORS[h.id].heightM + 0.35, h.pos.z);
    const markers: Marker[] = [];
    if (s.phase === "decision" && !s.combo) {
      for (const o of options) {
        if (o.kind === "pass" && o.to) {
          const a = s.actors[o.to];
          markers.push({ kind: "pass", ...screen(a.pos.x, 0, a.pos.z), label: `#${ACTORS[o.to].num}` });
        } else if (o.kind === "drive") markers.push({ kind: "drive", ...screen(h.pos.x * 0.6, 0.2, h.pos.z * 0.6) });
        else markers.push({ kind: "shoot", x: head.x, y: head.y - 40 });
      }
    }
    phud.setMarkers(markers);
    const colorRing = s.phase === "decision" || s.phase === "driving" || s.phase === "takeoff";
    const showPlayer = s.phase !== "ended";
    const defenders = Object.values(s.actors)
      .filter((a) => ACTORS[a.id].team === "def")
      .map((a) => a.pos);
    const feet = screen(h.pos.x, 0, h.pos.z);
    phud.setRing(feet.x, feet.y, colorRing ? (s.combo ? s.combo.P : positionValue(h.pos, defenders)) : null, showPlayer);
    phud.setHandler(head.x, head.y, showPlayer);

    if (s.arrowMeter && s.realTime >= s.arrowMeter.startTime) {
      const meter = s.arrowMeter;
      hud.setMeter(meter.fill ?? Math.min((s.realTime - meter.startTime) * 1000 / meter.meterMs, MAX_FILL), meter.zones, MAX_FILL, true, meter.bankWindow);
    } else if (s.combo && comboT0 !== null) hud.setMeter(releasedFill ?? Math.min((activeNow - comboT0) / s.combo.meterMs, MAX_FILL), s.combo.zones, MAX_FILL, false, s.combo.bankWindow);
    else hud.setMeter(null, { g: 0, a: 0 }, MAX_FILL);

    updateNet(now);
    px.renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  addEventListener("resize", resize);
  newPlay();
  resize();
  raf = requestAnimationFrame(frame);

  return {
    apply(next) {
      const restart = next.play !== settings.play || next.defenseRandom !== settings.defenseRandom;
      settings = next;
      resize();
      if (restart) newPlay();
    },
    restart() {
      newPlay();
    },
    setPaused(p) {
      if (p === menuOpen) return;
      const now = performance.now();
      advanceTo(now);
      if (p) {
        detach();
        detach = () => {};
        arrowTouch = null;
        handle(command(s, { kind: "finger", down: false }, cfg(), rng));
        if (releasedFill === null) comboT0 = null;
      } else detach = attach();
      menuOpen = p;
      lastFrame = last = now;
    },
    stop() {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
      detach();
      actors.dispose();
      atlas.texture.dispose();
      phud.dispose();
      px.renderer.dispose();
      root.remove();
    },
  };
}
