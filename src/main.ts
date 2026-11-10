import "@fontsource/press-start-2p";
import "./style.css";
import { loadSettings, type Settings } from "./settings";
import { createLabMenu } from "./ui/lab-menu";
import { startShotLab } from "./modes/shot-lab";
import { startPlayLab } from "./modes/play-lab";
import type { Mode } from "./modes/mode";

const app = document.getElementById("app")!;
let settings: Settings = loadSettings();
const start = (s: Settings): Mode => (s.mode === "play" ? startPlayLab(app, s) : startShotLab(app, s));
let mode = start(settings);

const onChange = (s: Settings): void => {
  const switched = s.mode !== settings.mode;
  settings = s;
  if (switched) {
    mode.stop();
    mode = start(s);
    mode.setPaused?.(Boolean(app.querySelector("dialog[open]")));
  } else {
    mode.apply(s);
  }
};

createLabMenu(app, settings, onChange, (open) => mode.setPaused?.(open), () => mode.restart?.());
