import { describe, expect, it } from 'vitest';
import { handleRequest, availableFormulaIds } from '@/workers/compute-core';
import { FORMULAS } from '@/apps/web/registry.js';

describe('computation core', () => {
  it('reports every formula id it can solve', () => {
    expect(availableFormulaIds.length).toBe(FORMULAS.length);
    const ping = handleRequest({ id: '1', op: 'ping' }) as { pong: boolean; formulas: number };
    expect(ping.pong).toBe(true);
    expect(ping.formulas).toBe(FORMULAS.length);
  });

  it('solves quadratic through the worker contract', () => {
    const result = handleRequest({
      id: '2',
      op: 'compute',
      formulaId: 'quadratic',
      inputs: { a: 1, b: -5, c: 6 },
    }) as { values: Record<string, number>; steps: string[] };
    expect(result.values.x1).toBeCloseTo(3, 6);
    expect(result.values.x2).toBeCloseTo(2, 6);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('rejects unknown formulas and non-finite outputs', () => {
    expect(() => handleRequest({ id: '3', op: 'compute', formulaId: 'nope', inputs: {} })).toThrow();
    expect(() =>
      handleRequest({ id: '4', op: 'compute', formulaId: 'log_solve', inputs: { base: 1, value: 5 } }),
    ).toThrow();
  });

  it('samples expressions for plotting with a bounded point count', () => {
    const { xs, ys } = handleRequest({
      id: '5',
      op: 'sample',
      expr: 'x^2',
      from: -2,
      to: 2,
      points: 9,
    }) as { xs: number[]; ys: number[] };
    expect(xs).toHaveLength(9);
    expect(ys[8]).toBeCloseTo(4, 6);
    expect(ys.filter((value) => Number.isFinite(value)).length).toBeGreaterThan(5);
  });

  it('computes derivatives, integrals and roots', () => {
    expect(handleRequest({ id: '6', op: 'derivative', expr: 'x^3', at: 2 })).toBeCloseTo(12, 3);
    expect(handleRequest({ id: '7', op: 'integrate', expr: 'x^2', from: 0, to: 3 })).toBeCloseTo(9, 3);
    expect(handleRequest({ id: '8', op: 'root', expr: 'x^2-2', from: 0, to: 2 })).toBeCloseTo(Math.SQRT2, 6);
  });

  it('supports matrix and statistics operations', () => {
    const matrix = handleRequest({
      id: '9',
      op: 'matrix',
      a: [
        [2, 1],
        [1, 3],
      ],
    }) as { determinant: number; inverse: number[][] };
    expect(matrix.determinant).toBe(5);
    expect(matrix.inverse[0][0]).toBeCloseTo(0.6, 10);

    const stats = handleRequest({ id: '10', op: 'stats', values: [2, 4, 4, 4, 5, 5, 7, 9] }) as Record<string, number>;
    expect(stats.mean).toBe(5);
    expect(stats.standardDeviation).toBeCloseTo(2.13809, 4);
  });

  it('computes linear regression', () => {
    const regression = handleRequest({
      id: '11',
      op: 'regression',
      x: [1, 2, 3, 4],
      y: [2, 4, 6, 8],
    }) as { slope: number; intercept: number; r2: number };
    expect(regression.slope).toBeCloseTo(2, 10);
    expect(regression.intercept).toBeCloseTo(0, 10);
    expect(regression.r2).toBeCloseTo(1, 10);
  });
});
