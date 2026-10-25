import { describe, expect, it } from 'vitest';
import { symbolicAnalysis, solveInverse, sensitivityAnalysis, propagateUncertainty, dimensionOfUnit, dimensionLabel, dimensionsEqual, verificationCode, integrateOde, formatSignificant } from '@/lib/advanced-math';
import { runPipeline, resolveStepInputs } from '@/lib/pipeline';
import { checkWork } from '@/lib/check-work';
import { jalaliToGregorian, gregorianToJalali, isJalaliLeap, jalaliAge, netSalaryIran, mehriehAtCurrentRate } from '@/lib/iran-tools';
import { welchTTest, oneSampleTTest, oneWayAnova, chiSquareIndependence, multipleRegression, tPValue, normalQuantile } from '@/lib/stats-inference';

describe('symbolic CAS', () => {
  it('differentiates polynomials and trig', () => {
    expect(symbolicAnalysis('x^3').derivative).toBe('3*x^2');
    expect(symbolicAnalysis('sin(x)').derivative).toBe('cos(x)');
    expect(symbolicAnalysis('x^2+3*x').antiderivative).toBeTruthy();
    expect(symbolicAnalysis('exp(2*x)').antiderivative).toBeNull();
    expect(symbolicAnalysis('x^2', 3).derivativeValue).toBeCloseTo(6);
  });
  it('solves inverse numerically', () => {
    const s = solveInverse((x) => x*x, 16, { guess: 1 });
    expect(s!.x).toBeCloseTo(4, 6);
    expect(solveInverse((x) => x*x, -1, { guess: 1 })).toBeNull();
  });
  it('sensitivity and uncertainty are deterministic', () => {
    const sens = sensitivityAnalysis(['a','b'], {a:2,b:1}, ({a,b}) => a*a+b);
    expect(sens[0].name).toBe('a');
    const u = propagateUncertainty({a:10}, {a:1}, ({a}) => a*2, 100, 7);
    expect(u.mean).toBeGreaterThan(19); expect(u.mean).toBeLessThan(21); expect(u.p95).toBeGreaterThan(u.p5);
    const u2 = propagateUncertainty({a:10}, {a:1}, ({a}) => a*2, 100, 7);
    expect(u2.mean).toBe(u.mean);
  });
  it('dimensions', () => {
    expect(dimensionLabel(dimensionOfUnit('m/s'))).toBe('L·T⁻¹');
    expect(dimensionsEqual(dimensionOfUnit('N'), dimensionOfUnit('kg*m/s^2'))).toBe(true);
    expect(dimensionOfUnit('furlong')).toBeNull();
    expect(formatSignificant(123456, 3)).toBe('123000');
    expect(verificationCode({a:1})).toMatch(/^SE-/);
  });
  it('integrates ODE RK4', () => {
    const pts = integrateOde('-y', 0, 1, 1, 100);
    expect(pts[pts.length-1].y).toBeCloseTo(Math.exp(-1), 4);
  });
});
describe('pipeline', () => {
  it('chains outputs to inputs', async () => {
    const steps = [
      { id:'1', formulaId:'a', bindings:[{input:'x', source:{kind:'literal' as const, value:'3'}}]},
      { id:'2', formulaId:'b', bindings:[{input:'y', source:{kind:'step' as const, stepIndex:0, output:'sq'}}]},
    ];
    expect(resolveStepInputs(steps[1], [{stepId:'1',formulaId:'a',inputs:{},values:{sq:9},steps:[]}])).toEqual({y:9});
    const run = await runPipeline(steps as never, async (id, inputs) => id==='a' ? {values:{sq:9}, steps:[]} : {values:{done:Number(inputs.y)+1}, steps:[]});
    expect(run.finalValues.done).toBe(10);
  });
});
describe('check work', () => {
  it('flags arithmetic and accepts correct lines', () => {
    expect(checkWork('2+3=5\nx=5', 5).firstErrorIndex).toBeNull();
    const bad = checkWork('2+3=6');
    expect(bad.firstErrorIndex).toBe(0); expect(bad.lines[0].issue).toBe('arithmetic-error');
    expect(checkWork('2+3=-5').lines[0].issue).toBe('sign-error');
  });
});
describe('iran tools', () => {
  it('converts Jalali anchors', () => {
    expect(jalaliToGregorian(1403,1,1)).toEqual({gy:2024,gm:3,gd:20});
    expect(gregorianToJalali(2024,3,20)).toEqual({jy:1403,jm:1,jd:1});
    expect(isJalaliLeap(1403)).toBe(true);
    expect(jalaliAge({jy:1380,jm:1,jd:1},{jy:1403,jm:1,jd:1}).years).toBe(23);
  });
  it('salary and mehrieh with user rates', () => {
    const s = netSalaryIran({gross:1000, insuranceRatePercent:7, taxRatePercent:10, taxExemptMonthly:0});
    expect(s.netPay).toBeCloseTo(830);
    expect(mehriehAtCurrentRate(100, 50, 200)).toBe(400);
  });
});
describe('stats inference', () => {
  it('t-test known values', () => {
    expect(tPValue(0, 10)).toBeCloseTo(1);
    expect(normalQuantile(0.975)).toBeCloseTo(1.96, 2);
    const r = welchTTest([1,2,3,4,5],[2,3,4,5,6]);
    expect(r.t).toBeLessThan(0); expect(r.pTwoTailed).toBeGreaterThan(0.1);
    expect(oneSampleTTest([2,3,4,5,6],4).t).toBeCloseTo(0);
  });
  it('anova chi2 regression', () => {
    const a = oneWayAnova([[1,2,3],[4,5,6],[7,8,9]]);
    expect(a.f).toBeGreaterThan(10); expect(a.pValue).toBeLessThan(0.05);
    const c = chiSquareIndependence([[10,20],[20,10]]);
    expect(c.df).toBe(1); expect(c.chi2).toBeCloseTo(6.6667, 3);
    const reg = multipleRegression([3,5,7,9,11], [[1,2,3,4,5]]);
    expect(reg.coefficients[1]).toBeCloseTo(2); expect(reg.rSquared).toBeCloseTo(1);
  });
});

import { createBackup, parseBackup } from '@/lib/backup';
import { createCustomFormula, evaluateCustomFormula, exportCustomFormulas, extractVariables, importCustomFormulas } from '@/lib/custom-formulas';

describe('backup and custom formulas (v5)', () => {
  it('round-trips a checksummed backup and rejects tampering', () => {
    const text = createBackup({ settings: { language: 'fa' }, history: [], bookmarks: ['quadratic'], evil: 1 }, '5.0.0');
    const clean = parseBackup(text);
    expect(clean.bookmarks).toEqual(['quadratic']);
    expect('evil' in clean).toBe(false);
    expect(() => parseBackup(text.replace('quadratic', 'tampered!'))).toThrow();
  });
  it('builds, evaluates and shares custom formulas safely', () => {
    const formula = createCustomFormula('Kinetic', '0.5*m*v^2');
    expect(extractVariables('sqrt(x)+sin(y)')).toEqual(['x', 'y']);
    expect(formula.variables).toEqual(['m', 'v']);
    expect(evaluateCustomFormula(formula, { m: 2, v: 10 })).toBe(100);
    const imported = importCustomFormulas(exportCustomFormulas([formula]));
    expect(imported[0].expression).toBe('0.5*m*v^2');
    expect(() => createCustomFormula('Bad', 'alert(1)')).toThrow();
  });
});
