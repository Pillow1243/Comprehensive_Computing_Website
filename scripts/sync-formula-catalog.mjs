import {readFile,writeFile} from 'node:fs/promises';
import {FORMULAS} from '../apps/web/registry.js';
import {serializeFormula} from './formula-catalog-utils.mjs';

const catalogPath=new URL('../packages/formula-registry/catalog.json',import.meta.url);
const catalog=JSON.parse(await readFile(catalogPath,'utf8'));
const sub=(f,name,top)=>f.category_path?.[1]===name&&(!top||f.category_path?.[0]===top);
const sectionMatches={
  sec_01:f=>sub(f,'حساب و نظریه اعداد'),
  sec_02:f=>sub(f,'جبر'),
  sec_03:f=>sub(f,'هندسه و مثلثات'),
  sec_04:f=>sub(f,'حساب دیفرانسیل'),
  sec_05:f=>sub(f,'جبر خطی'),
  sec_06:f=>sub(f,'آمار و احتمال'),
  sec_07:f=>sub(f,'ریاضیات گسسته'),
  sec_08:f=>sub(f,'بهینه‌سازی','ریاضیات'),
  sec_09:f=>sub(f,'توابع خاص','ریاضیات'),
  sec_10:f=>f.category_path?.[0]==='فیزیک',
  sec_11:f=>f.category_path?.[0]==='شیمی',
  // Engineering core only; signal/reliability/robotics own their sections (v4).
  sec_12:f=>f.category_path?.[0]==='مهندسی'&&['استاتیک','مدار و الکترونیک','مکانیک سیالات','انتقال حرارت','کنترل'].includes(f.category_path?.[1]),
  // Earth & health, excluding navigation which owns sec_29 (v4).
  sec_13:f=>['زمین و محیط','زیست و سلامت'].includes(f.category_path?.[0])&&f.category_path?.[1]!=='ناوبری',
  // Information core only; the new CS topics own their sections (v4).
  sec_14:f=>f.category_path?.[0]==='کامپیوتر و اطلاعات'&&['نظریه اطلاعات','ترکیبیات'].includes(f.category_path?.[1]),
  sec_15:f=>sub(f,'پردازش سیگنال','مهندسی'),
  sec_16:f=>sub(f,'یادگیری ماشین','کامپیوتر و اطلاعات'),
  sec_17:f=>sub(f,'نظریه بازی','ریاضیات'),
  sec_18:f=>sub(f,'قابلیت اطمینان','مهندسی'),
  sec_19:f=>f.category_path?.[0]==='مالی و اقتصاد',
  sec_20:f=>sub(f,'سری زمانی','ریاضیات'),
  sec_21:f=>sub(f,'رباتیک','مهندسی'),
  sec_22:f=>sub(f,'گرافیک سه‌بعدی','کامپیوتر و اطلاعات'),
  sec_23:f=>sub(f,'پردازش تصویر و صدا','کامپیوتر و اطلاعات'),
  sec_24:f=>f.category_path?.[0]==='نجوم و فضا',
  sec_25:f=>sub(f,'موسیقی و رنگ','کامپیوتر و اطلاعات'),
  sec_26:f=>sub(f,'محاسبات عددی','ریاضیات'),
  sec_27:f=>sub(f,'منطق فازی','کامپیوتر و اطلاعات'),
  sec_28:f=>sub(f,'نظریه صف','ریاضیات'),
  sec_29:f=>sub(f,'ناوبری','زمین و محیط'),
};

catalog.version='3.0.0';
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
