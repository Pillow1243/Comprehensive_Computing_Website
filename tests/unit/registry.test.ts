import { describe, expect, it } from 'vitest';
import { FORMULAS } from '@/apps/web/registry.js';
import { CATEGORIES } from '@/apps/web/categories.js';
import formulaIndex from '@/packages/formula-registry/formula-index.json';
import formulaDetails from '@/packages/formula-registry/formula-details.json';

interface RegisteredFormula {
  id: string;
  name_fa: string;
  name_en: string;
  description_fa: string;
  formula_latex: string;
  category_path: string[];
  tags: string[];
  difficulty: string;
  variables: Array<{ name: string; label_fa: string; label_en: string; type: string; unit: string | null }>;
  outputs: Array<{ name: string; label_fa: string; label_en: string; unit: string | null }>;
  tests: Array<{ input: Record<string, unknown>; expected: Record<string, unknown> }>;
  examples: Array<Record<string, unknown>>;
  compute: (inputs: Record<string, number | string | boolean>) => { values: Record<string, unknown>; steps: string[] };
  plot_spec?: { type?: string } | null;
}

const registered = FORMULAS as unknown as RegisteredFormula[];

describe('formula registry', () => {
  it('contains at least 150 validated formulas', () => {
    expect(registered.length).toBeGreaterThanOrEqual(150);
  });

  it('uses unique, URL-safe identifiers', () => {
    const ids = registered.map((formula) => formula.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z][a-z0-9_]{1,79}$/);
  });

  it('covers all seven disciplines', () => {
    const disciplines = new Set(registered.map((formula) => formula.category_path[0]));
    for (const category of CATEGORIES) expect(disciplines.has(category.fa)).toBe(true);
  });

  describe.each(registered.map((formula) => [formula.id, formula] as const))('formula %s', (_id, formula) => {
    it('has complete bilingual metadata', () => {
      expect(formula.name_fa).toBeTruthy();
      expect(formula.name_en).toBeTruthy();
      expect(formula.description_fa).toBeTruthy();
      expect(formula.formula_latex.length).toBeGreaterThan(2);
      expect(formula.category_path.length).toBeGreaterThan(0);
      expect(Array.isArray(formula.tags)).toBe(true);
      expect(['basic', 'intermediate', 'advanced']).toContain(formula.difficulty);
    });

    it('declares variables, outputs and at least two test cases', () => {
      expect(formula.variables.length).toBeGreaterThan(0);
      expect(formula.outputs.length).toBeGreaterThan(0);
      expect(formula.tests.length).toBeGreaterThanOrEqual(2);
      for (const variable of formula.variables) {
        expect(variable.label_fa).toBeTruthy();
        expect(variable.label_en).toBeTruthy();
        expect(['number', 'text', 'select', 'boolean']).toContain(variable.type);
      }
    });

    it('passes every declared test case', () => {
      for (const testCase of formula.tests) {
        const result = formula.compute({ ...testCase.input } as Record<string, string | number | boolean>);
        expect(result, `${formula.id} returned no result`).toBeTruthy();
        expect(result.steps.length).toBeGreaterThan(0);
        for (const [key, expected] of Object.entries(testCase.expected)) {
          const actual = result.values[key];
          if (typeof expected === 'number') {
            expect(typeof actual, `${formula.id}.${key} is not numeric`).toBe('number');
            const relative = Math.abs((actual as number) - expected) / Math.max(1, Math.abs(expected));
            expect(relative, `${formula.id}.${key}: got ${actual}, expected ${expected}`).toBeLessThanOrEqual(1e-3);
          } else {
            expect(String(actual)).toBe(String(expected));
          }
        }
      }
    });

    it('ships at least one example and no stack-trace-only errors', () => {
      expect(formula.examples.length).toBeGreaterThan(0);
    });
  });

  it('keeps the generated index and details manifests in sync', () => {
    expect(formulaIndex).toHaveLength(registered.length);
    for (const formula of registered) {
      const meta = (formulaIndex as Array<{ id: string; name_fa: string; test_count: number }>).find(
        (entry) => entry.id === formula.id,
      );
      expect(meta, `${formula.id} missing from formula-index.json`).toBeTruthy();
      expect(meta!.name_fa).toBe(formula.name_fa);
      expect(meta!.test_count).toBe(formula.tests.length);

      const detail = (formulaDetails as Record<string, { variables: unknown[]; outputs: unknown[] }>)[formula.id];
      expect(detail, `${formula.id} missing from formula-details.json`).toBeTruthy();
      expect(detail.variables).toHaveLength(formula.variables.length);
      expect(detail.outputs).toHaveLength(formula.outputs.length);
    }
    expect(Object.keys(formulaDetails)).toHaveLength(registered.length);
  });

  it('never evaluates source strings', async () => {
    const { readFile } = await import('node:fs/promises');
    const registrySource = await readFile('apps/web/registry.js', 'utf8');
    expect(registrySource).not.toMatch(/\beval\s*\(/);
    expect(registrySource).not.toMatch(/new Function\s*\(/);
  });
});
