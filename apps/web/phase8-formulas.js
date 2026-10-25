// Phase 8 — the v4.0.0 expansion pack. For the first time every one of the 29
// catalog sections has implemented solvers: optimisation, special functions,
// signal processing, machine learning, game theory, reliability, time
// series, robotics & orbits, 3D graphics, image/audio processing, music &
// colour, numerical methods, fuzzy logic, queueing theory and navigation,
// plus three extra discrete-mathematics solvers. Every case below was
// picked so its expected values can be verified by hand.
import { make, N, T, O, round, out, parseList, normalCdf } from './formula-kit.js';

/** Lanczos log-gamma (g = 7), accurate to ~1e-12 relative for x > 0. */
const LANCZOS = [
  0.9999999999998099, 676.5203681218851, -1259.1392167224028, 771.3234287776531,
  -176.6150291621406, 12.507343278686905, -0.13857109526572012, 9.984369578019572e-6,
  1.5056327351493116e-7,
];

function logGamma(z) {
  if (!(z > 0)) throw new Error('ورودی تابع گاما باید مثبت باشد');
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  const shifted = z - 1;
  let x = LANCZOS[0];
  for (let i = 1; i < LANCZOS.length; i += 1) x += LANCZOS[i] / (shifted + i);
  const t = shifted + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (shifted + 0.5) * Math.log(t) - t + Math.log(x);
}

const factorialLoop = (n) => {
  let value = 1;
  for (let k = 2; k <= n; k += 1) value *= k;
  return value;
};

const binomialInt = (n, k) => {
  const r = Math.min(k, n - k);
  let value = 1;
  for (let i = 1; i <= r; i += 1) value = (value * (n - r + i)) / i;
  return value;
};

const meanOf = (list) => list.reduce((acc, value) => acc + value, 0) / list.length;

const deg2rad = (deg) => (deg * Math.PI) / 180;
const rad2deg = (rad) => (rad * 180) / Math.PI;
const norm360 = (deg) => ((deg % 360) + 360) % 360;

