import { RATING_KEYS, type Ratings } from '../play/ratings';
import { TEAMS } from './league';

/** Kader-Grundwert ohne Stars, Angriff/Verteidigung-Gewichtung und laufender Verlauf (Trend je Saison, Restjahre) */
export interface TeamState {
  base: number; split: number; trend: number; years: number;
  /** nach einem kurzen Hoch folgt der Absturz mit diesem Trend */
  after?: number;
  /** in dieser Off-Season einen Star geholt: muss sich erst einspielen */
  fresh?: boolean;
}
export interface Star { name: string; team: string; age: number; value: number }
export interface Move { name: string; from: string; to: string; value: number }
export interface League { teams: Record<string, TeamState>; stars: Star[] }

// [abgewandelter Name, Startteam, Alter, Wert 4–10]
const STARS: [string, string, number, number][] = [
  ['Shai Gilljus-Alexandre', 'okc', 28, 10], ['Jaylen Willems', 'okc', 25, 7], ['Chet Holmgrün', 'okc', 24, 7],
  ['Nikola Jokitsch', 'den', 31, 10], ['Jamal Murrey', 'den', 29, 6],
  ['Antony Edvards', 'min', 25, 9], ['Rudi Gobär', 'min', 34, 5],
  ['Jason Tatem', 'bos', 28, 9], ['Jalen Braun', 'bos', 30, 8], ['Derek Weiss', 'bos', 32, 6],
  ['Yannis Antetokumbo', 'mil', 31, 10],
  ['Donavan Mitchel', 'cle', 30, 8], ['Evan Mobly', 'cle', 25, 7], ['Jaimes Harten', 'cle', 37, 5],
  ['Jaylen Brunsen', 'nys', 30, 8], ['Karl-Anton Towns', 'nys', 31, 7],
  ['Joel Embied', 'phi', 32, 7], ['Tyreese Maxi', 'phi', 26, 8], ['VJ Edgecomb', 'phi', 21, 6],
  ['Tyrese Haliburten', 'ind', 26, 8], ['Pascal Siakum', 'ind', 32, 6],
  ['Paulo Bankero', 'orl', 24, 8], ['Franz Wagener', 'orl', 25, 7], ['Desmond Bain', 'orl', 28, 6],
  ['Bam Adebajo', 'mia', 29, 7], ['Tyler Hero', 'mia', 26, 6],
  ['Jaylen Jonson', 'atl', 25, 7],
  ['Cade Kanningham', 'det', 25, 9], ['Jaylen Durren', 'det', 22, 6],
  ['LaMello Boll', 'cha', 25, 7], ['Brendon Miler', 'cha', 23, 6], ['Kon Knüppel', 'cha', 21, 6],
  ['Scotty Barns', 'tor', 25, 7], ['Brendan Ingrem', 'tor', 29, 6],
  ['Josh Giddy', 'chi', 24, 6],
  ['Tray Yung', 'was', 28, 7], ['Antony Davies', 'was', 33, 7],
  ['Cooper Flag', 'dal', 20, 8], ['Kyri Irwing', 'dal', 34, 6],
  ['Kevin Durand', 'hou', 38, 7], ['Alperen Schengün', 'hou', 24, 8], ['Amen Tomson', 'hou', 23, 7],
  ['Viktor Wembanjama', 'sas', 22, 10], ['DeAron Fuchs', 'sas', 28, 7],
  ['Jah Morent', 'mem', 27, 7],
  ['Lauri Markkonen', 'uta', 29, 7], ['Jaren Jakson Jr.', 'uta', 27, 7],
  ['Zyon Williamsen', 'nop', 26, 6], ['Trey Murfy', 'nop', 26, 6],
  ['Stefan Kurry', 'gsp', 38, 8], ['Jimmi Buttler', 'gsp', 37, 6],
  ['Luka Dontschitsch', 'lap', 27, 10], ['LeBrawn Jaymes', 'lap', 41, 6], ['Austin Reeves', 'lap', 28, 6],
  ['Kawai Lennard', 'las', 35, 7], ['Darius Garlend', 'las', 26, 6],
  ['Devin Bucker', 'phx', 30, 8],
  ['Domantas Sabonas', 'sac', 30, 6],
  ['Deni Avdia', 'por', 25, 7], ['Damien Lillert', 'por', 36, 5],
];
// Nachwuchs-Stars: erfundene Namen
const FIRST = ['Malik', 'Dario', 'Jonte', 'Kelvin', 'Tobi', 'Arlo', 'Dezmond', 'Luis', 'Enzo', 'Marek', 'Zaire', 'Cody', 'Nico', 'Jabari', 'Theo', 'Emeka'];
const LAST = ['Okafor-Lind', 'Brandt', 'Sizemore', 'Dupree', 'Vasquez', 'Hollis', 'Kowalski', 'Adeyemi', 'Banks', 'Lindqvist', 'Mbeki', 'Castellano', 'Whitlock', 'Tanaka', 'Fofana', 'Raines'];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const int = (rng: () => number, lo: number, hi: number) => lo + Math.min(hi - lo, Math.floor(rng() * (hi - lo + 1)));
const starSum = (l: League, id: string) => l.stars.reduce((s, x) => s + (x.team === id ? x.value : 0), 0);

/** Teamwert 25–99 je Team: Kader-Grundwert + Werte der Stars */
export function ratings(l: League): Record<string, number> {
  return Object.fromEntries(TEAMS.map(t => [t.id, clamp(Math.round(l.teams[t.id].base + starSum(l, t.id)), 25, 99)]));
}

