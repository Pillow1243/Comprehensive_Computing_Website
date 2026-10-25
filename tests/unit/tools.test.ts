import { describe, expect, it } from 'vitest';
import {
  UNIT_CATEGORIES,
  convertUnit,
  formatUnitValue,
  unitCategory,
  type UnitCategory,
} from '@/lib/units';
import { analyzeFormula } from '@/lib/chemistry';
import {
  ELEMENTS,
  ELEMENT_BY_SYMBOL,
  ELEMENT_GROUPS,
  elementPosition,
} from '@/lib/periodic-table';
import { CONSTANTS } from '@/lib/constants';
import { TOOLS } from '@/lib/tools';

describe('unit conversion', () => {
  it('exposes every category with a base unit present in the table', () => {
    for (const category of UNIT_CATEGORIES) {
      expect(category.units[category.base], `${category.id} base unit`).toBeTruthy();
    }
  });

  it('uses unique ids and symbols', () => {
    const ids = UNIT_CATEGORIES.map((category) => category.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const category of UNIT_CATEGORIES) {
      const symbols = Object.keys(category.units);
      expect(new Set(symbols).size).toBe(symbols.length);
    }
  });

  it('converts length, mass, pressure and data', () => {
    expect(convertUnit(1, 'length', 'km', 'm')).toBeCloseTo(1000, 9);
    expect(convertUnit(1, 'length', 'mi', 'ft')).toBeCloseTo(5280, 6);
    expect(convertUnit(1, 'mass', 'lb', 'g')).toBeCloseTo(453.59237, 6);
    expect(convertUnit(1, 'pressure', 'atm', 'Pa')).toBeCloseTo(101325, 6);
    expect(convertUnit(1, 'data', 'KiB', 'B')).toBe(1024);
    expect(convertUnit(1, 'data', 'MB', 'B')).toBe(1_000_000);
  });

  it('handles offset temperatures in both directions', () => {
    expect(convertUnit(0, 'temperature', 'C', 'K')).toBeCloseTo(273.15, 9);
    expect(convertUnit(100, 'temperature', 'C', 'F')).toBeCloseTo(212, 9);
    expect(convertUnit(-40, 'temperature', 'C', 'F')).toBeCloseTo(-40, 9);
    expect(convertUnit(32, 'temperature', 'F', 'C')).toBeCloseTo(0, 9);
    expect(convertUnit(491.67, 'temperature', 'R', 'F')).toBeCloseTo(32, 6);
  });

  it('round-trips every unit pair in every category', () => {
    for (const category of UNIT_CATEGORIES) {
      const symbols = Object.keys(category.units) as string[];
      for (const from of symbols) {
        for (const to of symbols) {
          const once = convertUnit(3.14, category.id as UnitCategory, from, to);
          const back = convertUnit(once, category.id as UnitCategory, to, from);
          expect(back, `${category.id}:${from}->${to}`).toBeCloseTo(3.14, 6);
        }
      }
    }
  });

  it('rejects unknown units', () => {
    expect(() => convertUnit(1, 'length', 'parsec-ish', 'm')).toThrow();
    expect(unitCategory('length').base).toBe('m');
  });

  it('formats extreme values without losing the magnitude', () => {
    expect(formatUnitValue(1e15)).toMatch(/e\+?15/);
    expect(formatUnitValue(0.0000001)).toMatch(/e-7/);
    expect(formatUnitValue(Number.NaN)).toBe('—');
  });
});

describe('chemistry', () => {
  it('computes the molar mass of water', () => {
    const analysis = analyzeFormula('H2O');
    expect(analysis.molarMass).toBeCloseTo(18.015, 3);
    expect(analysis.entries.find((entry) => entry.element.symbol === 'H')?.count).toBe(2);
  });

  it('parses nested parentheses', () => {
    const analysis = analyzeFormula('Ca(OH)2');
    expect(analysis.molarMass).toBeCloseTo(74.092, 2);
    expect(analysis.entries.find((entry) => entry.element.symbol === 'O')?.count).toBe(2);
  });

  it('parses multiple groups and hydrates', () => {
    const gypsum = analyzeFormula('CaSO4·2H2O');
    expect(gypsum.molarMass).toBeCloseTo(172.166, 2);
    const sulfate = analyzeFormula('Fe2(SO4)3');
    expect(sulfate.entries.find((entry) => entry.element.symbol === 'S')?.count).toBe(3);
  });

  it('reports percentages that sum to 100', () => {
    const analysis = analyzeFormula('C6H12O6');
    const total = analysis.entries.reduce((sum, entry) => sum + entry.percent, 0);
    expect(total).toBeCloseTo(100, 6);
    expect(analysis.molarMass).toBeCloseTo(180.156, 2);
  });

  it('rejects malformed formulas', () => {
    expect(() => analyzeFormula('')).toThrow();
    expect(() => analyzeFormula('Ca(OH2')).toThrow();
    expect(() => analyzeFormula('Xx2')).toThrow();
  });
});

