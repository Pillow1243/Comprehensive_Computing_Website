'use client';

import { useMemo, useState } from 'react';
import { FlaskConical, Info } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { analyzeFormula, type FormulaAnalysis } from '@/lib/chemistry';
import { formatNumber } from '@/lib/utils';

const EXAMPLES = ['H2O', 'Ca(OH)2', 'Fe2(SO4)3', 'CuSO4·5H2O', 'C6H12O6', 'NaHCO3'];

export default function MolarMassPage() {
  const { t, lang } = useI18n();
  const [raw, setRaw] = useState('Ca(OH)2');

  const analysis = useMemo<{ data?: FormulaAnalysis; error?: string }>(() => {
    try {
      return { data: analyzeFormula(raw) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : t('invalidFormula') };
    }
  }, [raw, t]);

  return (
    <div className="space-y-5 px-4 pb-8 pt-3">
      <section className="hero-surface p-4">
        <label className="block">
          <span className="mb-1 block text-label-medium text-on-surface-variant">{t('formula')}</span>
          <input
            type="text"
            dir="ltr"
            value={raw}
            onChange={(event) => setRaw(event.target.value)}
            placeholder={t('formulaPlaceholder')}
            aria-label={t('formula')}
            aria-invalid={Boolean(analysis.error)}
            spellCheck={false}
            autoComplete="off"
            className="mono-result h-14 w-full rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 text-title-large text-on-surface outline-none focus:border-primary"
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setRaw(example)}
              className="mono-result rounded-full border border-outline-variant bg-surface-container px-2.5 py-1 text-label-small text-on-surface-variant"
            >
              {example}
            </button>
          ))}
        </div>
      </section>

      {analysis.error ? (
        <p role="alert" className="rounded-2xl border border-error/40 bg-error-container/60 px-4 py-3 text-body-medium text-on-error-container">
          {lang === 'fa' ? analysis.error : t('invalidFormula')}
        </p>
      ) : analysis.data ? (
        <>
          <section className="rounded-2xl border border-outline-variant bg-surface-container p-4" aria-live="polite">
            <p className="flex items-center gap-1.5 text-label-medium text-on-surface-variant">
              <FlaskConical className="h-4 w-4" aria-hidden="true" />
              {t('molarMass')}
            </p>
            <p className="mono-result mt-1 text-display-small font-bold text-primary">
              {formatNumber(analysis.data.molarMass, { decimals: 4, lang })}
              <span className="ms-1 text-title-medium font-medium text-on-surface-variant">g/mol</span>
            </p>
            <p className="mono-result text-body-medium text-on-surface-variant" dir="ltr">
              {analysis.data.formula}
            </p>
          </section>

          <section aria-labelledby="composition-heading" className="space-y-2">
            <h2 id="composition-heading" className="text-title-medium font-semibold text-on-surface">
              {t('percentComposition')}
            </h2>
            <ul className="space-y-2">
              {analysis.data.entries.map((entry) => (
                <li key={entry.element.symbol} className="rounded-2xl border border-outline-variant bg-surface-container p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-body-large font-medium text-on-surface">
                      <span className="mono-result" dir="ltr">
                        {entry.element.symbol}
                      </span>
                      <span className="ms-2 text-body-small text-on-surface-variant">
                        {lang === 'fa' ? entry.element.nameFa : entry.element.nameEn}
                      </span>
                    </span>
                    <span className="mono-result text-body-medium font-semibold text-on-surface">
                      {formatNumber(entry.percent, { decimals: 3, lang })}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-container-highest">
                    <div
                      className="h-full rounded-full brand-gradient"
                      style={{ inlineSize: `${Math.min(100, entry.percent)}%` }}
                    />
                  </div>
                  <p className="mt-1 flex justify-between text-label-small text-on-surface-variant">
                    <span>×{entry.count}</span>
                    <span className="mono-result">
                      {formatNumber(entry.mass, { decimals: 3, lang })} g/mol
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <p className="flex items-start gap-1.5 text-body-small text-on-surface-variant">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t('compositionHint')}
          </p>
        </>
      ) : null}
    </div>
  );
}