/** Liga-Schnitt bleibt bei 60, damit im Mittel 41 Siege herauskommen */
function normalize(l: League): League {
  const mean = TEAMS.reduce((s, t) => s + l.teams[t.id].base + starSum(l, t.id), 0) / TEAMS.length;
  for (const t of TEAMS) l.teams[t.id].base = clamp(l.teams[t.id].base + 60 - mean, 22, 80);
  return l;
}

/** Neuer Verlauf je nach Lage: Top-Teams halten sich oder fallen, schwache Teams bauen auf, dazu seltene kurze Hochs */
function newArc(rating: number, rng: () => number): Pick<TeamState, 'trend' | 'years' | 'after'> {
  const [hold, rise, fall] = rating >= 70 ? [.45, .1, .35] : rating <= 50 ? [.3, .45, .1] : [.25, .3, .3];
  const r = rng();
  if (r < hold) return { trend: 0, years: int(rng, 2, 5) };
  if (r < hold + rise) return { trend: int(rng, 2, 5), years: int(rng, 2, 5) };
  if (r < hold + rise + fall) return { trend: -int(rng, 2, 5), years: int(rng, 2, 4) };
  // kurzes Hoch: ein, zwei starke Jahre, danach geht es steil bergab
  return { trend: int(rng, 7, 11), years: int(rng, 1, 2), after: -int(rng, 5, 8) };
}

/** Liga zum Karrierestart: Stars bei ihren Teams, Kader-Grundwerte und Verläufe gelost */
export function createLeague(rng: () => number): League {
  const l: League = { stars: STARS.map(([name, team, age, value]) => ({ name, team, age, value })), teams: {} };
  for (const t of TEAMS) {
    // Summe aus drei Würfen: glockenförmig um 46, Spannweite etwa ±15
    const base = 46 + (rng() + rng() + rng() - 1.5) * 20;
    l.teams[t.id] = { base, split: int(rng, -8, 8), ...newArc(base + 14, rng) };
  }
  return normalize(l);
}

/** Saisonwechsel: Verläufe weiterdrehen, Stars altern/treten zurück, Nachwuchs-Stars zu schwachen Teams */
export function evolveLeague(old: League, rng: () => number): League {
  const l: League = structuredClone(old);
  const now = ratings(l);
  for (const t of TEAMS) {
    const s = l.teams[t.id];
    s.base += s.trend + (rng() * 2 - 1) * 1.5;
    s.split = clamp(s.split + int(rng, -2, 2), -8, 8);
    s.fresh = false;
    if (--s.years <= 0) {
      const next = s.after ? { trend: s.after, years: int(rng, 2, 3), after: undefined } : { after: undefined, ...newArc(now[t.id], rng) };
      Object.assign(s, next);
    }
  }
  for (const x of l.stars) {
    x.age++;
    if (x.age <= 24 ? rng() < .5 : x.age <= 30 ? rng() < .12 : false) x.value = Math.min(10, x.value + 1);
    else if (x.age >= 35 || (x.age >= 31 && rng() < .5)) x.value--;
  }
  l.stars = l.stars.filter(x => x.value >= 4 && x.age < 40 && !(x.age >= 37 && rng() < .35));
  const weak = [...TEAMS].sort((a, b) => now[a.id] - now[b.id]).slice(0, 8);
  for (let n = int(rng, 2, 4); n > 0 && l.stars.length < 66; n--) {
    const name = `${FIRST[int(rng, 0, FIRST.length - 1)]} ${LAST[int(rng, 0, LAST.length - 1)]}`;
    if (!l.stars.some(x => x.name === name)) l.stars.push({ name, team: weak[int(rng, 0, weak.length - 1)].id, age: 19 + int(rng, 0, 1), value: int(rng, 4, 6) });
  }
  return normalize(l);
}

/** 1–3 große Wechsel je Off-Season: Stars ab Wert 6, Ziel ist ein Team mit höchstens 3 Stars */
export function pickMoves(l: League, rng: () => number): Move[] {
  const moves: Move[] = [], count: Record<string, number> = {};
  for (const x of l.stars) count[x.team] = (count[x.team] ?? 0) + 1;
  const pool = l.stars.filter(x => x.value >= 6);
  for (let n = int(rng, 1, 3); n > 0 && pool.length; n--) {
    const star = pool.splice(int(rng, 0, pool.length - 1), 1)[0];
    const targets = TEAMS.filter(t => t.id !== star.team && (count[t.id] ?? 0) < 4);
    if (!targets.length) continue;
    const to = targets[int(rng, 0, targets.length - 1)].id;
    count[to] = (count[to] ?? 0) + 1; count[star.team]--;
    moves.push({ name: star.name, from: star.team, to, value: star.value });
  }
  return moves;
}

export function applyMoves(old: League, moves: Move[]): League {
  const l: League = structuredClone(old);
  for (const m of moves) {
    const star = l.stars.find(x => x.name === m.name);
    if (!star) continue;
    star.team = m.to;
    l.teams[m.to].fresh = true;
  }
  return l;
}

/** Eigener Spieler hebt den Teamwert: Rookie fast nichts, ausgebauter Superstar bis +8 */
export function heroBonus(r: Ratings): number {
  const avg = RATING_KEYS.reduce((s, k) => s + r[k], 0) / RATING_KEYS.length;
  return clamp(Math.round((avg - .5) * 20), 0, 8);
}
