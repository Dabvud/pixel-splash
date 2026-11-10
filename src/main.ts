import "@fontsource/press-start-2p";
import "./style.css";
import * as THREE from "three";
import { INFLUENCE, PROFILES, SPOTS, loadSettings, spotDistance, type Settings } from "./settings";
import { MAX_FILL, effectiveZones, resolveShot, type ShotParams } from "./shot/resolve";
import { buildFlight, type Flight } from "./shot/trajectory";
import { attachGesture } from "./input/gesture";
import { createScene } from "./render/scene";
import { createPixelRenderer } from "./render/pixel";
import { createPlayer } from "./render/player";
import { cameraPose } from "./render/camera-pose";
import { createHud } from "./ui/hud";
import { createLabMenu } from "./ui/lab-menu";

const SETTLE_S = 0.4; // Pause nach dem Aufprall, bevor der nächste Wurf geht

type State =
  | { k: "ready" }
  | { k: "charging"; t0: number }
  | { k: "flying"; t0: number; flight: Flight; fill: number };

const app = document.getElementById("app")!;
const stage = document.createElement("div");
stage.id = "stage";
app.append(stage);

let settings: Settings = loadSettings();
let state: State = { k: "ready" };
let made = 0;
let shots = 0;

const { scene, ball } = createScene();
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
const px = createPixelRenderer(stage);
const player = createPlayer(scene);
const hud = createHud(app);

const spot = () => SPOTS.find((s) => s.id === settings.spot)!;
const params = (): ShotParams => ({
  meterMs: settings.meterMs,
  greenZone: settings.greenZone,
  aimDeg: settings.aimDeg,
  rating: PROFILES.find((p) => p.id === settings.profile)!.rating,
  influence: INFLUENCE[settings.influence],
  distance: spotDistance(spot()),
});
const resize = () => px.resize(settings.pixelHeight, camera);

function toReady(): void {
  state = { k: "ready" };
  player.setPose("ready");
  hud.setMeter(null, effectiveZones(params()), MAX_FILL);
}

function placePlayer(): void {
  const s = spot();
  player.setSpot(s.x, s.z);
  toReady();
}

createLabMenu(app, settings, (s) => {
  settings = s;
  placePlayer();
  resize();
});

attachGesture(
  stage,
  (e) => {
    if (e.type === "start") {
      state = { k: "charging", t0: performance.now() };
      player.setPose("shoot");
    } else if (e.type === "release" && state.k === "charging") {
      const result = resolveShot({ holdMs: e.holdMs, angleDeg: e.angleDeg }, params());
      shots++;
      if (result.made) made++;
      hud.markRelease(result.fill);
      hud.showResult(result);
      hud.setStats(made, shots);
      state = { k: "flying", t0: performance.now(), flight: buildFlight(result.outcome, player.handPos()), fill: result.fill };
    } else {
      toReady();
    }
  },
  () => state.k === "flying",
);

function frame(now: number): void {
  const s = spot();
  let progress: number | null = null;
  if (state.k === "flying") {
    const t = (now - state.t0) / 1000;
    const { flight } = state;
    const p = flight.at(t);
    ball.position.set(p.x, p.y, p.z);
    hud.setMeter(state.fill, effectiveZones(params()), MAX_FILL);
    // Kamera schwenkt im Bogen hoch und fährt danach zurück
    const end = flight.duration + SETTLE_S;
    progress = t <= flight.arcEnd ? t / flight.arcEnd : Math.max(0, 1 - (t - flight.arcEnd) / (end - flight.arcEnd));
    if (t > 0.3) player.setPose("ready");
    if (t > end) toReady();
  } else {
    if (state.k === "charging") {
      hud.setMeter(Math.min((now - state.t0) / settings.meterMs, MAX_FILL), effectiveZones(params()), MAX_FILL);
    }
    const h = player.handPos();
    ball.position.set(h.x, h.y, h.z);
  }
  const pose = cameraPose(settings.camera, { x: s.x, y: 0, z: s.z }, progress);
  camera.position.set(pose.pos.x, pose.pos.y, pose.pos.z);
  camera.lookAt(pose.look.x, pose.look.y, pose.look.z);
  px.renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

addEventListener("resize", resize);
placePlayer();
resize();
requestAnimationFrame(frame);
