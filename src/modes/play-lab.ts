import * as THREE from "three";
import { FOUL_MULT, INFLUENCE, type Settings } from "../settings";
import { MAX_FILL, type ShotResult } from "../shot/resolve";
import { attachGesture, type GestureEvent } from "../input/gesture";
import { createScene } from "../render/scene";
import { createGrave } from "../render/grave";
import { createPixelRenderer } from "../render/pixel";
import { finishCameraPose, overviewPose, playCameraPose } from "../render/camera-pose";
import { createActors, spriteJointWorld, type ActorView } from "../render/actors";
import { createRecorder, replayAt, REPLAY_SECONDS, type Snap } from "../render/replay";
import { buildAtlas } from "../figure/atlas";
import { ACTORS } from "../play/teams";
import { PLAYS } from "../play/plays";
import type { Option, PlayId } from "../play/types";
import { command, createPlayState, lastHint, step, type ArrowMeter, type EngineConfig, type EngineEvent, type PlayState, arrowEndFill, meterDisplayFill } from "../play/engine";
import { positionValue } from "../play/position";
import { laneFromAngle, passQuality, pickTargetWithAngle, swipeAngleTo, type ScreenTarget } from "../play/pass";
import { createHud } from "../ui/hud";
import { addPlay, boxRows, emptyGame } from "../stats/statline";
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
  const replayBadge = document.createElement("div");
  replayBadge.className = "replay-badge";
  replayBadge.hidden = true;
  replayBadge.innerHTML = "<b>● REPLAY</b><span>Tippen zum Überspringen</span>";
  root.append(replayBadge);

  let settings = initial;
  const { scene, ball, updateNet, crowd } = createScene();
  const grave = createGrave(scene);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  const px = createPixelRenderer(stage);
  let atlas: ReturnType<typeof buildAtlas>;
  let actors: ReturnType<typeof createActors>;
  let actorIds = "";
  const hud = createHud(root);
  const phud = createPlayHud(root);
  const statsEl = root.querySelector<HTMLElement>("#hud-stats")!;
  const stats: Record<string, { tries: number; points: number; turnovers: number }> = {};
  let game = emptyGame(); // Statline des laufenden Spiels (über alle Spielzüge, bis „Neues Spiel“)

  const cfg = (): EngineConfig => ({
    decisionLead: settings.decisionS,
    finishArrow: true,
    foulScene: true,
    slowmo: settings.slowmo,
    decisionS: settings.decisionS,
    animSpeed: settings.animSpeed,
    foulMult: FOUL_MULT[settings.fouls],
    finishFoulOverride: settings.finishFoulChance,
    forcePoster: settings.forcePoster,
    posterVariant: settings.posterVariant,
    blockFoulChance: settings.fouls === "off" ? 0 : 0.15, // „Fouls aus“ gilt auch für den Block
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
  let touchActive = false;
  let driveTouch = false; // Dieselbe Berührung darf nach dem Ziehen nur noch das Meter auslösen.
  let endedAt: number | null = null;
  let menuOpen = false;
  let menuPaused = false, hidden = false, dirty = true;
  let camHold = 0; // Sekunden, in denen nach einem Ballwechsel keine Kombi startet
  let lastHandler = "";
  let finishCam: ReturnType<typeof finishCameraPose> | null = null;
  // Instant Replay nach Poster-Dunk bzw. And-one: Aufzeichnung der letzten Sekunden, Wiedergabe in Zeitlupe
  const recorder = createRecorder(REPLAY_SECONDS + 1);
  let replay: { clip: Snap[]; start: number; andOne: boolean } | null = null;
  let replayPending: { andOne: boolean } | null = null;
  let blockReplayQueued = false;
  let foulJustCalled = false;
  let raf = 0;
  let last = performance.now();
  let lastFrame = 0; // aktive Millisekunden des letzten gerenderten Bildes
  let activeNow = 0;
  let detach = () => {};
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  let camInit = false;
  const projection = new THREE.Vector3();
  const views: ActorView[] = [];
  const targets: { x: number; z: number }[] = [];
  const defenderPositions: { x: number; z: number }[] = [];
  const markerPool: Marker[] = [], markers: Marker[] = [];
  const head = { x: 0, y: 0 }, feet = { x: 0, y: 0 }, posterPoint = { x: 0, y: 0 };
  const noZones = { g: 0, a: 0 };
  let stageWidth = 0, stageHeight = 0;

  function showStats(): void {
    const st = stats[s.play.id];
    statsEl.textContent = st ? `${s.play.name}: ${st.points} Pkt / ${st.tries} Versuche · ${st.turnovers} BV` : s.play.name;
  }

  function newPlay(): void {
    recorder.reset();
    blockReplayQueued = false;
    rng = settings.defenseRandom ? Math.random : seeded(7);
    const id = settings.play === "random" ? PLAY_IDS[Math.min(PLAY_IDS.length - 1, Math.floor(rng() * PLAY_IDS.length))] : settings.play;
    s = createPlayState(PLAYS[id], cfg(), rng);
    // Der Schiri ist immer im Atlas, erscheint aber nur bei Fouls
    const ids = [...Object.keys(s.actors), "ref"];
    if (ids.join("|") !== actorIds) {
      actors?.dispose();
      if (atlas) (atlas.textures ?? [atlas.texture]).forEach(t => t.dispose());
      atlas = buildAtlas(Object.fromEntries(ids.map(id => [id, ACTORS[id]])), { lazy: true });
      actors = createActors(scene, atlas, ids);
      actorIds = ids.join("|");
    }
    views.length = 0;
    for (const id of ids) views.push({ id, x: 0, y: 0, z: 0, facing: 0, move: "idle", moveT: 0, visible: true });
    dirty = true;
    options = [];
    comboT0 = releasedFill = endedAt = null;
    arrowTouch = null;
    touchActive = driveTouch = false;
    lastHandler = s.handler;
    camHold = 0;
    camInit = false;
    detach();
    detach = menuOpen ? () => {} : attach();
    hud.setMeter(null, noZones, MAX_FILL);
    phud.setMarkers([]);
    phud.setFinishFeedback(null);
    phud.setPoster(0, 0, false);
    grave.sync(null);
    phud.setSituation(`4. VIERTEL · ${formatPlayClock(s.clock, false)} · −${s.deficit}`, s.play.name);
    phud.setScoreboard(s.clock, s.deficit, s.points);
    showStats();
  }

  function screen(x: number, y: number, z: number, out = { x: 0, y: 0 }): { x: number; y: number } {
    const v = projection.set(x, y, z).project(camera);
    // Punkte hinter der Kamera spiegeln, damit die Richtung für Randpfeile stimmt
    const f = v.z > 1 ? -1 : 1;
    out.x = ((v.x * f + 1) / 2) * stageWidth; out.y = ((1 - v.y * f) / 2) * stageHeight;
    return out;
  }

  function addMarker(kind: Marker["kind"], x: number, y: number, z: number, label?: string): void {
    const m = markerPool[markers.length] ??= { kind, x: 0, y: 0 };
    m.kind = kind; m.label = label; screen(x, y, z, m); markers.push(m);
  }

  function handle(events: EngineEvent[]): void {
    // Die Engine meldet die Freiwurf-Serie vor dem Pfiff; beides kommt im selben Schritt
    if (events.some((e) => e.type === "foul")) foulJustCalled = true;
    for (const e of events) {
      if (e.type === "decision") options = e.options;
      else if (e.type === "arrowStart") {
        comboT0 = releasedFill = null;
        hud.setMeter(null, noZones, MAX_FILL);
      } else if (e.type === "arrowTap") {
        hud.markRelease(e.fill, true, s.arrowMeter?.zones, s.arrowMeter ? meterDisplayFill(s.arrowMeter.kind, e.fill) : undefined);
        phud.setFinishFeedback(s.arrowMeter?.feedback ?? null);
      }
      else if (e.type === "arrowEnd") hud.setMeter(null, noZones, MAX_FILL);
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
        if (e.made) crowd?.cheer(/DUNK|POSTER/.test(e.banner) ? .9 : .6);
        if (e.made && e.banner.includes("POSTER")) replayPending ??= { andOne: false };
        if (!e.made && s.poster?.kind === 'block' && !blockReplayQueued) {
          blockReplayQueued = true;
          replayPending ??= { andOne: false };
        }
        hud.showResult({ banner: e.banner, hint: e.made ? "" : lastHint(s), made: e.made } as ShotResult);
        comboT0 = null;
      } else if (e.type === "freethrow") {
        // Direkt nach dem Pfiff steht die Anzahl schon im Banner – keine dritte Einblendung
        if (!foulJustCalled) phud.flash(e.left === 1 ? "LETZTER FREIWURF" : `${e.left} FREIWÜRFE`);
        foulJustCalled = false;
        releasedFill = null;
      } else if (e.type === "foul") {
        // Beim And-one zuerst das Replay, die Einblendung folgt danach
        if (e.andOne) replayPending = { andOne: true };
        else { phud.foulCall(false); crowd?.cheer(0.3); }
      } else if (e.type === "end") {
        addPlay(game, s.box);
        if (e.verdict === "GAMEWINNER") crowd?.cheer(1);
        options = [];
        const st = (stats[s.play.id] ??= { tries: 0, points: 0, turnovers: 0 });
        st.tries++;
        st.points += s.points;
        st.turnovers += s.turnovers;
        showStats();
        hud.showResult({ banner: e.verdict, hint: [s.banner, lastHint(s)].filter(Boolean).join(" · "), made: e.verdict !== "VERLOREN" } as ShotResult);
        endedAt = activeNow;
      }
    }
  }

  function swipeTarget(dx: number, dy: number): ReturnType<typeof pickTargetWithAngle> {
    const h = s.actors[s.handler], origin = screen(h.pos.x, 1, h.pos.z);
    const targets: ScreenTarget[] = [];
    for (const o of options) {
      if (o.kind === "pass" && o.to) {
        const a = s.actors[o.to];
        targets.push({ id: o.to, ...screen(a.pos.x, 1, a.pos.z), distM: Math.hypot(a.pos.x - h.pos.x, a.pos.z - h.pos.z) });
      }
    }
    return pickTargetWithAngle(origin, { dx, dy }, targets);
  }

  function endTouch(): void {
    arrowTouch = null;
    touchActive = driveTouch = false;
    handle(command(s, { kind: "finger", down: false }, cfg(), rng));
  }

  function onGesture(e: GestureEvent): void {
    if (menuOpen || replay) return;
    const now = performance.now();
    const inputAt = e.type === "hold" ? Math.min(now, e.startedAt ?? now) : now;
    advanceTo(inputAt);
    if (s.phase === "ended") return;
    const c = cfg();
    if (e.type === "start") {
      touchActive = true;
      driveTouch = false;
      arrowTouch = s.arrowMeter?.fill === null ? s.arrowMeter : null;
      handle(command(s, { kind: "finger", down: true }, c, rng));
      return;
    }
    if (!touchActive) return;
    // Ein bereits aufliegender Finger gehört auch zum später gestarteten Meter.
    if (!arrowTouch && s.arrowMeter?.fill === null) arrowTouch = s.arrowMeter;
    if (e.type === "drag") {
      if (!driveTouch && s.phase === "decision" && !s.combo && Math.hypot(e.dx, e.dy) >= 60
        && (!arrowTouch || arrowTouch.kind === "catchshoot")) {
        const h = s.actors[s.handler].pos;
        const angle = swipeAngleTo(screen(h.x, 1, h.z), screen(0, 3.05, 0), e);
        handle(command(s, { kind: "drive", lane: laneFromAngle(angle) }, c, rng));
        if (s.phase !== "decision") { driveTouch = true; arrowTouch = null; }
      }
      return;
    }
    if (arrowTouch) {
      if (e.type === "hold") { advanceTo(now); return; }
      const flick = e.type === "flick" && arrowTouch.kind === "catchshoot" && !driveTouch;
      // Beim durchgehenden Ziehen ist der ursprüngliche Wisch bereits konsumiert.
      const release = e.type === "tap" || (driveTouch && (e.type === "flick" || e.type === "release"));
      if (release && arrowTouch === s.arrowMeter) handle(command(s, { kind: "tap" }, c, rng));
      if (!flick) {
        endTouch();
        return;
      }
    }
    if (driveTouch) {
      if (e.type !== "hold") endTouch();
      return;
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
      const target = swipeTarget(e.dx, e.dy);
      if (target) handle(command(s, { kind: "pass", to: target.id, quality: passQuality(target.angleDeg) }, c, rng));
    } else if (e.type === "release" && s.combo && comboT0 !== null) {
      const holdMs = Math.max(0, activeNow - comboT0);
      releasedFill = Math.min(holdMs / s.combo.meterMs, MAX_FILL);
      hud.markRelease(releasedFill, true, s.combo.zones);
      handle(command(s, { kind: "comboRelease", holdMs, angleDeg: e.angleDeg }, c, rng));
    } else if (e.type === "cancel" || e.type === "tap") {
      comboT0 = null;
    }
    // Loslassen wird zuerst ausgewertet; ohne Release bedeutet Finger-Ende einen Abbruch.
    endTouch();
  }
  const attach = () => attachGesture(stage, onGesture,
    () => {
      if (menuOpen) return true;
      advanceTo(performance.now());
      if (s.arrowMeter?.fill === null) return false;
      return camHold > 0 || !["decision", "takeoff", "freethrows", "combo"].includes(s.phase);
    },
    { flicks: true, holdThresholdMs: HOLD_MS });

  const resize = () => { px.resize(settings.pixelHeight, camera); dirty = true; };

  // Dieselbe pausierbare Echtzeit treibt Anzeige, Release und Engine-Fristen.
  function advanceTo(now: number): void {
    let left = Math.max(0, now - last);
    last = Math.max(last, now);
    if (menuOpen || left > 1000) return;
    const c = cfg();
    while (left > 1e-8) {
      const ms = Math.min(50, left), dt = ms / 1000;
      activeNow += ms;
      if (endedAt !== null) {
        if ((activeNow - endedAt) / 1000 >= NEXT_PLAY_S) newPlay();
        else step(s, dt, c, rng);
      } else handle(step(s, dt, c, rng));
      camHold = Math.max(0, camHold - dt);
      if (s.handler !== lastHandler) {
        lastHandler = s.handler;
        camHold = CAM_SETTLE_S;
      }
      left -= ms;
    }
  }

  function startReplay(andOne: boolean): void {
    replay = { clip: recorder.clip(REPLAY_SECONDS), start: performance.now(), andOne };
    replayPending = null;
    replayBadge.hidden = false;
    endTouch();
    stage.addEventListener("pointerdown", skipReplay);
  }

  function skipReplay(): void {
    if (!replay) return;
    const andOne = replay.andOne;
    replay = null;
    replayBadge.hidden = true;
    stage.removeEventListener("pointerdown", skipReplay);
    recorder.reset();
    // Die Spielzeit stand während des Replays still
    last = performance.now();
    lastFrame = activeNow;
    camInit = false;
    if (andOne) { phud.foulCall(true); crowd?.cheer(0.9); }
  }

  function renderReplay(now: number): void {
    const snap = replay && replayAt(replay.clip, now - replay.start);
    if (!replay || !snap) { skipReplay(); return; }
    // Kamera kreist langsam um den Korb
    const angle = 0.9 + (now - replay.start) / 1000 * 0.22;
    camera.position.set(Math.sin(angle) * 6.5, 3.6, Math.cos(angle) * 6.5);
    camera.lookAt(0, 2.4, 0);
    camera.updateMatrixWorld(true);
    const yaw = Math.atan2(-camera.position.x, camera.position.z);
    actors.sync(snap.actors, yaw);
    ball.position.set(snap.ball.x, snap.ball.y, snap.ball.z);
    // Auch im Replay beginnen die Sterne erst nach dem Aufprall.
    const poster = snap.poster, elapsed = poster ? snap.realTime - poster.startedAt : -1;
    const down = poster ? snap.actors.find((a) => a.id === poster.victim) : undefined;
    if (poster?.variant !== 'grave' && down && down.visible && down.move === "knocked_down" && elapsed >= 0 && elapsed < 1.5) {
      const p = spriteJointWorld(down, "head", ACTORS[down.id].heightM, yaw), q = screen(p.x, p.y + .25, p.z, posterPoint);
      phud.setPoster(q.x, q.y, true, elapsed);
    } else phud.setPoster(0, 0, false);
    grave.sync(snap.grave, snap.realTime);
    updateNet(snap.t);
    crowd?.update(now);
    px.renderer.render(scene, camera);
  }

  function frame(now: number): void {
    if (replay) {
      raf = requestAnimationFrame(frame);
      renderReplay(now);
      return;
    }
    advanceTo(now);
    // Kamera und Engine verwenden dieselbe aktive Zeit, auch wenn ein Release
    // zwischen zwei Bildern bereits advanceTo() aufgerufen hat. Pausen und
    // verworfene Hintergrundzeit bewegen damit auch die Kamera nicht weiter.
    const dt = Math.max(0, (activeNow - lastFrame) / 1000);
    lastFrame = activeNow;
    raf = requestAnimationFrame(frame);
    if (menuOpen && !dirty) return;
    dirty = false;
    stageWidth = stage.clientWidth; stageHeight = stage.clientHeight;

    // Entscheidungen rahmen alle Optionen ein; Kombis und Abschlüsse bleiben tief.
    const h = s.actors[s.handler];
    const catchArrow = s.arrowMeter?.kind === "catchshoot" && s.arrowMeter.fill === null;
    const aimPhase = s.phase === "combo" || s.phase === "takeoff" || s.phase === "ballflight" || s.phase === "freethrows" || catchArrow;
    const view = settings.camera === "low" || aimPhase ? "aim" : "wide";
    targets.length = 0;
    for (const o of options) if (o.kind === "pass" && o.to) targets.push(s.actors[o.to].pos);
    // Auch bei fehlenden Passzielen bleibt das Catch-and-Shoot-Pfeil-Meter tief.
    const overview = settings.camera !== "low" && s.phase === "decision" && !catchArrow;
    // Korbleger/Dunk im Profil zeigen; Standort beim Absprung merken, weil der Spieler danach zum Ring wandert
    const finishing = aimPhase && !s.freeThrows && s.combo !== null && s.combo.kind !== "jump2" && s.combo.kind !== "three";
    if (!finishing) finishCam = null;
    else finishCam ??= finishCameraPose(h.pos);
    const pose = finishCam ?? (overview ? overviewPose(h.pos, targets, camera.aspect) : playCameraPose(view, h.pos));
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

    for (const v of views) {
      const a = s.actors[v.id];
      v.visible = Boolean(a && a.y > -ACTORS[a.id].heightM);
      if (!a) continue;
      v.x = a.pos.x; v.y = a.y; v.z = a.pos.z; v.facing = a.facing;
      v.move = a.move; v.moveT = a.moveT; v.moveSide = a.moveSide;
    }
    actors.sync(views, yaw);
    grave.sync(s.grave, s.realTime);
    ball.position.set(s.ball.x, s.ball.y, s.ball.z);

    // HUD
    phud.setScoreboard(s.clock, s.deficit, s.points);
    if (s.phase !== "intro") phud.setSituation(null);
    screen(h.pos.x, h.y + ACTORS[h.id].heightM + 0.35, h.pos.z, head);
    markers.length = 0;
    if (s.phase === "decision" && !s.combo) {
      for (const o of options) {
        if (o.kind === "pass" && o.to) {
          const a = s.actors[o.to];
          addMarker("pass", a.pos.x, 0, a.pos.z, `#${ACTORS[o.to].num}`);
        } else if (o.kind === "drive") addMarker("drive", h.pos.x * 0.6, 0.2, h.pos.z * 0.6);
        else {
          const m = markerPool[markers.length] ??= { kind: "shoot", x: 0, y: 0 };
          m.kind = "shoot"; m.x = head.x; m.y = head.y - 40; m.label = undefined; markers.push(m);
        }
      }
    }
    phud.setMarkers(markers);
    const colorRing = s.phase === "decision" || s.phase === "driving" || s.phase === "takeoff";
    const showPlayer = s.phase !== "ended";
    defenderPositions.length = 0;
    for (const v of views) if (ACTORS[v.id].team === "def") defenderPositions.push(s.actors[v.id].pos);
    screen(h.pos.x, 0, h.pos.z, feet);
    phud.setRing(feet.x, feet.y, colorRing ? (s.combo ? s.combo.P : positionValue(h.pos, defenderPositions)) : null, showPlayer);
    phud.setHandler(head.x, head.y, showPlayer);
    phud.setFinishFeedback(s.arrowMeter?.feedback ?? null);
    const poster = s.poster;
    // Auch die Endreaktionen nutzen die pausierbare Engine-Echtzeit.
    const posterElapsed = poster ? s.realTime - poster.startedAt : 0;
    const victim = poster ? views.find(v => v.id === poster.victim) : undefined;
    if (poster && poster.variant !== 'grave' && posterElapsed >= 0 && posterElapsed < 1.5 && victim?.visible && victim.move === 'knocked_down') {
      // Sterne am Kopf, wie er im Pixel-Sprite gezeichnet ist (liegend weicht er stark von der 3D-Pose ab)
      const d = victim;
      const p = spriteJointWorld(d, "head", ACTORS[d.id].heightM, yaw), projected = screen(p.x, p.y + .25, p.z, posterPoint);
      phud.setPoster(projected.x, projected.y, true, posterElapsed);
    } else phud.setPoster(0, 0, false);

    if (s.arrowMeter && s.realTime >= s.arrowMeter.startTime) {
      const meter = s.arrowMeter;
      const raw = meter.fill ?? Math.min((s.realTime - meter.startTime) * 1000 / meter.meterMs, arrowEndFill(meter.kind));
      // Abschluss-Meter: Spitze = Ideal ganz oben, danach läuft der Pfeil wieder herunter
      const peak = meter.kind !== "catchshoot";
      const bank = peak && meter.bankWindow ? { lo: 2 - Math.min(meter.bankWindow.hi, arrowEndFill(meter.kind)), hi: 2 - meter.bankWindow.lo } : meter.bankWindow;
      hud.setMeter(meterDisplayFill(meter.kind, raw), meter.zones, peak ? 1 : MAX_FILL, true, bank && bank.hi > bank.lo ? bank : null);
    } else if (s.combo && comboT0 !== null) hud.setMeter(releasedFill ?? Math.min((activeNow - comboT0) / s.combo.meterMs, MAX_FILL), s.combo.zones, MAX_FILL, false, s.combo.bankWindow);
    else hud.setMeter(null, noZones, MAX_FILL);

    if (!menuOpen) { updateNet(activeNow); crowd?.update(activeNow); }
    px.renderer.render(scene, camera);
    // Spielzeit statt Echtzeit: Zeitlupen im Spiel werden im Replay zu gleichmäßiger Zeitlupe
    if (!menuOpen) recorder.push(s.gameT * 1000, views, s.ball, s);
    if (replayPending && !menuOpen) startReplay(replayPending.andOne);
  }

  function syncPause(): void {
    const p = menuPaused || hidden;
    if (p === menuOpen) return;
    const now = performance.now();
    advanceTo(now);
    if (p) {
      detach();
      detach = () => {};
      endTouch();
      if (releasedFill === null) comboT0 = null;
    } else detach = attach();
    menuOpen = p;
    hud.setPaused(p); phud.setPaused(p);
    dirty = true;
    last = now;
    lastFrame = activeNow;
  }

  const visibility = () => { hidden = document.hidden; syncPause(); };
  document.addEventListener("visibilitychange", visibility);
  addEventListener("resize", resize);
  newPlay();
  resize();
  raf = requestAnimationFrame(frame);

  return {
    apply(next) {
      const restart = next.play !== settings.play || next.defenseRandom !== settings.defenseRandom || next.decisionS !== settings.decisionS;
      settings = next;
      resize();
      if (restart) newPlay();
    },
    renderPause(extra) {
      const ids = Object.values(ACTORS).filter((a) => a.team === "off").map((a) => a.id);
      const rows = boxRows(game, ids);
      const sum = rows.reduce((t, r) => ({ pts: t.pts + r.pts, ast: t.ast + r.ast }), { pts: 0, ast: 0 });
      extra.innerHTML = `<table class="box" aria-label="Boxscore ROT"><thead><tr><th>ROT</th><th>PTS</th><th>AST</th></tr></thead><tbody>${rows
        .map((r) => `<tr><td>#${ACTORS[r.id].num}</td><td>${r.pts}</td><td>${r.ast}</td></tr>`)
        .join("")}</tbody><tfoot><tr><td>Gesamt</td><td>${sum.pts}</td><td>${sum.ast}</td></tr></tfoot></table>
        <button class="pause-btn" id="pause-newgame">Neues Spiel (Statistik leeren)</button>`;
      extra.querySelector("#pause-newgame")!.addEventListener("click", () => {
        game = emptyGame();
        this.renderPause!(extra);
      });
    },
    restart() {
      newPlay();
    },
    setPaused(p) { menuPaused = p; syncPause(); },
    stop() {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visibility);
      detach();
      actors.dispose();
      grave.dispose();
      (atlas.textures ?? [atlas.texture]).forEach(texture => texture.dispose());
      hud.dispose();
      phud.dispose();
      px.renderer.dispose();
      root.remove();
    },
  };
}
