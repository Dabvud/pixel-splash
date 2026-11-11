import { describe, expect, it } from 'vitest';
import { CAREER_KEY, clearCareer, loadCareer, saveCareer, type CareerState } from '../src/career/state';

function memory(): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; }, clear: () => m.clear(), key: i => [...m.keys()][i] ?? null,
    getItem: k => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: k => void m.delete(k),
  };
}
const broken: Storage = { ...memory(), getItem: () => { throw new Error('blockiert'); }, setItem: () => { throw new Error('voll'); } };

export const SAMPLE: CareerState = {
  version: 1, seed: 42, difficulty: 'pro',
  player: {
    name: 'Rookie', num: 7, position: 'guard', age: 19,
    look: { heightM: 1.9, build: 'normal', skin: '#b77b53', hair: 'short', jersey: '#cccccc', shorts: '#999999', num: 7 },
    ratings: { mid: .5, three: .6, finish: .5, dunk: .4, dribble: .6, pass: .6, athleticism: .5, defense: .4, leadership: .3 },
  },
  team: 'det', year: 1, keyGames: [{ opponent: 'bos', label: 'Rivalen-Duell', home: true }], gameIndex: 0,
  season: [], history: [], injured: false, retired: false,
};

describe('Karriere-Speicherstand', () => {
  it('speichert und lädt denselben Stand', () => {
    const st = memory();
    saveCareer(SAMPLE, st);
    expect(loadCareer(st)).toEqual(SAMPLE);
    expect(st.getItem(CAREER_KEY)).not.toBeNull();
  });
  it('liefert null bei fehlendem, kaputtem oder veraltetem Stand', () => {
    const st = memory();
    expect(loadCareer(st)).toBeNull();
    st.setItem(CAREER_KEY, '{"version":1,"seed":');
    expect(loadCareer(st)).toBeNull();
    st.setItem(CAREER_KEY, JSON.stringify({ ...SAMPLE, version: 2 }));
    expect(loadCareer(st)).toBeNull();
    const { player: _p, ...noPlayer } = SAMPLE;
    st.setItem(CAREER_KEY, JSON.stringify(noPlayer));
    expect(loadCareer(st)).toBeNull();
    st.setItem(CAREER_KEY, JSON.stringify({ ...SAMPLE, team: 'xyz' }));
    expect(loadCareer(st)).toBeNull();
  });
  it('klemmt Werte auf 0…1', () => {
    const st = memory();
    st.setItem(CAREER_KEY, JSON.stringify({ ...SAMPLE, player: { ...SAMPLE.player, ratings: { ...SAMPLE.player.ratings, three: 3, dunk: -1 } } }));
    expect(loadCareer(st)!.player.ratings).toMatchObject({ three: 1, dunk: 0 });
  });
  it('übersteht blockierten Speicher', () => {
    expect(loadCareer(broken)).toBeNull();
    expect(() => saveCareer(SAMPLE, broken)).not.toThrow();
    expect(() => clearCareer(broken)).not.toThrow();
  });
  it('löscht den Stand', () => {
    const st = memory();
    saveCareer(SAMPLE, st);
    clearCareer(st);
    expect(loadCareer(st)).toBeNull();
  });
});
