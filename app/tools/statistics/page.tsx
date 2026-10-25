'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { Chip } from '@/components/ui/chip';
import { useI18n } from '@/lib/i18n';
import {
  descriptiveStats,
  histogramBins,
  linearRegression,
  parseDataset,
} from '@/lib/data-lab';
import { formatNumber } from '@/lib/utils';
import { welchTTest, oneSampleTTest, oneWayAnova, chiSquareIndependence, multipleRegression, type TTestResult, type AnovaResult, type ChiSquareResult } from '@/lib/stats-inference';

const SAMPLE_SERIES = '12, 15, 14, 18, 22, 19, 25, 21, 17, 16, 20, 24, 28, 23, 19, 15, 18, 26, 30, 22, 18, 14, 17, 21, 19, 23, 27, 24, 20, 16';
const SAMPLE_PAIRS = '1, 3\n2, 5\n3, 6\n4, 9\n5, 11\n6, 12\n7, 15\n8, 16\n9, 19\n10, 21';

export default function StatisticsPage() {
  const { t, lang, numerals } = useI18n();
  const [text, setText] = useState('');
  const [predictX, setPredictX] = useState('12');
  const fa = lang !== 'en';
  const [mu0, setMu0] = useState('0');
  const [groupA, setGroupA] = useState('12, 15, 14, 18, 22, 19');
  const [groupB, setGroupB] = useState('9, 11, 13, 10, 14, 12');
  const [anovaText, setAnovaText] = useState('1, 2, 3, 4\n5, 6, 7, 8\n9, 10, 11, 12');
  const [chiText, setChiText] = useState('10, 20\n20, 10');
  const [inference, setInference] = useState<{ one?: TTestResult; welch?: TTestResult; anova?: AnovaResult; chi?: ChiSquareResult; multi?: { coefficients: number[]; rSquared: number }; error?: string } | null>(null);

  const parseNumbers = (value: string) => value.split(/[\s,;،]+/).map(Number).filter(Number.isFinite);
  const runInference = () => {
    try {
      const one = dataset.values.length >= 2 ? oneSampleTTest(dataset.values, Number(mu0) || 0) : undefined;
      const a = parseNumbers(groupA);
      const b = parseNumbers(groupB);
      const welch = a.length >= 2 && b.length >= 2 ? welchTTest(a, b) : undefined;
      const groups = anovaText.split(/\n+/).map(parseNumbers).filter((group) => group.length >= 2);
      const anova = groups.length >= 2 ? oneWayAnova(groups) : undefined;
      const table = chiText.split(/\n+/).map((line) => parseNumbers(line)).filter((row) => row.length >= 2);
      const chi = table.length >= 2 ? chiSquareIndependence(table) : undefined;
      const multi = dataset.hasPairs && dataset.pairs.length > 3
        ? (() => { const result = multipleRegression(dataset.pairs.map((pair) => pair.y), [dataset.pairs.map((pair) => pair.x)]); return { coefficients: result.coefficients, rSquared: result.rSquared }; })()
        : undefined;
      setInference({ one, welch, anova, chi, multi });
    } catch (error) {
      setInference({ error: error instanceof Error ? error.message : String(error) });
    }
  };
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(320);

  const fmt = (value: number) => formatNumber(value, { decimals: 6, lang, numerals });

  const dataset = useMemo(() => parseDataset(text), [text]);
  const stats = useMemo(() => {
    if (dataset.values.length < 2) return null;
    try {
      return descriptiveStats(dataset.values);
    } catch {
      return null;
    }
  }, [dataset]);
  const bins = useMemo(() => (stats ? histogramBins(dataset.values) : []), [stats, dataset]);
  const regression = useMemo(() => {
    if (!dataset.hasPairs) return null;
    try {
      return linearRegression(dataset.pairs);
    } catch {
      return null;
    }
  }, [dataset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas?.parentElement || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      setWidth(Math.max(200, Math.floor(entries[0].contentRect.width)));
    });
    observer.observe(canvas.parentElement);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const height = 260;
    const dpr = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const pad = { top: 14, right: 10, bottom: 26, left: 34 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    if (regression && dataset.hasPairs) {
      const xs = dataset.pairs.map((p) => p.x);
      const ys = dataset.pairs.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const spanX = maxX - minX || 1;
      const spanY = maxY - minY || 1;
      const px = (x: number) => pad.left + ((x - minX) / spanX) * plotW;
      const py = (y: number) => pad.top + plotH - ((y - minY) / spanY) * plotH;
      ctx.strokeStyle = 'rgba(148,163,255,0.35)';
      ctx.strokeRect(pad.left, pad.top, plotW, plotH);
      ctx.strokeStyle = '#FFC46B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px(minX), py(regression.predict(minX)));
      ctx.lineTo(px(maxX), py(regression.predict(maxX)));
      ctx.stroke();
      ctx.fillStyle = '#8AB4FF';
      for (const pair of dataset.pairs) {
        ctx.beginPath();
        ctx.arc(px(pair.x), py(pair.y), 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(220,225,255,0.8)';
      ctx.font = '10px system-ui, sans-serif';
      ctx.fillText(String(minX), pad.left, height - 8);
      ctx.fillText(String(maxX), width - pad.right - 20, height - 8);
      ctx.fillText(String(maxY), 2, pad.top + 10);
      ctx.fillText(String(minY), 2, height - pad.bottom);
      return;
    }

    if (!bins.length) return;
    const maxCount = Math.max(...bins.map((bin) => bin.count), 1);
    const barW = plotW / bins.length;
    ctx.strokeStyle = 'rgba(148,163,255,0.35)';
    ctx.strokeRect(pad.left, pad.top, plotW, plotH);
    bins.forEach((bin, index) => {
      const barH = (bin.count / maxCount) * (plotH - 8);
      const x = pad.left + index * barW + 1;
      const y = pad.top + plotH - barH;
      const gradient = ctx.createLinearGradient(0, y, 0, y + barH);
      gradient.addColorStop(0, '#FF9CBF');
      gradient.addColorStop(1, '#8AB4FF');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, Math.max(2, barW - 2), barH);
      if (bin.count > 0) {
        ctx.fillStyle = 'rgba(230,233,255,0.95)';
        ctx.font = '10px system-ui, sans-serif';
        ctx.fillText(String(bin.count), x + 2, y - 3);
      }
    });
    if (stats) {
      const span = bins[bins.length - 1].to - bins[0].from || 1;
      const meanX = pad.left + ((stats.mean - bins[0].from) / span) * plotW;
      ctx.strokeStyle = '#FFC46B';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(meanX, pad.top);
      ctx.lineTo(meanX, pad.top + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(220,225,255,0.8)';
      ctx.font = '10px system-ui, sans-serif';
      ctx.fillText(fmt(bins[0].from), pad.left, height - 8);
      ctx.fillText(fmt(bins[bins.length - 1].to), Math.max(pad.left, width - pad.right - 44), height - 8);
      ctx.fillText(String(maxCount), 8, pad.top + 10);
    }
  }, [bins, stats, regression, dataset, width, lang, numerals]);

  const rows = stats
    ? [
        { label: t('statCount'), value: fmt(stats.count) },
        { label: t('statSum'), value: fmt(stats.sum) },
        { label: t('statMean'), value: fmt(stats.mean) },
        { label: t('statMedian'), value: fmt(stats.median) },
        { label: t('statMode'), value: stats.mode.length ? stats.mode.map(fmt).join('، ') : '—' },
        { label: t('statStd'), value: fmt(stats.stdSample) },
        { label: t('statVariance'), value: fmt(stats.varianceSample) },
        { label: t('statMin'), value: fmt(stats.min) },
        { label: t('statMax'), value: fmt(stats.max) },
        { label: t('statRange'), value: fmt(stats.range) },
        { label: t('statQ1'), value: fmt(stats.q1) },
        { label: t('statQ3'), value: fmt(stats.q3) },
        { label: t('statIqr'), value: fmt(stats.iqr) },
        { label: t('statSkewness'), value: fmt(stats.skewness) },
      ]
    : [];

  const predicted = regression ? regression.predict(Number(predictX) || 0) : Number.NaN;

  return (
    <div className="space-y-5 px-4 pb-8 pt-3">
      <header className="hero-surface p-5">
        <p className="data-pill relative z-10">
          <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
          {t('tools')}
        </p>
        <h1 className="relative z-10 mt-2 text-headline-medium font-bold text-on-surface">{t('statsTitle')}</h1>
        <p className="relative z-10 mt-1 text-body-medium text-on-surface-variant">{t('statsHint')}</p>
      </header>

      <section className="space-y-2">
        <label className="block">
          <span className="sr-only">{t('statsTitle')}</span>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t('datasetPlaceholder')}
            rows={6}
            dir="ltr"
            className="w-full rounded-2xl border border-outline-variant bg-surface-container p-3 font-mono text-body-medium text-on-surface outline-none focus:border-primary"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          <Chip onClick={() => setText(SAMPLE_SERIES)}>{t('loadSampleData')} · 1D</Chip>
          <Chip onClick={() => setText(SAMPLE_PAIRS)}>{t('loadSampleData')} · x,y</Chip>
          <label className="flex min-h-10 cursor-pointer items-center rounded-full border border-outline-variant px-3 text-label-large text-on-surface">
            {fa ? 'وارد کردن فایل CSV/TXT' : 'Import CSV/TXT file'}
            <input
              type="file"
              accept=".csv,.tsv,.txt,text/csv,text/plain"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                void file.text().then((content) => setText(content.slice(0, 200_000)));
              }}
            />
          </label>
        </div>
      </section>

      {text.trim() && !stats && <p className="text-body-medium text-error">{t('notEnoughData')}</p>}

      {stats && (
        <>
          <section className="space-y-2" aria-label={regression ? t('scatterRegression') : t('histogram')}>
            <h2 className="text-title-medium font-semibold text-on-surface">
              {regression ? t('scatterRegression') : t('histogram')}
            </h2>
            <div className="overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest">
              <canvas ref={canvasRef} style={{ width, height: 260 }} aria-hidden="true" />
            </div>
          </section>

          {regression && (
            <section className="hero-surface space-y-3 p-4" aria-label={t('regressionEquation')} aria-live="polite">
              <h2 className="relative z-10 text-title-medium font-semibold text-on-surface">{t('regressionEquation')}</h2>
              <p className="mono-result relative z-10 text-headline-small font-bold text-on-surface" dir="ltr">
                y = {fmt(regression.intercept)} + {fmt(regression.slope)}·x
              </p>
              <p className="relative z-10 text-body-medium text-on-surface-variant">
                {t('correlationLabel')}: <span className="mono-result font-semibold text-on-surface">{fmt(regression.correlation)}</span>
                {' · '}R²: <span className="mono-result font-semibold text-on-surface">{fmt(regression.rSquared)}</span>
              </p>
              <label className="relative z-10 block">
                <span className="mb-1 block text-label-medium text-on-surface-variant">{t('predictFor')}</span>
                <span className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    dir="ltr"
                    value={predictX}
                    onChange={(event) => setPredictX(event.target.value)}
                    className="h-12 w-32 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 font-mono text-on-surface outline-none focus:border-primary"
                  />
                  <span className="mono-result text-title-medium font-semibold text-on-surface" dir="ltr">
                    → {fmt(predicted)}
                  </span>
                </span>
              </label>
            </section>
          )}

          <section className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label={t('statsTitle')} aria-live="polite">
            {rows.map((row) => (
              <div key={row.label} className="rounded-2xl border border-outline-variant bg-surface-container p-3">
                <p className="text-label-medium text-on-surface-variant">{row.label}</p>
                <p className="mono-result mt-0.5 break-words text-title-small font-semibold text-on-surface">{row.value}</p>
              </div>
            ))}
            <div className="rounded-2xl border border-outline-variant bg-surface-container p-3 col-span-2 sm:col-span-3">
              <p className="text-label-medium text-on-surface-variant">{t('statOutliers')} (1.5×IQR)</p>
              <p className="mono-result mt-0.5 text-body-medium font-semibold text-on-surface">
                {stats.outliers.length ? stats.outliers.map(fmt).join('، ') : t('noOutliers')}
              </p>
            </div>
          </section>
        </>
      )}

      <section className="space-y-3 rounded-3xl border border-outline-variant bg-surface-container p-4">
        <h2 className="text-title-medium font-semibold text-on-surface">{fa ? 'آمار استنباطی' : 'Inferential statistics'}</h2>
        <p className="text-body-small text-on-surface-variant">{fa ? 'آزمون t تک‌نمونه‌ای روی دادهٔ اصلی، t ولش بین دو گروه، ANOVA یک‌طرفه، کای‌دو و (برای دادهٔ x,y) رگرسیون چندگانه با همان x — همه با p-value دقیق.' : 'One-sample t on the main dataset, Welch t between two groups, one-way ANOVA, chi-square and multiple regression — all with exact p-values.'}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block"><span className="mb-1 block text-label-medium text-on-surface-variant">{fa ? 'میانگین فرضی μ₀ برای آزمون تک‌نمونه‌ای' : 'Hypothesised mean μ₀'}</span><input value={mu0} onChange={(e) => setMu0(e.target.value)} dir="ltr" inputMode="decimal" className="h-11 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 font-mono text-on-surface outline-none focus:border-primary" /></label>
          <label className="block"><span className="mb-1 block text-label-medium text-on-surface-variant">{fa ? 'گروه A' : 'Group A'}</span><input value={groupA} onChange={(e) => setGroupA(e.target.value)} dir="ltr" className="h-11 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 font-mono text-on-surface outline-none focus:border-primary" /></label>
          <label className="block"><span className="mb-1 block text-label-medium text-on-surface-variant">{fa ? 'گروه B' : 'Group B'}</span><input value={groupB} onChange={(e) => setGroupB(e.target.value)} dir="ltr" className="h-11 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 font-mono text-on-surface outline-none focus:border-primary" /></label>
          <label className="block"><span className="mb-1 block text-label-medium text-on-surface-variant">{fa ? 'گروه‌های ANOVA (هر سطر یک گروه)' : 'ANOVA groups (one group per line)'}</span><textarea value={anovaText} onChange={(e) => setAnovaText(e.target.value)} rows={3} dir="ltr" className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-3 font-mono text-on-surface outline-none focus:border-primary" /></label>
          <label className="block sm:col-span-2"><span className="mb-1 block text-label-medium text-on-surface-variant">{fa ? 'جدول توافقی کای‌دو (هر سطر یک ردیف)' : 'Chi-square contingency table (one row per line)'}</span><textarea value={chiText} onChange={(e) => setChiText(e.target.value)} rows={2} dir="ltr" className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-3 font-mono text-on-surface outline-none focus:border-primary" /></label>
        </div>
        <button type="button" onClick={runInference} className="min-h-11 rounded-full brand-gradient px-4 font-semibold text-white">{fa ? 'اجرای آزمون‌ها' : 'Run tests'}</button>
        {inference?.error && <p role="alert" className="rounded-xl bg-error-container/50 p-3 text-body-small text-on-surface">{inference.error}</p>}
        {inference && !inference.error && (
          <dl className="grid gap-2 sm:grid-cols-2">
            {inference.one && <div className="rounded-xl bg-surface-container-high/70 p-3"><dt className="text-label-medium text-on-surface-variant">{fa ? 't تک‌نمونه‌ای' : 'One-sample t'}</dt><dd className="tnum mt-1 font-mono text-body-medium font-semibold text-on-surface" dir="ltr">t={fmt(inference.one.t)} · df={fmt(inference.one.df)} · p={fmt(inference.one.pTwoTailed)}</dd></div>}
            {inference.welch && <div className="rounded-xl bg-surface-container-high/70 p-3"><dt className="text-label-medium text-on-surface-variant">{fa ? 't ولش دو گروه' : 'Welch two-sample t'}</dt><dd className="tnum mt-1 font-mono text-body-medium font-semibold text-on-surface" dir="ltr">t={fmt(inference.welch.t)} · df={fmt(inference.welch.df)} · p={fmt(inference.welch.pTwoTailed)}</dd></div>}
            {inference.anova && <div className="rounded-xl bg-surface-container-high/70 p-3"><dt className="text-label-medium text-on-surface-variant">ANOVA</dt><dd className="tnum mt-1 font-mono text-body-medium font-semibold text-on-surface" dir="ltr">F={fmt(inference.anova.f)} · p={fmt(inference.anova.pValue)} · η²={fmt(inference.anova.etaSquared)}</dd></div>}
            {inference.chi && <div className="rounded-xl bg-surface-container-high/70 p-3"><dt className="text-label-medium text-on-surface-variant">{fa ? 'کای‌دو استقلال' : 'Chi-square independence'}</dt><dd className="tnum mt-1 font-mono text-body-medium font-semibold text-on-surface" dir="ltr">χ²={fmt(inference.chi.chi2)} · df={inference.chi.df} · p={fmt(inference.chi.pValue)}</dd></div>}
            {inference.multi && <div className="rounded-xl bg-surface-container-high/70 p-3 sm:col-span-2"><dt className="text-label-medium text-on-surface-variant">{fa ? 'رگرسیون (چندگانه) روی جفت‌های x,y' : 'Regression on the x,y pairs'}</dt><dd className="tnum mt-1 font-mono text-body-medium font-semibold text-on-surface" dir="ltr">β = [{inference.multi.coefficients.map(fmt).join(', ')}] · R²={fmt(inference.multi.rSquared)}</dd></div>}
          </dl>
        )}
      </section>
    </div>
  );
}
