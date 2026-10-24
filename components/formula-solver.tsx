'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Calculator,
  Check,
  Copy,
  FunctionSquare,
  History,
  LineChart,
  ListOrdered,
  MoreVertical,
  Share2,
  Sparkles,
  Trash2,
  TriangleRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button, IconButton } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { FormulaDisplay } from '@/components/formula-display';
import { FormulaInput } from '@/components/formula-input';
import { DynamicPlot, type TrianglePatch } from '@/components/dynamic-plot';
import { MathKeyboard } from '@/components/math-keyboard';
import { ResultPanel, StepByStep } from '@/components/step-by-step';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { ConfirmDialog } from '@/components/ui/dialog';
import { computeFormula } from '@/lib/compute-client';
import {
  formulaName,
  formulaDescription,
  relatedFormulas,
  type Formula,
} from '@/lib/formulas';
import { useI18n } from '@/lib/i18n';
import { useAppStore, type HistoryEntry } from '@/lib/store';
import { useVisualViewport } from '@/lib/hooks';
import { assertFiniteOutputs, describeError, validateInputs, type RawInputs } from '@/lib/validation';
import { reportError } from '@/lib/telemetry';
import { withBasePath } from '@/lib/base-path';
import { cn, copyToClipboard, formatNumber, groupByDate, haptic, shareContent } from '@/lib/utils';

type TabKey = 'calc' | 'steps' | 'plot' | 'examples' | 'history';

const tabs: Array<{ key: TabKey; icon: typeof Calculator }> = [
  { key: 'calc', icon: Calculator },
  { key: 'steps', icon: ListOrdered },
  { key: 'plot', icon: LineChart },
  { key: 'examples', icon: Sparkles },
  { key: 'history', icon: History },
];

const initialRaw = (formula: Formula): Record<string, string> =>
  Object.fromEntries(
    formula.variables.map((variable) => [
      variable.name,
      variable.default !== undefined && variable.default !== null ? String(variable.default) : '',
    ]),
  );

const readQueryInputs = (formula: Formula): Record<string, string> | null => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const base = initialRaw(formula);
  let touched = false;
  for (const variable of formula.variables) {
    const value = params.get(variable.name);
    if (value !== null && value !== '') {
      base[variable.name] = value;
      touched = true;
    }
  }
  return touched ? base : null;
};

