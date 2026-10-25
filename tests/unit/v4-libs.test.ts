import { describe, expect, it } from 'vitest';
import {
  derivativeAt,
  evaluateExpression,
  findRoots,
  integrateRange,
  isValidExpression,
  sampleExpression,
} from '@/lib/expression';
import {
  determinant,
  eigenvalues2x2,
  frobeniusNorm,
  inverseMatrix,
  matrixRank,
  matrixToText,
  multiplyMatrices,
  parseMatrixText,
  solveLinearSystem,
} from '@/lib/matrix';
import { descriptiveStats, histogramBins, linearRegression, parseDataset } from '@/lib/data-lab';
import { editDistance, smartSearch, suggestCorrections } from '@/lib/smart-search';
import { dailyChallenge, levelFromXp, localDayKey, xpReward } from '@/lib/quiz';
import { nextStepFormulas, relatedFormulasV4 } from '@/lib/related';
import { analyzeTextProblem, extractNumbers } from '@/lib/text-solver';
import { LEARN_PATHS, pathProgress } from '@/lib/learn-paths';
import { calculationAsLatex, calculationAsMarkdown } from '@/lib/calculation-export';
import { getFormula } from '@/lib/formulas';
import { defaultSettingsForTests } from '@/lib/store';

describe('expression evaluator (v4)', () => {
  it('respects precedence, powers and constants', () => {
    expect(evaluateExpression('2+3*4')).toBe(14);
    expect(evaluateExpression('2^3^1')).toBe(8);
    expect(evaluateExpression('sin(pi/2)')).toBeCloseTo(1, 10);
    expect(evaluateExpression('x^2 + 1', { x: 5 })).toBe(26);
  });

  it('supports implicit multiplication', () => {
    expect(evaluateExpression('2x', { x: 3 })).toBe(6);
    expect(evaluateExpression('2(3+1)')).toBe(8);
    expect(evaluateExpression('(x+1)(x-1)', { x: 4 })).toBe(15);
  });

  it('validates expressions without throwing', () => {
    expect(isValidExpression('sqrt(9) + x')).toBe(true);
    expect(isValidExpression('2 +')).toBe(false);
    expect(isValidExpression('')).toBe(false);
  });

  it('differentiates, integrates and finds roots numerically', () => {
    expect(derivativeAt('x^2', 3)).toBeCloseTo(6, 3);
    expect(integrateRange('x', 0, 2)).toBeCloseTo(2, 2);
    const roots = findRoots('x^2 - 4', -5, 5);
    expect(roots.length).toBe(2);
    expect(roots[0]).toBeCloseTo(-2, 2);
    expect(roots[1]).toBeCloseTo(2, 2);
  });

  it('samples plottable points', () => {
    const points = sampleExpression('x^2', -2, 2, 9);
    expect(points.length).toBe(9);
    expect(points[4].y!).toBeCloseTo(0, 10);
    expect(points[8].y!).toBeCloseTo(4, 10);
  });
});

describe('matrix lab (v4)', () => {
  it('computes determinant, inverse and products', () => {
    expect(determinant([[1, 2], [3, 4]])).toBeCloseTo(-2, 10);
    const inverse = inverseMatrix([[4, 7], [2, 6]]);
    expect(inverse[0][0]).toBeCloseTo(0.6, 10);
    expect(inverse[0][1]).toBeCloseTo(-0.7, 10);
    const product = multiplyMatrices([[1, 2], [3, 4]], [[5, 6], [7, 8]]);
    expect(product).toEqual([[19, 22], [43, 50]]);
  });

  it('solves linear systems and 2x2 eigenproblems', () => {
    const solution = solveLinearSystem([[2, 1], [1, 3]], [5, 10]);
    expect(solution[0]).toBeCloseTo(1, 10);
    expect(solution[1]).toBeCloseTo(3, 10);
    const eigenvalues = eigenvalues2x2([[2, 1], [1, 2]]).map((value) => value.real).sort((a, b) => a - b);
    expect(eigenvalues[0]).toBeCloseTo(1, 10);
    expect(eigenvalues[1]).toBeCloseTo(3, 10);
  });

  it('ranks, measures and round-trips text form', () => {
    expect(matrixRank([[1, 2], [2, 4]])).toBe(1);
    expect(matrixRank([[1, 0], [0, 1]])).toBe(2);
    expect(frobeniusNorm([[3, 4], [0, 0]])).toBeCloseTo(5, 10);
    expect(parseMatrixText(matrixToText([[1, 2], [3, 4]]))).toEqual([[1, 2], [3, 4]]);
  });
});

