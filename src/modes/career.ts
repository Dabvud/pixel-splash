import type { Settings } from '../settings';
import { clearCareer, loadCareer } from '../career/state';
import type { Mode } from './mode';

export interface CareerDeps { storage?: Storage }

/** Karriere-Modus: Bildschirme rund um die Szenen (Gerüst – Erstellen, Saison und Szenen folgen) */
export function startCareer(app: HTMLElement, _s: Settings, deps: CareerDeps = {}): Mode {
  const root = document.createElement('div');
  root.className = 'career';
  app.append(root);

  const screen = (html: string, actions: [string, () => void][]): void => {
    root.innerHTML = `<div class="career-screen">${html}<div class="career-actions"></div></div>`;
    const box = root.querySelector('.career-actions')!;
    for (const [label, run] of actions) {
      const b = document.createElement('button');
      b.className = 'menu-btn';
      b.textContent = label;
      b.addEventListener('click', run);
      box.append(b);
    }
  };

  function start(): void {
    const saved = loadCareer(deps.storage);
    if (!saved) { screen('<h2>Karriere</h2>', [['Neue Karriere', create]]); return; }
    screen(`<h2>Karriere</h2><p>${escape(saved.player.name)} · ${saved.player.age} Jahre · Saison ${saved.year}</p>`,
      [['Fortsetzen', () => resume()], ['Neue Karriere', confirmNew]]);
  }
  function confirmNew(): void {
    screen('<h2>Alte Karriere löschen?</h2><p>Der bisherige Spielstand geht verloren.</p>',
      [['Ja, löschen', () => { clearCareer(deps.storage); create(); }], ['Abbrechen', start]]);
  }
  function create(): void {
    screen('<h2>Spieler erstellen</h2><p>Kommt im nächsten Schritt.</p>', [['Zurück', start]]);
  }
  function resume(): void {
    screen('<h2>Saison</h2><p>Kommt in einem späteren Schritt.</p>', [['Zurück', start]]);
  }

  start();
  return {
    apply() { /* Karriere nutzt die Einstellungen erst in den Szenen */ },
    stop() { root.remove(); },
  };
}

const escape = (t: string) => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
