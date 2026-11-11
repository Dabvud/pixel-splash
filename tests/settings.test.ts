import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULTS, FOUL_MULT, INFLUENCE, PROFILES, SPOTS, STORAGE_KEY,
  loadSettings, saveSettings, spotDistance,
} from '../src/settings';
import type { Settings } from '../src/settings';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('Einstellungen', () => {
  it('enthält die vorgegebenen Standardwerte und den Speicherschlüssel', () => {
    expect(DEFAULTS).toEqual({
      spot: 'top', camera: 'auto', profile: 'avg', influence: 'fair',
      meterMs: 700, greenZone: 0.07, aimDeg: 6, pixelHeight: 320,
      mode: 'shot', play: 'random', slowmo: 0.3, decisionS: 2.5, animSpeed: 1,
      defenseRandom: true, fouls: 'normal', finishMeterMs: 900, finishGreen: 0.18,
      finishAim: 8, tempoSpread: 0.3, zoneFloor: 0.7,
      passDelayMax: 0.6, closeoutRandom: 1,
      finishFoulChance: -1, forcePoster: false, forceGlass: false, posterVariant: 'random',
    });
    expect(STORAGE_KEY).toBe('pixel-splash.settings.v1');
  });

  it('enthält alle Spots in der vorgegebenen Reihenfolge', () => {
    expect(SPOTS).toEqual([
      { id: 'corner_l', label: 'Ecke links', x: -6.6, z: 0.5 },
      { id: 'wing_l', label: 'Flügel links', x: -4.8, z: 4.8 },
      { id: 'top', label: 'Top', x: 0, z: 6.9 },
      { id: 'wing_r', label: 'Flügel rechts', x: 4.8, z: 4.8 },
      { id: 'corner_r', label: 'Ecke rechts', x: 6.6, z: 0.5 },
      { id: 'ft', label: 'Freiwurf', x: 0, z: 4.2 },
      { id: 'mid', label: 'Mitteldistanz', x: 0, z: 5.2 },
    ]);
  });

  it('enthält die vorgegebenen Profile und Einflüsse', () => {
    expect(PROFILES).toEqual([
      { id: 'elite', label: 'Elite-Schütze', rating: 0.9 },
      { id: 'avg', label: 'Durchschnitt', rating: 0.5 },
      { id: 'center', label: 'Center', rating: 0.1 },
    ]);
    expect(INFLUENCE).toEqual({ off: 0, light: 0.3, fair: 0.6, strong: 1 });
  });

  it('liefert ohne Speicher die Standardwerte', () => {
    expect(loadSettings(null)).toEqual(DEFAULTS);
  });

  it('liefert bei leerem Speicher die Standardwerte', () => {
    expect(loadSettings(localStorage)).toEqual(DEFAULTS);
  });

  it.each(['kein json', 'null', '[]', '42', '"alt"'])('verträgt ungültige Speicherdaten: %s', (raw) => {
    localStorage.setItem(STORAGE_KEY, raw);
    expect(loadSettings(localStorage)).toEqual(DEFAULTS);
  });

  it('prüft jedes Feld einzeln und erhält gültige Werte', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      meterMs: 5000, greenZone: 0.01, aimDeg: 'x', spot: 'nirgends',
      pixelHeight: 333, camera: 'high',
    }));
    expect(loadSettings(localStorage)).toEqual({
      ...DEFAULTS, meterMs: 1200, greenZone: 0.03, camera: 'high',
    });
  });

  it.each([
    ['meterMs', 1, 400], ['meterMs', 5000, 1200],
    ['greenZone', 0.01, 0.03], ['greenZone', 1, 0.15],
    ['aimDeg', -1, 2], ['aimDeg', 20, 12],
  ])('begrenzt %s = %s auf %s', (field, value, expected) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ [field]: value }));
    expect(loadSettings(localStorage)).toEqual({ ...DEFAULTS, [field]: expected });
  });

  it('ersetzt falsche Typen und unbekannte IDs durch Standardwerte', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      spot: 1, camera: 'fern', profile: 'pro', influence: false,
      meterMs: '700', greenZone: null, aimDeg: {}, pixelHeight: '420',
    }));
    expect(loadSettings(localStorage)).toEqual(DEFAULTS);
  });

  it('ersetzt nicht endliche Zahlen durch Standardwerte', () => {
    localStorage.setItem(STORAGE_KEY, '{"meterMs":1e400,"greenZone":-1e400,"aimDeg":1e400}');
    expect(loadSettings(localStorage)).toEqual(DEFAULTS);
  });

  it.each([220, 320, 420, 540] as const)('erhält gültige Werte beim Rundweg mit Pixelhöhe %s', (pixelHeight) => {
    const settings: Settings = {
      ...DEFAULTS,
      spot: 'wing_r', camera: 'low', profile: 'elite', influence: 'light',
      meterMs: 900, greenZone: 0.12, aimDeg: 9, pixelHeight,
    };
    saveSettings(settings, localStorage);
    expect(loadSettings(localStorage)).toEqual(settings);
  });

  it('verwendet standardmäßig globalThis.localStorage', () => {
    const settings: Settings = { ...DEFAULTS, spot: 'mid', profile: 'center', influence: 'off' };
    saveSettings(settings);
    expect(loadSettings()).toEqual(settings);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(settings);
  });

  it('verträgt werfendes getItem und setItem', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('gesperrt'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('voll'); });
    expect(loadSettings(localStorage)).toEqual(DEFAULTS);
    expect(() => saveSettings(DEFAULTS, localStorage)).not.toThrow();
    expect(() => saveSettings(DEFAULTS, null)).not.toThrow();
  });

  it('verträgt bereits den gesperrten Zugriff auf localStorage', () => {
    vi.spyOn(globalThis, 'localStorage', 'get').mockImplementation(() => { throw new Error('gesperrt'); });
    expect(loadSettings()).toEqual(DEFAULTS);
    expect(() => saveSettings(DEFAULTS)).not.toThrow();
  });

  it.each([['top', 6.9], ['ft', 4.2]] as const)('berechnet die Entfernung für %s', (id, expected) => {
    expect(spotDistance(SPOTS.find((spot) => spot.id === id)!)).toBeCloseTo(expected, 2);
  });
});

