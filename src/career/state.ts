import type { Look } from '../figure/raster';
import { RATING_KEYS, clamp01, type Ratings } from '../play/ratings';
import { TEAMS } from './league';
import type { PlayoffResult, Postseason } from './playoffs';
import type { Contract, Offseason } from './offseason';
import type { SpecId } from './spec';
import type { AwardId } from './legacy';
import type { League } from './world';

export type Position = 'guard' | 'wing' | 'big';
export type Difficulty = 'rookie' | 'pro' | 'hof';
export interface CareerPlayer {
  name: string; num: number; look: Look; position: Position; ratings: Ratings; age: number;
  /** Spezialisierung (beim Erstellen gewählt) und freigeschaltete Stufe 0–3 */
  spec?: SpecId; specLevel?: number;
}
export interface KeyGame { opponent: string; label: string; home: boolean }
export interface GameRecord { opponent: string; label: string; home: boolean; won: boolean; pts: number; ast: number; reb: number }
export interface SeasonRecord { year: number; team: string; age: number; wins: number; losses: number; rank: number; games: GameRecord[]; playoff?: PlayoffResult; awards?: AwardId[] }
export interface CareerState {
  version: 1; seed: number; difficulty: Difficulty; player: CareerPlayer; team: string; year: number;
  keyGames: KeyGame[]; gameIndex: number;
  /** bereits gespielte Key Games der laufenden Saison */
  season: GameRecord[];
  history: SeasonRecord[]; injured: boolean; retired: boolean;
  /** Teamstärken, die sich jede Saison entwickeln (fehlt: Startwerte der Liga) */
  strengths?: Record<string, number>;
  /** Liga hinter den Teamwerten: Kader-Grundwerte, Verläufe und Stars (fehlt bei alten Ständen: wird aus dem Seed gelost) */
  league?: League;
  /** laufende Nachsaison (Play-In/Playoffs) nach den Key Games */
  postseason?: Postseason;
  /** laufender Vertrag (fehlt bei alten Ständen: Rookie-Vertrag) */
  contract?: Contract;
  /** offener Off-Season-Schritt (Trade-Meldung, Angebote, Skillpunkte) */
  offseason?: Offseason;
  /** Green Light: eigene Treffer in Folge über Szenen/Spiele hinweg */
  hot?: number;
  /** Karriere bereits in die Rangliste eingetragen */
  ranked?: boolean;
}

export const CAREER_KEY = 'pixel-splash.career.v1';

const store = (s?: Storage): Storage | undefined => {
  try { return s ?? globalThis.localStorage; } catch { return undefined; }
};
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const teamIds = new Set(TEAMS.map(t => t.id));

/** Prüft die Pflichtfelder; alles Unbekannte oder Kaputte → null (dann „Neue Karriere“) */
function validate(v: unknown): CareerState | null {
  if (!isObj(v) || v.version !== 1 || typeof v.seed !== 'number') return null;
  if (!['rookie', 'pro', 'hof'].includes(v.difficulty as string)) return null;
  if (typeof v.team !== 'string' || !teamIds.has(v.team) || typeof v.year !== 'number') return null;
  if (!Array.isArray(v.keyGames) || typeof v.gameIndex !== 'number' || !Array.isArray(v.season) || !Array.isArray(v.history)) return null;
  const p = v.player;
  if (!isObj(p) || typeof p.name !== 'string' || typeof p.num !== 'number' || typeof p.age !== 'number') return null;
  if (!['guard', 'wing', 'big'].includes(p.position as string) || !isObj(p.look) || !isObj(p.ratings)) return null;
  const ratings = {} as Ratings;
  for (const k of RATING_KEYS) {
    const r = p.ratings[k];
    if (typeof r !== 'number' || !Number.isFinite(r)) return null;
    ratings[k] = clamp01(r);
  }
  return { ...(v as unknown as CareerState), player: { ...(p as unknown as CareerPlayer), ratings },
    injured: Boolean(v.injured), retired: Boolean(v.retired) };
}

export function loadCareer(storage?: Storage): CareerState | null {
  try {
    const raw = store(storage)?.getItem(CAREER_KEY);
    return raw ? validate(JSON.parse(raw)) : null;
  } catch { return null; }
}

export function saveCareer(s: CareerState, storage?: Storage): void {
  try { store(storage)?.setItem(CAREER_KEY, JSON.stringify(s)); } catch { /* ohne Speicher läuft die Karriere ohne Fortsetzen weiter */ }
}

export function clearCareer(storage?: Storage): void {
  try { store(storage)?.removeItem(CAREER_KEY); } catch { /* s. o. */ }
}
