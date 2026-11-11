import * as THREE from "three";
import { netHit, netPose } from "./net";
import { pixelTexture } from "./arena-textures";
import { createCrowd, type CrowdController } from "./crowd";
import { createStadium } from "./stadium";

const RIM_PIVOT_Z = -.375;

// Pixel-Arena; die Modi steuern Netz und optional das Publikum unabhängig.
export function createScene(): { scene: THREE.Scene; ball: THREE.Mesh; updateNet(nowMs: number): void; crowd?: CrowdController; hoop: { setGlassBroken(broken: boolean): void } } {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b101b);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(15, 14), new THREE.MeshLambertMaterial({ map: courtTexture() }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 5.425);
  floor.receiveShadow = true;
  scene.add(floor);
  const apron = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), new THREE.MeshLambertMaterial({ color: 0x22202a }));
  apron.rotation.x = -Math.PI / 2;
  apron.position.set(0, -0.01, 5);
  scene.add(apron);

  const stadium = createStadium();
  const crowd = createCrowd(stadium.seats);
  scene.add(stadium.group, crowd.mesh);

  const { net, hoop } = addHoop(scene);

  scene.add(new THREE.HemisphereLight(0xd7e3ff, 0x251d27, 0.45));
  const sun = new THREE.DirectionalLight(0xfff0dc, 0.85);
  sun.position.set(4, 12, 9);
  sun.castShadow = true;
  Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 });
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);

  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), new THREE.MeshLambertMaterial({ color: 0xd8661f }));
  ball.castShadow = true;
  scene.add(ball);
  // Netz reagiert auf den Ball: strecken beim Treffer, wackeln beim Ringkontakt
  const prev = { x: 0, y: 0, z: 0 };
  let hitAt = -1e9, strength = 1;
  const updateNet = (nowMs: number): void => {
    const hit = netHit(prev, ball.position);
    if (hit !== null && (hit > 1 || nowMs - hitAt > 400)) { hitAt = nowMs; strength = hit; }
    prev.x = ball.position.x; prev.y = ball.position.y; prev.z = ball.position.z;
    const { sy, dx } = netPose((nowMs - hitAt) / 1000, strength);
    net.scale.y = sy;
    // Lokale Koordinaten lassen das Netz auch beim Brettbruch am Ring hängen.
    net.position.set(dx, -0.21 * sy, -RIM_PIVOT_Z);
  };
  return { scene, ball, updateNet, crowd, hoop };
}

function courtTexture(): THREE.CanvasTexture {
  const S = 20;
  const c = document.createElement("canvas");
  c.width = 15 * S;
  c.height = 14 * S;
  const g = c.getContext("2d")!;
  for (let x = 0; x < c.width; x += 6) {
    g.fillStyle = `hsl(29,${42 + Math.random() * 12}%,${50 + Math.random() * 8}%)`;
    g.fillRect(x, 0, 6, c.height);
  }
  // Leinwand-y wächst mit Welt-z, oben = Grundlinie (z = −1,575)
  const X = (x: number) => (x + 7.5) * S;
  const Z = (z: number) => (z + 1.575) * S;
  g.fillStyle = "rgba(150,32,28,.9)";
  g.fillRect(X(-2.45), 0, 4.9 * S, 5.8 * S);
  g.strokeStyle = "#fff";
  g.lineWidth = 2;
  g.strokeRect(1, 1, c.width - 2, c.height - 2);
  g.strokeRect(X(-2.45), 0, 4.9 * S, 5.8 * S);
  g.beginPath();
  g.arc(X(0), 5.8 * S, 1.8 * S, 0, Math.PI);
  g.stroke();
  const a = Math.atan2(1.415, 6.6);
  g.beginPath();
  g.moveTo(X(-6.6), 0);
  g.lineTo(X(-6.6), Z(1.415));
  g.arc(X(0), Z(0), 6.75 * S, Math.PI - a, a, true);
  g.lineTo(X(6.6), 0);
  g.stroke();
  g.beginPath();
  g.arc(X(0), c.height, 1.8 * S, Math.PI, 2 * Math.PI);
  g.stroke();
  return pixelTexture(c);
}

