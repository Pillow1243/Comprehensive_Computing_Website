'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ChevronRight,
  Dices,
  FlaskConical,
  Grid3x3,
  Ruler,
  ShieldCheck,
  Sparkles,
  Wifi,
  Zap,
} from 'lucide-react';
import { CategoryCard } from '@/components/category-card';
import { FormulaCard } from '@/components/formula-card';
import { InstallBanner } from '@/components/install-banner';
import { SearchField } from '@/components/search-field';
import { ToolCard } from '@/components/tool-card';
import {
  CATEGORIES,
  FORMULAS,
  difficultyCounts,
  formulaCategory,
  formulaName,
  getFormula,
  totalTests,
  type FormulaMeta,
} from '@/lib/formulas';
import { TOOLS } from '@/lib/tools';
import { FormulaDescription } from '@/components/formula-description';
import { useI18n } from '@/lib/i18n';
import { useAppStore, useHydrated } from '@/lib/store';
import { cn, formatNumber } from '@/lib/utils';

const fallbackRecent = ['quadratic', 'ph', 'pythagorean', 'compound_interest'];
const fallbackSuggested = ['heron', 'ohm_circuit', 'normal_dist', 'kinematics'];

const toolIcons = { units: Ruler, chemistry: FlaskConical, 'periodic-table': Grid3x3 };

