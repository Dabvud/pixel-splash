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
  setScoreboard(clock: number, deficit: number, points: number): void;
  setMarkers(markers: Marker[]): void;
  setRing(x: number, y: number, P: number | null, visible: boolean): void;
  setHandler(x: number, y: number, visible: boolean): void;
  setDecision(frac: number | null): void;
  flash(text: string): void;
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
    <div class="phud-flash" hidden></div>
    <div class="phud-decision" hidden><div></div></div>
    <div class="phud-markers"></div>`;
  root.append(el);
  const q = <T extends HTMLElement>(s: string) => el.querySelector<T>(s)!;
  const sit = q(".phud-sit"), ring = q(".phud-ring"), fl = q(".phud-flash"), dec = q(".phud-decision"), box = q(".phud-markers");
  const handler = q(".phud-handler");
  const clock = q('.phud-game-clock'), red = q('.phud-score-red'), blue = q('.phud-score-blue');
  const markerNodes: { el: HTMLDivElement; icon: HTMLElement; label: HTMLElement }[] = [];
  let flashTimer = 0;

  return {
    setSituation(top, name = "") {
      sit.hidden = top === null;
      q(".phud-sit-top").textContent = top ?? "";
      q(".phud-sit-name").textContent = name;
    },
    setScoreboard(seconds, deficit, points) {
      const score = playScore(deficit, points);
      const setText = (node: HTMLElement, text: string) => { if (node.textContent !== text) node.textContent = text; };
      setText(clock, formatPlayClock(seconds));
      setText(red, String(score.red));
      setText(blue, String(score.blue));
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
      ring.hidden = !visible;
      if (!visible) return;
      ring.style.transform = `translate(${x}px, ${y}px)`;
      ring.style.borderColor = P === null ? "white" : `hsl(${Math.round(P * 120)} 85% 55%)`; // rot → gelb → grün
    },
    setHandler(x, y, visible) {
      handler.hidden = !visible;
      if (visible) handler.style.transform = `translate(${x}px, ${y}px)`;
    },
    setDecision(frac) {
      dec.hidden = frac === null;
      if (frac !== null) (dec.firstElementChild as HTMLElement).style.width = `${Math.max(0, Math.min(1, frac)) * 100}%`;
    },
    flash(text) {
      fl.textContent = text;
      fl.hidden = false;
      clearTimeout(flashTimer);
      flashTimer = window.setTimeout(() => (fl.hidden = true), 900);
    },
    dispose() {
      clearTimeout(flashTimer);
      el.remove();
    },
  };
}
