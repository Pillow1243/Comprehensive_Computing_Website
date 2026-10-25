// Phase 6 — applied pack: finance, computer science, health,
// astronomy and Earth sciences.
import { make, N, T, O, round, out, CONST } from './formula-kit.js';

const { G, c, sigma } = CONST;
const L_SUN = 3.828e26;
const AU_KM = 1.495978707e8;
const LY_KM = 9.4607304725808e12;
const PC_KM = 3.0856775814913673e13;
const M_SUN = 1.98847e30;

export const PHASE6_FORMULAS = [
  // ── مالی و اقتصاد ────────────────────────────────────────────────────────
  make({
    id: 'simple_interest',
    name_fa: 'بهره ساده',
    name_en: 'Simple Interest',
    category_path: ['مالی و اقتصاد', 'بهره و وام'],
    tags: ['بهره', 'ساده', 'interest'],
    description_fa: 'بهره ساده و مبلغ نهایی برای یک سرمایه‌گذاری یا وام.',
    formula_latex: 'I=Prt,\\quad A=P(1+rt)',
    variables: [N('principal', 'مبلغ اصل (P)', 'Principal', 'currency', 10000), N('rate', 'نرخ سالانه (٪)', 'Annual rate', '%', 8), N('years', 'مدت (سال)', 'Years', 'time', 3)],
    outputs: [O('interest', 'بهره', null), O('total', 'مبلغ نهایی', null), O('monthly_interest', 'بهره ماهانه', null)],
    tests: [
      { input: { principal: 10000, rate: 8, years: 3 }, expected: { interest: 2400, total: 12400 } },
      { input: { principal: 5000, rate: 5, years: 2 }, expected: { interest: 500, total: 5500 } },
    ],
    compute({ principal, rate, years }) {
      if (principal < 0 || years < 0) throw new Error('مبلغ و مدت باید نامنفی باشند');
      const interest = (principal * rate * years) / 100;
      return out(
        { interest: round(interest, 4), total: round(principal + interest, 4), monthly_interest: round(interest / (years * 12 || 1), 4), effective_rate: round((interest / (principal || 1)) * 100, 4) },
        [`I = P·r·t = ${principal} × ${rate}٪ × ${years}`, `بهره = ${round(interest, 2)}`, `مبلغ نهایی = ${round(principal + interest, 2)}`],
      );
    },
  }),

  make({
    id: 'future_value_annuity',
    name_fa: 'ارزش آینده اقساط',
    name_en: 'Future Value of Annuity',
    category_path: ['مالی و اقتصاد', 'سرمایه‌گذاری'],
    tags: ['اقساط', 'پس‌انداز', 'annuity'],
    description_fa: 'ارزش آینده پرداخت‌های دوره‌ای مساوی و سود مرکب آن‌ها.',
    formula_latex: 'FV=PMT\\frac{(1+i)^n-1}{i}',
    variables: [N('payment', 'پرداخت دوره‌ای', 'Payment', 'currency', 1000), N('annual_rate', 'نرخ سالانه (٪)', 'Annual rate', '%', 6), N('years', 'مدت (سال)', 'Years', 'time', 10), N('m', 'دوره در سال', 'Periods per year', null, 12, { min: 1, max: 365 })],
    outputs: [O('future_value', 'ارزش آینده', null), O('contributions', 'مجموع پرداخت‌ها', null), O('interest_earned', 'سود کسب‌شده', null)],
    tests: [
      { input: { payment: 1000, annual_rate: 6, years: 10, m: 12 }, expected: { future_value: 163879.35, contributions: 120000 } },
      { input: { payment: 500, annual_rate: 0, years: 5, m: 12 }, expected: { future_value: 30000 } },
    ],
    compute({ payment, annual_rate, years, m }) {
      if (m <= 0) throw new Error('تعداد دوره در سال باید مثبت باشد');
      const i = annual_rate / 100 / m;
      const n = Math.round(years * m);
      const fv = i === 0 ? payment * n : payment * (((1 + i) ** n - 1) / i);
      const contributions = payment * n;
      return out(
        { future_value: round(fv, 4), contributions: round(contributions, 4), interest_earned: round(fv - contributions, 4), periods: n, periodic_rate: round(i * 100, 6) },
        [`i = ${round(i * 100, 4)}٪ در دوره ، n = ${n} دوره`, `FV = PMT[(1+i)ⁿ−1]/i = ${round(fv, 2)}`, `سود = ${round(fv - contributions, 2)}`],
      );
    },
  }),

  make({
    id: 'present_value_annuity',
    name_fa: 'ارزش فعلی اقساط',
    name_en: 'Present Value of Annuity',
    category_path: ['مالی و اقتصاد', 'سرمایه‌گذاری'],
    tags: ['ارزش فعلی', 'اقساط', 'annuity'],
    description_fa: 'ارزش فعلی جریان پرداخت‌های دوره‌ای و مبلغ قسط وام معادل.',
    formula_latex: 'PV=PMT\\frac{1-(1+i)^{-n}}{i}',
    variables: [N('payment', 'پرداخت دوره‌ای', 'Payment', 'currency', 1000), N('annual_rate', 'نرخ سالانه (٪)', 'Annual rate', '%', 6), N('years', 'مدت (سال)', 'Years', 'time', 10), N('m', 'دوره در سال', 'Periods per year', null, 12, { min: 1, max: 365 })],
    outputs: [O('present_value', 'ارزش فعلی', null), O('total_paid', 'مجموع پرداختی', null), O('discount', 'تخفیف نسبت به مبلغ اسمی', null)],
    tests: [
      { input: { payment: 1000, annual_rate: 6, years: 10, m: 12 }, expected: { present_value: 90073.45, total_paid: 120000 } },
      { input: { payment: 1000, annual_rate: 0, years: 5, m: 12 }, expected: { present_value: 60000 } },
    ],
    compute({ payment, annual_rate, years, m }) {
      if (m <= 0) throw new Error('تعداد دوره در سال باید مثبت باشد');
      const i = annual_rate / 100 / m;
      const n = Math.round(years * m);
      const pv = i === 0 ? payment * n : payment * ((1 - (1 + i) ** -n) / i);
      const total = payment * n;
      return out(
        { present_value: round(pv, 4), total_paid: round(total, 4), discount: round(total - pv, 4), periods: n },
        [`PV = PMT[1−(1+i)⁻ⁿ]/i = ${round(pv, 2)}`, `مجموع پرداختی = ${round(total, 2)}`, `تفاوت ارزش زمانی = ${round(total - pv, 2)}`],
      );
    },
  }),

  make({
    id: 'cagr',
    name_fa: 'نرخ رشد مرکب سالانه',
    name_en: 'CAGR',
    category_path: ['مالی و اقتصاد', 'سرمایه‌گذاری'],
    tags: ['رشد', 'CAGR', 'بازده'],
    description_fa: 'نرخ رشد مرکب سالانه و زمان لازم برای رسیدن به هدف.',
    formula_latex: 'CAGR=\\left(\\frac{V_f}{V_i}\\right)^{1/t}-1',
    variables: [N('start', 'ارزش اولیه', 'Start value', 'currency', 1000), N('end', 'ارزش نهایی', 'End value', 'currency', 2000), N('years', 'مدت (سال)', 'Years', 'time', 10)],
    outputs: [O('cagr', 'نرخ رشد سالانه', '%'), O('total_growth', 'رشد کل', '%'), O('doubling_years', 'سال‌های دو برابر شدن', 'yr')],
    tests: [
      { input: { start: 1000, end: 2000, years: 10 }, expected: { cagr: 7.177346, total_growth: 100 } },
      { input: { start: 100, end: 100, years: 5 }, expected: { cagr: 0 } },
    ],
    compute({ start, end, years }) {
      if (start <= 0 || end <= 0) throw new Error('ارزش‌ها باید مثبت باشند');
      if (years <= 0) throw new Error('مدت باید مثبت باشد');
      const cagr = ((end / start) ** (1 / years) - 1) * 100;
      return out(
        { cagr: round(cagr, 6), total_growth: round((end / start - 1) * 100, 6), doubling_years: cagr > 0 ? round(Math.LN2 / Math.log1p(cagr / 100), 4) : 0 },
        [`CAGR = (${end}/${start})^(1/${years}) − 1`, `= ${round(cagr, 3)}٪ در سال`, cagr > 0 ? `زمان دو برابر شدن ≈ ${round(Math.LN2 / Math.log1p(cagr / 100), 2)} سال` : 'رشدی وجود ندارد'],
      );
    },
  }),

  make({
    id: 'roi_calc',
    name_fa: 'بازده سرمایه‌گذاری (ROI)',
    name_en: 'Return on Investment',
    category_path: ['مالی و اقتصاد', 'سرمایه‌گذاری'],
    tags: ['ROI', 'بازده', 'سرمایه'],
    description_fa: 'بازده کل و بازده سالانه‌شده سرمایه‌گذاری.',
    formula_latex: 'ROI=\\frac{V_f-V_i}{V_i}\\times100',
    variables: [N('initial', 'سرمایه اولیه', 'Initial investment', 'currency', 1000), N('final', 'ارزش نهایی', 'Final value', 'currency', 1500), N('years', 'مدت (سال)', 'Years', 'time', 2)],
    outputs: [O('roi', 'بازده کل', '%'), O('annualized', 'بازده سالانه', '%'), O('profit', 'سود خالص', null)],
    tests: [
      { input: { initial: 1000, final: 1500, years: 2 }, expected: { roi: 50, annualized: 22.474487, profit: 500 } },
      { input: { initial: 2000, final: 1600, years: 1 }, expected: { roi: -20 } },
    ],
    compute({ initial, final, years }) {
      if (initial <= 0) throw new Error('سرمایه اولیه باید مثبت باشد');
      if (years <= 0) throw new Error('مدت باید مثبت باشد');
      const roi = ((final - initial) / initial) * 100;
      const annualized = ((final / initial) ** (1 / years) - 1) * 100;
      return out(
        { roi: round(roi, 6), annualized: round(annualized, 6), profit: round(final - initial, 4) },
        [`ROI = (${final}−${initial})/${initial} × 100 = ${round(roi, 3)}٪`, `بازده سالانه = ${round(annualized, 3)}٪`, `سود خالص = ${round(final - initial, 2)}`],
      );
    },
  }),

  make({
    id: 'payback_period',
    name_fa: 'دوره بازگشت سرمایه',
    name_en: 'Payback Period',
    category_path: ['مالی و اقتصاد', 'سرمایه‌گذاری'],
    tags: ['بازگشت', 'payback', 'سرمایه'],
    description_fa: 'زمان لازم برای بازگشت سرمایه اولیه از جریان نقدی سالانه.',
    formula_latex: 'PP=\\frac{\\text{Investment}}{\\text{Annual cash flow}}',
    variables: [N('investment', 'سرمایه اولیه', 'Investment', 'currency', 10000), N('cashflow', 'جریان نقدی سالانه', 'Annual cash flow', 'currency', 2500)],
    outputs: [O('years', 'دوره بازگشت', 'yr'), O('months', 'دوره بازگشت', 'mo'), O('roi_annual', 'بازده سالانه ساده', '%')],
    tests: [
      { input: { investment: 10000, cashflow: 2500 }, expected: { years: 4, months: 48, roi_annual: 25 } },
      { input: { investment: 5000, cashflow: 1200 }, expected: { years: 4.166667 } },
    ],
    compute({ investment, cashflow }) {
      if (cashflow <= 0) throw new Error('جریان نقدی باید مثبت باشد');
      if (investment <= 0) throw new Error('سرمایه باید مثبت باشد');
      const years = investment / cashflow;
      return out(
        { years: round(years, 6), months: round(years * 12, 4), roi_annual: round((1 / years) * 100, 6) },
        [`دوره بازگشت = ${round(years, 3)} سال`, `= ${round(years * 12, 1)} ماه`, `بازده ساده سالانه = ${round((1 / years) * 100, 2)}٪`],
      );
    },
  }),

  make({
    id: 'depreciation_declining',
    name_fa: 'استهلاک نزولی مضاعف',
    name_en: 'Double Declining Depreciation',
    category_path: ['مالی و اقتصاد', 'بهره و وام'],
    tags: ['استهلاک', 'دارایی', 'depreciation'],
    description_fa: 'استهلاک سالانه و ارزش دفتری با روش نزولی مضاعف.',
    formula_latex: 'D_t=2\\frac{BV_{t-1}}{n}',
    variables: [N('cost', 'بهای تمام‌شده', 'Asset cost', 'currency', 10000), N('salvage', 'ارزش اسقاط', 'Salvage value', 'currency', 1000), N('life', 'عمر مفید (سال)', 'Useful life', 'time', 5), N('year', 'سال مورد نظر', 'Year', null, 2, { min: 1 })],
    outputs: [O('depreciation', 'استهلاک سال', null), O('book_value', 'ارزش دفتری', null), O('rate', 'نرخ استهلاک', '%')],
    tests: [
      { input: { cost: 10000, salvage: 1000, life: 5, year: 2 }, expected: { depreciation: 2400, book_value: 3600, rate: 40 } },
      { input: { cost: 5000, salvage: 0, life: 4, year: 1 }, expected: { depreciation: 2500, book_value: 2500 } },
    ],
    compute({ cost, salvage, life, year }) {
      if (life <= 0) throw new Error('عمر مفید باید مثبت باشد');
      if (!Number.isInteger(year) || year < 1 || year > life) throw new Error('سال باید بین ۱ و عمر مفید باشد');
      const rate = 2 / life;
      let book = cost;
      let depreciation = 0;
      for (let t = 1; t <= year; t += 1) {
        depreciation = Math.min(book * rate, book - salvage);
        book -= depreciation;
      }
      return out(
        { depreciation: round(depreciation, 4), book_value: round(book, 4), rate: round(rate * 100, 4), remaining_life: life - year },
        [`نرخ نزولی مضاعف = 2/عمر = ${round(rate * 100, 2)}٪`, `استهلاک سال ${year} = ${round(depreciation, 2)}`, `ارزش دفتری پایان سال ${year} = ${round(book, 2)}`],
      );
    },
  }),

  make({
    id: 'inflation_adjust',
    name_fa: 'اثر تورم بر ارزش پول',
    name_en: 'Inflation Adjustment',
    category_path: ['مالی و اقتصاد', 'بهره و وام'],
    tags: ['تورم', 'قدرت خرید', 'inflation'],
    description_fa: 'ارزش واقعی مبلغ پس از تورم و کاهش قدرت خرید.',
    formula_latex: 'V_{real}=\\frac{V_{nominal}}{(1+i)^t}',
    variables: [N('nominal', 'مبلغ اسمی', 'Nominal amount', 'currency', 100000), N('inflation', 'نرخ تورم سالانه (٪)', 'Annual inflation', '%', 10), N('years', 'مدت (سال)', 'Years', 'time', 5)],
    outputs: [O('real_value', 'ارزش واقعی', null), O('purchasing_power_loss', 'کاهش قدرت خرید', '%'), O('equivalent_future_cost', 'هزینه معادل آینده', null)],
    tests: [
      { input: { nominal: 100000, inflation: 10, years: 5 }, expected: { real_value: 62092.13, purchasing_power_loss: 37.90787 } },
      { input: { nominal: 50000, inflation: 0, years: 10 }, expected: { real_value: 50000 } },
    ],
    compute({ nominal, inflation, years }) {
      if (nominal < 0) throw new Error('مبلغ باید نامنفی باشد');
      const factor = (1 + inflation / 100) ** years;
      const real = nominal / factor;
      return out(
        { real_value: round(real, 4), purchasing_power_loss: round((1 - real / (nominal || 1)) * 100, 6), equivalent_future_cost: round(nominal * factor, 4), factor: round(factor, 6) },
        [`ضریب تورم = (1+${round(inflation, 2)}٪)^${years} = ${round(factor, 4)}`, `ارزش واقعی = ${round(real, 2)}`, `کاهش قدرت خرید = ${round((1 - real / (nominal || 1)) * 100, 2)}٪`],
      );
    },
  }),

  make({
    id: 'break_even',
    name_fa: 'نقطه سربه‌سر',
    name_en: 'Break-Even Analysis',
    category_path: ['مالی و اقتصاد', 'بهره و وام'],
    tags: ['سربه‌سر', 'سود', 'break even'],
    description_fa: 'تعداد محصول لازم برای سربه‌سر شدن و حاشیه سود هر واحد.',
    formula_latex: 'Q=\\frac{FC}{P-VC}',
    variables: [N('fixed_cost', 'هزینه ثابت', 'Fixed cost', 'currency', 50000), N('price', 'قیمت فروش هر واحد', 'Unit price', 'currency', 50), N('variable_cost', 'هزینه متغیر هر واحد', 'Unit variable cost', 'currency', 30)],
    outputs: [O('units', 'تعداد سربه‌سر', null), O('revenue', 'درآمد سربه‌سر', null), O('contribution_margin', 'حاشیه مشارکت', null)],
    tests: [
      { input: { fixed_cost: 50000, price: 50, variable_cost: 30 }, expected: { units: 2500, revenue: 125000, contribution_margin: 20 } },
      { input: { fixed_cost: 10000, price: 25, variable_cost: 15 }, expected: { units: 1000 } },
    ],
    compute({ fixed_cost, price, variable_cost }) {
      if (price <= variable_cost) throw new Error('قیمت باید بیشتر از هزینه متغیر باشد');
      const margin = price - variable_cost;
      const units = fixed_cost / margin;
      return out(
        { units: round(units, 4), revenue: round(units * price, 4), contribution_margin: round(margin, 4), margin_ratio: round((margin / price) * 100, 4) },
        [`حاشیه مشارکت = ${round(margin, 2)}`, `تعداد سربه‌سر = ${round(units, 2)} واحد`, `درآمد سربه‌سر = ${round(units * price, 2)}`],
      );
    },
  }),

  make({
    id: 'markup_margin',
    name_fa: 'مارک‌آپ و حاشیه سود',
    name_en: 'Markup & Margin',
    category_path: ['مالی و اقتصاد', 'بهره و وام'],
    tags: ['مارک‌آپ', 'حاشیه سود', 'pricing'],
    description_fa: 'تبدیل بهای تمام‌شده و قیمت فروش به مارک‌آپ، حاشیه سود و سود ناخالص.',
    formula_latex: '\\text{markup}=\\frac{P-C}{C},\\quad \\text{margin}=\\frac{P-C}{P}',
    variables: [N('cost', 'بهای تمام‌شده', 'Cost', 'currency', 80), N('price', 'قیمت فروش', 'Selling price', 'currency', 100)],
    outputs: [O('markup', 'مارک‌آپ', '%'), O('margin', 'حاشیه سود', '%'), O('profit', 'سود هر واحد', null)],
    tests: [
      { input: { cost: 80, price: 100 }, expected: { markup: 25, margin: 20, profit: 20 } },
      { input: { cost: 200, price: 250 }, expected: { markup: 25, margin: 20 } },
    ],
    compute({ cost, price }) {
      if (cost <= 0 || price <= 0) throw new Error('قیمت‌ها باید مثبت باشند');
      if (price < cost) throw new Error('قیمت فروش کمتر از بهای تمام‌شده است (زیان‌ده)');
      return out(
        { markup: round(((price - cost) / cost) * 100, 6), margin: round(((price - cost) / price) * 100, 6), profit: round(price - cost, 4), multiplier: round(price / cost, 6) },
        [`مارک‌آپ = (${price}−${cost})/${cost} = ${round(((price - cost) / cost) * 100, 3)}٪`, `حاشیه سود = ${round(((price - cost) / price) * 100, 3)}٪`, `ضریب قیمت‌گذاری = ${round(price / cost, 4)}`],
      );
    },
  }),

  make({
    id: 'savings_goal_time',
    name_fa: 'زمان رسیدن به هدف پس‌انداز',
    name_en: 'Time to Savings Goal',
    category_path: ['مالی و اقتصاد', 'سرمایه‌گذاری'],
    tags: ['پس‌انداز', 'هدف', 'saving'],
    description_fa: 'مدت لازم برای رسیدن به هدف مالی با پس‌انداز ماهانه و سود مرکب.',
    formula_latex: 'n=\\frac{\\ln\\left(1+\\frac{Gi}{PMT}\\right)}{\\ln(1+i)}',
    difficulty: 'intermediate',
    variables: [N('goal', 'هدف مالی', 'Savings goal', 'currency', 1000000), N('annual_rate', 'نرخ سالانه (٪)', 'Annual rate', '%', 12), N('monthly_payment', 'پس‌انداز ماهانه', 'Monthly saving', 'currency', 10000)],
    outputs: [O('months', 'مدت (ماه)', 'mo'), O('years', 'مدت (سال)', 'yr'), O('total_contributions', 'مجموع واریزها', null)],
    tests: [
      { input: { goal: 1000000, annual_rate: 12, monthly_payment: 10000 }, expected: { months: 70, years: 5.833333 } },
      { input: { goal: 1000000, annual_rate: 0, monthly_payment: 10000 }, expected: { months: 100 } },
    ],
    compute({ goal, annual_rate, monthly_payment }) {
      if (goal <= 0) throw new Error('هدف باید مثبت باشد');
      if (monthly_payment <= 0) throw new Error('پس‌انداز ماهانه باید مثبت باشد');
      const i = annual_rate / 100 / 12;
      const months = i === 0 ? goal / monthly_payment : Math.log(1 + (goal * i) / monthly_payment) / Math.log(1 + i);
      const rounded = Math.ceil(months);
      return out(
        { months: rounded, years: round(rounded / 12, 6), total_contributions: round(rounded * monthly_payment, 4), interest_earned: round(goal - rounded * monthly_payment, 4) },
        [`i = ${round(i * 100, 4)}٪ ماهانه`, `n = ${round(months, 2)} ماه ⟹ ${rounded} ماه`, `مجموع واریزها = ${round(rounded * monthly_payment, 2)}`],
      );
    },
  }),

  // ── کامپیوتر و اطلاعات ───────────────────────────────────────────────────
  make({
    id: 'hamming_distance',
    name_fa: 'فاصله همینگ',
    name_en: 'Hamming Distance',
    category_path: ['کامپیوتر و اطلاعات', 'نظریه اطلاعات'],
    tags: ['همینگ', 'خطا', 'hamming'],
    description_fa: 'تعداد بیت‌های متفاوت دو رشته باینری و درصد اختلاف.',
    formula_latex: 'd_H(x,y)=\\sum_i [x_i\\ne y_i]',
    variables: [T('a', 'رشته اول (باینری)', 'First bit string', '1011010'), T('b', 'رشته دوم (باینری)', 'Second bit string', '1001011')],
    outputs: [O('distance', 'فاصله همینگ', null), O('percent', 'درصد اختلاف', '%'), O('length', 'طول رشته', null)],
    tests: [
      { input: { a: '1011010', b: '1001011' }, expected: { distance: 2, length: 7, percent: 28.571429 } },
      { input: { a: '1111', b: '1111' }, expected: { distance: 0 } },
    ],
    compute({ a, b }) {
      const left = String(a).replace(/\s/g, '');
      const right = String(b).replace(/\s/g, '');
      if (!/^[01]+$/.test(left) || !/^[01]+$/.test(right)) throw new Error('هر دو رشته باید فقط شامل ۰ و ۱ باشند');
      if (left.length !== right.length) throw new Error('طول دو رشته باید برابر باشد');
      let distance = 0;
      for (let i = 0; i < left.length; i += 1) if (left[i] !== right[i]) distance += 1;
      return out(
        { distance, percent: round((distance / left.length) * 100, 6), length: left.length, positions: [...left].map((bit, i) => (bit !== right[i] ? i + 1 : null)).filter(Boolean).join(', ') || '—' },
        [`طول رشته = ${left.length} بیت`, `بیت‌های متفاوت در موقعیت‌های: ${[...left].map((bit, i) => (bit !== right[i] ? i + 1 : null)).filter(Boolean).join(', ') || 'ندارد'}`, `فاصله همینگ = ${distance} (${round((distance / left.length) * 100, 2)}٪)`],
      );
    },
  }),

  make({
    id: 'twos_complement',
    name_fa: 'مکمل دو',
    name_en: "Two's Complement",
    category_path: ['کامپیوتر و اطلاعات', 'نظریه اطلاعات'],
    tags: ['باینری', 'مکمل دو', 'binary'],
    description_fa: 'نمایش عدد صحیح در مکمل دو n بیتی با معادل هگزادسیمال و تفسیر بدون علامت.',
    formula_latex: '-x=\\bar{x}+1\\pmod{2^n}',
    variables: [N('value', 'عدد صحیح', 'Integer value', null, -5), N('bits', 'تعداد بیت', 'Bit width', null, 8, { min: 2, max: 32 })],
    outputs: [O('binary', 'باینری مکمل دو', null), O('hex', 'هگزادسیمال', null), O('unsigned', 'مقدار بدون علامت', null)],
    tests: [
      { input: { value: 5, bits: 8 }, expected: { binary: '00000101', hex: '0x05', unsigned: 5 } },
      { input: { value: -5, bits: 8 }, expected: { binary: '11111011', hex: '0xFB', unsigned: 251 } },
    ],
    compute({ value, bits }) {
      if (!Number.isInteger(bits) || bits < 2 || bits > 32) throw new Error('تعداد بیت باید بین ۲ و ۳۲ باشد');
      if (!Number.isInteger(value)) throw new Error('عدد باید صحیح باشد');
      const min = -(2 ** (bits - 1));
      const max = 2 ** (bits - 1) - 1;
      if (value < min || value > max) throw new Error(`در ${bits} بیت بازه مجاز [${min}, ${max}] است`);
      const unsigned = value < 0 ? 2 ** bits + value : value;
      const binary = unsigned.toString(2).padStart(bits, '0');
      return out(
        { binary, hex: `0x${unsigned.toString(16).toUpperCase().padStart(Math.ceil(bits / 4), '0')}`, unsigned, range: `[${min}, ${max}]` },
        [`عدد ${value} در ${bits} بیت`, `مکمل دو = ${binary}`, `معادل بدون علامت = ${unsigned}`],
      );
    },
  }),

  make({
    id: 'gray_code',
    name_fa: 'کد گری',
    name_en: 'Gray Code',
    category_path: ['کامپیوتر و اطلاعات', 'نظریه اطلاعات'],
    tags: ['گری', 'باینری', 'gray'],
    description_fa: 'تبدیل دوطرفه باینری و کد گری با تعداد بیت مشخص.',
    formula_latex: 'g=n\\oplus(n\\gg1)',
    variables: [N('value', 'مقدار باینری', 'Value', null, 13), N('bits', 'تعداد بیت', 'Bit width', null, 4, { min: 1, max: 30 })],
    outputs: [O('gray', 'کد گری', null), O('gray_decimal', 'مقدار گری', null), O('binary', 'باینری', null)],
    tests: [
      { input: { value: 13, bits: 4 }, expected: { gray: '1011', gray_decimal: 11, binary: '1101' } },
      { input: { value: 0, bits: 4 }, expected: { gray: '0000', gray_decimal: 0 } },
    ],
    compute({ value, bits }) {
      if (!Number.isInteger(value) || value < 0) throw new Error('مقدار باید عدد صحیح نامنفی باشد');
      if (value >= 2 ** bits) throw new Error('مقدار در محدوده این تعداد بیت نیست');
      const gray = value ^ (value >> 1);
      // Decode back to prove the conversion is reversible.
      let decoded = 0;
      for (let shift = 0; shift < bits; shift += 1) decoded |= ((gray >> shift) & 1) ? (decoded & ~0) : 0;
      let back = 0;
      for (let shift = bits - 1; shift >= 0; shift -= 1) {
        const bit = (gray >> shift) & 1;
        back = (back << 1) | (bit ^ ((back >> 1) & 1) ^ (back & 1));
      }
      void decoded;
      return out(
        { gray: gray.toString(2).padStart(bits, '0'), gray_decimal: gray, binary: value.toString(2).padStart(bits, '0'), unique_changes: 'هر گام فقط یک بیت تغییر می‌کند' },
        [`باینری = ${value.toString(2).padStart(bits, '0')}`, `گری = n ⊕ (n≫1) = ${gray.toString(2).padStart(bits, '0')}`, `مقدار گری = ${gray}`],
      );
    },
  }),

  make({
    id: 'bitwise_ops',
    name_fa: 'عملیات بیتی',
    name_en: 'Bitwise Operations',
    category_path: ['کامپیوتر و اطلاعات', 'نظریه اطلاعات'],
    tags: ['بیت', 'AND', 'XOR'],
    description_fa: 'محاسبه هم‌زمان AND، OR، XOR و جابه‌جایی بیتی دو عدد صحیح.',
    formula_latex: 'a\\,\\&\\,b,\\;a\\,|\\,b,\\;a\\oplus b',
    variables: [N('a', 'عدد اول (صحیح)', 'First integer', null, 12), N('b', 'عدد دوم (صحیح)', 'Second integer', null, 10), N('shift', 'مقدار جابه‌جایی', 'Shift amount', null, 2, { min: 0, max: 31 })],
    outputs: [O('and', 'AND', null), O('or', 'OR', null), O('xor', 'XOR', null), O('shifted', 'a ≪ shift', null)],
    tests: [
      { input: { a: 12, b: 10, shift: 2 }, expected: { and: 8, or: 14, xor: 6, shifted: 48 } },
      { input: { a: 255, b: 15, shift: 0 }, expected: { and: 15, or: 255, xor: 240, shifted: 255 } },
    ],
    compute({ a, b, shift }) {
      if (!Number.isInteger(a) || !Number.isInteger(b)) throw new Error('ورودی‌ها باید عدد صحیح باشند');
      if (!Number.isInteger(shift) || shift < 0 || shift > 31) throw new Error('مقدار جابه‌جایی باید بین ۰ و ۳۱ باشد');
      return out(
        { and: a & b, or: a | b, xor: a ^ b, shifted: (a << shift) >>> 0, binary_a: (a >>> 0).toString(2), binary_b: (b >>> 0).toString(2) },
        [`a = ${a} (${(a >>> 0).toString(2)}) ، b = ${b} (${(b >>> 0).toString(2)})`, `AND = ${a & b} ، OR = ${a | b} ، XOR = ${a ^ b}`, `a ≪ ${shift} = ${(a << shift) >>> 0}`],
      );
    },
  }),

  make({
    id: 'password_strength',
    name_fa: 'آنتروپی گذرواژه',
    name_en: 'Password Entropy',
    category_path: ['کامپیوتر و اطلاعات', 'نظریه اطلاعات'],
    tags: ['گذرواژه', 'آنتروپی', 'امنیت'],
    description_fa: 'آنتروپی گذرواژه، تعداد حدس‌های لازم و زمان تخمینی شکستن آن.',
    formula_latex: 'H=L\\log_2N',
    difficulty: 'intermediate',
    variables: [N('length', 'طول گذرواژه', 'Password length', null, 12, { min: 1, max: 128 }), N('charset', 'اندازه مجموعه کاراکترها', 'Charset size', null, 94, { min: 2, max: 200 }), N('guesses_per_second', 'سرعت حدس (بر ثانیه)', 'Guesses per second', null, 1e10)],
    outputs: [O('entropy_bits', 'آنتروپی', 'bit'), O('combinations', 'تعداد حالت', null), O('crack_seconds', 'زمان شکستن', 's'), O('strength', 'ارزیابی', null)],
    tests: [
      { input: { length: 12, charset: 94, guesses_per_second: 1e10 }, expected: { entropy_bits: 78.655233 } },
      { input: { length: 8, charset: 26, guesses_per_second: 1e10 }, expected: { entropy_bits: 37.603518 } },
    ],
    compute({ length, charset, guesses_per_second }) {
      if (!Number.isInteger(length) || length < 1) throw new Error('طول گذرواژه باید عدد صحیح مثبت باشد');
      if (charset < 2) throw new Error('اندازه مجموعه کاراکترها باید حداقل ۲ باشد');
      if (guesses_per_second <= 0) throw new Error('سرعت حدس باید مثبت باشد');
      const entropy = length * Math.log2(charset);
      const combinations = charset ** length;
      const crackSeconds = combinations / 2 / guesses_per_second;
      const strength = entropy < 28 ? 'بسیار ضعیف' : entropy < 36 ? 'ضعیف' : entropy < 60 ? 'متوسط' : entropy < 80 ? 'قوی' : 'بسیار قوی';
      return out(
        { entropy_bits: round(entropy, 6), combinations, crack_seconds: crackSeconds, crack_years: crackSeconds / 3.15576e7, strength },
        [`H = L·log₂N = ${length} × log₂(${charset}) = ${round(entropy, 3)} بیت`, `تعداد حالت = N^L = ${combinations.toExponential(3)}`, `زمان تخمینی شکستن ≈ ${crackSeconds.toExponential(3)} ثانیه — ${strength}`],
      );
    },
  }),

  make({
    id: 'data_rate',
    name_fa: 'زمان انتقال داده',
    name_en: 'Data Transfer Time',
    category_path: ['کامپیوتر و اطلاعات', 'نظریه اطلاعات'],
    tags: ['شبکه', 'پهنای باند', 'bandwidth'],
    description_fa: 'زمان لازم برای انتقال حجم داده با سرعت مشخص و نرخ واقعی.',
    formula_latex: 't=\\frac{8S}{R}',
    variables: [N('size_mb', 'حجم داده (MB)', 'Data size', null, 1500), N('speed_mbps', 'سرعت پیوند (Mbps)', 'Link speed', null, 100), N('efficiency', 'بازده پیوند (٪)', 'Link efficiency', '%', 85)],
    outputs: [O('seconds', 'زمان انتقال', 's'), O('minutes', 'زمان انتقال', 'min'), O('effective_mbps', 'نرخ مؤثر', 'Mbps')],
    tests: [
      { input: { size_mb: 1500, speed_mbps: 100, efficiency: 85 }, expected: { seconds: 141.176471, minutes: 2.352941, effective_mbps: 85 } },
      { input: { size_mb: 100, speed_mbps: 100, efficiency: 100 }, expected: { seconds: 8 } },
    ],
    compute({ size_mb, speed_mbps, efficiency }) {
      if (size_mb < 0) throw new Error('حجم داده باید نامنفی باشد');
      if (speed_mbps <= 0) throw new Error('سرعت پیوند باید مثبت باشد');
      if (efficiency <= 0 || efficiency > 100) throw new Error('بازده باید بین ۰ و ۱۰۰ باشد');
      const effective = (speed_mbps * efficiency) / 100;
      const seconds = (size_mb * 8) / effective;
      return out(
        { seconds: round(seconds, 6), minutes: round(seconds / 60, 6), effective_mbps: round(effective, 6), bytes_per_second: round((effective * 1e6) / 8, 2) },
        [`نرخ مؤثر = ${round(effective, 2)} Mbps`, `t = 8S/R = ${round(seconds, 3)} s`, `≈ ${round(seconds / 60, 2)} دقیقه`],
      );
    },
  }),

  // ── زیست و سلامت ─────────────────────────────────────────────────────────
  make({
    id: 'body_fat_navy',
    name_fa: 'درصد چربی بدن (روش نیروی دریایی)',
    name_en: 'Body Fat (Navy Method)',
    category_path: ['زیست و سلامت', 'سلامت'],
    tags: ['چربی بدن', 'body fat', 'سلامت'],
    description_fa: 'تخمین درصد چربی بدن با محیط کمر، گردن، قد و باسن.',
    formula_latex: '\\%BF_{men}=\\frac{495}{1.0324-0.19077\\log(w-n)+0.15456\\log h}-450',
    difficulty: 'intermediate',
    variables: [N('waist', 'محیط کمر (cm)', 'Waist', 'length', 85), N('neck', 'محیط گردن (cm)', 'Neck', 'length', 40), N('height', 'قد (cm)', 'Height', 'length', 180), N('hip', 'محیط باسن (cm)', 'Hip', 'length', 95), T('sex', 'جنسیت (male/female)', 'Sex', 'male')],
    outputs: [O('body_fat', 'درصد چربی', '%'), O('category', 'طبقه‌بندی', null), O('fat_mass', 'جرم چربی (با وزن ۷۵kg)', 'kg')],
    tests: [
      { input: { waist: 85, neck: 40, height: 180, hip: 95, sex: 'male' }, expected: { body_fat: 14.517 } },
      { input: { waist: 75, neck: 32, height: 165, hip: 95, sex: 'female' }, expected: { body_fat: 27.404 } },
    ],
    compute({ waist, neck, height, hip, sex }) {
      if (waist <= neck || height <= 0) throw new Error('اندازه‌ها باید معتبر باشند (کمر > گردن)');
      const key = String(sex).trim().toLowerCase();
      let bodyFat;
      if (key === 'male' || key === 'm') {
        bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
      } else if (key === 'female' || key === 'f') {
        bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.221 * Math.log10(height)) - 450;
      } else {
        throw new Error('جنسیت باید male یا female باشد');
      }
      if (!Number.isFinite(bodyFat)) throw new Error('اندازه‌ها خارج از دامنه معتبر هستند');
      const category = bodyFat < 6 ? 'بسیار کم' : bodyFat < 14 ? 'ورزشکار' : bodyFat < 18 ? 'تناسب اندام' : bodyFat < 25 ? 'متوسط' : 'بالا';
      return out(
        { body_fat: round(bodyFat, 4), category, fat_mass: round((bodyFat / 100) * 75, 4), lean_mass: round(75 - (bodyFat / 100) * 75, 4) },
        [`درصد چربی = ${round(bodyFat, 2)}٪ (روش نیروی دریایی)`, `طبقه‌بندی: ${category}`, 'تخمین است و جایگزین DEXA نیست'],
      );
    },
  }),

  make({
    id: 'ideal_body_weight',
    name_fa: 'وزن ایده‌آل (فرمول دِواین)',
    name_en: 'Ideal Body Weight (Devine)',
    category_path: ['زیست و سلامت', 'سلامت'],
    tags: ['وزن ایده‌آل', 'IBW', 'سلامت'],
    description_fa: 'وزن ایده‌آل با فرمول دِواین و محدوده سالم BMI.',
    formula_latex: 'IBW=50+2.3\\,(\\text{in}-60)',
    variables: [N('height_cm', 'قد (cm)', 'Height', 'length', 180), T('sex', 'جنسیت (male/female)', 'Sex', 'male')],
    outputs: [O('ideal_weight', 'وزن ایده‌آل', 'kg'), O('healthy_min', 'حداقل وزن سالم', 'kg'), O('healthy_max', 'حداکثر وزن سالم', 'kg')],
    tests: [
      { input: { height_cm: 180, sex: 'male' }, expected: { ideal_weight: 74.99 } },
      { input: { height_cm: 165, sex: 'female' }, expected: { ideal_weight: 56.9094 } },
    ],
    compute({ height_cm, sex }) {
      if (height_cm <= 100 || height_cm > 250) throw new Error('قد باید بین ۱۰۰ و ۲۵۰ سانتی‌متر باشد');
      const inches = height_cm / 2.54;
      const key = String(sex).trim().toLowerCase();
      const base = key === 'male' || key === 'm' ? 50 : key === 'female' || key === 'f' ? 45.5 : null;
      if (base === null) throw new Error('جنسیت باید male یا female باشد');
      const ideal = base + 2.3 * Math.max(0, inches - 60);
      const meters = height_cm / 100;
      return out(
        { ideal_weight: round(ideal, 4), healthy_min: round(18.5 * meters * meters, 4), healthy_max: round(24.9 * meters * meters, 4), height_inches: round(inches, 3) },
        [`قد = ${round(inches, 2)} اینچ`, `IBW = ${base} + 2.3×(${round(inches, 2)}−60) = ${round(ideal, 2)} kg`, `محدوده BMI سالم: ${round(18.5 * meters * meters, 1)} تا ${round(24.9 * meters * meters, 1)} kg`],
      );
    },
  }),

  make({
    id: 'heart_rate_zones',
    name_fa: 'پهنه‌های ضربان قلب',
    name_en: 'Heart Rate Zones',
    category_path: ['زیست و سلامت', 'سلامت'],
    tags: ['ضربان قلب', 'ورزش', 'heart rate'],
    description_fa: 'حداکثر ضربان قلب و پنج پهنه تمرینی بر پایه سن.',
    formula_latex: 'HR_{max}\\approx220-\\text{age}',
    variables: [N('age', 'سن (سال)', 'Age', 'time', 30, { min: 10, max: 100 }), N('resting', 'ضربان استراحت', 'Resting heart rate', null, 60)],
    outputs: [O('max_hr', 'حداکثر ضربان', 'bpm'), O('zone2', 'پهنه ۲ (۶۰-۷۰٪)', 'bpm'), O('zone4', 'پهنه ۴ (۸۰-۹۰٪)', 'bpm'), O('reserve', 'ذخیره ضربان', 'bpm')],
    tests: [
      { input: { age: 30, resting: 60 }, expected: { max_hr: 190, reserve: 130, zone2: '138-151' } },
      { input: { age: 50, resting: 70 }, expected: { max_hr: 170 } },
    ],
    compute({ age, resting }) {
      if (age <= 0 || age > 120) throw new Error('سن باید معتبر باشد');
      const maxHr = 220 - age;
      const reserve = maxHr - resting;
      const zone = (low, high) => `${Math.round(resting + reserve * low)}-${Math.round(resting + reserve * high)}`;
      return out(
        { max_hr: round(maxHr, 4), reserve: round(reserve, 4), zone1: zone(0.5, 0.6), zone2: zone(0.6, 0.7), zone3: zone(0.7, 0.8), zone4: zone(0.8, 0.9), zone5: zone(0.9, 1) },
        [`HR_max ≈ 220 − ${age} = ${maxHr} bpm`, `ذخیره ضربان = ${reserve} bpm (روش Karvonen)`, `پهنه‌ها: Z1 ${zone(0.5, 0.6)} | Z2 ${zone(0.6, 0.7)} | Z3 ${zone(0.7, 0.8)} | Z4 ${zone(0.8, 0.9)} | Z5 ${zone(0.9, 1)}`],
      );
    },
  }),

  make({
    id: 'iv_drip_rate',
    name_fa: 'نرخ انفوزیون وریدی',
    name_en: 'IV Drip Rate',
    category_path: ['زیست و سلامت', 'سلامت'],
    tags: ['سرم', 'پرستاری', 'IV'],
    description_fa: 'سرعت قطره در دقیقه و نرخ حجمی برای سرم وریدی.',
    formula_latex: '\\text{drops/min}=\\frac{V\\times gtt}{t}',
    variables: [N('volume', 'حجم سرم (mL)', 'Volume', 'volume', 500), N('time_min', 'مدت (دقیقه)', 'Duration', 'time', 240, { min: 1 }), N('drop_factor', 'ضریب قطره (gtt/mL)', 'Drop factor', null, 20)],
    outputs: [O('drops_per_min', 'قطره در دقیقه', 'gtt/min'), O('ml_per_hour', 'حجم در ساعت', 'mL/h'), O('total_drops', 'کل قطره‌ها', null)],
    tests: [
      { input: { volume: 500, time_min: 240, drop_factor: 20 }, expected: { drops_per_min: 41.666667, ml_per_hour: 125 } },
      { input: { volume: 1000, time_min: 480, drop_factor: 15 }, expected: { drops_per_min: 31.25 } },
    ],
    compute({ volume, time_min, drop_factor }) {
      if (volume < 0) throw new Error('حجم باید نامنفی باشد');
      if (time_min <= 0) throw new Error('مدت باید مثبت باشد');
      if (drop_factor <= 0) throw new Error('ضریب قطره باید مثبت باشد');
      return out(
        { drops_per_min: round((volume * drop_factor) / time_min, 6), ml_per_hour: round((volume * 60) / time_min, 6), total_drops: round(volume * drop_factor, 4) },
        [`قطره در دقیقه = (${volume} × ${drop_factor}) / ${time_min} = ${round((volume * drop_factor) / time_min, 2)}`, `نرخ حجمی = ${round((volume * 60) / time_min, 2)} mL/h`, `کل قطره‌ها = ${round(volume * drop_factor, 0)}`],
      );
    },
  }),

  make({
    id: 'map_blood_pressure',
    name_fa: 'فشار متوسط شریانی (MAP)',
    name_en: 'Mean Arterial Pressure',
    category_path: ['زیست و سلامت', 'سلامت'],
    tags: ['فشار خون', 'MAP', 'سلامت'],
    description_fa: 'فشار متوسط شریانی و فشار نبض از فشار سیستول و دیاستول.',
    formula_latex: 'MAP=\\frac{SBP+2DBP}{3}',
    variables: [N('systolic', 'فشار سیستول (mmHg)', 'Systolic', 'pressure', 120), N('diastolic', 'فشار دیاستول (mmHg)', 'Diastolic', 'pressure', 80)],
    outputs: [O('map', 'فشار متوسط شریانی', 'mmHg'), O('pulse_pressure', 'فشار نبض', 'mmHg'), O('category', 'طبقه‌بندی', null)],
    tests: [
      { input: { systolic: 120, diastolic: 80 }, expected: { map: 93.333333, pulse_pressure: 40 } },
      { input: { systolic: 150, diastolic: 95 }, expected: { map: 113.333333 } },
    ],
    compute({ systolic, diastolic }) {
      if (systolic <= diastolic) throw new Error('فشار سیستول باید بیشتر از دیاستول باشد');
      const map = (systolic + 2 * diastolic) / 3;
      const category = systolic < 120 && diastolic < 80 ? 'نرمال' : systolic < 130 && diastolic < 80 ? 'بالا-نرمال' : systolic < 140 || diastolic < 90 ? 'پرفشاری مرحله ۱' : 'پرفشاری مرحله ۲';
      return out(
        { map: round(map, 6), pulse_pressure: round(systolic - diastolic, 6), category },
        [`MAP = (SBP + 2DBP)/3 = ${round(map, 3)} mmHg`, `فشار نبض = ${round(systolic - diastolic, 1)} mmHg`, `طبقه‌بندی: ${category}`],
      );
    },
  }),

  make({
    id: 'hba1c_eag',
    name_fa: 'تبدیل HbA1c',
    name_en: 'HbA1c ↔ eAG',
    category_path: ['زیست و سلامت', 'سلامت'],
    tags: ['دیابت', 'HbA1c', 'قند خون'],
    description_fa: 'تبدیل HbA1c به میانگین قند خون (eAG) و واحد mmol/mol.',
    formula_latex: 'eAG=28.7\\times HbA1c-46.7',
    variables: [N('a1c', 'HbA1c (٪)', 'HbA1c percent', '%', 7, { min: 3, max: 20 })],
    outputs: [O('eag_mgdl', 'میانگین قند خون', 'mg/dL'), O('eag_mmol', 'میانگین قند خون', 'mmol/L'), O('ifcc', 'واحد IFCC', 'mmol/mol'), O('status', 'وضعیت', null)],
    tests: [
      { input: { a1c: 7 }, expected: { eag_mgdl: 154.2, eag_mmol: 8.566667, ifcc: 52.95 } },
      { input: { a1c: 5.5 }, expected: { eag_mgdl: 111.15 } },
    ],
    compute({ a1c }) {
      if (a1c < 3 || a1c > 20) throw new Error('HbA1c باید بین ۳ و ۲۰ درصد باشد');
      const eag = 28.7 * a1c - 46.7;
      const ifcc = (a1c - 2.152) * 10.929;
      const status = a1c < 5.7 ? 'نرمال' : a1c < 6.5 ? 'پیش‌دیابت' : 'دیابت';
      return out(
        { eag_mgdl: round(eag, 4), eag_mmol: round(eag / 18, 6), ifcc: round(ifcc, 4), status },
        [`eAG = 28.7 × ${a1c} − 46.7 = ${round(eag, 2)} mg/dL`, `= ${round(eag / 18, 3)} mmol/L`, `IFCC = ${round(ifcc, 2)} mmol/mol — ${status}`],
      );
    },
  }),

  // ── نجوم و فضا ───────────────────────────────────────────────────────────
  make({
    id: 'kepler_third_law',
    name_fa: 'قانون سوم کپلر',
    name_en: "Kepler's Third Law",
    category_path: ['نجوم و فضا', 'حرکت مداری'],
    tags: ['کپلر', 'مدار', 'orbital'],
    description_fa: 'دوره تناوب مداری از نیم‌محور بزرگ و جرم مرکزی با قانون سوم کپلر.',
    formula_latex: 'T^2=\\frac{4\\pi^2a^3}{GM}',
    variables: [N('a_au', 'نیم‌محور بزرگ (AU)', 'Semi-major axis', null, 5.203), N('central_mass_solar', 'جرم مرکزی (جرم خورشید)', 'Central mass', 'mass', 1)],
    outputs: [O('period_years', 'دوره تناوب', 'yr'), O('period_days', 'دوره تناوب', 'd'), O('mean_speed_km_s', 'سرعت مداری میانگین', 'km/s')],
    tests: [
      { input: { a_au: 5.203, central_mass_solar: 1 }, expected: { period_years: 11.864, period_days: 4333.4 } },
      { input: { a_au: 1, central_mass_solar: 1 }, expected: { period_years: 1 } },
    ],
    compute({ a_au, central_mass_solar }) {
      if (a_au <= 0 || central_mass_solar <= 0) throw new Error('نیم‌محور و جرم باید مثبت باشند');
      const periodYears = Math.sqrt((a_au ** 3) / central_mass_solar);
      const radiusKm = a_au * AU_KM;
      return out(
        { period_years: round(periodYears, 6), period_days: round(periodYears * 365.25, 4), mean_speed_km_s: round((2 * Math.PI * radiusKm) / (periodYears * 3.15576e7), 4) },
        [`a = ${a_au} AU ، M = ${central_mass_solar} M☉`, `T = √(a³/M) = ${round(periodYears, 4)} سال`, `≈ ${round(periodYears * 365.25, 1)} روز`],
      );
    },
  }),

  make({
    id: 'hubble_law',
    name_fa: 'قانون هابل',
    name_en: "Hubble's Law",
    category_path: ['نجوم و فضا', 'کیهان‌شناسی'],
    tags: ['هابل', 'کیهان', 'redshift'],
    description_fa: 'سرعت دور شدن کهکشان، فاصله از سرعت و تخمین سن کیهان.',
    formula_latex: 'v=H_0d,\\quad t_{H}=\\frac{1}{H_0}',
    variables: [N('distance_mpc', 'فاصله (Mpc)', 'Distance', null, 100), N('h0', 'ثابت هابل H₀ (km/s/Mpc)', 'Hubble constant', null, 70)],
    outputs: [O('velocity', 'سرعت دور شدن', 'km/s'), O('redshift', 'انتقال به سرخ z', null), O('universe_age_gyr', 'سن کیهان', 'Gyr')],
    tests: [
      { input: { distance_mpc: 100, h0: 70 }, expected: { velocity: 7000, universe_age_gyr: 13.968 } },
      { input: { distance_mpc: 1, h0: 70 }, expected: { velocity: 70 } },
    ],
    compute({ distance_mpc, h0 }) {
      if (h0 <= 0) throw new Error('ثابت هابل باید مثبت باشد');
      if (distance_mpc <= 0) throw new Error('فاصله باید مثبت باشد');
      const velocity = h0 * distance_mpc;
      return out(
        { velocity: round(velocity, 4), redshift: round(velocity / c, 8), universe_age_gyr: round(978.4 / h0, 3), light_years: round(distance_mpc * 3.26156e6, 0) },
        [`v = H₀d = ${h0} × ${distance_mpc} = ${round(velocity, 2)} km/s`, `z = v/c = ${round(velocity / c, 5)}`, `سن تقریبی کیهان = 1/H₀ ≈ ${round(978.4 / h0, 2)} میلیارد سال`],
      );
    },
  }),

  make({
    id: 'schwarzschild_radius',
    name_fa: 'شعاع شوارتزشیلد',
    name_en: 'Schwarzschild Radius',
    category_path: ['نجوم و فضا', 'کیهان‌شناسی'],
    tags: ['سیاه‌چاله', 'افقی رویداد', 'black hole'],
    description_fa: 'شعاع افق رویداد سیاه‌چاله و چگالی میانگین آن.',
    formula_latex: 'r_s=\\frac{2GM}{c^2}',
    variables: [N('mass_solar', 'جرم (جرم خورشید)', 'Mass in solar masses', 'mass', 10)],
    outputs: [O('radius_km', 'شعاع شوارتزشیلد', 'km'), O('radius_solar', 'شعاع (شعاع خورشید)', null), O('density', 'چگالی میانگین', 'kg/m³')],
    tests: [
      { input: { mass_solar: 10 }, expected: { radius_km: 29.53 } },
      { input: { mass_solar: 1 }, expected: { radius_km: 2.953 } },
    ],
    compute({ mass_solar }) {
      if (mass_solar <= 0) throw new Error('جرم باید مثبت باشد');
      const mass = mass_solar * M_SUN;
      const radius = (2 * G * mass) / (c * c);
      const volume = (4 / 3) * Math.PI * radius ** 3;
      return out(
        { radius_km: round(radius / 1000, 6), radius_solar: round(radius / 6.957e8, 8), density: mass / volume },
        [`r_s = 2GM/c² = ${round(radius / 1000, 3)} km`, `≈ ${round(radius / 6.957e8, 6)} برابر شعاع خورشید`, `چگالی میانگین = ${(mass / volume).toExponential(3)} kg/m³`],
      );
    },
  }),

  make({
    id: 'stellar_luminosity',
    name_fa: 'درخشندگی ستاره',
    name_en: 'Stellar Luminosity',
    category_path: ['نجوم و فضا', 'حرکت مداری'],
    tags: ['ستاره', 'درخشندگی', 'luminosity'],
    description_fa: 'درخشندگی ستاره از شعاع و دمای سطح با قانون استفان-بولتزمان.',
    formula_latex: 'L=4\\pi R^2\\sigma T^4',
    variables: [N('radius_solar', 'شعاع (شعاع خورشید)', 'Radius in solar radii', null, 1), N('temperature', 'دمای سطح (K)', 'Surface temperature', 'temperature', 5778)],
    outputs: [O('luminosity_w', 'درخشندگی', 'W'), O('luminosity_solar', 'درخشندگی (خورشید=۱)', null), O('peak_nm', 'طول موج اوج', 'nm')],
    tests: [
      { input: { radius_solar: 1, temperature: 5778 }, expected: { luminosity_solar: 1.004 } },
      { input: { radius_solar: 10, temperature: 3000 }, expected: { luminosity_solar: 7.2976 } },
    ],
    compute({ radius_solar, temperature }) {
      if (radius_solar <= 0 || temperature <= 0) throw new Error('شعاع و دما باید مثبت باشند');
      const radius = radius_solar * 6.957e8;
      const luminosity = 4 * Math.PI * radius * radius * sigma * temperature ** 4;
      return out(
        { luminosity_w: luminosity, luminosity_solar: round(luminosity / L_SUN, 6), peak_nm: round(2.897771955e-3 / temperature * 1e9, 4) },
        [`L = 4πR²σT⁴ = ${luminosity.toExponential(4)} W`, `= ${round(luminosity / L_SUN, 4)} L☉`, `طول موج اوج (وین) = ${round((2.897771955e-3 / temperature) * 1e9, 1)} nm`],
      );
    },
  }),

  make({
    id: 'cosmic_redshift',
    name_fa: 'انتقال به سرخ کیهانی',
    name_en: 'Cosmological Redshift',
    category_path: ['نجوم و فضا', 'کیهان‌شناسی'],
    tags: ['انتقال به سرخ', 'داپلر', 'redshift'],
    description_fa: 'محاسبه z از طول موج‌ها، سرعت دور شدن و فاصله با ثابت هابل.',
    formula_latex: 'z=\\frac{\\lambda_{obs}-\\lambda_{emit}}{\\lambda_{emit}},\\quad v\\approx cz',
    variables: [N('lambda_emit', 'طول موج گسیلی (nm)', 'Emitted wavelength', 'wavelength', 500), N('lambda_obs', 'طول موج مشاهده‌شده (nm)', 'Observed wavelength', 'wavelength', 550), N('h0', 'ثابت هابل (km/s/Mpc)', 'Hubble constant', null, 70)],
    outputs: [O('redshift', 'انتقال به سرخ z', null), O('velocity_km_s', 'سرعت دور شدن', 'km/s'), O('distance_mpc', 'فاصله', 'Mpc')],
    tests: [
      { input: { lambda_emit: 500, lambda_obs: 550, h0: 70 }, expected: { redshift: 0.1, velocity_km_s: 29979.2458, distance_mpc: 428.27494 } },
      { input: { lambda_emit: 656.3, lambda_obs: 600, h0: 70 }, expected: { redshift: -0.085784 } },
    ],
    compute({ lambda_emit, lambda_obs, h0 }) {
      if (lambda_emit <= 0 || lambda_obs <= 0) throw new Error('طول موج‌ها باید مثبت باشند');
      if (h0 <= 0) throw new Error('ثابت هابل باید مثبت باشد');
      const z = (lambda_obs - lambda_emit) / lambda_emit;
      const velocity = c * z;
      return out(
        { redshift: round(z, 8), velocity_km_s: round(velocity / 1000, 4), distance_mpc: round(velocity / 1000 / h0, 5), type: z > 0 ? 'دور شدن (انتقال به سرخ)' : 'نزدیک شدن (انتقال به آبی)' },
        [`z = (λ_obs − λ_emit)/λ_emit = ${round(z, 6)}`, `v ≈ cz = ${round(velocity / 1000, 2)} km/s`, `d = v/H₀ = ${round(velocity / 1000 / h0, 2)} Mpc — ${z > 0 ? 'انتقال به سرخ' : 'انتقال به آبی'}`],
      );
    },
  }),

  make({
    id: 'distance_modulus',
    name_fa: 'فاصله سنجی نجومی (قدر مطلق)',
    name_en: 'Distance Modulus',
    category_path: ['نجوم و فضا', 'حرکت مداری'],
    tags: ['قدر مطلق', 'فاصله', 'magnitude'],
    description_fa: 'فاصله ستاره از قدر ظاهری و مطلق با رابطه قدر فاصله.',
    formula_latex: 'm-M=5\\log_{10}d-5',
    variables: [N('apparent', 'قدر ظاهری m', 'Apparent magnitude', null, 6), N('absolute', 'قدر مطلق M', 'Absolute magnitude', null, 1)],
    outputs: [O('distance_pc', 'فاصله', 'pc'), O('distance_ly', 'فاصله', 'ly'), O('modulus', 'اختلاف قدر', null)],
    tests: [
      { input: { apparent: 6, absolute: 1 }, expected: { distance_pc: 100, modulus: 5 } },
      { input: { apparent: -1.46, absolute: 1.42 }, expected: { distance_pc: 2.6548 } },
    ],
    compute({ apparent, absolute }) {
      const modulus = apparent - absolute;
      const distance = 10 ** ((modulus + 5) / 5);
      return out(
        { distance_pc: round(distance, 4), distance_ly: round((distance * 3.26156), 4), modulus: round(modulus, 4), parallax_mas: round(1000 / distance, 6) },
        [`m − M = ${round(modulus, 3)}`, `d = 10^((m−M+5)/5) = ${round(distance, 3)} پارسک`, `= ${round(distance * 3.26156, 2)} سال نوری`],
      );
    },
  }),

  // ── زمین و محیط ──────────────────────────────────────────────────────────
  make({
    id: 'richter_energy',
    name_fa: 'انرژی زلزله (ریشتر)',
    name_en: 'Earthquake Energy',
    category_path: ['زمین و محیط', 'زلزله'],
    tags: ['زلزله', 'ریشتر', 'earthquake'],
    description_fa: 'انرژی آزادشده زلزله، معادل TNT و نسبت به یک بزرگی مرجع.',
    formula_latex: '\\log_{10}E=1.5M+4.8',
    variables: [N('magnitude', 'بزرگی ریشتر', 'Magnitude', null, 6, { min: 0, max: 9.5 }), N('reference', 'بزرگی مرجع', 'Reference magnitude', null, 5, { min: 0, max: 9.5 })],
    outputs: [O('energy_j', 'انرژی', 'J'), O('tnt_tons', 'معادل TNT', 'ton'), O('ratio', 'نسبت به مرجع', null)],
    tests: [
      { input: { magnitude: 6, reference: 5 }, expected: { energy_j: 6.309573e13, ratio: 31.622777 } },
      { input: { magnitude: 5, reference: 5 }, expected: { ratio: 1 } },
    ],
    compute({ magnitude, reference }) {
      const energy = 10 ** (1.5 * magnitude + 4.8);
      const referenceEnergy = 10 ** (1.5 * reference + 4.8);
      return out(
        { energy_j: energy, tnt_tons: energy / 4.184e9, ratio: round(energy / referenceEnergy, 6), amplitude_ratio: round(10 ** (magnitude - reference), 6) },
        [`log E = 1.5M + 4.8 ⟹ E = ${energy.toExponential(3)} J`, `معادل TNT = ${round(energy / 4.184e9, 2)} تن`, `نسبت به M=${reference}: ${round(energy / referenceEnergy, 2)} برابر انرژی`],
      );
    },
  }),

  make({
    id: 'wind_chill',
    name_fa: 'دمای احساسی باد (Wind Chill)',
    name_en: 'Wind Chill',
    category_path: ['زمین و محیط', 'جو و اقلیم'],
    tags: ['باد', 'سرمایش', 'weather'],
    description_fa: 'دمای احساسی ناشی از باد برای دماهای سرد و سرعت باد مشخص.',
    formula_latex: 'T_{wc}=13.12+0.6215T-11.37v^{0.16}+0.3965Tv^{0.16}',
    variables: [N('temperature', 'دمای هوا (C)', 'Air temperature', 'temperature', 5), N('wind_speed', 'سرعت باد (km/h)', 'Wind speed', 'speed', 20)],
    outputs: [O('wind_chill', 'دمای احساسی', '°C'), O('difference', 'اختلاف با دمای واقعی', '°C'), O('risk', 'هشدار', null)],
    tests: [
      { input: { temperature: 5, wind_speed: 20 }, expected: { wind_chill: 1.067 } },
      { input: { temperature: 0, wind_speed: 10 }, expected: { wind_chill: -3.3147 } },
    ],
    compute({ temperature, wind_speed }) {
      if (wind_speed < 0) throw new Error('سرعت باد باید نامنفی باشد');
      const v = wind_speed ** 0.16;
      const chill = 13.12 + 0.6215 * temperature - 11.37 * v + 0.3965 * temperature * v;
      const risk =
        chill > 0 ? 'پایین' : chill > -10 ? 'کم' : chill > -28 ? 'سرمازدگی در ۳۰ دقیقه' : chill > -40 ? 'سرمازدگی در ۱۰ دقیقه' : 'سرمازدگی در ۵ دقیقه';
      return out(
        { wind_chill: round(chill, 4), difference: round(chill - temperature, 4), risk },
        [`T_wc = 13.12 + 0.6215T − 11.37v⁰·¹⁶ + 0.3965Tv⁰·¹⁶`, `= ${round(chill, 2)} °C (دمای واقعی ${temperature} °C)`, `ریسک سرمازدگی: ${risk}`],
      );
    },
  }),

  make({
    id: 'heat_index',
    name_fa: 'شاخص گرما (Heat Index)',
    name_en: 'Heat Index',
    category_path: ['زمین و محیط', 'جو و اقلیم'],
    tags: ['گرما', 'رطوبت', 'weather'],
    description_fa: 'دمای احساسی گرما با رطوبت نسبی بالا (فرمول Rothfusz).',
    formula_latex: 'HI=-42.379+2.049T+10.143R-\\cdots',
    difficulty: 'intermediate',
    variables: [N('temperature', 'دما (C)', 'Temperature', 'temperature', 35), N('humidity', 'رطوبت نسبی (٪)', 'Relative humidity', '%', 60)],
    outputs: [O('heat_index_c', 'شاخص گرما', '°C'), O('heat_index_f', 'شاخص گرما', '°F'), O('risk', 'هشدار', null)],
    tests: [
      { input: { temperature: 35, humidity: 60 }, expected: { heat_index_c: 45.0502 } },
      { input: { temperature: 30, humidity: 50 }, expected: { heat_index_c: 31.0491 } },
    ],
    compute({ temperature, humidity }) {
      if (humidity < 0 || humidity > 100) throw new Error('رطوبت باید بین ۰ و ۱۰۰ درصد باشد');
      const T = (temperature * 9) / 5 + 32;
      const R = humidity;
      let hi =
        -42.379 +
        2.04901523 * T +
        10.14333127 * R -
        0.22475541 * T * R -
        0.00683783 * T * T -
        0.05481717 * R * R +
        0.00122874 * T * T * R +
        0.00085282 * T * R * R -
        0.00000199 * T * T * R * R;
      if (R < 13 && T >= 80 && T <= 112) hi -= ((13 - R) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
      if (R > 85 && T >= 80 && T <= 87) hi += ((R - 85) / 10) * ((87 - T) / 5);
      const celsius = ((hi - 32) * 5) / 9;
      const risk = celsius < 27 ? 'پایین' : celsius < 32 ? 'احتیاط' : celsius < 41 ? 'احتیاط شدید' : celsius < 54 ? 'خطر' : 'خطر شدید';
      return out(
        { heat_index_c: round(celsius, 4), heat_index_f: round(hi, 4), risk },
        [`T = ${round(T, 2)} °F ، RH = ${humidity}٪`, `شاخص گرما = ${round(hi, 2)} °F = ${round(celsius, 2)} °C`, `سطح خطر: ${risk}`],
      );
    },
  }),

  make({
    id: 'dew_point',
    name_fa: 'نقطه شبنم',
    name_en: 'Dew Point',
    category_path: ['زمین و محیط', 'جو و اقلیم'],
    tags: ['شبنم', 'رطوبت', 'dew point'],
    description_fa: 'نقطه شبنم با فرمول مگنوس و رطوبت مطلق تقریبی.',
    formula_latex: 'T_d=\\frac{c\\alpha}{b-\\alpha},\\quad \\alpha=\\ln\\frac{RH}{100}+\\frac{bT}{c+T}',
    variables: [N('temperature', 'دما (C)', 'Temperature', 'temperature', 25), N('humidity', 'رطوبت نسبی (٪)', 'Relative humidity', '%', 60)],
    outputs: [O('dew_point', 'نقطه شبنم', '°C'), O('spread', 'اختلاف دما و شبنم', '°C'), O('comfort', 'احساس', null)],
    tests: [
      { input: { temperature: 25, humidity: 60 }, expected: { dew_point: 16.695 } },
      { input: { temperature: 20, humidity: 100 }, expected: { dew_point: 20 } },
    ],
    compute({ temperature, humidity }) {
      if (humidity <= 0 || humidity > 100) throw new Error('رطوبت باید بین ۰ و ۱۰۰ درصد باشد');
      const b = 17.625;
      const c = 243.04;
      const alpha = Math.log(humidity / 100) + (b * temperature) / (c + temperature);
      const dew = (c * alpha) / (b - alpha);
      const comfort = dew < 10 ? 'خشک و راحت' : dew < 16 ? 'مطبوع' : dew < 20 ? 'کمی شرجی' : dew < 24 ? 'شرجی' : 'بسیار شرجی';
      return out(
        { dew_point: round(dew, 4), spread: round(temperature - dew, 4), comfort },
        [`α = ln(${humidity/100}) + 17.625×${temperature}/(243.04+${temperature}) = ${round(alpha, 4)}`, `T_d = 243.04α/(17.625−α) = ${round(dew, 2)} °C`, `احساس: ${comfort}`],
      );
    },
  }),

  make({
    id: 'wind_power_density',
    name_fa: 'چگالی توان باد',
    name_en: 'Wind Power Density',
    category_path: ['زمین و محیط', 'جو و اقلیم'],
    tags: ['باد', 'انرژی تجدیدپذیر', 'turbine'],
    description_fa: 'توان موجود در باد و توان قابل استخراج توربین با بازده مشخص.',
    formula_latex: 'P=\\tfrac12\\rho Av^3C_p',
    variables: [N('velocity', 'سرعت باد (m/s)', 'Wind speed', 'speed', 10), N('density', 'چگالی هوا (kg/m³)', 'Air density', 'density', 1.225), N('rotor_diameter', 'قطر روتور (m)', 'Rotor diameter', 'length', 80), N('cp', 'ضریب توان Cp', 'Power coefficient', null, 0.4)],
    outputs: [O('power_density', 'چگالی توان', 'W/m²'), O('turbine_power', 'توان توربین', 'kW'), O('annual_energy', 'انرژی سالانه', 'MWh')],
    tests: [
      { input: { velocity: 10, density: 1.225, rotor_diameter: 80, cp: 0.4 }, expected: { power_density: 612.5, turbine_power: 1231.5 } },
      { input: { velocity: 5, density: 1.225, rotor_diameter: 80, cp: 0.4 }, expected: { power_density: 76.5625 } },
    ],
    compute({ velocity, density, rotor_diameter, cp }) {
      if (velocity < 0 || density <= 0) throw new Error('سرعت نامنفی و چگالی مثبت لازم است');
      if (rotor_diameter <= 0) throw new Error('قطر روتور باید مثبت باشد');
      if (cp < 0 || cp > 0.593) throw new Error('Cp باید بین ۰ و حد بتز (۰.۵۹۳) باشد');
      const powerDensity = 0.5 * density * velocity ** 3;
      const area = Math.PI * (rotor_diameter / 2) ** 2;
      const power = powerDensity * area * cp;
      return out(
        { power_density: round(powerDensity, 4), turbine_power: round(power / 1000, 4), annual_energy: round((power * 8760) / 1e6, 4), rotor_area: round(area, 4) },
        [`چگالی توان = ½ρv³ = ${round(powerDensity, 2)} W/m²`, `مساحت روتور = ${round(area, 1)} m² ⟹ توان = ${round(power / 1000, 2)} kW`, `انرژی سالانه (ضریب ظرفیت ۱۰۰٪) = ${round((power * 8760) / 1e6, 1)} MWh`],
      );
    },
  }),
];
