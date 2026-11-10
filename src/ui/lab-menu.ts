import { PROFILES, SPOTS, saveSettings, type Settings } from "../settings";

const CAMERAS = [
  ["auto", "Automatisch"],
  ["low", "Tief hinter dem Spieler"],
  ["high", "Erhöht"],
];
const INFLUENCES = [
  ["off", "Aus"],
  ["light", "Leicht"],
  ["fair", "Fair"],
  ["strong", "Stark"],
];
const RESOLUTIONS = [220, 320, 420, 540];

const options = (list: string[][]) => list.map(([v, l]) => `<option value="${v}">${l}</option>`).join("");

// Zahnrad + Dialog; jede Änderung wird sofort gespeichert und gemeldet.
export function createLabMenu(root: HTMLElement, s: Settings, onChange: (s: Settings) => void): void {
  root.insertAdjacentHTML(
    "beforeend",
    `<button class="lab-open" id="lab-open" aria-label="Labor-Einstellungen">⚙</button>
     <dialog class="lab" id="lab">
       <form method="dialog">
         <h2>Wurf-Labor</h2>
         <label>Wurfspot <select id="lab-spot">${options(SPOTS.map((p) => [p.id, p.label]))}</select></label>
         <label>Kamera <select id="lab-camera">${options(CAMERAS)}</select></label>
         <label>Testprofil <select id="lab-profile">${options(PROFILES.map((p) => [p.id, p.label]))}</select></label>
         <label>Stat-Einfluss <select id="lab-influence">${options(INFLUENCES)}</select></label>
         <label>Anzeigedauer <output id="lab-meterMs-out"></output>
           <input type="range" id="lab-meterMs" min="400" max="1200" step="50"></label>
         <label>Grüne Zone <output id="lab-greenZone-out"></output>
           <input type="range" id="lab-greenZone" min="3" max="15" step="1"></label>
         <label>Richtungs-Spielraum <output id="lab-aimDeg-out"></output>
           <input type="range" id="lab-aimDeg" min="2" max="12" step="1"></label>
         <label>Pixel-Auflösung <select id="lab-pixelHeight">${options(RESOLUTIONS.map((r) => [String(r), `${r} px`]))}</select></label>
         <button class="lab-close" value="close">Fertig</button>
       </form>
     </dialog>`,
  );
  const dialog = root.querySelector<HTMLDialogElement>("#lab")!;
  const el = <T extends HTMLElement>(id: string) => root.querySelector<T>(`#lab-${id}`)!;
  let cur = { ...s };

  const fill = () => {
    el<HTMLSelectElement>("spot").value = cur.spot;
    el<HTMLSelectElement>("camera").value = cur.camera;
    el<HTMLSelectElement>("profile").value = cur.profile;
    el<HTMLSelectElement>("influence").value = cur.influence;
    el<HTMLSelectElement>("pixelHeight").value = String(cur.pixelHeight);
    el<HTMLInputElement>("meterMs").value = String(cur.meterMs);
    el<HTMLInputElement>("greenZone").value = String(Math.round(cur.greenZone * 100));
    el<HTMLInputElement>("aimDeg").value = String(cur.aimDeg);
    el("meterMs-out").textContent = `${cur.meterMs} ms`;
    el("greenZone-out").textContent = `± ${Math.round(cur.greenZone * 100)} %`;
    el("aimDeg-out").textContent = `± ${cur.aimDeg}°`;
  };

  dialog.addEventListener("input", () => {
    cur = {
      spot: el<HTMLSelectElement>("spot").value as Settings["spot"],
      camera: el<HTMLSelectElement>("camera").value as Settings["camera"],
      profile: el<HTMLSelectElement>("profile").value as Settings["profile"],
      influence: el<HTMLSelectElement>("influence").value as Settings["influence"],
      pixelHeight: Number(el<HTMLSelectElement>("pixelHeight").value) as Settings["pixelHeight"],
      meterMs: Number(el<HTMLInputElement>("meterMs").value),
      greenZone: Number(el<HTMLInputElement>("greenZone").value) / 100,
      aimDeg: Number(el<HTMLInputElement>("aimDeg").value),
    };
    fill();
    saveSettings(cur);
    onChange(cur);
  });
  root.querySelector("#lab-open")!.addEventListener("click", () => {
    fill();
    dialog.showModal();
  });
  fill();
}
