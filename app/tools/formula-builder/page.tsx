'use client';

import { useEffect, useState } from 'react';
import { Hammer, Trash2 } from 'lucide-react';
import {
  createCustomFormula,
  evaluateCustomFormula,
  exportCustomFormulas,
  importCustomFormulas,
  loadCustomFormulas,
  saveCustomFormulas,
  type CustomFormula,
} from '@/lib/custom-formulas';
import { downloadTextFile } from '@/lib/calculation-export';
import { useI18n } from '@/lib/i18n';
import { formatNumber } from '@/lib/utils';

const inputClass = 'h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 font-mono text-on-surface outline-none focus:border-primary';

export default function FormulaBuilderPage() {
  const { lang, numerals } = useI18n();
  const fa = lang !== 'en';
  const [formulas, setFormulas] = useState<CustomFormula[]>([]);
  const [name, setName] = useState(fa ? 'انرژی جنبشی' : 'Kinetic energy');
  const [expression, setExpression] = useState('0.5*m*v^2');
  const [values, setValues] = useState<Record<string, string>>({ m: '2', v: '10' });
  const [error, setError] = useState<string | null>(null);
  const fmt = (value: number) => formatNumber(value, { decimals: 8, lang, numerals });

  useEffect(() => {
    setFormulas(loadCustomFormulas());
  }, []);

  const persist = (next: CustomFormula[]) => {
    setFormulas(next);
    saveCustomFormulas(next);
  };

  const create = () => {
    try {
      const created = createCustomFormula(name, expression);
      persist([created, ...formulas]);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  };

  const run = (formula: CustomFormula): string => {
    try {
      const inputs = Object.fromEntries(formula.variables.map((variable) => [variable, Number(values[variable] ?? 0)]));
      return fmt(evaluateCustomFormula(formula, inputs));
    } catch (caught) {
      return caught instanceof Error ? caught.message : '—';
    }
  };

  return (
    <div className="space-y-5 px-4 pb-8 pt-3">
      <header className="hero-surface p-5">
        <p className="data-pill relative z-10"><Hammer className="h-3.5 w-3.5" aria-hidden="true" />{fa ? 'ابزارها' : 'Tools'}</p>
        <h1 className="relative z-10 mt-2 text-headline-medium font-bold text-on-surface">{fa ? 'سازندهٔ فرمول بدون کد' : 'No-code formula builder'}</h1>
        <p className="relative z-10 mt-1 text-body-medium text-on-surface-variant">
          {fa
            ? 'فرمول خودتان را با یک عبارت امن بسازید، روی دستگاه نگه دارید و به‌صورت JSON با بقیه به اشتراک بگذارید. تعریف مشترک هرگز کد اجرا نمی‌کند؛ عبارت هنگام ورود دوباره اعتبارسنجی می‌شود.'
            : 'Build your own calculator from a safe expression, keep it on-device and share it as JSON. Shared definitions never execute code; expressions are re-validated on import.'}
        </p>
      </header>

      <section className="space-y-3 rounded-3xl border border-outline-variant bg-surface-container p-4">
        <label className="block">
          <span className="mb-1 block text-label-medium text-on-surface-variant">{fa ? 'نام فرمول' : 'Formula name'}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-on-surface outline-none focus:border-primary" />
        </label>
        <label className="block">
          <span className="mb-1 block text-label-medium text-on-surface-variant" dir="ltr">expression (m, v, x…)</span>
          <input value={expression} onChange={(e) => setExpression(e.target.value)} dir="ltr" className={inputClass} />
        </label>
        {error && <p role="alert" className="rounded-xl bg-error-container/50 p-3 text-body-small text-on-surface">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={create} className="min-h-11 rounded-full brand-gradient px-4 font-semibold text-white">
            {fa ? 'ساختن و ذخیره' : 'Create & save'}
          </button>
          <button
            type="button"
            disabled={!formulas.length}
            onClick={() => downloadTextFile(exportCustomFormulas(formulas), 'application/json;charset=utf-8', 'my-formulas.json')}
            className="min-h-11 rounded-full border border-outline-variant px-4 text-on-surface disabled:opacity-50"
          >
            {fa ? 'خروجی JSON همه' : 'Export all as JSON'}
          </button>
          <label className="flex min-h-11 cursor-pointer items-center rounded-full border border-outline-variant px-4 text-on-surface">
            {fa ? 'وارد کردن JSON' : 'Import JSON'}
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                void file.text().then((content) => {
                  try {
                    persist([...importCustomFormulas(content), ...formulas]);
                    setError(null);
                  } catch (caught) {
                    setError(caught instanceof Error ? caught.message : String(caught));
                  }
                });
              }}
            />
          </label>
        </div>
      </section>

      <section className="space-y-3">
        {formulas.map((formula) => (
          <article key={formula.id} className="rounded-3xl border border-outline-variant bg-surface-container p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-title-medium font-semibold text-on-surface">{formula.name}</h2>
                <p className="tnum mt-0.5 font-mono text-body-medium text-on-surface-variant" dir="ltr">{formula.expression}</p>
              </div>
              <button type="button" aria-label={fa ? 'حذف فرمول' : 'Delete formula'} onClick={() => persist(formulas.filter((item) => item.id !== formula.id))} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-error">
                <Trash2 className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {formula.variables.map((variable) => (
                <label key={variable} className="block">
                  <span className="mb-1 block text-label-medium text-on-surface-variant" dir="ltr">{variable}</span>
                  <input
                    value={values[variable] ?? ''}
                    onChange={(event) => setValues((current) => ({ ...current, [variable]: event.target.value }))}
                    dir="ltr"
                    inputMode="decimal"
                    className={inputClass}
                  />
                </label>
              ))}
            </div>
            <p className="tnum mt-3 rounded-xl bg-primary-container/40 p-3 font-mono text-body-large font-semibold text-on-surface" dir="ltr" aria-live="polite">
              = {run(formula)}
            </p>
          </article>
        ))}
        {!formulas.length && (
          <p className="rounded-2xl border border-dashed border-outline-variant p-4 text-center text-body-medium text-on-surface-variant">
            {fa ? 'هنوز فرمولی نساخته‌اید؛ از فرم بالا شروع کنید.' : 'No custom formulas yet — start with the form above.'}
          </p>
        )}
      </section>
    </div>
  );
}