export default function HomePage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const hydrated = useHydrated();
  const [query, setQuery] = useState('');
  const recentIds = useAppStore((state) => state.recent);
  const bookmarks = useAppStore((state) => state.bookmarks);

  const [spotlight, setSpotlight] = useState<FormulaMeta>(() => getFormula('quadratic') ?? FORMULAS[0]);
  useEffect(() => {
    const day = Math.floor(Date.now() / 86_400_000);
    setSpotlight(FORMULAS[day % FORMULAS.length]);
  }, []);

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

  const counts = useMemo(() => difficultyCounts(), []);
  const stats = [
    { icon: Sparkles, label: t('formulas'), value: formatNumber(FORMULAS.length, { decimals: 0, lang }) },
    { icon: Zap, label: t('disciplines'), value: formatNumber(CATEGORIES.length, { decimals: 0, lang }) },
    { icon: Wifi, label: t('offlineReady'), value: '✓' },
  ];

  const surprise = () => {
    const next = FORMULAS[Math.floor(Math.random() * FORMULAS.length)];
    router.push(`/formula/${next.id}/`);
  };

  const difficultyTotal = Math.max(1, counts.basic + counts.intermediate + counts.advanced);

  return (
    <div className="space-y-7 px-4 pb-10 pt-2">
      {/* Hero */}
      <section data-testid="home-hero" className="hero-surface anim-fade-up-slow p-5">
        <div className="relative z-10">
          <p className="data-pill">
            <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden="true" />
            {t('secure')}
          </p>
          <h1 className="mt-3 text-headline-large font-bold leading-tight text-on-surface">
            {t('appTagline')} <span className="text-gradient">SolveEverything</span>
          </h1>
          <p className="mt-2 max-w-md text-body-medium leading-relaxed text-on-surface-variant">
            {t('appDescription')}
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <span key={stat.label} className="data-pill">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="tnum font-semibold text-on-surface">{stat.value}</span>
                  {stat.label}
                </span>
              );
            })}
            <span className="data-pill">
              <span className="tnum font-semibold text-on-surface">
                {formatNumber(totalTests, { decimals: 0, lang })}
              </span>
              {t('examples')}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <SearchField
              value={query}
              onChange={setQuery}
              onSubmit={(value) => {
                const trimmed = value.trim();
                router.push(trimmed ? `/search/?q=${encodeURIComponent(trimmed)}` : '/search/');
              }}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              href="/categories/"
              className="inline-flex min-h-touch items-center gap-1.5 rounded-full brand-gradient px-4 text-label-large font-semibold text-white shadow-glow"
            >
              {t('browseCategories')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={surprise}
              className="inline-flex min-h-touch items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container/70 px-4 text-label-large text-on-surface"
            >
              <Dices className="h-4 w-4" aria-hidden="true" />
              {t('surpriseMe')}
            </button>
          </div>
        </div>
      </section>

      <InstallBanner />

      {/* Tools rail */}
      <section aria-labelledby="tools-heading" className="-mx-4">
        <div className="mb-2.5 flex items-end justify-between px-4">
          <h2 id="tools-heading" className="flex items-center gap-1.5 text-title-large font-semibold text-on-surface">
            {t('toolsShort')}
            <span className="rounded-full bg-tertiary-container px-2 py-0.5 text-label-small font-medium text-on-tertiary-container">
              {formatNumber(TOOLS.length, { decimals: 0, lang })}
            </span>
          </h2>
          <Link href="/tools/" className="flex items-center gap-0.5 text-label-large text-primary">
            {t('seeAll')}
            <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
        <div className="chip-rail px-4">
          {TOOLS.map((tool) => (
            <ToolCard key={tool.id} tool={tool} compact />
          ))}
        </div>
      </section>

      {/* Spotlight */}
      <section aria-labelledby="spotlight-heading" className="space-y-2">
        <h2 id="spotlight-heading" className="text-title-large font-semibold text-on-surface">
          {t('spotlight')}
        </h2>
        <Link
          href={`/formula/${spotlight.id}/`}
          className="card-lift glass-card block rounded-3xl p-4"
        >
          <div className="flex items-start gap-3">
            <span className="icon-bubble h-11 w-11 shrink-0">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-title-medium font-semibold text-on-surface">
                <span className="truncate">{formulaName(spotlight, lang)}</span>
                <span className="shrink-0 rounded-full bg-surface-container-highest px-1.5 py-0.5 text-label-small font-normal text-on-surface-variant">
                  {t(spotlight.difficulty)}
                </span>
              </p>
              <p className="mt-1 line-clamp-2 text-body-small leading-relaxed text-on-surface-variant">
                <FormulaDescription formula={spotlight} />
              </p>
              <p className="mt-2 text-label-small text-primary">
                {formulaCategory(spotlight, lang)}
              </p>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-on-surface-variant rtl:rotate-180" aria-hidden="true" />
          </div>
        </Link>
      </section>

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
        <div className="grid grid-cols-2 gap-2.5">
          {CATEGORIES.map((category, index) => (
            <div key={category.id} className="anim-fade-up" style={{ animationDelay: `${index * 40}ms` }}>
              <CategoryCard categoryId={category.id} />
            </div>
          ))}
        </div>
      </section>

      {/* Difficulty distribution */}
      <section aria-labelledby="difficulty-heading" className="rounded-2xl border border-outline-variant bg-surface-container p-4">
        <h2 id="difficulty-heading" className="text-title-small font-semibold text-on-surface">
          {t('difficulty')}
        </h2>
        <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-surface-container-highest">
          <span className="bg-success" style={{ inlineSize: `${(counts.basic / difficultyTotal) * 100}%` }} />
          <span className="bg-warning" style={{ inlineSize: `${(counts.intermediate / difficultyTotal) * 100}%` }} />
          <span className="bg-error" style={{ inlineSize: `${(counts.advanced / difficultyTotal) * 100}%` }} />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-label-small text-on-surface-variant">
          <span className="flex items-center gap-1">
            <i className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
            {t('basic')} · {formatNumber(counts.basic, { decimals: 0, lang })}
          </span>
          <span className="flex items-center gap-1">
            <i className="h-2 w-2 rounded-full bg-warning" aria-hidden="true" />
            {t('intermediate')} · {formatNumber(counts.intermediate, { decimals: 0, lang })}
          </span>
          <span className="flex items-center gap-1">
            <i className="h-2 w-2 rounded-full bg-error" aria-hidden="true" />
            {t('advanced')} · {formatNumber(counts.advanced, { decimals: 0, lang })}
          </span>
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
                'card-lift flex h-24 w-40 flex-col justify-between rounded-2xl border border-outline-variant',
                'bg-surface-container p-3',
              )}
            >
              <span className="line-clamp-2 text-body-medium font-medium text-on-surface">
                {formulaName(formula, lang)}
              </span>
              <span className="text-label-small text-on-surface-variant">{formulaCategory(formula, lang)}</span>
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
        <p className="flex items-center justify-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          {t('secure')}
        </p>
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
