export interface Marker {
  kind: "shoot" | "drive" | "pass";
  /** Bildschirmposition in CSS-Pixeln; außerhalb des Bildes wird ein Randpfeil gezeigt */
  x: number;
  y: number;
  label?: string;
}

const EDGE = 26; // Abstand der Randpfeile zum Bildschirmrand

// HUD des Spielzug-Labors: Lage, Entscheidungsmarker, Positionsring, Kurzmeldungen
export function createPlayHud(root: HTMLElement): {
  setSituation(top: string | null, name?: string): void;
  setClock(text: string): void;
  setMarkers(markers: Marker[]): void;
  setRing(x: number, y: number, P: number | null, visible: boolean): void;
  setHandler(x: number, y: number, visible: boolean): void;
  setDecision(frac: number | null): void;
  flash(text: string): void;
  dispose(): void;
} {
  const el = document.createElement("div");
  el.className = "phud";
  el.innerHTML = `<div class="phud-clock"></div>
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
  let flashTimer = 0;

  return {
    setSituation(top, name = "") {
      sit.hidden = top === null;
      q(".phud-sit-top").textContent = top ?? "";
      q(".phud-sit-name").textContent = name;
    },
    setClock(text) {
      q(".phud-clock").textContent = text;
    },
    setMarkers(markers) {
      // display:grid der Marker übersteuert das native hidden; unbenutzte Knoten entfernen.
      while (box.children.length > markers.length) box.lastElementChild!.remove();
      while (box.children.length < markers.length) box.append(document.createElement("div"));
      [...box.children].forEach((c, i) => {
        const d = c as HTMLElement;
        const m = markers[i];
        d.hidden = !m;
        if (!m) return;
        const w = innerWidth, h = innerHeight;
        const off = m.x < EDGE || m.x > w - EDGE || m.y < EDGE || m.y > h - EDGE;
        const x = Math.min(w - EDGE, Math.max(EDGE, m.x));
        const y = Math.min(h - EDGE, Math.max(EDGE + 40, m.y));
        d.className = `phud-m phud-m-${m.kind}${off ? " phud-m-edge" : ""}`;
        d.style.transform = `translate(${x}px, ${y}px)`;
        // Randpfeil zeigt vom Bildschirmzentrum zum Ziel
        const rot = off ? Math.atan2(m.y - h / 2, m.x - w / 2) : m.kind === "drive" ? -Math.PI / 2 : 0;
        d.innerHTML = `<i style="transform:rotate(${rot}rad)">${off || m.kind === "drive" ? "➤" : m.kind === "shoot" ? "◎" : ""}</i>${m.label ? `<b>${m.label}</b>` : ""}`;
      });
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
