'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAppStore, type ThemeMode } from '@/lib/store';

type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemeMode;
  resolved: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const readSystem = (): ResolvedTheme =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useAppStore((state) => state.settings.theme);
  const accent = useAppStore((state) => state.settings.accent);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const [system, setSystem] = useState<ResolvedTheme>('dark');

  useEffect(() => {
    setSystem(readSystem());
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const listener = (event: MediaQueryListEvent) => setSystem(event.matches ? 'light' : 'dark');
    media.addEventListener?.('change', listener);
    return () => media.removeEventListener?.('change', listener);
  }, []);

  const resolved: ResolvedTheme = theme === 'system' ? system : theme;

  useEffect(() => {
    document.documentElement.dataset.accent = accent ?? 'violet';
  }, [accent]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolved;
    root.classList.toggle('dark', resolved === 'dark');
    root.style.colorScheme = resolved;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', resolved === 'dark' ? '#000000' : '#FEFBFF');
  }, [resolved]);

  const setTheme = useCallback(
    (next: ThemeMode) => {
      updateSettings({ theme: next });
    },
    [updateSettings],
  );

  const toggle = useCallback(() => {
    setTheme(resolved === 'dark' ? 'light' : 'dark');
  }, [resolved, setTheme]);

  const value = useMemo(() => ({ theme, resolved, setTheme, toggle }), [theme, resolved, setTheme, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>');
  return context;
}

/**
 * Inline script that applies the persisted theme before first paint to avoid a
 * white flash / theme shift (CLS). Runs synchronously in <head>.
 */
export const themeBootstrapScript = `
(function(){
  try{
    var raw = localStorage.getItem('solveeverything.store.v3');
    var theme = raw ? (JSON.parse(raw).state || {}).settings?.theme || 'dark' : 'dark';
    var dark = theme === 'dark' || (theme === 'system' && !window.matchMedia('(prefers-color-scheme: light)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    var accent = raw ? (JSON.parse(raw).state || {}).settings?.accent || 'violet' : 'violet';
    document.documentElement.dataset.accent = accent;
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  }catch(e){
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.classList.add('dark');
  }
})();
`;
