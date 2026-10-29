import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '@/components/ThemeProvider';
import { useTheme } from '@/hooks/useTheme';
import { THEME_MEDIA_QUERY, THEME_STORAGE_KEY } from '@/lib/theme';

function ThemeControls() {
  const { preference, resolvedTheme, setTheme } = useTheme();
  return <>
    <output>{preference}/{resolvedTheme}</output>
    <button onClick={() => setTheme('light')}>Light</button>
    <button onClick={() => setTheme('dark')}>Dark</button>
    <button onClick={() => setTheme('system')}>System</button>
  </>;
}

let systemDark: boolean;
let listeners: Set<(event: MediaQueryListEvent) => void>;
let media: MediaQueryList;
let themeColor: HTMLMetaElement;

function changeSystem(dark: boolean) {
  act(() => {
    systemDark = dark;
    listeners.forEach(listener => listener({ matches: dark } as MediaQueryListEvent));
  });
}

function storageChange(value: string | null, key: string | null = THEME_STORAGE_KEY, storageArea: Storage | null = null) {
  const event = new StorageEvent('storage', { key, newValue: value });
  // The suite's storage mock is not a native jsdom Storage instance.
  Object.defineProperty(event, 'storageArea', { value: storageArea });
  act(() => { window.dispatchEvent(event); });
}

function expectRoot(theme: 'light' | 'dark') {
  expect(document.documentElement.classList.contains('dark')).toBe(theme === 'dark');
  expect(document.documentElement.dataset.theme).toBe(theme);
  expect(document.documentElement.style.colorScheme).toBe(theme);
  expect(themeColor.content).toBe(theme === 'dark' ? '#111B2E' : '#FFFFFF');
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.style.colorScheme = '';
  themeColor = document.createElement('meta');
  themeColor.name = 'theme-color';
  themeColor.content = '#FFFFFF';
  document.head.append(themeColor);
  systemDark = false;
  listeners = new Set();
  media = {
    get matches() { return systemDark; },
    media: THEME_MEDIA_QUERY,
    addEventListener: vi.fn((_type, listener) => listeners.add(listener as (event: MediaQueryListEvent) => void)),
    removeEventListener: vi.fn((_type, listener) => listeners.delete(listener as (event: MediaQueryListEvent) => void)),
  } as unknown as MediaQueryList;
  vi.spyOn(window, 'matchMedia').mockReturnValue(media);
});

afterEach(() => { themeColor.remove(); vi.restoreAllMocks(); });

describe('theme preference', () => {
  it('defaults to the system and follows changes without persisting an override', () => {
    render(<ThemeProvider><ThemeControls /></ThemeProvider>);
    expect(screen.getByText('system/light')).toBeInTheDocument();
    expectRoot('light');
    changeSystem(true);
    expect(screen.getByText('system/dark')).toBeInTheDocument();
    expectRoot('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('persists explicit choices and subscribes to the OS only in system mode', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<ThemeProvider><ThemeControls /></ThemeProvider>);
    await user.click(screen.getByRole('button', { name: 'Dark' }));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(listeners.size).toBe(0);
    changeSystem(false);
    expectRoot('dark');
    unmount();
    render(<ThemeProvider><ThemeControls /></ThemeProvider>);
    expect(screen.getByText('dark/dark')).toBeInTheDocument();
    expect(listeners.size).toBe(0);
    await user.click(screen.getByRole('button', { name: 'System' }));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
    expect(listeners.size).toBe(1);
    expectRoot('light');
    changeSystem(true);
    expectRoot('dark');
  });

  it('syncs preferences from other tabs and follows the OS after storage is cleared or invalid', () => {
    render(<ThemeProvider><ThemeControls /></ThemeProvider>);
    const persist = vi.spyOn(localStorage, 'setItem');
    storageChange('dark', THEME_STORAGE_KEY, localStorage);
    expect(screen.getByText('dark/dark')).toBeInTheDocument();
    expectRoot('dark');
    storageChange('light', 'another-setting');
    expectRoot('dark');
    storageChange(null, null);
    expect(screen.getByText('system/light')).toBeInTheDocument();
    changeSystem(true);
    storageChange('invalid');
    expect(screen.getByText('system/dark')).toBeInTheDocument();
    expectRoot('dark');
    expect(persist).not.toHaveBeenCalled();
  });

  it('keeps controls usable when reading and writing localStorage throws', async () => {
    systemDark = true;
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    render(<ThemeProvider><ThemeControls /></ThemeProvider>);
    expect(screen.getByText('system/dark')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Light' }));
    expect(screen.getByText('light/light')).toBeInTheDocument();
    expectRoot('light');
  });

  it('ignores sessionStorage changes for the same theme key', () => {
    render(<ThemeProvider><ThemeControls /></ThemeProvider>);
    storageChange('dark', THEME_STORAGE_KEY, window.sessionStorage);
    expect(screen.getByText('system/light')).toBeInTheDocument();
    expectRoot('light');
  });

  it('removes media and cross-tab listeners when unmounted', () => {
    const removeStorage = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<ThemeProvider><ThemeControls /></ThemeProvider>);
    expect(listeners.size).toBe(1);
    unmount();
    expect(listeners.size).toBe(0);
    expect(media.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    expect(removeStorage).toHaveBeenCalledWith('storage', expect.any(Function));
  });
});

describe('theme before the first paint', () => {
  const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
  const script = html.match(/<script id="theme-init">([\s\S]*?)<\/script>/)?.[1];

  it.each([
    [null, true, 'system', 'dark'],
    [null, false, 'system', 'light'],
    ['light', true, 'light', 'light'],
    ['dark', false, 'dark', 'dark'],
    ['system', true, 'system', 'dark'],
    ['invalid', true, 'system', 'dark'],
    ['invalid', false, 'system', 'light'],
  ] as const)('agrees with React for preference %s and dark OS %s', (stored, darkOS, preference, resolvedTheme) => {
    systemDark = darkOS;
    if (stored !== null) localStorage.setItem(THEME_STORAGE_KEY, stored);
    expect(script).toBeTruthy();
    new Function('window', 'document', 'localStorage', script!)(window, document, localStorage);
    expectRoot(resolvedTheme);
    render(<ThemeProvider><ThemeControls /></ThemeProvider>);
    expect(screen.getByText(`${preference}/${resolvedTheme}`)).toBeInTheDocument();
    expectRoot(resolvedTheme);
    expect(html.indexOf('name="theme-color"')).toBeLessThan(html.indexOf('id="theme-init"'));
    expect(html.indexOf('id="theme-init"')).toBeLessThan(html.indexOf('/src/main.tsx'));
  });

  it('also handles blocked storage before React starts', () => {
    systemDark = true;
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    new Function('window', 'document', 'localStorage', script!)(window, document, localStorage);
    expectRoot('dark');
    render(<ThemeProvider><ThemeControls /></ThemeProvider>);
    expect(screen.getByText('system/dark')).toBeInTheDocument();
    expectRoot('dark');
  });
});
