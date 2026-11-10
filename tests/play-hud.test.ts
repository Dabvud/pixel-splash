import { afterEach, describe, expect, it } from 'vitest';
import { createPlayHud, formatPlayClock, playScore } from '../src/ui/play-hud';

afterEach(() => document.body.replaceChildren());

describe('Digitale Anzeigetafel', () => {
  it.each([[75, '1:15'], [60, '1:00'], [10.01, '0:11'], [10, '0:10'], [9.94, '9.9'], [8, '8.0'], [.01, '0.0'], [0, '0.0']])(
    'formatiert die laufende Uhr bei %s s als %s', (seconds, text) => {
      expect(formatPlayClock(seconds)).toBe(text);
    });
  it('formatiert die Lage-Einblendung weiterhin mit Minuten und Sekunden', () => {
    expect(formatPlayClock(8, false)).toBe('0:08');
  });
  it.each([[2, 0, 98], [2, 3, 101], [2, 4, 102], [1, 0, 99], [3, 0, 97]])(
    'berechnet Rückstand %s plus %s eigene Punkte als %s:100', (deficit, points, red) => {
      expect(playScore(deficit, points)).toEqual({ red, blue: 100 });
    });
  it('zeigt ROT und BLAU, Viertel, Spieluhr und live aktualisierte Punkte ohne kleine Uhr', () => {
    const hud = createPlayHud(document.body);
    hud.setScoreboard(9.94, 2, 0);
    const board = document.querySelector('.phud-scoreboard')!;
    expect(board.textContent).toContain('ROT');
    expect(board.textContent).toContain('BLAU');
    expect(board.textContent).toContain('4. VIERTEL');
    expect(board.querySelector('.phud-game-clock')!.textContent).toBe('9.9');
    expect(board.querySelector('.phud-score-red')!.textContent).toBe('98');
    expect(board.querySelector('.phud-score-blue')!.textContent).toBe('100');
    hud.setScoreboard(0, 2, 3);
    expect(board.querySelector('.phud-score-red')!.textContent).toBe('101');
    expect(board.querySelector('.phud-game-clock')!.textContent).toBe('0.0');
    expect(document.querySelector('.phud-clock')).toBeNull();
    hud.dispose();
    expect(document.querySelector('.phud-scoreboard')).toBeNull();
  });
});

describe('Spielzug-Optionsmarker', () => {
  it('verwendet Marker und Unterelemente wieder und mutiert unveränderte Frames nicht', () => {
    const hud = createPlayHud(document.body);
    const markers = [{ kind: 'pass' as const, x: 100, y: 120, label: '#50' }];
    hud.setMarkers(markers);
    const box = document.querySelector('.phud-markers')!;
    const marker = box.firstElementChild!;
    const icon = marker.querySelector('i')!, label = marker.querySelector('b')!;
    const observer = new MutationObserver(() => {});
    observer.observe(box, { attributes: true, childList: true, characterData: true, subtree: true });
    hud.setMarkers(markers.map(m => ({ ...m })));
    expect(observer.takeRecords()).toEqual([]);
    hud.setMarkers([{ kind: 'drive', x: 130, y: 140, label: '#11' }]);
    expect(box.firstElementChild).toBe(marker);
    expect(marker.querySelector('i')).toBe(icon);
    expect(marker.querySelector('b')).toBe(label);
    expect(label.textContent).toBe('#11');
    expect(icon.textContent).toBe('➤');
    expect(marker.classList.contains('phud-m-drive')).toBe(true);
    observer.disconnect();
    hud.dispose();
  });

  it('verwendet Marker nach Ausblenden erneut und aktualisiert Randpfeil und Beschriftung', () => {
    const hud = createPlayHud(document.body);
    hud.setMarkers([{ kind: 'pass', x: 100, y: 120, label: '#50' }]);
    const box = document.querySelector('.phud-markers')!;
    const marker = box.firstElementChild!;
    const icon = marker.querySelector<HTMLElement>('i')!;
    const label = marker.querySelector<HTMLElement>('b')!;
    hud.setMarkers([]);
    expect(box.children).toHaveLength(0);
    hud.setMarkers([{ kind: 'shoot', x: -100, y: 120 }]);
    expect(box.firstElementChild).toBe(marker);
    expect(marker.querySelector('i')).toBe(icon);
    expect(marker.querySelector('b')).toBeNull();
    expect(icon.textContent).toBe('➤');
    expect(marker.classList.contains('phud-m-edge')).toBe(true);
    hud.setMarkers([{ kind: 'pass', x: 100, y: 120, label: '<b>#11</b>' }]);
    expect(marker.querySelector('b')).toBe(label);
    expect(label.textContent).toBe('<b>#11</b>');
    expect(label.children).toHaveLength(0);
    expect(icon.textContent).toBe('');
    expect(marker.classList.contains('phud-m-edge')).toBe(false);
    hud.dispose();
  });
});
