import type { Play, PlayId } from '../types';
import { PNR } from './pnr';
import { FASTBREAK } from './fastbreak';
import { KICKOUT } from './kickout';
import { INBOUND } from './inbound';
import { ISO } from './iso';
import { HANDOFF } from './handoff';
import { BACKDOOR } from './backdoor';
import { GIVEANDGO } from './giveandgo';
import { TWOONONE } from './twoonone';
import { THREEONTWO } from './threeontwo';
import { PICKPOP } from './pickpop';
import { HAMMER } from './hammer';

export const PLAYS: Record<PlayId, Play> = {
  pnr: PNR, fastbreak: FASTBREAK, kickout: KICKOUT, inbound: INBOUND,
  iso: ISO, handoff: HANDOFF, backdoor: BACKDOOR, giveandgo: GIVEANDGO,
  twoonone: TWOONONE, threeontwo: THREEONTWO, pickpop: PICKPOP, hammer: HAMMER,
};
