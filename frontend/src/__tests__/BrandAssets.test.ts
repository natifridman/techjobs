import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
function pngSize(filename: string) {
  const buffer = readFileSync(resolve(process.cwd(), 'public', filename));
  expect(buffer.subarray(1, 4).toString()).toBe('PNG');
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}
describe('brand assets', () => {
  it('ships correctly sized raster outputs for social and platform icons', () => {
    for (const [filename, size] of [['techjobsil-logo-64.png', 64], ['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512], ['favicon-32.png', 32]] as const) expect(pngSize(filename)).toEqual([size, size]);
    expect(pngSize('techjobsil-og.png')).toEqual([1200, 630]);
  });
  it('publishes metadata for the full-size social image', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
    expect(html).toContain('https://techjobsil.com/techjobsil-og.png');
    expect(html).toContain('content="summary_large_image"');
    expect(html).toContain('property="og:image:width" content="1200"');
  });
});
