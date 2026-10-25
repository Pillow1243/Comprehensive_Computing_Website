'use client';

import { CheckCircle2 } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { outputLabel, type Formula } from '@/lib/formulas';
import { humanizeOutput } from '@/lib/output-labels';
import { useEffect, useRef } from 'react';

export function StepByStep({ steps }: { steps: string[] }) {
  const { t, dir } = useI18n();
  if (!steps.length) {
    return <p className="px-1 py-6 text-body-medium text-on-surface-variant">{t('noSteps')}</p>;
  }
  return (
    <ol className="space-y-2.5" aria-label={t('stepsTitle')}>
      {steps.map((step, index) => (
        <li
          key={`${index}-${step.slice(0, 12)}`}
          style={{ animationDelay: `${Math.min(index * 60, 400)}ms` }}
          className="anim-fade-up flex gap-3 rounded-xl border border-outline-variant bg-surface-container p-3.5"
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
