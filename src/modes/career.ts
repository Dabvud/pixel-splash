import type { Settings } from '../settings';
import { clearCareer, loadCareer, saveCareer, type CareerState, type KeyGame } from '../career/state';
import { newCareer, seededRng } from '../career/create';
import { teamById, teamName } from '../career/league';
import { dressTeams, registerHero, unregisterHero } from '../career/hero';
import { finalDeficit, gameResult, projectLine, scenePlan, sceneSpec, scheduleSeason } from '../career/keygame';
import { finishSeason, playoffStatus, projectWins, standings, strengthOf } from '../career/season';
import type { PlayScene, SceneResult } from '../career/scene-types';
import { createCareerScreen } from '../ui/career-create';
import { startPlayLab } from './play-lab';
import type { Mode } from './mode';

export interface CareerDeps { storage?: Storage; seed?: number; playScene?: PlayScene }

const TICKER_MS = 2500;
const STATUS = { playoffs: 'Playoffs erreicht – die Playoffs kommen in einem späteren Update.', playin: 'Play-In erreicht – kommt in einem späteren Update.', out: 'Keine Playoffs in dieser Saison.' };

/** Karriere-Modus: Bildschirme rund um die Szenen; gespeichert wird nach jedem Key Game und Saisonwechsel */
export function startCareer(app: HTMLElement, settings: Settings, deps: CareerDeps = {}): Mode {
  const root = document.createElement('div');
  root.className = 'career';
  app.append(root);
  const playScene: PlayScene = deps.playScene ?? ((a, s, spec, onEnd) => startPlayLab(a, s, { spec, onEnd }));
  let current = settings;
  let scene: Mode | null = null;
  let undress: (() => void) | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let paused = false;

  const screen = (html: string, actions: [string, () => void][], cls = ''): void => {
    root.innerHTML = `<div class="career-screen ${cls}">${html}<div class="career-actions"></div></div>`;
    const box = root.querySelector('.career-actions')!;
    for (const [label, run] of actions) {
      const b = document.createElement('button');
      b.className = 'menu-btn';
      b.textContent = label;
      b.addEventListener('click', run);
      box.append(b);
    }
  };
  const save = (c: CareerState) => saveCareer(c, deps.storage);
  const gameRng = (c: CareerState) => seededRng((c.seed ^ (c.year * 7919 + c.gameIndex * 104729)) >>> 0);

  function start(): void {
    const saved = loadCareer(deps.storage);
    if (!saved) { screen('<h2>Karriere</h2>', [['Neue Karriere', create]]); return; }
    screen(`<h2>Karriere</h2><p>${esc(saved.player.name)} · ${saved.player.age} Jahre · Saison ${saved.year}</p>`,
      [['Fortsetzen', () => hub(saved)], ['Neue Karriere', confirmNew]]);
  }
  function confirmNew(): void {
    screen('<h2>Alte Karriere löschen?</h2><p>Der bisherige Spielstand geht verloren.</p>',
      [['Ja, löschen', () => { clearCareer(deps.storage); create(); }], ['Abbrechen', start]]);
  }
  function create(): void {
    createCareerScreen(root, input => {
      const c = newCareer(input, deps.seed ?? (Date.now() >>> 0));
      c.keyGames = scheduleSeason(c, gameRng(c));
      save(c);
      screen(`<h2>Draft</h2><p>Die ${esc(teamName(teamById(c.team)))} holen ${esc(c.player.name)} mit der Nummer ${c.player.num}!</p>`,
        [['Weiter', () => hub(c)]]);
    });
  }

  function hub(c: CareerState): void {
    if (c.retired) return careerEnd(c);
    if (!c.keyGames.length) { c = { ...c, keyGames: scheduleSeason(c, gameRng(c)) }; save(c); }
    if (c.gameIndex >= c.keyGames.length) return seasonEnd(c);
    const game = c.keyGames[c.gameIndex], wins = c.season.filter(g => g.won).length;
    screen(`<h2>Saison ${c.year}</h2>
      <p>${esc(c.player.name)} · #${c.player.num} · ${c.player.age} Jahre · ${esc(teamName(teamById(c.team)))}</p>
      ${c.injured ? '<p>Verletzt: diese Saison nur 3 Key Games.</p>' : ''}
      <p>Bilanz Key Games: ${wins} – ${c.season.length - wins}</p>
      <div class="career-next"><b>Key Game ${c.gameIndex + 1} / ${c.keyGames.length}</b><br>${esc(game.label)}<br>${opponentLine(game)}</div>`,
      [['Spielen', () => playGame(c, game)], ['Karriere-Statistik', () => stats(c, () => hub(c))]]);
  }

  function playGame(c: CareerState, game: KeyGame): void {
    const rng = gameRng(c), total = scenePlan(game), results: SceneResult[] = [];
    const own = teamById(c.team), opp = teamById(game.opponent);
    const next = (): void => {
      const i = results.length;
      if (i >= total) return finishGame(c, game, results, rng);
      const deficit = i === total - 1 ? finalDeficit(results.map(r => r.won)) : 1 + Math.floor(rng() * 4);
      const spec = sceneSpec(c, game, i, total, deficit, rng);
      const go = (): void => {
        clearTimeout(timer);
        root.innerHTML = '';
        undress = dressTeams(own, opp);
        registerHero(c.player, own);
        scene = playScene(app, current, spec, r => {
          endScene();
          results.push(r);
          next();
        });
        scene.setPaused?.(paused);
      };
      root.innerHTML = `<div class="career-screen career-ticker" role="button" tabindex="0">
        <p class="ticker-label">${esc(spec.subtitle)}</p><h2>${esc(spec.title)}</h2>
        <p>Szene ${i + 1} / ${total} · Tippen zum Starten</p></div>`;
      root.querySelector('.career-ticker')!.addEventListener('click', go);
      timer = setTimeout(go, TICKER_MS);
    };
    next();
  }
  function endScene(): void {
    scene?.stop(); scene = null;
    undress?.(); undress = null;
    unregisterHero();
  }

  function finishGame(c: CareerState, game: KeyGame, results: SceneResult[], rng: () => number): void {
    const won = gameResult(results, rng), line = projectLine(c.player.ratings, results, rng);
    const ownPts = 96 + Math.floor(rng() * 22), margin = 1 + Math.floor(rng() * 12);
    const oppPts = won ? ownPts - margin : ownPts + margin;
    const after: CareerState = { ...c, gameIndex: c.gameIndex + 1,
      season: [...c.season, { opponent: game.opponent, label: game.label, home: game.home, won, ...line }] };
    save(after);
    screen(`<h2>${won ? 'Sieg' : 'Niederlage'}</h2><p>${ownPts} : ${oppPts} ${opponentLine(game)}</p>
      <p class="career-line">PTS ${line.pts} · AST ${line.ast} · REB ${line.reb}</p>`, [['Weiter', () => hub(after)]]);
  }

  function seasonEnd(c: CareerState): void {
    const seed = (c.seed ^ (c.year * 31337)) >>> 0;
    const keyWins = c.season.filter(g => g.won).length;
    const ownWins = projectWins(strengthOf(c, c.team), keyWins, c.keyGames.length, c.difficulty, seededRng(seed));
    // gleicher Seed wie in finishSeason → angezeigte Tabelle = gespeicherter Platz
    const table = standings(c, ownWins, seededRng(seed + 1));
    const rank = table.findIndex(r => r.team === c.team) + 1;
    screen(`<h2>Saisonende ${c.year}</h2><p>${ownWins} – ${82 - ownWins} · Platz ${rank} in der ${teamById(c.team).conference === 'east' ? 'Eastern' : 'Western'} Conference</p>
      <p>${STATUS[playoffStatus(rank)]}</p>
      <table class="career-table"><thead><tr><th>#</th><th>Team</th><th>S</th><th>N</th></tr></thead><tbody>${table.map((r, i) =>
        `<tr${r.team === c.team ? ' class="own"' : ''}><td>${i + 1}</td><td>${esc(teamName(teamById(r.team)))}</td><td>${r.wins}</td><td>${r.losses}</td></tr>`).join('')}</tbody></table>`,
      [['Nächste Saison', () => { const n = finishSeason(c, ownWins, seededRng(seed + 1)); save(n); hub(n); }]], 'career-long');
  }

  function stats(c: CareerState, back: () => void): void {
    screen(`<h2>Karriere-Statistik</h2>${historyTable(c)}`, [['Zurück', back]], 'career-long');
  }
  function careerEnd(c: CareerState): void {
    screen(`<h2>Karriere beendet</h2><p>${esc(c.player.name)} · ${c.history.length} Saisons</p>${historyTable(c)}`,
      [['Neue Karriere', confirmNew]], 'career-long');
  }
  function historyTable(c: CareerState): string {
    const avg = (g: { pts: number }[]) => g.length ? (g.reduce((s, x) => s + x.pts, 0) / g.length).toFixed(1) : '–';
    return `<table class="career-table"><thead><tr><th>Saison</th><th>Team</th><th>Alter</th><th>Bilanz</th><th>Platz</th><th>PTS</th></tr></thead><tbody>${
      c.history.map(h => `<tr><td>${h.year}</td><td>${esc(teamById(h.team).name)}</td><td>${h.age}</td><td>${h.wins}–${h.losses}</td><td>${h.rank}</td><td>${avg(h.games)}</td></tr>`).join('')}</tbody></table>`;
  }
  const opponentLine = (g: KeyGame) => `${g.home ? 'gegen die' : 'bei den'} ${esc(teamName(teamById(g.opponent)))}`;

  start();
  return {
    apply(s) { current = s; scene?.apply(s); },
    setPaused(p) { paused = p; scene?.setPaused?.(p); },
    renderPause(extra) { scene?.renderPause?.(extra); },
    stop() { clearTimeout(timer); endScene(); root.remove(); },
  };
}

const esc = (t: string) => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
