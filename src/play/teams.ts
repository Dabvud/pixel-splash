import type { ActorDef } from './types';

export const RED: ActorDef[] = [
  { id: 'r3', team: 'off', num: 3, heightM: 1.88, build: 'slim', skin: '#8d5a3b', hair: 'short', jersey: '#c8322b', shorts: '#9e241f', shot: .7, athleticism: .6 },
  { id: 'r11', team: 'off', num: 11, heightM: 1.96, build: 'slim', skin: '#d5a078', hair: 'short', jersey: '#c8322b', shorts: '#9e241f', shot: .9, athleticism: .4 },
  { id: 'r23', team: 'off', num: 23, heightM: 2.03, build: 'normal', skin: '#70452f', hair: 'bald', jersey: '#c8322b', shorts: '#9e241f', shot: .6, athleticism: .9 },
  { id: 'r32', team: 'off', num: 32, heightM: 2.06, build: 'normal', skin: '#b77b53', hair: 'afro', jersey: '#c8322b', shorts: '#9e241f', shot: .5, athleticism: .6 },
  { id: 'r50', team: 'off', num: 50, heightM: 2.13, build: 'broad', skin: '#513427', hair: 'short', jersey: '#c8322b', shorts: '#9e241f', shot: .2, athleticism: .8 },
];
export const BLUE: ActorDef[] = [
  { id: 'b1', team: 'def', num: 1, heightM: 1.85, build: 'slim', skin: '#b77b53', hair: 'short', jersey: '#3263b9', shorts: '#244787', shot: .6, athleticism: .6 },
  { id: 'b7', team: 'def', num: 7, heightM: 1.98, build: 'normal', skin: '#513427', hair: 'afro', jersey: '#3263b9', shorts: '#244787', shot: .7, athleticism: .7 },
  { id: 'b15', team: 'def', num: 15, heightM: 2.01, build: 'normal', skin: '#d5a078', hair: 'bald', jersey: '#3263b9', shorts: '#244787', shot: .5, athleticism: .7 },
  { id: 'b21', team: 'def', num: 21, heightM: 2.06, build: 'broad', skin: '#8d5a3b', hair: 'short', jersey: '#3263b9', shorts: '#244787', shot: .4, athleticism: .6 },
  { id: 'b44', team: 'def', num: 44, heightM: 2.11, build: 'broad', skin: '#70452f', hair: 'bald', jersey: '#3263b9', shorts: '#244787', shot: .3, athleticism: .5 },
];
export const ACTORS: Record<string, ActorDef> = Object.fromEntries([...RED, ...BLUE].map(a => [a.id, a]));
