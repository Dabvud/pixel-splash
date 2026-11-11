import * as THREE from 'three';

/** Shared by every arena canvas, including the existing court and backboard. */
export function pixelTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

const FONT: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['111', '010', '010', '010', '010', '010', '111'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
};

function lettering(g: CanvasRenderingContext2D, text: string, x: number, y: number, color: string): void {
  g.fillStyle = color;
  for (const char of text) {
    const glyph = FONT[char];
    if (glyph) {
      for (let row = 0; row < glyph.length; row++) for (let col = 0; col < glyph[row].length; col++) {
        if (glyph[row][col] === '1') g.fillRect(x + col, y + row, 1, 1);
      }
    }
    x += glyph ? glyph[0].length + 1 : 4;
  }
}

/** No browser font dependency: the lettering itself consists of whole pixels. */
export function advertisingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 24;
  const g = canvas.getContext('2d')!;
  g.fillStyle = '#101625'; g.fillRect(0, 0, 256, 24);
  g.fillStyle = '#d84940'; g.fillRect(0, 0, 256, 2); g.fillRect(0, 22, 256, 2);
  lettering(g, 'PIXEL SPLASH', 8, 9, '#ffe8ba');
  lettering(g, 'HOOPS', 113, 9, '#8bd8dd');
  lettering(g, 'SWISH', 195, 9, '#ffe8ba');
  for (let x = 82; x < 100; x += 4) {
    g.fillStyle = x % 8 ? '#ffe8ba' : '#d84940'; g.fillRect(x, 7, 2, 10);
  }
  return pixelTexture(canvas);
}

export function videoTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 64;
  const g = canvas.getContext('2d')!;
  g.fillStyle = '#101b2e'; g.fillRect(0, 0, 128, 64);
  for (let y = 2; y < 62; y += 4) for (let x = 2; x < 126; x += 4) {
    g.fillStyle = (x + y) % 12 === 0 ? '#233d54' : '#172b3e'; g.fillRect(x, y, 2, 2);
  }
  lettering(g, 'PIXEL SPLASH', 30, 8, '#ffe8ba');
  lettering(g, 'HOOPS', 50, 48, '#8bd8dd');
  // A chunky basketball pictogram rather than a real team/brand logo.
  const ball = ['00111100', '01111110', '11111111', '11111111', '11111111', '11111111', '01111110', '00111100'];
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (ball[y][x] === '1') {
    g.fillStyle = x === 3 || y === 3 || x + y === 7 ? '#633226' : '#ef994c';
    g.fillRect(52 + x * 3, 20 + y * 3, 3, 3);
  }
  return pixelTexture(canvas);
}
