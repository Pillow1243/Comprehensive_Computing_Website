import { describe, expect, it } from 'vitest';
import { computeFormula, workerPoolSize } from '@/lib/compute-client';
import { loadFormula } from '@/lib/formulas';

/**
 * jsdom has no `Worker`, which is the same situation as a browser where the
 * worker script is blocked. The client must fail fast and compute locally
 * instead of hanging on a request that can never be served.
 */
describe('compute client fallback', () => {
  it('computes locally when no Worker is available', async () => {
    const formula = (await loadFormula('quadratic'))!;
    const result = await computeFormula(formula, { a: 1, b: -5, c: 6 });
    expect(result.values).toMatchObject({ x1: 3, x2: 2, discriminant: 1 });
    expect(result.steps.length).toBeGreaterThan(0);
    expect(workerPoolSize()).toBe(0);
  });

  it('falls back without waiting for the worker timeout', async () => {
    const formula = (await loadFormula('compound_interest'))!;
    const started = performance.now();
    const result = await computeFormula(formula, {
      PV: 10_000,
      rate: 8,
      years: 10,
      m: 12,
    });
    expect(result.values).toMatchObject({ future_value: 22196.4 });
    expect(performance.now() - started).toBeLessThan(5_000);
  });

  it('propagates solver errors as user-facing failures', async () => {
    const formula = (await loadFormula('heron'))!;
    await expect(computeFormula(formula, { a: 1, b: 2, c: 10 })).rejects.toThrow(/نامساوی/);
  });
});
