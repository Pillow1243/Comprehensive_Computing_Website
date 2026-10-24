import {readFile} from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';
import {FORMULAS} from '../apps/web/registry.js';
import {serializeFormula,stableJson} from './formula-catalog-utils.mjs';

const indexManifest=JSON.parse(await readFile(new URL('../packages/formula-registry/formula-index.json',import.meta.url),'utf8'));
const detailManifest=JSON.parse(await readFile(new URL('../packages/formula-registry/formula-details.json',import.meta.url),'utf8'));

const fail=message=>{console.error(`Registry validation failed: ${message}`);process.exitCode=1;};
const catalog=JSON.parse(await readFile(new URL('../packages/formula-registry/catalog.json',import.meta.url),'utf8'));
const schema=JSON.parse(await readFile(new URL('../packages/formula-registry/schema.json',import.meta.url),'utf8'));
const validateFormulaSchema=new Ajv2020({allErrors:true,strict:false}).compile(schema);
const formulaIds=new Set();
const errors=[];

for(const formula of FORMULAS){
  if(!formula.id||!(/^[a-z][a-z0-9_]{1,79}$/).test(formula.id)) errors.push(`invalid id: ${formula.id}`);
  if(formulaIds.has(formula.id)) errors.push(`duplicate id: ${formula.id}`);
  formulaIds.add(formula.id);
  for(const key of ['name_fa','name_en','description_fa','formula_latex']) if(typeof formula[key]!=='string'||!formula[key].trim()) errors.push(`${formula.id}: missing ${key}`);
  if(!Array.isArray(formula.category_path)||formula.category_path.length<1) errors.push(`${formula.id}: category_path must be non-empty`);
  if(!Array.isArray(formula.tags)) errors.push(`${formula.id}: tags must be an array`);
  if(!Array.isArray(formula.variables)||formula.variables.length<1) errors.push(`${formula.id}: variables must be non-empty`);
  if(!Array.isArray(formula.outputs)||formula.outputs.length<1) errors.push(`${formula.id}: outputs must be non-empty`);
  if(!Array.isArray(formula.examples)||formula.examples.length<1) errors.push(`${formula.id}: at least one example is required`);
  if(!Array.isArray(formula.references)) errors.push(`${formula.id}: references must be an array`);
  if(typeof formula.compute_js!=='string'||!/^module:[A-Za-z0-9_./-]+#[a-z][a-z0-9_]*$/.test(formula.compute_js)) errors.push(`${formula.id}: invalid trusted JS module reference`);
  if(typeof formula.steps_generator_ref!=='string'||!/^module:[A-Za-z0-9_./-]+#[a-z][a-z0-9_]*$/.test(formula.steps_generator_ref)) errors.push(`${formula.id}: invalid steps-generator module reference`);
  if(!Array.isArray(formula.tests)||formula.tests.length<2) errors.push(`${formula.id}: at least two tests are required (got ${formula.tests?.length??0})`);
  const distinctInputs=new Set((formula.tests||[]).map(test=>stableJson(test.input)));
  if(distinctInputs.size!==(formula.tests||[]).length) errors.push(`${formula.id}: duplicate test inputs are not allowed`);
  const outputNames=new Set((formula.outputs||[]).map(output=>output.name));
  for(const test of formula.tests||[]) for(const key of Object.keys(test.expected||{})) if(!outputNames.has(key)) errors.push(`${formula.id}: outputs metadata is missing '${key}'`);
  if(typeof formula.compute!=='function') errors.push(`${formula.id}: trusted compute function is missing`);
  if(typeof formula.steps_generator!=='function') errors.push(`${formula.id}: steps generator is missing`);
  if(!['basic','intermediate','advanced'].includes(formula.difficulty)) errors.push(`${formula.id}: invalid difficulty`);
  if(typeof formula.validated!=='boolean') errors.push(`${formula.id}: validated must be boolean`);
  for(const variable of formula.variables||[]){
    for(const key of ['name','label_fa','type']) if(!(key in variable)) errors.push(`${formula.id}: variable missing ${key}`);
  }
  for(const [index,test] of (formula.tests||[]).entries()){
    if(!test.input||typeof test.input!=='object'||!test.expected||typeof test.expected!=='object'||!Object.keys(test.expected).length){
      errors.push(`${formula.id}: test ${index+1} must include input and expected output`);continue;
    }
    try{
      const result=formula.compute({...test.input});
      if(!result||!result.values||!Array.isArray(result.steps)||result.steps.length===0) errors.push(`${formula.id}: test ${index+1} returned invalid values/steps`);
      for(const key of Object.keys(test.expected)) if(!(key in result.values)) errors.push(`${formula.id}: test ${index+1} expects missing output '${key}'`);
      for(const [key,value] of Object.entries(result.values)) if(typeof value==='number'&&!Number.isFinite(value)) errors.push(`${formula.id}: test ${index+1} produced a non-finite output '${key}'`);
    }catch(error){errors.push(`${formula.id}: test ${index+1} throws: ${error.message}`);}
  }
}

const schemaRequired=['id','name_fa','name_en','category_path','tags','description_fa','variables','outputs','formula_latex','compute_js','steps_generator','examples','tests','references','difficulty','version','validated'];
for(const field of schemaRequired) if(!schema.required?.includes(field)) errors.push(`JSON Schema does not require ${field}`);
const catalogIds=new Set(catalog.implemented_formula_ids||[]);
if(catalog.schema_version!=='1.0.0') errors.push(`unsupported catalog schema version ${catalog.schema_version}`);
if(catalog.implemented_count!==FORMULAS.length) errors.push(`catalog count ${catalog.implemented_count} != runtime count ${FORMULAS.length}`);
if(catalogIds.size!==FORMULAS.length) errors.push(`catalog has ${catalogIds.size} unique IDs; runtime has ${FORMULAS.length}`);
for(const id of formulaIds) if(!catalogIds.has(id)) errors.push(`catalog is missing ${id}`);
for(const id of catalogIds) if(!formulaIds.has(id)) errors.push(`catalog contains unimplemented ID ${id}`);
if(!Array.isArray(catalog.formula_index)||catalog.formula_index.length!==FORMULAS.length) errors.push('formula_index must have one entry per implemented formula');
else for(const item of catalog.formula_index){
  if(!validateFormulaSchema(item)) for(const validationError of validateFormulaSchema.errors||[]) errors.push(`formula_index ${item.id}: JSON Schema ${validationError.instancePath||'/'} ${validationError.message}`);
  if(!formulaIds.has(item.id)) errors.push(`formula_index has unknown ID ${item.id}`);
  for(const field of schemaRequired) if(!(field in item)) errors.push(`formula_index ${item.id}: missing ${field}`);
  const formula=FORMULAS.find(candidate=>candidate.id===item.id);
  if(formula&&stableJson(item)!==stableJson(serializeFormula(formula))) errors.push(`formula_index ${item.id}: metadata differs from the trusted runtime registry`);
}
if(!Array.isArray(catalog.sections)||catalog.sections.length!==29) errors.push('catalog must retain the 29 planned discipline sections');

// ── browser manifests must match the trusted registry exactly ─────────────
if(!Array.isArray(indexManifest)||indexManifest.length!==FORMULAS.length) errors.push(`formula-index.json must contain ${FORMULAS.length} entries; run npm run build:index`);
if(Object.keys(detailManifest).length!==FORMULAS.length) errors.push(`formula-details.json must contain ${FORMULAS.length} entries; run npm run build:index`);
for(const formula of FORMULAS){
  const indexEntry=indexManifest.find(entry=>entry.id===formula.id);
  if(!indexEntry){errors.push(`formula-index.json is missing ${formula.id}`);continue;}
  if(indexEntry.name_fa!==formula.name_fa||indexEntry.name_en!==formula.name_en||stableJson(indexEntry.category_path)!==stableJson(formula.category_path)) errors.push(`formula-index.json is stale for ${formula.id}`);
  if(indexEntry.test_count!==formula.tests.length) errors.push(`formula-index.json test_count is stale for ${formula.id}`);
  const detail=detailManifest[formula.id];
  if(!detail){errors.push(`formula-details.json is missing ${formula.id}`);continue;}
  if(detail.variables.length!==formula.variables.length) errors.push(`formula-details.json variables are stale for ${formula.id}`);
  if(detail.outputs.length!==formula.outputs.length) errors.push(`formula-details.json outputs are stale for ${formula.id}`);
}

if(errors.length){for(const error of errors)fail(error);process.exit(1);}
const testCases=FORMULAS.reduce((n,formula)=>n+formula.tests.length,0);
console.log(`Registry valid: ${FORMULAS.length} formulas, ${testCases} declared cases, ${catalog.sections.length} catalog sections, manifests in sync.`);
