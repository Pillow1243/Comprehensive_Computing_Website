'use client';

import { useMemo, useState } from 'react';
import { Sigma } from 'lucide-react';
import { symbolicAnalysis, solveInverse, integrateOde } from '@/lib/advanced-math';
import { evaluateExpression, derivativeAt, findRoots, integrateRange } from '@/lib/expression';
import { useI18n } from '@/lib/i18n';
import { formatNumber } from '@/lib/utils';

const inputClass = 'h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 font-mono text-on-surface outline-none focus:border-primary';

export default function CasPage() {
  const { lang, numerals } = useI18n();
  const fa = lang !== 'en';
  const [expr, setExpr] = useState('x^3 - 2*x + sin(x)');
  const [point, setPoint] = useState('1');
  const [target, setTarget] = useState('0');
  const [range, setRange] = useState('0, 2');
  const [odeExpr, setOdeExpr] = useState('-y + sin(x)');
  const fmt = (value: number) => formatNumber(value, { decimals: 8, lang, numerals });

  const analysis = useMemo(() => {
    try {
      const at = Number(point);
      const symbolic = symbolicAnalysis(expr, Number.isFinite(at) ? at : undefined);
      const [a, b] = range.split(',').map((part) => Number(part.trim()));
      const roots = findRoots(expr, -10, 10);
      const targetValue = Number(target);
      const inverse = Number.isFinite(targetValue)
        ? solveInverse((x) => evaluateExpression(expr, { x }), targetValue, { guess: Number.isFinite(at) ? at : 1 })
        : null;
      return {
        ok: true as const,
        symbolic,
        numericDerivative: Number.isFinite(at) ? derivativeAt(expr, at) : Number.NaN,
        integral: Number.isFinite(a) && Number.isFinite(b) ? integrateRange(expr, a, b) : Number.NaN,
        roots,
        inverse,
      };
    } catch (error) {
      return { ok: false as const, message: error instanceof Error ? error.message : String(error) };
    }
  }, [expr, point, range, target]);

  const odeResult = useMemo(() => {
    try {
      return { points: integrateOde(odeExpr, 0, 1, 3, 60), error: null as string | null };
    } catch (error) {
      return { points: [], error: error instanceof Error ? error.message : String(error) };
    }
  }, [odeExpr]);
  const ode = odeResult.points;
  const odeError = odeResult.error;

  const signIntervals = useMemo(() => {
    if (!analysis.ok) return [];
    const intervals: Array<{ from: number; to: number; sign: string }> = [];
    const edges = [-10, ...analysis.roots.filter((r) => r > -10 && r < 10), 10];
    for (let i = 0; i + 1 < edges.length; i += 1) {
      const mid = (edges[i] + edges[i + 1]) / 2;
      try {
        const value = evaluateExpression(expr, { x: mid });
        intervals.push({ from: edges[i], to: edges[i + 1], sign: value > 0 ? 'f(x) > 0' : value < 0 ? 'f(x) < 0' : 'f(x) = 0' });
      } catch { /* singularity inside the interval */ }
    }
    return intervals;
  }, [analysis, expr]);

  return (
    <div className="space-y-5 px-4 pb-8 pt-3">
      <header className="hero-surface p-5">
        <p className="data-pill relative z-10"><Sigma className="h-3.5 w-3.5" aria-hidden="true" />{fa ? 'ابزارها' : 'Tools'}</p>
        <h1 className="relative z-10 mt-2 text-headline-medium font-bold text-on-surface">{fa ? 'ماشین‌حساب نمادی (CAS)' : 'Symbolic calculator (CAS)'}</h1>
        <p className="relative z-10 mt-1 text-body-medium text-on-surface-variant">
          {fa ? 'هر عبارتی را بنویسید: مشتق و انتگرال نمادی، حل f(x)=هدف، ناحیه علامت و حل عددی معادله دیفرانسیل — بدون سرور.' : 'Type any expression: symbolic derivative/integral, f(x)=target solving, sign chart and numeric ODE solving — no server.'}
        </p>
      </header>

      <section className="space-y-3 rounded-3xl border border-outline-variant bg-surface-container p-4">
        <label className="block">
          <span className="mb-1 block text-label-medium text-on-surface-variant" dir="ltr">f(x) =</span>
          <input value={expr} onChange={(e) => setExpr(e.target.value)} dir="ltr" className={inputClass} aria-label="f(x)" />
        </label>
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-label-medium text-on-surface-variant">{fa ? 'نقطه x₀' : 'Point x₀'}</span>
            <input value={point} onChange={(e) => setPoint(e.target.value)} dir="ltr" inputMode="decimal" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-label-medium text-on-surface-variant">{fa ? 'حل f(x) =' : 'Solve f(x) ='}</span>
            <input value={target} onChange={(e) => setTarget(e.target.value)} dir="ltr" inputMode="decimal" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-label-medium text-on-surface-variant">{fa ? 'بازه انتگرال (a, b)' : 'Integral range (a, b)'}</span>
            <input value={range} onChange={(e) => setRange(e.target.value)} dir="ltr" className={inputClass} />
          </label>
        </div>

        {!analysis.ok && <p role="alert" className="rounded-xl bg-error-container/50 p-3 text-body-small text-on-surface">{analysis.message}</p>}

        {analysis.ok && (
          <dl className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl bg-surface-container-high/70 p-3">
              <dt className="text-label-medium text-on-surface-variant">{fa ? 'مشتق نمادی f′(x)' : 'Symbolic derivative f′(x)'}</dt>
              <dd className="tnum mt-1 break-all font-mono text-body-large font-semibold text-on-surface" dir="ltr">{analysis.symbolic.derivative}</dd>
            </div>
            <div className="rounded-xl bg-surface-container-high/70 p-3">
              <dt className="text-label-medium text-on-surface-variant">{fa ? 'پادمشتق نمادی (در صورت وجود فرم بسته)' : 'Symbolic antiderivative (when a closed form exists)'}</dt>
              <dd className="tnum mt-1 break-all font-mono text-body-large font-semibold text-on-surface" dir="ltr">{analysis.symbolic.antiderivative ? `${analysis.symbolic.antiderivative} + C` : '—'}</dd>
            </div>
            <div className="rounded-xl bg-surface-container-high/70 p-3">
              <dt className="text-label-medium text-on-surface-variant">f(x₀) · f′(x₀)</dt>
              <dd className="tnum mt-1 font-mono text-body-large font-semibold text-on-surface" dir="ltr">
                {(() => { try { return fmt(evaluateExpression(expr, { x: Number(point) })); } catch { return '—'; } })()} · {Number.isFinite(analysis.numericDerivative) ? fmt(analysis.numericDerivative) : '—'}
              </dd>
            </div>
            <div className="rounded-xl bg-surface-container-high/70 p-3">
              <dt className="text-label-medium text-on-surface-variant">{fa ? 'انتگرال معین در بازه' : 'Definite integral on the range'}</dt>
              <dd className="tnum mt-1 font-mono text-body-large font-semibold text-on-surface" dir="ltr">{Number.isFinite(analysis.integral) ? fmt(analysis.integral) : '—'}</dd>
            </div>
            <div className="rounded-xl bg-surface-container-high/70 p-3">
              <dt className="text-label-medium text-on-surface-variant">{fa ? 'ریشه‌ها در [−۱۰، ۱۰]' : 'Roots in [−10, 10]'}</dt>
              <dd className="tnum mt-1 font-mono text-body-medium font-semibold text-on-surface" dir="ltr">{analysis.roots.length ? analysis.roots.map(fmt).join(' · ') : '—'}</dd>
            </div>
            <div className="rounded-xl bg-surface-container-high/70 p-3">
              <dt className="text-label-medium text-on-surface-variant">{fa ? 'حل f(x) = هدف (نزدیک x₀)' : 'Solution of f(x) = target (near x₀)'}</dt>
              <dd className="tnum mt-1 font-mono text-body-large font-semibold text-on-surface" dir="ltr">{analysis.inverse ? `x ≈ ${fmt(analysis.inverse.x)}` : '—'}</dd>
            </div>
          </dl>
        )}

        {signIntervals.length > 0 && (
          <div>
            <h2 className="text-title-small font-semibold text-on-surface">{fa ? 'جدول علامت' : 'Sign chart'}</h2>
            <div className="mt-2 flex flex-wrap gap-1.5" dir="ltr">
              {signIntervals.map((interval, index) => (
                <span key={index} className="tnum rounded-full bg-surface-container-high px-2.5 py-1 font-mono text-label-small text-on-surface">
                  ({fmt(interval.from)}, {fmt(interval.to)}): {interval.sign}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-3xl border border-outline-variant bg-surface-container p-4">
        <h2 className="text-title-medium font-semibold text-on-surface">{fa ? 'حل معادله دیفرانسیل y′ = f(x, y)' : 'ODE solver y′ = f(x, y)'}</h2>
        <label className="block">
          <span className="mb-1 block text-label-medium text-on-surface-variant" dir="ltr">y′ =</span>
          <input value={odeExpr} onChange={(e) => setOdeExpr(e.target.value)} dir="ltr" className={inputClass} aria-label="y prime" />
        </label>
        <p className="text-body-small text-on-surface-variant">{fa ? 'شرط اولیه: y(0)=1، روش رونگه–کوتای مرتبه ۴ تا x=3 در ۶۰ گام.' : 'Initial condition y(0)=1, classic RK4 to x=3 in 60 steps.'}</p>
        {odeError && <p role="alert" className="rounded-xl bg-error-container/50 p-3 text-body-small text-on-surface">{odeError}</p>}
        {ode.length > 0 && (
          <p className="tnum rounded-xl bg-primary-container/40 p-3 font-mono text-body-large font-semibold text-on-surface" dir="ltr">
            y(3) ≈ {fmt(ode[ode.length - 1].y)}
          </p>
        )}
        {ode.length > 0 && (
          <div className="grid grid-cols-5 gap-1" dir="ltr" aria-hidden="true">
            {ode.filter((_, i) => i % 6 === 0).map((pointValue, index) => {
              const ys = ode.map((p) => p.y);
              const min = Math.min(...ys);
              const max = Math.max(...ys);
              const height = max > min ? 12 + ((pointValue.y - min) / (max - min)) * 68 : 40;
              return (
                <div key={index} className="flex h-24 items-end rounded bg-surface-container-high/50 p-1">
                  <div className="w-full rounded-t bg-primary/70" style={{ height: `${height}%` }} title={`x=${pointValue.x.toFixed(1)}, y=${pointValue.y.toFixed(3)}`} />
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
