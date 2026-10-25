'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowRight, GraduationCap, Trophy } from 'lucide-react';
import { LEARN_PATHS, pathProgress } from '@/lib/learn-paths';
import { getFormula, formulaName } from '@/lib/formulas';
import { useI18n } from '@/lib/i18n';
import { useAppStore, useHydrated } from '@/lib/store';
import { formatNumber } from '@/lib/utils';

/**
 * Home "continue learning" card (v4.1): resumes the learning path with the
 * most momentum, using the same done-set as the /learn page
 * (marked-done ∪ history ∪ recent).
 */
export function ContinueLearningCard() {
  const { t, lang } = useI18n();
  const hydrated = useHydrated();
  const learnDone = useAppStore((state) => state.learnDone);
  const history = useAppStore((state) => state.history);
  const recent = useAppStore((state) => state.recent);

  const choice = useMemo(() => {
    if (!hydrated) return null;
    const doneIds = new Set<string>(learnDone);
    for (const entry of history) doneIds.add(entry.formulaId);
    for (const id of recent) doneIds.add(id);
    const scored = LEARN_PATHS.map((path) => ({ path, progress: pathProgress(path, doneIds) }));
    const inProgress = scored
      .filter((item) => !item.progress.completed && item.progress.doneCount > 0)
      .sort((a, b) => b.progress.percent - a.progress.percent)[0];
    if (inProgress) return { ...inProgress, started: true };
    const fresh = scored.find((item) => !item.progress.completed);
    if (fresh) return { ...fresh, started: false };
    return { path: null, progress: null, started: false };
  }, [hydrated, learnDone, history, recent]);

  if (!hydrated) return <div className="skeleton h-24 rounded-3xl" aria-hidden="true" />;
  if (!choice) return null;

  if (!choice.path || !choice.progress) {
    return (
      <Link href="/learn/" className="card-lift gradient-border-soft flex items-center gap-3 rounded-3xl p-4">
        <span className="icon-bubble h-12 w-12 shrink-0">
          <Trophy className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-title-medium font-bold text-on-surface">{t('learnTitle')}</span>
          <span className="block text-body-small text-on-surface-variant">{t('pathCompleted')}</span>
        </span>
      </Link>
    );
  }

  const { path, progress, started } = choice;
  const nextFormula = progress.nextFormulaId ? getFormula(progress.nextFormulaId) : null;

  return (
    <section aria-label={t('continueLearning')} className="gradient-border-soft rounded-3xl p-4">
      <div className="flex items-center gap-3">
        <span className="icon-bubble h-12 w-12 shrink-0">
          <GraduationCap className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-label-small font-semibold uppercase tracking-wide text-primary">
            {t('continueLearning')}
          </p>
          <p className="truncate text-title-medium font-bold text-on-surface">
            {lang === 'en' ? path.titleEn : path.titleFa}
          </p>
          <p className="truncate text-body-small text-on-surface-variant">
            {t('stepsOf', {
              done: formatNumber(progress.doneCount, { decimals: 0, lang }),
              total: formatNumber(progress.total, { decimals: 0, lang }),
            })}
            {nextFormula ? ` · ${formulaName(nextFormula, lang)}` : ''}
          </p>
        </div>
        <Link
          href="/learn/"
          className="inline-flex min-h-touch shrink-0 items-center gap-1 rounded-full border border-outline-variant px-3.5 text-label-large text-primary"
        >
          {started ? t('continuePath') : t('startPath')}
          <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        </Link>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-surface-container-highest"
        role="progressbar"
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span
          className="block h-full rounded-full brand-gradient"
          style={{
            inlineSize: `${progress.percent}%`,
            transition: 'inline-size 0.8s var(--ease-emphasized-decelerate)',
          }}
        />
      </div>
    </section>
  );
}
