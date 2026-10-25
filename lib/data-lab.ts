/**
 * Dataset workbench maths (v4) for the Statistics Lab.
 *
 * Parsing accepts what students actually paste: Latin or Persian digits,
 * comma/space/tab/newline separators, and two-column `x, y` rows for the
 * regression view. All statistics are pure and unit-tested.
 */

import { normalizeDigits } from '@/lib/utils';

export interface ParsedDataset {
  values: number[];
  pairs: { x: number; y: number }[];
  hasPairs: boolean;
}

/** Parse pasted text into a single series plus optional (x, y) pairs. */
export function parseDataset(text: string): ParsedDataset {
  const cleaned = normalizeDigits(text).replace(/٫/g, '.');
  const lines = cleaned.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const pairs: { x: number; y: number }[] = [];
  const values: number[] = [];
  for (const line of lines) {
    const cells = line
      .split(/[,،;\t]+|\s{2,}/)
      .map((cell) => cell.trim())
      .filter(Boolean);
    if (cells.length === 2) {
      const [x, y] = cells.map(Number);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        pairs.push({ x, y });
        values.push(y);
        continue;
      }
    }
    for (const token of line.split(/[\s,،;]+/).filter(Boolean)) {
      const value = Number(token);
      if (Number.isFinite(value)) values.push(value);
    }
  }
  return { values, pairs, hasPairs: pairs.length >= 2 };
}

export interface DescriptiveStats {
  count: number;
  sum: number;
  mean: number;
  median: number;
  mode: number[];
  min: number;
  max: number;
  range: number;
  q1: number;
  q3: number;
  iqr: number;
  varianceSample: number;
  stdSample: number;
  variancePopulation: number;
  stdPopulation: number;
  skewness: number;
  outliers: number[];
}

function quantile(sorted: number[], p: number): number {
  const position = (sorted.length - 1) * p;
  const base = Math.floor(position);
  const rest = position - base;
  return sorted[base + 1] !== undefined
    ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
    : sorted[base];
}

export function descriptiveStats(values: number[]): DescriptiveStats {
  if (!values.length) throw new Error('مجموعه‌داده خالی است');
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((acc, value) => acc + value, 0);
  const mean = sum / n;
  const squared = sorted.reduce((acc, value) => acc + (value - mean) ** 2, 0);
  const variancePopulation = squared / n;
  const varianceSample = n > 1 ? squared / (n - 1) : 0;
  const stdPopulation = Math.sqrt(variancePopulation);
  const cubed = sorted.reduce((acc, value) => acc + (value - mean) ** 3, 0);
  const skewness = stdPopulation > 0 ? cubed / n / stdPopulation ** 3 : 0;
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  const outliers = sorted.filter((value) => value < lower || value > upper);
  const counts = new Map<number, number>();
  for (const value of sorted) counts.set(value, (counts.get(value) ?? 0) + 1);
  const maxCount = Math.max(...counts.values());
  const mode = maxCount > 1 ? [...counts.entries()].filter(([, c]) => c === maxCount).map(([v]) => v) : [];
  return {
    count: n,
    sum,
    mean,
    median: quantile(sorted, 0.5),
    mode,
    min: sorted[0],
    max: sorted[n - 1],
    range: sorted[n - 1] - sorted[0],
    q1,
    q3,
    iqr,
    varianceSample,
    stdSample: Math.sqrt(varianceSample),
    variancePopulation,
    stdPopulation,
    skewness,
    outliers,
  };
}

export interface HistogramBin {
  from: number;
  to: number;
  count: number;
}

/** Freedman–Diaconis binning with a square-root fallback for tiny/constant data. */
export function histogramBins(values: number[]): HistogramBin[] {
  if (!values.length) return [];
  const stats = descriptiveStats(values);
  const { min, max, count } = stats;
  if (max === min) return [{ from: min, to: max, count }];
  let width = stats.iqr > 0 ? (2 * stats.iqr) / Math.cbrt(count) : 0;
  if (!(width > 0)) width = (max - min) / Math.ceil(Math.sqrt(count));
  const binCount = Math.min(40, Math.max(3, Math.ceil((max - min) / width)));
  const step = (max - min) / binCount;
  const bins: HistogramBin[] = Array.from({ length: binCount }, (_, i) => ({
    from: min + i * step,
    to: min + (i + 1) * step,
    count: 0,
  }));
  for (const value of values) {
    const index = Math.min(binCount - 1, Math.floor((value - min) / step));
    bins[index].count += 1;
  }
  return bins;
}

export interface RegressionResult {
  slope: number;
  intercept: number;
  correlation: number;
  rSquared: number;
  predict: (x: number) => number;
}

export function linearRegression(pairs: { x: number; y: number }[]): RegressionResult {
  if (pairs.length < 2) throw new Error('برای رگرسیون حداقل دو جفت داده لازم است');
  const n = pairs.length;
  const meanX = pairs.reduce((acc, p) => acc + p.x, 0) / n;
  const meanY = pairs.reduce((acc, p) => acc + p.y, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (const p of pairs) {
    sxy += (p.x - meanX) * (p.y - meanY);
    sxx += (p.x - meanX) ** 2;
    syy += (p.y - meanY) ** 2;
  }
  if (sxx === 0) throw new Error('همه xها برابرند؛ خط رگرسیون تعریف نمی‌شود');
  const slope = sxy / sxx;
  const intercept = meanY - slope * meanX;
  const correlation = syy === 0 ? 0 : sxy / Math.sqrt(sxx * syy);
  return {
    slope,
    intercept,
    correlation,
    rSquared: correlation ** 2,
    predict: (x) => intercept + slope * x,
  };
}

/** Standardise a series to z-scores (population σ). */
export function zScores(values: number[]): number[] {
  const stats = descriptiveStats(values);
  if (stats.stdPopulation === 0) return values.map(() => 0);
  return values.map((value) => (value - stats.mean) / stats.stdPopulation);
}

/** Simple moving average with the given window (trailing). */
export function movingAverage(values: number[], windowSize: number): number[] {
  const w = Math.max(1, Math.trunc(windowSize));
  if (w > values.length) return [];
  const out: number[] = [];
  for (let i = 0; i + w <= values.length; i += 1) {
    out.push(values.slice(i, i + w).reduce((acc, value) => acc + value, 0) / w);
  }
  return out;
}
