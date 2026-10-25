'use client';

import { useMemo, useState } from 'react';
import { Activity, Crosshair, Gauge, Ruler, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import type { Formula } from '@/lib/formulas';
import { outputLabel, variableLabel } from '@/lib/formulas';
import type { RawInputs } from '@/lib/validation';
import {
  dimensionLabel,
  dimensionOfUnit,
  mulberry32,
  summarizeSamples,
  verificationCode,
  type SensitivityEntry,
  type UncertaintyResult,
} from '@/lib/advanced-math';
import { downloadTextFile } from '@/lib/calculation-export';
import { useI18n } from '@/lib/i18n';
import { copyToClipboard, formatNumber } from '@/lib/utils';

export interface FormulaAdvancedProps {
  formula: Formula;
  /** Current (prepared) inputs as shown in the form. */
  inputs: RawInputs;
  /** Latest computed outputs, when available. */
  resultValues: Record<string, unknown> | null;
  /** Validate + compute arbitrary inputs without touching history. */
  computeValues: (inputs: RawInputs) => Promise<Record<string, unknown>>;
  /** Apply a solved input set back into the main form. */
  onApplyInputs: (inputs: RawInputs) => void;
}

type Mode = 'inverse' | 'sensitivity' | 'uncertainty' | 'dimensions' | 'verify';

const numericOutputNames = (formula: Formula, values: Record<string, unknown> | null): string[] =>
  formula.outputs
    .map((output) => output.name)
    .filter((name) => values == null || typeof values[name] === 'number');

export function FormulaAdvanced({ formula, inputs, resultValues, computeValues, onApplyInputs }: FormulaAdvancedProps) {
  const { lang, numerals } = useI18n();
  const fa = lang !== 'en';
  const numericVars = useMemo(() => formula.variables.filter((v) => v.type === 'number'), [formula]);
  const outputs = useMemo(() => numericOutputNames(formula, resultValues), [formula, resultValues]);

  const [mode, setMode] = useState<Mode>('inverse');
  const [unknown, setUnknown] = useState<string>(numericVars[0]?.name ?? '');
  const [targetOutput, setTargetOutput] = useState<string>(outputs[0] ?? formula.outputs[0]?.name ?? '');
  const [targetValue, setTargetValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inverseResult, setInverseResult] = useState<{ x: number; achieved: number } | null>(null);
  const [sensitivity, setSensitivity] = useState<SensitivityEntry[] | null>(null);
  const [uncertainties, setUncertainties] = useState<Record<string, string>>({});
  const [uncertainty, setUncertainty] = useState<UncertaintyResult | null>(null);
  const [uncertaintyOutput, setUncertaintyOutput] = useState<string>(outputs[0] ?? '');

  const fmt = (value: number) => formatNumber(value, { decimals: 6, lang, numerals });
  const labelOf = (name: string) => {
    const variable = formula.variables.find((v) => v.name === name);
    if (variable) return variableLabel(variable, lang);
    const output = formula.outputs.find((o) => o.name === name);
    return output ? outputLabel(output, lang) : name;
  };

  const baseNumericInputs = (): Record<string, number> => {
    const base: Record<string, number> = {};
    for (const variable of numericVars) {
      const raw = inputs[variable.name];
      const value = typeof raw === 'number' ? raw : Number(raw);
      if (Number.isFinite(value)) base[variable.name] = value;
    }
    return base;
  };

  const evaluateOutput = async (overrides: Record<string, number>, outputName: string): Promise<number> => {
    const merged: RawInputs = { ...inputs, ...overrides };
    const values = await computeValues(merged);
    const value = values[outputName];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error(fa ? 'خروجی انتخاب‌شده عددی نیست' : 'Selected output is not numeric');
    }
    return value;
  };

  const runInverse = async () => {
    const target = Number(targetValue);
    if (!unknown || !targetOutput || !Number.isFinite(target)) {
      setError(fa ? 'متغیر مجهول، خروجی هدف و مقدار هدف را کامل کنید.' : 'Choose the unknown, target output and a numeric target.');
      return;
    }
    setBusy(true);
    setError(null);
    setInverseResult(null);
    try {
      const base = baseNumericInputs();
      const guess = base[unknown] ?? 1;
      const variable = numericVars.find((v) => v.name === unknown);
      const g = async (x: number) => (await evaluateOutput({ [unknown]: x }, targetOutput)) - target;
      // Expanding probe points, nearest brackets to the guess first.
      const points = new Set<number>([guess, variable?.min ?? 0, 1, 0]);
      for (let scale = 1; scale <= 1e6; scale *= 4) {
        points.add(guess + scale);
        points.add(guess - scale);
      }
      if (variable?.max !== undefined) points.add(variable.max);
      if (variable?.min !== undefined) points.add(variable.min);
      const sorted = [...points]
        .filter((x) => (variable?.min === undefined || x >= variable.min) && (variable?.max === undefined || x <= variable.max))
        .sort((a, b) => a - b);
      const evaluated: Array<{ x: number; y: number }> = [];
      for (const x of sorted) {
        try {
          evaluated.push({ x, y: await g(x) });
        } catch { /* outside domain */ }
      }
      const exact = evaluated.find((point) => Math.abs(point.y) <= 1e-9);
      if (exact) {
        setInverseResult({ x: exact.x, achieved: target });
        return;
      }
      const brackets = evaluated
        .slice(0, -1)
        .map((point, i) => ({ lo: point, hi: evaluated[i + 1] }))
        .filter(({ lo, hi }) => lo.y * hi.y < 0)
        .sort((a, b) => Math.min(Math.abs(a.lo.x - guess), Math.abs(a.hi.x - guess)) - Math.min(Math.abs(b.lo.x - guess), Math.abs(b.hi.x - guess)));
      if (!brackets.length) throw new Error(fa ? 'برای این هدف، بازه‌ای با تغییر علامت پیدا نشد؛ مقدار هدف یا ورودی‌ها را تغییر دهید.' : 'No sign-changing bracket found for this target.');
      let { lo, hi } = brackets[0];
      for (let iteration = 0; iteration < 60; iteration += 1) {
        const mid = (lo.x + hi.x) / 2;
        const y = await g(mid);
        if (Math.abs(y) <= 1e-9) {
          lo = { x: mid, y };
          hi = { x: mid, y };
          break;
        }
        if (lo.y * y < 0) hi = { x: mid, y };
        else lo = { x: mid, y };
      }
      const x = (lo.x + hi.x) / 2;
      const achieved = await evaluateOutput({ [unknown]: x }, targetOutput);
      setInverseResult({ x, achieved });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  };

  const runSensitivity = async () => {
    const outputName = targetOutput || outputs[0];
    if (!outputName) return;
    setBusy(true);
    setError(null);
    try {
      const base = baseNumericInputs();
      const entries: SensitivityEntry[] = [];
      for (const variable of numericVars) {
        const centre = base[variable.name];
        if (centre === undefined) continue;
        const step = centre !== 0 ? Math.abs(centre) * 0.1 : 0.1;
        let low = Number.NaN;
        let high = Number.NaN;
        try { low = await evaluateOutput({ [variable.name]: centre - step }, outputName); } catch { /* domain */ }
        try { high = await evaluateOutput({ [variable.name]: centre + step }, outputName); } catch { /* domain */ }
        entries.push({
          name: variable.name,
          low,
          high,
          relative: 0,
          delta: Number.isFinite(low) && Number.isFinite(high) ? Math.abs(high - low) : Number.NaN,
        });
      }
      const max = Math.max(0, ...entries.map((e) => (Number.isFinite(e.delta) ? e.delta : 0)));
      for (const entry of entries) entry.relative = max > 0 && Number.isFinite(entry.delta) ? entry.delta / max : 0;
      entries.sort((a, b) => (b.delta || 0) - (a.delta || 0));
      setSensitivity(entries);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  };

  const runUncertainty = async () => {
    const outputName = uncertaintyOutput || targetOutput || outputs[0];
    if (!outputName) return;
    setBusy(true);
    setError(null);
    try {
      const base = baseNumericInputs();
      const active = Object.fromEntries(
        Object.entries(uncertainties).filter(([, value]) => Number(value) > 0).map(([k, v]) => [k, Number(v)]),
      );
      if (!Object.keys(active).length) throw new Error(fa ? 'برای حداقل یک ورودی عدم‌قطعیت (±) وارد کنید.' : 'Enter an uncertainty (±) for at least one input.');
      const rng = mulberry32(42);
      const samples: number[] = [];
      for (let i = 0; i < 80; i += 1) {
        const overrides: Record<string, number> = {};
        for (const [name, halfWidth] of Object.entries(active)) {
          overrides[name] = (base[name] ?? 0) + (rng() * 2 - 1) * halfWidth;
        }
        try {
          samples.push(await evaluateOutput(overrides, outputName));
        } catch { /* sample outside domain */ }
      }
      setUncertainty(summarizeSamples(samples));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  };

  const verifyRecord = useMemo(
    () => ({ formula_id: formula.id, version: formula.version, inputs, outputs: resultValues }),
    [formula.id, formula.version, inputs, resultValues],
  );
  const code = verificationCode(verifyRecord);

  const exportPython = () => {
    const script = [
      '# SolveEverything reproducible calculation record',
      `record = ${JSON.stringify(verifyRecord, null, 2)}`,
      `verification = "${code}"`,
      'print(record)',
      '',
    ].join('\n');
    downloadTextFile(script, 'text/x-python;charset=utf-8', `solveeverything-${formula.id}.py`);
  };

  const modes: Array<{ id: Mode; icon: typeof Crosshair; fa: string; en: string }> = [
    { id: 'inverse', icon: Crosshair, fa: 'حل معکوس', en: 'Inverse solve' },
    { id: 'sensitivity', icon: Gauge, fa: 'حساسیت', en: 'Sensitivity' },
    { id: 'uncertainty', icon: Activity, fa: 'عدم‌قطعیت', en: 'Uncertainty' },
    { id: 'dimensions', icon: Ruler, fa: 'ابعاد', en: 'Dimensions' },
    { id: 'verify', icon: ShieldCheck, fa: 'راستی‌آزمایی', en: 'Verify' },
  ];

  const selectClass = 'h-11 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-body-medium text-on-surface outline-none focus:border-primary';
  const inputClass = 'h-11 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 font-mono text-body-medium text-on-surface outline-none focus:border-primary';

  return (
    <section className="mt-4 rounded-3xl border border-outline-variant bg-surface-container p-4" aria-label={fa ? 'ابزارهای پیشرفته فرمول' : 'Advanced formula tools'}>
      <h3 className="flex items-center gap-2 text-title-medium font-semibold text-on-surface">
        <SlidersHorizontal className="h-5 w-5 text-primary" aria-hidden="true" />
        {fa ? 'آزمایشگاه پیشرفتهٔ این فرمول' : 'Advanced lab for this formula'}
      </h3>
      <p className="mt-1 text-body-small text-on-surface-variant">
        {fa
          ? 'هر متغیری را مجهول کنید، اثر هر ورودی را بسنجید و عدم‌قطعیت را تا جواب دنبال کنید — همه روی همین دستگاه.'
          : 'Solve for any variable, rank input influence and propagate uncertainty — entirely on-device.'}
      </p>

      <div className="chip-rail mt-3" role="tablist" aria-label={fa ? 'حالت پیشرفته' : 'Advanced mode'}>
        {modes.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={mode === item.id}
              onClick={() => setMode(item.id)}
              className={`flex min-h-10 items-center gap-1.5 rounded-full px-3 text-label-large ${mode === item.id ? 'brand-gradient font-semibold text-white' : 'bg-surface-container-high text-on-surface-variant'}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {fa ? item.fa : item.en}
            </button>
          );
        })}
      </div>

      {error && <p role="alert" className="mt-3 rounded-xl bg-error-container/50 p-3 text-body-small text-on-surface">{error}</p>}

      {mode === 'inverse' && (
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-label-medium text-on-surface-variant">{fa ? 'متغیر مجهول' : 'Unknown variable'}</span>
            <select value={unknown} onChange={(e) => setUnknown(e.target.value)} className={selectClass}>
              {numericVars.map((v) => <option key={v.name} value={v.name}>{labelOf(v.name)}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-label-medium text-on-surface-variant">{fa ? 'خروجی هدف' : 'Target output'}</span>
            <select value={targetOutput} onChange={(e) => setTargetOutput(e.target.value)} className={selectClass}>
              {(outputs.length ? outputs : formula.outputs.map((o) => o.name)).map((name) => <option key={name} value={name}>{labelOf(name)}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-label-medium text-on-surface-variant">{fa ? 'مقدار هدف' : 'Target value'}</span>
            <input value={targetValue} onChange={(e) => setTargetValue(e.target.value)} inputMode="decimal" dir="ltr" className={inputClass} placeholder="100" />
          </label>
          <button type="button" disabled={busy} onClick={() => void runInverse()} className="min-h-11 rounded-full brand-gradient px-4 font-semibold text-white disabled:opacity-50 sm:col-span-3">
            {busy ? '…' : fa ? 'پیدا کردن مقدار مجهول' : 'Solve for the unknown'}
          </button>
          {inverseResult && (
            <div className="rounded-xl bg-primary-container/40 p-3 sm:col-span-3" aria-live="polite">
              <p className="tnum text-body-medium text-on-surface" dir="ltr">
                {unknown} = {fmt(inverseResult.x)} → {targetOutput} = {fmt(inverseResult.achieved)}
              </p>
              <button type="button" onClick={() => onApplyInputs({ ...inputs, [unknown]: inverseResult.x })} className="mt-2 min-h-10 rounded-full border border-outline-variant px-3 text-label-large text-on-surface">
                {fa ? 'اعمال در فرم اصلی' : 'Apply to the main form'}
              </button>
            </div>
          )}
        </div>
      )}

      {mode === 'sensitivity' && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <label className="block min-w-52 flex-1">
              <span className="mb-1 block text-label-medium text-on-surface-variant">{fa ? 'خروجی' : 'Output'}</span>
              <select value={targetOutput} onChange={(e) => setTargetOutput(e.target.value)} className={selectClass}>
                {(outputs.length ? outputs : formula.outputs.map((o) => o.name)).map((name) => <option key={name} value={name}>{labelOf(name)}</option>)}
              </select>
            </label>
            <button type="button" disabled={busy} onClick={() => void runSensitivity()} className="min-h-11 rounded-full brand-gradient px-4 font-semibold text-white disabled:opacity-50">
              {fa ? 'تحلیل ±۱۰٪' : 'Analyse ±10%'}
            </button>
          </div>
          {sensitivity && (
            <ul className="space-y-2">
              {sensitivity.map((entry) => (
                <li key={entry.name} className="rounded-xl bg-surface-container-high/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-body-medium font-medium text-on-surface">{labelOf(entry.name)}</span>
                    <span className="tnum text-label-medium text-on-surface-variant" dir="ltr">Δ {Number.isFinite(entry.delta) ? fmt(entry.delta) : '—'}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-container-lowest" dir="ltr">
                    <div className="h-full brand-gradient" style={{ width: `${Math.round(entry.relative * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {mode === 'uncertainty' && (
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="mb-1 block text-label-medium text-on-surface-variant">{fa ? 'خروجی' : 'Output'}</span>
            <select value={uncertaintyOutput || targetOutput} onChange={(e) => setUncertaintyOutput(e.target.value)} className={selectClass}>
              {(outputs.length ? outputs : formula.outputs.map((o) => o.name)).map((name) => <option key={name} value={name}>{labelOf(name)}</option>)}
            </select>
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {numericVars.map((variable) => (
              <label key={variable.name} className="block">
                <span className="mb-1 block text-label-medium text-on-surface-variant">± {labelOf(variable.name)}</span>
                <input
                  value={uncertainties[variable.name] ?? ''}
                  onChange={(e) => setUncertainties((current) => ({ ...current, [variable.name]: e.target.value }))}
                  inputMode="decimal" dir="ltr" className={inputClass} placeholder="0"
                />
              </label>
            ))}
          </div>
          <button type="button" disabled={busy} onClick={() => void runUncertainty()} className="min-h-11 rounded-full brand-gradient px-4 font-semibold text-white disabled:opacity-50">
            {fa ? 'اجرای مونت‌کارلو (۸۰ نمونه، بذر ثابت)' : 'Run Monte-Carlo (80 samples, fixed seed)'}
          </button>
          {uncertainty && (
            <div className="space-y-2" aria-live="polite">
              <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  [fa ? 'میانگین' : 'Mean', uncertainty.mean],
                  ['σ', uncertainty.std],
                  ['P5', uncertainty.p5],
                  ['P95', uncertainty.p95],
                ].map(([label, value]) => (
                  <div key={label as string} className="rounded-xl bg-surface-container-high/70 p-3">
                    <dt className="text-label-small text-on-surface-variant">{label}</dt>
                    <dd className="tnum mt-0.5 font-semibold text-on-surface" dir="ltr">{fmt(value as number)}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex h-24 items-end gap-1 rounded-xl bg-surface-container-high/50 p-3" dir="ltr" aria-hidden="true">
                {uncertainty.histogram.map((bin, index) => {
                  const max = Math.max(...uncertainty.histogram.map((b) => b.count), 1);
                  return <div key={index} className="flex-1 rounded-t bg-primary/70" style={{ height: `${Math.max(4, (bin.count / max) * 100)}%` }} title={`${bin.count}`} />;
                })}
              </div>
              <p className="text-body-small text-on-surface-variant">{uncertainty.samples} {fa ? 'نمونهٔ معتبر' : 'valid samples'}</p>
            </div>
          )}
        </div>
      )}

      {mode === 'dimensions' && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <h4 className="text-label-large font-semibold text-on-surface">{fa ? 'ورودی‌ها' : 'Inputs'}</h4>
            <ul className="mt-1 space-y-1">
              {formula.variables.map((variable) => (
                <li key={variable.name} className="flex items-center justify-between rounded-lg bg-surface-container-high/60 px-3 py-2 text-body-small">
                  <span>{labelOf(variable.name)}</span>
                  <span className="tnum font-mono" dir="ltr">{variable.unit ?? '—'} · {dimensionLabel(dimensionOfUnit(variable.unit))}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-label-large font-semibold text-on-surface">{fa ? 'خروجی‌ها' : 'Outputs'}</h4>
            <ul className="mt-1 space-y-1">
              {formula.outputs.map((output) => (
                <li key={output.name} className="flex items-center justify-between rounded-lg bg-surface-container-high/60 px-3 py-2 text-body-small">
                  <span>{labelOf(output.name)}</span>
                  <span className="tnum font-mono" dir="ltr">{output.unit ?? '—'} · {dimensionLabel(dimensionOfUnit(output.unit))}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-body-small text-on-surface-variant sm:col-span-2">
            {fa ? '«—» یعنی برای آن یکا بُعد استاندارد ثبت نشده است؛ این نما از ورود واحد ناسازگار جلوگیری نمی‌کند، آن را آشکار می‌کند.' : '“—” means no standard dimension is registered for that unit; this view exposes dimensions rather than blocking input.'}
          </p>
        </div>
      )}

      {mode === 'verify' && (
        <div className="mt-3 space-y-3">
          <p className="text-body-medium text-on-surface-variant">
            {fa ? 'کد راستی‌آزمایی این محاسبه (ورودی + خروجی + نسخهٔ فرمول):' : 'Verification code for this calculation (inputs + outputs + formula version):'}
          </p>
          <p className="tnum rounded-xl bg-surface-container-high/70 p-3 text-center font-mono text-title-medium font-bold tracking-widest text-on-surface" dir="ltr">{code}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={exportPython} className="min-h-10 rounded-full border border-outline-variant px-3 text-label-large text-on-surface">
              {fa ? 'دریافت اسکریپت Python بازتولید' : 'Download Python reproduction script'}
            </button>
            <button
              type="button"
              onClick={() => {
                const front = `${formula.name_en}: ${Object.entries(inputs).map(([k, v]) => `${k}=${String(v)}`).join(', ')}`;
                const back = resultValues
                  ? `${Object.entries(resultValues).map(([k, v]) => `${k}=${String(v)}`).join('<br>')}`
                  : '';
                downloadTextFile(`${front}\t${back}\n`, 'text/tab-separated-values;charset=utf-8', `anki-${formula.id}.tsv`);
              }}
              className="min-h-10 rounded-full border border-outline-variant px-3 text-label-large text-on-surface"
            >
              {fa ? 'فلش‌کارت Anki' : 'Anki flashcard'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window === 'undefined') return;
                const snippet = `<iframe src="${window.location.href}" width="100%" height="640" style="border:1px solid #ddd;border-radius:16px" loading="lazy" title="SolveEverything calculator"></iframe>`;
                void copyToClipboard(snippet);
              }}
              className="min-h-10 rounded-full border border-outline-variant px-3 text-label-large text-on-surface"
            >
              {fa ? 'کپی کد Embed برای سایت شما' : 'Copy embed code for your site'}
            </button>
          </div>
          <p className="text-body-small text-on-surface-variant">
            {fa ? 'وضعیت بازبینی علمی این فرمول بالای صفحه جداگانه اعلام شده است؛ این کد اصالت محاسبه را نشان می‌دهد، نه تأیید علمی مستقل را.' : 'Scientific review status is declared separately at the top; this code fingerprints the calculation, it is not independent scientific endorsement.'}
          </p>
        </div>
      )}
    </section>
  );
}
