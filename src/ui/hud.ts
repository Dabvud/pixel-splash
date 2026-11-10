import type { ShotResult, Zones } from "../shot/resolve";

const BANNER_MS = 1800;
const MARK_MS = 1500;

export function createHud(root: HTMLElement): {
  setMeter(fill: number | null, zones: Zones, fillMax: number): void;
  markRelease(fill: number): void;
  showResult(r: ShotResult): void;
  setStats(made: number, shots: number): void;
} {
  root.insertAdjacentHTML(
    "beforeend",
    `<div class="hud-stats" id="hud-stats">Treffer 0 / 0</div>
     <div class="hud-banner" id="hud-banner" hidden><div class="hud-title"></div><div class="hud-hint"></div></div>
     <div class="hud-meter" id="hud-meter" hidden><div class="hud-green"></div><div class="hud-fill"></div><div class="hud-mark" hidden></div></div>`,
  );
  const stats = root.querySelector<HTMLElement>("#hud-stats")!;
  const banner = root.querySelector<HTMLElement>("#hud-banner")!;
  const meter = root.querySelector<HTMLElement>("#hud-meter")!;
  const green = meter.querySelector<HTMLElement>(".hud-green")!;
  const fillEl = meter.querySelector<HTMLElement>(".hud-fill")!;
  const mark = meter.querySelector<HTMLElement>(".hud-mark")!;
  let max = 1.6;
  let bannerTimer = 0;
  let markTimer = 0;
  const pct = (v: number) => `${(Math.min(v, max) / max) * 100}%`;

  return {
    setMeter(fill, zones, fillMax) {
      meter.hidden = fill === null;
      if (fill === null) return;
      max = fillMax;
      fillEl.style.height = pct(fill);
      green.style.bottom = pct(1 - zones.g);
      green.style.height = `${((2 * zones.g) / max) * 100}%`;
    },
    markRelease(fill) {
      mark.style.bottom = pct(fill);
      mark.hidden = false;
      clearTimeout(markTimer);
      markTimer = window.setTimeout(() => (mark.hidden = true), MARK_MS);
    },
    showResult(r) {
      banner.querySelector(".hud-title")!.textContent = r.banner;
      banner.querySelector(".hud-hint")!.textContent = r.hint;
      banner.classList.toggle("made", r.made);
      banner.hidden = false;
      clearTimeout(bannerTimer);
      bannerTimer = window.setTimeout(() => (banner.hidden = true), BANNER_MS);
    },
    setStats(made, shots) {
      stats.textContent = `Treffer ${made} / ${shots}` + (shots ? ` · ${Math.round((made / shots) * 100)} %` : "");
    },
  };
}
