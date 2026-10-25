'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Workflow } from 'lucide-react';
import { FORMULAS, loadFormula, formulaName, variableLabel, outputLabel, type Formula } from '@/lib/formulas';
import { computeFormula } from '@/lib/compute-client';
import { PIPELINE_TEMPLATES, runPipeline, type PipelineStep } from '@/lib/pipeline';
import { useI18n } from '@/lib/i18n';
import { formatNumber } from '@/lib/utils';

const uid = () => `step-${Math.random().toString(36).slice(2, 8)}`;
const cloneSteps = (steps: PipelineStep[]): PipelineStep[] => JSON.parse(JSON.stringify(steps)) as PipelineStep[];

const inputClass = 'h-11 min-w-0 flex-1 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 font-mono text-body-medium text-on-surface outline-none focus:border-primary';
const selectClass = 'h-11 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-body-medium text-on-surface outline-none focus:border-primary';

export default function PipelinePage() {
  const { lang, numerals } = useI18n();
  const fa = lang !== 'en';
  const [steps, setSteps] = useState<PipelineStep[]>(() => cloneSteps(PIPELINE_TEMPLATES[0].steps));
  const [details, setDetails] = useState<Record<string, Formula>>({});
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Array<{ values: Record<string, unknown> }> | null>(null);

  const neededIds = useMemo(() => [...new Set(steps.map((step) => step.formulaId))], [steps]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      for (const id of neededIds) {
        if (details[id]) continue;
        const formula = await loadFormula(id);
        if (formula && !cancelled) setDetails((current) => ({ ...current, [id]: formula }));
      }
    })();
    return () => { cancelled = true; };
  }, [neededIds, details]);

  // When a step's formula changes, rebuild its bindings from its variables.
  const changeFormula = (stepId: string, formulaId: string) => {
    setResults(null);
    setSteps((current) => current.map((step) => (step.id === stepId ? { ...step, formulaId, bindings: [] } : step)));
    void loadFormula(formulaId).then((formula) => {
      if (!formula) return;
      setDetails((current) => ({ ...current, [formulaId]: formula }));
      setSteps((current) => current.map((step) => {
        if (step.id !== stepId || step.formulaId !== formulaId || step.bindings.length) return step;
        return {
          ...step,
          bindings: formula.variables.map((variable) => ({
            input: variable.name,
            source: { kind: 'literal' as const, value: variable.default !== undefined && variable.default !== null ? String(variable.default) : '' },
          })),
        };
      }));
    });
  };

  const setBinding = (stepId: string, input: string, source: PipelineStep['bindings'][number]['source']) => {
    setSteps((current) => current.map((step) => {
      if (step.id !== stepId) return step;
      const existing = step.bindings.some((b) => b.input === input);
      const bindings = existing
        ? step.bindings.map((b) => (b.input === input ? { ...b, source } : b))
        : [...step.bindings, { input, source }];
      return { ...step, bindings };
    }));
  };

  const bindingOf = (step: PipelineStep, input: string) => step.bindings.find((b) => b.input === input);

  const run = async () => {
    setRunning(true);
    setError(null);
    setResults(null);
    try {
      const outcome = await runPipeline(steps, async (formulaId, inputs) => {
        const formula = details[formulaId] ?? (await loadFormula(formulaId));
        if (!formula) throw new Error(`Unknown formula: ${formulaId}`);
        const computed = await computeFormula(formula, inputs);
        return { values: computed.values, steps: computed.steps };
      });
      setResults(outcome.results);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-5 px-4 pb-8 pt-3">
      <header className="hero-surface p-5">
        <p className="data-pill relative z-10"><Workflow className="h-3.5 w-3.5" aria-hidden="true" />{fa ? 'ابزارها' : 'Tools'}</p>
        <h1 className="relative z-10 mt-2 text-headline-medium font-bold text-on-surface">{fa ? 'زنجیرهٔ محاسبات' : 'Calculation pipeline'}</h1>
        <p className="relative z-10 mt-1 text-body-medium text-on-surface-variant">
          {fa ? 'خروجی هر فرمول، ورودی فرمول بعدی شود؛ یک مدل چندمرحله‌ای بسازید و همهٔ مراحل میانی را ببینید.' : 'Chain formulas so each output feeds the next input, and inspect every intermediate step.'}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {PIPELINE_TEMPLATES.map((template) => (
          <button key={template.id} type="button" onClick={() => { setSteps(cloneSteps(template.steps)); setResults(null); }} className="min-h-10 rounded-full border border-outline-variant px-3 text-label-large text-on-surface">
            {fa ? template.titleFa : template.titleEn}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSteps((current) => [...current, { id: uid(), formulaId: 'quadratic', bindings: [] }])}
          className="flex min-h-10 items-center gap-1 rounded-full bg-primary-container px-3 text-label-large text-on-primary-container"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />{fa ? 'افزودن گام' : 'Add step'}
        </button>
      </div>

      <ol className="space-y-3">
        {steps.map((step, stepIndex) => {
          const detail = details[step.formulaId];
          return (
            <li key={step.id} className="rounded-3xl border border-outline-variant bg-surface-container p-4">
              <div className="flex items-center gap-2">
                <span className="tnum flex h-8 w-8 shrink-0 items-center justify-center rounded-full brand-gradient font-bold text-white">{stepIndex + 1}</span>
                <select
                  value={step.formulaId}
                  onChange={(event) => changeFormula(step.id, event.target.value)}
                  className={`${selectClass} min-w-0 flex-1`}
                  aria-label={fa ? 'فرمول این گام' : 'Step formula'}
                >
                  {FORMULAS.map((formula) => (
                    <option key={formula.id} value={formula.id}>{formulaName(formula, lang)}</option>
                  ))}
                </select>
                {steps.length > 1 && (
                  <button type="button" aria-label={fa ? 'حذف گام' : 'Remove step'} onClick={() => setSteps((current) => current.filter((s) => s.id !== step.id))} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-error">
                    <Trash2 className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
              </div>

              {detail && (
                <div className="mt-3 space-y-2">
                  {detail.variables.map((variable) => {
                    const binding = bindingOf(step, variable.name);
                    const source = binding?.source ?? { kind: 'literal' as const, value: variable.default != null ? String(variable.default) : '' };
                    return (
                      <div key={variable.name} className="flex flex-wrap items-center gap-2">
                        <span className="min-w-36 text-body-small font-medium text-on-surface">{variableLabel(variable, lang)}</span>
                        <select
                          value={source.kind}
                          onChange={(event) => {
                            if (event.target.value === 'literal') {
                              setBinding(step.id, variable.name, { kind: 'literal', value: variable.default != null ? String(variable.default) : '' });
                            } else {
                              const firstOutput = stepIndex > 0 ? details[steps[0].formulaId]?.outputs[0]?.name : undefined;
                              setBinding(step.id, variable.name, { kind: 'step', stepIndex: 0, output: firstOutput ?? '' });
                            }
                          }}
                          className={selectClass}
                          aria-label={`${variableLabel(variable, lang)} — ${fa ? 'منبع' : 'source'}`}
                        >
                          <option value="literal">{fa ? 'مقدار ثابت' : 'Literal'}</option>
                          <option value="step" disabled={stepIndex === 0}>{fa ? 'از گام قبلی' : 'From a step'}</option>
                        </select>
                        {source.kind === 'literal' ? (
                          <input
                            value={source.value}
                            onChange={(event) => setBinding(step.id, variable.name, { kind: 'literal', value: event.target.value })}
                            dir="ltr"
                            className={inputClass}
                            aria-label={variableLabel(variable, lang)}
                          />
                        ) : (
                          <>
                            <select
                              value={source.stepIndex}
                              onChange={(event) => setBinding(step.id, variable.name, { kind: 'step', stepIndex: Number(event.target.value), output: source.output })}
                              className={selectClass}
                              aria-label={fa ? 'گام منبع' : 'Source step'}
                            >
                              {steps.slice(0, stepIndex).map((_, index) => (
                                <option key={index} value={index}>{fa ? `گام ${index + 1}` : `Step ${index + 1}`}</option>
                              ))}
                            </select>
                            <select
                              value={source.output}
                              onChange={(event) => setBinding(step.id, variable.name, { kind: 'step', stepIndex: source.stepIndex, output: event.target.value })}
                              className={selectClass}
                              aria-label={fa ? 'خروجی منبع' : 'Source output'}
                            >
                              {(details[steps[source.stepIndex]?.formulaId]?.outputs ?? []).map((output) => (
                                <option key={output.name} value={output.name}>{outputLabel(output, lang)}</option>
                              ))}
                            </select>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {results?.[stepIndex] && (
                <dl className="mt-3 grid grid-cols-2 gap-2" aria-live="polite">
                  {Object.entries(results[stepIndex].values).slice(0, 6).map(([key, value]) => (
                    <div key={key} className="rounded-xl bg-primary-container/30 px-3 py-2">
                      <dt className="text-label-small text-on-surface-variant">{key}</dt>
                      <dd className="tnum break-words font-mono text-body-medium font-semibold text-on-surface" dir="ltr">
                        {typeof value === 'number' ? formatNumber(value, { decimals: 6, lang, numerals }) : String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </li>
          );
        })}
      </ol>

      {error && <p role="alert" className="rounded-xl bg-error-container/50 p-3 text-body-small text-on-surface">{error}</p>}

      <button type="button" disabled={running || !steps.length} onClick={() => void run()} className="min-h-12 w-full rounded-full brand-gradient font-semibold text-white shadow-glow disabled:opacity-50">
        {running ? '…' : fa ? 'اجرای زنجیره' : 'Run pipeline'}
      </button>
    </div>
  );
}
