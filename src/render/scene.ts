import * as THREE from "three";
import { netHit, netPose } from "./net";

// Halle aus der Look-Test-Vorschau (Variante „Pixel“): Feld, Korb, Publikum, Licht.
export function createScene(): { scene: THREE.Scene; ball: THREE.Mesh; updateNet(nowMs: number): void } {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x120d0a);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(15, 14), new THREE.MeshLambertMaterial({ map: courtTexture() }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 5.425);
  floor.receiveShadow = true;
  scene.add(floor);
  const apron = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshLambertMaterial({ color: 0x2a1e17 }));
  apron.rotation.x = -Math.PI / 2;
  apron.position.set(0, -0.01, 5);
  scene.add(apron);

  const wall = (w: number, x: number, z: number, ry: number) => {
    // 14 m hoch, damit im Hochformat über dem Publikum keine leere Fläche bleibt
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 14), new THREE.MeshLambertMaterial({ map: crowdTexture(w / 8, 2) }));
    m.position.set(x, 7, z);
    m.rotation.y = ry;
    scene.add(m);
  };
  wall(30, 0, -7, 0);
  wall(30, -11, 6, Math.PI / 2);
  wall(30, 11, 6, -Math.PI / 2);

  const net = addHoop(scene);

  scene.add(new THREE.HemisphereLight(0xfff0e0, 0x2a1a12, 0.8));
  const sun = new THREE.DirectionalLight(0xffffff, 0.7);
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
    net.position.set(dx, 3.05 - 0.21 * sy, 0);
  };
  return { scene, ball, updateNet };
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
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function crowdTexture(repeat: number, rows: number): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 16;
  const g = c.getContext("2d")!;
  g.fillStyle = "#1a1620";
  g.fillRect(0, 0, 64, 16);
  for (let y = 1; y < 16; y += 3)
    for (let x = y % 2; x < 64; x += 2) {
      g.fillStyle = `hsl(${Math.random() * 360},35%,${25 + Math.random() * 30}%)`;
      g.fillRect(x, y, 1, 2);
    }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, rows);
  return t;
}

function addHoop(scene: THREE.Scene): THREE.Mesh {
  const c = document.createElement("canvas");
  c.width = 90;
  c.height = 52;
  const g = c.getContext("2d")!;
  g.fillStyle = "#f4f4f4";
  g.fillRect(0, 0, 90, 52);
  g.strokeStyle = "#222";
  g.lineWidth = 3;
  g.strokeRect(1.5, 1.5, 87, 49);
  g.strokeStyle = "#c0392b";
  g.strokeRect(30, 22, 30, 22);
  const dark = new THREE.MeshLambertMaterial({ color: 0x2b2b30 });
  const part = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    scene.add(m);
    return m;
  };
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  part(new THREE.BoxGeometry(1.8, 1.05, 0.05), new THREE.MeshLambertMaterial({ map: texture }), 0, 3.42, -0.4);
  const rim = part(new THREE.TorusGeometry(0.23, 0.02, 8, 24), new THREE.MeshLambertMaterial({ color: 0xe8601c }), 0, 3.05, 0);
  rim.rotation.x = Math.PI / 2;
  const net = part(new THREE.CylinderGeometry(0.23, 0.15, 0.42, 12, 3, true), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true }), 0, 2.84, 0);
  part(new THREE.BoxGeometry(0.15, 0.15, 1.2), dark, 0, 3.3, -1);
  part(new THREE.BoxGeometry(0.25, 3.4, 0.25), dark, 0, 1.7, -1.6);
  return net;
}
