'use client';

import { CheckCircle2, Pause, Play, RotateCcw, StepBack, StepForward } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { outputLabel, type Formula } from '@/lib/formulas';
import { humanizeOutput } from '@/lib/output-labels';
import { useEffect, useRef, useState } from 'react';

export function StepByStep({ steps }: { steps: string[] }) {
  const { t, dir, lang } = useI18n();
  const [visibleCount, setVisibleCount] = useState(steps.length);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setVisibleCount(steps.length);
    setPlaying(false);
  }, [steps]);

  useEffect(() => {
    if (!playing) return;
    if (visibleCount >= steps.length) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => setVisibleCount((count) => Math.min(steps.length, count + 1)), 900);
    return () => clearTimeout(timer);
  }, [playing, visibleCount, steps.length]);

  if (!steps.length) {
    return <p className="px-1 py-6 text-body-medium text-on-surface-variant">{t('noSteps')}</p>;
  }
  const current = Math.max(1, Math.min(visibleCount, steps.length));
  const fa = lang !== 'en';
  return (
    <div>
      <div className="mb-3 rounded-2xl border border-outline-variant bg-surface-container p-3" aria-label={fa ? 'دیباگر گام‌ها' : 'Step debugger'}>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => { if (playing) { setPlaying(false); return; } if (visibleCount >= steps.length) setVisibleCount(1); setPlaying(true); }} className="flex min-h-10 items-center gap-1.5 rounded-full bg-primary-container px-3 text-label-large text-on-primary-container">
            {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
            {playing ? (fa ? 'توقف' : 'Pause') : (fa ? 'پخش گام‌به‌گام' : 'Play steps')}
          </button>
          <button type="button" aria-label={fa ? 'گام قبل' : 'Previous step'} onClick={() => { setPlaying(false); setVisibleCount((c) => Math.max(1, c - 1)); }} className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant"><StepBack className="h-4.5 w-4.5 rtl:rotate-180" aria-hidden="true" /></button>
          <button type="button" aria-label={fa ? 'گام بعد' : 'Next step'} onClick={() => { setPlaying(false); setVisibleCount((c) => Math.min(steps.length, c + 1)); }} className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant"><StepForward className="h-4.5 w-4.5 rtl:rotate-180" aria-hidden="true" /></button>
          <button type="button" aria-label={fa ? 'نمایش همه' : 'Show all'} onClick={() => { setPlaying(false); setVisibleCount(steps.length); }} className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant"><RotateCcw className="h-4.5 w-4.5" aria-hidden="true" /></button>
          <span className="tnum text-label-medium text-on-surface-variant">{current} / {steps.length}</span>
        </div>
        <input type="range" min={1} max={steps.length} value={current} onChange={(event) => { setPlaying(false); setVisibleCount(Number(event.target.value)); }} aria-label={fa ? 'اسلایدر گام‌ها' : 'Step slider'} className="mt-2 w-full accent-primary" dir="ltr" />
      </div>
    <ol className="space-y-2.5" aria-label={t('stepsTitle')}>
      {steps.slice(0, visibleCount).map((step, index) => (
        <li
          key={`${index}-${step.slice(0, 12)}`}
          style={{ animationDelay: `${Math.min(index * 60, 400)}ms` }}
          className={cn('anim-fade-up flex gap-3 rounded-xl border bg-surface-container p-3.5', index === visibleCount - 1 && visibleCount < steps.length ? 'border-primary ring-1 ring-primary' : 'border-outline-variant')}
        >
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-container text-label-small font-bold text-on-primary-container"
          >
            {index + 1}
          </span>
          <p
            dir={/^[\\A-Za-z0-9\s()[\]{}^*/+\-=.,:;<>±√∫∑∏!|·×÷≤≥≠∞πΔθλμσΩ%]+$/.test(step) ? 'ltr' : dir}
            className={cn(
              'min-w-0 flex-1 whitespace-pre-wrap break-words text-body-medium leading-6 text-on-surface',
              '[unicode-bidi:plaintext]',
            )}
          >
            {step}
          </p>
        </li>
      ))}
    </ol>
    </div>
  );
}

export function ResultPanel({
  formula,
  values,
  durationMs,
}: {
  formula: Formula;
  values: Record<string, unknown>;
  durationMs?: number;
}) {
  const { t, lang, dir } = useI18n();
  const liveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    liveRef.current?.focus();
  }, [values]);

  const entries = Object.entries(values);

  return (
    <section aria-label={t('results')} className="rounded-2xl border border-primary/35 bg-primary-container/25 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-title-small font-semibold text-on-surface">
          <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
          {t('results')}
        </h3>
        {durationMs !== undefined && (
          <span className="tnum text-label-small text-on-surface-variant">
            {t('computedIn')}: {formatNumber(Math.round(durationMs), { decimals: 0, lang })} {t('milliseconds')}
          </span>
        )}
      </div>
      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {entries.map(([key, value]) => {
          const output = formula.outputs.find((candidate) => candidate.name === key);
          const label = humanizeOutput(key, output ? outputLabel(output, lang) : undefined, lang);
          const display =
            typeof value === 'number'
              ? formatNumber(value, { decimals: 6, lang })
              : typeof value === 'boolean'
                ? value
                  ? '✓'
                  : '✗'
                : String(value ?? '—');
          return (
            <div
              key={key}
              className="rounded-lg bg-surface-container-high/80 px-3 py-2"
              dir={typeof value === 'number' ? 'ltr' : dir}
            >
              <dt className="text-label-small text-on-surface-variant">{label}</dt>
              <dd className="tnum mt-0.5 break-words font-latin text-body-large font-medium text-on-surface">
                {display}
                {output?.unit && <span className="ms-1 text-body-small text-on-surface-variant">{output.unit}</span>}
              </dd>
            </div>
          );
        })}
      </dl>
      <div ref={liveRef} tabIndex={-1} aria-live="polite" className="sr-only">
        {entries
          .map(([key, value]) => `${key}: ${typeof value === 'number' ? formatNumber(value, { decimals: 4, lang }) : String(value)}`)
          .join(', ')}
      </div>
    </section>
  );
}
