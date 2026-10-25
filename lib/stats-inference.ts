/**
 * Inferential statistics (v5) for the Statistics Lab: Student t-tests,
 * one-way ANOVA, chi-square independence, multiple linear regression and
 * confidence intervals — pure functions with textbook-verifiable results.
 *
 * p-values use a self-contained regularised incomplete beta / gamma
 * implementation (continued fractions, Numerical Recipes style), so nothing
 * depends on an external statistics package.
 */

// ─── Special functions ───────────────────────────────────────────────────────

function logGamma(z: number): number {
  const c = [
    0.9999999999998099, 676.5203681218851, -1259.1392167224028, 771.3234287776531,
    -176.6150291621406, 12.507343278686905, -0.13857109526572012,
    9.984369578019572e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  const shifted = z - 1;
  let x = c[0];
  for (let i = 1; i < c.length; i += 1) x += c[i] / (shifted + i);
  const t = shifted + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (shifted + 0.5) * Math.log(t) - t + Math.log(x);
}

function betaContinuedFraction(a: number, b: number, x: number): number {
  const MAXIT = 200;
  const EPS = 3e-12;
  const FPMIN = 1e-300;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m += 1) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/** Regularised incomplete beta I_x(a, b). */
export function incompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x),
  );
  if (x < (a + 1) / (a + b + 2)) return (bt * betaContinuedFraction(a, b, x)) / a;
  return 1 - (bt * betaContinuedFraction(b, a, 1 - x)) / b;
}

function gammaSeries(a: number, x: number): number {
  let ap = a;
  let sum = 1 / a;
  let del = sum;
  for (let n = 0; n < 200; n += 1) {
    ap += 1;
    del *= x / ap;
    sum += del;
    if (Math.abs(del) < Math.abs(sum) * 1e-12) break;
  }
  return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
}

function gammaContinuedFraction(a: number, x: number): number {
  const FPMIN = 1e-300;
  let b = x + 1 - a;
  let c = 1 / FPMIN;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i <= 200; i += 1) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
  }
  return Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
}

/** Regularised lower incomplete gamma P(a, x). */
export function incompleteGammaP(a: number, x: number): number {
  if (x < 0 || a <= 0) return Number.NaN;
  if (x === 0) return 0;
  return x < a + 1 ? gammaSeries(a, x) : 1 - gammaContinuedFraction(a, x);
}

// ─── Distribution tails ──────────────────────────────────────────────────────

/** Two-tailed p-value for a t statistic. */
export function tPValue(t: number, df: number): number {
  const x = df / (df + t * t);
  return incompleteBeta(x, df / 2, 0.5);
}

/** Upper-tail p-value for an F statistic. */
export function fPValue(f: number, df1: number, df2: number): number {
  if (f <= 0) return 1;
  const x = df2 / (df2 + df1 * f);
  return incompleteBeta(x, df2 / 2, df1 / 2);
}

/** Upper-tail p-value for a chi-square statistic. */
export function chiSquarePValue(chi2: number, df: number): number {
  return 1 - incompleteGammaP(df / 2, chi2 / 2);
}

/** Inverse standard normal CDF (Acklam's approximation, |ε| < 1.15e-9). */
export function normalQuantile(p: number): number {
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  const pLow = 0.02425;
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p <= 1 - pLow) {
    const q = p - 0.5;
    const r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  const q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}

