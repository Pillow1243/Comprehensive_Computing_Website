'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadFormula, getFormula, type Formula } from '@/lib/formulas';
import { FormulaErrorBoundary } from '@/components/formula-error-boundary';
import { FormulaSolver } from '@/components/formula-solver';
import { FormulaSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/states';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

/**
 * Client island for a formula.
 *
 * The server page resolves only the id; the detail manifest (variables,
 * outputs, examples) and the solver itself are fetched lazily so that the home
 * route stays under the 200 KB gzip first-load budget.
 */
export function FormulaDetail({ formulaId }: { formulaId: string }) {
  const { t } = useI18n();
  const exists = Boolean(getFormula(formulaId));
  const [formula, setFormula] = useState<Formula | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    loadFormula(formulaId)
      .then((loaded) => {
        if (cancelled) return;
        if (loaded) setFormula(loaded);
        else setFailed(true);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [formulaId]);

  if (!exists || failed) {
    return (
      <EmptyState
        title={t('formulaNotFound')}
        description={t('notFoundHint')}
        action={
          <Link href="/categories/">
            <Button>{t('backToFormulas')}</Button>
          </Link>
        }
      />
    );
  }

  if (!formula) return <FormulaSkeleton />;

  return (
    <FormulaErrorBoundary formulaId={formula.id}>
      <FormulaSolver formula={formula} />
    </FormulaErrorBoundary>
  );
}
