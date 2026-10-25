import localFont from 'next/font/local';

/**
 * Self-hosted fonts (no third-party requests on GitHub Pages).
 * `display: swap` + metric-adjusted fallbacks keep CLS under budget.
 *
 * `next/font` emits a `<link rel="preload">` for every registered file, so the
 * Persian and Latin subsets are split into two instances: only the Arabic
 * subset — the one the first screen is set in — is preloaded, and the Latin
 * subset (numbers, Latin names) loads through normal font loading.
 *
 * Fonts: Vazirmatn for both scripts (its Latin is part of the family) and
 * JetBrains Mono for results; the two together replace the previous
 * Vazirmatn + Inter + JetBrains trio and save ~47 KB of transfer.
 */

export const vazirmatn = localFont({
  src: [{ path: './fonts/vazirmatn-arabic.woff2', weight: '100 900', style: 'normal' }],
  variable: '--font-vazirmatn',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'Segoe UI', 'Tahoma', 'sans-serif'],
  adjustFontFallback: false,
});

export const vazirmatnLatin = localFont({
  src: [{ path: './fonts/vazirmatn-latin.woff2', weight: '100 900', style: 'normal' }],
  variable: '--font-vazirmatn-latin',
  display: 'swap',
  preload: false,
  fallback: ['system-ui', 'Segoe UI', 'Arial', 'sans-serif'],
  adjustFontFallback: false,
});

export const jetbrainsMono = localFont({
  src: './fonts/jetbrains-mono-latin.woff2',
  weight: '100 800',
  variable: '--font-jetbrains',
  display: 'swap',
  preload: false,
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
  adjustFontFallback: false,
});

export const fontVariables = `${vazirmatn.variable} ${vazirmatnLatin.variable} ${jetbrainsMono.variable}`;
