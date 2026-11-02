import { useCallback, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeContext } from '@/contexts/theme-context';
import {
  applyTheme,
  parseThemePreference,
  readThemePreference,
  resolveTheme,
  THEME_MEDIA_QUERY,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from '@/lib/theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState(() => {
    const preference = readThemePreference();
    return { preference, resolvedTheme: resolveTheme(preference) };
  });

  const setTheme = useCallback((preference: ThemePreference) => {
    setThemeState({ preference, resolvedTheme: resolveTheme(preference) });
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      // The current tab still works when storage is blocked or full.
    }
  }, []);

  useLayoutEffect(() => {
    applyTheme(theme.resolvedTheme);
  }, [theme.resolvedTheme]);

  useEffect(() => {
    if (theme.preference !== 'system') return;
    let media: MediaQueryList;
    try {
      media = window.matchMedia(THEME_MEDIA_QUERY);
    } catch {
      return;
    }
    const onSystemChange = (event: MediaQueryListEvent) => {
      setThemeState(current => current.preference === 'system'
        ? { preference: 'system', resolvedTheme: event.matches ? 'dark' : 'light' }
        : current);
    };
    media.addEventListener('change', onSystemChange);
    return () => media.removeEventListener('change', onSystemChange);
  }, [theme.preference]);

  useEffect(() => {
    const onStorageChange = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
      if (event.storageArea !== null) {
        try {
          if (event.storageArea !== window.localStorage) return;
        } catch {
          return;
        }
      }
      const preference = parseThemePreference(event.newValue);
      setThemeState({ preference, resolvedTheme: resolveTheme(preference) });
    };
    window.addEventListener('storage', onStorageChange);
    return () => window.removeEventListener('storage', onStorageChange);
  }, []);

  const value = useMemo(() => ({ ...theme, setTheme }), [theme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
