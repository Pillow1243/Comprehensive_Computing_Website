import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/** Haptic feedback — silently ignored on devices/browsers without support. */
export const haptic = (pattern: number | number[] = 10, enabled = true) => {
  if (!enabled || typeof navigator === 'undefined') return;
  if (typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* vibration is a progressive enhancement */
  }
};

export const isRtlLanguage = (lang: string) => lang === 'fa' || lang === 'ar';

const nativeDigits: Record<string, string[]> = {
  fa: ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'],
  ar: ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'],
};

export type Numerals = 'latin' | 'native';

/** Convert Latin digits in a string to the locale's native digits. */
export const localizeDigits = (value: string, lang: string, numerals: Numerals = 'latin') => {
  if (numerals === 'latin') return value;
  const table = nativeDigits[lang];
  if (!table) return value;
  return value.replace(/[0-9]/g, (digit) => table[Number(digit)]);
};

/** Normalise Persian/Arabic digits typed by the user back to ASCII. */
export const normalizeDigits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

export interface FormatNumberOptions {
  decimals?: number;
  lang?: string;
  numerals?: Numerals;
  compact?: boolean;
  scientific?: boolean;
}

/** Human-friendly numeric formatting for results, plots and history. */
export const formatNumber = (value: unknown, options: FormatNumberOptions = {}): string => {
  const { decimals = 6, lang = 'fa', numerals = 'latin', compact = false, scientific } = options;
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? '✓' : '✗';
  if (typeof value === 'string') return localizeDigits(value, lang, numerals);
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    if (Number.isNaN(numeric)) return 'NaN';
    return numeric > 0 ? '∞' : '−∞';
  }
  let text: string;
  const abs = Math.abs(numeric);
  if (scientific ?? (abs !== 0 && (abs >= 1e12 || abs < 1e-6))) {
    text = numeric.toExponential(Math.min(decimals, 6));
  } else if (compact && abs >= 1000) {
    text = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(
      numeric,
    );
  } else {
    const maximumFractionDigits = clamp(decimals, 0, 20);
    text = new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(numeric);
  }
  return localizeDigits(text, lang, numerals);
};

export const formatPercent = (value: number, options: FormatNumberOptions = {}) =>
  `${formatNumber(value, options)}%`;

export const debounce = <Args extends unknown[]>(fn: (...args: Args) => void, delay = 200) => {
  let handle: ReturnType<typeof setTimeout> | undefined;
  const wrapped = (...args: Args) => {
    if (handle) clearTimeout(handle);
    handle = setTimeout(() => fn(...args), delay);
  };
  wrapped.cancel = () => {
    if (handle) clearTimeout(handle);
  };
  return wrapped;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
};

/** Share sheet on Android, clipboard fallback everywhere else. */
export const shareContent = async (
  data: ShareData,
): Promise<'shared' | 'copied' | 'cancelled' | 'failed'> => {
  try {
    if (navigator.share) {
      await navigator.share(data);
      return 'shared';
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
  }
  if (data.url) {
    return (await copyToClipboard(data.url)) ? 'copied' : 'failed';
  }
  return 'failed';
};

export const groupByDate = (
  timestamps: number[],
  locale: string,
): { key: string; label: string; items: number[] }[] => {
  const now = new Date();
  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const today = startOfDay(now);
  const day = 86_400_000;
  const buckets: Record<string, number[]> = {};
  for (const stamp of timestamps) {
    const diff = Math.round((today - startOfDay(new Date(stamp))) / day);
    const key =
      diff <= 0 ? 'today' : diff === 1 ? 'yesterday' : diff < 7 ? 'week' : diff < 30 ? 'month' : 'older';
    (buckets[key] ||= []).push(stamp);
  }
  const order = ['today', 'yesterday', 'week', 'month', 'older'];
  const formatter = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' });
  return order
    .filter((key) => buckets[key]?.length)
    .map((key) => ({
      key,
      label:
        key === 'today'
          ? locale.startsWith('fa')
            ? 'امروز'
            : 'Today'
          : key === 'yesterday'
            ? locale.startsWith('fa')
              ? 'دیروز'
              : 'Yesterday'
            : key === 'week'
              ? locale.startsWith('fa')
                ? 'هفته گذشته'
                : 'Previous 7 days'
              : key === 'month'
                ? locale.startsWith('fa')
                  ? 'ماه گذشته'
                  : 'Previous 30 days'
                : locale.startsWith('fa')
                  ? 'قدیمی‌تر'
                  : 'Older',
      items: buckets[key].sort((a, b) => b - a),
    }));
};

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** True when the browser reports a coarse pointer (phones/tablets). */
export const isTouchDevice = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0);

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