describe('data lab (v4)', () => {
  it('parses Persian digits and x,y pairs', () => {
    expect(parseDataset('1, 2, ۳').values).toEqual([1, 2, 3]);
    const pairs = parseDataset('1, 2\n3, 4');
    expect(pairs.pairs).toEqual([{ x: 1, y: 2 }, { x: 3, y: 4 }]);
  });

  it('summarises a dataset', () => {
    const stats = descriptiveStats([1, 2, 3, 4]);
    expect(stats.mean).toBeCloseTo(2.5, 10);
    expect(stats.median).toBeCloseTo(2.5, 10);
    expect(stats.count).toBe(4);
    expect(histogramBins([1, 2, 2, 3, 3, 3, 4, 5, 6, 7]).length).toBeGreaterThan(0);
  });

  it('fits an exact regression line', () => {
    const fit = linearRegression([
      { x: 0, y: 1 },
      { x: 1, y: 3 },
      { x: 2, y: 5 },
      { x: 3, y: 7 },
    ]);
    expect(fit.slope).toBeCloseTo(2, 10);
    expect(fit.intercept).toBeCloseTo(1, 10);
    expect(Math.abs(fit.correlation)).toBeCloseTo(1, 10);
    expect(fit.predict(5)).toBeCloseTo(11, 10);
  });
});

describe('smart search (v4)', () => {
  it('measures edit distance', () => {
    expect(editDistance('abc', 'abc')).toBe(0);
    expect(editDistance('abc', 'abd')).toBe(1);
    expect(editDistance('abc', 'ab')).toBe(1);
  });

  it('finds formulas through synonyms with reasons attached', () => {
    const results = smartSearch('interest');
    expect(results.length).toBeGreaterThan(0);
    expect(results.slice(0, 4).map((result) => result.formula.id)).toContain('compound_interest');
    expect(results[0].reasons.length).toBeGreaterThan(0);
  });

  it('suggests corrections for typos', () => {
    const suggestions = suggestCorrections('quadratc');
    expect(suggestions.length).toBeGreaterThan(0);
    const recovered = smartSearch(suggestions[0]);
    expect(recovered.length).toBeGreaterThan(0);
  });
});

describe('quiz engine (v4)', () => {
  it('builds a deterministic daily challenge', () => {
    const first = dailyChallenge('2026-10-25');
    const second = dailyChallenge('2026-10-25');
    expect(first).toEqual(second);
    expect(first.length).toBe(5);
    for (const question of first) {
      expect(question.answerIndex).toBeGreaterThanOrEqual(0);
      expect(question.answerIndex).toBeLessThan(question.choices.length);
      expect(question.promptFa.length).toBeGreaterThan(0);
      expect(question.promptEn.length).toBeGreaterThan(0);
    }
    expect(dailyChallenge('2026-10-26')).not.toEqual(first);
  });

  it('levels and rewards grow monotonically', () => {
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(10_000).level).toBeGreaterThan(levelFromXp(100).level);
    expect(xpReward(3, 0)).toBeGreaterThan(xpReward(1, 0));
    expect(localDayKey(new Date(2026, 9, 25))).toBe('2026-10-25');
  });
});

describe('related formulas (v4)', () => {
  it('never recommends the formula itself', () => {
    const quadratic = getFormula('quadratic')!;
    const related = relatedFormulasV4(quadratic);
    expect(related.length).toBe(6);
    expect(related.map((formula) => formula.id)).not.toContain('quadratic');
    expect(nextStepFormulas(quadratic).length).toBeLessThanOrEqual(3);
  });
});

describe('word-problem assistant (v4)', () => {
  it('extracts Latin and Persian numbers', () => {
    expect(extractNumbers('سرعت ۱۰ متر و زمان 3 ثانیه')).toEqual([10, 3]);
  });

  it('routes a kinematics story to the kinematics solver', () => {
    const suggestions = analyzeTextProblem(
      'جسمی با سرعت اولیهٔ ۱۰ متر بر ثانیه و شتاب ۲ حرکت می‌کند؛ سرعتش پس از ۳ ثانیه چقدر است؟',
    );
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].formulaId).toBe('kinematics');
  });
});

describe('learning paths (v4)', () => {
  it('only references real formulas', () => {
    expect(LEARN_PATHS.length).toBe(8);
    for (const path of LEARN_PATHS) {
      for (const id of path.formulaIds) expect(getFormula(id), `${path.id}:${id}`).toBeTruthy();
    }
  });

  it('derives progress from a done set', () => {
    const path = LEARN_PATHS[0];
    const empty = pathProgress(path, new Set());
    expect(empty.percent).toBe(0);
    expect(empty.nextFormulaId).toBe(path.formulaIds[0]);
    const full = pathProgress(path, new Set(path.formulaIds));
    expect(full.completed).toBe(true);
    expect(full.percent).toBe(100);
  });
});

describe('calculation reports (v4)', () => {
  const record = {
    formula_id: 'demo',
    formula_name: 'Demo Formula',
    formula_latex: 'y = x^2',
    inputs: { x: 3 },
    input_units: { x: 'm' },
    outputs: { y: 9 },
    output_units: { y: 'm²' },
    steps: ['Square the input'],
    created_at: '2026-10-25T00:00:00.000Z',
  };

  it('renders a Markdown report', () => {
    const md = calculationAsMarkdown(record);
    expect(md).toContain('# Demo Formula');
    expect(md).toContain('| x | 3 | m |');
    expect(md).toContain('Square the input');
  });

  it('renders a LaTeX section', () => {
    const tex = calculationAsLatex(record);
    expect(tex).toContain('Demo Formula');
    expect(tex.length).toBeGreaterThan(40);
  });
});

describe('accent setting (v4.1)', () => {
  it('defaults to the violet palette', () => {
    expect(defaultSettingsForTests.accent).toBe('violet');
  });
});
