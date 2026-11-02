import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');

function palette(selector: string) {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`Missing palette: ${selector}`);
  const block = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries([...block.matchAll(/--color-([\w-]+):\s*(#[\da-f]{6});/gi)].map(([, key, value]) => [key, value]));
}

function luminance(hex: string) {
  if (!hex) throw new Error('Color token is not defined');
  const values = hex.slice(1).match(/.{2}/g)!.map(value => {
    const channel = parseInt(value, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}

function contrast(first: string, second: string) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

// Guard the actual token pairs used by body text, small metadata, status badges,
// links and filled controls. These thresholds apply to normal-size text.
const textPairs = [
  ['ink', 'page'], ['ink', 'surface'], ['muted', 'page'], ['muted', 'surface'],
  ['warm-400', 'surface'], ['warm-400', 'page'], ['muted', 'warm-100'],
  ['primary', 'surface'], ['primary', 'iris-50'], ['iris-700', 'iris-50'],
  ['success', 'success-bg'], ['warning', 'warning-bg'], ['danger', 'danger-bg'],
  ['action-foreground', 'action'], ['action-foreground', 'action-hover'],
  ['action-foreground', 'destructive'], ['action-foreground', 'destructive-hover'],
];

describe.each(['light', 'dark'])('%s theme contrast', theme => {
  const tokens = { ...palette('@theme'), ...(theme === 'dark' ? palette('html.dark') : {}) };
  it.each(textPairs)('%s text on %s meets WCAG AA', (foreground, background) => {
    expect(contrast(tokens[foreground], tokens[background])).toBeGreaterThanOrEqual(4.5);
  });
  it('keeps unchecked control borders and focus indicators distinguishable', () => {
    expect(contrast(tokens.control, tokens.surface)).toBeGreaterThanOrEqual(3);
    expect(contrast(tokens.primary, tokens.surface)).toBeGreaterThanOrEqual(3);
  });
});
