import * as THREE from "three";

// Rendert mit `pixelHeight` Bildzeilen und lässt den Browser pixelig hochskalieren.
export function createPixelRenderer(host: HTMLElement): {
  renderer: THREE.WebGLRenderer;
  resize(pixelHeight: number, camera: THREE.PerspectiveCamera): void;
} {
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.shadowMap.enabled = true;
  renderer.domElement.style.imageRendering = "pixelated";
  host.appendChild(renderer.domElement);
  return {
    renderer,
    resize(pixelHeight, camera) {
      const w = host.clientWidth;
      const h = host.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(pixelHeight / h);
      renderer.setSize(w, h);
    },
  };
}
