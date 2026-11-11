import { CELL_H, CELL_W, rasterPose, type Look } from '../figure/raster';
import { moveFrames } from '../figure/moves';
import { project } from '../figure/skeleton';
import type { CareerInput } from '../career/create';
import type { Difficulty, Position } from '../career/state';
import type { SpecId } from '../career/spec';

const HEIGHT: Record<Position, [number, number]> = { guard: [1.85, 1.96], wing: [1.96, 2.03], big: [2.05, 2.13] };
const SKINS = ['#f1c9a5', '#d5a078', '#b77b53', '#8d5a3b', '#70452f', '#4a2c1e'];
const opts = (list: [string, string][]) => list.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
const colorOpts = (list: [string, string][]) => opts(list);

/** Spieler erstellen: Formular + Live-Vorschau der Pixelfigur (Trikot neutral grau bis zum Draft) */
export function createCareerScreen(root: HTMLElement, onDone: (input: CareerInput) => void): void {
  root.innerHTML = `<div class="career-screen career-create">
    <h2>Spieler erstellen</h2>
    <canvas class="cc-preview" width="${CELL_W}" height="${CELL_H}" aria-label="Vorschau"></canvas>
    <form class="cc-form" onsubmit="return false">
      <label>Name <input id="cc-name" maxlength="16" placeholder="Rookie"></label>
      <label>Nummer <input id="cc-num" type="number" min="0" max="99" value="7" inputmode="numeric"></label>
      <label>Position <select id="cc-position">${opts([['guard', 'Guard'], ['wing', 'Flügel'], ['big', 'Big']])}</select></label>
      <label>Größe <output id="cc-height-out"></output><input id="cc-height" type="range" step="0.01"></label>
      <label>Statur <select id="cc-build">${opts([['slim', 'Schlank'], ['normal', 'Normal'], ['broad', 'Kräftig']])}</select></label>
      <label>Haut <select id="cc-skin">${SKINS.map((c, i) => `<option value="${c}">Ton ${i + 1}</option>`).join('')}</select></label>
      <label>Frisur <select id="cc-hair">${opts([['short', 'Kurz'], ['buzz', 'Buzzcut'], ['bald', 'Glatze'], ['afro', 'Afro'], ['cornrows', 'Cornrows'], ['dreads', 'Dreads'], ['flattop', 'Flattop']])}</select></label>
      <label>Bart <select id="cc-beard">${opts([['none', 'Keiner'], ['stubble', 'Stoppeln'], ['goatee', 'Ziegenbart'], ['full', 'Vollbart']])}</select></label>
      <label>Stirnband <select id="cc-headband">${colorOpts([['', 'Keins'], ['#f4eee0', 'Weiß'], ['#1b1b1b', 'Schwarz'], ['#c8322b', 'Rot']])}</select></label>
      <label>Ärmel <select id="cc-sleeve">${opts([['none', 'Keiner'], ['left', 'Links'], ['right', 'Rechts']])}</select></label>
      <label>Schuhe <select id="cc-shoes">${colorOpts([['#f4eee0', 'Weiß'], ['#222226', 'Schwarz'], ['#f0b52b', 'Gold'], ['#ef7054', 'Koralle']])}</select></label>
      <label>Socken <select id="cc-socks">${opts([['low', 'Kurz'], ['high', 'Hoch']])}</select></label>
      <label>Spezialisierung <select id="cc-spec">${opts([['playmaking', 'Playmaking'], ['shooting', 'Werfen'], ['finishing', 'Korbabschluss']])}</select></label>
      <label>Schwierigkeit <select id="cc-difficulty">${opts([['rookie', 'Rookie'], ['pro', 'Pro'], ['hof', 'Hall of Fame']])}</select></label>
    </form>
    <div class="career-actions"><button class="menu-btn" id="cc-go">Los geht's</button></div>
  </div>`;
  const $ = <T extends HTMLElement>(id: string) => root.querySelector<T>(`#cc-${id}`)!;
  const val = (id: string) => $<HTMLInputElement | HTMLSelectElement>(id).value;
  (root.querySelector('#cc-difficulty') as HTMLSelectElement).value = 'pro';

  const position = () => val('position') as Position;
  const height = $<HTMLInputElement>('height');
  function fitHeight(): void {
    const [lo, hi] = HEIGHT[position()];
    height.min = String(lo); height.max = String(hi);
    const h = Number(height.value);
    if (!(h >= lo && h <= hi)) height.value = String(Math.round((lo + hi) / 2 * 100) / 100);
    $('height-out').textContent = `${Number(height.value).toFixed(2)} m`;
  }
  function look(): Look {
    return {
      heightM: Number(height.value), build: val('build') as Look['build'], skin: val('skin'), hair: val('hair') as Look['hair'],
      beard: val('beard') as Look['beard'], headband: val('headband') || null, armSleeve: val('sleeve') as Look['armSleeve'],
      shoes: val('shoes'), socks: val('socks') as Look['socks'], jersey: '#9aa3ab', shorts: '#5c636b', num: number(),
    };
  }
  const number = () => Math.max(0, Math.min(99, Math.round(Number(val('num')) || 0)));
  function preview(): void {
    const canvas = root.querySelector<HTMLCanvasElement>('.cc-preview')!, ctx = canvas.getContext('2d');
    if (!ctx) return; // jsdom ohne Canvas
    const buf = rasterPose(project(moveFrames('idle')[0], 'front'), look(), 'front');
    ctx.putImageData(new ImageData(new Uint8ClampedArray(buf), CELL_W, CELL_H), 0, 0);
  }
  root.querySelector('.cc-form')!.addEventListener('input', e => {
    if ((e.target as HTMLElement).id === 'cc-position') fitHeight();
    else $('height-out').textContent = `${Number(height.value).toFixed(2)} m`;
    preview();
  });
  $('go').addEventListener('click', () => onDone({
    name: val('name').trim() || 'Rookie', num: number(), look: look(), position: position(), difficulty: val('difficulty') as Difficulty,
    spec: val('spec') as SpecId,
  }));
  fitHeight();
  preview();
}
