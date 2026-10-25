import {readFile,writeFile} from 'node:fs/promises';
import {FORMULAS} from '../apps/web/registry.js';
import {serializeFormula} from './formula-catalog-utils.mjs';

const catalogPath=new URL('../packages/formula-registry/catalog.json',import.meta.url);
const catalog=JSON.parse(await readFile(catalogPath,'utf8'));
const sectionMatches={
  sec_01:f=>f.category_path?.[1]==='حساب و نظریه اعداد',
  sec_02:f=>f.category_path?.[1]==='جبر',
  sec_03:f=>f.category_path?.[1]==='هندسه و مثلثات',
  sec_04:f=>f.category_path?.[1]==='حساب دیفرانسیل',
  sec_05:f=>f.category_path?.[1]==='جبر خطی',
  sec_06:f=>f.category_path?.[1]==='آمار و احتمال',
  sec_07:f=>f.category_path?.[1]==='ریاضیات گسسته',
  sec_13:f=>['زمین و محیط','زیست و سلامت'].includes(f.category_path?.[0]),
  sec_14:f=>f.category_path?.[0]==='کامپیوتر و اطلاعات',
  sec_10:f=>f.category_path?.[0]==='فیزیک',
  sec_11:f=>f.category_path?.[0]==='شیمی',
  sec_12:f=>f.category_path?.[0]==='مهندسی',
  sec_19:f=>f.category_path?.[0]==='مالی و اقتصاد',
  sec_24:f=>f.category_path?.[0]==='نجوم و فضا',
};

catalog.version='2.2.0';
catalog.schema_version='1.1.0';
catalog.implemented_formula_ids=FORMULAS.map(formula=>formula.id);
catalog.implemented_count=FORMULAS.length;
catalog.formula_index=FORMULAS.map(serializeFormula);

for(const section of catalog.sections){
  const matches=catalog.formula_index.filter(sectionMatches[section.id]||(()=>false));
  section.implemented_formula_count=matches.length;
  section.implemented_formula_ids=matches.map(formula=>formula.id);
  // Never label an empty section implemented; partial means at least one item exists.
  section.status=matches.length?'partial':'planned';
}

await writeFile(catalogPath,`${JSON.stringify(catalog,null,2)}\n`);
console.log(`Catalog synchronized: ${FORMULAS.length} full formula records across ${catalog.sections.length} sections.`);
