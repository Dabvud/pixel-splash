import type { Settings } from '../settings';
import { clearCareer, loadCareer, saveCareer, type CareerState, type KeyGame } from '../career/state';
import { newCareer, seededRng } from '../career/create';
import { teamById, teamName } from '../career/league';
import { dressTeams, registerHero, unregisterHero } from '../career/hero';
import { finalDeficit, gameResult, projectLine, scenePlan, sceneSpec, scheduleSeason } from '../career/keygame';
import { finishSeason, playoffStatus, projectWins, standings, strengthOf } from '../career/season';
import { ROUND_NAME, advance, postseasonGame, startPostseason, type PlayoffResult } from '../career/playoffs';
import type { PlayScene, SceneResult } from '../career/scene-types';
import { acceptOffer, ackTrade, beginOffseason, endOffseason, spend } from '../career/offseason';
import { RATING_KEYS, type RatingKey } from '../play/ratings';
import { SPECS, STAGE_COST, buyStage, chooseSpec, perksOf, updateHot, type SpecId } from '../career/spec';
import type { SceneSpec } from '../career/scene-types';
import { createCareerScreen } from '../ui/career-create';
import { startPlayLab } from './play-lab';
import type { Mode } from './mode';

export interface CareerDeps { storage?: Storage; seed?: number; playScene?: PlayScene }

const TICKER_MS = 2500;
const RATING_LABEL: Record<RatingKey, string> = { mid: 'Mitteldistanz', three: 'Dreier', finish: 'Korbleger', dunk: 'Dunk', dribble: 'Dribbling',
  pass: 'Passen', athleticism: 'Athletik', defense: 'Verteidigung', leadership: 'Führung' };
const money = (m: number) => `${m.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Mio. $`;
const STATUS = { playoffs: 'Playoffs erreicht!', playin: 'Play-In erreicht – ein Spiel um die Playoffs.', out: 'Keine Playoffs in dieser Saison.' };
const RESULT_TEXT: Record<PlayoffResult, string> = { none: 'Keine Playoffs', playin: 'Im Play-In ausgeschieden', r1: 'In der 1. Runde ausgeschieden',
  r2: 'Im Conference-Halbfinale ausgeschieden', cf: 'Im Conference-Finale ausgeschieden', finals: 'In den NBA Finals verloren', champion: 'MEISTER!' };
