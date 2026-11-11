import { PROFILES, SPOTS, saveSettings, type Settings } from "../settings";
import { formatVersion } from "../version";

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
const FINISH_FOUL_STEPS = [-1, 0, 0.25, 0.5, 0.75, 1];
const finishFoulLabel = (v: number) => v < 0 ? 'Normal' : pct(v * 100);
const RANGES: RangeField[] = [
  { key: "meterMs", label: "Anzeigedauer Wurf", show: "all", min: 400, max: 1200, step: 50, scale: 1, fmt: (v) => `${v} ms` },
  { key: "greenZone", label: "Grüne Zone Wurf", show: "all", min: 3, max: 15, step: 1, scale: 100, fmt: (v) => `± ${v} %` },
  { key: "aimDeg", label: "Richtungs-Spielraum Wurf", show: "all", min: 2, max: 12, step: 1, scale: 1, fmt: (v) => `± ${v}°` },
  { key: "finishMeterMs", label: "Anzeigedauer Abschluss", show: "play", min: 300, max: 1500, step: 50, scale: 1, fmt: (v) => `${v} ms` },
  { key: "finishGreen", label: "Grüne Zone Abschluss", show: "play", min: 5, max: 25, step: 1, scale: 100, fmt: (v) => `± ${v} %` },
  { key: "finishAim", label: "Richtung Abschluss", show: "play", min: 4, max: 14, step: 1, scale: 1, fmt: (v) => `± ${v}°` },
  { key: "slowmo", label: "Zeitlupe", show: "play", min: 20, max: 50, step: 5, scale: 100, fmt: pct },
  { key: "decisionS", label: "Entscheidungsfenster", show: "play", min: 1.5, max: 4, step: 0.5, scale: 1, fmt: (v) => `${v} s` },
  { key: "passDelayMax", label: "Pass-Verzögerung max.", show: "play", min: 0, max: 1, step: 0.05, scale: 1, fmt: (v) => `${v} s` },
  { key: "closeoutRandom", label: "Closeout-Zufall", show: "play", min: 0, max: 100, step: 5, scale: 100, fmt: pct },
  { key: "animSpeed", label: "Animationstempo", show: "play", min: 50, max: 150, step: 10, scale: 100, fmt: pct },
  { key: "tempoSpread", label: "Tempo-Spanne verteidigt", show: "play", min: 0, max: 50, step: 5, scale: 100, fmt: (v) => `± ${v} %` },
  { key: "zoneFloor", label: "Zonen-Untergrenze verteidigt", show: "play", min: 50, max: 90, step: 5, scale: 100, fmt: pct },
];