export function FormulaSolver({ formula }: { formula: Formula }) {
  const { t, lang } = useI18n();
  const { keyboardOpen } = useVisualViewport();
  const settings = useAppStore((state) => state.settings);
  const history = useAppStore((state) => state.history);
  const addHistory = useAppStore((state) => state.addHistory);
  const deleteHistory = useAppStore((state) => state.deleteHistory);
  const clearFormulaHistory = useAppStore((state) => state.clearFormulaHistory);
  const pushRecent = useAppStore((state) => state.pushRecent);
  const bookmarks = useAppStore((state) => state.bookmarks);
  const toggleBookmark = useAppStore((state) => state.toggleBookmark);

  const [tab, setTab] = useState<TabKey>('calc');
  const [raw, setRaw] = useState<Record<string, string>>(() => readQueryInputs(formula) ?? initialRaw(formula));
  const [angleUnits, setAngleUnits] = useState<Record<string, 'deg' | 'rad'>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ values: Record<string, unknown>; steps: string[]; durationMs: number } | null>(null);
  const [computeError, setComputeError] = useState<{ title: string; message: string } | null>(null);
  const [computing, setComputing] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(formula.variables[0]?.name ?? null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HistoryEntry | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const resultRef = useRef<HTMLDivElement>(null);
  const autoRun = useRef(false);

  const isBookmarked = bookmarks.includes(formula.id);
  const formulaHistory = useMemo(
    () => history.filter((entry) => entry.formulaId === formula.id),
    [history, formula.id],
  );

  const preparedInputs = useMemo<RawInputs>(() => {
    const prepared: RawInputs = { ...raw };
    for (const variable of formula.variables) {
      if (variable.unit === 'angle' && angleUnits[variable.name] === 'rad') {
        const numeric = Number(raw[variable.name]);
        if (Number.isFinite(numeric)) prepared[variable.name] = (numeric * 180) / Math.PI;
      }
    }
    return prepared;
  }, [raw, formula.variables, angleUnits]);

  const runCompute = useCallback(
    async (inputs: RawInputs = preparedInputs) => {
      const validation = validateInputs(formula, inputs, { lang });
      setErrors(validation.errors);
      if (!validation.ok) {
        setComputeError(null);
        toast.error(t('validationError'));
        return;
      }
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setComputing(true);
      setComputeError(null);
      try {
        const computed = await computeFormula(formula, validation.values, {
          signal: controller.signal,
          timeoutMs: 30_000,
        });
        assertFiniteOutputs(formula, computed.values, validation.values);
        setResult(computed);
        addHistory({
          formulaId: formula.id,
          name_fa: formula.name_fa,
          name_en: formula.name_en,
          inputs: validation.values,
          values: computed.values,
        });
        pushRecent(formula.id);
        if (settings.haptics) haptic([10, 20, 10]);
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        const described = describeError(error, lang);
        setComputeError({ title: described.title, message: described.message });
        reportError(error, { formulaId: formula.id, inputs: validation.values, scope: 'formula-solver' });
      } finally {
        setComputing(false);
        abortRef.current = null;
      }
    },
    [addHistory, formula, lang, preparedInputs, pushRecent, settings.haptics, t],
  );

  // Query-string deep links compute once after hydration.
  useEffect(() => {
    if (autoRun.current) return;
    const fromQuery = readQueryInputs(formula);
    if (fromQuery) {
      autoRun.current = true;
      setRaw(fromQuery);
      const timer = setTimeout(() => {
        const prepared: RawInputs = { ...fromQuery };
        void runCompute(prepared);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [formula, runCompute]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const setValue = (name: string, value: string) => {
    setRaw((current) => ({ ...current, [name]: value }));
    if (errors[name]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
    }
  };

  const insertToken = (token: string) => {
    if (!activeField) return;
    const element = inputRefs.current[activeField];
    const current = raw[activeField] ?? '';
    const start = element?.selectionStart ?? current.length;
    const end = element?.selectionEnd ?? start;
    const insert = token === 'rad' ? '' : token;
    const next = `${current.slice(0, start)}${insert}${current.slice(end)}`;
    setValue(activeField, next);
    requestAnimationFrame(() => {
      if (!element) return;
      element.focus({ preventScroll: true });
      const caret = start + insert.length - (token === '()' ? 1 : 0);
      element.setSelectionRange(caret, caret);
    });
  };

  const backspace = () => {
    if (!activeField) return;
    const element = inputRefs.current[activeField];
    const current = raw[activeField] ?? '';
    const start = element?.selectionStart ?? current.length;
    const end = element?.selectionEnd ?? start;
    const from = start === end ? Math.max(0, start - 1) : start;
    setValue(activeField, `${current.slice(0, from)}${current.slice(end)}`);
    requestAnimationFrame(() => element?.setSelectionRange(from, from));
  };

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams();
    for (const variable of formula.variables) {
      const value = raw[variable.name];
      if (value !== '' && value !== undefined) params.set(variable.name, value);
    }
    const url = new URL(`${withBasePath(`/formula/${formula.id}/`)}`, window.location.origin);
    url.search = params.toString();
    return url.toString();
  }, [formula.id, formula.variables, raw]);

  const onShare = async () => {
    const outcome = await shareContent({
      title: formulaName(formula, lang),
      text: `${formulaName(formula, lang)} — ${t('appName')}`,
      url: shareUrl,
    });
    if (outcome === 'shared') toast.success(t('saved'));
    else if (outcome === 'copied') toast.success(t('linkCopied'));
    else if (outcome === 'failed') toast.error(t('shareNotSupported'));
  };

  const loadHistoryEntry = (entry: HistoryEntry) => {
    const next: Record<string, string> = { ...raw };
    for (const [key, value] of Object.entries(entry.inputs)) next[key] = String(value);
    setRaw(next);
    setResult({ values: entry.values, steps: [], durationMs: 0 });
    setTab('calc');
    void runCompute(entry.inputs as RawInputs);
  };

  const applyExample = (input: Record<string, number | string | boolean>) => {
    const next = { ...raw };
    for (const [key, value] of Object.entries(input)) next[key] = String(value);
    setRaw(next);
    setTab('calc');
    void runCompute(input);
  };

  const onTriangleChange = (patch: TrianglePatch) => {
    setRaw((current) => {
      const next = { ...current };
      for (const [key, value] of Object.entries(patch)) {
        if (value !== undefined) next[key] = String(Math.round(value * 100) / 100);
      }
      return next;
    });
  };

  const angleTabs = formula.category_path[0] === 'ریاضیات' && formula.category_path[1] === 'هندسه و مثلثات';

  return (
    <div className="pb-2" data-testid="formula-solver">
      {/* Sticky action bar (formula pages render their own) */}
      <header
        className="sticky top-0 z-nav glass-bar border-b border-outline-variant"
        style={{ paddingTop: 'var(--safe-top)' }}
      >
        <div className="flex h-14 items-center gap-0.5 px-1.5">
          <Link
            href="/categories/"
            aria-label={t('back')}
            className="state-layer flex h-12 w-12 items-center justify-center rounded-full text-on-surface"
          >
            <ArrowLeft className="h-6 w-6 rtl:rotate-180" aria-hidden="true" />
          </Link>
          <h1 className="min-w-0 flex-1 truncate px-1 text-title-medium text-on-surface">
            {formulaName(formula, lang)}
          </h1>
          <IconButton
            label={isBookmarked ? t('starred') : t('star')}
            onClick={() => {
              const added = toggleBookmark(formula.id);
              toast.success(added ? t('bookmarked') : t('unbookmarked'));
            }}
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-6 w-6 text-primary" aria-hidden="true" />
            ) : (
              <Bookmark className="h-6 w-6" aria-hidden="true" />
            )}
          </IconButton>
          <IconButton label={t('share')} onClick={() => void onShare()}>
            <Share2 className="h-6 w-6" aria-hidden="true" />
          </IconButton>
          <IconButton label={t('moreActions')} onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen}>
            <MoreVertical className="h-6 w-6" aria-hidden="true" />
          </IconButton>
        </div>
        {menuOpen && (
            <div className="anim-slide-down absolute end-2 top-full mt-1 w-56 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-high shadow-elevation-3">
              <button
                type="button"
                onClick={() => {
                  void copyToClipboard(formula.formula_latex).then((ok) =>
                    toast[ok ? 'success' : 'error'](ok ? t('copiedToClipboard') : t('copy')),
                  );
                  setMenuOpen(false);
                }}
                className="flex min-h-12 w-full items-center gap-3 px-4 text-body-medium text-on-surface hover:bg-on-surface/5"
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
                {t('copyLatex')}
              </button>
              <button
                type="button"
                onClick={() => {
                  void onShare();
                  setMenuOpen(false);
                }}
                className="flex min-h-12 w-full items-center gap-3 px-4 text-body-medium text-on-surface hover:bg-on-surface/5"
              >
                <Share2 className="h-4 w-4" aria-hidden="true" />
                {t('shareLink')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmClear(true);
                  setMenuOpen(false);
                }}
                className="flex min-h-12 w-full items-center gap-3 px-4 text-body-medium text-error hover:bg-error/10"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {t('clearHistory')}
              </button>
            </div>
          )}

        {/* Tabs */}
        <div
          role="tablist"
          aria-label={formulaName(formula, lang)}
          className="chip-rail px-2 pb-1.5"
        >
          {tabs.map((item) => {
            const Icon = item.icon;
            const selected = tab === item.key;
            return (
              <button
                key={item.key}
                role="tab"
                id={`tab-${item.key}`}
                aria-selected={selected}
                aria-controls={`panel-${item.key}`}
                onClick={() => {
                  setTab(item.key);
                  if (settings.haptics) haptic(8);
                }}
                className={cn(
                  'flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-label-large transition-colors',
                  selected
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-on-surface-variant hover:bg-on-surface/5',
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {t(item.key === 'calc' ? 'calc' : item.key)}
              </button>
            );
          })}
        </div>
      </header>

      <div className="px-4 pt-4" data-testid="formula-page">
        {/* Hero */}
        <section className="mb-4">
          <p className="mb-1 flex flex-wrap items-center gap-1 text-label-small text-on-surface-variant">
            {formula.category_path.map((part) => (
              <span key={part}>{part}</span>
            ))}
            <span aria-hidden="true">·</span>
            <span className="rounded-full bg-surface-container-high px-2 py-0.5">
              {t(formula.difficulty)}
            </span>
          </p>
          <h2 className="text-headline-small font-semibold text-on-surface">{formulaName(formula, lang)}</h2>
          <p className="mt-1 text-body-medium text-on-surface-variant">{formulaDescription(formula, lang)}</p>
          <div className="mt-3">
            <FormulaDisplay latex={formula.formula_latex} />
          </div>
        </section>

        {/* Panels */}
        {tab === 'calc' && (
          <section role="tabpanel" id="panel-calc" aria-labelledby="tab-calc" className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {formula.variables.map((variable) => (
                <FormulaInput
                  key={variable.name}
                  ref={(element) => {
                    inputRefs.current[variable.name] = element;
                  }}
                  variable={variable}
                  value={raw[variable.name] ?? ''}
                  onChange={(value) => setValue(variable.name, value)}
                  onFocus={() => {
                    setActiveField(variable.name);
                    if (variable.type === 'number') setKeyboard(true);
                  }}
                  error={errors[variable.name]}
                  angleUnit={angleUnits[variable.name] ?? 'deg'}
                  onAngleUnitChange={(unit) => setAngleUnits((current) => ({ ...current, [variable.name]: unit }))}
                  mathKeyboard
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Chip
                selected={keyboard}
                onClick={() => setKeyboard((open) => !open)}
                icon={<FunctionSquare className="h-4 w-4" aria-hidden="true" />}
              >
                {t('mathKeyboard')}
              </Chip>
              <Chip onClick={() => void onShare()} icon={<Share2 className="h-4 w-4" aria-hidden="true" />}>
                {t('shareLink')}
              </Chip>
              {angleTabs && (
                <Chip icon={<TriangleRight className="h-4 w-4" aria-hidden="true" />} onClick={() => setTab('plot')}>
                  {t('plot')}
                </Chip>
              )}
            </div>

            {computing && (
              <div className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container p-3" role="status">
                <span className="flex items-center gap-2 text-body-medium text-on-surface">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
                  {t('calculating')}
                </span>
                <Button variant="text" size="sm" onClick={() => abortRef.current?.abort()}>
                  {t('cancelCompute')}
                </Button>
              </div>
            )}

            {computeError && (
              <div role="alert" className="rounded-xl border border-error/40 bg-error-container/40 p-3">
                <p className="text-title-small font-semibold text-on-surface">{computeError.title}</p>
                <p className="mt-1 text-body-small text-on-surface-variant">{computeError.message}</p>
                <Button size="sm" variant="tonal" className="mt-2" onClick={() => void runCompute()}>
                  {t('retry')}
                </Button>
              </div>
            )}

            <div ref={resultRef}>
              {result ? (
                <ResultPanel formula={formula} values={result.values} durationMs={result.durationMs} />
              ) : (
                <div className="rounded-xl border border-dashed border-outline-variant p-4 text-center text-body-medium text-on-surface-variant">
                  {t('inputHelp')}
                </div>
              )}
            </div>
          </section>
        )}

        {tab === 'steps' && (
          <section role="tabpanel" id="panel-steps" aria-labelledby="tab-steps">
            {result?.steps?.length ? (
              <>
                {computeError && <ErrorState title={computeError.title} message={computeError.message} showHome={false} onRetry={() => void runCompute()} />}
                <StepByStep steps={result.steps} />
              </>
            ) : (
              <EmptyState
                icon={<ListOrdered className="h-9 w-9" aria-hidden="true" />}
                title={t('stepsTitle')}
                description={t('inputHelp')}
                action={
                  <Button onClick={() => { setTab('calc'); void runCompute(); }}>{t('compute')}</Button>
                }
              />
            )}
          </section>
        )}

        {tab === 'plot' && (
          <section role="tabpanel" id="panel-plot" aria-labelledby="tab-plot" className="space-y-3">
            <DynamicPlot
              formula={formula}
              inputs={preparedInputs}
              values={result?.values}
              onTriangleChange={onTriangleChange}
            />
          </section>
        )}

        {tab === 'examples' && (
          <section role="tabpanel" id="panel-examples" aria-labelledby="tab-examples" className="space-y-3">
            {formula.examples?.length ? (
              formula.examples.map((example, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => applyExample(example)}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container p-4 text-start transition-colors hover:bg-surface-container-high"
                >
                  <span className="mb-2 flex items-center justify-between">
                    <span className="text-title-small font-medium text-on-surface">
                      {t('example')} {index + 1}
                    </span>
                    <span className="text-label-small text-primary">{t('tryExample')}</span>
                  </span>
                  <span className="flex flex-wrap gap-1.5" dir="ltr">
                    {Object.entries(example).map(([key, value]) => (
                      <span
                        key={key}
                        className="rounded-full bg-surface-container-high px-2 py-0.5 font-mono text-label-small text-on-surface-variant"
                      >
                        {key} = {String(value)}
                      </span>
                    ))}
                  </span>
                </button>
              ))
            ) : (
              <EmptyState title={t('noExamples')} icon={<Sparkles className="h-9 w-9" aria-hidden="true" />} />
            )}
          </section>
        )}

        {tab === 'history' && (
          <section role="tabpanel" id="panel-history" aria-labelledby="tab-history" className="space-y-2">
            {formulaHistory.length ? (
              <ul className="space-y-2">
                {formulaHistory.map((entry) => {
                  const [group] = groupByDate([entry.createdAt], lang);
                  return (
                    <li
                      key={entry.id}
                      className="flex items-start gap-2 rounded-xl border border-outline-variant bg-surface-container p-3"
                    >
                      <button
                        type="button"
                        onClick={() => loadHistoryEntry(entry)}
                        className="min-w-0 flex-1 text-start"
                      >
                        <span className="tnum block text-label-small text-on-surface-variant">
                          {new Intl.DateTimeFormat(lang === 'fa' ? 'fa-IR' : 'en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          }).format(entry.createdAt)}{' '}
                          · {group.label}
                        </span>
                        <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5" dir="ltr">
                          {Object.entries(entry.values).slice(0, 3).map(([key, value]) => (
                            <span key={key} className="tnum font-mono text-body-small text-on-surface">
                              {key}: {typeof value === 'number' ? formatNumber(value, { decimals: 4, lang }) : String(value)}
                            </span>
                          ))}
                        </span>
                      </button>
                      <IconButton
                        label={t('delete')}
                        size="sm"
                        onClick={() => setDeleteTarget(entry)}
                        className="text-on-surface-variant"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </IconButton>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                icon={<History className="h-9 w-9" aria-hidden="true" />}
                title={t('noHistoryForFormula')}
                description={t('historyEmptyHint')}
                action={<Button onClick={() => void runCompute()}>{t('compute')}</Button>}
              />
            )}
          </section>
        )}

        {/* Related */}
        <section className="mt-6">
          <h3 className="mb-2 text-title-small font-semibold text-on-surface">{t('suggested')}</h3>
          <div className="chip-rail">
            {relatedFormulas(formula).map((related) => (
              <Link
                key={related.id}
                href={`/formula/${related.id}/`}
                className="rounded-full border border-outline-variant px-3 py-2 text-label-medium text-on-surface-variant hover:bg-on-surface/5"
              >
                {formulaName(related, lang)}
              </Link>
            ))}
          </div>
        </section>

        <div className="h-32" />
      </div>

      {/* Bottom CTA */}
      {!keyboard && (
        <div
          className="fixed inset-x-0 z-nav border-t border-outline-variant bg-surface-container/95 px-4 pt-2 glass-bar"
          style={{ bottom: 'calc(var(--bottom-nav-height) + var(--safe-bottom))', paddingBottom: '0.5rem' }}
        >
          <div className="mx-auto max-w-xl">
            <Button
              fullWidth
              size="lg"
              loading={computing}
              onClick={() => {
                if (settings.haptics) haptic(12);
                void runCompute();
              }}
              className="h-14"
            >
              {computing ? t('calculating') : t('compute')}
              <Check className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      <MathKeyboard
        open={keyboard}
        onClose={() => setKeyboard(false)}
        onInsert={insertToken}
        onBackspace={backspace}
        onClear={() => activeField && setValue(activeField, '')}
        onDone={() => {
          setKeyboard(false);
          void runCompute();
        }}
        activeLabel={
          activeField
            ? formula.variables.find((variable) => variable.name === activeField)?.name
            : undefined
        }
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('deleteHistoryConfirm')}
        description={t('clearCacheConfirmHint')}
        destructive
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteHistory(deleteTarget.id);
            toast.success(t('deleted'));
          }
        }}
      />
      <ConfirmDialog
        open={confirmClear}
        title={t('deleteAllHistory')}
        description={t('clearCacheConfirmHint')}
        destructive
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          clearFormulaHistory(formula.id);
          toast.success(t('historyCleared'));
        }}
      />

      {keyboardOpen && <div aria-hidden="true" className="pb-keyboard" />}
      {errors && Object.keys(errors).length > 0 && (
        <p className="sr-only" role="alert">
          {t('validationSummary', { count: Object.keys(errors).length })}
        </p>
      )}
    </div>
  );
}
