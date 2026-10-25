/**
 * Custom formula builder (v5) — define your own calculator from a safe
 * expression, run it, keep it on-device and share it as JSON. Expressions go
 * through the same no-`eval` evaluator as the rest of the app, and a shared
 * definition can never execute code: it is data plus an expression string
 * that is fully re-validated on import.
 */
import { evaluateExpression } from '@/lib/expression';

export interface CustomFormula {
  id: string;
  name: string;
  expression: string;
  variables: string[];
  createdAt: number;
}

const STORAGE_KEY = 'solveeverything.custom-formulas.v1';
const FUNCTIONS_AND_CONSTANTS = new Set([
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh',
  'sec', 'csc', 'cot', 'sqrt', 'cbrt', 'ln', 'log', 'log2', 'log10', 'exp',
  'abs', 'floor', 'ceil', 'round', 'sign', 'min', 'max', 'ncr', 'npr',
  'pi', 'e', 'tau', 'phi',
]);

/** Extract free variable names (identifiers that are not functions/constants). */
export function extractVariables(expression: string): string[] {
  const names: string[] = [];
  const pattern = /[A-Za-z_][A-Za-z0-9_]*/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(expression)) !== null) {
    const name = match[0];
    const after = expression.slice(pattern.lastIndex).trimStart();
    if (after.startsWith('(') && FUNCTIONS_AND_CONSTANTS.has(name)) continue;
    if (FUNCTIONS_AND_CONSTANTS.has(name)) continue;
    if (!names.includes(name)) names.push(name);
  }
  return names;
}

export function createCustomFormula(name: string, expression: string): CustomFormula {
  const trimmedName = name.trim();
  const trimmedExpression = expression.trim();
  if (!trimmedName) throw new Error('A name is required');
  if (!trimmedExpression) throw new Error('The expression is not valid');
  const variables = extractVariables(trimmedExpression);
  if (!variables.length) throw new Error('The expression needs at least one variable');
  // Validate by evaluating with every free variable bound (two probe points,
  // so domain-sensitive expressions like ln(m) still get a fair check). The
  // shared isValidExpression only binds x, which would reject m/v formulas.
  const probes = [1.5, 0.7];
  const valid = probes.some((probe) => {
    try {
      const vars = Object.fromEntries(variables.map((variable) => [variable, probe]));
      return Number.isFinite(evaluateExpression(trimmedExpression, vars));
    } catch {
      return false;
    }
  });
  if (!valid) throw new Error('The expression is not valid');
  return {
    id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: trimmedName.slice(0, 80),
    expression: trimmedExpression.slice(0, 300),
    variables,
    createdAt: Date.now(),
  };
}

export function evaluateCustomFormula(formula: CustomFormula, inputs: Record<string, number>): number {
  const value = evaluateExpression(formula.expression, inputs);
  if (!Number.isFinite(value)) throw new Error('The result is not finite for these inputs');
  return value;
}

/** Serialise a set of custom formulas for sharing. */
export function exportCustomFormulas(formulas: CustomFormula[]): string {
  return `${JSON.stringify({ schema: 'solveeverything.custom-formulas/v1', formulas }, null, 2)}\n`;
}

/** Import shared definitions, re-validating every expression from scratch. */
export function importCustomFormulas(text: string): CustomFormula[] {
  const parsed = JSON.parse(text) as { formulas?: unknown };
  if (!Array.isArray(parsed.formulas)) throw new Error('No formulas in this file');
  const imported: CustomFormula[] = [];
  for (const candidate of parsed.formulas.slice(0, 100)) {
    if (!candidate || typeof candidate !== 'object') continue;
    const record = candidate as Partial<CustomFormula>;
    if (typeof record.name !== 'string' || typeof record.expression !== 'string') continue;
    try {
      const created = createCustomFormula(record.name, record.expression);
      imported.push({ ...created, id: typeof record.id === 'string' ? record.id : created.id });
    } catch { /* skip invalid definitions instead of failing the whole import */ }
  }
  if (!imported.length) throw new Error('No valid formulas in this file');
  return imported;
}

export function loadCustomFormulas(): CustomFormula[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CustomFormula[];
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.expression === 'string') : [];
  } catch {
    return [];
  }
}

export function saveCustomFormulas(formulas: CustomFormula[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(formulas.slice(0, 100)));
  } catch { /* storage may be unavailable */ }
}
