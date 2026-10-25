'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowUpRight, MessagesSquare, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/states';
import { formulaName, getFormula, loadFormula } from '@/lib/formulas';
import { useI18n } from '@/lib/i18n';
import { smartSearch } from '@/lib/smart-search';
import {
  analyzeTextProblem,
  extractNumbers,
  mapNumbersToVariables,
  suggestionHref,
  type TextSolutionSuggestion,
} from '@/lib/text-solver';
import { formatNumber } from '@/lib/utils';

const EXAMPLES_FA = [
  'جسمی با سرعت اولیه ۱۰ متر بر ثانیه و شتاب ۲ پس از ۳ ثانیه به چه سرعتی می‌رسد؟',
  'سرمایه ۵۰۰۰ با بهره مرکب سالانه ۸ درصد بعد از ۱۰ سال چقدر می‌شود؟',
  'قسط ماهانه وام ۱۲۰۰۰۰ با نرخ سالانه ۶ درصد در ۶۰ قسط چقدر است؟',
  'مساحت مثلثی با ضلع‌های ۵ و ۶ و ۷ را حساب کنید.',
  'وتر مثلث قائمه‌ای با ضلع‌های ۶ و ۸ چقدر است؟',
];

const EXAMPLES_EN = [
  'A body starts at 10 m/s with acceleration 2 — what is its speed after 3 seconds?',
  'What does 5000 grow to with 8% compound interest after 10 years?',
  'Monthly payment for a 120000 loan at 6% over 60 months?',
  'Find the area of a triangle with sides 5, 6 and 7.',
];

interface DisplaySuggestion extends TextSolutionSuggestion {
  source: 'rule' | 'search';
}

export default function AssistantPage() {
  const { t, lang, numerals } = useI18n();
  const [problem, setProblem] = useState('');
  const [suggestions, setSuggestions] = useState<DisplaySuggestion[] | null>(null);
  const [numbers, setNumbers] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  const examples = lang === 'fa' ? EXAMPLES_FA : EXAMPLES_EN;

  const analyze = async (text: string) => {
    setBusy(true);
    try {
      const foundNumbers = extractNumbers(text);
      setNumbers(foundNumbers);
      const ruleHits: DisplaySuggestion[] = analyzeTextProblem(text).map((suggestion) => ({
        ...suggestion,
        source: 'rule',
      }));
      const seen = new Set(ruleHits.map((hit) => hit.formulaId));
      const searchHits: DisplaySuggestion[] = [];
      for (const result of smartSearch(text).slice(0, 6)) {
        if (searchHits.length + ruleHits.length >= 4) break;
        if (seen.has(result.formula.id)) continue;
        const full = await loadFormula(result.formula.id);
        if (!full) continue;
        const inputs = mapNumbersToVariables(full, foundNumbers);
        searchHits.push({
          formulaId: result.formula.id,
          inputs,
          confidence: Math.min(0.85, 0.35 + result.score / 160),
          matchedKeywords: result.reasons,
          noteFa: 'عددهای متن به‌ترتیب روی متغیرهای فرمول نشستند؛ قبل از محاسبه بررسی کنید.',
          noteEn: 'Numbers were mapped in reading order — please review before solving.',
          source: 'search',
        });
        seen.add(result.formula.id);
      }
      setSuggestions([...ruleHits, ...searchHits].slice(0, 4));
    } finally {
      setBusy(false);
    }
  };

  const fmt = (value: number) => formatNumber(value, { decimals: 4, lang, numerals });
  const hasText = problem.trim().length > 0;

  const resultList = useMemo(() => suggestions ?? [], [suggestions]);

  return (
    <div className="space-y-5 px-4 pb-8 pt-3">
      <header className="hero-surface p-5">
        <p className="data-pill relative z-10">
          <MessagesSquare className="h-3.5 w-3.5" aria-hidden="true" />
          {t('tools')}
          <span className="rounded-full bg-primary px-1.5 py-px text-[10px] font-bold text-on-primary">{t('newBadge')}</span>
        </p>
        <h1 className="relative z-10 mt-2 text-headline-medium font-bold text-on-surface">{t('assistantTitle')}</h1>
        <p className="relative z-10 mt-1 text-body-medium text-on-surface-variant">{t('assistantHint')}</p>
      </header>

      <section className="space-y-2">
        <label className="block">
          <span className="sr-only">{t('assistantTitle')}</span>
          <textarea
            value={problem}
            onChange={(event) => setProblem(event.target.value)}
            placeholder={t('problemPlaceholder')}
            rows={4}
            className="w-full rounded-2xl border border-outline-variant bg-surface-container p-3 text-body-large text-on-surface outline-none focus:border-primary"
          />
        </label>
        <Button fullWidth size="lg" loading={busy} disabled={!hasText || busy} onClick={() => void analyze(problem)}>
          <Wand2 className="h-5 w-5" aria-hidden="true" />
          {t('analyzeProblem')}
        </Button>
        <div>
          <p className="mb-1.5 text-label-medium text-on-surface-variant">{t('exampleProblems')}</p>
          <div className="flex flex-wrap gap-1.5">
            {examples.map((example) => (
              <Chip
                key={example}
                onClick={() => {
                  setProblem(example);
                  void analyze(example);
                }}
              >
                {example.length > 42 ? `${example.slice(0, 42)}…` : example}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      {suggestions !== null && (
        <section className="space-y-3" aria-label={t('suggestedFormulas')} aria-live="polite">
          {numbers.length > 0 && (
            <p className="text-body-medium text-on-surface-variant">
              {t('extractedNumbers')}:{' '}
              <span className="mono-result font-semibold text-on-surface">
                {numbers.map((value) => fmt(value)).join(' · ')}
              </span>
            </p>
          )}
          <h2 className="text-title-large font-semibold text-on-surface">
            <Sparkles className="mb-0.5 inline h-5 w-5 text-primary" aria-hidden="true" /> {t('suggestedFormulas')}
          </h2>
          {resultList.length === 0 ? (
            <EmptyState
              icon={<MessagesSquare className="h-9 w-9" aria-hidden="true" />}
              title={t('noSuggestion')}
              description={t('noSuggestionHint')}
            />
          ) : (
            resultList.map((suggestion) => {
              const formula = getFormula(suggestion.formulaId);
              if (!formula) return null;
              return (
                <article key={suggestion.formulaId} className="card-lift rounded-3xl border border-outline-variant bg-surface-container p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-title-medium font-semibold text-on-surface">{formulaName(formula, lang)}</h3>
                    <span className="data-pill shrink-0">
                      {t('confidence')} {fmt(suggestion.confidence * 100)}٪
                    </span>
                  </div>
                  <p className="mt-1 text-body-small leading-relaxed text-on-surface-variant">
                    {lang === 'fa' ? suggestion.noteFa : suggestion.noteEn}
                  </p>
                  {Object.keys(suggestion.inputs).length > 0 && (
                    <p className="mono-result mt-2 text-body-small text-on-surface" dir="ltr">
                      {Object.entries(suggestion.inputs)
                        .map(([name, value]) => `${name} = ${value}`)
                        .join('  ·  ')}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Link
                      href={suggestionHref(suggestion)}
                      className="brand-gradient inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-label-large font-semibold text-white"
                    >
                      {t('openWithInputs')}
                      <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
                    </Link>
                    {suggestion.matchedKeywords.slice(0, 3).map((keyword) => (
                      <span key={keyword} className="rounded-full bg-primary-container px-2 py-0.5 text-label-small text-on-primary-container">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })
          )}
        </section>
      )}
    </div>
  );
}
