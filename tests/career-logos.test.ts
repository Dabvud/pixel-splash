import { describe, expect, it } from 'vitest';
import { TEAMS } from '../src/career/league';
import { teamLogo } from '../src/career/logos';

describe('Pixel-Wappen', () => {
  it('jedes Team hat ein eigenes 11×11-Wappen mit Motiv, in Teamfarbe', () => {
    const seen = new Set<string>();
    for (const t of TEAMS) {
      const svg = teamLogo(t.id);
      expect(svg, t.id).toContain(`fill="${t.jersey}"`);
      const px = svg.match(/<rect x="\d+" y="\d+"/g) ?? [];
      expect(px.length, t.id).toBeGreaterThan(15);
      for (const m of px) for (const n of m.match(/\d+/g)!) { expect(Number(n)).toBeGreaterThanOrEqual(1); expect(Number(n)).toBeLessThanOrEqual(11); }
      seen.add(px.join());
    }
    expect(seen.size).toBe(30);
  });
});
