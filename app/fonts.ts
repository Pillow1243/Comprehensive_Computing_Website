import localFont from 'next/font/local';

/**
 * Self-hosted fonts (no third-party requests on GitHub Pages).
 * `display: swap` + metric-adjusted fallbacks keep CLS under budget.
 */

export const vazirmatn = localFont({
  src: [
    { path: './fonts/vazirmatn-arabic.woff2', weight: '100 900', style: 'normal' },
    { path: './fonts/vazirmatn-latin.woff2', weight: '100 900', style: 'normal' },
  ],
  variable: '--font-vazirmatn',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'Segoe UI', 'Tahoma', 'sans-serif'],
  adjustFontFallback: false,
});

export const inter = localFont({
  src: './fonts/inter-latin.woff2',
  weight: '100 900',
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'Segoe UI', 'Arial', 'sans-serif'],
  adjustFontFallback: 'Arial',
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

export const fontVariables = `${vazirmatn.variable} ${inter.variable} ${jetbrainsMono.variable}`;
