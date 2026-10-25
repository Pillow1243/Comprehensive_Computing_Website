'use client';

import Link from 'next/link';
import { CategoryIcon } from '@/components/icons';
import { categoryMeta, formulasInCategory } from '@/lib/formulas';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function CategoryCard({ categoryId, large = true }: { categoryId: string; large?: boolean }) {
  const { t, lang } = useI18n();
  const meta = categoryMeta(categoryId);
  const formulas = formulasInCategory(categoryId);

  return (
    <Link
      href={`/categories/?cat=${categoryId}`}
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-outline-variant',
        'bg-gradient-to-br p-4 transition-transform duration-200 active:scale-[0.98]',
        meta.tint,
        large ? 'min-h-28' : 'min-h-24',
      )}
    >
      <span
        className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-highest/70 backdrop-blur"
        style={{ color: meta.accent }}
        aria-hidden="true"
      >
        <CategoryIcon name={meta.icon} className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-title-small font-semibold text-on-surface">
          {lang === 'fa' ? meta.fa : meta.en}
        </span>
        <span className="mt-0.5 block text-label-small text-on-surface-variant">
          {t('formulaCount', { count: formulas.length })}
        </span>
      </span>
    </Link>
  );
}
