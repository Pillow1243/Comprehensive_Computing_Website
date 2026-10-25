'use client';

import type { Formula } from '@/lib/formulas';
import { FormulaErrorBoundary } from '@/components/formula-error-boundary';
import { FormulaSolver } from '@/components/formula-solver';

/**
 * Client island for a formula.
 *
 * The whole manifest slice, the build-time KaTeX markup and the one-line
 * summary arrive as props from the static page, so hydration only has to attach
 * the solver — it never fetches JSON or a math renderer before the first paint.
 */
export function FormulaDetail({
  formula,
  formulaHtml,
  description,
}: {
  formula: Formula;
  formulaHtml?: string;
  description?: string;
}) {
  return (
    <FormulaErrorBoundary formulaId={formula.id}>
      <FormulaSolver formula={formula} formulaHtml={formulaHtml} description={description} />
    </FormulaErrorBoundary>
  );
}
