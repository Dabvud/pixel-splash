import type { Play, PlayId } from '../types';
import { PNR } from './pnr';
import { FASTBREAK } from './fastbreak';
import { KICKOUT } from './kickout';
import { INBOUND } from './inbound';

export const PLAYS: Record<PlayId, Play> = { pnr: PNR, fastbreak: FASTBREAK, kickout: KICKOUT, inbound: INBOUND };
