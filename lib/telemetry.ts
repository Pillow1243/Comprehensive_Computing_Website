'use client';

/**
 * Dependency-free telemetry hooks.
 *
 * The app must stay inside a 200 KB gzip first-load budget, so Sentry/PostHog
 * SDKs are NOT bundled. Instead this module exposes a stable adapter: when a
 * DSN is configured the host page can inject `window.Sentry` (or set
 * `NEXT_PUBLIC_SENTRY_DSN` and load the SDK lazily from a self-hosted bundle),
 * and every error/metric below is forwarded automatically. Without a DSN,
 * errors are kept in a bounded in-memory ring buffer and printed in development.
 */

export interface ErrorContext {
  formulaId?: string;
  inputs?: Record<string, string | number | boolean>;
  scope?: string;
  [key: string]: unknown;
}

interface SentryLike {
  captureException?: (error: unknown, context?: { tags?: Record<string, string>; extra?: unknown }) => void;
  captureMessage?: (message: string, context?: { tags?: Record<string, string>; extra?: unknown }) => void;
}

interface PostHogLike {
  capture?: (event: string, properties?: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    Sentry?: SentryLike;
    posthog?: PostHogLike;
    __SE_ERRORS__?: Array<{ message: string; context: ErrorContext; at: number }>;
    __SE_VITALS__?: Record<string, number>;
  }
}

const MAX_BUFFER = 25;

export const reportError = (error: unknown, context: ErrorContext = {}): void => {
  if (typeof window === 'undefined') return;
  const message = error instanceof Error ? error.message : String(error);
  const entry = { message, context, at: Date.now() };
  const buffer = (window.__SE_ERRORS__ ??= []);
  buffer.unshift(entry);
  if (buffer.length > MAX_BUFFER) buffer.length = MAX_BUFFER;

  const tags: Record<string, string> = {};
  if (context.formulaId) tags.formula_id = String(context.formulaId);
  if (context.scope) tags.scope = String(context.scope);

  try {
    window.Sentry?.captureException?.(error, { tags, extra: context });
    window.posthog?.capture?.('calculation_error', {
      formula_id: context.formulaId,
      scope: context.scope,
      message,
    });
  } catch {
    /* monitoring must never break the app */
  }

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn('[solveeverything]', message, context);
  }
};

export const reportEvent = (name: string, properties: Record<string, unknown> = {}): void => {
  if (typeof window === 'undefined') return;
  try {
    window.posthog?.capture?.(name, properties);
  } catch {
    /* noop */
  }
};

export interface VitalBudget {
  fcp: number;
  lcp: number;
  tbt: number;
  cls: number;
  inp: number;
  ttfb: number;
}

/** Budgets from the specification (mobile, 3G Fast). */
export const VITAL_BUDGETS: VitalBudget = {
  fcp: 1500,
  lcp: 2500,
  tbt: 200,
  cls: 0.1,
  inp: 200,
  ttfb: 800,
};

let vitalsStarted = false;

const record = (name: string, value: number) => {
  const store = (window.__SE_VITALS__ ??= {});
  store[name] = value;
  const budget = VITAL_BUDGETS[name.toLowerCase() as keyof VitalBudget];
  if (budget !== undefined && value > budget && process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn(`[vitals] ${name} ${Math.round(value)} exceeds budget ${budget}`);
  }
  reportEvent('web_vital', { name, value: Math.round(value) });
};

/**
 * Observe Core Web Vitals without the `web-vitals` dependency.
 * The metrics are exposed on `window.__SE_VITALS__` for Lighthouse/CI assertions.
 */
export const startWebVitals = (): void => {
  if (typeof window === 'undefined' || vitalsStarted) return;
  vitalsStarted = true;
  if (typeof PerformanceObserver === 'undefined') return;

  const safeObserve = (type: string, callback: (entries: PerformanceEntryList) => void) => {
    try {
      const observer = new PerformanceObserver((list) => callback(list.getEntries()));
      observer.observe({ type, buffered: true } as PerformanceObserverInit);
    } catch {
      /* unsupported entry type */
    }
  };

  // FCP
  safeObserve('paint', (entries) => {
    for (const entry of entries) {
      if (entry.name === 'first-contentful-paint') record('FCP', entry.startTime);
    }
  });

  // LCP — keep the latest value instead of stopping at first input.
  let lcpValue = 0;
  safeObserve('largest-contentful-paint', (entries) => {
    const last = entries[entries.length - 1];
    if (last) {
      lcpValue = last.startTime;
      record('LCP', lcpValue);
    }
  });

  // CLS — session window (max 5s window, 1s gap).
  let clsValue = 0;
  let sessionValue = 0;
  let sessionEntries: PerformanceEntry[] = [];
  safeObserve('layout-shift', (entries) => {
    for (const entry of entries as Array<PerformanceEntry & { hadRecentInput?: boolean; value?: number }>) {
      if (entry.hadRecentInput) continue;
      const first = sessionEntries[0];
      const last = sessionEntries[sessionEntries.length - 1];
      const inWindow =
        sessionEntries.length &&
        last &&
        entry.startTime - last.startTime < 1000 &&
        entry.startTime - first.startTime < 5000;
      if (inWindow) {
        sessionValue += entry.value ?? 0;
        sessionEntries.push(entry);
      } else {
        sessionValue = entry.value ?? 0;
        sessionEntries = [entry];
      }
      clsValue = Math.max(clsValue, sessionValue);
    }
    record('CLS', Math.round(clsValue * 1000) / 1000);
  });

  // TBT approximation: long tasks beyond 50 ms.
  let tbt = 0;
  safeObserve('longtask', (entries) => {
    for (const entry of entries) {
      tbt += Math.max(0, entry.duration - 50);
    }
    record('TBT', tbt);
  });

  // INP approximation: slowest event interaction.
  let inp = 0;
  safeObserve('event', (entries) => {
    for (const entry of entries as Array<PerformanceEntry & { processingStart?: number; processingEnd?: number }>) {
      const duration = entry.duration;
      if (duration > inp) {
        inp = duration;
        record('INP', inp);
      }
    }
  });

  // TTFB + navigation timing.
  window.addEventListener(
    'load',
    () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (navigation) record('TTFB', navigation.responseStart);
    },
    { once: true },
  );
};
