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
import { FLOPPY } from './floppy';
import { PINDOWN } from './pindown';
import { HORNS } from './horns';
import { SPAIN } from './spain';
import { DOUBLEDRAG } from './doubledrag';
import { STAGGER } from './stagger';
import { ELEVATOR } from './elevator';
import { FLARE } from './flare';
import { SLOB } from './slob';
import { LOB08 } from './lob08';
import { SHORTROLL } from './shortroll';

export const PLAYS: Record<PlayId, Play> = {
  pnr: PNR, fastbreak: FASTBREAK, kickout: KICKOUT, inbound: INBOUND,
  iso: ISO, handoff: HANDOFF, backdoor: BACKDOOR, giveandgo: GIVEANDGO,
  twoonone: TWOONONE, threeontwo: THREEONTWO, pickpop: PICKPOP, hammer: HAMMER,
  floppy: FLOPPY, pindown: PINDOWN, horns: HORNS, spain: SPAIN, doubledrag: DOUBLEDRAG,
  stagger: STAGGER, elevator: ELEVATOR, flare: FLARE, slob: SLOB, lob08: LOB08, shortroll: SHORTROLL,
};
