import { expect, it } from 'vitest';
import { createHud } from '../src/ui/hud';
import { createPlayHud } from '../src/ui/play-hud';

it('schreibt unveränderte HUD-Werte nicht erneut ins DOM', () => {
  const root = document.createElement('div'), hud = createHud(root), play = createPlayHud(root);
  const draw = () => {
    hud.setMeter(null, { g: 0, a: 0 }, 1.6);
    play.setScoreboard(12, 2, 0); play.setSituation(null); play.setRing(10, 20, .5, true);
    play.setHandler(10, 20, true); play.setFinishFeedback(null); play.setPoster(0, 0, false);
  };
  draw();
  const observer = new MutationObserver(() => {});
  observer.observe(root, { attributes: true, childList: true, characterData: true, subtree: true });
  draw(); expect(observer.takeRecords()).toEqual([]);
  observer.disconnect(); hud.dispose(); play.dispose();
});

it('ändert beim laufenden Meter nur den Füllstand und lässt unveränderte Zonen stehen', () => {
  const root = document.createElement('div'), hud = createHud(root);
  hud.setMeter(.2, { g: .07, a: 6 }, 1.6);
  const observer = new MutationObserver(() => {});
  observer.observe(root.querySelector('.hud-green')!, { attributes: true });
  hud.setMeter(.3, { g: .07, a: 6 }, 1.6);
  expect(observer.takeRecords()).toEqual([]);
  observer.disconnect(); hud.dispose();
});