export const PHASE8_FORMULAS = [
  // ── ریاضیات · بهینه‌سازی ─────────────────────────────────────────────────
  make({
    id: 'economic_order_quantity',
    name_fa: 'مقدار سفارش اقتصادی (EOQ)',
    name_en: 'Economic Order Quantity',
    category_path: ['ریاضیات', 'بهینه‌سازی'],
    tags: ['موجودی', 'سفارش', 'EOQ', 'optimisation'],
    description_fa: 'اندازه سفارشی که مجموع هزینه سفارش‌دهی و نگهداری موجودی را کمینه می‌کند.',
    formula_latex: 'Q^{*}=\\sqrt{\\frac{2DS}{H}}',
    difficulty: 'intermediate',
    variables: [
      N('demand', 'تقاضای سالانه D (واحد)', 'Annual demand', null, 10000, { min: 1 }),
      N('order_cost', 'هزینه هر سفارش S', 'Order cost', null, 50, { min: 0 }),
      N('holding_cost', 'هزینه نگهداری سالانه هر واحد H', 'Holding cost / unit / year', null, 2, { min: 0 }),
    ],
    outputs: [O('optimal_quantity', 'مقدار سفارش بهینه Q*'), O('orders_per_year', 'سفارش در سال'), O('minimum_total_cost', 'کمینه هزینه سالانه'), O('cycle_days', 'طول چرخه سفارش (روز)')],
    tests: [
      { input: { demand: 10000, order_cost: 50, holding_cost: 2 }, expected: { optimal_quantity: 707.106781, minimum_total_cost: 1414.213562 } },
      { input: { demand: 1200, order_cost: 30, holding_cost: 3 }, expected: { optimal_quantity: 154.919334, minimum_total_cost: 464.758001 } },
    ],
    compute({ demand, order_cost, holding_cost }) {
      if (demand <= 0 || holding_cost <= 0) throw new Error('تقاضا و هزینه نگهداری باید مثبت باشند');
      const q = Math.sqrt((2 * demand * order_cost) / holding_cost);
      const orders = demand / q;
      const total = orders * order_cost + (q / 2) * holding_cost;
      return out(
        { optimal_quantity: round(q, 6), orders_per_year: round(orders, 6), minimum_total_cost: round(total, 6), cycle_days: round(365 / orders, 6) },
        [`Q* = √(2DS/H) = √(2×${demand}×${order_cost}/${holding_cost}) = ${round(q, 4)}`, `سفارش در سال = D/Q* = ${round(orders, 4)}`, `هزینه کل = (D/Q)S + (Q/2)H = ${round(total, 4)}`],
      );
    },
  }),

  make({
    id: 'gradient_descent_quadratic',
    name_fa: 'گرادیان کاهشی روی تابع درجه دو',
    name_en: 'Gradient Descent on a Quadratic',
    category_path: ['ریاضیات', 'بهینه‌سازی'],
    tags: ['بهینه‌سازی', 'گرادیان کاهشی', 'gradient descent'],
    description_fa: 'دنبال کردن گام‌های گرادیان کاهشی برای کمینه‌سازی f(x)=(x−a)² و مشاهده نرخ همگرایی.',
    formula_latex: 'x_{k+1}=x_k-\\eta\\,f\'(x_k)=x_k-2\\eta(x_k-a)',
    difficulty: 'intermediate',
    variables: [
      N('a', 'نقطه کمینه a', 'Minimum location', null, 3),
      N('x0', 'نقطه شروع x₀', 'Starting point', null, 0),
      N('learning_rate', 'نرخ یادگیری η', 'Learning rate', null, 0.1, { min: 0, max: 1 }),
      N('iterations', 'تعداد گام', 'Iterations', null, 10, { min: 1, max: 10000 }),
    ],
    outputs: [O('x_final', 'x پس از گام‌ها'), O('f_final', 'مقدار تابع در پایان'), O('distance_to_minimum', 'فاصله تا کمینه')],
    tests: [
      { input: { a: 3, x0: 0, learning_rate: 0.1, iterations: 10 }, expected: { x_final: 2.677877, distance_to_minimum: 0.322123 } },
      { input: { a: -2, x0: 5, learning_rate: 0.25, iterations: 4 }, expected: { x_final: -1.5625, f_final: 0.191406 } },
    ],
    compute({ a, x0, learning_rate, iterations }) {
      const stepsCount = Math.trunc(iterations);
      if (!(learning_rate > 0 && learning_rate < 1)) throw new Error('نرخ یادگیری باید بین ۰ و ۱ باشد تا همگرا شود');
      if (stepsCount < 1) throw new Error('حداقل یک گام لازم است');
      let x = x0;
      const trace = [`شروع از x₀ = ${x0} با هدف a = ${a}`];
      for (let k = 0; k < stepsCount; k += 1) {
        x = x - learning_rate * 2 * (x - a);
        if (k < 3 || k === stepsCount - 1) trace.push(`گام ${k + 1}: x = ${round(x, 6)}`);
      }
      return out(
        { x_final: round(x, 6), f_final: round((x - a) ** 2, 6), distance_to_minimum: round(Math.abs(x - a), 6) },
        [...trace, `در هر گام فاصله در |1−2η| = ${round(Math.abs(1 - 2 * learning_rate), 4)} ضرب می‌شود`],
      );
    },
  }),

  make({
    id: 'fractional_knapsack',
    name_fa: 'کوله‌پشتی کسری (حریصانه)',
    name_en: 'Fractional Knapsack (Greedy)',
    category_path: ['ریاضیات', 'بهینه‌سازی'],
    tags: ['کوله‌پشتی', 'حریصانه', 'knapsack'],
    description_fa: 'بیشینه ارزش قابل حمل وقتی می‌توان بخشی از هر کالا را برداشت؛ ترتیب حریصانه بر اساس نسبت ارزش به وزن بهینه است.',
    formula_latex: '\\max \\sum v_i x_i \\quad \\text{s.t.}\\quad \\sum w_i x_i \\le W',
    difficulty: 'intermediate',
    variables: [
      T('values', 'ارزش کالاها (با کاما)', 'Values', '60, 100, 120'),
      T('weights', 'وزن کالاها (با کاما)', 'Weights', '10, 20, 30'),
      N('capacity', 'ظرفیت کوله‌پشتی', 'Capacity', null, 50, { min: 0 }),
    ],
    outputs: [O('max_value', 'بیشینه ارزش'), O('used_weight', 'وزن استفاده‌شده'), O('remaining_capacity', 'ظرفیت باقی‌مانده')],
    tests: [
      { input: { values: '60, 100, 120', weights: '10, 20, 30', capacity: 50 }, expected: { max_value: 240, used_weight: 50, remaining_capacity: 0 } },
      { input: { values: '10, 20', weights: '5, 5', capacity: 5 }, expected: { max_value: 20, used_weight: 5 } },
    ],
    compute({ values, weights, capacity }) {
      const vs = parseList(values);
      const ws = parseList(weights);
      if (vs.length !== ws.length) throw new Error('تعداد ارزش‌ها و وزن‌ها باید برابر باشد');
      if (ws.some((w) => w <= 0)) throw new Error('وزن‌ها باید مثبت باشند');
      const items = vs.map((value, index) => ({ value, weight: ws[index], ratio: value / ws[index] })).sort((p, q) => q.ratio - p.ratio);
      let remaining = capacity;
      let total = 0;
      const trace = [];
      for (const item of items) {
        if (remaining <= 0) break;
        const take = Math.min(item.weight, remaining);
        total += item.ratio * take;
        remaining -= take;
        trace.push(`ارزش/وزن = ${round(item.ratio, 4)}: برداشتن ${round(take, 4)} از ${item.weight} ← +${round(item.ratio * take, 4)}`);
      }
      return out(
        { max_value: round(total, 6), used_weight: round(capacity - remaining, 6), remaining_capacity: round(remaining, 6) },
        [...trace, `ارزش کل = ${round(total, 4)}`],
      );
    },
  }),

  // ── ریاضیات · توابع خاص ──────────────────────────────────────────────────
  make({
    id: 'gamma_function',
    name_fa: 'تابع گاما',
    name_en: 'Gamma Function',
    category_path: ['ریاضیات', 'توابع خاص'],
    tags: ['گاما', 'فاکتوریل تعمیم‌یافته', 'gamma'],
    description_fa: 'تعمیم فاکتوریل به اعداد حقیقی مثبت با تقریب لانکسوز؛ برای عدد صحیح n داریم Γ(n)=(n−1)!.',
    formula_latex: '\\Gamma(z)=\\int_0^{\\infty} t^{z-1} e^{-t}\\,dt',
    difficulty: 'advanced',
    variables: [N('x', 'ورودی x (مثبت)', 'x', null, 5, { min: 0, max: 170 })],
    outputs: [O('gamma', 'Γ(x)'), O('log_gamma', 'ln Γ(x)')],
    tests: [
      { input: { x: 5 }, expected: { gamma: 24, log_gamma: 3.178054 } },
      { input: { x: 0.5 }, expected: { gamma: 1.772454, log_gamma: 0.572365 } },
    ],
    compute({ x }) {
      if (x <= 0 || x > 170) throw new Error('x باید بین ۰ و ۱۷۰ باشد');
      const lg = logGamma(x);
      return out(
        { gamma: round(Math.exp(lg), 6), log_gamma: round(lg, 6) },
        [`ln Γ(${x}) = ${round(lg, 6)} (لانکسوز)`, `Γ(${x}) = e^{${round(lg, 4)}} = ${round(Math.exp(lg), 6)}`],
      );
    },
  }),

  make({
    id: 'beta_function',
    name_fa: 'تابع بتا',
    name_en: 'Beta Function',
    category_path: ['ریاضیات', 'توابع خاص'],
    tags: ['بتا', 'beta function'],
    description_fa: 'تابع بتای اویلر از روی نسبت توابع گاما؛ پایه توزیع بتا در آمار بیزی.',
    formula_latex: 'B(a,b)=\\frac{\\Gamma(a)\\Gamma(b)}{\\Gamma(a+b)}',
    difficulty: 'advanced',
    variables: [N('a', 'پارامتر a (مثبت)', 'a', null, 2, { min: 0 }), N('b', 'پارامتر b (مثبت)', 'b', null, 3, { min: 0 })],
    outputs: [O('beta', 'B(a,b)'), O('log_beta', 'ln B(a,b)')],
    tests: [
      { input: { a: 2, b: 3 }, expected: { beta: 0.083333 } },
      { input: { a: 0.5, b: 0.5 }, expected: { beta: 3.141593 } },
    ],
    compute({ a, b }) {
      if (a <= 0 || b <= 0) throw new Error('هر دو پارامتر باید مثبت باشند');
      const lb = logGamma(a) + logGamma(b) - logGamma(a + b);
      return out(
        { beta: round(Math.exp(lb), 6), log_beta: round(lb, 6) },
        [`ln B = ln Γ(${a}) + ln Γ(${b}) − ln Γ(${a + b}) = ${round(lb, 6)}`, `B(${a}, ${b}) = ${round(Math.exp(lb), 6)}`],
      );
    },
  }),

  make({
    id: 'error_function',
    name_fa: 'تابع خطا (erf)',
    name_en: 'Error Function',
    category_path: ['ریاضیات', 'توابع خاص'],
    tags: ['تابع خطا', 'انتگرال گاوسی', 'erf'],
    description_fa: 'انتگرال گاوسی نرمال‌شده؛ احتمال قرار گرفتن متغیر نرمال در بازه متقارن حول میانگین.',
    formula_latex: '\\operatorname{erf}(x)=\\frac{2}{\\sqrt{\\pi}}\\int_0^x e^{-t^2}\\,dt',
    difficulty: 'advanced',
    variables: [N('x', 'ورودی x', 'x', null, 1)],
    outputs: [O('erf', 'erf(x)'), O('erfc', 'erfc(x) = 1−erf(x)')],
    tests: [
      { input: { x: 0 }, expected: { erf: 0, erfc: 1 } },
      { input: { x: 1 }, expected: { erf: 0.842701, erfc: 0.157299 } },
    ],
    compute({ x }) {
      const erf = x === 0 ? 0 : 2 * normalCdf(x * Math.SQRT2) - 1;
      return out(
        { erf: round(erf, 6), erfc: round(1 - erf, 6) },
        [`erf(x) = 2Φ(x√2) − 1`, `erf(${x}) = ${round(erf, 6)}`, `erfc(${x}) = ${round(1 - erf, 6)}`],
      );
    },
  }),

  make({
    id: 'bessel_j0_j1',
    name_fa: 'توابع بسل J₀ و J₁',
    name_en: 'Bessel Functions J0 & J1',
    category_path: ['ریاضیات', 'توابع خاص'],
    tags: ['بسل', 'معادله بسل', 'bessel'],
    description_fa: 'توابع بسل نوع اول از سری توانی آن‌ها؛ جواب‌های ارتعاش غشای دایروی و مسائل موج استوانه‌ای.',
    formula_latex: 'J_0(x)=\\sum_{k\\ge0}\\frac{(-1)^k}{(k!)^2}\\Big(\\frac{x}{2}\\Big)^{2k}',
    difficulty: 'advanced',
    variables: [N('x', 'ورودی x (|x| ≤ 10)', 'x', null, 1, { min: -10, max: 10 })],
    outputs: [O('j0', 'J₀(x)'), O('j1', 'J₁(x)')],
    tests: [
      { input: { x: 0 }, expected: { j0: 1, j1: 0 } },
      { input: { x: 1 }, expected: { j0: 0.765198, j1: 0.440051 } },
    ],
    compute({ x }) {
      if (Math.abs(x) > 10) throw new Error('برای دقت سری توانی، |x| باید حداکثر ۱۰ باشد');
      const q = (x * x) / 4;
      let j0 = 0;
      let j1sum = 0;
      let term0 = 1;
      let term1 = 1;
      for (let k = 0; k < 80; k += 1) {
        if (k > 0) {
          term0 *= -q / (k * k);
          term1 *= -q / (k * (k + 1));
        }
        j0 += term0;
        j1sum += term1;
        if (Math.abs(term0) < 1e-16 && Math.abs(term1) < 1e-16 && k > 4) break;
      }
      const j1 = (x / 2) * j1sum;
      return out(
        { j0: round(j0, 6), j1: round(j1, 6) },
        [`J₀(${x}) = Σ (−1)^k (x²/4)^k/(k!)² = ${round(j0, 6)}`, `J₁(${x}) = (x/2) Σ (−1)^k (x²/4)^k/(k!(k+1)!) = ${round(j1, 6)}`],
      );
    },
  }),

  // ── ریاضیات · ریاضیات گسسته ─────────────────────────────────────────────
  make({
    id: 'eulerian_number',
    name_fa: 'اعداد اویلری (شمارش فراز و فرود جایگشت)',
    name_en: 'Eulerian Numbers',
    category_path: ['ریاضیات', 'ریاضیات گسسته'],
    tags: ['اویلری', 'جایگشت', 'eulerian', 'descent'],
    description_fa: 'تعداد جایگشت‌های n عضو با دقیقاً m «فرود» (جایی که عنصر بعدی کوچک‌تر است)؛ مجموع هر ردیف برابر n! است.',
    formula_latex: 'A(n,m)=\\sum_{k=0}^{m+1}(-1)^k\\binom{n+1}{k}(m+1-k)^n',
    variables: [
      N('n', 'تعداد عضو n (۱ تا ۱۲)', 'n', null, 4, { min: 1, max: 12 }),
      N('m', 'تعداد فرود m (۰ تا n−۱)', 'Descents m', null, 1, { min: 0, max: 11 }),
    ],
    outputs: [O('eulerian', 'عدد اویلری A(n,m)'), O('row_sum', 'مجموع ردیف = n!'), O('share_percent', 'سهم از همه جایگشت‌ها (٪)')],
    tests: [
      { input: { n: 4, m: 1 }, expected: { eulerian: 11, row_sum: 24 } },
      { input: { n: 5, m: 2 }, expected: { eulerian: 66, row_sum: 120 } },
    ],
    compute({ n, m }) {
      const nn = Math.trunc(n);
      const mm = Math.trunc(m);
      if (nn < 1 || nn > 12) throw new Error('n باید صحیح بین ۱ و ۱۲ باشد');
      if (mm < 0 || mm > nn - 1) throw new Error('m باید بین ۰ و n−۱ باشد');
      let value = 0;
      for (let k = 0; k <= mm + 1; k += 1) {
        value += (-1) ** k * binomialInt(nn + 1, k) * (mm + 1 - k) ** nn;
      }
      const eulerian = Math.round(value);
      const rowSum = factorialLoop(nn);
      return out(
        { eulerian, row_sum: rowSum, share_percent: round((eulerian / rowSum) * 100, 6) },
        [`A(${nn}, ${mm}) = ${eulerian}`, `مجموع ردیف ${nn} برابر ${rowSum} = ${nn}! است`],
      );
    },
  }),

  make({
    id: 'derangements',
    name_fa: 'پریش‌ها (جایگشت بدون نقطه ثابت)',
    name_en: 'Derangements',
    category_path: ['ریاضیات', 'ریاضیات گسسته'],
    tags: ['پریش', 'جایگشت', 'derangement'],
    description_fa: 'تعداد جایگشت‌هایی که هیچ عضوی سر جای خودش نیست — مسئله کلاسیک کلاه‌ها.',
    formula_latex: '!n=n!\\sum_{k=0}^{n}\\frac{(-1)^k}{k!}',
    variables: [N('n', 'تعداد عضو n (۰ تا ۱۸)', 'n', null, 4, { min: 0, max: 18 })],
    outputs: [O('derangements', 'تعداد پریش !n'), O('probability', 'احتمال پریش تصادفی'), O('factorial_n', 'n!')],
    tests: [
      { input: { n: 4 }, expected: { derangements: 9, probability: 0.375 } },
      { input: { n: 5 }, expected: { derangements: 44, probability: 0.366667 } },
    ],
    compute({ n }) {
      const k = Math.trunc(n);
      if (k < 0 || k > 18) throw new Error('n باید صحیح بین ۰ و ۱۸ باشد');
      let d = 1;
      if (k === 1) d = 0;
      else {
        let prev2 = 1;
        let prev1 = 0;
        for (let i = 2; i <= k; i += 1) {
          d = (i - 1) * (prev1 + prev2);
          prev2 = prev1;
          prev1 = d;
        }
        if (k === 0) d = 1;
      }
      const fact = factorialLoop(k);
      return out(
        { derangements: d, probability: round(d / fact, 6), factorial_n: fact },
        [`رابطه بازگشتی: !n = (n−1)(!(n−1) + !(n−2))`, `!${k} = ${d} از مجموع ${fact} جایگشت`, `احتمال → 1/e ≈ 0.3679 وقتی n بزرگ است`],
      );
    },
  }),

  make({
    id: 'stirling_bell_numbers',
    name_fa: 'اعداد استرلینگ نوع دوم و بل',
    name_en: 'Stirling Numbers (2nd Kind) & Bell Numbers',
    category_path: ['ریاضیات', 'ریاضیات گسسته'],
    tags: ['استرلینگ', 'بل', 'افراز مجموعه', 'stirling'],
    description_fa: 'افراز یک مجموعه n عضوی به k زیرمجموعه ناتهی و تعداد کل افرازها (عدد بل).',
    formula_latex: 'S(n,k)=\\frac{1}{k!}\\sum_{j=0}^{k}(-1)^{k-j}\\binom{k}{j}j^n',
    variables: [N('n', 'اندازه مجموعه n (۰ تا ۱۵)', 'n', null, 5, { min: 0, max: 15 }), N('k', 'تعداد بلوک k', 'k', null, 2, { min: 0, max: 15 })],
    outputs: [O('stirling2', 'S(n,k)'), O('bell_number', 'عدد بل Bₙ'), O('surjections', 'تابع‌های پوشا k!·S(n,k)')],
    tests: [
      { input: { n: 5, k: 2 }, expected: { stirling2: 15, bell_number: 52, surjections: 30 } },
      { input: { n: 4, k: 3 }, expected: { stirling2: 6, bell_number: 15, surjections: 36 } },
    ],
    compute({ n, k }) {
      const nn = Math.trunc(n);
      const kk = Math.trunc(k);
      if (nn < 0 || nn > 15 || kk < 0 || kk > nn) throw new Error('باید ۰ ≤ k ≤ n ≤ ۱۵ باشد');
      const stirling = (a, b) => {
        if (b === 0) return a === 0 ? 1 : 0;
        let sum = 0;
        for (let j = 0; j <= b; j += 1) sum += (-1) ** (b - j) * binomialInt(b, j) * j ** a;
        return Math.round(sum / factorialLoop(b));
      };
      const s = stirling(nn, kk);
      let bell = 0;
      for (let b = 0; b <= nn; b += 1) bell += stirling(nn, b);
      return out(
        { stirling2: s, bell_number: bell, surjections: factorialLoop(kk) * s },
        [`S(${nn}, ${kk}) = ${s}`, `Bₙ = Σ S(n,k) = ${bell}`, `تابع پوشا از ${nn} به ${kk} عضو: ${kk}!×${s} = ${factorialLoop(kk) * s}`],
      );
    },
  }),

  // ── مهندسی · پردازش سیگنال ──────────────────────────────────────────────
  make({
    id: 'snr_decibel',
    name_fa: 'نسبت سیگنال به نویز (SNR)',
    name_en: 'Signal-to-Noise Ratio',
    category_path: ['مهندسی', 'پردازش سیگنال'],
    tags: ['نویز', 'دسی‌بل', 'SNR'],
    description_fa: 'قدرت سیگنال نسبت به نویز، به‌صورت نسبت خطی و دسی‌بل.',
    formula_latex: '\\mathrm{SNR}_{dB}=10\\log_{10}\\frac{P_s}{P_n}',
    difficulty: 'basic',
    variables: [N('signal_power', 'توان سیگنال (W)', 'Signal power', null, 100, { min: 0 }), N('noise_power', 'توان نویز (W)', 'Noise power', null, 1, { min: 0 })],
    outputs: [O('snr_db', 'SNR (dB)'), O('power_ratio', 'نسبت توان'), O('amplitude_ratio', 'نسبت دامنه')],
    tests: [
      { input: { signal_power: 100, noise_power: 1 }, expected: { snr_db: 20, power_ratio: 100, amplitude_ratio: 10 } },
      { input: { signal_power: 50, noise_power: 2 }, expected: { snr_db: 13.9794, power_ratio: 25, amplitude_ratio: 5 } },
    ],
    compute({ signal_power, noise_power }) {
      if (signal_power <= 0 || noise_power <= 0) throw new Error('هر دو توان باید مثبت باشند');
      const ratio = signal_power / noise_power;
      return out(
        { snr_db: round(10 * Math.log10(ratio), 6), power_ratio: round(ratio, 6), amplitude_ratio: round(Math.sqrt(ratio), 6) },
        [`نسبت توان = ${signal_power}/${noise_power} = ${round(ratio, 4)}`, `SNR = 10·log₁₀(${round(ratio, 4)}) = ${round(10 * Math.log10(ratio), 4)} dB`],
      );
    },
  }),

  make({
    id: 'nyquist_aliasing',
    name_fa: 'نایکوئیست و فرکانس مستعار',
    name_en: 'Nyquist Rate & Aliasing',
    category_path: ['مهندسی', 'پردازش سیگنال'],
    tags: ['نمونه‌برداری', 'نایکوئیست', 'aliasing'],
    description_fa: 'کمترین نرخ نمونه‌برداری بدون اعوجاج و فرکانسی که سیگنالِ تند، پس از نمونه‌برداری به‌اشتباه دیده می‌شود.',
    formula_latex: 'f_s \\ge 2 f_{max},\\qquad f_{alias}=\\big|f - \\mathrm{round}(f/f_s) f_s\\big|',
    difficulty: 'intermediate',
    variables: [N('signal_freq', 'فرکانس سیگنال (Hz)', 'Signal frequency', null, 700, { min: 0 }), N('sample_rate', 'نرخ نمونه‌برداری (Hz)', 'Sample rate', null, 1000, { min: 0 })],
    outputs: [O('nyquist_rate', 'نرخ نایکوئیست (Hz)'), O('nyquist_frequency', 'فرکانس نایکوئیست fs/2'), O('alias_frequency', 'فرکانس مشاهده‌شده (مستعار)')],
    tests: [
      { input: { signal_freq: 700, sample_rate: 1000 }, expected: { nyquist_rate: 1400, nyquist_frequency: 500, alias_frequency: 300 } },
      { input: { signal_freq: 200, sample_rate: 1000 }, expected: { alias_frequency: 200, nyquist_rate: 400 } },
    ],
    compute({ signal_freq, sample_rate }) {
      if (signal_freq < 0 || sample_rate <= 0) throw new Error('فرکانس سیگنال نامنفی و نرخ نمونه‌برداری مثبت باشد');
      const folded = Math.abs(signal_freq - Math.round(signal_freq / sample_rate) * sample_rate);
      return out(
        { nyquist_rate: round(2 * signal_freq, 6), nyquist_frequency: round(sample_rate / 2, 6), alias_frequency: round(folded, 6) },
        [`نرخ نایکوئیست = 2×${signal_freq} = ${2 * signal_freq} Hz`, signal_freq > sample_rate / 2 ? `چون f > fs/2 است، سیگنال در ${round(folded, 4)} Hz دیده می‌شود (تاخوردگی)` : 'سیگنال زیر فرکانس نایکوئیست است؛ مستعاری رخ نمی‌دهد'],
      );
    },
  }),

  make({
    id: 'moving_average_filter',
    name_fa: 'فیلتر میانگین متحرک',
    name_en: 'Moving-Average Filter',
    category_path: ['مهندسی', 'پردازش سیگنال'],
    tags: ['فیلتر', 'هموارسازی', 'moving average'],
    description_fa: 'ساده‌ترین فیلتر پایین‌گذر دیجیتال: هر خروجی میانگین یک پنجره از نمونه‌های اخیر است.',
    formula_latex: 'y[n]=\\frac{1}{M}\\sum_{k=0}^{M-1} x[n-k]',
    variables: [T('samples', 'نمونه‌ها (با کاما)', 'Samples', '1, 2, 3, 4, 5'), N('window', 'طول پنجره M', 'Window length', null, 3, { min: 1, max: 1000 })],
    outputs: [O('first_output', 'نخستین خروجی'), O('last_output', 'آخرین خروجی'), O('output_count', 'تعداد خروجی'), O('input_mean', 'میانگین ورودی')],
    tests: [
      { input: { samples: '1, 2, 3, 4, 5', window: 3 }, expected: { first_output: 2, last_output: 4, output_count: 3 } },
      { input: { samples: '2, 4, 6, 8', window: 2 }, expected: { first_output: 3, last_output: 7, output_count: 3 } },
    ],
    compute({ samples, window }) {
      const xs = parseList(samples);
      const m = Math.trunc(window);
      if (m < 1 || m > xs.length) throw new Error('طول پنجره باید بین ۱ و تعداد نمونه‌ها باشد');
      const ys = [];
      for (let i = 0; i + m <= xs.length; i += 1) ys.push(meanOf(xs.slice(i, i + m)));
      return out(
        { first_output: round(ys[0], 6), last_output: round(ys[ys.length - 1], 6), output_count: ys.length, input_mean: round(meanOf(xs), 6) },
        [`خروجی‌ها: ${ys.map((y) => round(y, 4)).join('، ')}`, `هر خروجی میانگین ${m} نمونه متوالی است`],
      );
    },
  }),

  make({
    id: 'dft_dominant_frequency',
    name_fa: 'فرکانس غالب با DFT',
    name_en: 'Dominant Frequency via DFT',
    category_path: ['مهندسی', 'پردازش سیگنال'],
    tags: ['فوریه', 'طیف', 'DFT', 'FFT'],
    description_fa: 'تبدیل فوریه گسسته سیگنال و یافتن مؤلفه فرکانسی با بیشترین دامنه.',
    formula_latex: 'X[k]=\\sum_{n=0}^{N-1} x[n] e^{-i 2\\pi k n / N}',
    difficulty: 'advanced',
    variables: [T('samples', 'نمونه‌ها (با کاما، حداکثر ۲۵۶)', 'Samples', '0, 1, 0, -1'), N('sample_rate', 'نرخ نمونه‌برداری (Hz)', 'Sample rate', null, 4, { min: 0 })],
    outputs: [O('dominant_freq_hz', 'فرکانس غالب (Hz)'), O('dominant_magnitude', 'بزرگی |X[k]|'), O('dc_mean', 'میانگین (مؤلفه DC)'), O('bin_resolution_hz', 'تفکیک فرکانسی (Hz)')],
    tests: [
      { input: { samples: '0, 1, 0, -1', sample_rate: 4 }, expected: { dominant_freq_hz: 1, dominant_magnitude: 2, dc_mean: 0 } },
      { input: { samples: '2, 2, 2, 2', sample_rate: 8 }, expected: { dominant_freq_hz: 0, dominant_magnitude: 8, dc_mean: 2 } },
    ],
    compute({ samples, sample_rate }) {
      const xs = parseList(samples);
      if (xs.length < 2 || xs.length > 256) throw new Error('بین ۲ تا ۲۵۶ نمونه وارد کنید');
      if (sample_rate <= 0) throw new Error('نرخ نمونه‌برداری باید مثبت باشد');
      const n = xs.length;
      let bestK = 0;
      let bestMag = -1;
      for (let k = 0; k <= Math.floor(n / 2); k += 1) {
        let re = 0;
        let im = 0;
        for (let t = 0; t < n; t += 1) {
          const angle = (-2 * Math.PI * k * t) / n;
          re += xs[t] * Math.cos(angle);
          im += xs[t] * Math.sin(angle);
        }
        const mag = Math.hypot(re, im);
        if (mag > bestMag) {
          bestMag = mag;
          bestK = k;
        }
      }
      return out(
        { dominant_freq_hz: round((bestK * sample_rate) / n, 6), dominant_magnitude: round(bestMag, 6), dc_mean: round(meanOf(xs), 6), bin_resolution_hz: round(sample_rate / n, 6) },
        [`بیشترین |X[k]| در k=${bestK} با بزرگی ${round(bestMag, 4)}`, `فرکانس = k·fs/N = ${round((bestK * sample_rate) / n, 4)} Hz`],
      );
    },
  }),

  // ── کامپیوتر · یادگیری ماشین ────────────────────────────────────────────
  make({
    id: 'logistic_sigmoid_loss',
    name_fa: 'سیگموئید و زیان لگاریتمی',
    name_en: 'Sigmoid & Log-Loss',
    category_path: ['کامپیوتر و اطلاعات', 'یادگیری ماشین'],
    tags: ['رگرسیون لجستیک', 'طبقه‌بندی', 'sigmoid'],
    description_fa: 'تبدیل امتیاز خام به احتمال با سیگموئید و سنجش خطای پیش‌بینی با زیان لگاریتمی.',
    formula_latex: '\\sigma(z)=\\frac{1}{1+e^{-z}},\\quad \\ell=-[y\\ln p + (1-y)\\ln(1-p)]',
    variables: [N('z', 'امتیاز خام z (لوجیت)', 'Logit', null, 0), N('label', 'برچسب واقعی y (۰ یا ۱)', 'True label', null, 1, { min: 0, max: 1 })],
    outputs: [O('probability', 'احتمال p'), O('log_loss', 'زیان لگاریتمی'), O('predicted_class', 'کلاس پیش‌بینی‌شده'), O('odds', 'نسبت شانس p/(1−p)')],
    tests: [
      { input: { z: 0, label: 1 }, expected: { probability: 0.5, log_loss: 0.693147, predicted_class: 1, odds: 1 } },
      { input: { z: 2, label: 1 }, expected: { probability: 0.880797, log_loss: 0.126928, odds: 7.389056 } },
    ],
    compute({ z, label }) {
      const y = Math.round(label);
      if (y !== 0 && y !== 1) throw new Error('برچسب باید ۰ یا ۱ باشد');
      const p = 1 / (1 + Math.exp(-z));
      const loss = -(y * Math.log(p) + (1 - y) * Math.log(1 - p));
      return out(
        { probability: round(p, 6), log_loss: round(loss, 6), predicted_class: p >= 0.5 ? 1 : 0, odds: round(Math.exp(z), 6) },
        [`p = 1/(1+e^−z) = ${round(p, 6)}`, `زیان برای y=${y}: ${round(loss, 6)}`],
      );
    },
  }),

  make({
    id: 'confusion_matrix_metrics',
    name_fa: 'معیارهای ماتریس درهم‌ریختگی',
    name_en: 'Confusion-Matrix Metrics',
    category_path: ['کامپیوتر و اطلاعات', 'یادگیری ماشین'],
    tags: ['دقت', 'بازخوانی', 'accuracy', 'F1'],
    description_fa: 'صحت، دقت، بازخوانی، ویژگی و امتیاز F1 از چهار خانه ماتریس درهم‌ریختگی.',
    formula_latex: 'F_1=\\frac{2TP}{2TP+FP+FN}',
    variables: [
      N('tp', 'مثبت درست TP', 'True positives', null, 40, { min: 0 }),
      N('fp', 'مثبت نادرست FP', 'False positives', null, 10, { min: 0 }),
      N('tn', 'منفی درست TN', 'True negatives', null, 45, { min: 0 }),
      N('fn', 'منفی نادرست FN', 'False negatives', null, 5, { min: 0 }),
    ],
    outputs: [O('accuracy', 'صحت'), O('precision', 'دقت'), O('recall', 'بازخوانی'), O('specificity', 'ویژگی'), O('f1_score', 'امتیاز F1')],
    tests: [
      { input: { tp: 40, fp: 10, tn: 45, fn: 5 }, expected: { accuracy: 0.85, precision: 0.8, recall: 0.888889, f1_score: 0.842105, specificity: 0.818182 } },
      { input: { tp: 10, fp: 0, tn: 10, fn: 0 }, expected: { accuracy: 1, precision: 1, recall: 1, f1_score: 1 } },
    ],
    compute({ tp, fp, tn, fn }) {
      const total = tp + fp + tn + fn;
      if (total <= 0) throw new Error('حداقل یک نمونه لازم است');
      const safe = (num, den) => (den === 0 ? 0 : num / den);
      const precision = safe(tp, tp + fp);
      const recall = safe(tp, tp + fn);
      const f1 = safe(2 * precision * recall, precision + recall);
      return out(
        { accuracy: round((tp + tn) / total, 6), precision: round(precision, 6), recall: round(recall, 6), specificity: round(safe(tn, tn + fp), 6), f1_score: round(f1, 6) },
        [`صحت = (${tp}+${tn})/${total} = ${round((tp + tn) / total, 4)}`, `F1 = 2TP/(2TP+FP+FN) = ${round(f1, 4)}`],
      );
    },
  }),

  make({
    id: 'softmax_cross_entropy',
    name_fa: 'سافتمکس و آنتروپی متقاطع',
    name_en: 'Softmax & Cross-Entropy',
    category_path: ['کامپیوتر و اطلاعات', 'یادگیری ماشین'],
    tags: ['شبکه عصبی', 'طبقه‌بندی چندکلاسه', 'softmax'],
    description_fa: 'تبدیل امتیاز کلاس‌ها به توزیع احتمال و زیان آنتروپی متقاطع برای برچسب درست.',
    formula_latex: 'p_i=\\frac{e^{z_i}}{\\sum_j e^{z_j}},\\quad \\ell=-\\ln p_y',
    difficulty: 'intermediate',
    variables: [T('logits', 'امتیاز کلاس‌ها (با کاما)', 'Logits', '2, 1, 0.1'), N('label_index', 'اندیس کلاس درست (از ۰)', 'True class index', null, 0, { min: 0, max: 1000 })],
    outputs: [O('label_probability', 'احتمال کلاس درست'), O('cross_entropy', 'زیان آنتروپی متقاطع'), O('predicted_index', 'اندیس پیش‌بینی‌شده'), O('max_probability', 'بیشترین احتمال')],
    tests: [
      { input: { logits: '2, 1, 0.1', label_index: 0 }, expected: { predicted_index: 0 } },
      { input: { logits: '0, 0, 0', label_index: 2 }, expected: { label_probability: 0.333333, cross_entropy: 1.098612 } },
    ],
    compute({ logits, label_index }) {
      const zs = parseList(logits);
      const y = Math.trunc(label_index);
      if (y < 0 || y >= zs.length) throw new Error('اندیس کلاس درست خارج از بازه امتیازها است');
      const maxZ = Math.max(...zs);
      const exps = zs.map((z) => Math.exp(z - maxZ));
      const sum = exps.reduce((acc, value) => acc + value, 0);
      const probs = exps.map((value) => value / sum);
      const predicted = probs.indexOf(Math.max(...probs));
      return out(
        { label_probability: round(probs[y], 6), cross_entropy: round(-Math.log(probs[y]), 6), predicted_index: predicted, max_probability: round(probs[predicted], 6) },
        [`احتمال‌ها: ${probs.map((p) => round(p, 4)).join('، ')}`, `زیان = −ln(p_${y}) = ${round(-Math.log(probs[y]), 4)}`],
      );
    },
  }),

  make({
    id: 'cosine_similarity_vectors',
    name_fa: 'شباهت کسینوسی بردارها',
    name_en: 'Cosine Similarity of Vectors',
    category_path: ['کامپیوتر و اطلاعات', 'یادگیری ماشین'],
    tags: ['بردار', 'شباهت', 'cosine similarity', 'embedding'],
    description_fa: 'زاویه بین دو بردار ویژگی؛ معیار استاندارد شباهت در جستجوی معنایی و سامانه‌های توصیه‌گر.',
    formula_latex: '\\cos\\theta=\\frac{a\\cdot b}{\\lVert a\\rVert\\,\\lVert b\\rVert}',
    variables: [T('vector_a', 'بردار اول (با کاما)', 'Vector A', '1, 0'), T('vector_b', 'بردار دوم (با کاما)', 'Vector B', '0, 1')],
    outputs: [O('cosine_similarity', 'شباهت کسینوسی'), O('dot_product', 'ضرب داخلی'), O('euclidean_distance', 'فاصله اقلیدسی'), O('angle_deg', 'زاویه (درجه)')],
    tests: [
      { input: { vector_a: '1, 0', vector_b: '0, 1' }, expected: { cosine_similarity: 0, dot_product: 0, euclidean_distance: 1.414214, angle_deg: 90 } },
      { input: { vector_a: '3, 4', vector_b: '3, 4' }, expected: { cosine_similarity: 1, dot_product: 25, euclidean_distance: 0, angle_deg: 0 } },
    ],
    compute({ vector_a, vector_b }) {
      const a = parseList(vector_a);
      const b = parseList(vector_b);
      if (a.length !== b.length) throw new Error('دو بردار باید هم‌بُعد باشند');
      const dot = a.reduce((acc, value, index) => acc + value * b[index], 0);
      const na = Math.hypot(...a);
      const nb = Math.hypot(...b);
      if (na === 0 || nb === 0) throw new Error('بردار صفر زاویه ندارد');
      const cos = Math.max(-1, Math.min(1, dot / (na * nb)));
      const dist = Math.hypot(...a.map((value, index) => value - b[index]));
      return out(
        { cosine_similarity: round(cos, 6), dot_product: round(dot, 6), euclidean_distance: round(dist, 6), angle_deg: round(rad2deg(Math.acos(cos)), 6) },
        [`a·b = ${round(dot, 4)} ، ‖a‖ = ${round(na, 4)} ، ‖b‖ = ${round(nb, 4)}`, `cosθ = ${round(cos, 6)} ← θ = ${round(rad2deg(Math.acos(cos)), 4)}°`],
      );
    },
  }),

  // ── ریاضیات · نظریه بازی ────────────────────────────────────────────────
  make({
    id: 'zero_sum_mixed_nash',
    name_fa: 'تعادل نش آمیخته بازی مجموع‌صفر ۲×۲',
    name_en: 'Mixed Nash Equilibrium (2×2 Zero-Sum)',
    category_path: ['ریاضیات', 'نظریه بازی'],
    tags: ['تعادل نش', 'بازی مجموع‌صفر', 'Nash'],
    description_fa: 'احتمال‌های تعادلی و ارزش بازی برای بازی دونفره مجموع‌صفر با دو راهبرد برای هر بازیکن.',
    formula_latex: 'p=\\frac{d-c}{a-b-c+d},\\qquad v=\\frac{ad-bc}{a-b-c+d}',
    difficulty: 'advanced',
    variables: [
      N('a', 'پرداخت (بالا، چپ) a', 'Payoff a (Up,Left)', null, 1),
      N('b', 'پرداخت (بالا، راست) b', 'Payoff b (Up,Right)', null, -1),
      N('c', 'پرداخت (پایین، چپ) c', 'Payoff c (Down,Left)', null, -1),
      N('d', 'پرداخت (پایین، راست) d', 'Payoff d (Down,Right)', null, 1),
    ],
    outputs: [O('row_prob_first', 'احتمال راهبرد اول سطر p'), O('col_prob_first', 'احتمال راهبرد اول ستون q'), O('game_value', 'ارزش بازی')],
    tests: [
      { input: { a: 1, b: -1, c: -1, d: 1 }, expected: { row_prob_first: 0.5, col_prob_first: 0.5, game_value: 0 } },
      { input: { a: 3, b: 0, c: 0, d: 2 }, expected: { row_prob_first: 0.4, col_prob_first: 0.4, game_value: 1.2 } },
    ],
    compute({ a, b, c, d }) {
      const denom = a - b - c + d;
      if (denom === 0) throw new Error('این بازی تعادل آمیخته درونی ندارد (مخرج صفر است)');
      const p = (d - c) / denom;
      const q = (d - b) / denom;
      if (p < 0 || p > 1 || q < 0 || q > 1) throw new Error('تعادل درونی نیست؛ یک راهبرد خالص غالب یا نقطه زینی وجود دارد');
      const value = (a * d - b * c) / denom;
      return out(
        { row_prob_first: round(p, 6), col_prob_first: round(q, 6), game_value: round(value, 6) },
        [`p = (d−c)/(a−b−c+d) = ${round(p, 4)}`, `q = (d−b)/(a−b−c+d) = ${round(q, 4)}`, `ارزش بازی v = (ad−bc)/مخرج = ${round(value, 4)}`],
      );
    },
  }),

  make({
    id: 'expected_payoff_2x2',
    name_fa: 'پرداخت موردانتظار در بازی ۲×۲',
    name_en: 'Expected Payoffs in a 2×2 Game',
    category_path: ['ریاضیات', 'نظریه بازی'],
    tags: ['بازی', 'پرداخت', 'معمای زندانی', 'payoff'],
    description_fa: 'امید ریاضی پرداخت هر بازیکن وقتی هر دو با احتمال مشخصی راهبرد اول را برمی‌گزینند.',
    formula_latex: 'E=pq\\,a+p(1-q)b+(1-p)q\\,c+(1-p)(1-q)d',
    difficulty: 'intermediate',
    variables: [
      N('ra', 'پرداخت سطر (۱،۱)', 'Row payoff (1,1)', null, -1),
      N('rb', 'پرداخت سطر (۱،۲)', 'Row payoff (1,2)', null, -3),
      N('rc', 'پرداخت سطر (۲،۱)', 'Row payoff (2,1)', null, 0),
      N('rd', 'پرداخت سطر (۲،۲)', 'Row payoff (2,2)', null, -2),
      N('ca', 'پرداخت ستون (۱،۱)', 'Column payoff (1,1)', null, -1),
      N('cb', 'پرداخت ستون (۱،۲)', 'Column payoff (1,2)', null, 0),
      N('cc', 'پرداخت ستون (۲،۱)', 'Column payoff (2,1)', null, -3),
      N('cd', 'پرداخت ستون (۲،۲)', 'Column payoff (2,2)', null, -2),
      N('p', 'احتمال راهبرد اول سطر p', 'Row mixes p', null, 1, { min: 0, max: 1 }),
      N('q', 'احتمال راهبرد اول ستون q', 'Column mixes q', null, 1, { min: 0, max: 1 }),
    ],
    outputs: [O('row_expected', 'امید پرداخت بازیکن سطر'), O('col_expected', 'امید پرداخت بازیکن ستون'), O('joint_sum', 'مجموع دو پرداخت')],
    tests: [
      { input: { ra: -1, rb: -3, rc: 0, rd: -2, ca: -1, cb: 0, cc: -3, cd: -2, p: 1, q: 1 }, expected: { row_expected: -1, col_expected: -1 } },
      { input: { ra: -1, rb: -3, rc: 0, rd: -2, ca: -1, cb: 0, cc: -3, cd: -2, p: 0.5, q: 0.5 }, expected: { row_expected: -1.5, col_expected: -1.5 } },
    ],
    compute({ ra, rb, rc, rd, ca, cb, cc, cd, p, q }) {
      if (p < 0 || p > 1 || q < 0 || q > 1) throw new Error('احتمال‌ها باید بین ۰ و ۱ باشند');
      const mix = (a, b, c, d) => p * q * a + p * (1 - q) * b + (1 - p) * q * c + (1 - p) * (1 - q) * d;
      const rowE = mix(ra, rb, rc, rd);
      const colE = mix(ca, cb, cc, cd);
      return out(
        { row_expected: round(rowE, 6), col_expected: round(colE, 6), joint_sum: round(rowE + colE, 6) },
        [`E(سطر) = ${round(rowE, 4)}`, `E(ستون) = ${round(colE, 4)}`],
      );
    },
  }),

  // ── مهندسی · قابلیت اطمینان ─────────────────────────────────────────────
  make({
    id: 'system_reliability',
    name_fa: 'قابلیت اطمینان سامانه سری، موازی و k از n',
    name_en: 'Series / Parallel / k-out-of-n Reliability',
    category_path: ['مهندسی', 'قابلیت اطمینان'],
    tags: ['قابلیت اطمینان', 'افزونگی', 'reliability'],
    description_fa: 'احتمال کارکرد سامانه از روی اطمینان هر قطعه در سه معماری کلاسیک افزونگی.',
    formula_latex: 'R_s=\\prod R_i,\\qquad R_p=1-\\prod (1-R_i)',
    difficulty: 'intermediate',
    variables: [T('reliabilities', 'اطمینان قطعه‌ها (۰ تا ۱، با کاما)', 'Component reliabilities', '0.9, 0.9'), N('k', 'حداقل قطعه سالم لازم k', 'k (of n)', null, 1, { min: 1, max: 100 })],
    outputs: [O('series_reliability', 'اطمینان سری'), O('parallel_reliability', 'اطمینان موازی'), O('k_out_of_n_reliability', 'اطمینان k از n')],
    tests: [
      { input: { reliabilities: '0.9, 0.9', k: 1 }, expected: { series_reliability: 0.81, parallel_reliability: 0.99, k_out_of_n_reliability: 0.99 } },
      { input: { reliabilities: '0.8, 0.9, 0.95', k: 2 }, expected: { series_reliability: 0.684, parallel_reliability: 0.999, k_out_of_n_reliability: 0.967 } },
    ],
    compute({ reliabilities, k }) {
      const rs = parseList(reliabilities);
      const need = Math.trunc(k);
      if (rs.some((r) => r < 0 || r > 1)) throw new Error('اطمینان هر قطعه باید بین ۰ و ۱ باشد');
      if (need < 1 || need > rs.length) throw new Error('k باید بین ۱ و تعداد قطعه‌ها باشد');
      const series = rs.reduce((acc, r) => acc * r, 1);
      const parallel = 1 - rs.reduce((acc, r) => acc * (1 - r), 1);
      // DP: probability that exactly i components work.
      let dp = [1];
      for (const r of rs) {
        const next = new Array(dp.length + 1).fill(0);
        for (let i = 0; i < dp.length; i += 1) {
          next[i] += dp[i] * (1 - r);
          next[i + 1] += dp[i] * r;
        }
        dp = next;
      }
      const kOfN = dp.slice(need).reduce((acc, value) => acc + value, 0);
      return out(
        { series_reliability: round(series, 6), parallel_reliability: round(parallel, 6), k_out_of_n_reliability: round(kOfN, 6) },
        [`سری = ΠR = ${round(series, 6)}`, `موازی = 1−Π(1−R) = ${round(parallel, 6)}`, `حداقل ${need} از ${rs.length} سالم: ${round(kOfN, 6)}`],
      );
    },
  }),

  make({
    id: 'weibull_reliability',
    name_fa: 'قابلیت اطمینان وایبول',
    name_en: 'Weibull Reliability',
    category_path: ['مهندسی', 'قابلیت اطمینان'],
    tags: ['وایبول', 'عمر قطعه', 'weibull'],
    description_fa: 'احتمال بقا تا زمان t، نرخ خرابی لحظه‌ای و امید عمر برای توزیع طول عمر وایبول.',
    formula_latex: 'R(t)=e^{-(t/\\eta)^{\\beta}}',
    difficulty: 'advanced',
    variables: [
      N('time', 'زمان مأموریت t', 'Mission time', null, 1000, { min: 0 }),
      N('eta', 'عمر مشخصه η', 'Characteristic life η', null, 1000, { min: 0 }),
      N('beta', 'پارامتر شکل β', 'Shape β', null, 2, { min: 0 }),
    ],
    outputs: [O('reliability', 'قابلیت اطمینان R(t)'), O('failure_probability', 'احتمال خرابی F(t)'), O('hazard_rate', 'نرخ خرابی لحظه‌ای'), O('mean_life', 'امید عمر')],
    tests: [
      { input: { time: 1000, eta: 1000, beta: 2 }, expected: { reliability: 0.367879, failure_probability: 0.632121, hazard_rate: 0.002, mean_life: 886.226925 } },
      { input: { time: 500, eta: 1000, beta: 1 }, expected: { reliability: 0.606531, hazard_rate: 0.001, mean_life: 1000 } },
    ],
    compute({ time, eta, beta }) {
      if (time < 0 || eta <= 0 || beta <= 0) throw new Error('زمان نامنفی و η و β مثبت باشند');
      const ratio = time / eta;
      const rel = Math.exp(-(ratio ** beta));
      const hazard = (beta / eta) * ratio ** (beta - 1);
      const meanLife = eta * Math.exp(logGamma(1 + 1 / beta));
      return out(
        { reliability: round(rel, 6), failure_probability: round(1 - rel, 6), hazard_rate: round(hazard, 6), mean_life: round(meanLife, 6) },
        [`R(t) = e^{−(t/η)^β} = e^{−${round(ratio ** beta, 4)}} = ${round(rel, 6)}`, `امید عمر = η·Γ(1+1/β) = ${round(meanLife, 4)}`],
      );
    },
  }),

  make({
    id: 'mtbf_availability',
    name_fa: 'دسترس‌پذیری، MTBF و نرخ خرابی',
    name_en: 'Availability, MTBF & Failure Rate',
    category_path: ['مهندسی', 'قابلیت اطمینان'],
    tags: ['MTBF', 'دسترس‌پذیری', 'availability'],
    description_fa: 'دسترس‌پذیری ماندگار و اطمینان نمایی یک سامانه تعمیرپذیر در بازه مأموریت.',
    formula_latex: 'A=\\frac{MTBF}{MTBF+MTTR},\\quad R(t)=e^{-t/MTBF}',
    variables: [
      N('mtbf_hours', 'میانگین زمان بین خرابی (h)', 'MTBF (h)', null, 1000, { min: 0 }),
      N('mttr_hours', 'میانگین زمان تعمیر (h)', 'MTTR (h)', null, 10, { min: 0 }),
      N('mission_hours', 'مدت مأموریت (h)', 'Mission time (h)', null, 100, { min: 0 }),
    ],
    outputs: [O('availability', 'دسترس‌پذیری'), O('failure_rate_per_hour', 'نرخ خرابی λ (1/h)'), O('mission_reliability', 'اطمینان در مأموریت'), O('expected_failures', 'خرابی موردانتظار')],
    tests: [
      { input: { mtbf_hours: 1000, mttr_hours: 10, mission_hours: 100 }, expected: { availability: 0.990099, failure_rate_per_hour: 0.001, mission_reliability: 0.904837, expected_failures: 0.1 } },
      { input: { mtbf_hours: 500, mttr_hours: 25, mission_hours: 500 }, expected: { availability: 0.952381, mission_reliability: 0.367879, expected_failures: 1 } },
    ],
    compute({ mtbf_hours, mttr_hours, mission_hours }) {
      if (mtbf_hours <= 0 || mttr_hours < 0 || mission_hours < 0) throw new Error('MTBF مثبت و بقیه زمان‌ها نامنفی باشند');
      return out(
        {
          availability: round(mtbf_hours / (mtbf_hours + mttr_hours), 6),
          failure_rate_per_hour: round(1 / mtbf_hours, 6),
          mission_reliability: round(Math.exp(-mission_hours / mtbf_hours), 6),
          expected_failures: round(mission_hours / mtbf_hours, 6),
        },
        [`A = MTBF/(MTBF+MTTR) = ${round(mtbf_hours / (mtbf_hours + mttr_hours), 6)}`, `R(t) = e^{−t/MTBF} = ${round(Math.exp(-mission_hours / mtbf_hours), 6)}`],
      );
    },
  }),

  // ── ریاضیات · سری زمانی ─────────────────────────────────────────────────
  make({
    id: 'sma_forecast_trend',
    name_fa: 'میانگین متحرک ساده و روند',
    name_en: 'Simple Moving Average & Trend',
    category_path: ['ریاضیات', 'سری زمانی'],
    tags: ['پیش‌بینی', 'روند', 'SMA'],
    description_fa: 'هموارسازی سری زمانی با میانگین متحرک، پیش‌بینی دوره بعد و شیب روند خطی کل سری.',
    formula_latex: '\\mathrm{SMA}_M=\\frac{1}{M}\\sum_{i=0}^{M-1} x_{t-i}',
    variables: [T('values', 'مقادیر سری (با کاما)', 'Time series', '10, 12, 14, 16, 18'), N('window', 'طول پنجره', 'Window', null, 3, { min: 1, max: 1000 })],
    outputs: [O('sma_last', 'آخرین میانگین متحرک'), O('forecast_next', 'پیش‌بینی دوره بعد'), O('sma_first', 'نخستین میانگین متحرک'), O('trend_slope', 'شیب روند (در هر دوره)')],
    tests: [
      { input: { values: '10, 12, 14, 16, 18', window: 3 }, expected: { sma_last: 16, sma_first: 12, trend_slope: 2 } },
      { input: { values: '5, 5, 5, 5', window: 2 }, expected: { sma_last: 5, trend_slope: 0 } },
    ],
    compute({ values, window }) {
      const xs = parseList(values);
      const m = Math.trunc(window);
      if (m < 1 || m > xs.length) throw new Error('طول پنجره باید بین ۱ و طول سری باشد');
      const smaFirst = meanOf(xs.slice(0, m));
      const smaLast = meanOf(xs.slice(xs.length - m));
      const n = xs.length;
      const meanX = (n - 1) / 2;
      const meanY = meanOf(xs);
      let sxy = 0;
      let sxx = 0;
      xs.forEach((y, index) => {
        sxy += (index - meanX) * (y - meanY);
        sxx += (index - meanX) ** 2;
      });
      const slope = sxx === 0 ? 0 : sxy / sxx;
      return out(
        { sma_last: round(smaLast, 6), forecast_next: round(smaLast, 6), sma_first: round(smaFirst, 6), trend_slope: round(slope, 6) },
        [`SMA پایانی = میانگین ${m} مقدار آخر = ${round(smaLast, 4)}`, `شیب روند خطی = ${round(slope, 4)} در هر دوره`],
      );
    },
  }),

  make({
    id: 'exponential_smoothing',
    name_fa: 'هموارسازی نمایی ساده',
    name_en: 'Simple Exponential Smoothing',
    category_path: ['ریاضیات', 'سری زمانی'],
    tags: ['پیش‌بینی', 'هموارسازی', 'exponential smoothing'],
    description_fa: 'پیش‌بینی با وزن‌دهی نزولی نمایی به گذشته و سنجش خطای درون‌نمونه‌ای آن.',
    formula_latex: 's_t=\\alpha x_t + (1-\\alpha) s_{t-1}',
    variables: [T('values', 'مقادیر سری (با کاما)', 'Time series', '10, 12, 14'), N('alpha', 'ضریب هموارسازی α (۰ تا ۱)', 'Smoothing α', null, 0.5, { min: 0, max: 1 })],
    outputs: [O('smoothed_last', 'آخرین مقدار هموارشده'), O('forecast_next', 'پیش‌بینی دوره بعد'), O('one_step_mse', 'MSE خطای یک‌گام جلو')],
    tests: [
      { input: { values: '10, 12, 14', alpha: 0.5 }, expected: { smoothed_last: 12.5, forecast_next: 12.5, one_step_mse: 6.5 } },
      { input: { values: '8, 8, 8', alpha: 0.3 }, expected: { smoothed_last: 8, one_step_mse: 0 } },
    ],
    compute({ values, alpha }) {
      const xs = parseList(values);
      if (alpha < 0 || alpha > 1) throw new Error('α باید بین ۰ و ۱ باشد');
      let s = xs[0];
      let sse = 0;
      for (let t = 1; t < xs.length; t += 1) {
        sse += (xs[t] - s) ** 2;
        s = alpha * xs[t] + (1 - alpha) * s;
      }
      const mse = xs.length > 1 ? sse / (xs.length - 1) : 0;
      return out(
        { smoothed_last: round(s, 6), forecast_next: round(s, 6), one_step_mse: round(mse, 6) },
        [`s_t = α·x_t + (1−α)·s_{t−1} با α = ${alpha}`, `پیش‌بینی دوره بعد = ${round(s, 4)}`],
      );
    },
  }),

  make({
    id: 'autocorrelation_series',
    name_fa: 'خودهمبستگی سری زمانی',
    name_en: 'Autocorrelation (Lag 1 & 2)',
    category_path: ['ریاضیات', 'سری زمانی'],
    tags: ['خودهمبستگی', 'حافظه سری', 'autocorrelation'],
    description_fa: 'اینکه مقدار امروز چقدر شبیه دیروز و پریروز است؛ ابزار پایه تشخیص الگو در سری‌های زمانی.',
    formula_latex: 'r_k=\\frac{\\sum_{t>k}(x_t-\\bar{x})(x_{t-k}-\\bar{x})}{\\sum_t (x_t-\\bar{x})^2}',
    difficulty: 'intermediate',
    variables: [T('values', 'مقادیر سری (حداقل ۴ مقدار)', 'Time series', '1, 2, 3, 4')],
    outputs: [O('lag1', 'خودهمبستگی تأخیر ۱'), O('lag2', 'خودهمبستگی تأخیر ۲'), O('mean', 'میانگین'), O('variance_population', 'واریانس جامعه')],
    tests: [
      { input: { values: '1, 2, 3, 4' }, expected: { lag1: 0.25, lag2: -0.3, mean: 2.5, variance_population: 1.25 } },
      { input: { values: '1, 3, 1, 3' }, expected: { lag1: -0.75, lag2: 0.5 } },
    ],
    compute({ values }) {
      const xs = parseList(values);
      if (xs.length < 4) throw new Error('حداقل ۴ مقدار لازم است');
      const mean = meanOf(xs);
      const devs = xs.map((x) => x - mean);
      const denom = devs.reduce((acc, d) => acc + d * d, 0);
      if (denom === 0) throw new Error('سری ثابت خودهمبستگی تعریف‌شده‌ای ندارد');
      const lag = (k) => devs.slice(k).reduce((acc, d, index) => acc + d * devs[index], 0) / denom;
      return out(
        { lag1: round(lag(1), 6), lag2: round(lag(2), 6), mean: round(mean, 6), variance_population: round(denom / xs.length, 6) },
        [`میانگین = ${round(mean, 4)}`, `r₁ = ${round(lag(1), 4)} ، r₂ = ${round(lag(2), 4)}`],
      );
    },
  }),

  // ── مهندسی · رباتیک و مداری ─────────────────────────────────────────────
  make({
    id: 'two_link_forward_kinematics',
    name_fa: 'سینماتیک مستقیم بازوی دولینکی',
    name_en: 'Two-Link Forward Kinematics',
    category_path: ['مهندسی', 'رباتیک'],
    tags: ['بازوی رباتیک', 'سینماتیک', 'forward kinematics'],
    description_fa: 'جای نوک بازوی صفحه‌ای دولینکی از روی زاویه دو مفصل.',
    formula_latex: 'x=L_1\\cos\\theta_1+L_2\\cos(\\theta_1+\\theta_2)',
    variables: [
      N('l1', 'طول لینک اول L₁', 'Link 1 length', null, 1, { min: 0 }),
      N('l2', 'طول لینک دوم L₂', 'Link 2 length', null, 1, { min: 0 }),
      N('theta1_deg', 'زاویه مفصل اول (درجه)', 'Joint 1 angle', 'deg', 0),
      N('theta2_deg', 'زاویه مفصل دوم نسبی (درجه)', 'Joint 2 angle (relative)', 'deg', 90),
    ],
    outputs: [O('end_x', 'مختصه x نوک بازو'), O('end_y', 'مختصه y نوک بازو'), O('elbow_x', 'مختصه x آرنج'), O('elbow_y', 'مختصه y آرنج'), O('reach', 'فاصله نوک تا پایه')],
    tests: [
      { input: { l1: 1, l2: 1, theta1_deg: 0, theta2_deg: 90 }, expected: { end_x: 1, end_y: 1, elbow_x: 1, elbow_y: 0, reach: 1.414214 } },
      { input: { l1: 2, l2: 1, theta1_deg: 90, theta2_deg: -90 }, expected: { end_x: 1, end_y: 2, reach: 2.236068 } },
    ],
    compute({ l1, l2, theta1_deg, theta2_deg }) {
      if (l1 <= 0 || l2 <= 0) throw new Error('طول لینک‌ها باید مثبت باشد');
      const t1 = deg2rad(theta1_deg);
      const t12 = deg2rad(theta1_deg + theta2_deg);
      const elbowX = l1 * Math.cos(t1);
      const elbowY = l1 * Math.sin(t1);
      const endX = elbowX + l2 * Math.cos(t12);
      const endY = elbowY + l2 * Math.sin(t12);
      return out(
        { end_x: round(endX, 6), end_y: round(endY, 6), elbow_x: round(elbowX, 6), elbow_y: round(elbowY, 6), reach: round(Math.hypot(endX, endY), 6) },
        [`آرنج: (${round(elbowX, 4)}، ${round(elbowY, 4)})`, `نوک بازو: (${round(endX, 4)}، ${round(endY, 4)})`],
      );
    },
  }),

  make({
    id: 'two_link_inverse_kinematics',
    name_fa: 'سینماتیک معکوس بازوی دولینکی',
    name_en: 'Two-Link Inverse Kinematics',
    category_path: ['مهندسی', 'رباتیک'],
    tags: ['بازوی رباتیک', 'سینماتیک معکوس', 'inverse kinematics'],
    description_fa: 'زاویه مفصل‌های لازم برای رساندن نوک بازو به نقطه هدف (شاخه آرنج مثبت).',
    formula_latex: '\\cos\\theta_2=\\frac{x^2+y^2-L_1^2-L_2^2}{2L_1L_2}',
    difficulty: 'advanced',
    variables: [
      N('x', 'مختصه x هدف', 'Target x', null, 1),
      N('y', 'مختصه y هدف', 'Target y', null, 1),
      N('l1', 'طول لینک اول L₁', 'Link 1 length', null, 1, { min: 0 }),
      N('l2', 'طول لینک دوم L₂', 'Link 2 length', null, 1, { min: 0 }),
    ],
    outputs: [O('theta1_deg', 'زاویه مفصل اول (درجه)'), O('theta2_deg', 'زاویه مفصل دوم (درجه)'), O('target_distance', 'فاصله هدف تا پایه')],
    tests: [
      { input: { x: 1, y: 1, l1: 1, l2: 1 }, expected: { theta1_deg: 0, theta2_deg: 90 } },
      { input: { x: 2, y: 0, l1: 1, l2: 1 }, expected: { theta1_deg: 0, theta2_deg: 0, target_distance: 2 } },
    ],
    compute({ x, y, l1, l2 }) {
      if (l1 <= 0 || l2 <= 0) throw new Error('طول لینک‌ها باید مثبت باشد');
      const dist = Math.hypot(x, y);
      if (dist > l1 + l2 + 1e-12 || dist < Math.abs(l1 - l2) - 1e-12) throw new Error('هدف خارج از برد بازو است');
      const cos2 = Math.max(-1, Math.min(1, (x * x + y * y - l1 * l1 - l2 * l2) / (2 * l1 * l2)));
      const theta2 = Math.acos(cos2);
      const theta1 = Math.atan2(y, x) - Math.atan2(l2 * Math.sin(theta2), l1 + l2 * cos2);
      return out(
        { theta1_deg: round(rad2deg(theta1), 6), theta2_deg: round(rad2deg(theta2), 6), target_distance: round(dist, 6) },
        [`قانون کسینوس‌ها: θ₂ = ${round(rad2deg(theta2), 4)}°`, `θ₁ = ${round(rad2deg(theta1), 4)}°`],
      );
    },
  }),

  make({
    id: 'differential_drive_kinematics',
    name_fa: 'سینماتیک ربات دیفرانسیلی',
    name_en: 'Differential-Drive Kinematics',
    category_path: ['مهندسی', 'رباتیک'],
    tags: ['ربات چرخ‌دار', 'odomtry', 'differential drive'],
    description_fa: 'سرعت خطی و زاویه‌ای ربات دوچرخ از سرعت چرخش چرخ‌های چپ و راست.',
    formula_latex: 'v=\\frac{r(\\omega_R+\\omega_L)}{2},\\qquad \\omega=\\frac{r(\\omega_R-\\omega_L)}{L}',
    variables: [
      N('wheel_radius', 'شعاع چرخ r (m)', 'Wheel radius', 'm', 0.1, { min: 0 }),
      N('track_width', 'فاصله دو چرخ L (m)', 'Track width', 'm', 0.5, { min: 0 }),
      N('omega_left', 'سرعت زاویه‌ای چرخ چپ (rad/s)', 'Left wheel ω', null, 10),
      N('omega_right', 'سرعت زاویه‌ای چرخ راست (rad/s)', 'Right wheel ω', null, 10),
    ],
    outputs: [O('linear_velocity', 'سرعت خطی v (m/s)'), O('angular_velocity', 'سرعت زاویه‌ای ω (rad/s)'), O('curvature', 'انحنا κ = ω/v (1/m)'), O('left_speed', 'سرعت خطی چرخ چپ (m/s)'), O('right_speed', 'سرعت خطی چرخ راست (m/s)')],
    tests: [
      { input: { wheel_radius: 0.1, track_width: 0.5, omega_left: 10, omega_right: 10 }, expected: { linear_velocity: 1, angular_velocity: 0, curvature: 0 } },
      { input: { wheel_radius: 0.1, track_width: 0.5, omega_left: 5, omega_right: 15 }, expected: { linear_velocity: 1, angular_velocity: 2, curvature: 2 } },
    ],
    compute({ wheel_radius, track_width, omega_left, omega_right }) {
      if (wheel_radius <= 0 || track_width <= 0) throw new Error('شعاع چرخ و فاصله چرخ‌ها باید مثبت باشند');
      const v = (wheel_radius * (omega_right + omega_left)) / 2;
      const omega = (wheel_radius * (omega_right - omega_left)) / track_width;
      return out(
        { linear_velocity: round(v, 6), angular_velocity: round(omega, 6), curvature: round(v === 0 ? 0 : omega / v, 6), left_speed: round(wheel_radius * omega_left, 6), right_speed: round(wheel_radius * omega_right, 6) },
        [`v = r(ωR+ωL)/2 = ${round(v, 4)} m/s`, `ω = r(ωR−ωL)/L = ${round(omega, 4)} rad/s`, omega !== 0 ? `شعاع گردش R = v/ω = ${round(v / omega, 4)} m` : 'مسیر مستقیم است (شعاع گردش بی‌نهایت)'],
      );
    },
  }),

  make({
    id: 'hohmann_transfer',
    name_fa: 'انتقال هوهمان مداری',
    name_en: 'Hohmann Transfer',
    category_path: ['مهندسی', 'رباتیک'],
    tags: ['مدار', 'مانور مداری', 'hohmann', 'delta-v'],
    description_fa: 'کم‌مصرف‌ترین مانور دوضربه‌ای بین دو مدار دایروی هم‌صفحه و زمان انتقال آن.',
    formula_latex: 'a_t=\\frac{r_1+r_2}{2},\\qquad v=\\sqrt{\\mu\\Big(\\frac{2}{r}-\\frac{1}{a}\\Big)}',
    difficulty: 'advanced',
    variables: [
      N('r1_km', 'شعاع مدار آغاز km', 'Initial radius (km)', 'km', 6778, { min: 0 }),
      N('r2_km', 'شعاع مدار هدف km', 'Target radius (km)', 'km', 42164, { min: 0 }),
      N('mu', 'پارامتر گرانشی μ (km³/s²)', 'Gravitational parameter μ', null, 398600.4418, { min: 0 }),
    ],
    outputs: [O('dv1_kms', 'ضربه اول Δv₁ (km/s)'), O('dv2_kms', 'ضربه دوم Δv₂ (km/s)'), O('dv_total_kms', 'مجموع Δv (km/s)'), O('transfer_time_hours', 'زمان انتقال (ساعت)')],
    tests: [
      { input: { r1_km: 10, r2_km: 40, mu: 1000 }, expected: { dv1_kms: 2.649111, dv_total_kms: 4.486833 } },
      { input: { r1_km: 10, r2_km: 10, mu: 1000 }, expected: { dv1_kms: 0, dv_total_kms: 0 } },
    ],
    compute({ r1_km, r2_km, mu }) {
      if (r1_km <= 0 || r2_km <= 0 || mu <= 0) throw new Error('شعاع‌ها و μ باید مثبت باشند');
      const a = (r1_km + r2_km) / 2;
      const vc1 = Math.sqrt(mu / r1_km);
      const vp = Math.sqrt(mu * (2 / r1_km - 1 / a));
      const va = Math.sqrt(mu * (2 / r2_km - 1 / a));
      const vc2 = Math.sqrt(mu / r2_km);
      const dv1 = Math.abs(vp - vc1);
      const dv2 = Math.abs(vc2 - va);
      const timeSec = Math.PI * Math.sqrt(a ** 3 / mu);
      return out(
        { dv1_kms: round(dv1, 6), dv2_kms: round(dv2, 6), dv_total_kms: round(dv1 + dv2, 6), transfer_time_hours: round(timeSec / 3600, 6) },
        [`محور بیضی انتقال a = ${round(a, 4)} km`, `Δv₁ = |${round(vp, 4)} − ${round(vc1, 4)}| = ${round(dv1, 4)} km/s`, `زمان انتقال = نصف دوره بیضی = ${round(timeSec / 3600, 4)} ساعت`],
      );
    },
  }),

  // ── کامپیوتر · گرافیک سه‌بعدی ───────────────────────────────────────────
  make({
    id: 'euler_rotation_3d',
    name_fa: 'چرخش سه‌بعدی با زاویه‌های اویلر',
    name_en: '3D Euler Rotation (XYZ Order)',
    category_path: ['کامپیوتر و اطلاعات', 'گرافیک سه‌بعدی'],
    tags: ['چرخش', 'ماتریس چرخش', 'euler angles', '3D'],
    description_fa: 'چرخاندن یک نقطه با ترکیب چرخش‌های X سپس Y سپس Z (ماتریس Rz·Ry·Rx).',
    formula_latex: 'p\' = R_z R_y R_x \\, p',
    variables: [
      N('x', 'مختصه x نقطه', 'Point x', null, 1),
      N('y', 'مختصه y نقطه', 'Point y', null, 0),
      N('z', 'مختصه z نقطه', 'Point z', null, 0),
      N('rx_deg', 'چرخش حول X (درجه)', 'Rotation X', 'deg', 0),
      N('ry_deg', 'چرخش حول Y (درجه)', 'Rotation Y', 'deg', 0),
      N('rz_deg', 'چرخش حول Z (درجه)', 'Rotation Z', 'deg', 90),
    ],
    outputs: [O('x2', 'x چرخیده'), O('y2', 'y چرخیده'), O('z2', 'z چرخیده'), O('length', 'طول بردار (ثابت می‌ماند)')],
    tests: [
      { input: { x: 1, y: 0, z: 0, rx_deg: 0, ry_deg: 0, rz_deg: 90 }, expected: { x2: 0, y2: 1, z2: 0, length: 1 } },
      { input: { x: 0, y: 1, z: 0, rx_deg: 90, ry_deg: 0, rz_deg: 0 }, expected: { x2: 0, y2: 0, z2: 1 } },
    ],
    compute({ x, y, z, rx_deg, ry_deg, rz_deg }) {
      const [cx, sx] = [Math.cos(deg2rad(rx_deg)), Math.sin(deg2rad(rx_deg))];
      const [cy, sy] = [Math.cos(deg2rad(ry_deg)), Math.sin(deg2rad(ry_deg))];
      const [cz, sz] = [Math.cos(deg2rad(rz_deg)), Math.sin(deg2rad(rz_deg))];
      const y1 = y * cx - z * sx;
      const z1 = y * sx + z * cx;
      const x2mid = x * cy + z1 * sy;
      const z2mid = -x * sy + z1 * cy;
      const x2 = x2mid * cz - y1 * sz;
      const y2 = x2mid * sz + y1 * cz;
      return out(
        { x2: round(x2, 6), y2: round(y2, 6), z2: round(z2mid, 6), length: round(Math.hypot(x2, y2, z2mid), 6) },
        [`پس از Rx: (${round(x, 4)}، ${round(y1, 4)}، ${round(z1, 4)})`, `نتیجه نهایی: (${round(x2, 4)}، ${round(y2, 4)}، ${round(z2mid, 4)})`],
      );
    },
  }),

  make({
    id: 'perspective_projection',
    name_fa: 'تصویر پرسپکتیو (NDC)',
    name_en: 'Perspective Projection to NDC',
    category_path: ['کامپیوتر و اطلاعات', 'گرافیک سه‌بعدی'],
    tags: ['پرسپکتیو', 'رندر', 'projection', 'NDC'],
    description_fa: 'نگاشت نقطه جلوی دوربین به مختصات دستگاه نرمال‌شده صفحه، همان‌طور که خط لوله گرافیکی انجام می‌دهد.',
    formula_latex: 'x_{ndc}=\\frac{f}{a}\\frac{x}{d},\\qquad f=\\frac{1}{\\tan(\\theta/2)}',
    difficulty: 'advanced',
    variables: [
      N('x', 'مختصه x نسبت به دوربین', 'Camera-space x', null, 1),
      N('y', 'مختصه y نسبت به دوربین', 'Camera-space y', null, 1),
      N('depth', 'عمق جلوی دوربین d', 'Depth in front', null, 1, { min: 0 }),
      N('fov_deg', 'میدان دید عمودی (درجه)', 'Vertical FOV', 'deg', 90, { min: 0, max: 179 }),
      N('aspect', 'نسبت تصویر (عرض/ارتفاع)', 'Aspect ratio', null, 1, { min: 0 }),
      N('near', 'صفحه نزدیک', 'Near plane', null, 1, { min: 0 }),
      N('far', 'صفحه دور', 'Far plane', null, 11, { min: 0 }),
    ],
    outputs: [O('x_ndc', 'x در NDC'), O('y_ndc', 'y در NDC'), O('z_ndc', 'عمق در NDC')],
    tests: [
      { input: { x: 1, y: 1, depth: 1, fov_deg: 90, aspect: 1, near: 1, far: 11 }, expected: { x_ndc: 1, y_ndc: 1, z_ndc: -1 } },
      { input: { x: 0, y: 0, depth: 11, fov_deg: 90, aspect: 1, near: 1, far: 11 }, expected: { x_ndc: 0, y_ndc: 0, z_ndc: 1 } },
    ],
    compute({ x, y, depth, fov_deg, aspect, near, far }) {
      if (depth <= 0 || aspect <= 0 || near <= 0 || far <= near) throw new Error('عمق، نسبت تصویر و صفحه‌های برش باید معتبر باشند');
      if (fov_deg <= 0 || fov_deg >= 180) throw new Error('میدان دید باید بین ۰ و ۱۸۰ درجه باشد');
      const f = 1 / Math.tan(deg2rad(fov_deg) / 2);
      const xNdc = ((f / aspect) * x) / depth;
      const yNdc = (f * y) / depth;
      const zNdc = (far + near) / (far - near) - (2 * far * near) / ((far - near) * depth);
      const visible = Math.abs(xNdc) <= 1 && Math.abs(yNdc) <= 1 && zNdc >= -1 && zNdc <= 1;
      return out(
        { x_ndc: round(xNdc, 6), y_ndc: round(yNdc, 6), z_ndc: round(zNdc, 6) },
        [`f = 1/tan(θ/2) = ${round(f, 4)}`, visible ? 'نقطه داخل حجم دید است' : 'نقطه بیرون حجم دید است و بریده می‌شود'],
      );
    },
  }),

  make({
    id: 'quaternion_axis_angle',
    name_fa: 'کواترنیون از محور و زاویه',
    name_en: 'Quaternion from Axis–Angle',
    category_path: ['کامپیوتر و اطلاعات', 'گرافیک سه‌بعدی'],
    tags: ['کواترنیون', 'چرخش بدون قفل', 'quaternion'],
    description_fa: 'ساخت کواترنیون چرخش و اعمال آن روی یک بردار؛ نمایش استاندارد جهت‌گیری در موتورهای بازی و رباتیک.',
    formula_latex: 'q=\\big(\\hat{u}\\sin\\tfrac{\\theta}{2},\\; \\cos\\tfrac{\\theta}{2}\\big)',
    difficulty: 'advanced',
    variables: [
      N('ax', 'مؤلفه x محور', 'Axis x', null, 0),
      N('ay', 'مؤلفه y محور', 'Axis y', null, 0),
      N('az', 'مؤلفه z محور', 'Axis z', null, 1),
      N('angle_deg', 'زاویه چرخش (درجه)', 'Angle', 'deg', 90),
      N('vx', 'مؤلفه x بردار', 'Vector x', null, 1),
      N('vy', 'مؤلفه y بردار', 'Vector y', null, 0),
      N('vz', 'مؤلفه z بردار', 'Vector z', null, 0),
    ],
    outputs: [O('qx', 'qx'), O('qy', 'qy'), O('qz', 'qz'), O('qw', 'qw'), O('rotated_x', 'بردار چرخیده x'), O('rotated_y', 'بردار چرخیده y'), O('rotated_z', 'بردار چرخیده z')],
    tests: [
      { input: { ax: 0, ay: 0, az: 1, angle_deg: 90, vx: 1, vy: 0, vz: 0 }, expected: { qx: 0, qy: 0, qz: 0.707107, qw: 0.707107, rotated_x: 0, rotated_y: 1, rotated_z: 0 } },
      { input: { ax: 0, ay: 1, az: 0, angle_deg: 180, vx: 1, vy: 0, vz: 0 }, expected: { qy: 1, qw: 0, rotated_x: -1, rotated_y: 0, rotated_z: 0 } },
    ],
    compute({ ax, ay, az, angle_deg, vx, vy, vz }) {
      const norm = Math.hypot(ax, ay, az);
      if (norm === 0) throw new Error('محور چرخش نمی‌تواند بردار صفر باشد');
      const half = deg2rad(angle_deg) / 2;
      const s = Math.sin(half) / norm;
      const qx = ax * s;
      const qy = ay * s;
      const qz = az * s;
      const qw = Math.cos(half);
      // v' = v + 2·q_xyz × (q_xyz × v + qw·v)
      const tx = 2 * (qy * vz - qz * vy);
      const ty = 2 * (qz * vx - qx * vz);
      const tz = 2 * (qx * vy - qy * vx);
      const rx = vx + qw * tx + (qy * tz - qz * ty);
      const ry = vy + qw * ty + (qz * tx - qx * tz);
      const rz = vz + qw * tz + (qx * ty - qy * tx);
      return out(
        { qx: round(qx, 6), qy: round(qy, 6), qz: round(qz, 6), qw: round(qw, 6), rotated_x: round(rx, 6), rotated_y: round(ry, 6), rotated_z: round(rz, 6) },
        [`q = (${round(qx, 4)}، ${round(qy, 4)}، ${round(qz, 4)}، ${round(qw, 4)})`, `بردار چرخیده: (${round(rx, 4)}، ${round(ry, 4)}، ${round(rz, 4)})`],
      );
    },
  }),

  // ── کامپیوتر · پردازش تصویر و صدا ───────────────────────────────────────
  make({
    id: 'image_psnr_mse',
    name_fa: 'کیفیت تصویر: MSE و PSNR',
    name_en: 'Image Quality: MSE & PSNR',
    category_path: ['کامپیوتر و اطلاعات', 'پردازش تصویر و صدا'],
    tags: ['کیفیت تصویر', 'فشرده‌سازی', 'PSNR'],
    description_fa: 'سنجش اختلاف دو تصویر (یا دو بردار پیکسل) با میانگین مربع خطا و نسبت اوج سیگنال به نویز.',
    formula_latex: '\\mathrm{PSNR}=10\\log_{10}\\frac{MAX^2}{MSE}',
    variables: [
      T('original', 'پیکسل‌های اصل (با کاما)', 'Original pixels', '0, 255'),
      T('modified', 'پیکسل‌های تغییریافته (با کاما)', 'Modified pixels', '0, 254'),
      N('max_value', 'بیشینه مقدار پیکسل', 'Max pixel value', null, 255, { min: 0 }),
    ],
    outputs: [O('mse', 'میانگین مربع خطا'), O('rmse', 'ریشه میانگین مربع خطا'), O('psnr_db', 'PSNR (dB)')],
    tests: [
      { input: { original: '0, 255', modified: '0, 254', max_value: 255 }, expected: { mse: 0.5, rmse: 0.707107 } },
      { input: { original: '10, 20', modified: '10, 20', max_value: 255 }, expected: { mse: 0, psnr_db: 100 } },
    ],
    compute({ original, modified, max_value }) {
      const a = parseList(original);
      const b = parseList(modified);
      if (a.length !== b.length) throw new Error('هر دو فهرست باید هم‌اندازه باشند');
      if (max_value <= 0) throw new Error('بیشینه مقدار پیکسل باید مثبت باشد');
      const mse = meanOf(a.map((value, index) => (value - b[index]) ** 2));
      const psnr = mse === 0 ? 100 : 10 * Math.log10(max_value ** 2 / mse);
      return out(
        { mse: round(mse, 6), rmse: round(Math.sqrt(mse), 6), psnr_db: round(psnr, 6) },
        [mse === 0 ? 'دو تصویر یکسان‌اند؛ PSNR بی‌نهایت است و ۱۰۰ dB گزارش می‌شود' : `PSNR = 10·log₁₀(${max_value}²/${round(mse, 4)}) = ${round(psnr, 4)} dB`],
      );
    },
  }),

  make({
    id: 'grayscale_histogram_stats',
    name_fa: 'آمار و آنتروپی تصویر خاکستری',
    name_en: 'Grayscale Statistics & Entropy',
    category_path: ['کامپیوتر و اطلاعات', 'پردازش تصویر و صدا'],
    tags: ['هیستوگرام', 'کنتراست', 'entropy'],
    description_fa: 'روشنایی میانگین، کنتراست (انحراف معیار) و آنتروپی هیستوگرام یک برش از پیکسل‌های خاکستری.',
    formula_latex: 'H=-\\sum_i p_i \\log_2 p_i',
    variables: [T('pixels', 'مقادیر پیکسل ۰ تا ۲۵۵ (با کاما)', 'Pixel values 0–255', '0, 0, 255, 255')],
    outputs: [O('mean', 'میانگین روشنایی'), O('std_dev', 'انحراف معیار (کنتراست)'), O('entropy_bits', 'آنتروپی (بیت)'), O('dynamic_range', 'دامنه دینامیکی'), O('pixel_count', 'تعداد پیکسل')],
    tests: [
      { input: { pixels: '0, 0, 255, 255' }, expected: { mean: 127.5, std_dev: 127.5, entropy_bits: 1, dynamic_range: 255 } },
      { input: { pixels: '100, 100, 100' }, expected: { mean: 100, std_dev: 0, entropy_bits: 0, dynamic_range: 0 } },
    ],
    compute({ pixels }) {
      const xs = parseList(pixels);
      if (xs.some((x) => x < 0 || x > 255)) throw new Error('مقادیر پیکسل باید بین ۰ و ۲۵۵ باشند');
      const mean = meanOf(xs);
      const variance = meanOf(xs.map((x) => (x - mean) ** 2));
      const counts = new Map();
      for (const x of xs) counts.set(x, (counts.get(x) ?? 0) + 1);
      let entropy = 0;
      for (const count of counts.values()) {
        const p = count / xs.length;
        entropy -= p * Math.log2(p);
      }
      return out(
        { mean: round(mean, 6), std_dev: round(Math.sqrt(variance), 6), entropy_bits: round(entropy, 6), dynamic_range: Math.max(...xs) - Math.min(...xs), pixel_count: xs.length },
        [`میانگین روشنایی = ${round(mean, 4)}`, `${counts.size} سطح خاکستری یکتا ← آنتروپی ${round(entropy, 4)} بیت بر پیکسل`],
      );
    },
  }),

  make({
    id: 'audio_file_size',
    name_fa: 'حجم و بیت‌ریت صدای خام (PCM)',
    name_en: 'Uncompressed Audio Size & Bitrate',
    category_path: ['کامپیوتر و اطلاعات', 'پردازش تصویر و صدا'],
    tags: ['صدا', 'نمونه‌برداری', 'PCM', 'bitrate'],
    description_fa: 'حجم فایل صدای فشرده‌نشده از نرخ نمونه‌برداری، عمق بیت، کانال و مدت.',
    formula_latex: '\\text{bitrate}=f_s \\times \\text{bits} \\times \\text{channels}',
    variables: [
      N('sample_rate', 'نرخ نمونه‌برداری (Hz)', 'Sample rate', null, 44100, { min: 1 }),
      N('bit_depth', 'عمق بیت', 'Bit depth', null, 16, { min: 1, max: 64 }),
      N('channels', 'تعداد کانال', 'Channels', null, 2, { min: 1, max: 32 }),
      N('duration_sec', 'مدت (ثانیه)', 'Duration (s)', 's', 60, { min: 0 }),
    ],
    outputs: [O('bitrate_bps', 'بیت‌ریت (bit/s)'), O('size_bytes', 'حجم (بایت)'), O('size_mb', 'حجم (MB)'), O('total_samples', 'تعداد نمونه در هر کانال')],
    tests: [
      { input: { sample_rate: 44100, bit_depth: 16, channels: 2, duration_sec: 60 }, expected: { bitrate_bps: 1411200, size_bytes: 10584000, size_mb: 10.584 } },
      { input: { sample_rate: 48000, bit_depth: 24, channels: 1, duration_sec: 10 }, expected: { bitrate_bps: 1152000, size_bytes: 1440000 } },
    ],
    compute({ sample_rate, bit_depth, channels, duration_sec }) {
      const bitrate = sample_rate * bit_depth * channels;
      const bytes = (bitrate * duration_sec) / 8;
      return out(
        { bitrate_bps: bitrate, size_bytes: round(bytes, 6), size_mb: round(bytes / 1e6, 6), total_samples: round(sample_rate * duration_sec, 6) },
        [`بیت‌ریت = ${sample_rate}×${bit_depth}×${channels} = ${bitrate} bit/s`, `حجم = بیت‌ریت × مدت ÷ ۸ = ${round(bytes, 0)} بایت`],
      );
    },
  }),

  // ── کامپیوتر · موسیقی و رنگ ─────────────────────────────────────────────
  make({
    id: 'music_note_frequency',
    name_fa: 'فرکانس نت از شماره MIDI',
    name_en: 'Note Frequency from MIDI Number',
    category_path: ['کامپیوتر و اطلاعات', 'موسیقی و رنگ'],
    tags: ['موسیقی', 'کوک', 'MIDI', 'pitch'],
    description_fa: 'فرکانس نت در کوک مساوی دوازده‌پرده‌ای؛ مبنا نت لا (A4 = ۴۴۰ هرتز، MIDI ۶۹).',
    formula_latex: 'f=440\\times 2^{(m-69)/12}',
    variables: [N('midi', 'شماره نت MIDI (۰ تا ۱۲۷)', 'MIDI note number', null, 69, { min: 0, max: 127 })],
    outputs: [O('frequency_hz', 'فرکانس (Hz)'), O('cents_from_a440', 'فاصله از A4 (سنت)'), O('octave', 'اکتاو'), O('pitch_class', 'کلاس گام (۰=C)')],
    tests: [
      { input: { midi: 69 }, expected: { frequency_hz: 440, cents_from_a440: 0, octave: 4 } },
      { input: { midi: 60 }, expected: { frequency_hz: 261.625565, cents_from_a440: -900, octave: 4, pitch_class: 0 } },
    ],
    compute({ midi }) {
      const m = Math.trunc(midi);
      if (m < 0 || m > 127) throw new Error('شماره نت باید بین ۰ و ۱۲۷ باشد');
      const freq = 440 * 2 ** ((m - 69) / 12);
      const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const octave = Math.floor(m / 12) - 1;
      return out(
        { frequency_hz: round(freq, 6), cents_from_a440: (m - 69) * 100, octave, pitch_class: m % 12 },
        [`نت ${names[m % 12]}${octave}`, `f = 440 × 2^((${m}−69)/12) = ${round(freq, 4)} Hz`],
      );
    },
  }),

  make({
    id: 'rgb_color_convert',
    name_fa: 'تبدیل رنگ RGB به HSL/HSV',
    name_en: 'RGB to HSL/HSV & Hex',
    category_path: ['کامپیوتر و اطلاعات', 'موسیقی و رنگ'],
    tags: ['رنگ', 'RGB', 'HSL', 'hex'],
    description_fa: 'فام، اشباع و روشنایی/ارزش یک رنگ RGB به‌همراه کد هگز آن برای وب.',
    formula_latex: 'H \\in [0,360),\\quad S,\\,L,\\,V \\in [0,100]\\%',
    variables: [
      N('r', 'قرمز R (۰ تا ۲۵۵)', 'Red', null, 255, { min: 0, max: 255 }),
      N('g', 'سبز G (۰ تا ۲۵۵)', 'Green', null, 0, { min: 0, max: 255 }),
      N('b', 'آبی B (۰ تا ۲۵۵)', 'Blue', null, 0, { min: 0, max: 255 }),
    ],
    outputs: [O('hue_deg', 'فام (درجه)'), O('saturation_hsl_pct', 'اشباع HSL (٪)'), O('lightness_pct', 'روشنایی L (٪)'), O('value_hsv_pct', 'ارزش V (٪)'), O('hex', 'کد هگز')],
    tests: [
      { input: { r: 255, g: 0, b: 0 }, expected: { hue_deg: 0, saturation_hsl_pct: 100, lightness_pct: 50, value_hsv_pct: 100, hex: '#FF0000' } },
      { input: { r: 0, g: 255, b: 0 }, expected: { hue_deg: 120, saturation_hsl_pct: 100, lightness_pct: 50, hex: '#00FF00' } },
    ],
    compute({ r, g, b }) {
      const parts = [r, g, b].map((value) => Math.trunc(value));
      if (parts.some((value) => value < 0 || value > 255)) throw new Error('هر کانال باید بین ۰ و ۲۵۵ باشد');
      const [nr, ng, nb] = parts.map((value) => value / 255);
      const max = Math.max(nr, ng, nb);
      const min = Math.min(nr, ng, nb);
      const delta = max - min;
      let hue = 0;
      if (delta > 0) {
        if (max === nr) hue = 60 * (((ng - nb) / delta) % 6);
        else if (max === ng) hue = 60 * ((nb - nr) / delta + 2);
        else hue = 60 * ((nr - ng) / delta + 4);
      }
      hue = norm360(hue);
      const lightness = (max + min) / 2;
      const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
      const hex = `#${parts.map((value) => value.toString(16).padStart(2, '0').toUpperCase()).join('')}`;
      return out(
        { hue_deg: round(hue, 6), saturation_hsl_pct: round(saturation * 100, 6), lightness_pct: round(lightness * 100, 6), value_hsv_pct: round(max * 100, 6), hex },
        [`بیشینه کانال = ${round(max, 4)} ، کمینه = ${round(min, 4)}`, `HSL(${round(hue, 1)}°, ${round(saturation * 100, 1)}٪, ${round(lightness * 100, 1)}٪) = ${hex}`],
      );
    },
  }),

  make({
    id: 'wcag_contrast_ratio',
    name_fa: 'نسبت کنتراست رنگ (WCAG)',
    name_en: 'WCAG Colour Contrast Ratio',
    category_path: ['کامپیوتر و اطلاعات', 'موسیقی و رنگ'],
    tags: ['دسترسی‌پذیری', 'کنتراست', 'WCAG', 'accessibility'],
    description_fa: 'خوانایی متن روی پس‌زمینه طبق استاندارد WCAG؛ برای متن عادی حداقل ۴.۵ و برای متن درشت ۳ لازم است.',
    formula_latex: '\\frac{L_1+0.05}{L_2+0.05}',
    variables: [
      N('fg_r', 'قرمز متن', 'Text red', null, 0, { min: 0, max: 255 }),
      N('fg_g', 'سبز متن', 'Text green', null, 0, { min: 0, max: 255 }),
      N('fg_b', 'آبی متن', 'Text blue', null, 0, { min: 0, max: 255 }),
      N('bg_r', 'قرمز پس‌زمینه', 'Background red', null, 255, { min: 0, max: 255 }),
      N('bg_g', 'سبز پس‌زمینه', 'Background green', null, 255, { min: 0, max: 255 }),
      N('bg_b', 'آبی پس‌زمینه', 'Background blue', null, 255, { min: 0, max: 255 }),
    ],
    outputs: [O('contrast_ratio', 'نسبت کنتراست'), O('luminance_fg', 'روشنایی نسبی متن'), O('luminance_bg', 'روشنایی نسبی پس‌زمینه')],
    tests: [
      { input: { fg_r: 0, fg_g: 0, fg_b: 0, bg_r: 255, bg_g: 255, bg_b: 255 }, expected: { contrast_ratio: 21, luminance_fg: 0, luminance_bg: 1 } },
      { input: { fg_r: 128, fg_g: 128, fg_b: 128, bg_r: 128, bg_g: 128, bg_b: 128 }, expected: { contrast_ratio: 1 } },
    ],
    compute(input) {
      const linear = (value) => {
        const c = value / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };
      const luminance = (r, g, b) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
      const lf = luminance(input.fg_r, input.fg_g, input.fg_b);
      const lb = luminance(input.bg_r, input.bg_g, input.bg_b);
      const ratio = (Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05);
      return out(
        { contrast_ratio: round(ratio, 6), luminance_fg: round(lf, 6), luminance_bg: round(lb, 6) },
        [`L متن = ${round(lf, 4)} ، L پس‌زمینه = ${round(lb, 4)}`, `کنتراست ${round(ratio, 2)}:1 ← ${ratio >= 7 ? 'AAA ✓' : ratio >= 4.5 ? 'AA ✓' : ratio >= 3 ? 'فقط متن درشت' : 'ناکافی'}`],
      );
    },
  }),

  make({
    id: 'tempo_delay_times',
    name_fa: 'زمان ضرب و تأخیر همگام با تمپو',
    name_en: 'Tempo & Synced Delay Times',
    category_path: ['کامپیوتر و اطلاعات', 'موسیقی و رنگ'],
    tags: ['تمپو', 'BPM', 'delay', 'موسیقی'],
    description_fa: 'مدت نت‌های سیاه، چنگ و دولاچنگ بر حسب میلی‌ثانیه برای تنظیم افکت دیلی روی ضرب آهنگ.',
    formula_latex: 't_{\\text{quarter}}=\\frac{60000}{\\mathrm{BPM}}',
    variables: [N('bpm', 'تمپو (ضرب در دقیقه)', 'Tempo (BPM)', null, 120, { min: 1, max: 400 })],
    outputs: [O('quarter_ms', 'دیرند نت سیاه (ms)'), O('eighth_ms', 'نت چنگ (ms)'), O('sixteenth_ms', 'دولاچنگ (ms)'), O('dotted_eighth_ms', 'چنگ نقطه‌دار (ms)'), O('beats_per_second', 'ضرب در ثانیه (Hz)')],
    tests: [
      { input: { bpm: 120 }, expected: { quarter_ms: 500, eighth_ms: 250, dotted_eighth_ms: 375, beats_per_second: 2 } },
      { input: { bpm: 60 }, expected: { quarter_ms: 1000, eighth_ms: 500, dotted_eighth_ms: 750, beats_per_second: 1 } },
    ],
    compute({ bpm }) {
      if (bpm <= 0) throw new Error('تمپو باید مثبت باشد');
      const quarter = 60000 / bpm;
      return out(
        { quarter_ms: round(quarter, 6), eighth_ms: round(quarter / 2, 6), sixteenth_ms: round(quarter / 4, 6), dotted_eighth_ms: round(quarter * 0.75, 6), beats_per_second: round(bpm / 60, 6) },
        [`هر ضرب = 60000/${bpm} = ${round(quarter, 2)} ms`, `دیلی چنگ نقطه‌دار (افکت کلاسیک گیتار) = ${round(quarter * 0.75, 2)} ms`],
      );
    },
  }),

  // ── ریاضیات · محاسبات عددی ──────────────────────────────────────────────
  make({
    id: 'rk4_decay_ode',
    name_fa: 'حل عددی واپاشی با رانگه–کوتای مرتبه ۴',
    name_en: 'RK4 for Exponential Decay ODE',
    category_path: ['ریاضیات', 'محاسبات عددی'],
    tags: ['معادله دیفرانسیل', 'رانگه کوتا', 'ODE', 'RK4'],
    description_fa: 'حل گام‌به‌گام y′=−ky با روش RK4 و مقایسه مستقیم با جواب دقیق نمایی.',
    formula_latex: 'y\'=-ky,\\qquad y_{n+1}=y_n+\\frac{h}{6}(k_1+2k_2+2k_3+k_4)',
    difficulty: 'advanced',
    variables: [
      N('y0', 'مقدار اولیه y₀', 'Initial value', null, 1),
      N('k', 'ثابت واپاشی k', 'Decay constant', null, 1, { min: 0 }),
      N('t_end', 'زمان پایانی', 'End time', null, 1, { min: 0 }),
      N('steps', 'تعداد گام', 'Steps', null, 100, { min: 1, max: 100000 }),
    ],
    outputs: [O('y_rk4', 'تقریب RK4'), O('y_exact', 'جواب دقیق'), O('abs_error', 'خطای مطلق')],
    tests: [
      { input: { y0: 1, k: 1, t_end: 1, steps: 100 }, expected: { y_exact: 0.367879, y_rk4: 0.367879 } },
      { input: { y0: 100, k: 0.5, t_end: 2, steps: 50 }, expected: { y_exact: 36.787944 } },
    ],
    compute({ y0, k, t_end, steps }) {
      const n = Math.trunc(steps);
      if (n < 1 || t_end < 0 || k < 0) throw new Error('گام‌ها، زمان و ثابت واپاشی باید معتبر باشند');
      const h = t_end / n;
      const f = (y) => -k * y;
      let y = y0;
      for (let i = 0; i < n; i += 1) {
        const k1 = f(y);
        const k2 = f(y + (h / 2) * k1);
        const k3 = f(y + (h / 2) * k2);
        const k4 = f(y + h * k3);
        y += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
      }
      const exact = y0 * Math.exp(-k * t_end);
      return out(
        { y_rk4: round(y, 6), y_exact: round(exact, 6), abs_error: round(Math.abs(y - exact), 6) },
        [`گام زمانی h = ${round(h, 6)} در ${n} گام`, `RK4: ${round(y, 6)} در برابر دقیق ${round(exact, 6)}`],
      );
    },
  }),

  make({
    id: 'lagrange_interpolation',
    name_fa: 'درون‌یابی لاگرانژ (سه نقطه)',
    name_en: 'Lagrange Interpolation (3 Points)',
    category_path: ['ریاضیات', 'محاسبات عددی'],
    tags: ['درون‌یابی', 'چندجمله‌ای', 'interpolation'],
    description_fa: 'چندجمله‌ای درجه دوی گذرنده از سه نقطه و مقدار آن در نقطه دلخواه.',
    formula_latex: 'P(x)=\\sum_i y_i \\prod_{j\\ne i} \\frac{x-x_j}{x_i-x_j}',
    difficulty: 'intermediate',
    variables: [
      N('x1', 'x نقطه اول', 'x₁', null, 0),
      N('y1', 'y نقطه اول', 'y₁', null, 1),
      N('x2', 'x نقطه دوم', 'x₂', null, 1),
      N('y2', 'y نقطه دوم', 'y₂', null, 3),
      N('x3', 'x نقطه سوم', 'x₃', null, 2),
      N('y3', 'y نقطه سوم', 'y₃', null, 9),
      N('x_eval', 'نقطه ارزیابی x', 'Evaluate at', null, 1.5),
    ],
    outputs: [O('interpolated_y', 'مقدار درون‌یابی‌شده P(x)'), O('basis1', 'پایه لاگرانژ L₁(x)'), O('basis2', 'پایه لاگرانژ L₂(x)'), O('basis3', 'پایه لاگرانژ L₃(x)')],
    tests: [
      { input: { x1: 0, y1: 1, x2: 1, y2: 3, x3: 2, y3: 9, x_eval: 1.5 }, expected: { interpolated_y: 5.5 } },
      { input: { x1: 1, y1: 1, x2: 2, y2: 4, x3: 3, y3: 9, x_eval: 2.5 }, expected: { interpolated_y: 6.25 } },
    ],
    compute({ x1, y1, x2, y2, x3, y3, x_eval }) {
      const xs = [x1, x2, x3];
      const ys = [y1, y2, y3];
      if (new Set(xs).size !== 3) throw new Error('xها باید متمایز باشند');
      const basis = xs.map((xi, i) => {
        let value = 1;
        xs.forEach((xj, j) => {
          if (i !== j) value *= (x_eval - xj) / (xi - xj);
        });
        return value;
      });
      const result = basis.reduce((acc, li, i) => acc + li * ys[i], 0);
      return out(
        { interpolated_y: round(result, 6), basis1: round(basis[0], 6), basis2: round(basis[1], 6), basis3: round(basis[2], 6) },
        [`P(x) = Σ yᵢLᵢ(x)`, `P(${x_eval}) = ${round(result, 6)}`],
      );
    },
  }),

  make({
    id: 'newton_sqrt_iterations',
    name_fa: 'جذرگیری با روش نیوتن',
    name_en: 'Square Root by Newton Iteration',
    category_path: ['ریاضیات', 'محاسبات عددی'],
    tags: ['ریشه‌یابی', 'نیوتن', 'جذر', 'newton method'],
    description_fa: 'همان الگوریتم بابلی: میانگین حدس و a تقسیم بر حدس، با همگرایی درجه دو.',
    formula_latex: 'x_{n+1}=\\frac{1}{2}\\Big(x_n+\\frac{a}{x_n}\\Big)',
    variables: [
      N('a', 'عدد زیر رادیکال a', 'Radicand a', null, 2, { min: 0 }),
      N('x0', 'حدس اولیه x₀', 'Initial guess', null, 1, { min: 0 }),
      N('iterations', 'تعداد تکرار', 'Iterations', null, 5, { min: 1, max: 1000 }),
    ],
    outputs: [O('sqrt_approx', 'تقریب جذر'), O('true_sqrt', 'جذر ماشین'), O('abs_error', 'خطای مطلق'), O('residual', 'باقیمانده x²−a')],
    tests: [
      { input: { a: 2, x0: 1, iterations: 5 }, expected: { sqrt_approx: 1.414214, true_sqrt: 1.414214 } },
      { input: { a: 9, x0: 1, iterations: 6 }, expected: { sqrt_approx: 3 } },
    ],
    compute({ a, x0, iterations }) {
      if (a < 0 || x0 <= 0) throw new Error('a نامنفی و حدس اولیه مثبت باشد');
      const n = Math.trunc(iterations);
      let x = x0;
      const trace = [];
      for (let i = 0; i < n; i += 1) {
        x = (x + a / x) / 2;
        if (i < 4 || i === n - 1) trace.push(`تکرار ${i + 1}: x = ${round(x, 8)}`);
      }
      return out(
        { sqrt_approx: round(x, 6), true_sqrt: round(Math.sqrt(a), 6), abs_error: round(Math.abs(x - Math.sqrt(a)), 6), residual: round(x * x - a, 6) },
        [...trace, `در هر تکرار تعداد ارقام درست تقریباً دوبرابر می‌شود`],
      );
    },
  }),

  // ── کامپیوتر · منطق فازی ─────────────────────────────────────────────────
  make({
    id: 'fuzzy_membership',
    name_fa: 'توابع عضویت مثلثی و گاوسی',
    name_en: 'Triangular & Gaussian Membership',
    category_path: ['کامپیوتر و اطلاعات', 'منطق فازی'],
    tags: ['فازی', 'عضویت', 'fuzzy', 'membership'],
    description_fa: 'درجه تعلق مقدار x به یک مجموعه فازی با دو شکل کلاسیک تابع عضویت.',
    formula_latex: '\\mu_{\\triangle}(x)=\\max\\Big(0,\\min\\big(\\tfrac{x-a}{b-a},\\tfrac{c-x}{c-b}\\big)\\Big)',
    variables: [
      N('x', 'مقدار ورودی x', 'Input x', null, 5),
      N('a', 'پای چپ مثلث a', 'Left foot a', null, 0),
      N('b', 'قله مثلث / مرکز گاوسی b', 'Peak / centre b', null, 5),
      N('c', 'پای راست مثلث c', 'Right foot c', null, 10),
      N('sigma', 'پهنای گاوسی σ', 'Gaussian σ', null, 2, { min: 0 }),
    ],
    outputs: [O('triangular', 'عضویت مثلثی'), O('gaussian', 'عضویت گاوسی')],
    tests: [
      { input: { x: 5, a: 0, b: 5, c: 10, sigma: 2 }, expected: { triangular: 1, gaussian: 1 } },
      { input: { x: 2.5, a: 0, b: 5, c: 10, sigma: 2 }, expected: { triangular: 0.5, gaussian: 0.457833 } },
    ],
    compute({ x, a, b, c, sigma }) {
      if (!(a < b && b < c)) throw new Error('باید a < b < c باشد');
      if (sigma <= 0) throw new Error('σ باید مثبت باشد');
      const triangular = Math.max(0, Math.min((x - a) / (b - a), (c - x) / (c - b)));
      const gaussian = Math.exp(-((x - b) ** 2) / (2 * sigma * sigma));
      return out(
        { triangular: round(triangular, 6), gaussian: round(gaussian, 6) },
        [`مثلثی: روی بازوی ${x <= b ? 'چپ' : 'راست'} قرار دارد ← ${round(triangular, 4)}`, `گاوسی: e^{−(x−b)²/2σ²} = ${round(gaussian, 4)}`],
      );
    },
  }),

  make({
    id: 'fuzzy_tnorm_operations',
    name_fa: 'عملگرهای فازی (t-نرم و t-هم‌نرم)',
    name_en: 'Fuzzy t-Norm & t-Conorm',
    category_path: ['کامپیوتر و اطلاعات', 'منطق فازی'],
    tags: ['فازی', 'اشتراک و اجتماع', 't-norm'],
    description_fa: 'تعمیم «و» و «یا» منطقی روی درجه‌های عضویت: مینیمم، ضرب، ماکزیمم و جمع احتمالاتی.',
    formula_latex: 'a \\oplus b = a + b - ab',
    variables: [N('mu_a', 'عضویت اول μA (۰ تا ۱)', 'μA', null, 0.7, { min: 0, max: 1 }), N('mu_b', 'عضویت دوم μB (۰ تا ۱)', 'μB', null, 0.4, { min: 0, max: 1 })],
    outputs: [O('and_min', 'و (مینیمم)'), O('and_product', 'و (ضرب)'), O('or_max', 'یا (ماکزیمم)'), O('or_probabilistic', 'یا (جمع احتمالاتی)'), O('not_a', 'متمم اول')],
    tests: [
      { input: { mu_a: 0.7, mu_b: 0.4 }, expected: { and_min: 0.4, and_product: 0.28, or_max: 0.7, or_probabilistic: 0.82, not_a: 0.3 } },
      { input: { mu_a: 1, mu_b: 0 }, expected: { and_min: 0, and_product: 0, or_max: 1, or_probabilistic: 1, not_a: 0 } },
    ],
    compute({ mu_a, mu_b }) {
      if (mu_a < 0 || mu_a > 1 || mu_b < 0 || mu_b > 1) throw new Error('درجه عضویت باید بین ۰ و ۱ باشد');
      return out(
        { and_min: round(Math.min(mu_a, mu_b), 6), and_product: round(mu_a * mu_b, 6), or_max: round(Math.max(mu_a, mu_b), 6), or_probabilistic: round(mu_a + mu_b - mu_a * mu_b, 6), not_a: round(1 - mu_a, 6) },
        [`A∩B با مینیمم = ${Math.min(mu_a, mu_b)} و با ضرب = ${round(mu_a * mu_b, 4)}`, `A∪B با جمع احتمالاتی = ${round(mu_a + mu_b - mu_a * mu_b, 4)}`],
      );
    },
  }),

  make({
    id: 'fuzzy_centroid_defuzz',
    name_fa: 'غیرفازی‌سازی به روش مرکز ثقل',
    name_en: 'Centroid Defuzzification',
    category_path: ['کامپیوتر و اطلاعات', 'منطق فازی'],
    tags: ['فازی', 'کنترلر فازی', 'defuzzification'],
    description_fa: 'تبدیل خروجی فازی (چند تک‌مقدار با درجه عضویت) به یک عدد قطعی با میانگین وزن‌دار.',
    formula_latex: 'z^{*}=\\frac{\\sum \\mu_i z_i}{\\sum \\mu_i}',
    variables: [T('singletons', 'مقادیر خروجی (با کاما)', 'Output singletons', '10, 20, 30'), T('weights', 'درجه‌های عضویت (با کاما)', 'Membership degrees', '0.2, 0.5, 0.3')],
    outputs: [O('centroid', 'خروجی قطعی (مرکز ثقل)'), O('weight_sum', 'مجموع وزن‌ها'), O('max_membership_value', 'خروجی با بیشترین عضویت')],
    tests: [
      { input: { singletons: '10, 20, 30', weights: '0.2, 0.5, 0.3' }, expected: { centroid: 21, weight_sum: 1, max_membership_value: 20 } },
      { input: { singletons: '0, 100', weights: '1, 1' }, expected: { centroid: 50, weight_sum: 2 } },
    ],
    compute({ singletons, weights }) {
      const zs = parseList(singletons);
      const ws = parseList(weights);
      if (zs.length !== ws.length) throw new Error('تعداد مقادیر و وزن‌ها باید برابر باشد');
      if (ws.some((w) => w < 0 || w > 1)) throw new Error('درجه عضویت باید بین ۰ و ۱ باشد');
      const weightSum = ws.reduce((acc, w) => acc + w, 0);
      if (weightSum <= 0) throw new Error('مجموع وزن‌ها باید مثبت باشد');
      const centroid = zs.reduce((acc, z, index) => acc + z * ws[index], 0) / weightSum;
      const maxIndex = ws.indexOf(Math.max(...ws));
      return out(
        { centroid: round(centroid, 6), weight_sum: round(weightSum, 6), max_membership_value: zs[maxIndex] },
        [`Σμᵢzᵢ = ${round(zs.reduce((acc, z, index) => acc + z * ws[index], 0), 4)} و Σμᵢ = ${round(weightSum, 4)}`, `خروجی قطعی = ${round(centroid, 4)}`],
      );
    },
  }),

  // ── ریاضیات · نظریه صف ──────────────────────────────────────────────────
  make({
    id: 'queue_mm1',
    name_fa: 'صف M/M/1 و قانون لیتل',
    name_en: 'M/M/1 Queue & Little’s Law',
    category_path: ['ریاضیات', 'نظریه صف'],
    tags: ['صف', 'زمان انتظار', 'queue', 'M/M/1'],
    description_fa: 'میانگین تعداد مشتری و زمان انتظار در ساده‌ترین صف تک‌خدمت‌دهنده با ورود پواسنی.',
    formula_latex: '\\rho=\\frac{\\lambda}{\\mu},\\qquad W=\\frac{1}{\\mu-\\lambda},\\qquad L=\\lambda W',
    difficulty: 'intermediate',
    variables: [
      N('lambda', 'نرخ ورود λ (در واحد زمان)', 'Arrival rate λ', null, 8, { min: 0 }),
      N('mu', 'نرخ خدمت μ (در واحد زمان)', 'Service rate μ', null, 10, { min: 0 }),
    ],
    outputs: [O('utilization', 'بهره‌برداری ρ'), O('mean_number', 'میانگین تعداد در سامانه L'), O('mean_queue', 'میانگین طول صف Lq'), O('mean_wait', 'میانگین کل زمان W'), O('mean_queue_wait', 'میانگین انتظار در صف Wq'), O('prob_empty', 'احتمال خالی بودن P₀')],
    tests: [
      { input: { lambda: 8, mu: 10 }, expected: { utilization: 0.8, mean_number: 4, mean_queue: 3.2, mean_wait: 0.5, mean_queue_wait: 0.4, prob_empty: 0.2 } },
      { input: { lambda: 2, mu: 4 }, expected: { utilization: 0.5, mean_number: 1, mean_queue: 0.5, mean_wait: 0.5, mean_queue_wait: 0.25 } },
    ],
    compute({ lambda, mu }) {
      if (lambda < 0 || mu <= 0) throw new Error('نرخ خدمت مثبت و نرخ ورود نامنفی باشد');
      if (lambda >= mu) throw new Error('صف ناپایدار است: نرخ ورود باید کمتر از نرخ خدمت باشد');
      const rho = lambda / mu;
      const wait = 1 / (mu - lambda);
      return out(
        { utilization: round(rho, 6), mean_number: round(rho / (1 - rho), 6), mean_queue: round((rho * rho) / (1 - rho), 6), mean_wait: round(wait, 6), mean_queue_wait: round(wait - 1 / mu, 6), prob_empty: round(1 - rho, 6) },
        [`ρ = λ/μ = ${round(rho, 4)}`, `قانون لیتل: L = λW = ${lambda}×${round(wait, 4)} = ${round(lambda * wait, 4)}`],
      );
    },
  }),

  make({
    id: 'erlang_b_blocking',
    name_fa: 'احتمال مسدودی ارلانگ B',
    name_en: 'Erlang B Blocking Probability',
    category_path: ['ریاضیات', 'نظریه صف'],
    tags: ['ارلانگ', 'ظرفیت تماس', 'Erlang B', 'blocking'],
    description_fa: 'احتمال رد شدن درخواست وقتی همه N خدمت‌دهنده مشغول‌اند؛ مبنای ظرفیت‌سنجی مراکز تماس و شبکه‌ها.',
    formula_latex: 'B(0)=1,\\qquad B(n)=\\frac{A\\,B(n-1)}{n+A\\,B(n-1)}',
    difficulty: 'advanced',
    variables: [
      N('traffic_erlang', 'ترافیک عرضه‌شده A (ارلانگ)', 'Offered traffic A', null, 2, { min: 0 }),
      N('servers', 'تعداد خدمت‌دهنده N', 'Servers N', null, 2, { min: 1, max: 10000 }),
    ],
    outputs: [O('blocking_probability', 'احتمال مسدودی'), O('carried_traffic', 'ترافیک عبوری (ارلانگ)'), O('occupancy', 'اشغال میانگین هر خدمت‌دهنده')],
    tests: [
      { input: { traffic_erlang: 1, servers: 1 }, expected: { blocking_probability: 0.5, carried_traffic: 0.5, occupancy: 0.5 } },
      { input: { traffic_erlang: 2, servers: 2 }, expected: { blocking_probability: 0.4, carried_traffic: 1.2, occupancy: 0.6 } },
    ],
    compute({ traffic_erlang, servers }) {
      const n = Math.trunc(servers);
      if (traffic_erlang < 0 || n < 1) throw new Error('ترافیک نامنفی و حداقل یک خدمت‌دهنده لازم است');
      let b = 1;
      for (let i = 1; i <= n; i += 1) b = (traffic_erlang * b) / (i + traffic_erlang * b);
      const carried = traffic_erlang * (1 - b);
      return out(
        { blocking_probability: round(b, 6), carried_traffic: round(carried, 6), occupancy: round(carried / n, 6) },
        [`بازگشت ارلانگ تا N=${n}: B = ${round(b, 6)}`, `ترافیک عبوری = A(1−B) = ${round(carried, 4)} ارلانگ`],
      );
    },
  }),

  // ── زمین و محیط · ناوبری ────────────────────────────────────────────────
  make({
    id: 'initial_bearing_distance',
    name_fa: 'سمت اولیه و فاصله دایره عظیمه',
    name_en: 'Initial Bearing & Great-Circle Distance',
    category_path: ['زمین و محیط', 'ناوبری'],
    tags: ['ناوبری', 'سمت', 'GPS', 'bearing'],
    description_fa: 'جهت شروع حرکت روی کوتاه‌ترین مسیر سطح زمین بین دو مختصات جغرافیایی و طول آن مسیر.',
    formula_latex: '\\theta=\\operatorname{atan2}(\\sin\\Delta\\lambda\\cos\\varphi_2,\\; \\cos\\varphi_1\\sin\\varphi_2-\\sin\\varphi_1\\cos\\varphi_2\\cos\\Delta\\lambda)',
    difficulty: 'intermediate',
    variables: [
      N('lat1', 'عرض مبدأ (درجه)', 'Start latitude', 'deg', 0, { min: -90, max: 90 }),
      N('lon1', 'طول مبدأ (درجه)', 'Start longitude', 'deg', 0, { min: -180, max: 180 }),
      N('lat2', 'عرض مقصد (درجه)', 'End latitude', 'deg', 0, { min: -90, max: 90 }),
      N('lon2', 'طول مقصد (درجه)', 'End longitude', 'deg', 90, { min: -180, max: 180 }),
    ],
    outputs: [O('bearing_deg', 'سمت اولیه (درجه)'), O('back_azimuth_deg', 'سمت بازگشت تقریبی'), O('distance_km', 'فاصله دایره عظیمه (km)')],
    tests: [
      { input: { lat1: 0, lon1: 0, lat2: 0, lon2: 90 }, expected: { bearing_deg: 90, back_azimuth_deg: 270 } },
      { input: { lat1: 0, lon1: 0, lat2: 90, lon2: 0 }, expected: { bearing_deg: 0 } },
    ],
    compute({ lat1, lon1, lat2, lon2 }) {
      const R = 6371;
      const phi1 = deg2rad(lat1);
      const phi2 = deg2rad(lat2);
      const dLambda = deg2rad(lon2 - lon1);
      const y = Math.sin(dLambda) * Math.cos(phi2);
      const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
      const bearing = norm360(rad2deg(Math.atan2(y, x)));
      const dPhi = deg2rad(lat2 - lat1);
      const hav = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
      const distance = 2 * R * Math.asin(Math.sqrt(Math.min(1, hav)));
      return out(
        { bearing_deg: round(bearing, 6), back_azimuth_deg: round(norm360(bearing + 180), 6), distance_km: round(distance, 6) },
        [`سمت اولیه = ${round(bearing, 4)}°`, `فاصله روی کره R=6371 km: ${round(distance, 4)} km`],
      );
    },
  }),

  make({
    id: 'destination_point',
    name_fa: 'نقطه مقصد از سمت و فاصله',
    name_en: 'Destination Point from Bearing & Distance',
    category_path: ['زمین و محیط', 'ناوبری'],
    tags: ['ناوبری', 'مختصات مقصد', 'destination'],
    description_fa: 'مختصاتی که پس از پیمودن فاصله مشخص در سمت داده‌شده روی سطح زمین به آن می‌رسیم.',
    formula_latex: '\\varphi_2=\\arcsin(\\sin\\varphi_1\\cos\\delta+\\cos\\varphi_1\\sin\\delta\\cos\\theta)',
    difficulty: 'intermediate',
    variables: [
      N('lat', 'عرض شروع (درجه)', 'Start latitude', 'deg', 0, { min: -90, max: 90 }),
      N('lon', 'طول شروع (درجه)', 'Start longitude', 'deg', 0, { min: -180, max: 180 }),
      N('bearing_deg', 'سمت حرکت (درجه)', 'Bearing', 'deg', 90),
      N('distance_km', 'فاصله (km)', 'Distance', 'km', 10007.543398, { min: 0 }),
    ],
    outputs: [O('dest_lat', 'عرض مقصد (درجه)'), O('dest_lon', 'طول مقصد (درجه)'), O('angular_distance_deg', 'فاصله زاویه‌ای (درجه)')],
    tests: [
      { input: { lat: 0, lon: 0, bearing_deg: 90, distance_km: 10007.543398 }, expected: { dest_lat: 0, dest_lon: 90 } },
      { input: { lat: 0, lon: 0, bearing_deg: 0, distance_km: 10007.543398 }, expected: { dest_lat: 90 } },
    ],
    compute({ lat, lon, bearing_deg, distance_km }) {
      if (distance_km < 0) throw new Error('فاصله نمی‌تواند منفی باشد');
      const R = 6371;
      const delta = distance_km / R;
      const theta = deg2rad(bearing_deg);
      const phi1 = deg2rad(lat);
      const lambda1 = deg2rad(lon);
      const sinPhi2 = Math.sin(phi1) * Math.cos(delta) + Math.cos(phi1) * Math.sin(delta) * Math.cos(theta);
      const phi2 = Math.asin(Math.max(-1, Math.min(1, sinPhi2)));
      const lambda2 = lambda1 + Math.atan2(Math.sin(theta) * Math.sin(delta) * Math.cos(phi1), Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2));
      const destLon = ((rad2deg(lambda2) + 540) % 360) - 180;
      return out(
        { dest_lat: round(rad2deg(phi2), 6), dest_lon: round(destLon, 6), angular_distance_deg: round(rad2deg(delta), 6) },
        [`فاصله زاویه‌ای δ = d/R = ${round(rad2deg(delta), 4)}°`, `مقصد: (${round(rad2deg(phi2), 4)}°، ${round(destLon, 4)}°)`],
      );
    },
  }),

  make({
    id: 'wind_triangle',
    name_fa: 'مثلث باد (هدینگ و سرعت زمینی)',
    name_en: 'Wind Triangle (Heading & Ground Speed)',
    category_path: ['زمین و محیط', 'ناوبری'],
    tags: ['هوانوردی', 'باد', 'wind triangle', 'heading'],
    description_fa: 'هدینگی که خلبان باید بگیرد تا روی مسیر مطلوب بماند و سرعت واقعی نسبت به زمین.',
    formula_latex: '\\sin(\\mathrm{WCA})=-\\frac{W}{V}\\sin(\\text{wind}-\\text{course})',
    difficulty: 'advanced',
    variables: [
      N('course_deg', 'مسیر مطلوب (درجه)', 'Desired course', 'deg', 90),
      N('tas', 'سرعت هوایی واقعی TAS', 'True airspeed', null, 100, { min: 0 }),
      N('wind_from_deg', 'جهت وزش باد از (درجه)', 'Wind from', 'deg', 270),
      N('wind_speed', 'سرعت باد (هم‌واحد TAS)', 'Wind speed', null, 20, { min: 0 }),
    ],
    outputs: [O('heading_deg', 'هدینگ لازم (درجه)'), O('ground_speed', 'سرعت زمینی'), O('correction_deg', 'زاویه تصحیح باد (درجه)'), O('along_track_wind', 'مؤلفه باد روی مسیر (+ یعنی باد موافق)')],
    tests: [
      { input: { course_deg: 90, tas: 100, wind_from_deg: 270, wind_speed: 20 }, expected: { heading_deg: 90, ground_speed: 120, correction_deg: 0 } },
      { input: { course_deg: 0, tas: 100, wind_from_deg: 270, wind_speed: 20 }, expected: { heading_deg: 348.463041, ground_speed: 97.97959 } },
    ],
    compute({ course_deg, tas, wind_from_deg, wind_speed }) {
      if (tas <= 0) throw new Error('سرعت هوایی باید مثبت باشد');
      if (wind_speed < 0) throw new Error('سرعت باد نمی‌تواند منفی باشد');
      const toward = norm360(wind_from_deg + 180);
      const rel = deg2rad(toward - course_deg);
      const sinCorrection = -(wind_speed / tas) * Math.sin(rel);
      if (Math.abs(sinCorrection) > 1) throw new Error('باد عرضی از سرعت هوایی بیشتر است؛ ماندن روی مسیر ناممکن است');
      const correction = Math.asin(sinCorrection);
      const groundSpeed = tas * Math.cos(correction) + wind_speed * Math.cos(rel);
      return out(
        { heading_deg: round(norm360(course_deg + rad2deg(correction)), 6), ground_speed: round(groundSpeed, 6), correction_deg: round(rad2deg(correction), 6), along_track_wind: round(wind_speed * Math.cos(rel), 6) },
        [`باد به سمت ${round(toward, 1)}° می‌وزد`, `WCA = ${round(rad2deg(correction), 4)}° ← هدینگ ${round(norm360(course_deg + rad2deg(correction)), 4)}°`, `سرعت زمینی = ${round(groundSpeed, 4)}`],
      );
    },
  }),
];
