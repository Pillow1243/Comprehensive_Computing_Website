import type { Config } from 'tailwindcss';

/**
 * SolveEverything design tokens — Material Design 3 tonal palette.
 * Every colour resolves to a CSS custom property defined in app/globals.css,
 * so light/dark/AMOLED themes swap without re-rendering utility classes.
 */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: token('md-primary'),
        'on-primary': token('md-on-primary'),
        'primary-container': token('md-primary-container'),
        'on-primary-container': token('md-on-primary-container'),
        'primary-fixed': token('md-primary-fixed'),
        secondary: token('md-secondary'),
        'on-secondary': token('md-on-secondary'),
        'secondary-container': token('md-secondary-container'),
        'on-secondary-container': token('md-on-secondary-container'),
        tertiary: token('md-tertiary'),
        'on-tertiary': token('md-on-tertiary'),
        'tertiary-container': token('md-tertiary-container'),
        'on-tertiary-container': token('md-on-tertiary-container'),
        surface: token('md-surface'),
        'surface-dim': token('md-surface-dim'),
        'surface-bright': token('md-surface-bright'),
        'surface-container-lowest': token('md-surface-container-lowest'),
        'surface-container-low': token('md-surface-container-low'),
        'surface-container': token('md-surface-container'),
        'surface-container-high': token('md-surface-container-high'),
        'surface-container-highest': token('md-surface-container-highest'),
        'surface-variant': token('md-surface-variant'),
        'on-surface': token('md-on-surface'),
        'on-surface-variant': token('md-on-surface-variant'),
        outline: token('md-outline'),
        'outline-variant': token('md-outline-variant'),
        error: token('md-error'),
        'on-error': token('md-on-error'),
        'error-container': token('md-error-container'),
        'on-error-container': token('md-on-error-container'),
        success: token('md-success'),
        'on-success': token('md-on-success'),
        'success-container': token('md-success-container'),
        'on-success-container': token('md-on-success-container'),
        warning: token('md-warning'),
        'on-warning': token('md-on-warning'),
        scrim: token('md-scrim'),
        inverse: token('md-inverse'),
        'inverse-on-surface': token('md-inverse-on-surface'),
      },
      fontFamily: {
        sans: ['var(--font-vazirmatn)', 'var(--font-vazirmatn-latin)', 'system-ui', 'sans-serif'],
        latin: ['var(--font-vazirmatn-latin)', 'var(--font-vazirmatn)', 'system-ui', 'sans-serif'],
        persian: ['var(--font-vazirmatn)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        katex: ['KaTeX_Main', 'KaTeX_Math', 'serif'],
      },
      fontSize: {
        'display-large': ['3.5625rem', { lineHeight: '4rem', letterSpacing: '-0.015em' }],
        'display-medium': ['2.8125rem', { lineHeight: '3.25rem', letterSpacing: '-0.01em' }],
        'display-small': ['2.25rem', { lineHeight: '2.75rem', letterSpacing: '-0.005em' }],
        'headline-large': ['2rem', { lineHeight: '2.5rem' }],
        'headline-medium': ['1.75rem', { lineHeight: '2.25rem' }],
        'headline-small': ['1.5rem', { lineHeight: '2rem' }],
        'title-large': ['1.375rem', { lineHeight: '1.75rem' }],
        'title-medium': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0.009em' }],
        'title-small': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.006em' }],
        'body-large': ['1rem', { lineHeight: '1.6rem' }],
        'body-medium': ['0.875rem', { lineHeight: '1.35rem' }],
        'body-small': ['0.75rem', { lineHeight: '1rem' }],
        'label-large': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.006em' }],
        'label-medium': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.03em' }],
        'label-small': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.03em' }],
      },
      borderRadius: {
        sm: '0.5rem',
        DEFAULT: '0.75rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        '2xl': '1.75rem',
        '3xl': '2rem',
        full: '9999px',
      },
      spacing: {
        '4.5': '1.125rem',
        '18': '4.5rem',
        '20': '5rem',
        '22': '5.5rem',
        'safe-bottom': 'var(--safe-bottom)',
        'safe-top': 'var(--safe-top)',
      },
      boxShadow: {
        'elevation-0': 'none',
        'elevation-1': '0 1px 2px 0 rgb(0 0 0 / 0.3), 0 1px 3px 1px rgb(0 0 0 / 0.15)',
        'elevation-2': '0 1px 2px 0 rgb(0 0 0 / 0.3), 0 2px 6px 2px rgb(0 0 0 / 0.15)',
        'elevation-3': '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 4px 8px 3px rgb(0 0 0 / 0.15)',
        'elevation-4': '0 2px 3px 0 rgb(0 0 0 / 0.3), 0 6px 10px 4px rgb(0 0 0 / 0.15)',
        'elevation-5': '0 4px 4px 0 rgb(0 0 0 / 0.3), 0 8px 12px 6px rgb(0 0 0 / 0.15)',
        glow: '0 0 0 1px rgb(var(--md-primary) / 0.4), 0 8px 24px -8px rgb(var(--md-primary) / 0.45)',
      },
      transitionTimingFunction: {
        emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
        'emphasized-decelerate': 'cubic-bezier(0.05, 0.7, 0.1, 1)',
        'emphasized-accelerate': 'cubic-bezier(0.3, 0, 0.8, 0.15)',
        standard: 'cubic-bezier(0.2, 0, 0, 1)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-480px 0' },
          '100%': { backgroundPosition: '480px 0' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          // `none` (not `translateY(0)`) so the finished animation stops
          // creating a containing block for fixed-position children.
          to: { opacity: '1', transform: 'none' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'none' },
        },
        ripple: {
          from: { transform: 'scale(0)', opacity: '0.4' },
          to: { transform: 'scale(2.4)', opacity: '0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s linear infinite',
        'fade-up': 'fade-up 0.3s cubic-bezier(0.05, 0.7, 0.1, 1) both',
        'slide-up': 'slide-up 0.32s cubic-bezier(0.05, 0.7, 0.1, 1) both',
      },
      minHeight: {
        touch: '3rem',
      },
      minWidth: {
        touch: '3rem',
      },
      aspectRatio: {
        'chart-mobile': '4 / 3',
      },
      zIndex: {
        nav: '40',
        sheet: '60',
        toast: '80',
        modal: '70',
      },
    },
  },
  plugins: [],
};

export default config;
