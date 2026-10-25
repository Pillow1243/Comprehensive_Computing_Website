'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, ChevronRight, ShieldCheck, Sparkles, Wifi, Zap } from 'lucide-react';
import { CategoryCard } from '@/components/category-card';
import { FormulaCard } from '@/components/formula-card';
import { InstallBanner } from '@/components/install-banner';
import { SearchField } from '@/components/search-field';
import { CATEGORIES, FORMULAS, getFormula, formulaName, totalTests } from '@/lib/formulas';
import { useI18n } from '@/lib/i18n';
import { useAppStore, useHydrated } from '@/lib/store';
import { formatNumber, cn } from '@/lib/utils';

const fallbackRecent = ['quadratic', 'ph', 'pythagorean', 'compound_interest'];
const fallbackSuggested = ['heron', 'ohm_circuit', 'normal_dist', 'kinematics'];

const featuredCategories = ['math', 'physics', 'chemistry', 'engineering'];

export default function HomePage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const hydrated = useHydrated();
  const [query, setQuery] = useState('');
  const recentIds = useAppStore((state) => state.recent);
  const bookmarks = useAppStore((state) => state.bookmarks);

  const recent = (hydrated && recentIds.length ? recentIds : fallbackRecent)
    .map((id) => getFormula(id))
    .filter((formula): formula is NonNullable<typeof formula> => Boolean(formula))
    .slice(0, 6);

  const suggestedIds = bookmarks.length
    ? FORMULAS.filter((formula) => bookmarks.includes(formula.id)).slice(0, 4).map((formula) => formula.id)
    : fallbackSuggested;
  const suggested = suggestedIds
    .map((id) => getFormula(id))
    .filter((formula): formula is NonNullable<typeof formula> => Boolean(formula))
    .slice(0, 4);

  const stats = [
    { icon: Sparkles, label: t('formulas'), value: formatNumber(FORMULAS.length, { decimals: 0, lang }) },
    { icon: Zap, label: t('categories'), value: formatNumber(CATEGORIES.length, { decimals: 0, lang }) },
    { icon: Wifi, label: t('offlineReady'), value: '✓' },
  ];

  return (
    <div className="space-y-6 px-4 pb-8 pt-2">
      {/* Hero */}
      <section data-testid="home-hero" className="relative overflow-hidden rounded-3xl border border-outline-variant bg-gradient-to-br from-primary-container/45 via-surface-container to-surface p-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -end-8 -top-6 select-none font-serif text-[7rem] leading-none text-primary/10"
        >
          ∑
        </div>
        <p className="mb-2 inline-flex items-center gap-1 rounded-full bg-surface-container-high/80 px-2.5 py-1 text-label-small text-on-surface-variant">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          {t('secure')}
        </p>
        <h1 className="text-headline-medium font-bold leading-tight text-on-surface">
          {t('appTagline')}
        </h1>
        <p className="mt-2 max-w-md text-body-medium text-on-surface-variant">{t('appDescription')}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <span
                key={stat.label}
                className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-high/80 px-3 py-1.5 text-label-medium text-on-surface-variant"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="tnum font-semibold text-on-surface">{stat.value}</span>
                {stat.label}
              </span>
            );
          })}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-high/80 px-3 py-1.5 text-label-medium text-on-surface-variant">
            <span className="tnum font-semibold text-on-surface">{totalTests}</span>
            tests
          </span>
        </div>

        <div className="mt-4">
          <SearchField
            value={query}
            onChange={setQuery}
            onSubmit={(value) => {
              const trimmed = value.trim();
              router.push(trimmed ? `/search/?q=${encodeURIComponent(trimmed)}` : '/search/');
            }}
          />
        </div>
      </section>

      <InstallBanner />

      {/* Categories */}
      <section aria-labelledby="categories-heading">
        <div className="mb-2.5 flex items-end justify-between">
          <h2 id="categories-heading" className="text-title-large font-semibold text-on-surface">
            {t('categories')}
          </h2>
          <Link href="/categories/" className="flex items-center gap-0.5 text-label-large text-primary">
            {t('allCategories')}
            <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {featuredCategories.map((id, index) => (
            <div key={id} className="anim-fade-up" style={{ animationDelay: `${index * 50}ms` }}>
              <CategoryCard categoryId={id} />
            </div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {CATEGORIES.filter((category) => !featuredCategories.includes(category.id)).map((category) => (
            <Link
              key={category.id}
              href={`/categories/?cat=${category.id}`}
              className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border border-outline-variant bg-surface-container px-2 py-2 text-center"
            >
              <span className="text-label-medium text-on-surface">
                {lang === 'fa' ? category.fa : category.en}
              </span>
              <span className="text-label-small text-on-surface-variant">
                {t('formulaCount', { count: FORMULAS.filter((formula) => formula.category_path[0] === category.fa).length })}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent */}
      <section aria-labelledby="recent-heading">
        <div className="mb-2.5 flex items-end justify-between">
          <h2 id="recent-heading" className="text-title-large font-semibold text-on-surface">
            {t('recent')}
          </h2>
          <Link href="/history/" className="flex items-center gap-0.5 text-label-large text-primary">
            {t('seeAll')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
        <div className="chip-rail -mx-4 px-4">
          {recent.map((formula) => (
            <Link
              key={formula.id}
              href={`/formula/${formula.id}/`}
              className={cn(
                'flex h-24 w-40 flex-col justify-between rounded-2xl border border-outline-variant',
                'bg-surface-container p-3',
              )}
            >
              <span className="line-clamp-2 text-body-medium font-medium text-on-surface">
                {formulaName(formula, lang)}
              </span>
              <span className="text-label-small text-on-surface-variant">
                {formula.category_path[0]}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Suggested */}
      <section aria-labelledby="suggested-heading">
        <h2 id="suggested-heading" className="mb-2.5 text-title-large font-semibold text-on-surface">
          {t('suggested')}
        </h2>
        <div className="space-y-2">
          {suggested.map((formula) => (
            <FormulaCard key={formula.id} formula={formula} />
          ))}
        </div>
      </section>

      <footer className="space-y-1 border-t border-outline-variant pt-4 text-center text-body-small text-on-surface-variant">
        <p>{t('secure')}</p>
        <p>
          SolveEverything ·{' '}
          <a
            href="https://github.com/Pillow1243/Comprehensive_Computing_Website"
            className="text-primary underline-offset-2 hover:underline"
            rel="noreferrer noopener"
            target="_blank"
          >
            {t('openSource')}
          </a>
        </p>
      </footer>
    </div>
  );
}
