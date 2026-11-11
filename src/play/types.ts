import type { Vec2 } from './position';
import type { Look } from '../figure/raster';
import type { Ratings } from './ratings';

export type PlayId = 'pnr' | 'fastbreak' | 'kickout' | 'inbound'
  | 'iso' | 'handoff' | 'backdoor' | 'giveandgo' | 'twoonone' | 'threeontwo' | 'pickpop' | 'hammer'
  | 'floppy' | 'pindown' | 'horns' | 'spain' | 'doubledrag' | 'stagger' | 'elevator' | 'flare' | 'slob' | 'lob08' | 'shortroll';
export type PlayerRole = 'guard' | 'wing' | 'big';
export interface ActorDef extends Look {
  id: string; team: 'off' | 'def' | 'ref' | 'crew'; shot: number; athleticism: number;
  role?: PlayerRole;
  /** Karriere/eigene Werte; ohne: abgeleitet aus shot/athleticism */
  ratings?: Ratings;
}
export type Activity = 'stand' | 'run' | 'dribble' | 'screen' | 'defend' | 'inbound';
export interface Waypoint extends Vec2 { t: number; act: Activity }
export interface Option { kind: 'shoot' | 'drive' | 'pass'; to?: string; lob?: boolean; next?: string }
export interface Segment { id: string; handler: string; paths: Record<string, Waypoint[]>; decisionAt?: number; options?: Option[] }
export interface Variant { id: string; weight: number; defPaths: Record<string, Record<string, Waypoint[]>> }
export interface Play {
  id: PlayId; name: string; clockS: number; deficit: number | [number, number]; actors: string[];
  start: string; segments: Record<string, Segment>; variants: Variant[]; inboundBy?: string;
}
