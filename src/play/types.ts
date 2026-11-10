import type { Vec2 } from './position';

export type PlayId = 'pnr' | 'fastbreak' | 'kickout' | 'inbound';
export interface ActorDef {
  id: string; team: 'off' | 'def'; num: number; heightM: number; build: 'slim' | 'normal' | 'broad';
  skin: string; hair: 'short' | 'bald' | 'afro'; jersey: string; shorts: string; shot: number; athleticism: number;
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