describe('periodic table', () => {
  it('contains 118 elements with unique symbols', () => {
    expect(ELEMENTS).toHaveLength(118);
    expect(new Set(ELEMENTS.map((element) => element.symbol)).size).toBe(118);
    expect(ELEMENTS.map((element) => element.z)).toEqual(
      Array.from({ length: 118 }, (_value, index) => index + 1),
    );
  });

  it('has positive atomic masses and a known group for every element', () => {
    for (const element of ELEMENTS) {
      expect(element.mass).toBeGreaterThan(0);
      expect(ELEMENT_GROUPS[element.group]).toBeTruthy();
      expect(ELEMENT_BY_SYMBOL.get(element.symbol.toLowerCase())).toBe(element);
    }
  });

  it('places the table landmarks in the expected cells', () => {
    expect(elementPosition(1)).toEqual({ row: 1, col: 1 });
    expect(elementPosition(2)).toEqual({ row: 1, col: 18 });
    expect(elementPosition(6)).toEqual({ row: 2, col: 14 });
    expect(elementPosition(26)).toEqual({ row: 4, col: 8 });
    expect(elementPosition(57)).toEqual({ row: 9, col: 3 });
    expect(elementPosition(71)).toEqual({ row: 9, col: 17 });
    expect(elementPosition(89)).toEqual({ row: 10, col: 3 });
    expect(elementPosition(104)).toEqual({ row: 7, col: 4 });
    expect(elementPosition(118)).toEqual({ row: 7, col: 18 });
  });

  it('never puts two elements in the same cell', () => {
    const seen = new Set<string>();
    for (const element of ELEMENTS) {
      const { row, col } = elementPosition(element.z);
      const key = `${row}:${col}`;
      expect(seen.has(key), `${element.symbol} collides at ${key}`).toBe(false);
      seen.add(key);
    }
  });
});

describe('constants and tools registry', () => {
  it('lists physical constants with SI units and unique symbols', () => {
    expect(CONSTANTS.length).toBeGreaterThan(25);
    const symbols = CONSTANTS.map((constant) => constant.symbol);
    expect(new Set(symbols).size).toBe(symbols.length);
    for (const constant of CONSTANTS) {
      expect(constant.nameFa).toBeTruthy();
      expect(constant.nameEn).toBeTruthy();
      expect(constant.unit).toBeTruthy();
      expect(Number.isFinite(constant.value)).toBe(true);
    }
  });

  it('keeps the speed of light and Planck constant exact', () => {
    const speedOfLight = CONSTANTS.find((constant) => constant.symbol === 'c');
    expect(speedOfLight?.value).toBe(299792458);
    expect(speedOfLight?.exact).toBe(true);
    const planck = CONSTANTS.find((constant) => constant.symbol === 'h');
    expect(planck?.value).toBeCloseTo(6.62607015e-34, 40);
  });

  it('registers the tools hub routes', () => {
    expect(TOOLS.map((tool) => tool.id)).toEqual([
      'graph',
      'assistant',
      'matrix',
      'statistics',
      'units',
      'chemistry',
      'periodic-table',
      'constants',
      'practice',
      'learn',
      'workspace',
    ]);
    for (const tool of TOOLS) {
      expect(tool.href.startsWith('/')).toBe(true);
      expect(tool.fa).toBeTruthy();
      expect(tool.en).toBeTruthy();
    }
  });
});

describe('display helpers', () => {
  it('translates category segments for the English UI', async () => {
    const { categorySegment, categoryPathLabel } = await import('@/lib/category-names');
    expect(categorySegment('جبر', 'en')).toBe('Algebra');
    expect(categorySegment('جبر', 'fa')).toBe('جبر');
    expect(categorySegment('ناشناخته', 'en')).toBe('ناشناخته');
    expect(categoryPathLabel(['ریاضیات', 'جبر'], 'en')).toBe('Mathematics · Algebra');
  });

  it('gives every raw result key a human label', async () => {
    const { humanizeOutput, hasHumanLabel } = await import('@/lib/output-labels');
    expect(humanizeOutput('distance_km', 'distance_km', 'fa')).toBe('فاصله (km)');
    expect(humanizeOutput('area', 'area', 'fa')).toBe('مساحت');
    expect(humanizeOutput('area', 'area', 'en')).toBe('Area');
    expect(humanizeOutput('unknown_key', 'unknown_key', 'fa')).toBe('unknown key');
    expect(humanizeOutput('x1', 'x₁', 'fa')).toBe('x₁');
    expect(hasHumanLabel('pH')).toBe(true);
  });
});
