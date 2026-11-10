import { afterEach, describe, expect, it } from 'vitest';
import { createPlayHud } from '../src/ui/play-hud';

afterEach(() => document.body.replaceChildren());

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
