/**
 * Builds the two formula manifests that ship to the browser:
 *
 *  formula-index.json        – list/search metadata used by the app shell
 *                              (id, names, category, tags, difficulty, test count)
 *  formula-descriptions.json – Persian one-line summaries, imported lazily by
 *                              list cards so ~9 KB gzip stays out of first load
 *  formula-details.json      – heavier per-formula metadata (variables, outputs,
 *                              examples, plot hints), lazy-loaded by /formula/[id]/
 *
 * Executable solvers never ship in either file: they live in the computation
 * Web Worker (`workers/compute-worker.ts`). Keeping the split explicit is what
 * holds first-load JS under the 200 KB gzip budget.
 */
import { writeFile } from 'node:fs/promises';
import { FORMULAS } from '../apps/web/registry.js';

const variableKeys = ['name', 'label_fa', 'label_en', 'type', 'unit', 'required', 'default', 'min', 'max', 'step', 'options'];

const compactVariable = (variable) => {
  const output = {};
  for (const key of variableKeys) {
    if (variable[key] !== undefined && variable[key] !== null) output[key] = variable[key];
  }
  return output;
};

const index = [];
const descriptions = {};
const details = {};

for (const formula of FORMULAS) {
  index.push({
    id: formula.id,
    name_fa: formula.name_fa,
    name_en: formula.name_en,
    category_path: formula.category_path,
    tags: formula.tags ?? [],
    difficulty: formula.difficulty,
    test_count: (formula.tests ?? []).length,
  });
  descriptions[formula.id] = formula.description_fa;
  details[formula.id] = {
    formula_latex: formula.formula_latex,
    variables: formula.variables.map(compactVariable),
    outputs: formula.outputs.map(({ name, label_fa, label_en, unit }) => ({
      name,
      label_fa,
      label_en,
      unit: unit ?? null,
    })),
    examples: (formula.examples ?? []).map((example) => example.input ?? example),
    plot_spec: formula.plot_spec ?? null,
    version: formula.version ?? '1.0.0',
    validated: Boolean(formula.validated),
  };
}

const indexJson = JSON.stringify(index);
const descriptionsJson = JSON.stringify(descriptions);
const detailsJson = JSON.stringify(details);
const dir = new URL('../packages/formula-registry/', import.meta.url);
await writeFile(new URL('formula-index.json', dir), `${indexJson}\n`);
await writeFile(new URL('formula-descriptions.json', dir), `${descriptionsJson}\n`);
await writeFile(new URL('formula-details.json', dir), `${detailsJson}\n`);

console.log(
  `Formula manifests built: ${index.length} index entries (${(indexJson.length / 1024).toFixed(1)} KB) ` +
    `and ${Object.keys(details).length} detail entries (${(detailsJson.length / 1024).toFixed(1)} KB) ` +
    `plus ${(descriptionsJson.length / 1024).toFixed(1)} KB of lazy descriptions.`,
);
