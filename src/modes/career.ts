import type { Settings } from '../settings';
import { clearCareer, loadCareer, saveCareer, type CareerState, type KeyGame } from '../career/state';
import { newCareer, seededRng } from '../career/create';
import { teamById, teamName } from '../career/league';
import { dressTeams, registerHero, unregisterHero } from '../career/hero';
import { projectLine, scenePlan, sceneSpec, scheduleSeason } from '../career/keygame';
import { advanceScore, crunch, fate, openingScore, sceneGap, type GameScore } from '../career/momentum';

/** Ausgang eines Key Games: Sieg/Niederlage, Endstand, optional Hinweis (Crunchtime schon entschieden) */
interface Outcome { won: boolean; own: number; opp: number; note?: string }
import { finishSeason, offDef, otherSeed, playoffStatus, projectWins, seasonSeed, standings, strengthOf } from '../career/season';
import { ROUND_NAME, advance, postseasonGame, startPostseason, type PlayoffResult } from '../career/playoffs';
import type { PlayScene, SceneResult } from '../career/scene-types';
import { teamLogo } from '../career/logos';
import { acceptOffer, ackNews, ackTrade, beginOffseason, endOffseason, refund, refundStage, spend } from '../career/offseason';
import { RATING_KEYS, type RatingKey } from '../play/ratings';
import { SPECS, STAGE_COST, buyStage, chooseSpec, perksOf, updateHot, type SpecId } from '../career/spec';
import type { SceneSpec } from '../career/scene-types';
import { AWARDS, addToRanking, awardPoints, legacyOf, loadRanking, tierOf, type AwardId } from '../career/legacy';
import { createCareerScreen } from '../ui/career-create';
import { startPlayLab } from './play-lab';
import type { Mode } from './mode';

export interface CareerDeps { storage?: Storage; seed?: number; playScene?: PlayScene }

