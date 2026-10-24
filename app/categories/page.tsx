'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Filter, SearchX } from 'lucide-react';
import { CategoryIcon } from '@/components/icons';
import { FormulaCard } from '@/components/formula-card';
import { Chip } from '@/components/ui/chip';
import { SearchField } from '@/components/search-field';
import { EmptyState } from '@/components/ui/states';
import { CATEGORIES, categoryMeta, difficultyCounts, formulasInCategory } from '@/lib/formulas';
import { rankedSearch, type Difficulty } from '@/lib/formulas';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { cn, haptic } from '@/lib/utils';

const levels: Array<'all' | Difficulty> = ['all', 'basic', 'intermediate', 'advanced'];

export default function CategoriesPage() {
  const { t, lang } = useI18n();
  const hapticsEnabled = useAppStore((state) => state.settings.haptics);
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<'all' | Difficulty>('all');
  const [onlyBookmarks, setOnlyBookmarks] = useState(false);
  const bookmarks = useAppStore((state) => state.bookmarks);
  const [openIds, setOpenIds] = useState<string[]>(['math']);

  useEffect(() => {
    const category = new URLSearchParams(window.location.search).get('cat');
    if (category) setOpenIds([category]);
  }, []);

  const counts = difficultyCounts();
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);

  const sections = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        category,
        formulas: rankedSearch(query, {
          category: category.id,
          difficulty: level,
          bookmarks,
          onlyBookmarked: onlyBookmarks,
        }),
      })),
    [query, level, bookmarks, onlyBookmarks],
  );

  const visible = sections.filter((section) => section.formulas.length > 0);
  const isFiltering = query.trim() !== '' || level !== 'all' || onlyBookmarks;

  const toggle = (id: string) => {
    haptic(8, hapticsEnabled);
    setOpenIds((current) =>
      current.includes(id) ? current.filter((open) => open !== id) : [...current, id],
    );
  };

  return (
    <div className="pb-8">
      <div className="sticky top-[calc(4rem+var(--safe-top))] z-30 space-y-2 bg-surface/95 px-4 py-3 backdrop-blur">
        <SearchField value={query} onChange={setQuery} placeholder={t('searchInCategory')} />
        <div className="chip-rail">
          <Chip selected={level === 'all'} onClick={() => setLevel('all')}>
            {t('all')} · {total}
          </Chip>
          {levels.slice(1).map((value) => (
            <Chip key={value} selected={level === value} onClick={() => setLevel(value as Difficulty)}>
              {t(value)} · {counts[value as Difficulty]}
            </Chip>
          ))}
          <Chip
            selected={onlyBookmarks}
            onClick={() => setOnlyBookmarks((current) => !current)}
            icon={<Filter className="h-3.5 w-3.5" aria-hidden="true" />}
          >
            {t('favorites')} · {bookmarks.length}
          </Chip>
        </div>
      </div>

      <div className="space-y-2 px-4 pt-2">
        <p className="sr-only" aria-live="polite">
          {t('resultsCount', { count: visible.reduce((sum, section) => sum + section.formulas.length, 0) })}
        </p>
        {!visible.length && (
          <EmptyState
            icon={<SearchX className="h-9 w-9" aria-hidden="true" />}
            title={t('searchEmptyTitle')}
            description={t('searchEmptyHint')}
            action={
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setLevel('all');
                  setOnlyBookmarks(false);
                }}
                className="rounded-full bg-primary-container px-4 py-2 text-label-large text-on-primary-container"
              >
                {t('clearFilters')}
              </button>
            }
          />
        )}

        {visible.map(({ category, formulas }) => {
          const meta = categoryMeta(category.id);
          const open = openIds.includes(category.id);
          const all = formulasInCategory(category.id);
          return (
            <section
              key={category.id}
              className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container"
            >
              <h2>
                <button
                  type="button"
                  onClick={() => toggle(category.id)}
                  aria-expanded={open}
                  aria-controls={`panel-${category.id}`}
                  className="flex min-h-16 w-full items-center gap-3 px-3.5 py-3 text-start"
                >
                  <span
                    className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br', meta.tint)}
                    style={{ color: meta.accent }}
                    aria-hidden="true"
                  >
                    <CategoryIcon name={meta.icon} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-title-small font-semibold text-on-surface">
                      {lang === 'fa' ? category.fa : category.en}
                    </span>
                    <span className="block truncate text-label-small text-on-surface-variant">
                      {isFiltering
                        ? t('resultsCount', { count: formulas.length })
                        : t('formulaCount', { count: all.length })}{' '}
                      · {category.children.length} {t('categories')}
                    </span>
                  </span>
                  <ChevronDown
                    className={cn('h-5 w-5 text-on-surface-variant transition-transform', !open && '-rotate-90')}
                    aria-hidden="true"
                  />
                </button>
              </h2>
              {open && (
                <div id={`panel-${category.id}`} className="anim-fade-up overflow-hidden">
                  <div className="space-y-3 px-3.5 pb-3.5">
                    {category.children.map((child) => {
                      const childFormulas = formulas.filter((formula) => formula.category_path[1] === child);
                      if (!childFormulas.length) return null;
                      return (
                        <div key={child}>
                          <p className="mb-1.5 text-label-medium font-medium uppercase tracking-wide text-on-surface-variant">
                            {child}
                          </p>
                          <div className="space-y-1.5">
                            {childFormulas.map((formula) => (
                              <FormulaCard key={formula.id} formula={formula} compact />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {!formulas.length && (
                      <p className="py-2 text-body-small text-on-surface-variant">{t('notFoundInCategory')}</p>
                    )}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
