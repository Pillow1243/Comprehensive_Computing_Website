import { describe, expect, it } from 'vitest';
import { assertFiniteOutputs, describeError, FormulaError, validateInputs } from '@/lib/validation';
import { loadFormula } from '@/lib/formulas';

const quadratic = await loadFormula('quadratic');
const lcm = await loadFormula('gcd_lcm');
const means = await loadFormula('means');

describe('validateInputs', () => {
  it('accepts valid numeric input', () => {
    const result = validateInputs(quadratic!, { a: '1', b: '-5', c: '6' });
    expect(result.ok).toBe(true);
    expect(result.values).toEqual({ a: 1, b: -5, c: 6 });
  });

  it('falls back to declared defaults when a field is left empty', () => {
    const filled = validateInputs(quadratic!, { a: '', b: '', c: '' });
    expect(filled.ok).toBe(true);
    expect(filled.values).toEqual({ a: 1, b: -5, c: 6 });
  });

  it('rejects empty required values with a localised message', () => {
    const strict = {
      ...quadratic!,
      variables: [
        { name: 'a', label_fa: 'ضریب a', label_en: 'a', type: 'number' as const, unit: null, required: true },
        { name: 'b', label_fa: 'ضریب b', label_en: 'b', type: 'number' as const, unit: null, required: true },
      ],
    };
    const fa = validateInputs(strict, { a: '', b: '' }, { lang: 'fa' });
    expect(fa.ok).toBe(false);
    expect(fa.errors.a).toContain('الزامی');
    const en = validateInputs(strict, { a: '', b: '' }, { lang: 'en' });
    expect(en.errors.a).toContain('required');
  });

  it('rejects NaN, Infinity and out-of-range values', () => {
    expect(validateInputs(quadratic!, { a: 'abc', b: 1, c: 1 }).errors.a).toBeTruthy();
    expect(validateInputs(quadratic!, { a: 'NaN', b: 1, c: 1 }).errors.a).toBeTruthy();
    const polygon = validateInputs(
      { ...quadratic!, variables: [{ ...quadratic!.variables[0], min: 0, max: 10 }] },
      { a: 42 },
    );
    expect(polygon.ok).toBe(false);
    expect(polygon.errors.a).toContain('محدوده');
  });

  it('understands Persian digits, fractions and safe math expressions', () => {
    expect(validateInputs(lcm!, { a: '۴۸', b: '۳۶' }).values).toEqual({ a: 48, b: 36 });
    const expr = validateInputs(quadratic!, { a: '2/2', b: 'pi-pi', c: 'sqrt(9)' });
    expect(expr.ok).toBe(true);
    expect(expr.values.c).toBeCloseTo(3, 10);
    expect(expr.values.b).toBe(0);
  });

  it('keeps text variables untouched', () => {
    const result = validateInputs(means!, { data: '2,4,8' });
    expect(result.ok).toBe(true);
    expect(result.values.data).toBe('2,4,8');
  });
});

describe('assertFiniteOutputs', () => {
  it('throws a FormulaError with context for NaN/Infinity', () => {
    expect(() => assertFiniteOutputs(quadratic!, { x1: Number.NaN }, { a: 0 })).toThrow(FormulaError);
    try {
      assertFiniteOutputs(quadratic!, { x1: Number.POSITIVE_INFINITY }, { a: 0 });
    } catch (error) {
      const formulaError = error as FormulaError;
      expect(formulaError.code).toBe('non-finite');
      expect(formulaError.field).toBe('x1');
      expect(formulaError.formulaId).toBe('quadratic');
    }
  });

  it('accepts strings, booleans and finite numbers', () => {
    expect(() => assertFiniteOutputs(quadratic!, { x1: 3, label: 'ok', flag: true }, {})).not.toThrow();
  });
});

describe('describeError', () => {
  it('hides stack traces and produces actionable copy', () => {
    const described = describeError(new Error('boom'), 'en');
    expect(described.title).toBe('Calculation failed');
    expect(described.message).not.toContain('at ');
    expect(described.code).toBe('compute');
  });

  it('maps timeouts to a dedicated message', () => {
    const described = describeError(
      new FormulaError('timeout', 'timed out', { formulaId: 'quadratic' }),
      'fa',
    );
    expect(described.title).toContain('زمان');
  });
});