const TICKER_MS = 2500;
/** Schwierigkeit in den Szenen (mit dem Nutzer abgestimmt): grüne Zone, Meter-Dauer, KI-Trefferquote, Steal-Chance eigener Pässe */
const TUNING = { rookie: { zone: 1.2, meter: 1.1, ai: 1.1, steal: .8 }, pro: { zone: 1, meter: 1, ai: 1, steal: 1 }, hof: { zone: .8, meter: .9, ai: .85, steal: 1.2 } };
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
    if (!saved) { screen('<h2>Karriere</h2>', [['Neue Karriere', create], ['Rangliste', () => ranking(start)]]); return; }
    screen(`<h2>Karriere</h2><p>${esc(saved.player.name)} · ${saved.player.age} Jahre · Saison ${saved.year}</p>`,
      [['Fortsetzen', () => hub(saved)], ['Neue Karriere', confirmNew], ['Rangliste', () => ranking(start)]]);
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
      screen(`<h2>Draft</h2><p>${teamLogo(c.team, 66)}</p><p>Die ${esc(teamName(teamById(c.team)))} holen ${esc(c.player.name)} mit der Nummer ${c.player.num}!</p>`,
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
      <p class="hub-name">${esc(c.player.name)} <small>#${c.player.num}</small></p>
      <p>${c.player.age} Jahre</p>
      <p>${teamLogo(c.team)}${esc(teamName(teamById(c.team)))}</p>
      ${c.contract ? `<p>Vertrag: noch ${c.contract.years} ${c.contract.years === 1 ? 'Jahr' : 'Jahre'} · ${money(c.contract.salary)}</p>` : ''}
      ${c.injured ? '<p>Verletzt: nur 3 Key Games</p>' : ''}
      ${tiles(c, c.team)}
      <div class="career-next"><b>Key Game ${c.gameIndex + 1} / ${c.keyGames.length} · ${wins}–${c.season.length - wins}</b><br>${esc(game.label)}${matchup(c, game)}</div>`,
      [['Spielen', () => playGame(c, game)], ['Karriere-Statistik', () => stats(c, () => hub(c))]]);
  }

  function playGame(c: CareerState, game: KeyGame,
    finish = (results: SceneResult[], rng: () => number, o: Outcome) => finishGame(c, game, results, rng, o), rng = gameRng(c)): void {
    const total = scenePlan(game), results: SceneResult[] = [];
    const own = teamById(c.team), opp = teamById(game.opponent);
    const ownStr = strengthOf(c, c.team), oppStr = strengthOf(c, game.opponent);
    let score: GameScore | undefined, openOffset = 0;
    const next = (): void => {
      const i = results.length;
      if (i >= total && openOffset) {
        // letzte Szene war nicht entscheidend: der Rest des Viertels läuft mit dem Schwung der Szene zu Ende
        const before = score!.opp - score!.own;
        const end = advanceScore(score!, results[i - 1], openOffset / 720, ownStr, oppStr, c.difficulty, rng);
        if (end.own === end.opp) {
          const won = rng() < .5, base = end.own + 6 + Math.floor(rng() * 7), margin = 1 + Math.floor(rng() * 5);
          return finish(results, rng, { won, own: won ? base + margin : base, opp: won ? base : base + margin, note: 'Entschieden in der Verlängerung.' });
        }
        const won = end.own > end.opp;
        return finish(results, rng, { won, own: end.own, opp: end.opp,
          note: won && before > 0 ? 'Comeback im Schlussviertel!' : !won && before < 0 ? 'Die Führung im Schlussviertel noch hergegeben.' : undefined });
      }
      if (i >= total) {
        // Crunchtime gespielt: die letzte Szene entscheidet, Gleichstand (Overtime) per Münzwurf
        const last = results[i - 1], ot = !last.won && /OVERTIME/.test(last.verdict);
        const won = last.won || (ot && rng() < .5);
        const ownEnd = score!.own + (last.teamPts ?? 0);
        if (ot) {
          // Gleichstand mit der Sirene → Verlängerung: beide punkten, der Sieger mit 1–5 Punkten Vorsprung
          const base = ownEnd + 6 + Math.floor(rng() * 7), margin = 1 + Math.floor(rng() * 5);
          return finish(results, rng, { won, own: won ? base + margin : base, opp: won ? base : base + margin, note: 'Entschieden in der Verlängerung.' });
        }
        // Endstand = Stand vor der Crunchtime + eigene Punkte der Szene (kein ausgeloster Endstand mehr)
        return finish(results, rng, won ? { won, own: Math.max(ownEnd, score!.opp + 1), opp: score!.opp }
          : { won, own: ownEnd, opp: Math.max(score!.opp, ownEnd + 1) });
      }
      // Momentum: Treffer in der letzten Szene schieben den Spielstand bis zur nächsten Szene
      score = !score ? fate(openingScore(total, ownStr, oppStr, c.difficulty, rng), rng)
        : advanceScore(score, results[i - 1], sceneGap(total, i), ownStr, oppStr, c.difficulty, rng);
      let deficit: number;
      const cr = i === total - 1 ? crunch(score, rng) : undefined, open = cr?.kind === 'open';
      if (cr?.kind === 'play') {
        deficit = cr.deficit;
        score = { own: score.own, opp: score.own + deficit };
      } else deficit = Math.max(1, Math.min(3, score.opp - score.own));
      const perks = perksOf(c.player), hot = updateHot(c.hot ?? 0, results);
      const t = TUNING[c.difficulty];
      // feindliche Halle: alle grünen Fenster 5 % kleiner, Mitspieler treffen 5 % schlechter
      const hostile = game.label === 'Auswärts in feindlicher Halle' ? .95 : 1;
      const withPerks = (sp: SceneSpec): SceneSpec => ({ ...sp, tuning: { zone: t.zone * hostile, meter: t.meter, ai: t.ai * hostile },
        perks: { ...perks, passSteal: (perks.passSteal ?? 1) * t.steal, onFire: Boolean(perks.greenLight) && hot >= 2 } });
      const spec = withPerks(sceneSpec(c, game, i, total, deficit, rng, score, open));
      openOffset = spec.clockOffset ?? 0;
      // Coach-Call: zweiter Spielzug zur Wahl (gleiche Lage, anderer Spielzug)
      let alt: SceneSpec | undefined;
      for (let k = 0; perks.coachCall && k < 6 && (!alt || alt.play.id === spec.play.id); k++) alt = withPerks({ ...sceneSpec(c, game, i, total, deficit, rng, score, open), title: spec.title, clockS: spec.clockS, clockOffset: spec.clockOffset, deficit });
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

  function teamValue(c: CareerState, id: string): string {
    const v = offDef(c, id);
    const stars = starLine(c, id);
    return `${esc(teamById(id).name)}: OVR ${strengthOf(c, id)} · OFF ${v.off} · DEF ${v.def}${stars ? `<br>${stars}` : ''}`;
  }
  /** die drei besten Stars des Teams, nur Nachnamen (alte Spielstände ohne Liga: keine) */
  function starLine(c: CareerState, id: string): string {
    const stars = (c.league?.stars ?? []).filter(s => s.team === id).sort((a, b) => b.value - a.value).slice(0, 3)
      .map(s => esc(s.name.split(' ').slice(1).join(' ') || s.name));
    return stars.length ? `★ ${stars.join(' · ')}` : '';
  }
  /** Paarung: Gast links, Heim rechts – Wappen, Name, Saisonbilanz bis hierher, Teamwert */
  function matchup(c: CareerState, game: KeyGame): string {
    // gleiche Seeds wie die Tabelle am Saisonende → die Bilanzen laufen auf den späteren Endstand zu
    const played = Math.round(82 * (c.gameIndex + .5) / c.keyGames.length), conf = teamById(game.opponent).conference;
    const ownFinal = ownProjection(c);
    const oppFinal = standings(c, ownFinal, seededRng(conf === teamById(c.team).conference ? seasonSeed(c) + 1 : otherSeed(c)), conf).find(r => r.team === game.opponent)!.wins;
    const side = (id: string, final: number) => {
      const w = Math.round(final * played / 82);
      return `<div>${teamLogo(id, 44)}<b>${esc(teamById(id).name)}</b><span>${w}–${played - w}</span><span>OVR ${strengthOf(c, id)}</span></div>`;
    };
    const own = side(c.team, ownFinal), opp = side(game.opponent, oppFinal), stars = starLine(c, game.opponent);
    return `<div class="matchup">${game.home ? opp : own}<em>@</em>${game.home ? own : opp}</div>${stars ? `<p class="tv-stars">${stars}</p>` : ''}`;
  }
  /** Teamwerte als drei Kacheln: Gesamt, Angriff, Verteidigung */
  function tiles(c: CareerState, id: string): string {
    const v = offDef(c, id), stars = starLine(c, id);
    return `<div class="tv" aria-label="Teamwerte ${esc(teamById(id).name)}"><span><b>${strengthOf(c, id)}</b>OVR</span><span><b>${v.off}</b>OFF</span><span><b>${v.def}</b>DEF</span></div>${stars ? `<p class="tv-stars">${stars}</p>` : ''}`;
  }

  function finishGame(c: CareerState, game: KeyGame, results: SceneResult[], rng: () => number, o: Outcome): void {
    const won = o.won, line = projectLine(c.player.ratings, results, rng), ownPts = o.own, oppPts = o.opp;
    const after: CareerState = { ...c, gameIndex: c.gameIndex + 1, hot: updateHot(c.hot ?? 0, results),
      season: [...c.season, { opponent: game.opponent, label: game.label, home: game.home, won, ...line }] };
    save(after);
    screen(`<h2>${won ? 'Sieg' : 'Niederlage'}</h2><p>${ownPts} : ${oppPts} ${opponentLine(game)}</p>${o.note ? `<p>${o.note}</p>` : ''}
      <p class="career-line">PTS ${line.pts} · AST ${line.ast} · REB ${line.reb}</p>`, [['Weiter', () => interim(after)]]);
  }
  /** Zwischenstand der Liga nach jedem Key Game (nach dem letzten folgt direkt das Saisonende) */
  function interim(c: CareerState): void {
    if (c.gameIndex >= c.keyGames.length) return hub(c);
    const played = Math.round(82 * c.gameIndex / c.keyGames.length);
    screen(`<h2>Tabelle</h2><p>Saison ${c.year} · nach ${played} Spielen</p>${leagueTables(c, ownProjection(c), played)}`, [['Weiter', () => hub(c)]], 'career-long');
    wireTables(c);
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
      ${leagueTables(c, ownWins, 82)}`,
      rank <= 10
        ? [[rank <= 6 ? 'Playoffs' : 'Play-In', () => {
          const n = { ...c, postseason: startPostseason(c, ownWins, table, seededRng(seed + 2))! };
          save(n); playoffHub(n);
        }]]
        : [['Nächste Saison', () => nextSeason(c, ownWins)]], 'career-long');
    wireTables(c);
  }

  /** Hochrechnung der eigenen Siege aus den bisherigen Key Games (am Saisonende = Endstand) */
  const ownProjection = (c: CareerState) =>
    projectWins(strengthOf(c, c.team), c.season.filter(g => g.won).length, c.season.length, c.difficulty, seededRng(seasonSeed(c)));
  const CONF_NAME = { east: 'Eastern', west: 'Western' };

  /** Tabellen beider Conferences nach `played` Spielen (82 = Endstand) plus Vorsaison; Umschalter verdrahtet wireTables */
  function leagueTables(c: CareerState, ownWins: number, played: number): string {
    const own = teamById(c.team).conference, other = own === 'east' ? 'west' : 'east';
    const last = c.history.at(-1), prev = last?.table;
    const block = (conf: 'east' | 'west'): string => {
      // gleiche Seeds wie finishSeason → am Saisonende angezeigter Platz = gespeicherter Platz
      const final = standings(c, ownWins, seededRng(conf === own ? seasonSeed(c) + 1 : otherSeed(c)), conf);
      const rows = final.map(r => ({ ...r, w: Math.round(r.wins * played / 82) }));
      if (played < 82) rows.sort((a, b) => b.w - a.w);
      const before = (prev ?? []).filter(r => teamById(r.team).conference === conf);
      const trend = (team: string, now: number): string => {
        const was = before.findIndex(r => r.team === team) + 1, d = was - now;
        return !was ? '' : d > 0 ? `<span class="up" aria-label="${d} Plätze besser als in der Vorsaison">▲${d}</span>`
          : d < 0 ? `<span class="down" aria-label="${-d} Plätze schlechter als in der Vorsaison">▼${-d}</span>` : '<span class="same">–</span>';
      };
      const now = `<table class="career-table" data-conf="${conf}" data-old="0"${conf === own ? '' : ' hidden'}><thead><tr><th>#</th><th></th><th>${CONF_NAME[conf]}</th><th>OVR</th><th>S</th><th>N</th></tr></thead><tbody>${rows.map((r, i) =>
        `<tr${r.team === c.team ? ' class="own"' : ''}><td>${i + 1}</td><td>${trend(r.team, i + 1)}</td><td>${teamLogo(r.team, 16)}${esc(teamName(teamById(r.team)))}${played === 82 && r.note ? ` <small>${r.note}</small>` : ''}</td><td>${strengthOf(c, r.team)}</td><td>${r.w}</td><td>${played - r.w}</td></tr>`).join('')}</tbody></table>`;
      const old = before.length ? `<table class="career-table" data-conf="${conf}" data-old="1" hidden><thead><tr><th>#</th><th>${CONF_NAME[conf]} · Saison ${c.year - 1}</th><th>S</th><th>N</th></tr></thead><tbody>${before.map((r, i) =>
        `<tr${r.team === last!.team ? ' class="own"' : ''}><td>${i + 1}</td><td>${teamLogo(r.team, 16)}${esc(teamName(teamById(r.team)))}</td><td>${r.wins}</td><td>${82 - r.wins}</td></tr>`).join('')}</tbody></table>` : '';
      return now + old;
    };
    return `<div class="table-tabs"><button class="menu-btn table-conf">${CONF_NAME[other]} Conference</button>${
      prev?.length ? '<button class="menu-btn table-toggle">Vorsaison</button>' : ''}</div>${block(own)}${block(other)}`;
  }
  function wireTables(c: CareerState): void {
    const own = teamById(c.team).conference;
    let conf = own, old = false;
    const confBtn = root.querySelector<HTMLButtonElement>('.table-conf'), oldBtn = root.querySelector<HTMLButtonElement>('.table-toggle');
    const show = () => {
      root.querySelectorAll<HTMLTableElement>('.career-table[data-conf]').forEach(t => { t.hidden = !(t.dataset.conf === conf && (t.dataset.old === '1') === old); });
      if (confBtn) confBtn.textContent = `${CONF_NAME[conf === 'east' ? 'west' : 'east']} Conference`;
      if (oldBtn) oldBtn.textContent = old ? 'Aktuelle Saison' : 'Vorsaison';
    };
    confBtn?.addEventListener('click', () => { conf = conf === 'east' ? 'west' : 'east'; show(); });
    oldBtn?.addEventListener('click', () => { old = !old; show(); });
  }
  function nextSeason(c: CareerState, ownWins: number): void {
    // gleicher Seed wie die Tabelle am Saisonende → gespeicherter Platz = angezeigter Platz
    const n = finishSeason(c, ownWins, seededRng(((c.seed ^ (c.year * 31337)) >>> 0) + 1));
    const o = beginOffseason(n, seededRng(((n.seed ^ (n.year * 4243)) >>> 0)));
    save(o);
    const awards = n.history.at(-1)?.awards ?? [];
    if (!awards.length || o.retired) return hub(o);
    const sp = awardPoints(awards);
    screen(`<h2>Auszeichnungen ${c.year}</h2><div class="trophies">${awards.map(a => trophy(a)).join('')}</div>
      ${sp ? `<p>+${sp} Skillpunkte für die Off-Season</p>` : ''}`, [['Weiter', () => hub(o)]]);
  }

  function offseason(c: CareerState): void {
    const o = c.offseason!;
    const go = (n: CareerState) => { save(n); hub(n); };
    if (o.step === 'trade') {
      return screen(`<h2>Trade!</h2><p>${teamLogo(o.tradedTo!, 66)}</p><p>${esc(c.player.name)} wurde zu den ${esc(teamName(teamById(o.tradedTo!)))} getradet. Der Vertrag läuft weiter.</p>`,
        [['Weiter', () => go(ackTrade(c))]]);
    }
    if (o.step === 'offers') {
      const cards = o.offers!.map(offer => {
        const t = teamById(offer.team), strength = strengthOf(c, offer.team);
        return `<div class="offer"><b>${teamLogo(offer.team)}${esc(teamName(t))}${offer.team === c.team ? ' (Verlängerung)' : ''}</b>
          <span>${teamValue(c, offer.team)}</span>
          <span class="offer-bar" style="--v:${strength}%" title="Teamwert ${strength}"></span>
          <span>${offer.years} ${offer.years === 1 ? 'Jahr' : 'Jahre'} · ${money(offer.salary)} · <em>${offer.spPerYear} Skillpunkte/Jahr</em></span></div>`;
      }).join('');
      return screen(`<h2>Vertragsangebote</h2><p>Dein Vertrag ist ausgelaufen. Schwache Teams locken manchmal mit mehr Skillpunkten – dort ist es aber schwerer zu gewinnen.</p><div class="offers">${cards}</div>`,
        o.offers!.map(offer => [`Unterschreiben: ${teamName(teamById(offer.team))}`, () => go(acceptOffer(c, offer))] as [string, () => void]), 'career-long');
    }
    if (o.step === 'news') {
      const moves = o.moves ?? [];
      const rows = moves.map(m => `<div class="offer"><b>${esc(m.name)}</b>
        <span>${teamLogo(m.from)}${esc(teamName(teamById(m.from)))} → ${teamLogo(m.to)}${esc(teamName(teamById(m.to)))}</span>
        <span>${teamById(m.to).name}: Teamwert jetzt <em>${strengthOf(c, m.to)}</em> (+${m.value}) · ${teamById(m.from).name}: ${strengthOf(c, m.from)}</span></div>`).join('');
      return screen(`<h2>Wechselbörse</h2><p>${moves.length ? 'Die großen Wechsel dieser Off-Season:' : 'Keine großen Wechsel in dieser Off-Season.'}</p><div class="offers">${rows}</div>
        <p>${teamValue(c, c.team)}</p>`, [['Weiter', () => go(ackNews(c))]], 'career-long');
    }
    // „−“ nur für Punkte, die in dieser Off-Season verteilt wurden
    const spentOn = (k: string) => (o.spent ?? []).some(e => e.k === k);
    const rows = RATING_KEYS.map(k => `<div class="skill"><span>${RATING_LABEL[k]} <small>${Math.round(c.player.ratings[k] * 100)}</small></span><span class="offer-bar" style="--v:${Math.round(c.player.ratings[k] * 100)}%"></span>
      <button class="skill-minus" data-key="${k}" aria-label="${RATING_LABEL[k]}: Punkt zurücknehmen" ${spentOn(k) ? '' : 'disabled'}>−</button>
      <button class="skill-plus" data-key="${k}" aria-label="${RATING_LABEL[k]} verbessern" ${o.points <= 0 || c.player.ratings[k] >= 1 ? 'disabled' : ''}>+</button></div>`).join('');
    const p = c.player, lv = p.specLevel ?? 0;
    const specBox = !p.spec
      ? `<div class="spec-box"><b>Spezialisierung wählen (einmalig)</b>${(Object.keys(SPECS) as SpecId[]).map(id =>
        `<button class="spec-choose menu-btn" data-spec="${id}">${SPECS[id].name}</button>`).join('')}</div>`
      : `<div class="spec-box"><b>${SPECS[p.spec].name} · Stufe ${lv} / 3</b><ol>${SPECS[p.spec].stages.map((t, i) =>
        `<li class="${i < lv ? 'done' : ''}">${esc(t)}</li>`).join('')}</ol>${lv < 3
        ? `<button class="spec-buy menu-btn" ${o.points < STAGE_COST[lv] ? 'disabled' : ''}>Stufe ${lv + 1} freischalten (${STAGE_COST[lv]} Punkte)</button>` : ''}${
        spentOn('stage') ? '<button class="spec-undo menu-btn">Stufe zurücknehmen</button>' : ''}</div>`;
    screen(`<h2>Skillpunkte</h2><p>Noch ${o.points} ${o.points === 1 ? 'Punkt' : 'Punkte'} · jeder Punkt +2</p>${specBox}<div class="skills">${rows}</div>`,
      [['Fertig', () => go(endOffseason(c))]], 'career-long');
    root.querySelectorAll<HTMLButtonElement>('.skill-plus').forEach(b => b.addEventListener('click', () => go(spend(c, b.dataset.key as RatingKey))));
    root.querySelectorAll<HTMLButtonElement>('.skill-minus').forEach(b => b.addEventListener('click', () => go(refund(c, b.dataset.key as RatingKey))));
    root.querySelector('.spec-buy')?.addEventListener('click', () => go(buyStage(c)));
    root.querySelector('.spec-undo')?.addEventListener('click', () => go(refundStage(c)));
    root.querySelectorAll<HTMLButtonElement>('.spec-choose').forEach(b => b.addEventListener('click', () => go(chooseSpec(c, b.dataset.spec as SpecId))));
  }

  const postRng = (c: CareerState) => seededRng((c.seed ^ (c.year * 7919 + 5000 + (c.postseason?.faced.length ?? 0) * 104729)) >>> 0);
  function playoffHub(c: CareerState): void {
    const p = c.postseason!, game = postseasonGame(p);
    screen(`<h2>${ROUND_NAME[p.round]}</h2><p>Saison ${c.year} · ${teamLogo(c.team)}${esc(teamName(teamById(c.team)))}</p>
      <div class="career-next"><b>${esc(p.situation)}</b><br>${opponentLine(game)}</div>`,
      [['Spielen', () => playGame(c, game, (results, rng, o) => finishPlayoff(c, game, results, rng, o), postRng(c))]]);
  }
  function finishPlayoff(c: CareerState, game: KeyGame, results: SceneResult[], rng: () => number, o: Outcome): void {
    const p = c.postseason!, won = o.won, line = projectLine(c.player.ratings, results, rng);
    const next = advance(p, won, c, rng), after: CareerState = { ...c, postseason: next, hot: updateHot(c.hot ?? 0, results) };
    save(after);
    const title = !won ? p.round === 'playin' ? 'Play-In verloren' : 'Ausgeschieden'
      : next.done ? 'MEISTER!' : p.round === 'playin' ? 'Play-In gewonnen' : 'Serie gewonnen';
    screen(`<h2 class="${next.result === 'champion' ? 'champion' : ''}">${title}</h2><p>${o.own} : ${o.opp} ${opponentLine(game)}</p>${o.note ? `<p>${o.note}</p>` : ''}
      <p class="career-line">PTS ${line.pts} · AST ${line.ast} · REB ${line.reb}</p>`, [['Weiter', () => hub(after)]]);
  }
  function postseasonEnd(c: CareerState): void {
    const p = c.postseason!;
    screen(`<h2>Saison ${c.year} beendet</h2><p>${p.ownWins} – ${82 - p.ownWins} · Platz ${p.rank}</p><p>${RESULT_TEXT[p.result]}</p>`,
      [['Nächste Saison', () => nextSeason(c, p.ownWins)]]);
  }

  function stats(c: CareerState, back: () => void): void {
    const legacy = legacyOf(c.history);
    screen(`<h2>Karriere-Statistik</h2><p>Legacy ${Math.round(legacy)} · ${tierOf(legacy).tier}</p>${cabinet(c)}${historyTable(c)}`, [['Zurück', back]], 'career-long');
  }
  function careerEnd(c: CareerState): void {
    const legacy = Math.round(legacyOf(c.history)), { tier, hof } = tierOf(legacy);
    if (!c.ranked) {
      addToRanking({ id: `${c.seed}-${c.player.name}`, name: c.player.name, position: c.player.position, seasons: c.history.length,
        rings: count(c, 'ring'), mvps: count(c, 'mvp'), legacy, tier, date: new Date().toISOString().slice(0, 10) }, deps.storage);
      c = { ...c, ranked: true };
      save(c);
    }
    screen(`<h2>Karriere beendet</h2><p>${esc(c.player.name)} · ${c.history.length} Saisons · Legacy ${legacy}</p>
      <p class="career-tier${hof ? ' hof' : ''}">${tier}${hof ? '<br>In die Hall of Fame aufgenommen!' : ''}</p>${cabinet(c)}${historyTable(c)}`,
      [['Rangliste', () => ranking(() => careerEnd(c))], ['Neue Karriere', confirmNew]], 'career-long');
  }
  function ranking(back: () => void): void {
    const list = loadRanking(deps.storage);
    const POS: Record<string, string> = { guard: 'G', wing: 'F', big: 'C' };
    screen(`<h2>Rangliste</h2>${list.length ? `<table class="career-table"><thead><tr><th>#</th><th>Name</th><th>Pos</th><th>Saisons</th><th>Ringe</th><th>MVP</th><th>Legacy</th></tr></thead><tbody>${
      list.map((e, i) => `<tr><td>${i + 1}</td><td>${esc(e.name)}<br><small>${esc(e.tier)}</small></td><td>${POS[e.position] ?? ''}</td><td>${e.seasons}</td><td>${e.rings}</td><td>${e.mvps}</td><td>${e.legacy}</td></tr>`).join('')}</tbody></table>`
      : '<p>Noch keine abgeschlossene Karriere.</p>'}`, [['Zurück', back]], 'career-long');
  }
  const count = (c: CareerState, a: AwardId) => c.history.reduce((n, h) => n + ((h.awards ?? []).includes(a) ? 1 : 0), 0);
  const trophy = (a: AwardId, n = 1) => `<div class="trophy"><span>${AWARDS[a].icon}</span><b>${n > 1 ? `${n}× ` : ''}${AWARDS[a].name}</b></div>`;
  function cabinet(c: CareerState): string {
    const won = (Object.keys(AWARDS) as AwardId[]).filter(a => count(c, a) > 0);
    return `<div class="trophies">${won.length ? won.map(a => trophy(a, count(c, a))).join('') : '<p>Noch keine Auszeichnungen – die Vitrine wartet.</p>'}</div>`;
  }
  function historyTable(c: CareerState): string {
    const avg = (g: { pts: number }[]) => g.length ? (g.reduce((s, x) => s + x.pts, 0) / g.length).toFixed(1) : '–';
    const rings = c.history.filter(h => h.playoff === 'champion').length;
    return `<p class="career-rings">Ringe: ${rings}</p><table class="career-table"><thead><tr><th>Saison</th><th>Team</th><th>Alter</th><th>Bilanz</th><th>Platz</th><th>Playoffs</th><th>PTS</th></tr></thead><tbody>${
      c.history.map(h => `<tr${h.playoff === 'champion' ? ' class="own"' : ''}><td>${h.year}</td><td>${esc(teamById(h.team).name)}</td><td>${h.age}</td><td>${h.wins}–${h.losses}</td><td>${h.rank}</td><td>${RESULT_SHORT[h.playoff ?? 'none']}</td><td>${avg(h.games)}</td></tr>`).join('')}</tbody></table>`;
  }
  const opponentLine = (g: KeyGame) => `${g.home ? 'gegen die' : 'bei den'} ${teamLogo(g.opponent)}${esc(teamName(teamById(g.opponent)))}`;

  start();
  return {
    apply(s) { current = s; scene?.apply(s); },
    setPaused(p) { paused = p; scene?.setPaused?.(p); },
    renderPause(extra) { scene?.renderPause?.(extra); },
    stop() { clearTimeout(timer); endScene(); root.remove(); },
  };
}

const esc = (t: string) => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
