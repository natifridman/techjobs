import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
let BannerAd: (typeof import('@/components/GoogleAd'))['BannerAd'];
beforeAll(async () => {
  vi.stubEnv('VITE_ADSENSE_CLIENT_ID', 'ca-pub-test');
  vi.stubEnv('VITE_ADSENSE_SLOT_BANNER', 'test-banner');
  BannerAd = (await import('@/components/GoogleAd')).BannerAd;
});
afterEach(() => {
  document
    .querySelectorAll('script[src*="adsbygoogle"], style[data-ad-test]')
    .forEach((element) => element.remove());
});
afterAll(() => vi.unstubAllEnvs());
function loadAdStyles() {
  const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');
  const style = document.createElement('style');
  style.dataset.adTest = 'true';
  style.textContent = css.slice(css.indexOf('.google-ad-shell'));
  document.head.append(style);
}
describe('advertisement layout', () => {
  it('collapses a blocked slot instead of leaving a blank rectangle', async () => {
    loadAdStyles();
    const { container } = render(<BannerAd />);
    const script = document.querySelector('script[src*="adsbygoogle"]')!;
    fireEvent.error(script);
    await waitFor(() => expect(container.querySelector('[data-ad-empty="true"]')).not.toBeNull());
    expect(container.querySelector('.google-ad-shell')).not.toBeVisible();
  });
  it('keeps pending creatives hidden, displays filled ads, and collapses unfilled ads', async () => {
    loadAdStyles();
    const script = document.createElement('script');
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    document.head.append(script);
    const { container } = render(<BannerAd />);
    const slot = container.querySelector('ins')!;
    expect(slot).not.toBeVisible();
    slot.setAttribute('data-ad-status', 'filled');
    expect(slot).toBeVisible();
    slot.setAttribute('data-ad-status', 'unfilled');
    expect(container.querySelector('.google-ad-shell')).not.toBeVisible();
  });
});
