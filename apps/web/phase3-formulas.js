// Phase 3 — mathematics pack: arithmetic, number theory, algebra, geometry,
// calculus, statistics, discrete mathematics and linear algebra.
// Every solver is a trusted function; every formula ships ≥2 regression cases.
import { evaluate } from './engine.js';
import { make, N, T, O, round, out, parseList, gcd, frac, normalCdf, zCritical } from './formula-kit.js';

const sorted = (values) => [...values].sort((a, b) => a - b);

/** Linear-interpolation quantile (matches the sample-descriptive statistics pack). */
const quantile = (values, p) => {
  const data = sorted(values);
  const position = (data.length - 1) * p;
  const base = Math.floor(position);
  const rest = position - base;
  return data[base + 1] !== undefined ? data[base] + rest * (data[base + 1] - data[base]) : data[base];
};

const polyEval = (coeffs, x) =>
  coeffs.reduce((acc, coefficient) => acc * x + coefficient, 0); // highest power first

export const PHASE3_FORMULAS = [
  // ── حساب و نظریه اعداد ────────────────────────────────────────────────────
  make({
    id: 'decimal_to_fraction',
    name_fa: 'تبدیل اعشار به کسر',
    name_en: 'Decimal to Fraction',
    category_path: ['ریاضیات', 'حساب و نظریه اعداد'],
    tags: ['کسر', 'اعشار', 'decimal'],
    description_fa: 'تبدیل عدد اعشاری به کسر ساده‌شده با نمایش مخلوط و درصد.',
    formula_latex: '0.d_1d_2\\ldots d_n=\\frac{d_1d_2\\ldots d_n}{10^n}',
    variables: [N('decimal', 'عدد اعشاری', 'Decimal', null, 0.375)],
    outputs: [O('numerator', 'صورت', null), O('denominator', 'مخرج', null), O('simplified', 'کسر ساده', null), O('percent', 'درصد', '%')],
    tests: [
      { input: { decimal: 0.375 }, expected: { numerator: 3, denominator: 8, simplified: '3/8' } },
      { input: { decimal: -0.6 }, expected: { numerator: -3, denominator: 5, simplified: '-3/5' } },
      { input: { decimal: 1.25 }, expected: { numerator: 5, denominator: 4, percent: 125 } },
    ],
    compute({ decimal }) {
      if (!Number.isFinite(decimal)) throw new Error('عدد اعشاری معتبر وارد کنید');
      const digits = Math.min(9, (String(Math.abs(decimal)).split('.')[1] || '').length);
      const scale = 10 ** digits;
      const numerator = Math.round(decimal * scale);
      const g = gcd(numerator, scale) || 1;
      const simplified = `${numerator / g}/${scale / g}`;
      return out(
        { numerator: numerator / g, denominator: scale / g, simplified, percent: round(decimal * 100, 6), digits },
        [`${decimal} = ${numerator}/${scale}`, `ب.م.م صورت و مخرج = ${g}`, `کسر ساده‌شده = ${simplified}`],
      );
    },
  }),

  make({
    id: 'continued_fraction',
    name_fa: 'کسر مسلسل',
    name_en: 'Continued Fraction',
    category_path: ['ریاضیات', 'حساب و نظریه اعداد'],
    tags: ['کسر مسلسل', 'تقریب', 'continued'],
    description_fa: 'بازنمایی کسر a/b به‌صورت کسر مسلسل [a₀; a₁, a₂, …] با بهترین تقریب‌ها.',
    formula_latex: '\\frac{a}{b}=a_0+\\cfrac{1}{a_1+\\cfrac{1}{a_2+\\cdots}}',
    variables: [N('a', 'صورت a', 'Numerator', null, 415), N('b', 'مخرج b', 'Denominator', null, 93)],
    outputs: [O('coefficients', 'ضرایب', null), O('stages', 'تعداد مراحل', null), O('convergent', 'تقریب', null)],
    tests: [
      { input: { a: 415, b: 93 }, expected: { coefficients: '4, 2, 6, 7', stages: 4, convergent: 4.462366 } },
      { input: { a: 7, b: 3 }, expected: { coefficients: '2, 3', convergent: 2.333333 } },
    ],
    compute({ a, b }) {
      if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) throw new Error('a و b باید عدد باشند و b ≠ 0');
      let x = Math.abs(a);
      let y = Math.abs(b);
      const coefficients = [];
      for (let guard = 0; guard < 40 && y !== 0; guard += 1) {
        const q = Math.floor(x / y);
        coefficients.push(q);
        [x, y] = [y, x - q * y];
      }
      // Evaluate back using the convergents recurrence.
      let numerator = 1;
      let denominator = 0;
      for (let i = coefficients.length - 1; i >= 0; i -= 1) {
        [numerator, denominator] = [coefficients[i] * numerator + denominator, numerator];
      }
      return out(
        {
          coefficients: coefficients.join(', '),
          stages: coefficients.length,
          convergent: round(numerator / denominator, 8),
        },
        [
          `تقسیم‌های متوالی: ${coefficients.join(' → ')}`,
          `کسر مسلسل = [${coefficients.join('; ')}]`,
          `بازسازی: ${a}/${b} ≈ ${round(numerator / denominator, 6)}`,
        ],
      );
    },
  }),

  make({
    id: 'nth_prime',
    name_fa: 'nامین عدد اول',
    name_en: 'nth Prime Number',
    category_path: ['ریاضیات', 'حساب و نظریه اعداد'],
    tags: ['اول', 'غربال', 'prime'],
    description_fa: 'پیدا کردن nامین عدد اول با غربال اراتوستن و شمارش اعداد اول تا آن.',
    formula_latex: 'p_n \\approx n\\ln n,\\quad \\pi(x)\\sim\\frac{x}{\\ln x}',
    variables: [N('n', 'شماره عدد اول', 'Index n', null, 100, { min: 1, max: 200000 })],
    outputs: [O('prime', 'عدد اول', null), O('index', 'شماره', null), O('twin_partner', 'همزاد (p+2)', null)],
    tests: [
      { input: { n: 10 }, expected: { prime: 29, index: 10 } },
      { input: { n: 1 }, expected: { prime: 2 } },
      { input: { n: 100 }, expected: { prime: 541 } },
    ],
    compute({ n }) {
      if (!Number.isInteger(n) || n < 1 || n > 200000) throw new Error('n باید عدد صحیح بین ۱ و ۲۰۰۰۰۰ باشد');
      const estimate = n < 6 ? 15 : Math.ceil(n * (Math.log(n) + Math.log(Math.log(n)))) + 10;
      const sieve = new Uint8Array(estimate + 1);
      const primes = [];
      for (let i = 2; i <= estimate; i += 1) {
        if (sieve[i]) continue;
        primes.push(i);
        if (primes.length === n) break;
        for (let j = i * i; j <= estimate; j += i) sieve[j] = 1;
      }
      const prime = primes[n - 1];
      return out(
        { prime, index: n, twin_partner: prime + 2, density: round(1 / Math.log(prime), 6) },
        [
          `n = ${n} ⟹ عدد اول ${prime}`,
          `تخمین p_n ≈ n·ln(n) = ${round(n * Math.log(n), 2)}`,
          `چگالی اعداد اول نزدیک آن ≈ 1/ln(p) = ${round(1 / Math.log(prime), 4)}`,
        ],
      );
    },
  }),

  make({
    id: 'prime_counting',
    name_fa: 'شمارش اعداد اول π(x)',
    name_en: 'Prime Counting Function',
    category_path: ['ریاضیات', 'حساب و نظریه اعداد'],
    tags: ['اول', 'π(x)', 'prime'],
    description_fa: 'شمارش اعداد اول کوچک‌تر یا مساوی x و مقایسه با تقریب x/ln(x).',
    formula_latex: '\\pi(x)=\\#\\{p\\le x : p \\text{ prime}\\}',
    variables: [N('x', 'حد بالا x', 'Upper bound', null, 1000, { min: 2, max: 2000000 })],
    outputs: [O('count', 'تعداد اعداد اول', null), O('largest_prime', 'بزرگ‌ترین عدد اول', null), O('estimate', 'تقریب x/ln x', null)],
    tests: [
      { input: { x: 100 }, expected: { count: 25 } },
      { input: { x: 1000 }, expected: { count: 168, largest_prime: 997 } },
    ],
    compute({ x }) {
      if (!Number.isInteger(x) || x < 2 || x > 2000000) throw new Error('x باید عدد صحیح بین ۲ و ۲٬۰۰۰٬۰۰۰ باشد');
      const sieve = new Uint8Array(x + 1);
      let count = 0;
      let largest = 2;
      for (let i = 2; i <= x; i += 1) {
        if (sieve[i]) continue;
        count += 1;
        largest = i;
        for (let j = i * i; j <= x; j += i) sieve[j] = 1;
      }
      const estimate = x / Math.log(x);
      return out(
        { count, largest_prime: largest, estimate: round(estimate, 2), error_percent: round(((count - estimate) / count) * 100, 3) },
        [
          `غربال اراتوستن تا ${x}`,
          `π(${x}) = ${count} ، بزرگ‌ترین عدد اول = ${largest}`,
          `تقریب x/ln x = ${round(estimate, 2)} (خطا ≈ ${round(((count - estimate) / count) * 100, 2)}٪)`,
        ],
      );
    },
  }),

  make({
    id: 'divisor_sigma',
    name_fa: 'مجموع مقسوم‌علیه‌ها σ(n)',
    name_en: 'Divisor Sum σ(n)',
    category_path: ['ریاضیات', 'حساب و نظریه اعداد'],
    tags: ['مقسوم‌علیه', 'کامل', 'divisor'],
    description_fa: 'شمارش و مجموع مقسوم‌علیه‌ها، مجموع سره و بررسی عدد کامل بودن.',
    formula_latex: '\\sigma(n)=\\sum_{d\\mid n}d,\\qquad s(n)=\\sigma(n)-n',
    variables: [N('n', 'عدد طبیعی n', 'Integer n', null, 28, { min: 1, max: 100000000 })],
    outputs: [O('sum', 'مجموع مقسوم‌علیه‌ها σ', null), O('count', 'تعداد مقسوم‌علیه‌ها τ', null), O('aliquot', 'مجموع سره s', null), O('is_perfect', 'عدد کامل؟', null)],
    tests: [
      { input: { n: 28 }, expected: { sum: 56, count: 6, aliquot: 28, is_perfect: true } },
      { input: { n: 12 }, expected: { sum: 28, count: 6, is_perfect: false } },
    ],
    compute({ n }) {
      if (!Number.isInteger(n) || n < 1 || n > 1e8) throw new Error('n باید عدد صحیح بین ۱ و ۱۰۰٬۰۰۰٬۰۰۰ باشد');
      let sum = 0;
      let count = 0;
      const divisors = [];
      for (let d = 1; d * d <= n; d += 1) {
        if (n % d) continue;
        divisors.push(d);
        sum += d;
        count += 1;
        if (d !== n / d) {
          divisors.push(n / d);
          sum += n / d;
          count += 1;
        }
      }
      const aliquot = sum - n;
      return out(
        { sum, count, aliquot, is_perfect: aliquot === n && n > 1 },
        [
          `مقسوم‌علیه‌ها: ${sorted(divisors).join(', ')}`,
          `σ(${n}) = ${sum} ، τ(${n}) = ${count}`,
          `s(${n}) = σ − n = ${aliquot}${aliquot === n ? ' ⟹ عدد کامل است' : ''}`,
        ],
      );
    },
  }),

  make({
    id: 'percent_application',
    name_fa: 'کاربرد درصد',
    name_en: 'Percent Applications',
    category_path: ['ریاضیات', 'حساب و نظریه اعداد'],
    tags: ['درصد', 'تخفیف', 'percent'],
    description_fa: 'درصد از یک عدد، افزایش و کاهش درصدی و مقدار اصلی پیش از تغییر.',
    formula_latex: 'p\\%\\;\\text{of}\\;x=\\frac{p}{100}x',
    variables: [N('value', 'مقدار پایه', 'Base value', null, 250), N('percent', 'درصد', 'Percent', '%', 18)],
    outputs: [O('percent_of', 'درصد از مقدار', null), O('increased', 'پس از افزایش', null), O('decreased', 'پس از کاهش', null)],
    tests: [
      { input: { value: 250, percent: 18 }, expected: { percent_of: 45, increased: 295, decreased: 205 } },
      { input: { value: 80, percent: 25 }, expected: { percent_of: 20, increased: 100 } },
    ],
    compute({ value, percent }) {
      if (!Number.isFinite(value) || !Number.isFinite(percent)) throw new Error('مقادیر باید عدد باشند');
      const part = (value * percent) / 100;
      return out(
        { percent_of: round(part), increased: round(value + part), decreased: round(value - part) },
        [`${percent}٪ از ${value} = ${round(part)}`, `افزایش: ${value} + ${round(part)} = ${round(value + part)}`, `کاهش: ${round(value - part)}`],
      );
    },
  }),

  make({
    id: 'set_operations',
    name_fa: 'عملیات مجموعه‌ها',
    name_en: 'Set Operations',
    category_path: ['ریاضیات', 'حساب و نظریه اعداد'],
    tags: ['مجموعه', 'اجتماع', 'اشتراک'],
    description_fa: 'اجتماع، اشتراک، تفاضل متقارن و زیرمجموعه بودن دو مجموعه.',
    formula_latex: 'A\\cup B,\\;A\\cap B,\\;A\\setminus B,\\;A\\triangle B',
    variables: [T('a', 'مجموعه A (با کاما)', 'Set A', '1,2,3,4'), T('b', 'مجموعه B (با کاما)', 'Set B', '3,4,5')],
    outputs: [O('union', 'اجتماع', null), O('intersection', 'اشتراک', null), O('difference', 'تفاضل A−B', null), O('union_count', 'تعداد اجتماع', null)],
    tests: [
      { input: { a: '1,2,3,4', b: '3,4,5' }, expected: { union_count: 5, intersection_count: 2, union: '1, 2, 3, 4, 5', subset: false } },
      { input: { a: '1,2', b: '1,2,3' }, expected: { subset: true, intersection_count: 2 } },
    ],
    compute({ a, b }) {
      const setA = [...new Set(parseList(a))];
      const setB = [...new Set(parseList(b))];
      const union = [...new Set([...setA, ...setB])].sort((x, y) => x - y);
      const intersection = setA.filter((x) => setB.includes(x)).sort((x, y) => x - y);
      const difference = setA.filter((x) => !setB.includes(x)).sort((x, y) => x - y);
      const symmetric = [...difference, ...setB.filter((x) => !setA.includes(x))].sort((x, y) => x - y);
      return out(
        {
          union: union.join(', '),
          intersection: intersection.join(', ') || '∅',
          difference: difference.join(', ') || '∅',
          symmetric_difference: symmetric.join(', ') || '∅',
          union_count: union.length,
          intersection_count: intersection.length,
          subset: setA.every((x) => setB.includes(x)),
        },
        [
          `A = {${setA.join(', ')}} ، B = {${setB.join(', ')}}`,
          `A ∪ B = {${union.join(', ')}}`,
          `A ∩ B = {${intersection.join(', ') || '∅'}} ، A − B = {${difference.join(', ') || '∅'}}`,
        ],
      );
    },
  }),

  make({
    id: 'scientific_notation',
    name_fa: 'نماد علمی',
    name_en: 'Scientific Notation',
    category_path: ['ریاضیات', 'حساب و نظریه اعداد'],
    tags: ['نماد علمی', 'توان ده', 'notation'],
    description_fa: 'تبدیل عدد به نماد علمی a×10ⁿ و بازگرداندن آن به عدد اعشاری.',
    formula_latex: 'x=a\\times10^{n},\\quad 1\\le|a|<10',
    variables: [N('x', 'عدد', 'Number', null, 0.00042)],
    outputs: [O('mantissa', 'مانتیس a', null), O('exponent', 'توان n', null), O('notation', 'نمایش علمی', null)],
    tests: [
      { input: { x: 0.00042 }, expected: { mantissa: 4.2, exponent: -4, notation: '4.2 × 10⁻⁴' } },
      { input: { x: 12345 }, expected: { mantissa: 1.2345, exponent: 4 } },
    ],
    compute({ x }) {
      if (!Number.isFinite(x) || x === 0) throw new Error('عدد باید مخالف صفر و متناهی باشد');
      const exponent = Math.floor(Math.log10(Math.abs(x)));
      const mantissa = x / 10 ** exponent;
      const superscript = String(exponent).replace('-', '⁻').replace(/[0-9]/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)]);
      return out(
        { mantissa: round(mantissa, 8), exponent, notation: `${round(mantissa, 8)} × 10${superscript}`, engineering: `${round(x / 10 ** (Math.floor(exponent / 3) * 3), 6)} × 10${String(Math.floor(exponent / 3) * 3).replace('-', '⁻').replace(/[0-9]/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)])}` },
        [`x = ${x}`, `n = ⌊log₁₀|x|⌋ = ${exponent}`, `a = x / 10ⁿ = ${round(mantissa, 8)}`, `نمایش علمی: ${round(mantissa, 8)} × 10^${exponent}`],
      );
    },
  }),

  make({
    id: 'inverse_proportion',
    name_fa: 'تناسب معکوس',
    name_en: 'Inverse Proportion',
    category_path: ['ریاضیات', 'حساب و نظریه اعداد'],
    tags: ['تناسب', 'معکوس', 'proportion'],
    description_fa: 'حل تناسب معکوس a×b = c×x و محاسبه ثابت تناسب.',
    formula_latex: 'a\\cdot b=c\\cdot x\\;\\Rightarrow\\;x=\\frac{ab}{c}',
    variables: [N('a', 'a', 'a', null, 6), N('b', 'b', 'b', null, 8), N('c', 'c', 'c', null, 4)],
    outputs: [O('x', 'مجهول x', null), O('constant', 'ثابت تناسب', null)],
    tests: [
      { input: { a: 6, b: 8, c: 4 }, expected: { x: 12, constant: 48 } },
      { input: { a: 10, b: 4, c: 5 }, expected: { x: 8 } },
    ],
    compute({ a, b, c }) {
      if (c === 0) throw new Error('c نباید صفر باشد');
      const constant = a * b;
      return out({ x: round(constant / c), constant: round(constant) }, [`ثابت تناسب a×b = ${round(constant)}`, `x = ${round(constant)} ÷ ${c} = ${round(constant / c)}`]);
    },
  }),

  // ── جبر ──────────────────────────────────────────────────────────────────
  make({
    id: 'polynomial_division',
    name_fa: 'تقسیم چندجمله‌ای (هانتینگ)',
    name_en: 'Synthetic Division',
    category_path: ['ریاضیات', 'جبر'],
    tags: ['چندجمله‌ای', 'باقیمانده', 'synthetic'],
    description_fa: 'تقسیم چندجمله‌ای بر (x−r) با روش هانتینگ و قضیه باقیمانده.',
    formula_latex: 'P(x)=(x-r)Q(x)+P(r)',
    variables: [
      T('coeffs', 'ضرایب از بالاترین توان (با کاما)', 'Coefficients (highest first)', '1,-3,2'),
      N('r', 'ریشه r', 'Divisor root r', null, 2),
    ],
    outputs: [O('quotient', 'خارج‌قسمت', null), O('remainder', 'باقیمانده', null), O('is_factor', 'فاکتور است؟', null)],
    tests: [
      { input: { coeffs: '1,-3,2', r: 2 }, expected: { quotient: '1, -1', remainder: 0, is_factor: true } },
      { input: { coeffs: '2,0,-3,1', r: -1 }, expected: { remainder: 2, is_factor: false } },
    ],
    compute({ coeffs, r }) {
      const list = parseList(coeffs);
      if (list.length < 2) throw new Error('حداقل دو ضریب لازم است');
      const quotient = [];
      let carry = list[0];
      quotient.push(carry);
      for (let i = 1; i < list.length - 1; i += 1) {
        carry = carry * r + list[i];
        quotient.push(carry);
      }
      const remainder = carry * r + list[list.length - 1];
      return out(
        {
          quotient: quotient.map((value) => round(value, 8)).join(', '),
          remainder: round(remainder, 8),
          is_factor: Math.abs(remainder) < 1e-12,
          degree: list.length - 2,
        },
        [
          `P(x) = ${list.map((c, i) => `${c}x^${list.length - 1 - i}`).join(' + ').replace(/\+ -/g, '− ')}`,
          `خارج‌قسمت: ${quotient.map((value) => round(value, 8)).join(', ')}`,
          `باقیمانده = P(${r}) = ${round(remainder, 8)}${Math.abs(remainder) < 1e-12 ? ' ⟹ (x−r) فاکتور است' : ''}`,
        ],
      );
    },
  }),

  make({
    id: 'quadratic_inequality',
    name_fa: 'نامعادله درجه دو',
    name_en: 'Quadratic Inequality',
    category_path: ['ریاضیات', 'جبر'],
    tags: ['نامعادله', 'درجه دو', 'inequality'],
    description_fa: 'حل ax²+bx+c>0 با ریشه‌ها، دلتا و بازه پاسخ.',
    formula_latex: 'ax^2+bx+c>0',
    variables: [N('a', 'ضریب a', 'a', null, 1), N('b', 'ضریب b', 'b', null, -5), N('c', 'ضریب c', 'c', null, 6)],
    outputs: [O('root1', 'ریشه کوچک‌تر', null), O('root2', 'ریشه بزرگ‌تر', null), O('discriminant', 'دلتا', null), O('solution', 'بازه پاسخ', null)],
    tests: [
      { input: { a: 1, b: -5, c: 6 }, expected: { root1: 2, root2: 3, solution: 'x < 2 یا x > 3' } },
      { input: { a: -1, b: 1, c: 6 }, expected: { solution: '-2 < x < 3' } },
    ],
    compute({ a, b, c }) {
      if (a === 0) throw new Error('a نباید صفر باشد (نامعادله درجه دو نیست)');
      const D = b * b - 4 * a * c;
      const values = { discriminant: round(D) };
      let solution;
      if (D < 0) {
        solution = a > 0 ? 'همه اعداد حقیقی (ℝ)' : 'بدون جواب';
        values.solution = solution;
        return out(values, [`Δ = ${round(D)} < 0 و a ${a > 0 ? '>' : '<'} 0 ⟹ ${solution}`]);
      }
      const r1 = (-b - Math.sqrt(D)) / (2 * a);
      const r2 = (-b + Math.sqrt(D)) / (2 * a);
      const lower = Math.min(r1, r2);
      const upper = Math.max(r1, r2);
      if (D === 0) solution = a > 0 ? `x ≠ ${round(lower)}` : 'بدون جواب';
      else if (a > 0) solution = `x < ${round(lower)} یا x > ${round(upper)}`;
      else solution = `${round(lower)} < x < ${round(upper)}`;
      values.root1 = round(lower);
      values.root2 = round(upper);
      values.solution = solution;
      return out(values, [`Δ = b² − 4ac = ${round(D)}`, `ریشه‌ها: ${round(lower)} و ${round(upper)}`, `a ${a > 0 ? '>' : '<'} 0 ⟹ بازه پاسخ: ${solution}`]);
    },
  }),

  make({
    id: 'exponential_growth_decay',
    name_fa: 'رشد و افت نمایی',
    name_en: 'Exponential Growth & Decay',
    category_path: ['ریاضیات', 'جبر'],
    tags: ['نمایی', 'رشد', 'نیمه‌عمر'],
    description_fa: 'محاسبه x(t)=x₀e^{kt} با زمان دو برابر شدن/نصف شدن و نرخ رشد.',
    formula_latex: 'x(t)=x_0e^{kt},\\quad t_{1/2}=\\frac{\\ln2}{|k|}',
    variables: [N('x0', 'مقدار اولیه x₀', 'Initial value', null, 100), N('k', 'نرخ k (1/زمان)', 'Rate k', null, 0.05), N('t', 'زمان t', 'Time t', null, 10)],
    outputs: [O('final', 'مقدار نهایی', null), O('doubling_time', 'زمان دو برابر/نصف شدن', null), O('growth_factor', 'ضریب رشد', null)],
    tests: [
      { input: { x0: 100, k: 0.05, t: 10 }, expected: { final: 164.872127, doubling_time: 13.862944 } },
      { input: { x0: 200, k: -0.1, t: 5 }, expected: { final: 121.306096 } },
    ],
    compute({ x0, k, t }) {
      if (x0 <= 0) throw new Error('مقدار اولیه باید مثبت باشد');
      const factor = Math.exp(k * t);
      return out(
        {
          final: round(x0 * factor, 8),
          growth_factor: round(factor, 8),
          doubling_time: k === 0 ? Infinity : round(Math.LN2 / Math.abs(k), 6),
          percent_change: round((factor - 1) * 100, 4),
        },
        [`x(t) = ${x0}·e^(${k}×${t}) = ${round(x0 * factor, 6)}`, `ضریب رشد = ${round(factor, 6)}`, `t½ = ln2/|k| = ${k === 0 ? '∞' : round(Math.LN2 / Math.abs(k), 4)}`],
      );
    },
  }),

  make({
    id: 'log_properties',
    name_fa: 'قواعد لگاریتم',
    name_en: 'Logarithm Laws',
    category_path: ['ریاضیات', 'جبر'],
    tags: ['لگاریتم', 'قواعد', 'log'],
    description_fa: 'محاسبه log_b(x)، log_b(y) و بررسی قواعد ضرب، تقسیم و توان لگاریتم‌ها.',
    formula_latex: '\\log_b(xy)=\\log_bx+\\log_by,\\quad \\log_b(x^n)=n\\log_bx',
    variables: [N('base', 'پایه b', 'Base b', null, 2), N('x', 'عدد x', 'x', null, 8), N('y', 'عدد y', 'y', null, 4), N('n', 'توان n', 'Power n', null, 2)],
    outputs: [O('log_x', 'log_b(x)', null), O('log_product', 'log_b(x·y)', null), O('log_power', 'log_b(xⁿ)', null)],
    tests: [
      { input: { base: 2, x: 8, y: 4, n: 2 }, expected: { log_x: 3, log_product: 5, log_quotient: 1, log_power: 6 } },
      { input: { base: 10, x: 100, y: 10, n: 3 }, expected: { log_x: 2, log_product: 3 } },
    ],
    compute({ base, x, y, n }) {
      if (base <= 0 || base === 1) throw new Error('پایه باید مثبت و مخالف ۱ باشد');
      if (x <= 0 || y <= 0) throw new Error('x و y باید مثبت باشند');
      const logX = Math.log(x) / Math.log(base);
      const logY = Math.log(y) / Math.log(base);
      return out(
        {
          log_x: round(logX, 8),
          log_y: round(logY, 8),
          log_product: round(logX + logY, 8),
          log_quotient: round(logX - logY, 8),
          log_power: round(n * logX, 8),
          check_product: round(Math.log(x * y) / Math.log(base), 8),
        },
        [
          `log_${base}(${x}) = ln(${x})/ln(${base}) = ${round(logX, 6)}`,
          `log_b(xy) = ${round(logX, 6)} + ${round(logY, 6)} = ${round(logX + logY, 6)}`,
          `log_b(xⁿ) = ${n} × ${round(logX, 6)} = ${round(n * logX, 6)}`,
        ],
      );
    },
  }),

  make({
    id: 'surds_simplify',
    name_fa: 'ساده‌سازی رادیکال',
    name_en: 'Simplify Radicals',
    category_path: ['ریاضیات', 'جبر'],
    tags: ['رادیکال', 'ساده‌سازی', 'surd'],
    description_fa: 'نوشتن √n به‌صورت a√b با بیشترین مربع کامل و مقدار تقریبی.',
    formula_latex: '\\sqrt{n}=a\\sqrt{b},\\quad a=\\max\\{k:k^2\\mid n\\}',
    variables: [N('n', 'عدد زیر رادیکال', 'Radicand', null, 72, { min: 1, max: 1000000000 })],
    outputs: [O('outside', 'ضریب بیرون a', null), O('inside', 'عدد داخل b', null), O('value', 'مقدار تقریبی', null), O('formatted', 'شکل ساده', null)],
    tests: [
      { input: { n: 72 }, expected: { outside: 6, inside: 2, formatted: '6√2' } },
      { input: { n: 50 }, expected: { outside: 5, inside: 2 } },
      { input: { n: 16 }, expected: { outside: 4, inside: 1 } },
    ],
    compute({ n }) {
      if (!Number.isInteger(n) || n < 1) throw new Error('n باید عدد صحیح مثبت باشد');
      let outside = 1;
      let inside = n;
      for (let k = 2; k * k <= inside; k += 1) {
        while (inside % (k * k) === 0) {
          inside /= k * k;
          outside *= k;
        }
      }
      const formatted = inside === 1 ? `${outside}` : `${outside}√${inside}`;
      return out(
        { outside, inside, value: round(Math.sqrt(n), 8), formatted },
        [`√${n} = √(${outside ** 2} × ${inside})`, `= ${outside}√${inside}`, `≈ ${round(Math.sqrt(n), 6)}`],
      );
    },
  }),

  make({
    id: 'binomial_expansion_term',
    name_fa: 'جمله عمومی بسط دوجمله‌ای',
    name_en: 'Binomial Term',
    category_path: ['ریاضیات', 'جبر'],
    tags: ['دوجمله‌ای', 'بسط', 'binomial'],
    description_fa: 'محاسبه جمله kام بسط (a+b)ⁿ با ضریب دوجمله‌ای.',
    formula_latex: 'T_{k}=\\binom{n}{k}a^{n-k}b^{k}',
    variables: [N('n', 'توان n', 'Power n', null, 5, { min: 0, max: 200 }), N('k', 'شماره جمله k', 'Term index k', null, 2, { min: 0 }), N('a', 'a', 'a', null, 2), N('b', 'b', 'b', null, 3)],
    outputs: [O('coefficient', 'ضریب دوجمله‌ای', null), O('term', 'مقدار جمله', null)],
    tests: [
      { input: { n: 5, k: 2, a: 2, b: 3 }, expected: { coefficient: 10, term: 720 } },
      { input: { n: 4, k: 0, a: 1, b: 2 }, expected: { coefficient: 1, term: 1 } },
    ],
    compute({ n, k, a, b }) {
      if (!Number.isInteger(n) || n < 0 || n > 200) throw new Error('n باید عدد صحیح بین ۰ و ۲۰۰ باشد');
      if (!Number.isInteger(k) || k < 0 || k > n) throw new Error('k باید عدد صحیح بین ۰ و n باشد');
      const combination = (() => {
        let value = 1;
        for (let i = 1; i <= k; i += 1) value = (value * (n - k + i)) / i;
        return Math.round(value);
      })();
      const term = combination * a ** (n - k) * b ** k;
      return out(
        { coefficient: combination, term: round(term), full_sum: round((a + b) ** n) },
        [`C(${n},${k}) = ${combination}`, `جمله ${k}: ${combination}·(${a})^${n - k}·(${b})^${k} = ${round(term)}`, `کنترل: (a+b)ⁿ = ${round((a + b) ** n)}`],
      );
    },
  }),

  make({
    id: 'absolute_inequality',
    name_fa: 'نامعادله قدر مطلق',
    name_en: 'Absolute Value Inequality',
    category_path: ['ریاضیات', 'جبر'],
    tags: ['قدر مطلق', 'نامعادله'],
    description_fa: 'حل |ax+b| ≤ k و نمایش بازه پاسخ.',
    formula_latex: '|ax+b|\\le k\\iff -k\\le ax+b\\le k',
    variables: [N('a', 'ضریب a', 'a', null, 2), N('b', 'b', 'b', null, 0), N('k', 'مقدار k', 'k', null, 6, { min: 0 })],
    outputs: [O('lower', 'کران پایین', null), O('upper', 'کران بالا', null), O('interval', 'بازه', null)],
    tests: [
      { input: { a: 2, b: 0, k: 6 }, expected: { lower: -3, upper: 3, interval: '[-3, 3]' } },
      { input: { a: 1, b: 1, k: 2 }, expected: { lower: -3, upper: 1 } },
    ],
    compute({ a, b, k }) {
      if (a === 0) throw new Error('a نباید صفر باشد');
      if (k < 0) throw new Error('k باید نامنفی باشد');
      const x1 = (-k - b) / a;
      const x2 = (k - b) / a;
      const lower = Math.min(x1, x2);
      const upper = Math.max(x1, x2);
      return out(
        { lower: round(lower), upper: round(upper), interval: `[${round(lower)}, ${round(upper)}]`, width: round(upper - lower) },
        [`|${a}x + ${b}| ≤ ${k}`, `−${k} ≤ ${a}x + ${b} ≤ ${k}`, `پاسخ: ${round(lower)} ≤ x ≤ ${round(upper)}`],
      );
    },
  }),

  // ── هندسه و مثلثات ───────────────────────────────────────────────────────
  make({
    id: 'frustum_geometry',
    name_fa: 'مخروط ناقص (فروستوم)',
    name_en: 'Frustum of a Cone',
    category_path: ['ریاضیات', 'هندسه و مثلثات'],
    tags: ['مخروط', 'حجم', 'frustum'],
    description_fa: 'حجم، سطح جانبی و سطح کل مخروط ناقص با دو شعاع و ارتفاع.',
    formula_latex: 'V=\\frac{\\pi h}{3}(R^2+Rr+r^2),\\quad A_l=\\pi(R+r)l',
    variables: [N('R', 'شعاع بزرگ R', 'Large radius', 'length', 6), N('r', 'شعاع کوچک r', 'Small radius', 'length', 3), N('h', 'ارتفاع h', 'Height', 'length', 8)],
    outputs: [O('volume', 'حجم', 'm³'), O('lateral_area', 'سطح جانبی', 'm²'), O('total_area', 'سطح کل', 'm²'), O('slant_height', 'ارتفاع مایل', 'm')],
    tests: [
      { input: { R: 6, r: 3, h: 8 }, expected: { volume: 527.787565, slant_height: 8.544004 } },
      { input: { R: 4, r: 0, h: 9 }, expected: { volume: 150.796447 } },
    ],
    compute({ R, r, h }) {
      if (R <= 0 || r < 0 || h <= 0 || r >= R) throw new Error('شروط 0 ≤ r < R و h > 0 لازم است');
      const slant = Math.sqrt((R - r) ** 2 + h ** 2);
      const volume = (Math.PI * h * (R * R + R * r + r * r)) / 3;
      const lateral = Math.PI * (R + r) * slant;
      return out(
        { volume: round(volume), lateral_area: round(lateral), total_area: round(lateral + Math.PI * (R * R + r * r)), slant_height: round(slant) },
        [`l = √((R−r)² + h²) = ${round(slant, 4)}`, `V = πh/3·(R²+Rr+r²) = ${round(volume, 4)}`, `A_جانبی = π(R+r)l = ${round(lateral, 4)}`],
      );
    },
  }),

  make({
    id: 'prism_geometry',
    name_fa: 'مکعب مستطیل',
    name_en: 'Rectangular Prism',
    category_path: ['ریاضیات', 'هندسه و مثلثات'],
    tags: ['مکعب', 'حجم', 'prism'],
    description_fa: 'حجم، سطح کل، قطر فضایی و سطح جانبی مکعب مستطیل.',
    formula_latex: 'V=lwh,\\quad S=2(lw+lh+wh),\\quad d=\\sqrt{l^2+w^2+h^2}',
    variables: [N('l', 'طول l', 'Length', 'length', 3), N('w', 'عرض w', 'Width', 'length', 4), N('h', 'ارتفاع h', 'Height', 'length', 5)],
    outputs: [O('volume', 'حجم', 'm³'), O('surface_area', 'سطح کل', 'm²'), O('diagonal', 'قطر فضایی', 'm')],
    tests: [
      { input: { l: 3, w: 4, h: 5 }, expected: { volume: 60, surface_area: 94, diagonal: 7.071068 } },
      { input: { l: 2, w: 2, h: 2 }, expected: { volume: 8, surface_area: 24 } },
    ],
    compute({ l, w, h }) {
      if (l <= 0 || w <= 0 || h <= 0) throw new Error('ابعاد باید مثبت باشند');
      return out(
        {
          volume: round(l * w * h),
          surface_area: round(2 * (l * w + l * h + w * h)),
          lateral_area: round(2 * h * (l + w)),
          diagonal: round(Math.sqrt(l * l + w * w + h * h)),
        },
        [`V = ${l}×${w}×${h} = ${round(l * w * h)}`, `S = 2(lw+lh+wh) = ${round(2 * (l * w + l * h + w * h))}`, `d = √(l²+w²+h²) = ${round(Math.sqrt(l * l + w * w + h * h), 4)}`],
      );
    },
  }),

  make({
    id: 'distance_point_line',
    name_fa: 'فاصله نقطه از خط',
    name_en: 'Distance from Point to Line',
    category_path: ['ریاضیات', 'هندسه و مثلثات'],
    tags: ['فاصله', 'خط', 'distance'],
    description_fa: 'کوتاه‌ترین فاصله نقطه تا خط Ax+By+C=0 و پای عمود.',
    formula_latex: 'd=\\frac{|Ax_0+By_0+C|}{\\sqrt{A^2+B^2}}',
    variables: [N('A', 'ضریب A', 'A', null, 3), N('B', 'ضریب B', 'B', null, 4), N('C', 'ضریب C', 'C', null, -10), N('x0', 'x₀', 'x₀', null, 0), N('y0', 'y₀', 'y₀', null, 0)],
    outputs: [O('distance', 'فاصله', null), O('foot_x', 'پای عمود x', null), O('foot_y', 'پای عمود y', null)],
    tests: [
      { input: { A: 3, B: 4, C: -10, x0: 0, y0: 0 }, expected: { distance: 2 } },
      { input: { A: 1, B: -1, C: 0, x0: 3, y0: 1 }, expected: { distance: 1.414214 } },
    ],
    compute({ A, B, C, x0, y0 }) {
      if (A === 0 && B === 0) throw new Error('A و B هم‌زمان صفر نمی‌توانند باشند');
      const denominator = A * A + B * B;
      const value = A * x0 + B * y0 + C;
      return out(
        {
          distance: round(Math.abs(value) / Math.sqrt(denominator), 8),
          foot_x: round(x0 - (A * value) / denominator, 8),
          foot_y: round(y0 - (B * value) / denominator, 8),
        },
        [`|Ax₀+By₀+C| = |${round(value)}|`, `√(A²+B²) = ${round(Math.sqrt(denominator), 6)}`, `d = ${round(Math.abs(value) / Math.sqrt(denominator), 6)}`],
      );
    },
  }),

  make({
    id: 'circle_equation',
    name_fa: 'معادله دایره',
    name_en: 'Circle Equation',
    category_path: ['ریاضیات', 'هندسه و مثلثات'],
    tags: ['دایره', 'مرکز', 'شعاع'],
    description_fa: 'یافتن مرکز و شعاع از فرم عمومی x²+y²+Dx+Ey+F=0 و نوشتن فرم استاندارد.',
    formula_latex: '\\left(x+\\frac D2\\right)^2+\\left(y+\\frac E2\\right)^2=\\frac{D^2+E^2}{4}-F',
    variables: [N('D', 'ضریب D', 'D', null, -6), N('E', 'ضریب E', 'E', null, 4), N('F', 'ضریب F', 'F', null, -12)],
    outputs: [O('center_x', 'مرکز x', null), O('center_y', 'مرکز y', null), O('radius', 'شعاع', null), O('standard_form', 'فرم استاندارد', null)],
    tests: [
      { input: { D: -6, E: 4, F: -12 }, expected: { center_x: 3, center_y: -2, radius: 5 } },
      { input: { D: 0, E: 0, F: -16 }, expected: { radius: 4, center_x: 0 } },
    ],
    compute({ D, E, F }) {
      const cx = -D / 2;
      const cy = -E / 2;
      const rSquared = cx * cx + cy * cy - F;
      if (rSquared < 0) throw new Error('این معادله هیچ دایره حقیقی نشان نمی‌دهد (r² < 0)');
      const radius = Math.sqrt(rSquared);
      return out(
        {
          center_x: round(cx, 8),
          center_y: round(cy, 8),
          radius: round(radius, 8),
          standard_form: `(x ${cx >= 0 ? '−' : '+'} ${Math.abs(round(cx, 6))})² + (y ${cy >= 0 ? '−' : '+'} ${Math.abs(round(cy, 6))})² = ${round(radius * radius, 6)}`,
          area: round(Math.PI * rSquared),
        },
        [`مرکز = (−D/2, −E/2) = (${round(cx, 4)}, ${round(cy, 4)})`, `r² = (D²+E²)/4 − F = ${round(rSquared, 6)}`, `r = ${round(radius, 6)}`],
      );
    },
  }),

  make({
    id: 'parabola_geometry',
    name_fa: 'سهمی: رأس، کانون، خط هادی',
    name_en: 'Parabola Elements',
    category_path: ['ریاضیات', 'هندسه و مثلثات'],
    tags: ['سهمی', 'کانون', 'parabola'],
    description_fa: 'محاسبه رأس، کانون، خط هادی و طول وتر کانونی سهمی y=ax²+bx+c.',
    formula_latex: 'y=ax^2+bx+c,\\quad F=\\left(-\\frac{b}{2a},\\,\\frac{1-\\Delta}{4a}\\right)',
    variables: [N('a', 'ضریب a', 'a', null, 1), N('b', 'ضریب b', 'b', null, -4), N('c', 'ضریب c', 'c', null, 1)],
    outputs: [O('vertex_x', 'رأس x', null), O('vertex_y', 'رأس y', null), O('focus_y', 'کانون y', null), O('directrix', 'خط هادی', null)],
    tests: [
      { input: { a: 1, b: -4, c: 1 }, expected: { vertex_x: 2, vertex_y: -3, focus_y: -2.75, directrix: -3.25 } },
      { input: { a: 1, b: 0, c: 0 }, expected: { vertex_x: 0, vertex_y: 0, latus_rectum: 1 } },
    ],
    compute({ a, b, c }) {
      if (a === 0) throw new Error('a نباید صفر باشد');
      const h = -b / (2 * a);
      const k = a * h * h + b * h + c;
      const p = 1 / (4 * a);
      return out(
        {
          vertex_x: round(h, 8),
          vertex_y: round(k, 8),
          focus_x: round(h, 8),
          focus_y: round(k + p, 8),
          directrix: round(k - p, 8),
          latus_rectum: round(Math.abs(1 / a), 8),
        },
        [`رأس = (−b/2a, f(−b/2a)) = (${round(h, 4)}, ${round(k, 4)})`, `p = 1/(4a) = ${round(p, 6)}`, `کانون: (${round(h, 4)}, ${round(k + p, 4)}) ، خط هادی: y = ${round(k - p, 4)}`],
      );
    },
  }),

  make({
    id: 'hyperbola_geometry',
    name_fa: 'هذلولی',
    name_en: 'Hyperbola Elements',
    category_path: ['ریاضیات', 'هندسه و مثلثات'],
    tags: ['هذلولی', 'خروج از مرکز', 'hyperbola'],
    description_fa: 'محاسبه c، خروج از مرکز، معادله خطوط مجانب و فاصله کانونی هذلولی.',
    formula_latex: '\\frac{x^2}{a^2}-\\frac{y^2}{b^2}=1,\\quad c=\\sqrt{a^2+b^2},\\;e=\\frac ca',
    variables: [N('a', 'نیم‌محور a', 'Semi-axis a', 'length', 3), N('b', 'نیم‌محور b', 'Semi-axis b', 'length', 4)],
    outputs: [O('c', 'فاصله کانونی c', null), O('eccentricity', 'خروج از مرکز', null), O('asymptote_slope', 'شیب مجانب', null)],
    tests: [
      { input: { a: 3, b: 4 }, expected: { c: 5, eccentricity: 1.666667, asymptote_slope: 1.333333 } },
      { input: { a: 5, b: 12 }, expected: { c: 13 } },
    ],
    compute({ a, b }) {
      if (a <= 0 || b <= 0) throw new Error('نیم‌محورها باید مثبت باشند');
      const c = Math.sqrt(a * a + b * b);
      return out(
        { c: round(c, 8), eccentricity: round(c / a, 8), asymptote_slope: round(b / a, 8), latus_rectum: round((2 * b * b) / a, 8) },
        [`c = √(a²+b²) = ${round(c, 6)}`, `e = c/a = ${round(c / a, 6)}`, `مجانب‌ها: y = ±${round(b / a, 6)}x`],
      );
    },
  }),

  make({
    id: 'angle_conversion',
    name_fa: 'تبدیل واحد زاویه',
    name_en: 'Angle Conversion',
    category_path: ['ریاضیات', 'هندسه و مثلثات'],
    tags: ['زاویه', 'درجه', 'رادیان'],
    description_fa: 'تبدیل هم‌زمان زاویه بین درجه، رادیان و گرادیان.',
    formula_latex: '1\\text{ rad}=\\frac{180}{\\pi}^\\circ=\\frac{200}{\\pi}^{g}',
    variables: [N('value', 'مقدار زاویه', 'Angle value', null, 180), T('unit', 'واحد ورودی (deg/rad/grad)', 'Input unit', 'deg')],
    outputs: [O('degrees', 'درجه', '°'), O('radians', 'رادیان', 'rad'), O('gradians', 'گرادیان', 'grad')],
    tests: [
      { input: { value: 180, unit: 'deg' }, expected: { degrees: 180, radians: 3.141593, gradians: 200 } },
      { input: { value: 1, unit: 'rad' }, expected: { degrees: 57.29578 } },
    ],
    compute({ value, unit }) {
      const key = String(unit).trim().toLowerCase();
      let degrees;
      if (key === 'deg' || key === 'degree' || key === '°') degrees = value;
      else if (key === 'rad' || key === 'radian') degrees = (value * 180) / Math.PI;
      else if (key === 'grad' || key === 'gon') degrees = value * 0.9;
      else throw new Error('واحد باید deg، rad یا grad باشد');
      return out(
        { degrees: round(degrees, 8), radians: round((degrees * Math.PI) / 180, 8), gradians: round(degrees / 0.9, 8) },
        [`ورودی: ${value} ${key}`, `${round(degrees, 6)}° = ${round((degrees * Math.PI) / 180, 6)} rad = ${round(degrees / 0.9, 6)} grad`],
      );
    },
  }),

  make({
    id: 'similar_triangles',
    name_fa: 'مثلث‌های متشابه',
    name_en: 'Similar Triangles',
    category_path: ['ریاضیات', 'هندسه و مثلثات'],
    tags: ['تشابه', 'مثلث', 'similar'],
    description_fa: 'محاسبه ضلع متناظر و نسبت مساحت‌ها با ضریب تشابه.',
    formula_latex: '\\frac{a\'}{a}=k,\\quad \\frac{A\'}{A}=k^2',
    variables: [N('a', 'ضلع مثلث اول', 'Side a', 'length', 3), N('a2', 'ضلع متناظر مثلث دوم', "Corresponding side a'", 'length', 6), N('b', 'ضلع دوم مثلث اول', 'Side b', 'length', 5)],
    outputs: [O('ratio', 'ضریب تشابه', null), O('b2', 'ضلع متناظر b′', null), O('area_ratio', 'نسبت مساحت', null)],
    tests: [
      { input: { a: 3, a2: 6, b: 5 }, expected: { b2: 10, ratio: 2, area_ratio: 4 } },
      { input: { a: 4, a2: 2, b: 8 }, expected: { b2: 4, ratio: 0.5 } },
    ],
    compute({ a, a2, b }) {
      if (a === 0) throw new Error('ضلع a نباید صفر باشد');
      const ratio = a2 / a;
      return out(
        { ratio: round(ratio, 8), b2: round(b * ratio, 8), area_ratio: round(ratio * ratio, 8), perimeter_ratio: round(ratio, 8) },
        [`k = a′/a = ${a2}/${a} = ${round(ratio, 6)}`, `b′ = k·b = ${round(b * ratio, 6)}`, `نسبت مساحت‌ها = k² = ${round(ratio * ratio, 6)}`],
      );
    },
  }),

  // ── حساب دیفرانسیل و انتگرال ─────────────────────────────────────────────
  make({
    id: 'simpson_integral',
    name_fa: 'انتگرال سیمپسون',
    name_en: "Simpson's Rule Integral",
    category_path: ['ریاضیات', 'حساب دیفرانسیل'],
    tags: ['انتگرال', 'سیمپسون', 'numerical'],
    description_fa: 'انتگرال عددی با قاعده سیمپسون ⅓ (دقت مرتبه چهارم).',
    formula_latex: '\\int_a^b f\\,dx\\approx\\frac{h}{3}\\left[f_0+4\\sum f_{odd}+2\\sum f_{even}+f_n\\right]',
    difficulty: 'intermediate',
    variables: [T('expr', 'تابع f(x)', 'Function f(x)', 'x^2'), N('a', 'کران پایین a', 'Lower bound', null, 0), N('b', 'کران بالا b', 'Upper bound', null, 3), N('n', 'تعداد بازه (زوج)', 'Intervals n', null, 100, { min: 2 })],
    outputs: [O('integral', 'مقدار انتگرال', null), O('h', 'گام h', null), O('exact_hint', 'بازه', null)],
    tests: [
      { input: { expr: 'x^2', a: 0, b: 3, n: 100 }, expected: { integral: 9 } },
      { input: { expr: 'sin(x)', a: 0, b: 3.141592653589793, n: 200 }, expected: { integral: 2 } },
    ],
    compute({ expr, a, b, n }) {
      const upper = typeof b === 'string' ? evaluate(String(b)) : b;
      const lower = typeof a === 'string' ? evaluate(String(a)) : a;
      if (!Number.isFinite(upper) || !Number.isFinite(lower)) throw new Error('کران‌ها معتبر نیستند');
      if (upper === lower) throw new Error('بازه انتگرال خالی است');
      let intervals = Math.max(2, Math.round(n / 2) * 2);
      if (intervals > 20000) intervals = 20000;
      const h = (upper - lower) / intervals;
      let total = 0;
      for (let i = 0; i <= intervals; i += 1) {
        const x = lower + i * h;
        const fx = evaluate(expr, { x });
        if (!Number.isFinite(fx)) throw new Error('تابع در این بازه مقدار متناهی ندارد');
        const weight = i === 0 || i === intervals ? 1 : i % 2 === 1 ? 4 : 2;
        total += weight * fx;
      }
      const integral = (h / 3) * total;
      return out(
        { integral: round(integral, 8), h: round(h, 8), intervals, f_a: round(evaluate(expr, { x: lower }), 8), f_b: round(evaluate(expr, { x: upper }), 8) },
        [`h = (b−a)/n = ${round(h, 6)}`, `Σ وزن‌دار = ${round(total, 6)}`, `I ≈ h/3 × Σ = ${round(integral, 8)}`],
      );
    },
  }),

  make({
    id: 'newton_raphson',
    name_fa: 'روش نیوتن-رافسون',
    name_en: 'Newton–Raphson Root',
    category_path: ['ریاضیات', 'حساب دیفرانسیل'],
    tags: ['ریشه', 'نیوتن', 'numerical'],
    description_fa: 'یافتن ریشه معادله f(x)=0 با تکرار نیوتن-رافسون و مشتق عددی.',
    formula_latex: 'x_{n+1}=x_n-\\frac{f(x_n)}{f\'(x_n)}',
    difficulty: 'intermediate',
    variables: [T('expr', 'تابع f(x)', 'Function f(x)', 'x^2-2'), N('x0', 'حدس اولیه x₀', 'Initial guess', null, 1)],
    outputs: [O('root', 'ریشه', null), O('iterations', 'تعداد تکرار', null), O('residual', 'خطا |f(x)|', null)],
    tests: [
      { input: { expr: 'x^2-2', x0: 1 }, expected: { root: 1.414214 } },
      { input: { expr: 'x^3-x-2', x0: 1.5 }, expected: { root: 1.52138 } },
    ],
    compute({ expr, x0 }) {
      if (!Number.isFinite(x0)) throw new Error('حدس اولیه معتبر نیست');
      let x = x0;
      let iterations = 0;
      for (; iterations < 100; iterations += 1) {
        const fx = evaluate(expr, { x });
        if (!Number.isFinite(fx)) throw new Error('تابع در این نقطه تعریف نشده است');
        if (Math.abs(fx) < 1e-12) break;
        const h = 1e-7 * Math.max(1, Math.abs(x));
        const derivative = (evaluate(expr, { x: x + h }) - evaluate(expr, { x: x - h })) / (2 * h);
        if (!Number.isFinite(derivative) || Math.abs(derivative) < 1e-14) throw new Error('مشتق نزدیک صفر است؛ حدس دیگری امتحان کنید');
        x -= fx / derivative;
      }
      const residual = Math.abs(evaluate(expr, { x }));
      if (iterations >= 100 || residual > 1e-4) throw new Error('روش همگرا نشد؛ حدس اولیه را تغییر دهید');
      return out(
        { root: round(x, 10), iterations, residual: round(residual, 12) },
        [`f(x) = ${expr} ، x₀ = ${x0}`, `تکرارها: ${iterations}`, `ریشه ≈ ${round(x, 10)} (|f| = ${residual.toExponential(2)})`],
      );
    },
  }),

  make({
    id: 'bisection_root',
    name_fa: 'روش دوبخشی',
    name_en: 'Bisection Root',
    category_path: ['ریاضیات', 'حساب دیفرانسیل'],
    tags: ['ریشه', 'دوبخشی', 'numerical'],
    description_fa: 'یافتن ریشه در بازه [a,b] با تضمین همگرایی روش دوبخشی.',
    formula_latex: 'c=\\frac{a+b}{2},\\quad f(a)f(c)<0\\Rightarrow b\\leftarrow c',
    difficulty: 'intermediate',
    variables: [T('expr', 'تابع f(x)', 'Function f(x)', 'x^3-x-2'), N('a', 'کران پایین a', 'Lower bound', null, 1), N('b', 'کران بالا b', 'Upper bound', null, 2)],
    outputs: [O('root', 'ریشه', null), O('iterations', 'تعداد تکرار', null), O('tolerance', 'دقت نهایی', null)],
    tests: [
      { input: { expr: 'x^2-2', a: 0, b: 2 }, expected: { root: 1.414214 } },
      { input: { expr: 'cos(x)-x', a: 0, b: 1 }, expected: { root: 0.739085 } },
    ],
    compute({ expr, a, b }) {
      let low = Math.min(a, b);
      let high = Math.max(a, b);
      if (low === high) throw new Error('بازه باید غیر صفر باشد');
      let fLow = evaluate(expr, { x: low });
      let fHigh = evaluate(expr, { x: high });
      if (fLow * fHigh > 0) throw new Error('در این بازه تغییر علامت وجود ندارد (f(a)·f(b) > 0)');
      let middle = low;
      let iterations = 0;
      for (; iterations < 200; iterations += 1) {
        middle = (low + high) / 2;
        const fMiddle = evaluate(expr, { x: middle });
        if (Math.abs(fMiddle) < 1e-12 || (high - low) / 2 < 1e-12) break;
        if (fLow * fMiddle < 0) {
          high = middle;
          fHigh = fMiddle;
        } else {
          low = middle;
          fLow = fMiddle;
        }
      }
      void fHigh;
      return out(
        { root: round(middle, 10), iterations, tolerance: round((high - low) / 2, 12) },
        [`بازه اولیه: [${a}, ${b}]`, `تعداد تکرار: ${iterations}`, `ریشه ≈ ${round(middle, 10)}`],
      );
    },
  }),

  make({
    id: 'cubic_analysis',
    name_fa: 'تحلیل تابع درجه سه',
    name_en: 'Cubic Function Analysis',
    category_path: ['ریاضیات', 'حساب دیفرانسیل'],
    tags: ['درجه سه', 'مشتق', 'اکسترمم'],
    description_fa: 'نقاط بحرانی، مقدار اکسترمم‌ها، نقطه عطف و تقعر تابع درجه سه.',
    formula_latex: 'f\'(x)=3ax^2+2bx+c=0',
    difficulty: 'intermediate',
    variables: [N('a', 'ضریب a', 'a', null, 1), N('b', 'ضریب b', 'b', null, -3), N('c', 'ضریب c', 'c', null, 0), N('d', 'ضریب d', 'd', null, 0)],
    outputs: [O('critical_1', 'نقطه بحرانی اول', null), O('critical_2', 'نقطه بحرانی دوم', null), O('local_max', 'مقدار ماکسیمم محلی', null), O('local_min', 'مقدار مینیمم محلی', null), O('inflection_x', 'نقطه عطف', null), O('discriminant', 'دلتای مشتق', null), O('note', 'یادداشت', null)],
    tests: [
      { input: { a: 1, b: -3, c: 0, d: 0 }, expected: { critical_1: 0, critical_2: 2, inflection_x: 1, local_max: 0, local_min: -4 } },
      { input: { a: 1, b: 0, c: -3, d: 1 }, expected: { inflection_x: 0 } },
    ],
    compute({ a, b, c, d }) {
      if (a === 0) throw new Error('a نباید صفر باشد (تابع درجه سه نیست)');
      const f = (x) => ((a * x + b) * x + c) * x + d;
      const discriminant = 4 * b * b - 12 * a * c;
      const values = { inflection_x: round(-b / (3 * a), 8), discriminant: round(discriminant, 8) };
      if (discriminant <= 0) {
        values.note = discriminant === 0 ? 'یک نقطه بحرانی تکراری' : 'بدون نقطه بحرانی حقیقی (تابع یکنوا)';
        return out(values, [`f′(x) = 3ax²+2bx+c ، Δ′ = ${round(discriminant)}`, values.note, `نقطه عطف: x = −b/3a = ${round(-b / (3 * a), 6)}`]);
      }
      const root = Math.sqrt(discriminant);
      const x1 = (-2 * b - root) / (6 * a);
      const x2 = (-2 * b + root) / (6 * a);
      const left = Math.min(x1, x2);
      const right = Math.max(x1, x2);
      // For a > 0 the left stationary point is a maximum; for a < 0 it is a minimum.
      values.critical_1 = round(left, 8);
      values.critical_2 = round(right, 8);
      values.local_max = round(f(a > 0 ? left : right), 8);
      values.local_min = round(f(a > 0 ? right : left), 8);
      return out(values, [
        `f′(x) = 3ax²+2bx+c ⟹ ریشه‌ها: ${round(left, 4)} و ${round(right, 4)}`,
        `اکسترمم‌ها: ماکسیمم ${values.local_max} ، مینیمم ${values.local_min}`,
        `نقطه عطف: x = ${round(-b / (3 * a), 4)}`,
      ]);
    },
  }),

  make({
    id: 'definite_integral_poly',
    name_fa: 'انتگرال معین چندجمله‌ای',
    name_en: 'Definite Polynomial Integral',
    category_path: ['ریاضیات', 'حساب دیفرانسیل'],
    tags: ['انتگرال', 'چندجمله‌ای', 'integral'],
    description_fa: 'انتگرال دقیق چندجمله‌ای با قاعده توان و محاسبه مساحت زیر نمودار.',
    formula_latex: '\\int_a^b\\sum c_kx^k\\,dx=\\sum\\frac{c_k}{k+1}(b^{k+1}-a^{k+1})',
    variables: [T('coeffs', 'ضرایب از بالاترین توان (با کاما)', 'Coefficients (highest first)', '1,0,0'), N('a', 'کران پایین a', 'Lower bound', null, 0), N('b', 'کران بالا b', 'Upper bound', null, 3)],
    outputs: [O('integral', 'مقدار انتگرال', null), O('antiderivative_at_b', 'F(b)', null), O('antiderivative_at_a', 'F(a)', null), O('average_value', 'مقدار میانگین', null)],
    tests: [
      { input: { coeffs: '1,0,0', a: 0, b: 3 }, expected: { integral: 9, average_value: 3 } },
      { input: { coeffs: '2,0', a: 0, b: 2 }, expected: { integral: 4 } },
    ],
    compute({ coeffs, a, b }) {
      const list = parseList(coeffs);
      const degree = list.length - 1;
      const anti = (x) => list.reduce((sum, coefficient, index) => sum + (coefficient * x ** (degree - index + 1)) / (degree - index + 1), 0);
      const integral = anti(b) - anti(a);
      return out(
        { integral: round(integral, 8), antiderivative_at_b: round(anti(b), 8), antiderivative_at_a: round(anti(a), 8), average_value: b === a ? 0 : round(integral / (b - a), 8) },
        [`F(x) با قاعده توان ساخته شد`, `F(b) − F(a) = ${round(integral, 6)}`, `مقدار میانگین = ${b === a ? 'تعریف‌نشده' : round(integral / (b - a), 6)}`],
      );
    },
  }),

  // ── آمار و احتمال ────────────────────────────────────────────────────────
  make({
    id: 'percentile_quartile',
    name_fa: 'چارک‌ها و صدک‌ها',
    name_en: 'Quartiles & Percentiles',
    category_path: ['ریاضیات', 'آمار و احتمال'],
    tags: ['چارک', 'IQR', 'percentile'],
    description_fa: 'چارک اول/سوم، دامنه بین‌چارکی، پرچین‌های داده پرت و تعداد داده پرت.',
    formula_latex: 'IQR=Q_3-Q_1,\\quad [Q_1-1.5IQR,\\;Q_3+1.5IQR]',
    variables: [T('data', 'داده‌ها (با کاما)', 'Data (comma separated)', '3,7,8,5,12,14,21,13,18'), N('percentile', 'صدک دلخواه', 'Percentile', '%', 90, { min: 0, max: 100 })],
    outputs: [O('q1', 'چارک اول Q₁', null), O('median', 'میانه Q₂', null), O('q3', 'چارک سوم Q₃', null), O('iqr', 'دامنه بین‌چارکی', null), O('low_fence', 'پرچین پایین', null), O('high_fence', 'پرچین بالا', null), O('outlier_count', 'تعداد داده پرت', null), O('requested_percentile', 'صدک درخواستی', null)],
    tests: [
      { input: { data: '1,2,3,4,5', percentile: 90 }, expected: { q1: 2, q3: 4, iqr: 2, median: 3 } },
      { input: { data: '1,2,3,4,100', percentile: 50 }, expected: { iqr: 2, outlier_count: 1 } },
    ],
    compute({ data, percentile }) {
      const values = parseList(data);
      if (values.length < 4) throw new Error('حداقل چهار داده لازم است');
      const q1 = quantile(values, 0.25);
      const q2 = quantile(values, 0.5);
      const q3 = quantile(values, 0.75);
      const iqr = q3 - q1;
      const lowFence = q1 - 1.5 * iqr;
      const highFence = q3 + 1.5 * iqr;
      const outliers = values.filter((value) => value < lowFence || value > highFence);
      return out(
        {
          q1: round(q1, 8),
          median: round(q2, 8),
          q3: round(q3, 8),
          iqr: round(iqr, 8),
          low_fence: round(lowFence, 8),
          high_fence: round(highFence, 8),
          outlier_count: outliers.length,
          requested_percentile: round(quantile(values, percentile / 100), 8),
        },
        [`Q₁ = ${round(q1, 4)} ، Q₂ = ${round(q2, 4)} ، Q₃ = ${round(q3, 4)}`, `IQR = ${round(iqr, 4)} ⟹ پرچین‌ها: [${round(lowFence, 4)}, ${round(highFence, 4)}]`, `داده‌های پرت: ${outliers.length ? outliers.join(', ') : 'ندارد'}`],
      );
    },
  }),

  make({
    id: 'skewness_kurtosis',
    name_fa: 'چولگی و کشیدگی',
    name_en: 'Skewness & Kurtosis',
    category_path: ['ریاضیات', 'آمار و احتمال'],
    tags: ['چولگی', 'کشیدگی', 'skew'],
    description_fa: 'محاسبه چولگی و کشیدگی (مازاد) داده‌ها و تفسیر شکل توزیع.',
    formula_latex: 'g_1=\\frac{m_3}{m_2^{3/2}},\\quad g_2=\\frac{m_4}{m_2^{2}}-3',
    difficulty: 'intermediate',
    variables: [T('data', 'داده‌ها (با کاما)', 'Data (comma separated)', '1,2,3,4,5')],
    outputs: [O('mean', 'میانگین', null), O('variance', 'واریانس جامعه', null), O('skewness', 'چولگی', null), O('excess_kurtosis', 'کشیدگی مازاد', null), O('shape', 'تفسیر', null)],
    tests: [
      { input: { data: '1,2,3,4,5' }, expected: { mean: 3, skewness: 0, excess_kurtosis: -1.3 } },
      { input: { data: '1,1,1,10' }, expected: { mean: 3.25 } },
    ],
    compute({ data }) {
      const values = parseList(data);
      if (values.length < 3) throw new Error('حداقل سه داده لازم است');
      const n = values.length;
      const mean = values.reduce((a, b) => a + b, 0) / n;
      const m2 = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
      const m3 = values.reduce((sum, v) => sum + (v - mean) ** 3, 0) / n;
      const m4 = values.reduce((sum, v) => sum + (v - mean) ** 4, 0) / n;
      if (m2 === 0) throw new Error('همه داده‌ها برابرند؛ چولگی تعریف‌نشده است');
      const skewness = m3 / m2 ** 1.5;
      const kurtosis = m4 / (m2 * m2) - 3;
      const shape =
        Math.abs(skewness) < 0.2
          ? 'تقریباً متقارن'
          : skewness > 0
            ? 'چوله به راست (دنباله بلند در سمت مقادیر بزرگ)'
            : 'چوله به چپ (دنباله بلند در سمت مقادیر کوچک)';
      return out(
        { mean: round(mean, 8), variance: round(m2, 8), skewness: round(skewness, 8), excess_kurtosis: round(kurtosis, 8), shape },
        [`میانگین = ${round(mean, 6)} ، واریانس جامعه = ${round(m2, 6)}`, `چولگی g₁ = ${round(skewness, 6)} ⟹ ${shape}`, `کشیدگی مازاد g₂ = ${round(kurtosis, 6)} (توزیع نرمال = 0)`],
      );
    },
  }),

  make({
    id: 'sample_size_proportion',
    name_fa: 'حجم نمونه برای نسبت',
    name_en: 'Sample Size for a Proportion',
    category_path: ['ریاضیات', 'آمار و احتمال'],
    tags: ['نمونه', 'نسبت', 'sample size'],
    description_fa: 'تعیین حجم نمونه لازم برای برآورد نسبت جامعه با حاشیه خطای مشخص.',
    formula_latex: 'n=\\left\\lceil\\frac{z^2p(1-p)}{E^2}\\right\\rceil',
    difficulty: 'intermediate',
    variables: [N('p', 'نسبت مورد انتظار p', 'Expected proportion', null, 0.5, { min: 0.01, max: 0.99 }), N('margin', 'حاشیه خطا E', 'Margin of error', null, 0.05, { min: 0.001, max: 0.5 }), N('confidence', 'سطح اطمینان (٪)', 'Confidence level', '%', 95)],
    outputs: [O('n', 'حجم نمونه لازم', null), O('z', 'مقدار z', null), O('exact', 'مقدار دقیق', null), O('conservative_n', 'نمونه محافظه‌کارانه', null)],
    tests: [
      { input: { p: 0.5, margin: 0.05, confidence: 95 }, expected: { n: 385, z: 1.96 } },
      { input: { p: 0.3, margin: 0.04, confidence: 99 }, expected: { z: 2.5758 } },
    ],
    compute({ p, margin, confidence }) {
      if (p <= 0 || p >= 1) throw new Error('نسبت p باید بین ۰ و ۱ باشد');
      if (margin <= 0) throw new Error('حاشیه خطا باید مثبت باشد');
      const z = zCritical(confidence);
      const exact = (z * z * p * (1 - p)) / (margin * margin);
      return out(
        { n: Math.ceil(exact), z, exact: round(exact, 4), conservative_n: Math.ceil((z * z * 0.25) / (margin * margin)) },
        [`z برای ${confidence}٪ = ${z}`, `n = z²p(1−p)/E² = ${round(exact, 2)}`, `حجم نمونه لازم = ${Math.ceil(exact)} (بدون تخمین p: ${Math.ceil((z * z * 0.25) / (margin * margin))})`],
      );
    },
  }),

  make({
    id: 'odds_probability',
    name_fa: 'شانس و احتمال',
    name_en: 'Odds ↔ Probability',
    category_path: ['ریاضیات', 'آمار و احتمال'],
    tags: ['شانس', 'احتمال', 'odds'],
    description_fa: 'تبدیل متقابل احتمال، شانس موافق و شانس مخالف (odds ratio).',
    formula_latex: '\\text{odds}=\\frac{p}{1-p},\\quad p=\\frac{\\text{odds}}{1+\\text{odds}}',
    variables: [N('p', 'احتمال p', 'Probability p', null, 0.25, { min: 0.001, max: 0.999 })],
    outputs: [O('odds_for', 'شانس موافق', null), O('odds_against', 'شانس مخالف', null), O('percentage', 'درصد', '%'), O('logit', 'لوجیت', null)],
    tests: [
      { input: { p: 0.25 }, expected: { odds_for: 0.333333, odds_against: 3, percentage: 25 } },
      { input: { p: 0.5 }, expected: { odds_for: 1, logit: 0 } },
    ],
    compute({ p }) {
      if (p <= 0 || p >= 1) throw new Error('احتمال باید بین ۰ و ۱ (غیر از دو سر) باشد');
      return out(
        { odds_for: round(p / (1 - p), 8), odds_against: round((1 - p) / p, 8), percentage: round(p * 100, 6), logit: round(Math.log(p / (1 - p)), 8) },
        [`odds = p/(1−p) = ${round(p / (1 - p), 6)}`, `شانس مخالف = ${round((1 - p) / p, 6)}`, `logit = ln(odds) = ${round(Math.log(p / (1 - p)), 6)}`],
      );
    },
  }),

  make({
    id: 'moving_average',
    name_fa: 'میانگین متحرک',
    name_en: 'Moving Average',
    category_path: ['ریاضیات', 'آمار و احتمال'],
    tags: ['میانگین متحرک', 'روند', 'time series'],
    description_fa: 'میانگین متحرک ساده، میانگین کل سری و تغییر آخرین مقدار نسبت به میانگین.',
    formula_latex: 'SMA_t=\\frac{1}{w}\\sum_{i=0}^{w-1}x_{t-i}',
    variables: [T('data', 'سری زمانی (با کاما)', 'Series (comma separated)', '1,2,3,4,5'), N('window', 'طول پنجره', 'Window size', null, 3, { min: 1 })],
    outputs: [O('sma', 'میانگین متحرک', null), O('mean', 'میانگین کل', null), O('window', 'طول پنجره', null), O('series', 'سری', null), O('trend', 'روند', null)],
    tests: [
      { input: { data: '1,2,3,4,5', window: 3 }, expected: { sma: 4, mean: 3 } },
      { input: { data: '10,20,30,40', window: 2 }, expected: { sma: 35 } },
    ],
    compute({ data, window }) {
      const values = parseList(data);
      const size = Math.round(window);
      if (!Number.isInteger(size) || size < 1) throw new Error('طول پنجره باید عدد صحیح مثبت باشد');
      if (size > values.length) throw new Error('طول پنجره از تعداد داده‌ها بیشتر است');
      const slice = values.slice(-size);
      const sma = slice.reduce((a, b) => a + b, 0) / size;
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const previous = values.slice(-size - 1, -1);
      const previousAverage = previous.length === size ? previous.reduce((a, b) => a + b, 0) / size : null;
      const trend = previousAverage === null ? 'نامشخص' : sma > previousAverage ? 'صعودی' : sma < previousAverage ? 'نزولی' : 'بی‌تغییر';
      return out(
        { sma: round(sma, 8), mean: round(mean, 8), window: size, series: values.map((v, i) => `${i + 1}:${v}`).join(' '), trend },
        [`پنجره آخر: ${slice.join(' + ')} ÷ ${size} = ${round(sma, 6)}`, `میانگین کل = ${round(mean, 6)}`, `روند نسبت به پنجره قبلی: ${trend}`],
      );
    },
  }),

  make({
    id: 'median_absolute_deviation',
    name_fa: 'انحراف مطلق از میانه (MAD)',
    name_en: 'Median Absolute Deviation',
    category_path: ['ریاضیات', 'آمار و احتمال'],
    tags: ['MAD', 'پراکندگی', 'robust'],
    description_fa: 'معیار پراکندگی مقاوم در برابر داده پرت: میانه فاصله‌ها از میانه.',
    formula_latex: 'MAD=\\operatorname{median}(|x_i-\\tilde{x}|)',
    variables: [T('data', 'داده‌ها (با کاما)', 'Data (comma separated)', '1,2,3,4,100')],
    outputs: [O('median', 'میانه', null), O('mad', 'MAD', null), O('scaled_mad', 'MAD نرمال‌شده', null)],
    tests: [
      { input: { data: '1,2,3,4,100' }, expected: { median: 3, mad: 1 } },
      { input: { data: '1,2,3,4,5' }, expected: { mad: 1, median: 3 } },
    ],
    compute({ data }) {
      const values = parseList(data);
      if (values.length < 3) throw new Error('حداقل سه داده لازم است');
      const median = quantile(values, 0.5);
      const deviations = values.map((value) => Math.abs(value - median));
      const mad = quantile(deviations, 0.5);
      return out(
        { median: round(median, 8), mad: round(mad, 8), scaled_mad: round(mad * 1.4826, 8) },
        [`میانه = ${round(median, 4)}`, `فاصله‌ها از میانه: ${deviations.map((d) => round(d, 4)).join(', ')}`, `MAD = میانه فاصله‌ها = ${round(mad, 4)} (نرمال‌شده: ${round(mad * 1.4826, 4)})`],
      );
    },
  }),

  // ── ریاضیات گسسته و ترکیبیات ─────────────────────────────────────────────
  make({
    id: 'boolean_logic',
    name_fa: 'عملیات منطقی (بولین)',
    name_en: 'Boolean Operations',
    category_path: ['ریاضیات', 'ریاضیات گسسته'],
    tags: ['بولین', 'منطق', 'logic'],
    description_fa: 'ارزیابی عملگرهای منطقی AND/OR/XOR/NAND/NOR/XNOR/IMPLIES با جدول ارزش.',
    formula_latex: 'A\\land B,\\;\\neg A,\\;A\\oplus B,\\;A\\Rightarrow B',
    variables: [N('a', 'مقدار A (۰ یا ۱)', 'A (0 or 1)', null, 1, { min: 0, max: 1 }), N('b', 'مقدار B (۰ یا ۱)', 'B (0 or 1)', null, 0, { min: 0, max: 1 }), T('operation', 'عملگر (and/or/xor/nand/nor/xnor/implies)', 'Operation', 'and')],
    outputs: [O('result', 'نتیجه', null), O('not_a', '¬A', null), O('not_b', '¬B', null), O('truth_table', 'جدول ارزش', null)],
    tests: [
      { input: { a: 1, b: 0, operation: 'and' }, expected: { result: false, not_a: false } },
      { input: { a: 1, b: 0, operation: 'xor' }, expected: { result: true } },
      { input: { a: 0, b: 0, operation: 'nor' }, expected: { result: true } },
    ],
    compute({ a, b, operation }) {
      const x = Boolean(Math.round(a));
      const y = Boolean(Math.round(b));
      const op = String(operation).trim().toLowerCase();
      const table = {
        and: x && y,
        or: x || y,
        xor: x !== y,
        nand: !(x && y),
        nor: !(x || y),
        xnor: x === y,
        implies: !x || y,
        '⇒': !x || y,
      };
      if (!(op in table)) throw new Error('عملگر باید and, or, xor, nand, nor, xnor یا implies باشد');
      const rows = [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ].map(([p, q]) => `${p}${q}→${table[op] ? 1 : 0}`);
      return out(
        { result: table[op], not_a: !x, not_b: !y, truth_table: rows.join('  ') },
        [`A = ${x ? 1 : 0} ، B = ${y ? 1 : 0}`, `عملگر: ${op.toUpperCase()}`, `نتیجه = ${table[op] ? 1 : 0} (TRUE/FALSE)`, `جدول ارزش برای ${op}: ${rows.join(' | ')}`],
      );
    },
  }),

  make({
    id: 'recurrence_sequence',
    name_fa: 'دنباله بازگشتی خطی',
    name_en: 'Linear Recurrence',
    category_path: ['ریاضیات', 'ریاضیات گسسته'],
    tags: ['بازگشتی', 'دنباله', 'recurrence'],
    description_fa: 'محاسبه جمله nام رابطه بازگشتی uₙ=a·uₙ₋₁+b و نقطه ثابت آن.',
    formula_latex: 'u_n=a\\,u_{n-1}+b,\\qquad u^*=\\frac{b}{1-a}',
    variables: [N('u0', 'جمله اولیه u₀', 'Initial u₀', null, 2), N('a', 'ضریب a', 'a', null, 1.5), N('b', 'جمله ثابت b', 'b', null, 1), N('n', 'شماره جمله n', 'Index n', null, 5, { min: 0, max: 10000 })],
    outputs: [O('value', 'جمله nام', null), O('fixed_point', 'نقطه ثابت', null), O('closed_form', 'فرم بسته uₙ', null), O('convergence', 'رفتار دنباله', null)],
    tests: [
      { input: { u0: 2, a: 1.5, b: 1, n: 5 }, expected: { value: 28.375, fixed_point: -2 } },
      { input: { u0: 1, a: 2, b: 0, n: 10 }, expected: { value: 1024 } },
    ],
    compute({ u0, a, b, n }) {
      if (!Number.isInteger(n) || n < 0 || n > 10000) throw new Error('n باید عدد صحیح بین ۰ و ۱۰۰۰۰ باشد');
      let value = u0;
      for (let i = 0; i < n; i += 1) value = a * value + b;
      if (!Number.isFinite(value)) throw new Error('دنباله واگرا شد');
      const fixed = a === 1 ? null : b / (1 - a);
      return out(
        {
          value: round(value, 8),
          fixed_point: fixed === null ? 'ندارد' : round(fixed, 8),
          closed_form:
            fixed === null
              ? `uₙ = u₀ + n·b = ${round(u0 + n * b, 6)}`
              : `uₙ = u* + aⁿ(u₀ − u*) = ${round(fixed + a ** n * (u0 - fixed), 6)}`,
          convergence: fixed === null ? 'حسابی (بدون نقطه ثابت)' : Math.abs(a) < 1 ? 'همگرا به نقطه ثابت' : Math.abs(a) > 1 ? 'واگرا' : 'دوره‌ای',
        },
        [`رابطه: uₙ = ${a}·uₙ₋₁ + ${b}`, `پیمایش تا n = ${n} ⟹ uₙ = ${round(value, 6)}`, fixed === null ? 'نقطه ثابت ندارد (a = 1)' : `نقطه ثابت u* = b/(1−a) = ${round(fixed, 6)}`],
      );
    },
  }),

  make({
    id: 'catalan_number',
    name_fa: 'عدد کاتالان',
    name_en: 'Catalan Number',
    category_path: ['کامپیوتر و اطلاعات', 'ترکیبیات'],
    tags: ['کاتالان', 'ترکیبیات', 'catalan'],
    description_fa: 'محاسبه عدد کاتالان Cₙ با رابطه بازگشتی دقیق (پرانتزگذاری، درخت دودویی).',
    formula_latex: 'C_n=\\frac{1}{n+1}\\binom{2n}{n}',
    variables: [N('n', 'n', 'n', null, 10, { min: 0, max: 60 })],
    outputs: [O('catalan', 'عدد کاتالان', null), O('binomial', 'C(2n,n)', null), O('interpretation', 'تفسیر', null)],
    tests: [
      { input: { n: 10 }, expected: { catalan: 16796 } },
      { input: { n: 5 }, expected: { catalan: 42 } },
    ],
    compute({ n }) {
      if (!Number.isInteger(n) || n < 0 || n > 60) throw new Error('n باید عدد صحیح بین ۰ و ۶۰ باشد');
      let result = 1;
      for (let i = 0; i < n; i += 1) result = (result * 2 * (2 * i + 1)) / (i + 2);
      const catalan = Math.round(result);
      let binomial = 1;
      for (let i = 1; i <= n; i += 1) binomial = (binomial * (n + i)) / i;
      return out(
        { catalan, binomial: Math.round(binomial), interpretation: `${catalan} ساختار پرانتزگذاری معتبر برای ${n} جفت` },
        [`Cₙ = (1/(n+1))·C(2n,n)`, `C(2×${n}, ${n}) = ${Math.round(binomial)}`, `C_${n} = ${catalan}`],
      );
    },
  }),

  make({
    id: 'derangement',
    name_fa: 'جایگشت بدون نقطه ثابت',
    name_en: 'Derangement',
    category_path: ['کامپیوتر و اطلاعات', 'ترکیبیات'],
    tags: ['جایگشت', 'درهم‌ریخت', 'derangement'],
    description_fa: 'شمارش جایگشت‌هایی که هیچ عنصری در جای خود نیست و احتمال آن.',
    formula_latex: '!n=(n-1)\\,(!(n-1)+!(n-2)),\\quad !n\\approx\\frac{n!}{e}',
    difficulty: 'intermediate',
    variables: [N('n', 'n', 'n', null, 5, { min: 2, max: 170 })],
    outputs: [O('derangements', 'تعداد درهم‌ریخت', null), O('factorial', 'n!', null), O('probability', 'احتمال', null), O('approximation', 'تقریب n!/e', null)],
    tests: [
      { input: { n: 5 }, expected: { derangements: 44, probability: 0.366667 } },
      { input: { n: 4 }, expected: { derangements: 9 } },
    ],
    compute({ n }) {
      if (!Number.isInteger(n) || n < 2 || n > 170) throw new Error('n باید عدد صحیح بین ۲ و ۱۷۰ باشد');
      let previous = 0; // !1
      let current = 1; // !2
      for (let i = 3; i <= n; i += 1) [previous, current] = [current, (i - 1) * (current + previous)];
      const derangements = n === 2 ? 1 : current;
      let factorial = 1;
      for (let i = 2; i <= n; i += 1) factorial *= i;
      return out(
        { derangements, factorial, probability: round(derangements / factorial, 8), approximation: round(factorial / Math.E, 4) },
        [`!n = (n−1)(!(n−1)+!(n−2))`, `!${n} = ${derangements}`, `احتمال = !n/n! = ${round(derangements / factorial, 6)} ≈ 1/e`],
      );
    },
  }),

  make({
    id: 'stars_and_bars',
    name_fa: 'ستاره‌ها و میله‌ها',
    name_en: 'Stars and Bars',
    category_path: ['کامپیوتر و اطلاعات', 'ترکیبیات'],
    tags: ['ترکیبیات', 'جواب صحیح', 'stars and bars'],
    description_fa: 'تعداد جواب‌های نامنفی معادله x₁+…+x_k=n و حالت مثبت.',
    formula_latex: '\\#=\\binom{n+k-1}{k-1}',
    variables: [N('n', 'مجموع n', 'Sum n', null, 10, { min: 0, max: 200 }), N('k', 'تعداد متغیر k', 'Variables k', null, 3, { min: 1, max: 60 })],
    outputs: [O('solutions', 'جواب‌های نامنفی', null), O('positive_solutions', 'جواب‌های مثبت', null)],
    tests: [
      { input: { n: 10, k: 3 }, expected: { solutions: 66, positive_solutions: 36 } },
      { input: { n: 5, k: 2 }, expected: { solutions: 6 } },
    ],
    compute({ n, k }) {
      if (!Number.isInteger(n) || n < 0) throw new Error('n باید عدد صحیح نامنفی باشد');
      if (!Number.isInteger(k) || k < 1) throw new Error('k باید عدد صحیح مثبت باشد');
      const choose = (top, bottom) => {
        if (bottom < 0 || bottom > top) return 0;
        let value = 1;
        for (let i = 1; i <= Math.min(bottom, top - bottom); i += 1) value = (value * (top - Math.min(bottom, top - bottom) + i)) / i;
        return Math.round(value);
      };
      const solutions = choose(n + k - 1, k - 1);
      const positive = n >= k ? choose(n - 1, k - 1) : 0;
      return out(
        { solutions, positive_solutions: positive },
        [`تعداد جواب‌های نامنفی = C(${n}+${k}−1, ${k}−1) = ${solutions}`, `تعداد جواب‌های مثبت = C(${n}−1, ${k}−1) = ${positive}`],
      );
    },
  }),

  // ── جبر خطی ──────────────────────────────────────────────────────────────
  make({
    id: 'matrix_inverse_3x3',
    name_fa: 'دترمینان و وارون ماتریس ۳×۳',
    name_en: '3×3 Determinant & Inverse',
    category_path: ['ریاضیات', 'جبر خطی'],
    tags: ['ماتریس', 'وارون', 'دترمینان'],
    description_fa: 'محاسبه دترمینان، وارون و اثر ماتریس ۳×۳ با روش همسازه.',
    formula_latex: 'A^{-1}=\\frac{1}{\\det A}\\operatorname{adj}(A)',
    difficulty: 'intermediate',
    variables: [N('a', 'a₁₁', 'a11', null, 1), N('b', 'a₁₂', 'a12', null, 2), N('c', 'a₁₃', 'a13', null, 3), N('d', 'a₂₁', 'a21', null, 0), N('e', 'a₂₂', 'a22', null, 1), N('f', 'a₂₃', 'a23', null, 4), N('g', 'a₃₁', 'a31', null, 5), N('h', 'a₃₂', 'a32', null, 6), N('i', 'a₃₃', 'a33', null, 0)],
    outputs: [O('determinant', 'دترمینان', null), O('inverse_11', 'وارون (۱،۱)', null), O('trace', 'اثر', null), O('inverse', 'ماتریس وارون', null), O('singular', 'منفرد است؟', null)],
    tests: [
      { input: { a: 2, b: 0, c: 0, d: 0, e: 4, f: 0, g: 0, h: 0, i: 5 }, expected: { determinant: 40, inverse_11: 0.5, trace: 11 } },
      { input: { a: 1, b: 2, c: 3, d: 0, e: 1, f: 4, g: 5, h: 6, i: 0 }, expected: { determinant: 1, inverse_11: -24 } },
    ],
    compute(v) {
      const { a, b, c, d, e, f, g, h, i } = v;
      const m = [
        [a, b, c],
        [d, e, f],
        [g, h, i],
      ];
      const det =
        a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
      const cofactor = [
        [e * i - f * h, -(d * i - f * g), d * h - e * g],
        [-(b * i - c * h), a * i - c * g, -(a * h - b * g)],
        [b * f - c * e, -(a * f - c * d), a * e - b * d],
      ];
      // Inverse = adjugate/det where adjugate is the transpose of the cofactor matrix.
      const inverse = cofactor[0].map((_, row) => cofactor.map((column) => (det === 0 ? 0 : column[row] / det)));
      const values = {
        determinant: round(det, 8),
        trace: round(a + e + i, 8),
        inverse_11: det === 0 ? 0 : round(cofactor[0][0] / det, 8),
        singular: det === 0,
      };
      if (det !== 0) values.inverse = inverse.map((row) => row.map((value) => round(value, 6)).join(', ')).join(' ; ');
      return out(values, [
        `det A = ${round(det, 6)}`,
        det === 0 ? 'دترمینان صفر است ⟹ ماتریس وارون‌پذیر نیست' : `A⁻¹ = (1/${round(det, 6)})·adj(A)`,
        `اثر ماتریس (trace) = ${round(a + e + i, 6)}`,
      ]);
    },
  }),

  make({
    id: 'vector_magnitude_3d',
    name_fa: 'اندازه و بردار یکه',
    name_en: 'Vector Magnitude & Unit Vector',
    category_path: ['ریاضیات', 'جبر خطی'],
    tags: ['بردار', 'اندازه', 'vector'],
    description_fa: 'اندازه بردار سه‌بعدی، بردار یکه و کسینوس‌های هادی آن.',
    formula_latex: '\\|v\\|=\\sqrt{x^2+y^2+z^2},\\quad \\hat v=\\frac{v}{\\|v\\|}',
    variables: [N('x', 'مؤلفه x', 'x', null, 1), N('y', 'مؤلفه y', 'y', null, 2), N('z', 'مؤلفه z', 'z', null, 2)],
    outputs: [O('magnitude', 'اندازه', null), O('unit_x', 'x یکه', null), O('unit_y', 'y یکه', null), O('unit_z', 'z یکه', null), O('alpha_deg', 'زاویه با محور x', '°'), O('beta_deg', 'زاویه با محور y', '°'), O('gamma_deg', 'زاویه با محور z', '°')],
    tests: [
      { input: { x: 1, y: 2, z: 2 }, expected: { magnitude: 3, unit_x: 0.333333, alpha_deg: 70.528779 } },
      { input: { x: 2, y: 0, z: 0 }, expected: { magnitude: 2, unit_x: 1, alpha_deg: 0 } },
    ],
    compute({ x, y, z }) {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      if (magnitude === 0) throw new Error('بردار صفر بردار یکه ندارد');
      return out(
        {
          magnitude: round(magnitude, 8),
          unit_x: round(x / magnitude, 8),
          unit_y: round(y / magnitude, 8),
          unit_z: round(z / magnitude, 8),
          alpha_deg: round((Math.acos(x / magnitude) * 180) / Math.PI, 6),
          beta_deg: round((Math.acos(y / magnitude) * 180) / Math.PI, 6),
          gamma_deg: round((Math.acos(z / magnitude) * 180) / Math.PI, 6),
        },
        [`‖v‖ = √(x²+y²+z²) = ${round(magnitude, 6)}`, `بردار یکه = (${round(x / magnitude, 4)}, ${round(y / magnitude, 4)}, ${round(z / magnitude, 4)})`, `زاویه با محور x = ${round((Math.acos(x / magnitude) * 180) / Math.PI, 3)}°`],
      );
    },
  }),

  make({
    id: 'vector_projection',
    name_fa: 'تصویر بردار',
    name_en: 'Vector Projection',
    category_path: ['ریاضیات', 'جبر خطی'],
    tags: ['بردار', 'تصویر', 'projection'],
    description_fa: 'تصویر اسکالر و برداری بردار a روی بردار b.',
    formula_latex: '\\operatorname{proj}_b a=\\frac{a\\cdot b}{\\|b\\|^2}b',
    variables: [N('a1', 'aₓ', 'aₓ', null, 3), N('a2', 'a_y', 'a_y', null, 4), N('b1', 'bₓ', 'bₓ', null, 1), N('b2', 'b_y', 'b_y', null, 0)],
    outputs: [O('scalar_projection', 'تصویر اسکالر', null), O('proj_x', 'تصویر x', null), O('proj_y', 'تصویر y', null), O('dot', 'ضرب داخلی', null), O('angle_deg', 'زاویه بین دو بردار', '°')],
    tests: [
      { input: { a1: 3, a2: 4, b1: 1, b2: 0 }, expected: { scalar_projection: 3, proj_x: 3, proj_y: 0, dot: 3 } },
      { input: { a1: 1, a2: 1, b1: 1, b2: 1 }, expected: { scalar_projection: 1.414214, proj_x: 1 } },
    ],
    compute({ a1, a2, b1, b2 }) {
      const bLength = Math.hypot(b1, b2);
      if (bLength === 0) throw new Error('بردار b نباید صفر باشد');
      const dot = a1 * b1 + a2 * b2;
      const scale = dot / (bLength * bLength);
      return out(
        { scalar_projection: round(dot / bLength, 8), proj_x: round(scale * b1, 8), proj_y: round(scale * b2, 8), dot: round(dot, 8), angle_deg: round((Math.acos(dot / (Math.hypot(a1, a2) * bLength)) * 180) / Math.PI, 6) },
        [`a·b = ${round(dot, 6)} ، ‖b‖ = ${round(bLength, 6)}`, `تصویر اسکالر = a·b/‖b‖ = ${round(dot / bLength, 6)}`, `تصویر برداری = (${round(scale * b1, 4)}, ${round(scale * b2, 4)})`],
      );
    },
  }),
];
