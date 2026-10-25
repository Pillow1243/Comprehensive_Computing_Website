'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { SearchX, Sparkles } from 'lucide-react';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/states';
import { FormulaCard } from '@/components/formula-card';
import { SearchField } from '@/components/search-field';
import { CATEGORIES, rankedSearch, type Difficulty } from '@/lib/formulas';
import { smartSearch, suggestCorrections, type SmartReason } from '@/lib/smart-search';

const REASON_KEYS: Record<SmartReason, string> = {
  exact: 'reasonExact',
  name: 'reasonName',
  tag: 'reasonTag',
  synonym: 'reasonSynonym',
  fuzzy: 'reasonFuzzy',
  category: 'reasonCategory',
  id: 'reasonId',
};
import { useI18n } from '@/lib/i18n';
import { categorySegment } from '@/lib/category-names';
import { useAppStore } from '@/lib/store';
import { debounce } from '@/lib/utils';

const levels: Array<'all' | Difficulty> = ['all', 'basic', 'intermediate', 'advanced'];

export default function SearchPage() {
  const { t, lang } = useI18n();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [level, setLevel] = useState<'all' | Difficulty>('all');
  const [onlyBookmarks, setOnlyBookmarks] = useState(false);
  const bookmarks = useAppStore((state) => state.bookmarks);
  const recent = useAppStore((state) => state.recent);

  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get('q') ?? '';
    setQuery(initial);
    setDebounced(initial);
  }, []);

  useEffect(() => {
    const commit = debounce((value: string) => setDebounced(value), 200);
    commit(query);
    return () => commit.cancel();
  }, [query]);

  const deferred = useDeferredValue(debounced);

  // v4.1: real queries go through smart search (synonyms + typo tolerance,
  // with a machine-readable reason per result); the empty query keeps the
  // classic browse-everything ranking.
  const smartResults = useMemo(
    () =>
      deferred.trim()
        ? smartSearch(deferred, {
            category: category === 'all' ? undefined : category,
            difficulty: level,
            bookmarks,
            onlyBookmarked: onlyBookmarks,
          })
        : null,
    [deferred, category, level, bookmarks, onlyBookmarks],
  );

  const results = useMemo(
    () =>
      smartResults
        ? smartResults.map((result) => result.formula)
        : rankedSearch(deferred, {
            category: category === 'all' ? undefined : category,
            difficulty: level,
            bookmarks,
            onlyBookmarked: onlyBookmarks,
          }),
    [smartResults, deferred, category, level, bookmarks, onlyBookmarks],
  );

  const reasonById = useMemo(() => {
    const map = new Map<string, SmartReason>();
    for (const result of smartResults ?? []) {
      if (result.reasons[0]) map.set(result.formula.id, result.reasons[0]);
    }
    return map;
  }, [smartResults]);

  const suggestions = useMemo(
    () => (deferred.trim() && results.length < 3 ? suggestCorrections(deferred) : []),
    [deferred, results.length],
  );

  return (
    <div className="pb-8">
      <div className="sticky top-[calc(4rem+var(--safe-top))] z-30 space-y-2 bg-surface/95 px-4 py-3 backdrop-blur">
        <SearchField value={query} onChange={setQuery} autoFocus placeholder={t('searchPlaceholder')} />
        <div className="chip-rail">
          <Chip selected={category === 'all'} onClick={() => setCategory('all')}>
            {t('all')}
          </Chip>
          {CATEGORIES.map((item) => (
            <Chip key={item.id} selected={category === item.id} onClick={() => setCategory(item.id)}>
              {categorySegment(item.fa, lang)}
            </Chip>
          ))}
        </div>
        <div className="chip-rail">
          {levels.map((value) => (
            <Chip key={value} selected={level === value} onClick={() => setLevel(value)}>
              {t(value === 'all' ? 'all' : value)}
            </Chip>
          ))}
          <Chip selected={onlyBookmarks} onClick={() => setOnlyBookmarks((current) => !current)}>
            {t('favorites')}
          </Chip>
        </div>
      </div>

      <div className="px-4">
        <p className="mb-2 text-label-medium text-on-surface-variant" aria-live="polite">
          {t('resultsCount', { count: results.length })}
          {smartResults && <span className="ms-2 text-primary">· {t('resultsSmartHint')}</span>}
        </p>

        {suggestions.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <span className="text-label-large text-on-surface">{t('didYouMean')}</span>
            {suggestions.map((suggestion) => (
              <Chip
                key={suggestion}
                onClick={() => {
                  setQuery(suggestion);
                  setDebounced(suggestion);
                }}
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {suggestion}
              </Chip>
            ))}
          </div>
        )}

        {results.length > 0 ? (
          <div className="space-y-2">
            {results.map((formula) => (
              <FormulaCard
                key={formula.id}
                formula={formula}
                badge={reasonById.get(formula.id) ? t(REASON_KEYS[reasonById.get(formula.id)!]) : undefined}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<SearchX className="h-9 w-9" aria-hidden="true" />}
            title={t('searchEmptyTitle')}
            description={t('searchEmptyHint')}
            action={
              <div className="chip-rail justify-center">
                {recent.slice(0, 4).map((id) => (
                  <Chip key={id} onClick={() => { setQuery(id.replaceAll('_', ' ')); setDebounced(id.replaceAll('_', ' ')); }}>
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    {id.replaceAll('_', ' ')}
                  </Chip>
                ))}
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
