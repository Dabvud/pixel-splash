import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('erlaubt Seitenzoom und verhindert Doppeltipp-Zoom nur auf der Spielfläche', () => {
  const html = readFileSync('index.html', 'utf8'), css = readFileSync('src/style.css', 'utf8');
  expect(html).not.toMatch(/maximum-scale|user-scalable/);
  expect(css.match(/html,\s*body\s*\{[^}]+/s)?.[0]).not.toContain('touch-action: none');
  expect(css.match(/#stage\s*\{[^}]+/s)?.[0]).toContain('touch-action: none');
});
