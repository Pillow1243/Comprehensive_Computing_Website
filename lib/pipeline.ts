/**
 * Calculation pipelines (v5) — chain formulas so the output of one solver
 * becomes the input of the next, turning isolated calculators into a model:
 *
 *   BMI → TDEE → daily calories → macro split …
 *
 * A step binds each of its inputs either to a literal value typed by the user
 * or to a named output of an earlier step. Execution is strictly sequential
 * and every intermediate result is kept, so the whole chain stays auditable.
 */

export interface PipelineBinding {
  /** input variable name of this step */
  input: string;
  source:
    | { kind: 'literal'; value: string }
    | { kind: 'step'; stepIndex: number; output: string };
}

export interface PipelineStep {
  id: string;
  formulaId: string;
  bindings: PipelineBinding[];
}

export interface PipelineStepResult {
  stepId: string;
  formulaId: string;
  inputs: Record<string, string | number | boolean>;
  values: Record<string, unknown>;
  steps: string[];
}

export interface PipelineRun {
  results: PipelineStepResult[];
  /** flattened outputs of the last executed step */
  finalValues: Record<string, unknown>;
}

/** Resolve one step's concrete inputs from literals and earlier results. */
export function resolveStepInputs(
  step: PipelineStep,
  previous: PipelineStepResult[],
): Record<string, string | number | boolean> {
  const inputs: Record<string, string | number | boolean> = {};
  for (const binding of step.bindings) {
    if (binding.source.kind === 'literal') {
      inputs[binding.input] = binding.source.value;
      continue;
    }
    const source = previous[binding.source.stepIndex];
    if (!source) throw new Error(`Pipeline step source ${binding.source.stepIndex + 1} has not run yet`);
    const value = source.values[binding.source.output];
    if (value === undefined) {
      throw new Error(`Output «${binding.source.output}» is not produced by step ${binding.source.stepIndex + 1}`);
    }
    inputs[binding.input] = value as string | number | boolean;
  }
  return inputs;
}

/**
 * Execute a pipeline with an injected compute function (the worker client in
 * the browser, a direct solver in tests). Stops at the first failing step and
 * reports which step failed so the UI can point at it.
 */
export async function runPipeline(
  steps: PipelineStep[],
  compute: (
    formulaId: string,
    inputs: Record<string, string | number | boolean>,
  ) => Promise<{ values: Record<string, unknown>; steps: string[] }>,
): Promise<PipelineRun> {
  const results: PipelineStepResult[] = [];
  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    let inputs: Record<string, string | number | boolean>;
    try {
      inputs = resolveStepInputs(step, results);
    } catch (error) {
      throw new Error(`Step ${index + 1}: ${error instanceof Error ? error.message : String(error)}`);
    }
    try {
      const computed = await compute(step.formulaId, inputs);
      results.push({ stepId: step.id, formulaId: step.formulaId, inputs, values: computed.values, steps: computed.steps });
    } catch (error) {
      throw new Error(`Step ${index + 1}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return { results, finalValues: results.length ? results[results.length - 1].values : {} };
}

/** Suggested starter chains built only from formulas that exist in the registry. */
export const PIPELINE_TEMPLATES: Array<{
  id: string;
  titleFa: string;
  titleEn: string;
  descriptionFa: string;
  descriptionEn: string;
  steps: PipelineStep[];
}> = [
  {
    id: 'health-energy',
    titleFa: 'انرژی و کالری روزانه',
    titleEn: 'Daily energy chain',
    descriptionFa: 'شاخص توده بدنی ← نرخ متابولیسم و کالری نگهدارنده',
    descriptionEn: 'BMI → BMR/TDEE maintenance calories',
    steps: [
      {
        id: 't1',
        formulaId: 'bmi',
        bindings: [
          { input: 'mass', source: { kind: 'literal', value: '70' } },
          { input: 'height', source: { kind: 'literal', value: '1.75' } },
        ],
      },
      {
        id: 't2',
        formulaId: 'bmr_tdee',
        bindings: [
          { input: 'weight', source: { kind: 'literal', value: '70' } },
          { input: 'height', source: { kind: 'literal', value: '175' } },
          { input: 'age', source: { kind: 'literal', value: '30' } },
          { input: 'sex', source: { kind: 'literal', value: 'male' } },
          { input: 'activity', source: { kind: 'literal', value: '1.4' } },
        ],
      },
    ],
  },
];
