import { describe, expect, it } from 'vitest';
import { HOT_GREEN_FACTOR, HOT_START, HOT_STREAK, hotGreenZone, nextHot } from '../src/shot/hot';

describe('Heißlaufen', () => {
  it('brennt ab dem dritten Treffer und bleibt beim vierten heiß', () => {
    expect(HOT_STREAK).toBe(3);
    const two = nextHot(nextHot(HOT_START, true), true);
    expect(two).toEqual({ streak: 2, onFire: false });
    const three = nextHot(two, true);
    expect(three).toEqual({ streak: 3, onFire: true });
    expect(nextHot(three, true)).toEqual({ streak: 4, onFire: true });
    expect(nextHot(three, false)).toEqual({ streak: 0, onFire: false });
    expect(HOT_START).toEqual({ streak: 0, onFire: false });
    expect(two).toEqual({ streak: 2, onFire: false });
  });

  it('setzt die Serie auch vor dem dritten Treffer bei einem Fehlwurf zurück', () => {
    const state = [true, true, false, true, true].reduce(nextHot, HOT_START);
    expect(state).toEqual({ streak: 2, onFire: false });
  });

  it('vergrößert die grüne Zone nur bei Feuer um Faktor 1,5', () => {
    expect(HOT_GREEN_FACTOR).toBe(1.5);
    expect(hotGreenZone(.07, true)).toBeCloseTo(.105, 10);
    expect(hotGreenZone(.07, false)).toBe(.07);
  });
});
