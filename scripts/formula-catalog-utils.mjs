const pythonSolvers=new Set(['trig_triangle_law_of_cosines','quadratic','ph']);

export function serializeFormula(formula){
  return {
    id:formula.id,
    name_fa:formula.name_fa,
    name_en:formula.name_en,
    category_path:formula.category_path,
    tags:formula.tags||[],
    description_fa:formula.description_fa||'',
    variables:formula.variables,
    outputs:formula.outputs,
    formula_latex:formula.formula_latex,
    compute_js:formula.compute_js,
    ...(pythonSolvers.has(formula.id)?{compute_python:`server:backend/registry_data.py#${formula.id}`}:{ }),
    steps_generator:formula.steps_generator_ref,
    plot_spec:formula.plot_spec??null,
    examples:formula.examples||[],
    tests:formula.tests||[],
    references:formula.references||[],
    scientific_review_status:formula.scientific_review_status||'not_reviewed',
    reviewed_by:formula.reviewed_by??null,
    reviewed_at:formula.reviewed_at??null,
    difficulty:formula.difficulty||'basic',
    version:formula.version||'1.0.0',
    validated:Boolean(formula.validated),
  };
}

export function stableJson(value){
  if(Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if(value&&typeof value==='object') return `{${Object.keys(value).filter(key=>value[key]!==undefined).sort().map(key=>`${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
