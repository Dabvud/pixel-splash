export interface Team {
  id: string; city: string; name: string; conference: 'east' | 'west';
  jersey: string; shorts: string; strength: number;
}

// [id, Stadt, Name, Trikot, Hose, Startstärke] – Namen aus der Merkliste, Farben ohne Logos
type Row = [string, string, string, string, string, number];
const EAST: Row[] = [
  ['bos', 'Boston', 'Leprechauns', '#1f7a3d', '#13502a', 72],
  ['bkn', 'Brooklyn', 'Buckets', '#2b2b2b', '#151515', 45],
  ['nys', 'New York', 'Socks', '#e06a1b', '#1d4fa0', 63],
  ['phi', 'Philadelphia', '67ers', '#1d5fbf', '#c8322b', 58],
  ['tor', 'Toronto', 'T-Rexes', '#a3161f', '#1b1b1b', 48],
  ['chi', 'Chicago', 'Buffalos', '#c41e2a', '#1b1b1b', 52],
  ['cle', 'Cleveland', 'Musketeers', '#7a1e34', '#d9a52b', 70],
  ['det', 'Detroit', 'Gears', '#1d4fa0', '#c8322b', 38],
  ['ind', 'Indiana', 'Slowers', '#f2b51c', '#173a7a', 60],
  ['mil', 'Milwaukee', 'Deers', '#2d5a2f', '#e8dcc0', 74],
  ['atl', 'Atlanta', 'Birds', '#d0312d', '#f2f2f2', 50],
  ['cha', 'Charlotte', 'Bees', '#22a3a8', '#3a2e78', 40],
  ['mia', 'Miami', 'Blizzard', '#8fd3f0', '#2f3a5a', 66],
  ['orl', 'Orlando', 'Physics', '#2c7ad6', '#1b1b1b', 61],
  ['was', 'Washington', 'Scientists', '#e8eef5', '#c8322b', 35],
];
const WEST: Row[] = [
  ['den', 'Denver', 'Gold Diggers', '#f0b52b', '#1d3a6b', 76],
  ['min', 'Minnesota', 'Woodpuppies', '#2a6b3f', '#1b2a4a', 71],
  ['okc', 'Oklahoma City', 'Lightning', '#2f8fdb', '#f26b21', 82],
  ['por', 'Portland', 'Trail Walkers', '#c8322b', '#1b1b1b', 42],
  ['uta', 'Utah', 'Hip-Hop', '#6b2fa0', '#f2b51c', 39],
  ['gsp', 'Golden State', 'Pacifists', '#1f5bc6', '#f2c42b', 64],
  ['las', 'LA', 'Sailboats', '#e8eef5', '#1d4fa0', 59],
  ['lap', 'LA', 'Puddles', '#5b2a86', '#f2b51c', 67],
  ['phx', 'Phoenix', 'Moons', '#3b2a6b', '#e56a1f', 55],
  ['sac', 'Sacramento', 'Queens', '#5a2d82', '#9aa3ab', 53],
  ['dal', 'Dallas', 'Rebels', '#1d64c0', '#9aa3ab', 65],
  ['hou', 'Houston', 'UFOs', '#c41e3a', '#9aa3ab', 62],
  ['mem', 'Memphis', 'Teddies', '#6a8fbf', '#1d2a44', 57],
  ['nop', 'New Orleans', 'Penguins', '#1b1b1b', '#e8eef5', 46],
  ['sas', 'San Antonio', 'Boots', '#c9c9c9', '#1b1b1b', 49],
];

export const TEAMS: Team[] = [
  ...EAST.map(r => row(r, 'east' as const)),
  ...WEST.map(r => row(r, 'west' as const)),
];

function row([id, city, name, jersey, shorts, strength]: Row, conference: 'east' | 'west'): Team {
  return { id, city, name, conference, jersey, shorts, strength };
}

export function teamName(t: Team): string {
  return `${t.city} ${t.name}`;
}

export function teamById(id: string): Team {
  const t = TEAMS.find(x => x.id === id);
  if (!t) throw new Error(`Unbekanntes Team ${id}`);
  return t;
}