function addHoop(scene: THREE.Scene): { net: THREE.Mesh; hoop: { setGlassBroken(broken: boolean): void } } {
  const c = document.createElement("canvas");
  c.width = 90;
  c.height = 52;
  const g = c.getContext("2d")!;
  // Glasbrett: Fläche durchscheinend, Rand und Wurfquadrat deckend weiß
  g.fillStyle = "rgba(190, 225, 245, 0.28)";
  g.fillRect(0, 0, 90, 52);
  g.strokeStyle = "#f4f4f4";
  g.lineWidth = 3;
  g.strokeRect(1.5, 1.5, 87, 49);
  g.strokeRect(30, 22, 30, 22);
  const dark = new THREE.MeshLambertMaterial({ color: 0x2b2b30 });
  const part = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    scene.add(m);
    return m;
  };
  const texture = pixelTexture(c);
  const glass = part(new THREE.BoxGeometry(1.8, 1.05, 0.05), new THREE.MeshLambertMaterial({ map: texture, transparent: true, depthWrite: false }), 0, 3.42, -0.4);
  glass.castShadow = false;
  glass.name = 'backboard-glass';
  const structure = new THREE.Group(), frame = new THREE.Group();
  frame.name = 'backboard-frame';
  structure.add(frame);
  scene.add(structure);
  for (const [x, y, w, h] of [[0, 2.895, 1.84, .04], [0, 3.945, 1.84, .04], [-.9, 3.42, .04, 1.05], [.9, 3.42, .04, 1.05]]) {
    const edge = part(new THREE.BoxGeometry(w, h, .075), dark, x, y, -.4);
    frame.add(edge);
  }
  const remnants = new THREE.Group();
  remnants.name = 'glass-remnants';
  remnants.visible = false;
  structure.add(remnants);
  const shardMaterial = new THREE.MeshLambertMaterial({ color: 0xc9efff, side: THREE.DoubleSide });
  for (const [x, y, angle] of [[-.82, 3.9, Math.PI], [.78, 3.9, Math.PI], [-.85, 3.08, -.9], [.85, 3.25, .9], [-.55, 2.92, 0], [.5, 2.92, 0]]) {
    const shape = new THREE.Shape();
    shape.moveTo(-.1, 0); shape.lineTo(.1, 0); shape.lineTo(.04, .11);
    shape.lineTo(0, .065); shape.lineTo(-.05, .17); shape.closePath();
    const shard = new THREE.Mesh(new THREE.ShapeGeometry(shape), shardMaterial);
    shard.position.set(x, y, -.365); shard.rotation.z = angle;
    remnants.add(shard);
  }
  const pivot = new THREE.Group();
  pivot.name = 'rim-pivot';
  pivot.position.set(0, 3.05, RIM_PIVOT_Z);
  scene.add(pivot);
  const rim = part(new THREE.TorusGeometry(0.23, 0.02, 8, 24), new THREE.MeshLambertMaterial({ color: 0xe8601c }), 0, 3.05, 0);
  rim.name = 'rim';
  rim.position.set(0, 0, -RIM_PIVOT_Z);
  pivot.add(rim);
  rim.rotation.x = Math.PI / 2;
  const net = part(new THREE.CylinderGeometry(0.23, 0.15, 0.42, 12, 3, true), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true }), 0, 2.84, 0);
  net.name = 'net';
  net.position.set(0, -.21, -RIM_PIVOT_Z);
  pivot.add(net);
  const support = part(new THREE.BoxGeometry(.12, .09, .17), dark, 0, -.02, .085);
  support.name = 'rim-support';
  pivot.add(support);
  part(new THREE.BoxGeometry(0.15, 0.15, 1.2), dark, 0, 3.3, -1);
  part(new THREE.BoxGeometry(0.25, 3.4, 0.25), dark, 0, 1.7, -1.6);
  return { net, hoop: { setGlassBroken(broken) {
    glass.visible = !broken;
    remnants.visible = broken;
    pivot.rotation.x = broken ? .48 : 0;
  } } };
}
