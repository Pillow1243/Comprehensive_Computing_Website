'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowUpRight, Check, GraduationCap } from 'lucide-react';
import { ToolIcon } from '@/components/tool-icon';
import { formulaName, getFormula } from '@/lib/formulas';
import { useI18n } from '@/lib/i18n';
import { LEARN_PATHS, pathProgress } from '@/lib/learn-paths';
import { burstConfetti } from '@/lib/confetti';
import { toast } from '@/lib/toast';
import { useAppStore, useHydrated } from '@/lib/store';
import { formatNumber, cn } from '@/lib/utils';

export default function LearnPage() {
  const { t, lang, numerals } = useI18n();
  const hydrated = useHydrated();
  const learnDone = useAppStore((state) => state.learnDone);
  const history = useAppStore((state) => state.history);
  const recent = useAppStore((state) => state.recent);
  const toggleLearnDone = useAppStore((state) => state.toggleLearnDone);

  const doneIds = useMemo(() => {
    const ids = new Set<string>(hydrated ? learnDone : []);
    if (hydrated) {
      for (const entry of history) ids.add(entry.formulaId);
      for (const id of recent) ids.add(id);
    }
    return ids;
  }, [hydrated, learnDone, history, recent]);

  const fmt = (value: number) => formatNumber(value, { decimals: 0, lang, numerals });

  return (
    <div className="space-y-6 px-4 pb-8 pt-3">
      <header className="hero-surface p-5">
        <p className="data-pill relative z-10">
          <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
          {t('appName')}
        </p>
        <h1 className="relative z-10 mt-2 text-headline-medium font-bold text-on-surface">{t('learnTitle')}</h1>
        <p className="relative z-10 mt-1 text-body-medium text-on-surface-variant">{t('learnHint')}</p>
      </header>

      {LEARN_PATHS.map((path) => {
        const progress = pathProgress(path, doneIds);
        const title = lang === 'fa' ? path.titleFa : path.titleEn;
        const description = lang === 'fa' ? path.descriptionFa : path.descriptionEn;
        return (
          <section key={path.id} className="rounded-3xl border border-outline-variant bg-surface-container p-4" aria-label={title}>
            <header className="flex items-start gap-3">
              <span className={cn('icon-bubble h-12 w-12 shrink-0', `bg-gradient-to-br ${path.tint}`)} style={{ color: path.accent }}>
                <ToolIcon name={path.icon} className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-title-medium font-semibold text-on-surface">{title}</h2>
                <p className="mt-0.5 text-body-small leading-relaxed text-on-surface-variant">{description}</p>
                <p className="mt-1 text-label-small text-on-surface-variant">
                  {t('minutesShort', { count: path.minutes })} · {t('stepsOf', { done: progress.doneCount, total: progress.total })}
                </p>
              </div>
              <span className="mono-result shrink-0 text-title-medium font-black" style={{ color: path.accent }}>
                {fmt(progress.percent)}٪
              </span>
            </header>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-container-lowest" role="progressbar" aria-valuenow={progress.percent} aria-valuemax={100}>
              <div className="h-full rounded-full transition-all" style={{ width: `${progress.percent}%`, backgroundColor: path.accent }} />
            </div>
            {progress.completed ? (
              <p className="mt-3 text-label-large font-semibold text-success">{t('pathCompleted')}</p>
            ) : progress.nextFormulaId ? (
              <Link
                href={`/formula/${progress.nextFormulaId}/`}
                className="brand-gradient mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-label-large font-semibold text-white"
              >
                {progress.doneCount > 0 ? t('continuePath') : t('startPath')}
                <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
              </Link>
            ) : null}
            <ol className="mt-3 space-y-1.5">
              {path.formulaIds.map((formulaId, step) => {
                const formula = getFormula(formulaId);
                if (!formula) return null;
                const done = doneIds.has(formulaId);
                const manuallyDone = hydrated && learnDone.includes(formulaId);
                return (
                  <li key={formulaId} className="flex items-center gap-2 rounded-xl bg-surface-container-lowest/70 px-2.5 py-2">
                    <button
                      type="button"
                      onClick={() => {
                        const becomesComplete =
                          !manuallyDone &&
                          pathProgress(path, new Set([...doneIds, formulaId])).completed;
                        toggleLearnDone(formulaId);
                        if (becomesComplete) {
                          burstConfetti();
                          toast.success(t('pathCompleted'));
                        }
                      }}
                      aria-pressed={manuallyDone}
                      aria-label={`${t('markDone')}: ${formulaName(formula, lang)}`}
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-label-small font-bold transition-colors',
                        done ? 'border-transparent bg-success/20 text-success' : 'border-outline-variant text-on-surface-variant',
                      )}
                    >
                      {done ? <Check className="h-4 w-4" aria-hidden="true" /> : fmt(step + 1)}
                    </button>
                    <Link href={`/formula/${formulaId}/`} className={cn('min-w-0 flex-1 text-label-large', done ? 'text-on-surface-variant line-through' : 'text-on-surface')}>
                      {formulaName(formula, lang)}
                    </Link>
                    {formulaId === progress.nextFormulaId && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-on-primary">{t('newBadge')}</span>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
