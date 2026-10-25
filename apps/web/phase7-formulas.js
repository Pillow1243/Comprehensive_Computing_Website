// Phase 7 — a cross-discipline pack that fills the gaps left by phases 1–6:
// polar/rectangular geometry, eigenvalues, combinatorics and means (maths),
// cooling, critical angle, spring resonance, solenoids, photons and mixtures
// (physics), empirical formulae and Raoult's law (chemistry), torsion,
// buckling, bridges and convection (engineering), bond pricing and real
// returns (finance), kidney function and body composition (health), and the
// atmosphere/seismology set for Earth sciences.
import { make, N, T, O, round, out, parseList, CONST } from './formula-kit.js';

const { h, c, mu0, R } = CONST;
const OMEGA_EARTH = 7.2921159e-5;
const STEFAN = 5.670374419e-8;

const boolean = (name, label_fa, label_en, def = false) => ({
  name,
  label_fa,
  label_en,
  type: 'boolean',
  unit: null,
  default: def,
  required: true,
});

/** Formats a stoichiometric ratio the way a formula does: 1 is implicit. */
const subscript = (value) => (Math.abs(value - 1) < 1e-9 ? '' : String(round(value, 4)));

export const PHASE7_FORMULAS = [
  // ── ریاضیات ──────────────────────────────────────────────────────────────
  make({
    id: 'polar_rectangular',
    name_fa: 'تبدیل مختصات قطبی و دکارتی',
    name_en: 'Polar ↔ Rectangular Coordinates',
    category_path: ['ریاضیات', 'هندسه و مثلثات'],
    tags: ['مختصات قطبی', 'دکارتی', 'polar'],
    description_fa: 'تبدیل طول و زاویه قطبی به مختصات دکارتی و بازگشت آن، همراه با فاصله از مبدأ.',
    formula_latex: 'x=r\\cos\\theta,\\quad y=r\\sin\\theta,\\quad r=\\sqrt{x^{2}+y^{2}}',
    variables: [N('r', 'شعاع (r)', 'Radius', null, 5, { min: 0 }), N('theta', 'زاویه (درجه)', 'Angle', 'deg', 53.130102)],
    outputs: [O('x', 'مختصه x'), O('y', 'مختصه y'), O('magnitude', 'فاصله از مبدأ'), O('theta_deg', 'زاویه استاندارد', 'deg')],
    tests: [
      { input: { r: 5, theta: 53.130102 }, expected: { x: 3, y: 4, magnitude: 5, theta_deg: 53.130102 } },
      { input: { r: 2, theta: 90 }, expected: { x: 1.2246468e-16, y: 2, magnitude: 2, theta_deg: 90 } },
    ],
    compute({ r, theta }) {
      if (r < 0) throw new Error('شعاع باید نامنفی باشد');
      const rad = (theta * Math.PI) / 180;
      const x = r * Math.cos(rad);
      const y = r * Math.sin(rad);
      return out(
        { x: round(x, 6), y: round(y, 6), magnitude: round(Math.hypot(x, y), 6), theta_deg: round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360, 6) },
        [`x = r·cosθ = ${r} × cos(${theta}°) = ${round(x, 4)}`, `y = r·sinθ = ${round(y, 4)}`, `r = √(x²+y²) = ${round(Math.hypot(x, y), 4)}`],
      );
    },
  }),

  make({
    id: 'matrix_eigen_2x2',
    name_fa: 'مقادیر ویژه ماتریس ۲×۲',
    name_en: 'Eigenvalues of a 2×2 Matrix',
    category_path: ['ریاضیات', 'جبر خطی'],
    tags: ['مقدار ویژه', 'دترمینان', 'eigenvalue'],
    description_fa: 'مقادیر ویژه یک ماتریس ۲×۲ از طریق رد و دترمینان، با بررسی وجود جواب حقیقی.',
    formula_latex: '\\lambda_{1,2}=\\frac{\\operatorname{tr}A\\pm\\sqrt{(\\operatorname{tr}A)^{2}-4\\det A}}{2}',
    variables: [N('a', 'درایه a₁₁', 'a₁₁', null, 2), N('b', 'درایه a₁₂', 'a₁₂', null, 1), N('c', 'درایه a₂₁', 'a₂₁', null, 1), N('d', 'درایه a₂₂', 'a₂₂', null, 2)],
    outputs: [O('lambda1', 'مقدار ویژه بزرگ‌تر'), O('lambda2', 'مقدار ویژه کوچک‌تر'), O('trace', 'رد ماتریس'), O('determinant', 'دترمینان')],
    tests: [
      { input: { a: 2, b: 1, c: 1, d: 2 }, expected: { lambda1: 3, lambda2: 1, trace: 4, determinant: 3 } },
      { input: { a: 4, b: 1, c: 2, d: 3 }, expected: { lambda1: 5, lambda2: 2, trace: 7, determinant: 10 } },
    ],
    compute({ a, b, c, d }) {
      const trace = a + d;
      const determinant = a * d - b * c;
      const discriminant = trace * trace - 4 * determinant;
      if (discriminant < 0) throw new Error('این ماتریس مقدار ویژه حقیقی ندارد (دلتا منفی است)');
      const root = Math.sqrt(discriminant);
      return out(
        { lambda1: round((trace + root) / 2, 6), lambda2: round((trace - root) / 2, 6), trace: round(trace, 6), determinant: round(determinant, 6) },
        [`tr A = a + d = ${trace}`, `det A = ad − bc = ${determinant}`, `Δ = (tr A)² − 4 det A = ${round(discriminant, 6)}`, `λ = (tr A ± √Δ)/2`],
      );
    },
  }),

  make({
    id: 'ncr_npr',
    name_fa: 'ترکیب و جایگشت',
    name_en: 'Combinations & Permutations',
    category_path: ['ریاضیات', 'ریاضیات گسسته'],
    tags: ['ترکیب', 'جایگشت', 'nCr'],
    description_fa: 'تعداد حالت‌های انتخاب r از n شیء، با و بدون اهمیت ترتیب.',
    formula_latex: '{}_nC_r=\\frac{n!}{r!\\,(n-r)!},\\qquad {}_nP_r=\\frac{n!}{(n-r)!}',
    variables: [N('n', 'تعداد کل (n)', 'n', null, 10, { min: 0, max: 200 }), N('r', 'تعداد انتخاب (r)', 'r', null, 3, { min: 0, max: 200 })],
    outputs: [O('combinations', 'ترکیب nCr'), O('permutations', 'جایگشت nPr'), O('factorial_n', 'n!')],
    tests: [
      { input: { n: 10, r: 3 }, expected: { combinations: 120, permutations: 720, factorial_n: 3628800 } },
      { input: { n: 52, r: 5 }, expected: { combinations: 2598960, permutations: 311875200, factorial_n: 8.0658175e+67 } },
    ],
    compute({ n, r }) {
      const total = Math.trunc(n);
      const pick = Math.trunc(r);
      if (total < 0 || pick < 0) throw new Error('n و r باید نامنفی باشند');
      if (pick > total) throw new Error('r نمی‌تواند از n بزرگ‌تر باشد');
      const permutations = Array.from({ length: pick }, (_, index) => total - index).reduce((acc, value) => acc * value, 1);
      const factorialR = Array.from({ length: pick }, (_, index) => index + 1).reduce((acc, value) => acc * value, 1);
      const factorialN = Array.from({ length: total }, (_, index) => index + 1).reduce((acc, value) => acc * value, 1);
      return out(
        { combinations: round(permutations / factorialR, 6), permutations: round(permutations, 6), factorial_n: round(factorialN, 6) },
        [`nPr = n!/(n−r)! = ${round(permutations, 6)}`, `nCr = nPr/r! = ${round(permutations / factorialR, 6)}`, `n! = ${round(factorialN, 6)}`],
      );
    },
  }),

  make({
    id: 'harmonic_mean',
    name_fa: 'میانگین هارمونیک و هندسی',
    name_en: 'Harmonic & Geometric Mean',
    category_path: ['ریاضیات', 'آمار و احتمال'],
    tags: ['میانگین', 'هارمونیک', 'geometric mean'],
    description_fa: 'سه میانگین یک فهرست عددی؛ هارمونیک برای نرخ‌ها و هندسی برای رشدهای نسبی درست است.',
    formula_latex: 'H=\\frac{n}{\\sum 1/x_i},\\qquad G=\\sqrt[n]{\\prod x_i}',
    variables: [T('values', 'فهرست اعداد (با کاما)', 'Values', '4, 9, 16')],
    outputs: [O('harmonic_mean', 'میانگین هارمونیک'), O('geometric_mean', 'میانگین هندسی'), O('arithmetic_mean', 'میانگین حسابی'), O('count', 'تعداد داده')],
    tests: [
      { input: { values: '4, 9, 16' }, expected: { harmonic_mean: 7.081967, geometric_mean: 8.320335, arithmetic_mean: 9.666667, count: 3 } },
      { input: { values: '2, 8' }, expected: { harmonic_mean: 3.2, geometric_mean: 4, arithmetic_mean: 5, count: 2 } },
    ],
    compute({ values }) {
      const list = parseList(values);
      if (list.some((value) => value <= 0)) throw new Error('برای میانگین هندسی و هارمونیک همه اعداد باید مثبت باشند');
      const n = list.length;
      const arithmetic = list.reduce((acc, value) => acc + value, 0) / n;
      const harmonic = n / list.reduce((acc, value) => acc + 1 / value, 0);
      const geometric = Math.exp(list.reduce((acc, value) => acc + Math.log(value), 0) / n);
      return out(
        { harmonic_mean: round(harmonic, 6), geometric_mean: round(geometric, 6), arithmetic_mean: round(arithmetic, 6), count: n },
        [`تعداد داده‌ها n = ${n}`, `H = n/Σ(1/x) = ${round(harmonic, 6)}`, `G = (∏x)^(1/n) = ${round(geometric, 6)}`, `میانگین حسابی = ${round(arithmetic, 6)}`],
      );
    },
  }),

  // ── فیزیک ────────────────────────────────────────────────────────────────
  make({
    id: 'newton_cooling_law',
    name_fa: 'قانون سرد شدن نیوتن',
    name_en: "Newton's Law of Cooling",
    category_path: ['فیزیک', 'ترمودینامیک'],
    tags: ['سرد شدن', 'دمای تعادل', 'cooling'],
    description_fa: 'دمای جسم پس از گذشت زمان، وقتی با محیط اطراف به تعادل حرارتی می‌رسد.',
    formula_latex: 'T(t)=T_{\\text{env}}+(T_0-T_{\\text{env}})e^{-kt}',
    variables: [N('t0', 'دمای اولیه (°C)', 'Initial temperature', '°C', 90), N('t_env', 'دمای محیط (°C)', 'Ambient temperature', '°C', 20), N('k', 'ثابت سرد شدن (1/min)', 'Cooling constant', null, 0.05, { min: 0 }), N('minutes', 'زمان (دقیقه)', 'Time', 'min', 30, { min: 0 })],
    outputs: [O('temperature', 'دما پس از زمان', '°C'), O('temperature_drop', 'افت دما', '°C'), O('time_constant', 'ثابت زمانی', 'min')],
    tests: [
      { input: { t0: 90, t_env: 20, k: 0.05, minutes: 30 }, expected: { temperature: 35.619111, temperature_drop: 54.380889, time_constant: 20 } },
      { input: { t0: 100, t_env: 25, k: 0.1, minutes: 10 }, expected: { temperature: 52.590958, temperature_drop: 47.409042, time_constant: 10 } },
    ],
    compute({ t0, t_env, k, minutes }) {
      if (k < 0 || minutes < 0) throw new Error('ثابت سرد شدن و زمان باید نامنفی باشند');
      const temperature = t_env + (t0 - t_env) * Math.exp(-k * minutes);
      return out(
        { temperature: round(temperature, 6), temperature_drop: round(t0 - temperature, 6), time_constant: k === 0 ? 0 : round(1 / k, 6) },
        [`ΔT₀ = T₀ − T_env = ${t0 - t_env}°C`, `e^(−kt) = e^(−${k}×${minutes}) = ${round(Math.exp(-k * minutes), 6)}`, `T = ${round(temperature, 4)}°C`],
      );
    },
  }),

  make({
    id: 'critical_angle',
    name_fa: 'زاویه بحرانی بازتاب کلی',
    name_en: 'Critical Angle of Total Internal Reflection',
    category_path: ['فیزیک', 'اپتیک'],
    tags: ['بازتاب کلی', 'ضریب شکست', 'critical angle'],
    description_fa: 'بیشترین زاویه فرود که نور هنوز از محیط غلیظ به رقیق عبور می‌کند؛ فراتر از آن بازتاب کلی رخ می‌دهد.',
    formula_latex: '\\theta_c=\\arcsin\\!\\left(\\frac{n_2}{n_1}\\right)',
    variables: [N('n1', 'ضریب شکست محیط اول', 'n₁', null, 1.5, { min: 1 }), N('n2', 'ضریب شکست محیط دوم', 'n₂', null, 1, { min: 1 })],
    outputs: [O('critical_angle_deg', 'زاویه بحرانی', 'deg'), O('critical_angle_rad', 'زاویه بحرانی', 'rad'), O('sin_critical', 'سینوس زاویه بحرانی')],
    tests: [
      { input: { n1: 1.5, n2: 1 }, expected: { critical_angle_deg: 41.810315, critical_angle_rad: 0.729728, sin_critical: 0.666667 } },
      { input: { n1: 2.42, n2: 1 }, expected: { critical_angle_deg: 24.407469, critical_angle_rad: 0.425991, sin_critical: 0.413223 } },
    ],
    compute({ n1, n2 }) {
      if (n1 <= 0 || n2 <= 0) throw new Error('ضرایب شکست باید مثبت باشند');
      if (n2 >= n1) throw new Error('برای بازتاب کلی باید n₁ > n₂ باشد');
      const sinCritical = n2 / n1;
      const angle = Math.asin(sinCritical);
      return out(
        { critical_angle_deg: round((angle * 180) / Math.PI, 6), critical_angle_rad: round(angle, 6), sin_critical: round(sinCritical, 6) },
        [`sin θc = n₂/n₁ = ${round(sinCritical, 6)}`, `θc = arcsin(${round(sinCritical, 6)}) = ${round((angle * 180) / Math.PI, 4)}°`],
      );
    },
  }),

  make({
    id: 'spring_mass_frequency',
    name_fa: 'فرکانس نوسان جرم و فنر',
    name_en: 'Spring–Mass Oscillation Frequency',
    category_path: ['فیزیک', 'مکانیک کلاسیک'],
    tags: ['فرکانس', 'فنر', 'نوسان'],
    description_fa: 'فرکانس طبیعی، فرکانس زاویه‌ای و دوره تناوب یک جرم روی فنر ایده‌آل.',
    formula_latex: 'f=\\frac{1}{2\\pi}\\sqrt{\\frac{k}{m}},\\qquad T=2\\pi\\sqrt{\\frac{m}{k}}',
    variables: [N('k', 'ثابت فنر (N/m)', 'Spring constant', 'N/m', 100, { min: 0 }), N('m', 'جرم (kg)', 'Mass', 'kg', 1, { min: 0 })],
    outputs: [O('frequency', 'فرکانس', 'Hz'), O('angular_frequency', 'فرکانس زاویه‌ای', 'rad/s'), O('period', 'دوره تناوب', 's')],
    tests: [
      { input: { k: 100, m: 1 }, expected: { frequency: 1.591549, angular_frequency: 10, period: 0.628319 } },
      { input: { k: 50, m: 2 }, expected: { frequency: 0.795775, angular_frequency: 5, period: 1.256637 } },
    ],
    compute({ k, m }) {
      if (k <= 0 || m <= 0) throw new Error('ثابت فنر و جرم باید مثبت باشند');
      const omega = Math.sqrt(k / m);
      return out(
        { frequency: round(omega / (2 * Math.PI), 6), angular_frequency: round(omega, 6), period: round((2 * Math.PI) / omega, 6) },
        [`ω = √(k/m) = ${round(omega, 6)} rad/s`, `f = ω/2π = ${round(omega / (2 * Math.PI), 6)} Hz`, `T = 2π/ω = ${round((2 * Math.PI) / omega, 6)} s`],
      );
    },
  }),

  make({
    id: 'solenoid_field',
    name_fa: 'میدان مغناطیسی سیم‌پیچ',
    name_en: 'Magnetic Field of a Solenoid',
    category_path: ['فیزیک', 'الکترومغناطیس'],
    tags: ['سیم‌پیچ', 'میدان مغناطیسی', 'solenoid'],
    description_fa: 'شدت میدان مغناطیسی داخل یک سیم‌پیچ بلند برحسب تعداد دور، طول و جریان.',
    formula_latex: 'B=\\mu_0\\frac{N}{L}I',
    variables: [N('turns', 'تعداد دور (N)', 'Turns', null, 1000, { min: 0 }), N('length', 'طول سیم‌پیچ (m)', 'Length', 'm', 0.5, { min: 0 }), N('current', 'جریان (A)', 'Current', 'A', 2)],
    outputs: [O('b_field', 'میدان B', 'T'), O('h_field', 'شدت میدان H', 'A/m'), O('turns_per_meter', 'دور بر متر')],
    tests: [
      { input: { turns: 1000, length: 0.5, current: 2 }, expected: { b_field: 0.005026548, h_field: 4000, turns_per_meter: 2000 } },
      { input: { turns: 500, length: 0.25, current: 1 }, expected: { b_field: 0.002513274, h_field: 2000, turns_per_meter: 2000 } },
    ],
    compute({ turns, length, current }) {
      if (length <= 0) throw new Error('طول سیم‌پیچ باید مثبت باشد');
      const density = turns / length;
      const b = mu0 * density * current;
      return out(
        { b_field: round(b, 9), h_field: round(density * current, 6), turns_per_meter: round(density, 6) },
        [`n = N/L = ${round(density, 4)} دور بر متر`, `B = μ₀·n·I = ${round(b, 9)} T`, `B = ${round(b * 1000, 4)} mT`],
      );
    },
  }),

  make({
    id: 'photon_energy',
    name_fa: 'انرژی فوتون',
    name_en: 'Photon Energy',
    category_path: ['فیزیک', 'فیزیک مدرن'],
    tags: ['فوتون', 'طول موج', 'انرژی'],
    description_fa: 'انرژی و فرکانس یک فوتون از روی طول موج آن، بر حسب ژول و الکترون‌ولت.',
    formula_latex: 'E=\\frac{hc}{\\lambda}=h\\nu',
    variables: [N('wavelength_nm', 'طول موج (nm)', 'Wavelength', 'nm', 500, { min: 0 })],
    outputs: [O('energy_j', 'انرژی', 'J'), O('energy_ev', 'انرژی', 'eV'), O('frequency', 'فرکانس', 'Hz')],
    tests: [
      { input: { wavelength_nm: 500 }, expected: { energy_j: 3.9728917e-19, energy_ev: 2.479684, frequency: 599584920000000 } },
      { input: { wavelength_nm: 121.5 }, expected: { energy_j: 1.6349349e-18, energy_ev: 10.204461, frequency: 2467427600000000 } },
    ],
    compute({ wavelength_nm }) {
      if (wavelength_nm <= 0) throw new Error('طول موج باید مثبت باشد');
      const lambda = wavelength_nm * 1e-9;
      const frequency = c / lambda;
      const energy = h * frequency;
      return out(
        { energy_j: round(energy, 12), energy_ev: round(energy / 1.602176634e-19, 6), frequency: round(frequency, 2) },
        [`ν = c/λ = ${round(frequency, 2)} Hz`, `E = hν = ${round(energy, 12)} J`, `E = ${round(energy / 1.602176634e-19, 4)} eV`],
      );
    },
  }),

  make({
    id: 'calorimetry_mixing',
    name_fa: 'دمای تعادل دو مایع',
    name_en: 'Calorimetry — Mixture Equilibrium',
    category_path: ['فیزیک', 'ترمودینامیک'],
    tags: ['کالری‌متری', 'گرما', 'تعادل'],
    description_fa: 'دمای نهایی و گرمای مبادله‌شده وقتی دو جسم با دماهای مختلف در یک ظرف عایق مخلوط می‌شوند.',
    formula_latex: 'T_f=\\frac{m_1c_1T_1+m_2c_2T_2}{m_1c_1+m_2c_2}',
    variables: [
      N('m1', 'جرم اول (kg)', 'Mass 1', 'kg', 0.2, { min: 0 }),
      N('c1', 'گرمای ویژه اول (J/kg·K)', 'Specific heat 1', null, 4186, { min: 0 }),
      N('t1', 'دمای اول (°C)', 'Temperature 1', '°C', 90),
      N('m2', 'جرم دوم (kg)', 'Mass 2', 'kg', 0.3, { min: 0 }),
      N('c2', 'گرمای ویژه دوم (J/kg·K)', 'Specific heat 2', null, 4186, { min: 0 }),
      N('t2', 'دمای دوم (°C)', 'Temperature 2', '°C', 20),
    ],
    outputs: [O('final_temperature', 'دمای تعادل', '°C'), O('heat_transferred', 'گرمای مبادله‌شده', 'J'), O('hot_capacity', 'ظرفیت گرمایی جسم اول', 'J/K')],
    tests: [
      { input: { m1: 0.2, c1: 4186, t1: 90, m2: 0.3, c2: 4186, t2: 20 }, expected: { final_temperature: 48, heat_transferred: 35162.4, hot_capacity: 837.2 } },
      { input: { m1: 0.1, c1: 385, t1: 300, m2: 0.4, c2: 4186, t2: 290 }, expected: { final_temperature: 290.224765, heat_transferred: 376.346547, hot_capacity: 38.5 } },
    ],
    compute({ m1, c1, t1, m2, c2, t2 }) {
      if (m1 < 0 || m2 < 0 || c1 < 0 || c2 < 0) throw new Error('جرم و گرمای ویژه باید نامنفی باشند');
      const capacity1 = m1 * c1;
      const capacity2 = m2 * c2;
      if (capacity1 + capacity2 === 0) throw new Error('ظرفیت گرمایی کل باید مثبت باشد');
      const finalTemperature = (capacity1 * t1 + capacity2 * t2) / (capacity1 + capacity2);
      return out(
        {
          final_temperature: round(finalTemperature, 6),
          heat_transferred: round(Math.abs(capacity1 * (t1 - finalTemperature)), 6),
          hot_capacity: round(capacity1, 6),
        },
        [`C₁ = m₁c₁ = ${round(capacity1, 2)} J/K، C₂ = ${round(capacity2, 2)} J/K`, `T_f = (C₁T₁+C₂T₂)/(C₁+C₂) = ${round(finalTemperature, 4)}°C`, `Q = C₁|T₁−T_f| = ${round(Math.abs(capacity1 * (t1 - finalTemperature)), 2)} J`],
      );
    },
  }),

  // ── شیمی ─────────────────────────────────────────────────────────────────
  make({
    id: 'empirical_formula',
    name_fa: 'فرمول تجربی از درصد جرمی',
    name_en: 'Empirical Formula from Mass Data',
    category_path: ['شیمی', 'استوکیومتری'],
    tags: ['فرمول تجربی', 'استوکیومتری', 'مول'],
    description_fa: 'نسبت ساده‌ترین اعداد صحیح دو عنصر از روی جرم و جرم مولی آن‌ها.',
    formula_latex: 'n_i=\\frac{m_i}{M_i},\\qquad \\text{ratio}=\\frac{n_i}{n_{\\min}}',
    variables: [
      T('symbol_a', 'نماد عنصر اول', 'Symbol A', 'H'),
      N('mass_a', 'جرم عنصر اول (g)', 'Mass A', 'g', 0.1119, { min: 0 }),
      N('molar_a', 'جرم مولی عنصر اول', 'Molar mass A', 'g/mol', 1.008, { min: 0 }),
      T('symbol_b', 'نماد عنصر دوم', 'Symbol B', 'O'),
      N('mass_b', 'جرم عنصر دوم (g)', 'Mass B', 'g', 0.8881, { min: 0 }),
      N('molar_b', 'جرم مولی عنصر دوم', 'Molar mass B', 'g/mol', 16, { min: 0 }),
    ],
    outputs: [O('moles_a', 'مول عنصر اول', 'mol'), O('moles_b', 'مول عنصر دوم', 'mol'), O('ratio_a', 'نسبت عنصر اول'), O('ratio_b', 'نسبت عنصر دوم'), O('formula', 'فرمول تجربی')],
    tests: [
      { input: { symbol_a: 'H', mass_a: 0.1119, molar_a: 1.008, symbol_b: 'O', mass_b: 0.8881, molar_b: 16 }, expected: { moles_a: 0.111012, moles_b: 0.055506, ratio_a: 2, ratio_b: 1 } },
      { input: { symbol_a: 'C', mass_a: 0.2727, molar_a: 12.011, symbol_b: 'O', mass_b: 0.7273, molar_b: 15.999 }, expected: { moles_a: 0.022704, moles_b: 0.045459, ratio_a: 1, ratio_b: 2.0022 } },
    ],
    compute({ symbol_a, mass_a, molar_a, symbol_b, mass_b, molar_b }) {
      if (molar_a <= 0 || molar_b <= 0) throw new Error('جرم مولی باید مثبت باشد');
      const a = String(symbol_a).trim() || 'A';
      const b = String(symbol_b).trim() || 'B';
      const molesA = mass_a / molar_a;
      const molesB = mass_b / molar_b;
      const smallest = Math.min(molesA, molesB);
      if (!(smallest > 0)) throw new Error('جرم هر دو عنصر باید مثبت باشد');
      const ratioA = molesA / smallest;
      const ratioB = molesB / smallest;
      return out(
        {
          moles_a: round(molesA, 6),
          moles_b: round(molesB, 6),
          ratio_a: round(ratioA, 4),
          ratio_b: round(ratioB, 4),
          formula: `${a}${subscript(ratioA)}${b}${subscript(ratioB)}`,
        },
        [`n(${a}) = m/M = ${round(molesA, 6)} mol`, `n(${b}) = ${round(molesB, 6)} mol`, `تقسیم بر کوچک‌ترین: ${round(ratioA, 4)} : ${round(ratioB, 4)}`, `فرمول تجربی: ${a}${subscript(ratioA)}${b}${subscript(ratioB)}`],
      );
    },
  }),

  make({
    id: 'raoult_law',
    name_fa: 'قانون راؤلت',
    name_en: "Raoult's Law",
    category_path: ['شیمی', 'تعادل'],
    tags: ['فشار بخار', 'محلول', 'raoult'],
    description_fa: 'کاهش فشار بخار حلال در محلول ایده‌آل برحسب کسر مولی حلال.',
    formula_latex: 'P=x_{\\text{solvent}}P^{\\circ},\\qquad \\Delta P=(1-x)P^{\\circ}',
    variables: [N('x_solvent', 'کسر مولی حلال', 'Mole fraction', null, 0.9, { min: 0, max: 1 }), N('p0', 'فشار بخار حلال خالص', 'Vapour pressure of pure solvent', 'kPa', 23.8, { min: 0 })],
    outputs: [O('vapour_pressure', 'فشار بخار محلول', 'kPa'), O('pressure_drop', 'کاهش فشار بخار', 'kPa'), O('relative_lowering', 'کاهش نسبی')],
    tests: [
      { input: { x_solvent: 0.9, p0: 23.8 }, expected: { vapour_pressure: 21.42, pressure_drop: 2.38, relative_lowering: 0.1 } },
      { input: { x_solvent: 0.75, p0: 100 }, expected: { vapour_pressure: 75, pressure_drop: 25, relative_lowering: 0.25 } },
    ],
    compute({ x_solvent, p0 }) {
      if (x_solvent < 0 || x_solvent > 1) throw new Error('کسر مولی باید بین ۰ و ۱ باشد');
      if (p0 < 0) throw new Error('فشار بخار باید نامنفی باشد');
      const vapourPressure = x_solvent * p0;
      return out(
        { vapour_pressure: round(vapourPressure, 6), pressure_drop: round(p0 - vapourPressure, 6), relative_lowering: round(1 - x_solvent, 6) },
        [`P = x·P° = ${round(x_solvent, 4)} × ${p0} = ${round(vapourPressure, 4)} kPa`, `ΔP = P° − P = ${round(p0 - vapourPressure, 4)} kPa`],
      );
    },
  }),

  // ── مهندسی ───────────────────────────────────────────────────────────────
  make({
    id: 'torsion_shaft',
    name_fa: 'پیچش شفت گرد',
    name_en: 'Torsion of a Circular Shaft',
    category_path: ['مهندسی', 'استاتیک'],
    tags: ['پیچش', 'تنش برشی', 'shaft'],
    description_fa: 'تنش برشی، ممان قطبی و زاویه پیچش یک شفت توپر تحت گشتاور.',
    formula_latex: '\\tau=\\frac{Tr}{J},\\qquad J=\\frac{\\pi d^{4}}{32},\\qquad \\theta=\\frac{TL}{GJ}',
    variables: [
      N('torque', 'گشتاور (N·m)', 'Torque', 'N·m', 500),
      N('diameter_mm', 'قطر (mm)', 'Diameter', 'mm', 40, { min: 0 }),
      N('length_m', 'طول (m)', 'Length', 'm', 1, { min: 0 }),
      N('g_gpa', 'ضریب برشی G (GPa)', 'Shear modulus', 'GPa', 79.3, { min: 0 }),
    ],
    outputs: [O('shear_stress_mpa', 'تنش برشی', 'MPa'), O('polar_moment', 'ممان قطبی J', 'm⁴'), O('twist_deg', 'زاویه پیچش', 'deg')],
    tests: [
      { input: { torque: 500, diameter_mm: 40, length_m: 1, g_gpa: 79.3 }, expected: { shear_stress_mpa: 39.788736, polar_moment: 2.5132741e-7, twist_deg: 1.437406, twist_rad: 0.025087475 } },
      { input: { torque: 120, diameter_mm: 25, length_m: 0.8, g_gpa: 26 }, expected: { shear_stress_mpa: 39.113919, polar_moment: 3.834952e-8, twist_deg: 5.516461, twist_rad: 0.096280416 } },
    ],
    compute({ torque, diameter_mm, length_m, g_gpa }) {
      if (diameter_mm <= 0) throw new Error('قطر باید مثبت باشد');
      if (g_gpa <= 0) throw new Error('ضریب برشی باید مثبت باشد');
      const radius = diameter_mm / 2000;
      const j = (Math.PI * (2 * radius) ** 4) / 32;
      const tau = (torque * radius) / j;
      const g = g_gpa * 1e9;
      const twist = (torque * length_m) / (g * j);
      return out(
        {
          shear_stress_mpa: round(tau / 1e6, 6),
          polar_moment: round(j, 12),
          twist_deg: round((twist * 180) / Math.PI, 6),
          twist_rad: round(twist, 9),
        },
        [`d = ${diameter_mm} mm ⇒ r = ${round(radius * 1000, 4)} mm`, `J = πd⁴/32 = ${round(j, 12)} m⁴`, `τ = Tr/J = ${round(tau / 1e6, 4)} MPa`, `θ = TL/(GJ) = ${round((twist * 180) / Math.PI, 4)}°`],
      );
    },
  }),

  make({
    id: 'column_buckling_euler',
    name_fa: 'کمانش ستون (اولر)',
    name_en: 'Euler Column Buckling',
    category_path: ['مهندسی', 'استاتیک'],
    tags: ['کمانش', 'ستون', 'buckling'],
    description_fa: 'بار بحرانی کمانش یک ستون ایده‌آل برحسب سختی خمشی و طول مؤثر.',
    formula_latex: 'P_{cr}=\\frac{\\pi^{2}EI}{(KL)^{2}}',
    variables: [
      N('e_gpa', 'مدول یانگ E (GPa)', 'Young modulus', 'GPa', 200, { min: 0 }),
      N('i_cm4', 'ممان اینرسی I (cm⁴)', 'Second moment of area', 'cm⁴', 1000, { min: 0 }),
      N('length_m', 'طول ستون (m)', 'Length', 'm', 3, { min: 0 }),
      N('k_factor', 'ضریب طول مؤثر K', 'Effective length factor', null, 1, { min: 0 }),
    ],
    outputs: [O('critical_load_kn', 'بار بحرانی', 'kN'), O('critical_load_n', 'بار بحرانی', 'N'), O('effective_length', 'طول مؤثر', 'm')],
    tests: [
      { input: { e_gpa: 200, i_cm4: 1000, length_m: 3, k_factor: 1 }, expected: { critical_load_kn: 2193.245422, critical_load_n: 2193245.422464, effective_length: 3 } },
      { input: { e_gpa: 70, i_cm4: 500, length_m: 2, k_factor: 2 }, expected: { critical_load_kn: 215.897596, critical_load_n: 215897.596274, effective_length: 4 } },
    ],
    compute({ e_gpa, i_cm4, length_m, k_factor }) {
      if (length_m <= 0 || k_factor <= 0) throw new Error('طول و ضریب K باید مثبت باشند');
      const e = e_gpa * 1e9;
      const i = i_cm4 * 1e-8;
      const effective = k_factor * length_m;
      const pcr = (Math.PI ** 2 * e * i) / effective ** 2;
      return out(
        { critical_load_kn: round(pcr / 1000, 6), critical_load_n: round(pcr, 6), effective_length: round(effective, 6) },
        [`I = ${i_cm4} cm⁴ = ${i.toExponential(3)} m⁴`, `L_eff = K·L = ${round(effective, 4)} m`, `P_cr = π²EI/L_eff² = ${round(pcr / 1000, 4)} kN`],
      );
    },
  }),

  make({
    id: 'wheatstone_bridge',
    name_fa: 'پل وتستون',
    name_en: 'Wheatstone Bridge',
    category_path: ['مهندسی', 'مدار و الکترونیک'],
    tags: ['پل وتستون', 'مقاومت', 'bridge'],
    description_fa: 'مقاومت مجهول در پل متعادل، از نسبت سه بازوی معلوم.',
    formula_latex: 'R_x=\\frac{R_2R_3}{R_1}\\quad\\text{(balanced)}',
    variables: [N('r1', 'بازوی R₁ (Ω)', 'R₁', 'Ω', 100, { min: 0 }), N('r2', 'بازوی R₂ (Ω)', 'R₂', 'Ω', 200, { min: 0 }), N('r3', 'بازوی R₃ (Ω)', 'R₃', 'Ω', 150, { min: 0 })],
    outputs: [O('unknown_resistance', 'مقاومت مجهول', 'Ω'), O('ratio_arms', 'نسبت بازوها'), O('conductance', 'رسانایی', 'S')],
    tests: [
      { input: { r1: 100, r2: 200, r3: 150 }, expected: { unknown_resistance: 300, ratio_arms: 2, conductance: 0.003333333 } },
      { input: { r1: 120, r2: 120, r3: 470 }, expected: { unknown_resistance: 470, ratio_arms: 1, conductance: 0.00212766 } },
    ],
    compute({ r1, r2, r3 }) {
      if (r1 <= 0) throw new Error('بازوی R₁ باید مثبت باشد');
      if (r2 < 0 || r3 < 0) throw new Error('مقاومت‌ها باید نامنفی باشند');
      const rx = (r2 * r3) / r1;
      return out(
        { unknown_resistance: round(rx, 6), ratio_arms: round(r2 / r1, 6), conductance: rx === 0 ? 0 : round(1 / rx, 9) },
        [`R₂/R₁ = ${round(r2 / r1, 4)}`, `R_x = R₂R₃/R₁ = ${round(rx, 4)} Ω`, `G = 1/R_x = ${round(1 / (rx || 1), 6)} S`],
      );
    },
  }),

  make({
    id: 'convection_heat_transfer',
    name_fa: 'انتقال حرارت جابه‌جایی',
    name_en: 'Convective Heat Transfer',
    category_path: ['مهندسی', 'انتقال حرارت'],
    tags: ['جابه‌جایی', 'ضریب انتقال حرارت', 'convection'],
    description_fa: 'آهنگ انتقال حرارت از یک سطح به سیال، همراه با شارش حرارتی و مقاومت جابه‌جایی.',
    formula_latex: 'q=hA(T_s-T_\\infty)',
    variables: [
      N('h', 'ضریب جابه‌جایی (W/m²·K)', 'Convection coefficient', null, 25, { min: 0 }),
      N('area', 'مساحت سطح (m²)', 'Area', 'm²', 2, { min: 0 }),
      N('t_surface', 'دمای سطح (°C)', 'Surface temperature', '°C', 80),
      N('t_fluid', 'دمای سیال (°C)', 'Fluid temperature', '°C', 25),
    ],
    outputs: [O('heat_rate', 'آهنگ انتقال حرارت', 'W'), O('heat_flux', 'شارش حرارتی', 'W/m²'), O('resistance', 'مقاومت جابه‌جایی', 'K/W')],
    tests: [
      { input: { h: 25, area: 2, t_surface: 80, t_fluid: 25 }, expected: { heat_rate: 2750, heat_flux: 1375, resistance: 0.02 } },
      { input: { h: 10, area: 1.5, t_surface: 60, t_fluid: 20 }, expected: { heat_rate: 600, heat_flux: 400, resistance: 0.066666667 } },
    ],
    compute({ h, area, t_surface, t_fluid }) {
      if (h < 0 || area < 0) throw new Error('ضریب جابه‌جایی و مساحت باید نامنفی باشند');
      const delta = t_surface - t_fluid;
      const rate = h * area * delta;
      return out(
        { heat_rate: round(rate, 6), heat_flux: round(h * delta, 6), resistance: h * area === 0 ? 0 : round(1 / (h * area), 9) },
        [`ΔT = T_s − T_∞ = ${round(delta, 4)} K`, `q = hAΔT = ${round(rate, 4)} W`, `R = 1/(hA) = ${h * area === 0 ? '—' : round(1 / (h * area), 6)} K/W`],
      );
    },
  }),

  // ── مالی و اقتصاد ────────────────────────────────────────────────────────
  make({
    id: 'bond_price',
    name_fa: 'قیمت اوراق قرضه',
    name_en: 'Bond Price',
    category_path: ['مالی و اقتصاد', 'سرمایه‌گذاری'],
    tags: ['اوراق', 'بازده', 'bond'],
    description_fa: 'ارزش فعلی کوپن‌ها و مبلغ اسمی اوراق با نرخ بازده بازار، و بازده جاری.',
    formula_latex: 'P=\\sum_{k=1}^{n}\\frac{C/m}{(1+y/m)^{k}}+\\frac{F}{(1+y/m)^{n}}',
    variables: [
      N('face', 'مبلغ اسمی', 'Face value', 'currency', 1000, { min: 0 }),
      N('coupon_rate', 'نرخ کوپن سالانه (٪)', 'Coupon rate', '%', 5),
      N('years', 'سررسید (سال)', 'Years to maturity', 'time', 10, { min: 0 }),
      N('yield_rate', 'بازده بازار (٪)', 'Yield to maturity', '%', 6),
      N('m', 'تعداد پرداخت در سال', 'Payments per year', null, 2, { min: 1, max: 12 }),
    ],
    outputs: [O('price', 'قیمت اوراق'), O('current_yield', 'بازده جاری', '%'), O('total_coupons', 'مجموع کوپن‌ها'), O('periods', 'تعداد دوره')],
    tests: [
      { input: { face: 1000, coupon_rate: 5, years: 10, yield_rate: 6, m: 2 }, expected: { price: 925.6126, current_yield: 5.401828, total_coupons: 500, periods: 20 } },
      { input: { face: 1000, coupon_rate: 8, years: 5, yield_rate: 8, m: 1 }, expected: { price: 1000, current_yield: 8, total_coupons: 400, periods: 5 } },
    ],
    compute({ face, coupon_rate, years, yield_rate, m }) {
      if (face < 0) throw new Error('مبلغ اسمی باید نامنفی باشد');
      if (m <= 0) throw new Error('تعداد پرداخت در سال باید مثبت باشد');
      const periods = Math.max(1, Math.round(years * m));
      const coupon = (face * coupon_rate) / 100 / m;
      const rate = yield_rate / 100 / m;
      let price = 0;
      for (let k = 1; k <= periods; k += 1) price += coupon / (1 + rate) ** k;
      price += face / (1 + rate) ** periods;
      const annualCoupon = (face * coupon_rate) / 100;
      return out(
        {
          price: round(price, 4),
          current_yield: price === 0 ? 0 : round((annualCoupon / price) * 100, 6),
          total_coupons: round(coupon * periods, 4),
          periods,
        },
        [`کوپن هر دوره = ${round(coupon, 4)}، نرخ هر دوره = ${round(rate * 100, 4)}٪`, `n = ${periods} دوره`, `قیمت = ${round(price, 2)}`, `بازده جاری = ${round(price === 0 ? 0 : (annualCoupon / price) * 100, 4)}٪`],
      );
    },
  }),

  make({
    id: 'fisher_real_return',
    name_fa: 'بازده حقیقی فیشر',
    name_en: 'Fisher Real Return',
    category_path: ['مالی و اقتصاد', 'سرمایه‌گذاری'],
    tags: ['تورم', 'بازده حقیقی', 'fisher'],
    description_fa: 'تبدیل بازده اسمی به بازده حقیقی با حذف اثر تورم (رابطه دقیق فیشر).',
    formula_latex: 'r_{\\text{real}}=\\frac{1+r_{\\text{nom}}}{1+\\pi}-1',
    variables: [N('nominal', 'بازده اسمی (٪)', 'Nominal return', '%', 10), N('inflation', 'تورم (٪)', 'Inflation', '%', 7)],
    outputs: [O('real_return', 'بازده حقیقی', '%'), O('approximate_return', 'تقریب r − π', '%'), O('erosion', 'افت قدرت خرید', '%')],
    tests: [
      { input: { nominal: 10, inflation: 7 }, expected: { real_return: 2.803738, approximate_return: 3, erosion: 6.542056 } },
      { input: { nominal: 5, inflation: 2 }, expected: { real_return: 2.941176, approximate_return: 3, erosion: 1.960784 } },
    ],
    compute({ nominal, inflation }) {
      if (inflation <= -100) throw new Error('تورم نمی‌تواند −۱۰۰٪ یا کمتر باشد');
      const real = (1 + nominal / 100) / (1 + inflation / 100) - 1;
      return out(
        { real_return: round(real * 100, 6), approximate_return: round(nominal - inflation, 6), erosion: round((1 - 1 / (1 + inflation / 100)) * 100, 6) },
        [`r_real = (1+${nominal / 100})/(1+${inflation / 100}) − 1`, `بازده حقیقی = ${round(real * 100, 4)}٪`, `تقریب فیشر = ${round(nominal - inflation, 4)}٪`],
      );
    },
  }),

  make({
    id: 'rule_of_72',
    name_fa: 'قانون ۷۲ (دوبرابر شدن سرمایه)',
    name_en: 'Rule of 72',
    category_path: ['مالی و اقتصاد', 'بهره و وام'],
    tags: ['دوبرابر شدن', 'بهره مرکب', 'rule of 72'],
    description_fa: 'سال‌های لازم برای دوبرابر شدن سرمایه با نرخ رشد ثابت؛ همراه با مقدار دقیق.',
    formula_latex: 't_{72}=\\frac{72}{r},\\qquad t_{\\text{exact}}=\\frac{\\ln 2}{\\ln(1+r)}',
    variables: [N('rate', 'نرخ رشد سالانه (٪)', 'Annual growth', '%', 8, { min: 0.0001 })],
    outputs: [O('years_rule', 'تخمین قانون ۷۲', 'time'), O('years_exact', 'مقدار دقیق', 'time'), O('doubling_growth', 'ضریب رشد لازم')],
    tests: [
      { input: { rate: 8 }, expected: { years_rule: 9, years_exact: 9.006468, doubling_growth: 2 } },
      { input: { rate: 6 }, expected: { years_rule: 12, years_exact: 11.895661, doubling_growth: 2 } },
    ],
    compute({ rate }) {
      if (rate <= 0) throw new Error('نرخ رشد باید مثبت باشد');
      const r = rate / 100;
      return out(
        { years_rule: round(72 / rate, 6), years_exact: round(Math.log(2) / Math.log(1 + r), 6), doubling_growth: 2 },
        [`قانون ۷۲: 72/${rate} = ${round(72 / rate, 4)} سال`, `دقیق: ln2/ln(1+${r}) = ${round(Math.log(2) / Math.log(1 + r), 4)} سال`],
      );
    },
  }),

  // ── زیست و سلامت ─────────────────────────────────────────────────────────
  make({
    id: 'egfr_ckd_epi',
    name_fa: 'فیلتراسیون گلومرولی (CKD-EPI)',
    name_en: 'eGFR (CKD-EPI 2021)',
    category_path: ['زیست و سلامت', 'سلامت'],
    tags: ['کلیه', 'eGFR', 'creatinine'],
    description_fa: 'برآورد نرخ فیلتراسیون گلومرولی از کراتینین، سن و جنسیت با معادله CKD-EPI ۲۰۲۱.',
    formula_latex: 'eGFR=142\\cdot\\min(S/\\kappa,1)^{\\alpha}\\cdot\\max(S/\\kappa,1)^{-1.2}\\cdot0.9938^{\\text{age}}',
    variables: [
      N('creatinine', 'کراتینین سرم (mg/dL)', 'Serum creatinine', 'mg/dL', 1, { min: 0.1 }),
      N('age', 'سن (سال)', 'Age', 'year', 40, { min: 18, max: 120 }),
      boolean('female', 'زن هستم', 'Female'),
    ],
    outputs: [O('egfr', 'eGFR', 'mL/min/1.73m²'), O('stage', 'طبقه‌بندی KDIGO'), O('kappa', 'κ معادله')],
    tests: [
      { input: { creatinine: 1, age: 40, female: false }, expected: { egfr: 97.5751, kappa: 0.9 } },
      { input: { creatinine: 0.8, age: 65, female: true }, expected: { egfr: 81.7171, kappa: 0.7 } },
    ],
    compute({ creatinine, age, female }) {
      if (creatinine <= 0) throw new Error('کراتینین باید مثبت باشد');
      if (age <= 0) throw new Error('سن باید مثبت باشد');
      const kappa = female ? 0.7 : 0.9;
      const alpha = female ? -0.241 : -0.302;
      const ratio = creatinine / kappa;
      const value = 142 * Math.min(ratio, 1) ** alpha * Math.max(ratio, 1) ** -1.2 * 0.9938 ** age * (female ? 1.012 : 1);
      const stage = value >= 90 ? 'G1' : value >= 60 ? 'G2' : value >= 45 ? 'G3a' : value >= 30 ? 'G3b' : value >= 15 ? 'G4' : 'G5';
      return out(
        { egfr: round(value, 4), stage, kappa },
        [`κ = ${kappa}، α = ${alpha}`, `S/κ = ${round(ratio, 4)}`, `eGFR = 142 × ${round(Math.min(ratio, 1) ** alpha * Math.max(ratio, 1) ** -1.2, 6)} × 0.9938^${age} = ${round(value, 2)}`, `طبقه KDIGO: ${stage}`],
      );
    },
  }),

  make({
    id: 'bsa_dubois',
    name_fa: 'سطح بدن (دوبوا)',
    name_en: 'Body Surface Area (Du Bois)',
    category_path: ['زیست و سلامت', 'سلامت'],
    tags: ['سطح بدن', 'BSA', 'دوز دارو'],
    description_fa: 'برآورد سطح بدن از قد و وزن، پرکاربرد در محاسبه دوز دارو و شاخص قلبی.',
    formula_latex: 'BSA=0.007184\\,H^{0.725}W^{0.425}',
    variables: [N('height_cm', 'قد (cm)', 'Height', 'cm', 170, { min: 50 }), N('weight_kg', 'وزن (kg)', 'Weight', 'kg', 70, { min: 2 })],
    outputs: [O('bsa', 'سطح بدن', 'm²'), O('bmi', 'شاخص توده بدنی', 'kg/m²'), O('lean_factor', 'نسبت سطح به وزن')],
    tests: [
      { input: { height_cm: 170, weight_kg: 70 }, expected: { bsa: 1.809708, bmi: 24.2215, lean_factor: 0.025853 } },
      { input: { height_cm: 160, weight_kg: 55 }, expected: { bsa: 1.563174, bmi: 21.4844, lean_factor: 0.028421 } },
    ],
    compute({ height_cm, weight_kg }) {
      if (height_cm <= 0 || weight_kg <= 0) throw new Error('قد و وزن باید مثبت باشند');
      const bsa = 0.007184 * height_cm ** 0.725 * weight_kg ** 0.425;
      const bmi = weight_kg / (height_cm / 100) ** 2;
      return out(
        { bsa: round(bsa, 6), bmi: round(bmi, 4), lean_factor: round(bsa / weight_kg, 6) },
        [`BSA = 0.007184 × ${height_cm}^0.725 × ${weight_kg}^0.425`, `BSA = ${round(bsa, 4)} m²`, `BMI = ${round(bmi, 2)} kg/m²`],
      );
    },
  }),

  make({
    id: 'anion_gap',
    name_fa: 'شکاف آنیونی',
    name_en: 'Anion Gap',
    category_path: ['زیست و سلامت', 'سلامت'],
    tags: ['الکترولیت', 'آنین گپ', 'anion gap'],
    description_fa: 'شکاف آنیونی و نسخه اصلاح‌شده با آلبومین، برای ارزیابی اختلالات اسید-باز.',
    formula_latex: 'AG=Na-(Cl+HCO_3),\\qquad AG_c=AG+2.5(4-\\text{Alb})',
    variables: [
      N('sodium', 'سدیم (mEq/L)', 'Sodium', 'mEq/L', 140, { min: 0 }),
      N('chloride', 'کلر (mEq/L)', 'Chloride', 'mEq/L', 102, { min: 0 }),
      N('bicarbonate', 'بی‌کربنات (mEq/L)', 'Bicarbonate', 'mEq/L', 24, { min: 0 }),
      N('albumin', 'آلبومین (g/dL)', 'Albumin', 'g/dL', 4, { min: 0 }),
    ],
    outputs: [O('anion_gap', 'شکاف آنیونی', 'mEq/L'), O('corrected_gap', 'شکاف اصلاح‌شده', 'mEq/L'), O('interpretation', 'تفسیر')],
    tests: [
      { input: { sodium: 140, chloride: 102, bicarbonate: 24, albumin: 4 }, expected: { anion_gap: 14, corrected_gap: 14 } },
      { input: { sodium: 132, chloride: 90, bicarbonate: 18, albumin: 3 }, expected: { anion_gap: 24, corrected_gap: 26.5 } },
    ],
    compute({ sodium, chloride, bicarbonate, albumin }) {
      if (sodium < 0 || chloride < 0 || bicarbonate < 0) throw new Error('الکترولیت‌ها باید نامنفی باشند');
      const gap = sodium - (chloride + bicarbonate);
      const corrected = gap + 2.5 * (4 - albumin);
      const interpretation = corrected > 12 ? 'بالا (اسیدوز با شکاف زیاد)' : corrected < 3 ? 'پایین' : 'طبیعی';
      return out(
        { anion_gap: round(gap, 4), corrected_gap: round(corrected, 4), interpretation },
        [`AG = ${sodium} − (${chloride} + ${bicarbonate}) = ${round(gap, 2)} mEq/L`, `اصلاح آلبومین: ${round(corrected, 2)} mEq/L`, `تفسیر: ${interpretation}`],
      );
    },
  }),

  make({
    id: 'serum_osmolality',
    name_fa: 'اسمولالیته سرم',
    name_en: 'Serum Osmolality',
    category_path: ['زیست و سلامت', 'سلامت'],
    tags: ['اسمولالیته', 'سدیم', 'osmolality'],
    description_fa: 'برآورد اسمولالیته سرم از سدیم، گلوکز و نیتروژن اوره خون.',
    formula_latex: 'Osm=2[Na]+\\frac{[Glu]}{18}+\\frac{[BUN]}{2.8}',
    variables: [
      N('sodium', 'سدیم (mEq/L)', 'Sodium', 'mEq/L', 140, { min: 0 }),
      N('glucose', 'گلوکز (mg/dL)', 'Glucose', 'mg/dL', 90, { min: 0 }),
      N('bun', 'اوره خون (mg/dL)', 'BUN', 'mg/dL', 14, { min: 0 }),
    ],
    outputs: [O('osmolality', 'اسمولالیته', 'mOsm/kg'), O('effective', 'اسمولالیته مؤثر', 'mOsm/kg'), O('tonicity_gap', 'سهم اوره')],
    tests: [
      { input: { sodium: 140, glucose: 90, bun: 14 }, expected: { osmolality: 290, effective: 285, tonicity_gap: 5 } },
      { input: { sodium: 125, glucose: 180, bun: 28 }, expected: { osmolality: 270, effective: 260, tonicity_gap: 10 } },
    ],
    compute({ sodium, glucose, bun }) {
      if (sodium < 0 || glucose < 0 || bun < 0) throw new Error('ورودی‌ها باید نامنفی باشند');
      const urea = bun / 2.8;
      const total = 2 * sodium + glucose / 18 + urea;
      return out(
        { osmolality: round(total, 4), effective: round(2 * sodium + glucose / 18, 4), tonicity_gap: round(urea, 4) },
        [`2[Na⁺] = ${2 * sodium}`, `گلوکز/۱۸ = ${round(glucose / 18, 2)}`, `BUN/۲.۸ = ${round(urea, 2)}`, `اسمولالیته ≈ ${round(total, 1)} mOsm/kg`],
      );
    },
  }),

  // ── زمین و محیط ──────────────────────────────────────────────────────────
  make({
    id: 'coriolis_parameter',
    name_fa: 'پارامتر کوریولیس',
    name_en: 'Coriolis Parameter',
    category_path: ['زمین و محیط', 'جو و اقلیم'],
    tags: ['کوریولیس', 'عرض جغرافیایی', 'coriolis'],
    description_fa: 'نیروی کوریولیس برحسب عرض جغرافیایی؛ تعیین‌کننده جهت چرخش توفان‌ها.',
    formula_latex: 'f=2\\Omega\\sin\\varphi',
    variables: [N('latitude', 'عرض جغرافیایی (درجه)', 'Latitude', 'deg', 45, { min: -90, max: 90 })],
    outputs: [O('coriolis_parameter', 'پارامتر f', '1/s'), O('beta', 'β (تغییر f با عرض)'), O('rossby_hours', 'مقیاس زمانی روزبی', 'h')],
    tests: [
      { input: { latitude: 45 }, expected: { coriolis_parameter: 0.0001031261, beta: 1.6186798e-11, rossby_hours: 16.9242 } },
      { input: { latitude: 0 }, expected: { coriolis_parameter: 0, beta: 2.289159e-11, rossby_hours: 0 } },
    ],
    compute({ latitude }) {
      if (latitude < -90 || latitude > 90) throw new Error('عرض جغرافیایی باید بین −۹۰ و ۹۰ باشد');
      const rad = (latitude * Math.PI) / 180;
      const f = 2 * OMEGA_EARTH * Math.sin(rad);
      const beta = (2 * OMEGA_EARTH * Math.cos(rad)) / 6371000;
      return out(
        {
          coriolis_parameter: round(f, 10),
          beta: round(beta, 12),
          rossby_hours: f === 0 ? 0 : round((2 * Math.PI) / Math.abs(f) / 3600, 4),
        },
        [`φ = ${latitude}°`, `f = 2Ω·sinφ = ${round(f, 10)} s⁻¹`, `β = 2Ω·cosφ/a = ${round(beta, 12)} m⁻¹s⁻¹`],
      );
    },
  }),

  make({
    id: 'lapse_rate_atmosphere',
    name_fa: 'افت دما و فشار با ارتفاع',
    name_en: 'Atmospheric Lapse Rate',
    category_path: ['زمین و محیط', 'جو و اقلیم'],
    tags: ['ارتفاع', 'جو', 'lapse rate'],
    description_fa: 'دمای هوا و فشار تقریبی در ارتفاع مشخص با آهنگ افت استاندارد ۶٫۵ درجه بر کیلومتر.',
    formula_latex: 'T=T_0-\\Gamma h,\\qquad P=P_0\\left(1-\\frac{\\Gamma h}{T_0}\\right)^{gM/ R\\Gamma}',
    variables: [
      N('t0', 'دمای سطح (°C)', 'Surface temperature', '°C', 25),
      N('altitude', 'ارتفاع (m)', 'Altitude', 'm', 1500, { min: 0 }),
      N('p0', 'فشار سطح (hPa)', 'Surface pressure', 'hPa', 1013.25, { min: 0 }),
    ],
    outputs: [O('temperature', 'دما در ارتفاع', '°C'), O('pressure', 'فشار هوا', 'hPa'), O('density_ratio', 'نسبت چگالی هوا')],
    tests: [
      { input: { t0: 25, altitude: 1500, p0: 1013.25 }, expected: { temperature: 15.25, pressure: 850.7918, density_ratio: 0.868053 } },
      { input: { t0: 15, altitude: 3000, p0: 1000 }, expected: { temperature: -4.5, pressure: 691.9148, density_ratio: 0.742138 } },
    ],
    compute({ t0, altitude, p0 }) {
      if (altitude < 0) throw new Error('ارتفاع باید نامنفی باشد');
      const lapse = 0.0065;
      const temperature = t0 - lapse * altitude;
      const t0k = t0 + 273.15;
      const tAt = temperature + 273.15;
      if (tAt <= 0) throw new Error('این ارتفاع از مدل جو استاندارد خارج است');
      const exponent = 9.80665 / (287.05 * lapse);
      const pressure = p0 * (tAt / t0k) ** exponent;
      return out(
        { temperature: round(temperature, 4), pressure: round(pressure, 4), density_ratio: round(pressure / p0 / (tAt / t0k), 6) },
        [`T = ${t0} − 0.0065×${altitude} = ${round(temperature, 2)}°C`, `P = ${round(p0, 2)} × (${round(tAt / t0k, 4)})^${round(exponent, 3)} = ${round(pressure, 2)} hPa`],
      );
    },
  }),

  make({
    id: 'moment_magnitude',
    name_fa: 'بزرگای گشتاوری زمین‌لرزه',
    name_en: 'Moment Magnitude (Mw)',
    category_path: ['زمین و محیط', 'زلزله'],
    tags: ['زمین‌لرزه', 'گشتاور لرزه‌ای', 'magnitude'],
    description_fa: 'تبدیل گشتاور لرزه‌ای به بزرگای گشتاوری و انرژی آزادشده؛ مقیاس استاندارد امروز seismology.',
    formula_latex: 'M_w=\\tfrac{2}{3}\\left(\\log_{10}M_0-9.1\\right),\\qquad \\log_{10}E=1.5M_w+4.8',
    variables: [N('m0', 'گشتاور لرزه‌ای M₀ (N·m)', 'Seismic moment', 'N·m', 1e19, { min: 1 })],
    outputs: [O('moment_magnitude', 'بزرگای گشتاوری'), O('energy_j', 'انرژی آزادشده', 'J'), O('tonnes_tnt', 'معادل TNT', 'ton')],
    tests: [
      { input: { m0: 1e19 }, expected: { moment_magnitude: 6.6, energy_j: 501187230000000, tonnes_tnt: 119786.6237 } },
      { input: { m0: 1e22 }, expected: { moment_magnitude: 8.6, energy_j: 501187230000000000, tonnes_tnt: 119786623.7159 } },
    ],
    compute({ m0 }) {
      if (m0 <= 0) throw new Error('گشتاور لرزه‌ای باید مثبت باشد');
      const mw = (2 / 3) * (Math.log10(m0) - 9.1);
      const energy = 10 ** (1.5 * mw + 4.8);
      return out(
        { moment_magnitude: round(mw, 4), energy_j: round(energy, 2), tonnes_tnt: round(energy / 4.184e9, 4) },
        [`log₁₀M₀ = ${round(Math.log10(m0), 4)}`, `Mw = ⅔(log₁₀M₀ − 9.1) = ${round(mw, 3)}`, `E ≈ 10^(1.5Mw+4.8) = ${round(energy, 2)} J`],
      );
    },
  }),
];
