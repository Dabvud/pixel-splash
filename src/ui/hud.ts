import type { BankWindow, ShotResult, Zones } from "../shot/resolve";

const BANNER_MS = 1800;
const MARK_MS = 1500;

export function createHud(root: HTMLElement): {
  setMeter(fill: number | null, zones: Zones, fillMax: number, arrow?: boolean, bank?: BankWindow | null): void;
  markRelease(fill: number, persist?: boolean, zones?: Zones): void;
  showResult(r: ShotResult): void;
  setStats(made: number, shots: number): void;
  setPaused(paused: boolean): void;
  dispose(): void;
} {
  root.insertAdjacentHTML(
    "beforeend",
    `<div class="hud-stats" id="hud-stats">Treffer 0 / 0</div>
     <div class="hud-banner" id="hud-banner" hidden><div class="hud-title"></div><div class="hud-hint"></div></div>
     <div class="hud-meter" id="hud-meter" hidden><div class="hud-green"></div><div class="hud-fill"></div><div class="hud-bank" hidden></div><div class="hud-arrow" hidden>◄</div><div class="hud-mark" hidden></div></div>`,
  );
  const stats = root.querySelector<HTMLElement>("#hud-stats")!;
  const banner = root.querySelector<HTMLElement>("#hud-banner")!;
  const meter = root.querySelector<HTMLElement>("#hud-meter")!;
  const green = meter.querySelector<HTMLElement>(".hud-green")!;
  const fillEl = meter.querySelector<HTMLElement>(".hud-fill")!;
  const mark = meter.querySelector<HTMLElement>(".hud-mark")!;
  const arrowEl = meter.querySelector<HTMLElement>(".hud-arrow")!;
  const bankEl = meter.querySelector<HTMLElement>(".hud-bank")!;
  let max = 1.6;
  let paused = false;
  let disposed = false;
  type DisplayTimer = { element: HTMLElement; id: number | null; remaining: number | null; deadline: number };
  const timers: DisplayTimer[] = [banner, mark].map(element => ({ element, id: null, remaining: null, deadline: 0 }));
  const [bannerTimer, markTimer] = timers;
  const pct = (v: number) => `${(Math.min(v, max) / max) * 100}%`;

  function clearTimer(timer: DisplayTimer): void {
    if (timer.id !== null) window.clearTimeout(timer.id);
    timer.id = null;
    timer.remaining = null;
  }

  function resumeTimer(timer: DisplayTimer): void {
    if (paused || disposed || timer.remaining === null) return;
    timer.deadline = performance.now() + timer.remaining;
    timer.id = window.setTimeout(() => {
      timer.id = null;
      timer.remaining = null;
      timer.element.hidden = true;
    }, timer.remaining);
  }

  function startTimer(timer: DisplayTimer, ms: number): void {
    clearTimer(timer);
    timer.remaining = ms;
    resumeTimer(timer);
  }

  return {
    setMeter(fill, zones, fillMax, arrow = false, bank = null) {
      meter.hidden = fill === null;
      bankEl.hidden = fill === null || bank === null;
      if (fill === null) {
        mark.hidden = true;
        mark.classList.remove("good");
        arrowEl.classList.remove("released", "good");
        clearTimer(markTimer);
        return;
      }
      max = fillMax;
      fillEl.hidden = arrow;
      arrowEl.hidden = !arrow;
      arrowEl.style.bottom = pct(fill);
      fillEl.style.height = pct(fill);
      green.style.bottom = pct(1 - zones.g);
      green.style.height = `${((2 * zones.g) / max) * 100}%`;
      if (bank) {
        bankEl.style.bottom = pct(bank.lo);
        bankEl.style.height = `${(Math.min(bank.hi, max) - Math.min(bank.lo, max)) / max * 100}%`;
      }
    },
    markRelease(fill, persist = false, zones) {
      if (disposed) return;
      const good = zones !== undefined && Math.abs(fill - 1) <= zones.g + 1e-9;
      mark.classList.toggle("good", good);
      arrowEl.classList.toggle("good", good);
      arrowEl.classList.add("released");
      mark.style.bottom = pct(fill);
      mark.hidden = false;
      clearTimer(markTimer);
      if (!persist) startTimer(markTimer, MARK_MS);
    },
    showResult(r) {
      if (disposed) return;
      banner.querySelector(".hud-title")!.textContent = r.banner;
      banner.querySelector(".hud-hint")!.textContent = r.hint;
      banner.classList.toggle("made", r.made);
      banner.hidden = false;
      startTimer(bannerTimer, BANNER_MS);
    },
    setStats(made, shots) {
      stats.textContent = `Treffer ${made} / ${shots}` + (shots ? ` · ${Math.round((made / shots) * 100)} %` : "");
    },
    setPaused(value) {
      if (disposed || value === paused) return;
      paused = value;
      const now = performance.now();
      for (const timer of timers) {
        if (paused) {
          if (timer.id === null) continue;
          timer.remaining = Math.max(0, timer.deadline - now);
          window.clearTimeout(timer.id);
          timer.id = null;
        } else resumeTimer(timer);
      }
    },
    dispose() {
      disposed = true;
      timers.forEach(clearTimer);
      stats.remove();
      banner.remove();
      meter.remove();
    },
  };
}
