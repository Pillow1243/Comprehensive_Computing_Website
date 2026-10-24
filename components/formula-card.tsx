'use client';

import Link from 'next/link';
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { CategoryIcon } from '@/components/icons';
import { categoryMeta, formulaDescription, formulaName, type FormulaMeta } from '@/lib/formulas';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { cn, haptic } from '@/lib/utils';

export function FormulaCard({ formula, compact = false }: { formula: FormulaMeta; compact?: boolean }) {
  const { t, lang, isRtl } = useI18n();
  const meta = categoryMeta(formula.category_path[0]);
  const bookmarks = useAppStore((state) => state.bookmarks);
  const toggleBookmark = useAppStore((state) => state.toggleBookmark);
  const hapticsEnabled = useAppStore((state) => state.settings.haptics);
  const isBookmarked = bookmarks.includes(formula.id);
  const Chevron = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div className="group relative">
      <Link
        href={`/formula/${formula.id}/`}
        className={cn(
          'flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container p-3.5 pe-12',
          'transition-colors hover:bg-surface-container-high focus-visible:bg-surface-container-high',
        )}
      >
        <span
          className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br', meta.tint)}
          style={{ color: meta.accent }}
          aria-hidden="true"
        >
          <CategoryIcon name={meta.icon} className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-body-large font-medium text-on-surface">
              {formulaName(formula, lang)}
            </span>
            <span className="shrink-0 rounded-full bg-surface-container-highest px-1.5 py-0.5 text-label-small text-on-surface-variant">
              {t(formula.difficulty)}
            </span>
          </span>
          {!compact && (
            <span className="mt-0.5 line-clamp-2 block text-body-small text-on-surface-variant">
              {formulaDescription(formula, lang)}
            </span>
          )}
        </span>
        <Chevron className="h-4 w-4 shrink-0 text-on-surface-variant" aria-hidden="true" />
      </Link>
      <button
        type="button"
        aria-label={isBookmarked ? t('unbookmarked') : t('bookmarked')}
        aria-pressed={isBookmarked}
        onClick={() => {
          haptic(8, hapticsEnabled);
          const added = toggleBookmark(formula.id);
          toast.success(added ? t('bookmarked') : t('unbookmarked'));
        }}
        className="absolute end-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-on-surface-variant hover:bg-on-surface/10"
      >
        {isBookmarked ? (
          <BookmarkCheck className="h-5 w-5 text-primary" aria-hidden="true" />
        ) : (
          <Bookmark className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