/** t critical value by bisection on the CDF. */
export function tCritical(confidence: number, df: number): number {
  const target = (1 - confidence) / 2;
  let lo = 0;
  let hi = 100;
  for (let i = 0; i < 80; i += 1) {
    const mid = (lo + hi) / 2;
    if (tPValue(mid, df) > target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
const sampleVariance = (values: number[]) => {
  const m = mean(values);
  return values.reduce((a, b) => a + (b - m) ** 2, 0) / (values.length - 1);
};

export interface TTestResult {
  t: number;
  df: number;
  pTwoTailed: number;
  meanDifference: number;
  ciLow: number;
  ciHigh: number;
  confidence: number;
}

/** Independent two-sample (Welch) t-test. */
export function welchTTest(a: number[], b: number[], confidence = 0.95): TTestResult {
  if (a.length < 2 || b.length < 2) throw new Error('Each sample needs at least two values');
  const ma = mean(a);
  const mb = mean(b);
  const va = sampleVariance(a);
  const vb = sampleVariance(b);
  const se = Math.sqrt(va / a.length + vb / b.length);
  if (se === 0) throw new Error('Standard error is zero; the samples have no variation');
  const t = (ma - mb) / se;
  const df =
    (va / a.length + vb / b.length) ** 2 /
    ((va / a.length) ** 2 / (a.length - 1) + (vb / b.length) ** 2 / (b.length - 1));
  const critical = tCritical(confidence, df);
  return {
    t,
    df,
    pTwoTailed: tPValue(Math.abs(t), df),
    meanDifference: ma - mb,
    ciLow: ma - mb - critical * se,
    ciHigh: ma - mb + critical * se,
    confidence,
  };
}

/** One-sample t-test against a hypothesised mean. */
export function oneSampleTTest(values: number[], mu0: number, confidence = 0.95): TTestResult {
  if (values.length < 2) throw new Error('At least two values are required');
  const m = mean(values);
  const sd = Math.sqrt(sampleVariance(values));
  const se = sd / Math.sqrt(values.length);
  if (se === 0) throw new Error('Standard error is zero');
  const t = (m - mu0) / se;
  const df = values.length - 1;
  const critical = tCritical(confidence, df);
  return {
    t,
    df,
    pTwoTailed: tPValue(Math.abs(t), df),
    meanDifference: m - mu0,
    ciLow: m - critical * se,
    ciHigh: m + critical * se,
    confidence,
  };
}

export interface AnovaResult {
  f: number;
  dfBetween: number;
  dfWithin: number;
  pValue: number;
  ssBetween: number;
  ssWithin: number;
  etaSquared: number;
}

/** One-way ANOVA across two or more groups. */
export function oneWayAnova(groups: number[][]): AnovaResult {
  const clean = groups.filter((g) => g.length > 0);
  if (clean.length < 2 || clean.some((g) => g.length < 1)) throw new Error('At least two groups are required');
  const all = clean.flat();
  const grand = mean(all);
  let ssBetween = 0;
  let ssWithin = 0;
  for (const group of clean) {
    const gm = mean(group);
    ssBetween += group.length * (gm - grand) ** 2;
    ssWithin += group.reduce((acc, v) => acc + (v - gm) ** 2, 0);
  }
  const dfBetween = clean.length - 1;
  const dfWithin = all.length - clean.length;
  if (dfWithin <= 0 || ssWithin === 0) throw new Error('Within-group variation is zero');
  const f = ssBetween / dfBetween / (ssWithin / dfWithin);
  return {
    f,
    dfBetween,
    dfWithin,
    pValue: fPValue(f, dfBetween, dfWithin),
    ssBetween,
    ssWithin,
    etaSquared: ssBetween / (ssBetween + ssWithin),
  };
}

export interface ChiSquareResult {
  chi2: number;
  df: number;
  pValue: number;
  expected: number[][];
}

/** Chi-square test of independence for a contingency table. */
export function chiSquareIndependence(table: number[][]): ChiSquareResult {
  const rows = table.length;
  const cols = table[0]?.length ?? 0;
  if (rows < 2 || cols < 2 || table.some((r) => r.length !== cols)) {
    throw new Error('A contingency table of at least 2×2 is required');
  }
  const rowSums = table.map((r) => r.reduce((a, b) => a + b, 0));
  const colSums = Array.from({ length: cols }, (_, j) => table.reduce((acc, r) => acc + r[j], 0));
  const total = rowSums.reduce((a, b) => a + b, 0);
  if (total <= 0) throw new Error('Table total must be positive');
  const expected = table.map((_, i) => colSums.map((cs) => (rowSums[i] * cs) / total));
  let chi2 = 0;
  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < cols; j += 1) {
      if (expected[i][j] <= 0) throw new Error('An expected cell is zero');
      chi2 += (table[i][j] - expected[i][j]) ** 2 / expected[i][j];
    }
  }
  const df = (rows - 1) * (cols - 1);
  return { chi2, df, pValue: chiSquarePValue(chi2, df), expected };
}

export interface MultipleRegressionResult {
  coefficients: number[];
  rSquared: number;
  predictions: number[];
  residuals: number[];
}

/** Multiple linear regression via normal equations (Gaussian elimination). */
export function multipleRegression(y: number[], xColumns: number[][]): MultipleRegressionResult {
  const n = y.length;
  if (!xColumns.length || xColumns.some((col) => col.length !== n) || n <= xColumns.length + 1) {
    throw new Error('Need more observations than predictors (+ intercept)');
  }
  const design = y.map((_, i) => [1, ...xColumns.map((col) => col[i])]);
  const p = design[0].length;
  const xtx = Array.from({ length: p }, () => Array<number>(p).fill(0));
  const xty = Array<number>(p).fill(0);
  for (let i = 0; i < n; i += 1) {
    for (let a = 0; a < p; a += 1) {
      xty[a] += design[i][a] * y[i];
      for (let b = 0; b < p; b += 1) xtx[a][b] += design[i][a] * design[i][b];
    }
  }
  // Gaussian elimination with partial pivoting.
  const augmented = xtx.map((row, i) => [...row, xty[i]]);
  for (let col = 0; col < p; col += 1) {
    let pivot = col;
    for (let r = col + 1; r < p; r += 1) {
      if (Math.abs(augmented[r][col]) > Math.abs(augmented[pivot][col])) pivot = r;
    }
    if (Math.abs(augmented[pivot][col]) < 1e-12) throw new Error('Predictors are collinear');
    [augmented[col], augmented[pivot]] = [augmented[pivot], augmented[col]];
    const divisor = augmented[col][col];
    for (let j = col; j <= p; j += 1) augmented[col][j] /= divisor;
    for (let r = 0; r < p; r += 1) {
      if (r === col) continue;
      const factor = augmented[r][col];
      for (let j = col; j <= p; j += 1) augmented[r][j] -= factor * augmented[col][j];
    }
  }
  const coefficients = augmented.map((row) => row[p]);
  const predictions = design.map((row) => row.reduce((acc, v, i) => acc + v * coefficients[i], 0));
  const residuals = y.map((v, i) => v - predictions[i]);
  const yMean = mean(y);
  const ssTot = y.reduce((acc, v) => acc + (v - yMean) ** 2, 0);
  const ssRes = residuals.reduce((acc, v) => acc + v ** 2, 0);
  return { coefficients, rSquared: ssTot === 0 ? 0 : 1 - ssRes / ssTot, predictions, residuals };
}
