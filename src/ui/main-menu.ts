export type MenuPick = 'career' | 'shot' | 'play';

const ENTRIES: [MenuPick, string][] = [['career', 'Karriere'], ['shot', 'Wurf-Labor'], ['play', 'Spielzug-Labor']];

/** Startbildschirm: Karriere oder eines der Labore */
export function createMainMenu(root: HTMLElement, onPick: (mode: MenuPick) => void): { show(): void; hide(): void } {
  const el = document.createElement('div');
  el.className = 'main-menu';
  el.hidden = true;
  el.innerHTML = `<h1 class="main-menu-title">PIXEL<br>SPLASH</h1><nav class="main-menu-list"></nav>`;
  const list = el.querySelector('nav')!;
  for (const [mode, label] of ENTRIES) {
    const b = document.createElement('button');
    b.className = 'menu-btn';
    b.textContent = label;
    b.addEventListener('click', () => onPick(mode));
    list.append(b);
  }
  root.append(el);
  return { show() { el.hidden = false; }, hide() { el.hidden = true; } };
}