describe('Spielzug-Einstellungen', () => {
  it('lädt v1-Daten mit alten Werten und neuen Standardfeldern', () => {
    const old = { spot: 'mid', camera: 'high', profile: 'elite', influence: 'off',
      meterMs: 900, greenZone: 0.12, aimDeg: 9, pixelHeight: 420 };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(old));
    expect(loadSettings()).toEqual({ ...DEFAULTS, ...old });
    expect(FOUL_MULT).toEqual({ off: 0, rare: 0.5, normal: 1, often: 2 });
  });

  it.each([
    ['slowmo', -1, 0.2], ['slowmo', 0.9, 0.5],
    ['decisionS', 0, 1.5], ['decisionS', 9, 4],
    ['animSpeed', 0, 0.5], ['animSpeed', 2, 1.5],
    ['finishMeterMs', 0, 300], ['finishMeterMs', 2000, 1500],
    ['finishGreen', 0, 0.05], ['finishGreen', 1, 0.25],
    ['finishAim', 0, 4], ['finishAim', 20, 14],
    ['tempoSpread', -1, 0], ['tempoSpread', 1, 0.5],
    ['zoneFloor', 0, 0.5], ['zoneFloor', 1, 0.9],
  ])('begrenzt das neue Feld %s = %s auf %s', (field, value, expected) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ [field]: value }));
    expect(loadSettings()).toEqual({ ...DEFAULTS, [field]: expected });
  });

  it('ersetzt ungültige Spielzug-Felder durch Standardwerte', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode: 'x', play: 'x', fouls: 'x',
      defenseRandom: 'ja', slowmo: '0.3', decisionS: null, animSpeed: false,
      finishMeterMs: [], finishGreen: {}, finishAim: '8', tempoSpread: null, zoneFloor: false }));
    expect(loadSettings()).toEqual(DEFAULTS);
  });

  it.each(['pnr', 'fastbreak', 'kickout', 'inbound', 'random'] as const)(
    'speichert und lädt gültige Spielzug-Werte für %s', (play) => {
      for (const fouls of ['off', 'rare', 'normal', 'often'] as const) {
        const settings: Settings = { ...DEFAULTS, mode: 'play', play, fouls, defenseRandom: false,
          slowmo: 0.4, decisionS: 3, animSpeed: 1.2, finishMeterMs: 600,
          finishGreen: 0.15, finishAim: 10, tempoSpread: 0.4, zoneFloor: 0.8 };
        saveSettings(settings);
        expect(loadSettings()).toEqual(settings);
      }
    });
});

describe('Testphase: langsames, großzügiges Abschluss-Meter', () => {
  it('nutzt als Standard 900 ms und ±18 % grüne Zone', () => {
    expect(DEFAULTS.finishMeterMs).toBe(900);
    expect(DEFAULTS.finishGreen).toBeCloseTo(0.18, 10);
  });

  it('hebt gespeicherte alte Standardwerte (450 ms, ±10 %) auf die neuen an, eigene Werte bleiben', () => {
    const store = (v: Record<string, unknown>) => ({ getItem: () => JSON.stringify(v) }) as unknown as Storage;
    const old = loadSettings(store({ finishMeterMs: 450, finishGreen: 0.1 }));
    expect(old.finishMeterMs).toBe(900);
    expect(old.finishGreen).toBeCloseTo(0.18, 10);
    const own = loadSettings(store({ finishMeterMs: 600, finishGreen: 0.12 }));
    expect(own.finishMeterMs).toBe(600);
    expect(own.finishGreen).toBeCloseTo(0.12, 10);
  });

  it('erlaubt bis 1500 ms und ±25 %', () => {
    const store = { getItem: () => JSON.stringify({ finishMeterMs: 1500, finishGreen: 0.25 }) } as unknown as Storage;
    expect(loadSettings(store).finishMeterMs).toBe(1500);
    expect(loadSettings(store).finishGreen).toBeCloseTo(0.25, 10);
  });
});
