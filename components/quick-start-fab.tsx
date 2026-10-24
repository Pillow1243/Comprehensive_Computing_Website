'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight, Plus, Sparkles } from 'lucide-react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { CategoryIcon } from '@/components/icons';
import { categoryMeta, formulaName, getFormula } from '@/lib/formulas';
import { useI18n } from '@/lib/i18n';
import { cn, haptic } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

const quickIds = [
  'quadratic',
  'pythagorean',
  'ph',
  'ohm_circuit',
  'compound_interest',
  'kinematics',
  'heron',
  'normal_dist',
];

/**
 * Extended FAB (thumb zone, bottom-end) that opens the "new calculation" sheet.
 */
export function QuickStartFab() {
  const [open, setOpen] = useState(false);
  const { t, lang } = useI18n();
  const hapticsEnabled = useAppStore((state) => state.settings.haptics);
  const recent = useAppStore((state) => state.recent);

  const ids = [...new Set([...recent.slice(0, 3), ...quickIds])]
    .map((id) => getFormula(id))
    .filter((formula): formula is NonNullable<typeof formula> => Boolean(formula))
    .slice(0, 6);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          haptic(12, hapticsEnabled);
          setOpen(true);
        }}
        className={cn(
          'app-fab anim-scale-in fixed z-nav flex min-h-14 items-center gap-2 rounded-2xl bg-primary-container px-5',
          'text-on-primary-container shadow-elevation-3 active:scale-95 transition-transform',
        )}
        style={{
          bottom: 'calc(var(--bottom-nav-height) + var(--safe-bottom) + 1rem)',
          insetInlineEnd: 'max(1rem, var(--safe-right))',
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Plus className="h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
        <span className="text-label-large font-semibold">{t('newCalc')}</span>
      </button>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title={t('newCalc')}
        description={t('quickAccess')}
        snapPoints={[0.55, 0.9]}
      >
        <ul className="space-y-1.5">
          {ids.map((formula, index) => {
              const meta = categoryMeta(formula.category_path[0]);
              return (
                <li
                  key={formula.id}
                  className="anim-fade-up"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <Link
                    href={`/formula/${formula.id}/`}
                    data-autofocus={index === 0 ? true : undefined}
                    onClick={() => {
                      haptic(10, hapticsEnabled);
                      setOpen(false);
                    }}
                    className="flex min-h-14 items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-on-surface/5"
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant"
                      style={{ color: meta.accent }}
                    >
                      <CategoryIcon name={meta.icon} className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body-large text-on-surface">
                        {formulaName(formula, lang)}
                      </span>
                      <span className="block truncate text-body-small text-on-surface-variant">
                        {formula.category_path.join(' · ')}
                      </span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-on-surface-variant rtl:-scale-x-100" aria-hidden="true" />
                  </Link>
                </li>
              );
          })}
        </ul>
        <Link
          href="/categories/"
          onClick={() => setOpen(false)}
          className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-full border border-outline-variant text-label-large text-primary"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {t('allCategories')}
        </Link>
      </BottomSheet>
    </>
  );
}