const RESULT_SHORT: Record<PlayoffResult, string> = { none: '–', playin: 'Play-In', r1: '1. Runde', r2: 'Halbfinale', cf: 'Conf.-Finale', finals: 'Finals', champion: 'Meister' };

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
    if (c.offseason) return offseason(c);
    if (!c.keyGames.length) { c = { ...c, keyGames: scheduleSeason(c, gameRng(c)) }; save(c); }
    if (c.gameIndex >= c.keyGames.length) return c.postseason ? c.postseason.done ? postseasonEnd(c) : playoffHub(c) : seasonEnd(c);
    const game = c.keyGames[c.gameIndex], wins = c.season.filter(g => g.won).length;
    screen(`<h2>Saison ${c.year}</h2>
      <p>${esc(c.player.name)} · #${c.player.num} · ${c.player.age} Jahre · ${esc(teamName(teamById(c.team)))}</p>
      ${c.injured ? '<p>Verletzt: diese Saison nur 3 Key Games.</p>' : ''}
      <p>Bilanz Key Games: ${wins} – ${c.season.length - wins}</p>
      ${c.contract ? `<p>Vertrag: noch ${c.contract.years} ${c.contract.years === 1 ? 'Jahr' : 'Jahre'} · ${money(c.contract.salary)}</p>` : ''}
      <div class="career-next"><b>Key Game ${c.gameIndex + 1} / ${c.keyGames.length}</b><br>${esc(game.label)}<br>${opponentLine(game)}</div>`,
      [['Spielen', () => playGame(c, game)], ['Karriere-Statistik', () => stats(c, () => hub(c))]]);
  }

  function playGame(c: CareerState, game: KeyGame, finish = (results: SceneResult[], rng: () => number) => finishGame(c, game, results, rng),
    rng = gameRng(c)): void {
    const total = scenePlan(game), results: SceneResult[] = [];
    const own = teamById(c.team), opp = teamById(game.opponent);
    const next = (): void => {
      const i = results.length;
      if (i >= total) return finish(results, rng);
      const deficit = i === total - 1 ? finalDeficit(results.map(r => r.won)) : 1 + Math.floor(rng() * 4);
      const perks = perksOf(c.player), hot = updateHot(c.hot ?? 0, results);
      const withPerks = (sp: SceneSpec): SceneSpec => ({ ...sp, perks: { ...perks, onFire: Boolean(perks.greenLight) && hot >= 2 } });
      const spec = withPerks(sceneSpec(c, game, i, total, deficit, rng));
      // Coach-Call: zweiter Spielzug zur Wahl (gleiche Lage, anderer Spielzug)
      let alt: SceneSpec | undefined;
      for (let k = 0; perks.coachCall && k < 6 && (!alt || alt.play.id === spec.play.id); k++) alt = withPerks({ ...sceneSpec(c, game, i, total, deficit, rng), title: spec.title, clockS: spec.clockS, deficit });
      if (alt?.play.id === spec.play.id) alt = undefined;
      const go = (chosen: SceneSpec = spec): void => {
        clearTimeout(timer);
        root.innerHTML = '';
        undress = dressTeams(own, opp);
        registerHero(c.player, own);
        scene = playScene(app, current, chosen, r => {
          endScene();
          results.push(r);
          next();
        });
        scene.setPaused?.(paused);
      };
      const fireNote = spec.perks?.onFire ? '<p class="ticker-fire">🔥 Green Light – du brennst!</p>' : '';
      if (alt) {
        screen(`<p class="ticker-label">${esc(spec.subtitle)}</p><h2>${esc(spec.title)}</h2>${fireNote}<p>Szene ${i + 1} / ${total} · Coach-Call: wähle den Spielzug</p>`,
          [[spec.play.name, () => go(spec)], [alt.play.name, () => go(alt!)]]);
        return;
      }
      root.innerHTML = `<div class="career-screen career-ticker" role="button" tabindex="0">
        <p class="ticker-label">${esc(spec.subtitle)}</p><h2>${esc(spec.title)}</h2>${fireNote}
        <p>Szene ${i + 1} / ${total} · Tippen zum Starten</p></div>`;
      root.querySelector('.career-ticker')!.addEventListener('click', () => go());
      timer = setTimeout(() => go(), TICKER_MS);
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
    const after: CareerState = { ...c, gameIndex: c.gameIndex + 1, hot: updateHot(c.hot ?? 0, results),
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
      rank <= 10
        ? [[rank <= 6 ? 'Playoffs' : 'Play-In', () => {
          const n = { ...c, postseason: startPostseason(c, ownWins, table, seededRng(seed + 2))! };
          save(n); playoffHub(n);
        }]]
        : [['Nächste Saison', () => nextSeason(c, ownWins)]], 'career-long');
  }
  function nextSeason(c: CareerState, ownWins: number): void {
    // gleicher Seed wie die Tabelle am Saisonende → gespeicherter Platz = angezeigter Platz
    const n = finishSeason(c, ownWins, seededRng(((c.seed ^ (c.year * 31337)) >>> 0) + 1));
    const o = beginOffseason(n, seededRng(((n.seed ^ (n.year * 4243)) >>> 0)));
    save(o); hub(o);
  }

  function offseason(c: CareerState): void {
    const o = c.offseason!;
    const go = (n: CareerState) => { save(n); hub(n); };
    if (o.step === 'trade') {
      return screen(`<h2>Trade!</h2><p>${esc(c.player.name)} wurde zu den ${esc(teamName(teamById(o.tradedTo!)))} getradet. Der Vertrag läuft weiter.</p>`,
        [['Weiter', () => go(ackTrade(c))]]);
    }
    if (o.step === 'offers') {
      const cards = o.offers!.map(offer => {
        const t = teamById(offer.team), strength = strengthOf(c, offer.team);
        return `<div class="offer"><b>${esc(teamName(t))}${offer.team === c.team ? ' (Verlängerung)' : ''}</b>
          <span class="offer-bar" style="--v:${strength}%" title="Teamstärke ${strength}"></span>
          <span>${offer.years} ${offer.years === 1 ? 'Jahr' : 'Jahre'} · ${money(offer.salary)} · <em>${offer.spPerYear} Skillpunkte/Jahr</em></span></div>`;
      }).join('');
      return screen(`<h2>Vertragsangebote</h2><p>Dein Vertrag ist ausgelaufen. Schwache Teams locken manchmal mit mehr Skillpunkten – dort ist es aber schwerer zu gewinnen.</p><div class="offers">${cards}</div>`,
        o.offers!.map(offer => [`Unterschreiben: ${teamName(teamById(offer.team))}`, () => go(acceptOffer(c, offer))] as [string, () => void]), 'career-long');
    }
    const rows = RATING_KEYS.map(k => `<div class="skill"><span>${RATING_LABEL[k]} <small>${Math.round(c.player.ratings[k] * 100)}</small></span><span class="offer-bar" style="--v:${Math.round(c.player.ratings[k] * 100)}%"></span>
      <button class="skill-plus" data-key="${k}" aria-label="${RATING_LABEL[k]} verbessern" ${o.points <= 0 || c.player.ratings[k] >= 1 ? 'disabled' : ''}>+</button></div>`).join('');
    const p = c.player, lv = p.specLevel ?? 0;
    const specBox = !p.spec
      ? `<div class="spec-box"><b>Spezialisierung wählen (einmalig)</b>${(Object.keys(SPECS) as SpecId[]).map(id =>
        `<button class="spec-choose menu-btn" data-spec="${id}">${SPECS[id].name}</button>`).join('')}</div>`
      : `<div class="spec-box"><b>${SPECS[p.spec].name} · Stufe ${lv} / 3</b><ol>${SPECS[p.spec].stages.map((t, i) =>
        `<li class="${i < lv ? 'done' : ''}">${esc(t)}</li>`).join('')}</ol>${lv < 3
        ? `<button class="spec-buy menu-btn" ${o.points < STAGE_COST[lv] ? 'disabled' : ''}>Stufe ${lv + 1} freischalten (${STAGE_COST[lv]} Punkte)</button>` : ''}</div>`;
    screen(`<h2>Skillpunkte</h2><p>Noch ${o.points} ${o.points === 1 ? 'Punkt' : 'Punkte'} · jeder Punkt +2</p>${specBox}<div class="skills">${rows}</div>`,
      [['Fertig', () => go(endOffseason(c))]], 'career-long');
    root.querySelectorAll<HTMLButtonElement>('.skill-plus').forEach(b => b.addEventListener('click', () => go(spend(c, b.dataset.key as RatingKey))));
    root.querySelector('.spec-buy')?.addEventListener('click', () => go(buyStage(c)));
    root.querySelectorAll<HTMLButtonElement>('.spec-choose').forEach(b => b.addEventListener('click', () => go(chooseSpec(c, b.dataset.spec as SpecId))));
  }

  const postRng = (c: CareerState) => seededRng((c.seed ^ (c.year * 7919 + 5000 + (c.postseason?.faced.length ?? 0) * 104729)) >>> 0);
  function playoffHub(c: CareerState): void {
    const p = c.postseason!, game = postseasonGame(p);
    screen(`<h2>${ROUND_NAME[p.round]}</h2><p>Saison ${c.year} · ${esc(teamName(teamById(c.team)))}</p>
      <div class="career-next"><b>${esc(p.situation)}</b><br>${opponentLine(game)}</div>`,
      [['Spielen', () => playGame(c, game, (results, rng) => finishPlayoff(c, game, results, rng), postRng(c))]]);
  }
  function finishPlayoff(c: CareerState, game: KeyGame, results: SceneResult[], rng: () => number): void {
    const p = c.postseason!, won = gameResult(results, rng), line = projectLine(c.player.ratings, results, rng);
    const next = advance(p, won, c, rng), after: CareerState = { ...c, postseason: next, hot: updateHot(c.hot ?? 0, results) };
    save(after);
    const title = !won ? p.round === 'playin' ? 'Play-In verloren' : 'Ausgeschieden'
      : next.done ? 'MEISTER!' : p.round === 'playin' ? 'Play-In gewonnen' : 'Serie gewonnen';
    const ownPts = 96 + Math.floor(rng() * 22), margin = 1 + Math.floor(rng() * 12);
    screen(`<h2 class="${next.result === 'champion' ? 'champion' : ''}">${title}</h2><p>${ownPts} : ${won ? ownPts - margin : ownPts + margin} ${opponentLine(game)}</p>
      <p class="career-line">PTS ${line.pts} · AST ${line.ast} · REB ${line.reb}</p>`, [['Weiter', () => hub(after)]]);
  }
  function postseasonEnd(c: CareerState): void {
    const p = c.postseason!;
    screen(`<h2>Saison ${c.year} beendet</h2><p>${p.ownWins} – ${82 - p.ownWins} · Platz ${p.rank}</p><p>${RESULT_TEXT[p.result]}</p>`,
      [['Nächste Saison', () => nextSeason(c, p.ownWins)]]);
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
    const rings = c.history.filter(h => h.playoff === 'champion').length;
    return `<p class="career-rings">Ringe: ${rings}</p><table class="career-table"><thead><tr><th>Saison</th><th>Team</th><th>Alter</th><th>Bilanz</th><th>Platz</th><th>Playoffs</th><th>PTS</th></tr></thead><tbody>${
      c.history.map(h => `<tr${h.playoff === 'champion' ? ' class="own"' : ''}><td>${h.year}</td><td>${esc(teamById(h.team).name)}</td><td>${h.age}</td><td>${h.wins}–${h.losses}</td><td>${h.rank}</td><td>${RESULT_SHORT[h.playoff ?? 'none']}</td><td>${avg(h.games)}</td></tr>`).join('')}</tbody></table>`;
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
