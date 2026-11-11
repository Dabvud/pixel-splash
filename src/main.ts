import { registerSW } from "virtual:pwa-register";
import { registerAppUpdate } from "./pwa-update";
import "@fontsource/press-start-2p";
import "./style.css";
import { loadSettings, saveSettings, type Settings } from "./settings";
import { createLabMenu } from "./ui/lab-menu";
import { createMainMenu, type MenuPick } from "./ui/main-menu";
import { startShotLab } from "./modes/shot-lab";
import { startPlayLab } from "./modes/play-lab";
import { startCareer } from "./modes/career";
import type { Mode } from "./modes/mode";

const app = document.getElementById("app")!;
let settings: Settings = loadSettings();
const start = (s: Settings): Mode =>
  s.mode === "career" ? startCareer(app, s) : s.mode === "play" ? startPlayLab(app, s) : startShotLab(app, s);
// Beim Start erst das Hauptmenü; ein Modus läuft erst nach der Wahl
let mode: Mode | null = null;

const onChange = (s: Settings): void => {
  const switched = s.mode !== settings.mode;
  settings = s;
  if (!mode) return;
  if (switched) {
    mode.stop();
    mode = start(s);
    mode.setPaused?.(Boolean(app.querySelector("dialog[open]")));
  } else {
    mode.apply(s);
  }
};

const pick = (m: MenuPick): void => {
  settings = { ...settings, mode: m };
  saveSettings(settings);
  lab.sync(settings);
  mode?.stop();
  mode = start(settings);
  menu.hide();
};

const lab = createLabMenu(app, settings, onChange, (open) => mode?.setPaused?.(open), () => mode?.restart?.(),
  (extra) => mode?.renderPause?.(extra), () => { mode?.stop(); mode = null; menu.show(); });
const menu = createMainMenu(app, pick);
menu.show();

registerAppUpdate(registerSW);
