'use client';

import { useEffect, useState } from 'react';
import { cachedDescription, loadDescriptions, type FormulaMeta } from '@/lib/formulas';
import { useI18n } from '@/lib/i18n';

/**
 * Renders the one-line Persian summary of a formula. Summaries ship in a
 * separate, lazily imported manifest (see `lib/formulas.ts`), so on the very
 * first paint a soft placeholder is shown instead of the prose.
 */
export function FormulaDescription({
  formula,
  className,
  placeholder = true,
  initialText,
}: {
  formula: FormulaMeta;
  className?: string;
  placeholder?: boolean;
  /** Summary already known at build time (formula pages inline it). */
  initialText?: string;
}) {
  const { lang } = useI18n();
  const [text, setText] = useState<string | undefined>(() => initialText ?? cachedDescription(formula.id));

  useEffect(() => {
    if (text) return;
    let alive = true;
    loadDescriptions().then((map) => {
      if (alive) setText(map[formula.id]);
    });
    return () => {
      alive = false;
    };
  }, [formula.id, text]);

  if (lang !== 'fa') {
    return (
      <span className={className}>
        A validated, step-by-step {formula.name_en} solver with unit-aware inputs, plotting and saved
        history.
      </span>
    );
  }

  if (!text) {
    return placeholder ? (
      <span className={className} aria-hidden="true">
        <span className="inline-block h-3 w-4/5 animate-pulse rounded-full bg-on-surface/10" />
      </span>
    ) : null;
  }

  return <span className={className}>{text}</span>;
}
