// Phase 9 — the v5 expansion pack: everyday-life calculators, configurable
// Iran-desk formulas (rates/indices are explicit inputs, never hard-coded law)
// and a two-variable linear-programming solver. Every expected value below is
// verifiable by hand or by an independent calendar/arithmetic check.
import { make, N, T, O, round, out, parseList } from './formula-kit.js';

// Howard Hinnant's civil-calendar algorithms (proleptic Gregorian).
const daysFromCivil = (y0, m, d) => {
  const y = m <= 2 ? y0 - 1 : y0;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const mp = (m + 9) % 12;
  const doy = Math.floor((153 * mp + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
};
const civilFromDays = (z0) => {
  const z = z0 + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const y = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp + (mp < 10 ? 3 : -9);
  return { y: m <= 2 ? y + 1 : y, m, d };
};
const fmtDate = ({ y, m, d }) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const WEEKDAYS = ['Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];
const weekdayOf = (days) => WEEKDAYS[((days % 7) + 7) % 7];

export const PHASE9_FORMULAS = [
  make({
    id: 'age_and_date_difference',
    name_fa: 'سن دقیق و اختلاف دو تاریخ (میلادی)',
    name_en: 'Exact Age & Date Difference (Gregorian)',
    category_path: ['ریاضیات', 'حساب و نظریه اعداد'],
    tags: ['سن', 'تاریخ', 'age', 'date'],
    description_fa: 'سن دقیق (سال/ماه/روز) و اختلاف کامل دو تاریخ میلادی.',
    formula_latex: '\\Delta d = \\mathrm{days}(date_2)-\\mathrm{days}(date_1)',
    difficulty: 'basic',
    variables: [
      N('birth_year', 'سال تولد', 'Birth year', null, 2000, { min: 1, max: 9999 }),
      N('birth_month', 'ماه تولد', 'Birth month', null, 1, { min: 1, max: 12 }),
      N('birth_day', 'روز تولد', 'Birth day', null, 1, { min: 1, max: 31 }),
      N('ref_year', 'سال تاریخ مرجع', 'Reference year', null, 2025, { min: 1, max: 9999 }),
      N('ref_month', 'ماه مرجع', 'Reference month', null, 1, { min: 1, max: 12 }),
      N('ref_day', 'روز مرجع', 'Reference day', null, 1, { min: 1, max: 31 }),
    ],
    outputs: [O('years', 'سال', null, 'Years'), O('months', 'ماه', null, 'Months'), O('days', 'روز', null, 'Days'), O('total_days', 'مجموع روزها', null, 'Total Days'), O('weekday_birth', 'روز هفته تولد', null, 'Birth Weekday')],
    tests: [
      { input: { birth_year: 2000, birth_month: 1, birth_day: 1, ref_year: 2025, ref_month: 1, ref_day: 1 }, expected: { years: 25, months: 0, days: 0, total_days: 9131 } },
      { input: { birth_year: 1990, birth_month: 6, birth_day: 15, ref_year: 2024, ref_month: 3, ref_day: 20 }, expected: { years: 33, months: 9, days: 5, total_days: 12332 } },
    ],
    compute({ birth_year, birth_month, birth_day, ref_year, ref_month, ref_day }) {
      const start = daysFromCivil(birth_year, birth_month, birth_day);
      const end = daysFromCivil(ref_year, ref_month, ref_day);
      if (end < start) throw new Error('تاریخ مرجع باید بعد از تاریخ تولد باشد');
      const check = civilFromDays(start);
      if (check.y !== birth_year || check.m !== birth_month || check.d !== birth_day) throw new Error('تاریخ تولد معتبر نیست');
      let years = ref_year - birth_year;
      let months = ref_month - birth_month;
      let days = ref_day - birth_day;
      if (days < 0) {
        months -= 1;
        const prev = civilFromDays(daysFromCivil(ref_year, ref_month, 1) - 1);
        days += prev.d;
      }
      if (months < 0) { years -= 1; months += 12; }
      return out(
        { years, months, days, total_days: end - start, weekday_birth: weekdayOf(start) },
        [`اختلاف روزها = ${end - start} روز`, `سن دقیق: ${years} سال و ${months} ماه و ${days} روز`, `روز هفتهٔ تولد: ${weekdayOf(start)}`],
      );
    },
  }),

  make({
    id: 'date_add_days',
    name_fa: 'افزودن روز به تاریخ',
    name_en: 'Add Days to a Date',
    category_path: ['ریاضیات', 'حساب و نظریه اعداد'],
    tags: ['تاریخ', 'مهلت', 'date add', 'deadline'],
    description_fa: 'تاریخِ چند روز بعد یا قبل از یک تاریخ میلادی (عدد منفی یعنی گذشته).',
    formula_latex: 'date_{new}=date+\\Delta days',
    variables: [
      N('year', 'سال', 'Year', null, 2025, { min: 1, max: 9999 }),
      N('month', 'ماه', 'Month', null, 1, { min: 1, max: 12 }),
      N('day', 'روز', 'Day', null, 1, { min: 1, max: 31 }),
      N('delta_days', 'روزهای افزوده (می‌تواند منفی باشد)', 'Days to add', null, 90),
    ],
    outputs: [O('result_date', 'تاریخ نتیجه', null, 'Result Date'), O('weekday', 'روز هفته', null, 'Weekday')],
    tests: [
      { input: { year: 2024, month: 2, day: 28, delta_days: 1 }, expected: { result_date: '2024-02-29' } },
      { input: { year: 2025, month: 1, day: 1, delta_days: -1 }, expected: { result_date: '2024-12-31' } },
    ],
    compute({ year, month, day, delta_days }) {
      const base = daysFromCivil(year, month, day);
      const origin = civilFromDays(base);
      if (origin.y !== year || origin.m !== month || origin.d !== day) throw new Error('تاریخ معتبر نیست');
      const result = civilFromDays(base + Math.trunc(delta_days));
      return out(
        { result_date: fmtDate(result), weekday: weekdayOf(base + Math.trunc(delta_days)) },
        [`${fmtDate({ y: year, m: month, d: day })} + ${Math.trunc(delta_days)} روز = ${fmtDate(result)}`],
      );
    },
  }),

  make({
    id: 'discount_and_tax_price',
    name_fa: 'قیمت پس از تخفیف و مالیات',
    name_en: 'Price After Discount & Tax',
    category_path: ['مالی و اقتصاد', 'بهره و وام'],
    tags: ['تخفیف', 'مالیات', 'قیمت', 'discount', 'tax'],
    description_fa: 'قیمت نهایی پس از درصد تخفیف و سپس افزودن درصد مالیات/ارزش افزوده.',
    formula_latex: 'P_f=P(1-d)(1+t)',
    variables: [
      N('price', 'قیمت اولیه', 'Original price', null, 1000000, { min: 0 }),
      N('discount_percent', 'درصد تخفیف', 'Discount %', '%', 20, { min: 0, max: 100 }),
      N('tax_percent', 'درصد مالیات', 'Tax %', '%', 10, { min: 0 }),
    ],
    outputs: [O('after_discount', 'پس از تخفیف'), O('final_price', 'قیمت نهایی'), O('you_save', 'مبلغ صرفه‌جویی نسبت به قیمت اولیه (بدون مالیات)')],
    tests: [
      { input: { price: 100, discount_percent: 20, tax_percent: 10 }, expected: { after_discount: 80, final_price: 88 } },
      { input: { price: 250, discount_percent: 0, tax_percent: 9 }, expected: { final_price: 272.5 } },
    ],
    compute({ price, discount_percent, tax_percent }) {
      const after = price * (1 - discount_percent / 100);
      const final = after * (1 + tax_percent / 100);
      return out(
        { after_discount: round(after, 6), final_price: round(final, 6), you_save: round(price - after, 6) },
        [`پس از تخفیف: ${price} × ${1 - discount_percent / 100} = ${round(after, 4)}`, `با مالیات: ${round(after, 4)} × ${1 + tax_percent / 100} = ${round(final, 4)}`],
      );
    },
  }),

  make({
    id: 'tip_and_split_bill',
    name_fa: 'انعام و تقسیم صورت‌حساب',
    name_en: 'Tip & Bill Splitting',
    category_path: ['مالی و اقتصاد', 'بهره و وام'],
    tags: ['انعام', 'تقسیم', 'رستوران', 'tip', 'split'],
    description_fa: 'مبلغ انعام، مجموع قابل پرداخت و سهم هر نفر.',
    formula_latex: 'share=\\frac{bill(1+tip)}{n}',
    variables: [
      N('bill', 'مبلغ صورت‌حساب', 'Bill amount', null, 850000, { min: 0 }),
      N('tip_percent', 'درصد انعام', 'Tip %', '%', 10, { min: 0 }),
      N('people', 'تعداد نفرات', 'People', null, 4, { min: 1 }),
    ],
    outputs: [O('tip_amount', 'مبلغ انعام'), O('total', 'مجموع'), O('per_person', 'سهم هر نفر')],
    tests: [
      { input: { bill: 100, tip_percent: 10, people: 4 }, expected: { tip_amount: 10, total: 110, per_person: 27.5 } },
      { input: { bill: 90, tip_percent: 0, people: 3 }, expected: { per_person: 30 } },
    ],
    compute({ bill, tip_percent, people }) {
      const tip = bill * (tip_percent / 100);
      const total = bill + tip;
      return out(
        { tip_amount: round(tip, 6), total: round(total, 6), per_person: round(total / people, 6) },
        [`انعام = ${round(tip, 4)}`, `سهم هر نفر = ${round(total, 4)} ÷ ${people} = ${round(total / people, 4)}`],
      );
    },
  }),

  make({
    id: 'weighted_gpa',
    name_fa: 'معدل وزنی (GPA)',
    name_en: 'Weighted GPA / Average',
    category_path: ['ریاضیات', 'آمار و احتمال'],
    tags: ['معدل', 'GPA', 'نمره', 'دانشگاه'],
    description_fa: 'معدل وزنی از فهرست نمره‌ها و واحدها (مثلاً نمره‌ها: 18,19,14 و واحدها: 3,2,3).',
    formula_latex: 'GPA=\\frac{\\sum g_i c_i}{\\sum c_i}',
    variables: [
      T('grades', 'فهرست نمره‌ها', 'Grades list', '18, 19, 14, 20'),
      T('credits', 'فهرست واحدها', 'Credits list', '3, 2, 3, 1'),
    ],
    outputs: [O('weighted_gpa', 'معدل وزنی'), O('total_credits', 'مجموع واحدها'), O('simple_mean', 'میانگین ساده نمره‌ها')],
    tests: [
      { input: { grades: '20, 10', credits: '3, 1' }, expected: { weighted_gpa: 17.5, total_credits: 4 } },
      { input: { grades: '18, 19, 14, 20', credits: '3, 2, 3, 1' }, expected: { weighted_gpa: 17.111111 } },
    ],
    compute({ grades, credits }) {
      const g = parseList(grades);
      const c = parseList(credits);
      if (g.length !== c.length) throw new Error('تعداد نمره‌ها و واحدها باید برابر باشد');
      if (c.some((value) => value <= 0)) throw new Error('واحدها باید مثبت باشند');
      const totalCredits = c.reduce((a, b) => a + b, 0);
      const weighted = g.reduce((acc, value, i) => acc + value * c[i], 0) / totalCredits;
      return out(
        { weighted_gpa: round(weighted, 6), total_credits: totalCredits, simple_mean: round(g.reduce((a, b) => a + b, 0) / g.length, 6) },
        [`Σ(نمره×واحد) ÷ Σواحد = ${round(weighted, 4)}`],
      );
    },
  }),

  make({
    id: 'pregnancy_due_date',
    name_fa: 'تاریخ تقریبی زایمان و سن بارداری',
    name_en: 'Pregnancy Due Date & Gestational Age',
    category_path: ['زیست و سلامت', 'سلامت'],
    tags: ['بارداری', 'زایمان', 'due date', 'pregnancy'],
    description_fa: 'قاعدهٔ نگل: ۲۸۰ روز پس از اولین روز آخرین قاعدگی (LMP)؛ فقط برآورد آموزشی است، نه جایگزین پزشک.',
    formula_latex: 'EDD=LMP+280\\ days',
    variables: [
      N('lmp_year', 'سال LMP', 'LMP year', null, 2025, { min: 1900, max: 2200 }),
      N('lmp_month', 'ماه LMP', 'LMP month', null, 1, { min: 1, max: 12 }),
      N('lmp_day', 'روز LMP', 'LMP day', null, 1, { min: 1, max: 31 }),
      N('ref_year', 'سال امروز/مرجع', 'Reference year', null, 2025, { min: 1900, max: 2200 }),
      N('ref_month', 'ماه مرجع', 'Reference month', null, 4, { min: 1, max: 12 }),
      N('ref_day', 'روز مرجع', 'Reference day', null, 9, { min: 1, max: 31 }),
    ],
    outputs: [O('due_date', 'تاریخ تقریبی زایمان', null, 'Due Date'), O('gestational_weeks', 'سن بارداری (هفته)', null, 'Gestational Weeks'), O('gestational_days_extra', 'روز اضافهٔ سن بارداری', null, 'Extra Days'), O('days_until_due', 'روز تا زایمان (در تاریخ مرجع)', null, 'Days Until Due')],
    tests: [
      { input: { lmp_year: 2025, lmp_month: 1, lmp_day: 1, ref_year: 2025, ref_month: 4, ref_day: 9 }, expected: { due_date: '2025-10-08', gestational_weeks: 14, gestational_days_extra: 0 } },
      { input: { lmp_year: 2024, lmp_month: 6, lmp_day: 1, ref_year: 2024, ref_month: 6, ref_day: 29 }, expected: { due_date: '2025-03-08', gestational_weeks: 4 } },
    ],
    compute(v) {
      const lmp = daysFromCivil(v.lmp_year, v.lmp_month, v.lmp_day);
      const ref = daysFromCivil(v.ref_year, v.ref_month, v.ref_day);
      const elapsed = ref - lmp;
      if (elapsed < 0) throw new Error('تاریخ مرجع باید بعد از LMP باشد');
      return out(
        {
          due_date: fmtDate(civilFromDays(lmp + 280)),
          gestational_weeks: Math.floor(elapsed / 7),
          gestational_days_extra: elapsed % 7,
          days_until_due: 280 - elapsed,
        },
        [`EDD = LMP + 280 روز = ${fmtDate(civilFromDays(lmp + 280))}`, `سن بارداری در تاریخ مرجع: هفتهٔ ${Math.floor(elapsed / 7)} و ${elapsed % 7} روز`, 'برآورد آموزشی است؛ برای تصمیم پزشکی به پزشک مراجعه کنید.'],
      );
    },
  }),

  make({
    id: 'iran_net_salary_configurable',
    name_fa: 'حقوق خالص با نرخ‌های قابل تنظیم (دستمزد ایران)',
    name_en: 'Net Salary — Configurable Rates (Iran Payroll)',
    category_path: ['مالی و اقتصاد', 'بهره و وام'],
    tags: ['حقوق', 'دستمزد', 'مالیات', 'بیمه', 'ایران', 'salary'],
    description_fa: 'حقوق ناخالص به خالص با نرخ بیمه و مالیات و سقف معافیتِ قابل ویرایش توسط کاربر؛ نرخ‌های قانونی سالانه تغییر می‌کنند و اینجا پیش‌فرضِ قابل تغییرند، نه قانون قطعی.',
    formula_latex: 'Net=G-I-T-D',
    variables: [
      N('gross', 'حقوق ناخالص ماهانه', 'Gross monthly salary', null, 200000000, { min: 0 }),
      N('insurance_percent', 'درصد بیمه سهم کارمند', 'Employee insurance %', '%', 7, { min: 0, max: 100 }),
      N('tax_percent', 'درصد مالیات مؤثر', 'Effective tax %', '%', 10, { min: 0, max: 100 }),
      N('tax_exempt', 'معافیت مالیاتی ماهانه', 'Monthly tax exemption', null, 0, { min: 0 }),
      N('other_deductions', 'سایر کسورات', 'Other deductions', null, 0, { min: 0 }),
    ],
    outputs: [O('insurance_amount', 'مبلغ بیمه'), O('income_tax', 'مالیات'), O('net_salary', 'حقوق خالص')],
    tests: [
      { input: { gross: 1000, insurance_percent: 7, tax_percent: 10, tax_exempt: 0, other_deductions: 0 }, expected: { insurance_amount: 70, income_tax: 100, net_salary: 830 } },
      { input: { gross: 1000, insurance_percent: 7, tax_percent: 10, tax_exempt: 400, other_deductions: 0 }, expected: { income_tax: 60, net_salary: 870 } },
    ],
    compute({ gross, insurance_percent, tax_percent, tax_exempt, other_deductions }) {
      const insurance = gross * (insurance_percent / 100);
      const tax = Math.max(0, gross - tax_exempt) * (tax_percent / 100);
      const net = gross - insurance - tax - other_deductions;
      return out(
        { insurance_amount: round(insurance, 6), income_tax: round(tax, 6), net_salary: round(net, 6) },
        [`بیمه = ${round(insurance, 4)}`, `مالیات روی بخش مشمول = ${round(tax, 4)}`, `خالص = ${round(net, 4)}`, 'نرخ‌ها ورودی کاربرند؛ نرخ قانونی جاری را از منبع رسمی بررسی کنید.'],
      );
    },
  }),

  make({
    id: 'mehrieh_indexed_value',
    name_fa: 'مهریه به نرخ روز (شاخص)',
    name_en: 'Indexed Mehrieh (Dowry) Value',
    category_path: ['مالی و اقتصاد', 'بهره و وام'],
    tags: ['مهریه', 'شاخص', 'ایران', 'mehrieh'],
    description_fa: 'مبلغ به‌روزشده = اصل مبلغ × (شاخص سال پرداخت ÷ شاخص سال عقد). هر دو شاخص ورودی کاربرند و باید از جدول رسمی گرفته شوند.',
    formula_latex: 'V=P\\times\\frac{I_{pay}}{I_{marriage}}',
    variables: [
      N('principal', 'اصل مبلغ مهریه', 'Principal amount', null, 100000000, { min: 0 }),
      N('index_marriage', 'شاخص سال عقد', 'Index at marriage', null, 50, { min: 0.000001 }),
      N('index_payment', 'شاخص سال پرداخت', 'Index at payment', null, 200, { min: 0 }),
    ],
    outputs: [O('updated_value', 'مبلغ به نرخ روز'), O('multiplier', 'ضریب افزایش')],
    tests: [
      { input: { principal: 100, index_marriage: 50, index_payment: 200 }, expected: { updated_value: 400, multiplier: 4 } },
      { input: { principal: 110, index_marriage: 100, index_payment: 100 }, expected: { updated_value: 110 } },
    ],
    compute({ principal, index_marriage, index_payment }) {
      const multiplier = index_payment / index_marriage;
      return out(
        { updated_value: round(principal * multiplier, 6), multiplier: round(multiplier, 6) },
        [`ضریب = ${index_payment} ÷ ${index_marriage} = ${round(multiplier, 4)}`, `مبلغ روز = ${round(principal * multiplier, 4)}`, 'شاخص‌های رسمی سالانه را از منبع رسمی وارد کنید؛ این محاسبه نظر حقوقی نیست.'],
      );
    },
  }),

  make({
    id: 'diyah_percent_amount',
    name_fa: 'درصد از مبلغ کامل (دیه و مشابه)',
    name_en: 'Percentage of a Full Amount (Diyah-style)',
    category_path: ['مالی و اقتصاد', 'بهره و وام'],
    tags: ['دیه', 'درصد', 'غرامت', 'ایران'],
    description_fa: 'محاسبهٔ یک درصد مشخص از مبلغ کامل اعلام‌شدهٔ یک سال؛ مبلغ کامل ورودی کاربر است چون سالانه رسماً اعلام می‌شود.',
    formula_latex: 'A=F\\times\\frac{p}{100}',
    variables: [
      N('full_amount', 'مبلغ کامل (ورودی کاربر)', 'Full amount (user input)', null, 1000000000, { min: 0 }),
      N('percent', 'درصد مورد نظر', 'Percent', '%', 1, { min: 0 }),
    ],
    outputs: [O('amount', 'مبلغ این درصد'), O('one_percent', 'مبلغ یک درصد')],
    tests: [
      { input: { full_amount: 1000, percent: 1 }, expected: { amount: 10, one_percent: 10 } },
      { input: { full_amount: 2000, percent: 2.5 }, expected: { amount: 50 } },
    ],
    compute({ full_amount, percent }) {
      return out(
        { amount: round((full_amount * percent) / 100, 6), one_percent: round(full_amount / 100, 6) },
        [`${percent}٪ از ${full_amount} = ${round((full_amount * percent) / 100, 4)}`, 'مبلغ کامل هر سال رسماً اعلام می‌شود؛ این ابزار نظر حقوقی نیست.'],
      );
    },
  }),

  make({
    id: 'linear_programming_2var',
    name_fa: 'برنامه‌ریزی خطی دو متغیره (بیشینه‌سازی)',
    name_en: 'Linear Programming — Maximise (2 Variables)',
    category_path: ['ریاضیات', 'بهینه‌سازی'],
    tags: ['برنامه‌ریزی خطی', 'LP', 'بهینه‌سازی', 'simplex'],
    description_fa: 'بیشینه‌کردن c₁x+c₂y با سه قید خطی aᵢx+bᵢy≤rᵢ و x,y≥۰؛ جواب بهینه در یک رأس ناحیهٔ مجاز است.',
    formula_latex: '\\max\\ c_1x+c_2y\\quad s.t.\\ Ax\\le r,\\ x,y\\ge0',
    difficulty: 'advanced',
    variables: [
      N('c1', 'ضریب x در تابع هدف c₁', 'Objective c1', null, 3),
      N('c2', 'ضریب y در تابع هدف c₂', 'Objective c2', null, 5),
      N('a1', 'قید ۱: a₁', 'Constraint 1 a', null, 1), N('b1', 'قید ۱: b₁', 'Constraint 1 b', null, 0), N('r1', 'قید ۱: سمت راست r₁', 'Constraint 1 rhs', null, 4),
      N('a2', 'قید ۲: a₂', 'Constraint 2 a', null, 0), N('b2', 'قید ۲: b₂', 'Constraint 2 b', null, 2), N('r2', 'قید ۲: سمت راست r₂', 'Constraint 2 rhs', null, 12),
      N('a3', 'قید ۳: a₃', 'Constraint 3 a', null, 3), N('b3', 'قید ۳: b₃', 'Constraint 3 b', null, 2), N('r3', 'قید ۳: سمت راست r₃', 'Constraint 3 rhs', null, 18),
    ],
    outputs: [O('x_opt', 'x بهینه', null, 'Optimal X'), O('y_opt', 'y بهینه', null, 'Optimal Y'), O('objective_value', 'مقدار بهینه تابع هدف', null, 'Objective Value')],
    tests: [
      { input: { c1: 3, c2: 5, a1: 1, b1: 0, r1: 4, a2: 0, b2: 2, r2: 12, a3: 3, b3: 2, r3: 18 }, expected: { x_opt: 2, y_opt: 6, objective_value: 36 } },
      { input: { c1: 1, c2: 1, a1: 1, b1: 1, r1: 4, a2: 1, b2: 0, r2: 10, a3: 0, b3: 1, r3: 10 }, expected: { objective_value: 4 } },
    ],
    compute(v) {
      const constraints = [
        { a: v.a1, b: v.b1, r: v.r1 }, { a: v.a2, b: v.b2, r: v.r2 }, { a: v.a3, b: v.b3, r: v.r3 },
        { a: -1, b: 0, r: 0 }, { a: 0, b: -1, r: 0 },
      ];
      const feasible = (x, y) => x >= -1e-9 && y >= -1e-9 && constraints.slice(0, 3).every((c) => c.a * x + c.b * y <= c.r + 1e-9);
      const corners = [{ x: 0, y: 0 }];
      for (let i = 0; i < constraints.length; i += 1) {
        for (let j = i + 1; j < constraints.length; j += 1) {
          const p = constraints[i];
          const q = constraints[j];
          const det = p.a * q.b - q.a * p.b;
          if (Math.abs(det) < 1e-12) continue;
          const x = (p.r * q.b - q.r * p.b) / det;
          const y = (p.a * q.r - q.a * p.r) / det;
          if (feasible(x, y)) corners.push({ x, y });
        }
      }
      let best = null;
      for (const corner of corners) {
        const value = v.c1 * corner.x + v.c2 * corner.y;
        if (!best || value > best.value) best = { ...corner, value };
      }
      if (!best) throw new Error('ناحیهٔ مجاز خالی است');
      return out(
        { x_opt: round(best.x, 6), y_opt: round(best.y, 6), objective_value: round(best.value, 6) },
        [`بررسی رأس‌های ناحیهٔ مجاز (${corners.length} رأس)`, `بهینه در x=${round(best.x, 4)} و y=${round(best.y, 4)} با مقدار ${round(best.value, 4)}`],
      );
    },
  }),

  make({
    id: 'recipe_scaling',
    name_fa: 'مقیاس‌کردن دستور آشپزی',
    name_en: 'Recipe Scaling',
    category_path: ['ریاضیات', 'حساب و نظریه اعداد'],
    tags: ['آشپزی', 'مقیاس', 'recipe', 'cooking'],
    description_fa: 'مقدار یک ماده وقتی تعداد نفرات دستور عوض می‌شود.',
    formula_latex: 'amount_{new}=amount\\times\\frac{servings_{new}}{servings_{orig}}',
    variables: [
      N('amount', 'مقدار ماده در دستور اصلی', 'Ingredient amount in original', null, 200, { min: 0 }),
      N('original_servings', 'نفرات دستور اصلی', 'Original servings', null, 4, { min: 0.000001 }),
      N('desired_servings', 'نفرات مورد نظر', 'Desired servings', null, 6, { min: 0 }),
    ],
    outputs: [O('scaled_amount', 'مقدار جدید ماده'), O('scale_factor', 'ضریب مقیاس')],
    tests: [
      { input: { amount: 200, original_servings: 4, desired_servings: 6 }, expected: { scaled_amount: 300, scale_factor: 1.5 } },
      { input: { amount: 100, original_servings: 2, desired_servings: 1 }, expected: { scaled_amount: 50 } },
    ],
    compute({ amount, original_servings, desired_servings }) {
      const factor = desired_servings / original_servings;
      return out(
        { scaled_amount: round(amount * factor, 6), scale_factor: round(factor, 6) },
        [`ضریب = ${desired_servings} ÷ ${original_servings} = ${round(factor, 4)}`, `مقدار جدید = ${round(amount * factor, 4)}`],
      );
    },
  }),

  make({
    id: 'fuel_cost_trip',
    name_fa: 'هزینه و مصرف سوخت سفر',
    name_en: 'Trip Fuel Cost & Consumption',
    category_path: ['مالی و اقتصاد', 'بهره و وام'],
    tags: ['سوخت', 'سفر', 'بنزین', 'fuel', 'trip'],
    description_fa: 'لیتر مصرفی و هزینهٔ سفر از روی مسافت، مصرف خودرو (لیتر در ۱۰۰ کیلومتر) و قیمت هر لیتر.',
    formula_latex: 'L=\\frac{d\\times c}{100},\\quad Cost=L\\times p',
    variables: [
      N('distance_km', 'مسافت (km)', 'Distance km', 'km', 450, { min: 0 }),
      N('consumption_per_100km', 'مصرف (لیتر در ۱۰۰ کیلومتر)', 'Consumption L/100km', null, 8, { min: 0.000001 }),
      N('price_per_liter', 'قیمت هر لیتر', 'Price per liter', null, 3000, { min: 0 }),
    ],
    outputs: [O('liters', 'سوخت مصرفی (لیتر)', null, 'Liters'), O('total_cost', 'هزینه کل'), O('cost_per_km', 'هزینه هر کیلومتر')],
    tests: [
      { input: { distance_km: 200, consumption_per_100km: 10, price_per_liter: 5 }, expected: { liters: 20, total_cost: 100 } },
      { input: { distance_km: 450, consumption_per_100km: 8, price_per_liter: 3000 }, expected: { liters: 36, total_cost: 108000 } },
    ],
    compute({ distance_km, consumption_per_100km, price_per_liter }) {
      const liters = (distance_km * consumption_per_100km) / 100;
      const cost = liters * price_per_liter;
      return out(
        { liters: round(liters, 6), total_cost: round(cost, 6), cost_per_km: distance_km > 0 ? round(cost / distance_km, 6) : 0 },
        [`مصرف = ${distance_km} × ${consumption_per_100km} ÷ ۱۰۰ = ${round(liters, 4)} لیتر`, `هزینه = ${round(cost, 4)}`],
      );
    },
  }),
];
