import type { FinishFeedback } from '../play/engine';

export interface Marker {
  kind: "shoot" | "drive" | "pass";
  /** Bildschirmposition in CSS-Pixeln; außerhalb des Bildes wird ein Randpfeil gezeigt */
  x: number;
  y: number;
  label?: string;
}

const EDGE = 26; // Abstand der Randpfeile zum Bildschirmrand

export function formatPlayClock(seconds: number, tenths = true): string {
  const time = Math.max(0, seconds);
  if (tenths && time < 10) return (Math.floor(time * 10) / 10).toFixed(1);
  const whole = Math.ceil(time);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

export function playScore(deficit: number, points: number): { red: number; blue: number } {
  return { red: 100 - deficit + points, blue: 100 };
}

// HUD des Spielzug-Labors: Lage, Entscheidungsmarker, Positionsring, Kurzmeldungen
export function createPlayHud(root: HTMLElement): {
  setSituation(top: string | null, name?: string): void;
  setScoreboard(clock: number, deficit: number, points: number, overtime?: boolean): void;
  /** Karriere: Teamkürzel (eigenes Team links) und festes Viertel der Szene */
  setLabels(own: string, opp: string, period?: string): void;
  setMarkers(markers: Marker[]): void;
  setRing(x: number, y: number, P: number | null, visible: boolean): void;
  setHandler(x: number, y: number, visible: boolean): void;
  setFinishFeedback(word: FinishFeedback | null): void;
  setPoster(x: number, y: number, visible: boolean, elapsed?: number): void;
  setDecision(frac: number | null): void;
  flash(text: string): void;
  /** Pfiff: „FOUL!“ fliegt aus dem Bild; beim And-one wird es durchgestrichen und „AND-ONE!“ gefeiert */
  foulCall(andOne: boolean): void;
  setPaused(paused: boolean): void;
  dispose(): void;
} {
  const el = document.createElement("div");
  el.className = "phud";
  el.innerHTML = `<div class="phud-scoreboard" role="group" aria-label="Spielstand">
      <div class="phud-team"><span>ROT</span><b class="phud-score-red">100</b></div>
      <div class="phud-game"><span>4. VIERTEL</span><b class="phud-game-clock">0.0</b></div>
      <div class="phud-team"><span>BLAU</span><b class="phud-score-blue">100</b></div>
    </div>
    <div class="phud-sit" hidden><div class="phud-sit-top"></div><div class="phud-sit-name"></div></div>
    <div class="phud-ring" hidden></div>
    <div class="phud-handler" hidden><span>▼</span></div>
    <div class="phud-finish-feedback" role="status" hidden></div>
    <div class="phud-poster" aria-label="Benommen" hidden><span>★</span><span>★</span><span>★</span></div>
    <div class="phud-flash" hidden></div>
    <div class="phud-foul" role="status" hidden>FOUL!</div>
    <div class="phud-andone" hidden>AND-ONE!</div>
    <div class="phud-decision" hidden><div></div></div>
    <div class="phud-markers"></div>`;
  root.append(el);
  const q = <T extends HTMLElement>(s: string) => el.querySelector<T>(s)!;
  const sit = q(".phud-sit"), ring = q(".phud-ring"), fl = q(".phud-flash"), dec = q(".phud-decision"), box = q(".phud-markers");
  const handler = q(".phud-handler");
  const sitTop = q('.phud-sit-top'), sitName = q('.phud-sit-name');
  const feedback = q('.phud-finish-feedback'), poster = q('.phud-poster');
  const stars = [...poster.querySelectorAll<HTMLElement>('span')];
  const clock = q('.phud-game-clock'), red = q('.phud-score-red'), blue = q('.phud-score-blue'), period = q('.phud-game span');
  let periodLabel: string | undefined;
  const markerNodes: { el: HTMLDivElement; icon: HTMLElement; label: HTMLElement }[] = [];
  let flashTimer: number | null = null;
  let flashRemaining: number | null = null;
  let flashDeadline = 0;
  let paused = false;
  let disposed = false;
  const setHidden = (node: HTMLElement, hidden: boolean) => { if (node.hidden !== hidden) node.hidden = hidden; };
  const setText = (node: HTMLElement, text: string) => { if (node.textContent !== text) node.textContent = text; };
  const setStyle = (node: HTMLElement, key: 'transform' | 'borderColor', value: string) => {
    if (node.style[key] !== value) node.style[key] = value;
  };
  let lastWord: FinishFeedback | null | undefined;
  let lastRingColor = '';

  function resumeFlash(): void {
    if (paused || disposed || flashRemaining === null) return;
    flashDeadline = performance.now() + flashRemaining;
    flashTimer = window.setTimeout(() => {
      flashTimer = null;
      flashRemaining = null;
      fl.hidden = true;
    }, flashRemaining);
  }

  return {
    setSituation(top, name = "") {
      setHidden(sit, top === null);
      setText(sitTop, top ?? "");
      setText(sitName, name);
    },
    setScoreboard(seconds, deficit, points, overtime = false) {
      const score = playScore(deficit, points);
      setText(clock, formatPlayClock(seconds));
      setText(red, String(score.red));
      setText(blue, String(score.blue));
      setText(period, periodLabel ?? (overtime ? 'OVERTIME' : '4. VIERTEL'));
    },
    setLabels(own, opp, label) {
      const [a, b] = el.querySelectorAll<HTMLElement>('.phud-team span');
      setText(a, own); setText(b, opp);
      periodLabel = label;
    },
    setMarkers(markers) {
      // display:grid der Marker übersteuert das native hidden; unbenutzte Knoten entfernen.
      while (box.children.length > markers.length) box.lastElementChild!.remove();
      const w = innerWidth, h = innerHeight;
      for (let i = 0; i < markers.length; i++) {
        if (!markerNodes[i]) {
          const el = document.createElement("div"), icon = document.createElement("i"), label = document.createElement("b");
          el.append(icon);
          markerNodes.push({ el, icon, label });
        }
        const { el: d, icon, label } = markerNodes[i];
        if (d.parentElement !== box) box.append(d);
        const m = markers[i];
        const off = m.x < EDGE || m.x > w - EDGE || m.y < EDGE || m.y > h - EDGE;
        const x = Math.min(w - EDGE, Math.max(EDGE, m.x));
        const y = Math.min(h - EDGE, Math.max(EDGE + 40, m.y));
        const className = `phud-m phud-m-${m.kind}${off ? " phud-m-edge" : ""}`;
        if (d.className !== className) d.className = className;
        const transform = `translate(${x}px, ${y}px)`;
        if (d.style.transform !== transform) d.style.transform = transform;
        // Randpfeil zeigt vom Bildschirmzentrum zum Ziel
        const rot = off ? Math.atan2(m.y - h / 2, m.x - w / 2) : m.kind === "drive" ? -Math.PI / 2 : 0;
        const rotation = `rotate(${rot}rad)`;
        if (icon.style.transform !== rotation) icon.style.transform = rotation;
        const symbol = off || m.kind === "drive" ? "➤" : m.kind === "shoot" ? "◎" : "";
        if (icon.textContent !== symbol) icon.textContent = symbol;
        if (label.textContent !== (m.label ?? "")) label.textContent = m.label ?? "";
        if (m.label) {
          if (label.parentElement !== d) d.append(label);
        } else if (label.parentElement === d) label.remove();
      }
    },
    setRing(x, y, P, visible) {
      setHidden(ring, !visible);
      if (!visible) return;
      setStyle(ring, 'transform', `translate(${x}px, ${y}px)`);
      const color = P === null ? "white" : `hsl(${Math.round(P * 120)} 85% 55%)`;
      if (color !== lastRingColor) { ring.style.borderColor = color; lastRingColor = color; }
    },
    setHandler(x, y, visible) {
      setHidden(handler, !visible);
      if (visible) setStyle(handler, 'transform', `translate(${x}px, ${y}px)`);
    },
    setFinishFeedback(word) {
      if (word === lastWord) return;
      lastWord = word;
      setHidden(feedback, word === null);
      setText(feedback, word ?? '');
      feedback.classList.toggle('perfect', word === 'PERFEKT');
    },
    setPoster(x, y, visible, elapsed = 0) {
      setHidden(poster, !visible);
      if (!visible) return;
      setStyle(poster, 'transform', `translate(${x}px, ${y}px)`);
      stars.forEach((star, i) => {
        const angle = elapsed * Math.PI * 2 + i * Math.PI * 2 / 3;
        star.style.transform = `translate(${Math.cos(angle) * 18}px, ${Math.sin(angle) * 7}px)`;
      });
    },
    setDecision(frac) {
      dec.hidden = frac === null;
      if (frac !== null) (dec.firstElementChild as HTMLElement).style.width = `${Math.max(0, Math.min(1, frac)) * 100}%`;
    },
    flash(text) {
      if (disposed) return;
      fl.textContent = text;
      fl.hidden = false;
      if (flashTimer !== null) window.clearTimeout(flashTimer);
      flashTimer = null;
      flashRemaining = 900;
      resumeFlash();
    },
    foulCall(andOne) {
      if (disposed) return;
      const foul = q('.phud-foul'), one = q('.phud-andone');
      // Klassen neu setzen, damit die CSS-Animation bei jedem Pfiff von vorn läuft
      foul.classList.remove('run', 'struck'); one.classList.remove('run');
      void foul.offsetWidth;
      foul.hidden = false;
      foul.classList.add('run');
      foul.classList.toggle('struck', andOne);
      one.hidden = !andOne;
      if (andOne) one.classList.add('run');
    },
    setPaused(value) {
      if (disposed || value === paused) return;
      paused = value;
      el.classList.toggle('paused', paused);
      if (paused) {
        if (flashTimer === null) return;
        flashRemaining = Math.max(0, flashDeadline - performance.now());
        window.clearTimeout(flashTimer);
        flashTimer = null;
      } else resumeFlash();
    },
    dispose() {
      disposed = true;
      if (flashTimer !== null) window.clearTimeout(flashTimer);
      flashTimer = null;
      flashRemaining = null;
      el.remove();
    },
  };
}

