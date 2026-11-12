import { describe, expect, it } from 'vitest';
import { TEAMS, teamName } from '../src/career/league';

const EAST = ['Boston Leprechauns', 'Brooklyn Buckets', 'New York Socks', 'Philadelphia 67ers', 'Toronto T-Rexes', 'Chicago Buffalos',
  'Cleveland Musketeers', 'Detroit Gears', 'Indiana Slowers', 'Milwaukee Deers', 'Atlanta Birds', 'Charlotte Bees', 'Miami Blizzard',
  'Orlando Physics', 'Washington Scientists'];
const WEST = ['Denver Gold Diggers', 'Minnesota Woodpuppies', 'Oklahoma City Lightning', 'Portland Trail Walkers', 'Utah Hip-Hop',
  'Golden State Pacifists', 'LA Sailboats', 'LA Puddles', 'Phoenix Moons', 'Sacramento Queens', 'Dallas Rebels', 'Houston UFOs',
  'Memphis Teddies', 'New Orleans Penguins', 'San Antonio Boots'];


describe('Karriere-Liga', () => {
  it('hat 30 Teams, je 15 pro Conference, mit den Namen aus der Merkliste', () => {
    expect(TEAMS).toHaveLength(30);
    expect(TEAMS.filter(t => t.conference === 'east').map(teamName).sort()).toEqual([...EAST].sort());
    expect(TEAMS.filter(t => t.conference === 'west').map(teamName).sort()).toEqual([...WEST].sort());
  });
  it('hat eindeutige ids, gültige Farben und Stärken 25–95', () => {
    expect(new Set(TEAMS.map(t => t.id)).size).toBe(30);
    for (const t of TEAMS) {
      expect(t.jersey).toMatch(/^#[0-9a-f]{6}$/);
      expect(t.shorts).toMatch(/^#[0-9a-f]{6}$/);
      expect(t.strength).toBeGreaterThanOrEqual(25);
      expect(t.strength).toBeLessThanOrEqual(95);
    }
  });
});
