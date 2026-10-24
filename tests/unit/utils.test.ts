import { describe, expect, it } from 'vitest';
import { formatNumber, groupByDate, localizeDigits, normalizeDigits, clamp, debounce } from '@/lib/utils';
import { withBasePath, stripBasePath, BASE_PATH } from '@/lib/base-path';
import { normalizeText, rankedSearch, searchFormulas, relatedFormulas, getFormula } from '@/lib/formulas';

describe('number formatting', () => {
  it('formats finite numbers with a decimal cap', () => {
    expect(formatNumber(Math.PI, { decimals: 3 })).toBe('3.142');
    expect(formatNumber(1000, { decimals: 0 })).toBe('1,000');
  });

  it('renders Infinity and NaN safely', () => {
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe('∞');
    expect(formatNumber(Number.NaN)).toBe('NaN');
    expect(formatNumber(null)).toBe('—');
  });

  it('switches to scientific notation for extreme values', () => {
    expect(formatNumber(1e15)).toContain('e+15');
    expect(formatNumber(1e-9)).toContain('e-9');
  });

  it('converts to Persian and Arabic digits on demand', () => {
    expect(localizeDigits('2024', 'fa', 'native')).toBe('۲۰۲۴');
    expect(localizeDigits('2024', 'ar', 'native')).toBe('٢٠٢٤');
    expect(localizeDigits('2024', 'fa', 'latin')).toBe('2024');
  });

  it('normalises native digits back to ASCII', () => {
    expect(normalizeDigits('۱۲۳')).toBe('123');
    expect(normalizeDigits('٤٥٦')).toBe('456');
  });
});

describe('helpers', () => {
  it('clamps values', () => {
    expect(clamp(12, 0, 10)).toBe(10);
    expect(clamp(-1, 0, 10)).toBe(0);
  });

  it('debounces calls', async () => {
    let calls = 0;
    const fn = debounce(() => {
      calls += 1;
    }, 10);
    fn();
    fn();
    fn();
    expect(calls).toBe(0);
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(calls).toBe(1);
  });

  it('groups history timestamps by relative date', () => {
    const now = Date.now();
    const groups = groupByDate([now, now - 86_400_000, now - 5 * 86_400_000], 'en-US');
    expect(groups.map((group) => group.key)).toEqual(['today', 'yesterday', 'week']);
  });
});

describe('base path helpers', () => {
  it('prefixes internal paths exactly once', () => {
    expect(withBasePath('/search/')).toBe(`${BASE_PATH}/search/`);
    expect(withBasePath('search')).toBe(`${BASE_PATH}/search`);
    expect(withBasePath('https://example.com/x')).toBe('https://example.com/x');
  });

  it('strips the base path for route matching', () => {
    expect(stripBasePath(`${BASE_PATH}/history/`)).toBe('/history/');
    expect(stripBasePath('/unknown')).toBe('/unknown');
  });
});

describe('search', () => {
  it('normalises Persian variants', () => {
    expect(normalizeText('ميانه')).toBe(normalizeText('میانه'));
    expect(normalizeText('  دو  فاصله ')).toBe('دو فاصله');
  });

  it('finds formulas by Persian name, English name, tag and id', () => {
    expect(searchFormulas('مثلث').length).toBeGreaterThan(0);
    expect(searchFormulas('pythagorean').some((formula) => formula.id === 'pythagorean')).toBe(true);
    expect(searchFormulas('pH').some((formula) => formula.id === 'ph')).toBe(true);
    expect(searchFormulas('bmi')[0].id).toBe('bmi');
  });

  it('ranks exact matches first', () => {
    const results = rankedSearch('quadratic');
    expect(results[0].id).toBe('quadratic');
  });

  it('filters by difficulty, category and bookmarks', () => {
    const basic = searchFormulas('', { difficulty: 'basic' });
    expect(basic.every((formula) => formula.difficulty === 'basic')).toBe(true);
    const maths = searchFormulas('', { category: 'math' });
    expect(maths.every((formula) => formula.category_path[0] === 'ریاضیات')).toBe(true);
    const starred = searchFormulas('', { onlyBookmarked: true, bookmarks: ['ph'] });
    expect(starred.map((formula) => formula.id)).toEqual(['ph']);
  });

  it('returns no results for nonsense queries', () => {
    expect(searchFormulas('zzzz-not-a-formula')).toHaveLength(0);
  });

  it('suggests related formulas from the same sub-category', () => {
    const related = relatedFormulas(getFormula('quadratic')!, 3);
    expect(related.length).toBeGreaterThan(0);
    expect(related.every((formula) => formula.id !== 'quadratic')).toBe(true);
  });
});
