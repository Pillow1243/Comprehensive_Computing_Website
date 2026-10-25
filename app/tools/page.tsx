'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { ToolCard } from '@/components/tool-card';
import { CATEGORIES, FORMULAS, totalTests } from '@/lib/formulas';
import { TOOLS } from '@/lib/tools';
import { useI18n } from '@/lib/i18n';
import { cn, formatNumber } from '@/lib/utils';

const accents = ['#8AB4FF', '#7ADFA0', '#FFC46B', '#FF9CBF', '#C4B5FD', '#67E8F9', '#FDA4AF'];

export default function ToolsPage() {
  const { t, lang } = useI18n();
  const Arrow = lang === 'fa' ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-6 px-4 pb-8 pt-3">
      <header className="hero-surface p-5">
        <p className="data-pill relative z-10">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          {t('appName')}
        </p>
        <h1 className="relative z-10 mt-2 text-headline-medium font-bold text-on-surface">{t('tools')}</h1>
        <p className="relative z-10 mt-1 text-body-medium text-on-surface-variant">{t('toolsHint')}</p>
      </header>

      <section aria-labelledby="tools-grid-heading" className="space-y-2">
        <h2 id="tools-grid-heading" className="text-title-large font-semibold text-on-surface">
          {t('tools')}
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {TOOLS.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      <section aria-labelledby="disciplines-heading" className="space-y-2">
        <div className="flex items-end justify-between">
          <h2 id="disciplines-heading" className="text-title-large font-semibold text-on-surface">
            {t('disciplines')}
          </h2>
          <Link href="/categories/" className="flex items-center gap-0.5 text-label-large text-primary">
            {t('seeAll')}
            <Arrow className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((category, index) => {
            const count = FORMULAS.filter((formula) => formula.category_path[0] === category.fa).length;
            return (
              <Link
                key={category.id}
                href={`/categories/?cat=${category.id}`}
                className="card-lift flex items-center justify-between gap-2 rounded-xl border border-outline-variant bg-surface-container px-3 py-3"
              >
                <span className="text-label-large font-medium text-on-surface">
                  {lang === 'fa' ? category.fa : category.en}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-label-small font-semibold text-on-surface"
                  style={{ backgroundColor: `${accents[index % accents.length]}26` }}
                >
                  {formatNumber(count, { decimals: 0, lang })}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <p className="text-center text-body-small text-on-surface-variant">
        {t('formulas')}: {formatNumber(FORMULAS.length, { decimals: 0, lang })} · {t('examples')}:{' '}
        {formatNumber(totalTests, { decimals: 0, lang })}
      </p>
    </div>
  );
}
