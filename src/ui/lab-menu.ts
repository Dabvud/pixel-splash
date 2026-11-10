import { PROFILES, SPOTS, saveSettings, type Settings } from "../settings";

type Key = keyof Settings;
type Show = "all" | "shot" | "play";
interface SelectField { key: Key; label: string; show: Show; options: [string, string][]; parse?: (v: string) => unknown }
interface RangeField { key: Key; label: string; show: Show; min: number; max: number; step: number; scale: number; fmt: (v: number) => string }

const num = (v: string) => Number(v);
const SELECTS: SelectField[] = [
  { key: "mode", label: "Modus", show: "all", options: [["shot", "Wurf-Labor"], ["play", "Spielzug-Labor"]] },
  { key: "play", label: "Spielzug", show: "play", options: [["random", "Zufall"], ["pnr", "Pick & Roll"], ["fastbreak", "Fast Break"], ["kickout", "Kick-out"], ["inbound", "Inbound / Last Shot"]] },
  { key: "spot", label: "Wurfspot", show: "shot", options: SPOTS.map((p) => [p.id, p.label]) },
  { key: "camera", label: "Kamera", show: "all", options: [["auto", "Automatisch"], ["low", "Tief hinter dem Spieler"], ["high", "Erhöht"]] },
  { key: "profile", label: "Testprofil", show: "shot", options: PROFILES.map((p) => [p.id, p.label]) },
  { key: "influence", label: "Stat-Einfluss", show: "all", options: [["off", "Aus"], ["light", "Leicht"], ["fair", "Fair"], ["strong", "Stark"]] },
  { key: "defenseRandom", label: "Verteidigungs-Zufall", show: "play", options: [["true", "An"], ["false", "Aus (immer gleich)"]], parse: (v) => v === "true" },
  { key: "fouls", label: "Foul-Häufigkeit", show: "play", options: [["off", "Aus"], ["rare", "Selten"], ["normal", "Normal"], ["often", "Oft"]] },
  { key: "pixelHeight", label: "Pixel-Auflösung", show: "all", options: [220, 320, 420, 540].map((r) => [String(r), `${r} px`]), parse: num },
];
const pct = (v: number) => `${v} %`;
const RANGES: RangeField[] = [
  { key: "meterMs", label: "Anzeigedauer Wurf", show: "all", min: 400, max: 1200, step: 50, scale: 1, fmt: (v) => `${v} ms` },
  { key: "greenZone", label: "Grüne Zone Wurf", show: "all", min: 3, max: 15, step: 1, scale: 100, fmt: (v) => `± ${v} %` },
  { key: "aimDeg", label: "Richtungs-Spielraum Wurf", show: "all", min: 2, max: 12, step: 1, scale: 1, fmt: (v) => `± ${v}°` },
  { key: "finishMeterMs", label: "Anzeigedauer Abschluss", show: "play", min: 300, max: 700, step: 25, scale: 1, fmt: (v) => `${v} ms` },
  { key: "finishGreen", label: "Grüne Zone Abschluss", show: "play", min: 5, max: 20, step: 1, scale: 100, fmt: (v) => `± ${v} %` },
  { key: "finishAim", label: "Richtung Abschluss", show: "play", min: 4, max: 14, step: 1, scale: 1, fmt: (v) => `± ${v}°` },
  { key: "slowmo", label: "Zeitlupe", show: "play", min: 20, max: 50, step: 5, scale: 100, fmt: pct },
  { key: "decisionS", label: "Entscheidungszeit", show: "play", min: 1, max: 4, step: 0.5, scale: 1, fmt: (v) => `${v} s` },
  { key: "passDelayMax", label: "Pass-Verzögerung max.", show: "play", min: 0, max: 1, step: 0.05, scale: 1, fmt: (v) => `${v} s` },
  { key: "closeoutRandom", label: "Closeout-Zufall", show: "play", min: 0, max: 100, step: 5, scale: 100, fmt: pct },
  { key: "animSpeed", label: "Animationstempo", show: "play", min: 50, max: 150, step: 10, scale: 100, fmt: pct },
  { key: "tempoSpread", label: "Tempo-Spanne verteidigt", show: "play", min: 0, max: 50, step: 5, scale: 100, fmt: (v) => `± ${v} %` },
  { key: "zoneFloor", label: "Zonen-Untergrenze verteidigt", show: "play", min: 50, max: 90, step: 5, scale: 100, fmt: pct },
];

// Zahnrad + Dialog; jede Änderung wird sofort gespeichert und gemeldet.
export function createLabMenu(root: HTMLElement, s: Settings, onChange: (s: Settings) => void, onToggle?: (open: boolean) => void): void {
  const select = (f: SelectField) =>
    `<label data-show="${f.show}">${f.label} <select id="lab-${f.key}">${f.options.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></label>`;
  const range = (f: RangeField) =>
    `<label data-show="${f.show}">${f.label} <output id="lab-${f.key}-out"></output>
       <input type="range" id="lab-${f.key}" min="${f.min}" max="${f.max}" step="${f.step}"></label>`;
  root.insertAdjacentHTML(
    "beforeend",
    `<button class="lab-open" id="lab-open" aria-label="Labor-Einstellungen">⚙</button>
     <dialog class="lab" id="lab">
       <form method="dialog">
         <h2>Labor</h2>
         ${SELECTS.map(select).join("")}
         ${RANGES.map(range).join("")}
         <button class="lab-close" value="close">Fertig</button>
       </form>
     </dialog>`,
  );
  const dialog = root.querySelector<HTMLDialogElement>("#lab")!;
  const el = <T extends HTMLElement>(id: string) => root.querySelector<T>(`#lab-${id}`)!;
  let cur = { ...s };
  const view = (f: RangeField) => Math.round((cur[f.key] as number) * f.scale * 100) / 100;

  const fill = () => {
    for (const f of SELECTS) el<HTMLSelectElement>(f.key).value = String(cur[f.key]);
    for (const f of RANGES) {
      el<HTMLInputElement>(f.key).value = String(view(f));
      el(`${f.key}-out`).textContent = f.fmt(view(f));
    }
    dialog.querySelectorAll<HTMLElement>("[data-show]").forEach((l) => (l.hidden = l.dataset.show !== "all" && l.dataset.show !== cur.mode));
  };

  dialog.addEventListener("input", () => {
    const next: Record<string, unknown> = { ...cur };
    for (const f of SELECTS) next[f.key] = (f.parse ?? String)(el<HTMLSelectElement>(f.key).value);
    for (const f of RANGES) next[f.key] = Number(el<HTMLInputElement>(f.key).value) / f.scale;
    cur = next as unknown as Settings;
    fill();
    saveSettings(cur);
    onChange(cur);
  });
  dialog.addEventListener("close", () => onToggle?.(false));
  root.querySelector("#lab-open")!.addEventListener("click", () => {
    fill();
    dialog.showModal();
    onToggle?.(true);
  });
  fill();
}