// Zahnrad + Dialog; jede Änderung wird sofort gespeichert und gemeldet.
export function createLabMenu(root: HTMLElement, s: Settings, onChange: (s: Settings) => void, onToggle?: (open: boolean) => void, onRestart?: () => void,
  onPauseOpen?: (extra: HTMLElement) => void): void {
  const select = (f: SelectField) =>
    `<label data-show="${f.show}">${f.label} <select id="lab-${f.key}">${f.options.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></label>`;
  const range = (f: RangeField) =>
    `<label data-show="${f.show}">${f.label} <output id="lab-${f.key}-out"></output>
       <input type="range" id="lab-${f.key}" min="${f.min}" max="${f.max}" step="${f.step}"></label>`;
  root.insertAdjacentHTML(
    "beforeend",
    `<button class="lab-open" id="lab-open" aria-label="Pause">⏸</button>
     <dialog class="lab pause" id="pause" aria-labelledby="pause-title">
       <h2 id="pause-title">Pause</h2>
       <button class="lab-close" id="pause-resume">Weiter</button>
       <button class="pause-btn" id="pause-restart">${s.mode === "play" ? "Spielzug neu starten" : "Statistik zurücksetzen"}</button>
       <button class="pause-btn" id="pause-settings">Einstellungen</button>
       <div id="pause-extra"></div>
     </dialog>
     <dialog class="lab" id="lab" aria-labelledby="lab-title">
       <form method="dialog">
         <h2 id="lab-title">Labor</h2>
         ${SELECTS.map(select).join("")}
         ${RANGES.map(range).join("")}
         <section id="lab-test-scenarios" data-show="play" aria-labelledby="lab-test-title">
           <h3 id="lab-test-title">Test-Szenarien</h3>
           <label>Foul am Korb <output id="lab-finishFoulChance-out"></output>
             <input type="range" id="lab-finishFoulChance" min="0" max="5" step="1" aria-describedby="lab-finishFoulChance-steps">
           </label>
           <p id="lab-finishFoulChance-steps">${FINISH_FOUL_STEPS.map(finishFoulLabel).join(' / ')}</p>
           <label>Poster erzwingen <input type="checkbox" role="switch" id="lab-forcePoster"></label>
           <label>Brett zerbrechen erzwingen <input type="checkbox" role="switch" id="lab-forceGlass"></label>
           <label>Ohnmacht auf der Bank erzwingen <input type="checkbox" role="switch" id="lab-forceFaint"></label>
           <label>Poster-Variante <select id="lab-posterVariant">
             <option value="random">Zufall</option><option value="classic">Klassisch</option>
             <option value="flyout">Abflug</option><option value="grave">Grabstein</option>
             <option value="crowd">Ins Publikum</option><option value="net">Im Netz</option>
             <option value="ghost">Geist</option><option value="stuck">Steckt im Boden</option>
             <option value="jumbotron">Anzeigetafel</option>
           </select></label>
         </section>
         <button class="lab-close" value="close">Fertig</button>
       </form>
     </dialog>`,
  );
  const versionText = formatVersion(__APP_VERSION__, __COMMIT_HASH__, new Date(__BUILD_DATE__));
  const cornerVersion = document.createElement("div");
  cornerVersion.className = "build-version app-version";
  cornerVersion.textContent = versionText;
  root.append(cornerVersion);
  const pauseVersion = document.createElement("div");
  pauseVersion.className = "build-version";
  pauseVersion.textContent = versionText;
  root.querySelector("#pause-title")!.after(pauseVersion);
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
    const foulStep = FINISH_FOUL_STEPS.reduce((best, value, i) =>
      Math.abs(value - cur.finishFoulChance) < Math.abs(FINISH_FOUL_STEPS[best] - cur.finishFoulChance) ? i : best, 0);
    el<HTMLInputElement>('finishFoulChance').value = String(foulStep);
    el<HTMLInputElement>('finishFoulChance').setAttribute('aria-valuetext', finishFoulLabel(cur.finishFoulChance));
    el('finishFoulChance-out').textContent = finishFoulLabel(cur.finishFoulChance);
    el<HTMLInputElement>('forcePoster').checked = cur.forcePoster;
    el<HTMLInputElement>('forceGlass').checked = cur.forceGlass;
    el<HTMLInputElement>('forceFaint').checked = cur.forceFaint;
    el<HTMLSelectElement>('posterVariant').value = cur.posterVariant;
    dialog.querySelectorAll<HTMLElement>("[data-show]").forEach((l) => (l.hidden = l.dataset.show !== "all" && l.dataset.show !== cur.mode));
  };

  dialog.addEventListener("input", () => {
    const next: Record<string, unknown> = { ...cur };
    for (const f of SELECTS) next[f.key] = (f.parse ?? String)(el<HTMLSelectElement>(f.key).value);
    for (const f of RANGES) next[f.key] = Number(el<HTMLInputElement>(f.key).value) / f.scale;
    next.finishFoulChance = FINISH_FOUL_STEPS[Number(el<HTMLInputElement>('finishFoulChance').value)];
    next.forcePoster = el<HTMLInputElement>('forcePoster').checked;
    next.forceGlass = el<HTMLInputElement>('forceGlass').checked;
    next.forceFaint = el<HTMLInputElement>('forceFaint').checked;
    next.posterVariant = el<HTMLSelectElement>('posterVariant').value;
    cur = next as unknown as Settings;
    fill();
    saveSettings(cur);
    onChange(cur);
  });
  const pause = root.querySelector<HTMLDialogElement>("#pause")!;
  let toSettings = false; // Pause schließt nur, um die Einstellungen zu öffnen → weiter angehalten
  dialog.addEventListener("close", () => onToggle?.(false));
  pause.addEventListener("close", () => {
    if (!toSettings) onToggle?.(false);
    toSettings = false;
  });
  root.querySelector("#lab-open")!.addEventListener("click", () => {
    root.querySelector("#pause-restart")!.textContent = cur.mode === "play" ? "Spielzug neu starten" : "Statistik zurücksetzen";
    const extra = root.querySelector<HTMLElement>("#pause-extra")!;
    extra.replaceChildren();
    onPauseOpen?.(extra);
    pause.showModal();
    onToggle?.(true);
  });
  root.querySelector("#pause-resume")!.addEventListener("click", () => pause.close());
  root.querySelector("#pause-restart")!.addEventListener("click", () => {
    onRestart?.();
    pause.close();
  });
  root.querySelector("#pause-settings")!.addEventListener("click", () => {
    toSettings = true;
    pause.close();
    fill();
    dialog.showModal();
  });
  fill();
}
