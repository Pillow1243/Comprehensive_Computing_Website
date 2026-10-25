/**
 * Pure, worker-safe computation core.
 *
 * Extracted from the worker entry point so it can be unit-tested in Node and
 * reused by the optional Pyodide/CAS path without touching `self`.
 */
import { FORMULAS } from '../apps/web/registry.js';
import { evaluate, numericDerivative, numericIntegral, findRoot } from '../apps/web/engine.js';

export type WorkerRequest =
  | { id: string; op: 'ping' }
  | { id: string; op: 'compute'; formulaId: string; inputs: Record<string, string | number | boolean> }
  | { id: string; op: 'evaluate'; expr: string; vars?: Record<string, number> }
  | {
      id: string;
      op: 'sample';
      expr: string;
      from: number;
      to: number;
      points?: number;
      vars?: Record<string, number>;
    }
  | { id: string; op: 'derivative'; expr: string; at: number }
  | { id: string; op: 'integrate'; expr: string; from: number; to: number; intervals?: number }
  | { id: string; op: 'root'; expr: string; from: number; to: number }
  | { id: string; op: 'matrix'; a: number[][]; b?: number[][] }
  | { id: string; op: 'stats'; values: number[] }
  | {
      id: string;
      op: 'regression';
      x: number[];
      y: number[];
    };

export type WorkerResponse =
  | { id: string; ok: true; result: unknown; durationMs: number }
  | { id: string; ok: false; error: { message: string; code: string }; durationMs: number };

const finite = (value: unknown, label: string): number => {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) throw new Error(`${label} is not a finite number`);
  return numeric;
};

const determinant = (matrix: number[][]): number => {
  const n = matrix.length;
  if (!n || matrix.some((row) => row.length !== n)) throw new Error('Matrix must be square');
  if (n === 1) return matrix[0][0];
  if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  let total = 0;
  for (let column = 0; column < n; column += 1) {
    const minor = matrix
      .slice(1)
      .map((row) => row.filter((_, index) => index !== column));
    total += (column % 2 === 0 ? 1 : -1) * matrix[0][column] * determinant(minor);
  }
  return total;
};

const multiply = (a: number[][], b: number[][]): number[][] => {
  const rows = a.length;
  const cols = b[0]?.length ?? 0;
  if (b.length !== a[0]?.length) throw new Error('Matrix dimensions do not match');
  return Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) =>
      a[i].reduce((sum, value, k) => sum + value * b[k][j], 0),
    ),
  );
};

const inverse2x2 = (a: number[][]): number[][] => {
  const det = determinant(a);
  if (det === 0) throw new Error('Matrix is singular (determinant = 0)');
  return [
    [a[1][1] / det, -a[0][1] / det],
    [-a[1][0] / det, a[0][0] / det],
  ];
};

const descriptive = (values: number[]) => {
  if (!values.length) throw new Error('Empty data set');
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((acc, value) => acc + value, 0);
  const mean = sum / n;
  const variance =
    n > 1 ? sorted.reduce((acc, value) => acc + (value - mean) ** 2, 0) / (n - 1) : 0;
  const quantile = (p: number) => {
    const position = (n - 1) * p;
    const base = Math.floor(position);
    const rest = position - base;
    return sorted[base + 1] !== undefined
      ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
      : sorted[base];
  };
  return {
    count: n,
    sum,
    mean,
    median: quantile(0.5),
    q1: quantile(0.25),
    q3: quantile(0.75),
    min: sorted[0],
    max: sorted[n - 1],
    variance,
    standardDeviation: Math.sqrt(variance),
    range: sorted[n - 1] - sorted[0],
  };
};

const linearRegression = (x: number[], y: number[]) => {
  if (x.length !== y.length || x.length < 2) throw new Error('x and y must have the same length ≥ 2');
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i += 1) {
    sxy += (x[i] - meanX) * (y[i] - meanY);
    sxx += (x[i] - meanX) ** 2;
    syy += (y[i] - meanY) ** 2;
  }
  const slope = sxx === 0 ? Number.NaN : sxy / sxx;
  return {
    slope,
    intercept: meanY - slope * meanX,
    r: sxx === 0 || syy === 0 ? Number.NaN : sxy / Math.sqrt(sxx * syy),
    r2: sxx === 0 || syy === 0 ? Number.NaN : (sxy * sxy) / (sxx * syy),
  };
};

const handle = (request: WorkerRequest): unknown => {
  switch (request.op) {
    case 'ping':
      return { pong: true, formulas: FORMULAS.length };
    case 'compute': {
      const formula = FORMULAS.find((candidate) => candidate.id === request.formulaId);
      if (!formula) throw new Error(`Unknown formula: ${request.formulaId}`);
      const result = formula.compute({ ...request.inputs });
      if (!result || typeof result !== 'object' || !result.values) {
        throw new Error('Formula returned no values');
      }
      for (const [key, value] of Object.entries(result.values)) {
        if (typeof value === 'number' && !Number.isFinite(value)) {
          throw new Error(`Output «${key}» is not finite`);
        }
      }
      return result;
    }
    case 'evaluate':
      return evaluate(request.expr, request.vars ?? {});
    case 'sample': {
      const points = Math.max(2, Math.min(4000, request.points ?? 480));
      const from = finite(request.from, 'from');
      const to = finite(request.to, 'to');
      if (from === to) throw new Error('Sampling range is empty');
      const step = (to - from) / (points - 1);
      const xs: number[] = [];
      const ys: number[] = [];
      for (let i = 0; i < points; i += 1) {
        const x = from + step * i;
        xs.push(x);
        try {
          ys.push(evaluate(request.expr, { ...(request.vars ?? {}), x }));
        } catch {
          ys.push(Number.NaN);
        }
      }
      return { xs, ys };
    }
    case 'derivative':
      return numericDerivative(request.expr, finite(request.at, 'at'));
    case 'integrate':
      return numericIntegral(request.expr, request.from, request.to, request.intervals ?? 2000);
    case 'root': {
      const root = findRoot(request.expr, request.from, request.to);
      if (!Number.isFinite(root)) throw new Error('No root found in the given interval');
      return root;
    }
    case 'matrix': {
      const det = determinant(request.a);
      return {
        determinant: det,
        inverse: request.a.length === 2 && det !== 0 ? inverse2x2(request.a) : null,
        product: request.b ? multiply(request.a, request.b) : null,
      };
    }
    case 'stats':
      return descriptive(request.values.map((value) => finite(value, 'value')));
    case 'regression':
      return linearRegression(request.x, request.y);
    default:
      throw new Error(`Unsupported operation: ${(request as { op?: string }).op ?? 'unknown'}`);
  }
};

export const handleRequest = handle;
export const availableFormulaIds = FORMULAS.map((formula) => formula.id);
