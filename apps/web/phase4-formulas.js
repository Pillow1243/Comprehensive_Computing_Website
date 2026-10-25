// Phase 4 — physics pack: classical mechanics, electromagnetism,
// thermodynamics, optics and modern physics.
import { make, N, T, O, round, out, CONST } from './formula-kit.js';

const { g, G, c, h, hbar, kB, sigma, eps0, mu0 } = CONST;

export const PHASE4_FORMULAS = [
  // ── مکانیک کلاسیک ────────────────────────────────────────────────────────
  make({
    id: 'escape_velocity',
    name_fa: 'سرعت گریز',
    name_en: 'Escape Velocity',
    category_path: ['فیزیک', 'مکانیک کلاسیک'],
    tags: ['گریز', 'گرانش', 'escape'],
    description_fa: 'سرعت لازم برای گریز از میدان گرانشی جسم آسمانی و مقایسه با سرعت مداری.',
    formula_latex: 'v_e=\\sqrt{\\frac{2GM}{R}}',
    difficulty: 'intermediate',
    variables: [N('mass', 'جرم سیاره M (kg)', 'Planet mass', 'mass', 5.972e24), N('radius', 'شعاع R (m)', 'Radius', 'length', 6.371e6)],
    outputs: [O('escape_velocity', 'سرعت گریز', 'm/s'), O('orbital_velocity', 'سرعت مداری سطح', 'm/s')],
    tests: [
      { input: { mass: 5.972e24, radius: 6.371e6 }, expected: { escape_velocity: 11186.9, orbital_velocity: 7910.4 } },
      { input: { mass: 7.342e22, radius: 1.7374e6 }, expected: { escape_velocity: 2375 } },
    ],
    compute({ mass, radius }) {
      if (mass <= 0 || radius <= 0) throw new Error('جرم و شعاع باید مثبت باشند');
      const escape = Math.sqrt((2 * G * mass) / radius);
      return out(
        { escape_velocity: round(escape, 4), orbital_velocity: round(escape / Math.SQRT2, 4), km_per_s: round(escape / 1000, 4) },
        [`v_گریز = √(2GM/R)`, `= √(2 × 6.674×10⁻¹¹ × ${mass} / ${radius})`, `≈ ${round(escape, 2)} m/s = ${round(escape / 1000, 3)} km/s`],
      );
    },
  }),

  make({
    id: 'centripetal_force',
    name_fa: 'نیروی مرکزگرا',
    name_en: 'Centripetal Force',
    category_path: ['فیزیک', 'مکانیک کلاسیک'],
    tags: ['دایره', 'شتاب مرکزگرا', 'centripetal'],
    description_fa: 'نیرو و شتاب مرکزگرا، سرعت زاویه‌ای و دوره تناوب حرکت دایره‌ای.',
    formula_latex: 'F_c=\\frac{mv^2}{r}=m\\omega^2r',
    variables: [N('m', 'جرم m (kg)', 'Mass', 'mass', 2), N('v', 'سرعت خطی v (m/s)', 'Speed', 'speed', 10), N('r', 'شعاع r (m)', 'Radius', 'length', 5)],
    outputs: [O('force', 'نیروی مرکزگرا', 'N'), O('acceleration', 'شتاب مرکزگرا', 'm/s²'), O('period', 'دوره تناوب', 's')],
    tests: [
      { input: { m: 2, v: 10, r: 5 }, expected: { force: 40, acceleration: 20, period: 3.141593 } },
      { input: { m: 0.5, v: 4, r: 2 }, expected: { force: 4, acceleration: 8 } },
    ],
    compute({ m, v, r }) {
      if (r <= 0) throw new Error('شعاع باید مثبت باشد');
      if (m < 0) throw new Error('جرم باید نامنفی باشد');
      return out(
        { force: round((m * v * v) / r, 6), acceleration: round((v * v) / r, 6), angular_velocity: round(v / r, 6), period: round((2 * Math.PI * r) / v, 6) },
        [`a_c = v²/r = ${round((v * v) / r, 4)} m/s²`, `F_c = ma_c = ${round((m * v * v) / r, 4)} N`, `T = 2πr/v = ${round((2 * Math.PI * r) / v, 4)} s`],
      );
    },
  }),

  make({
    id: 'rotational_kinematics',
    name_fa: 'سینماتیک دورانی',
    name_en: 'Rotational Kinematics',
    category_path: ['فیزیک', 'مکانیک کلاسیک'],
    tags: ['دوران', 'شتاب زاویه‌ای', 'rotation'],
    description_fa: 'سرعت زاویه‌ای نهایی، جابه‌جایی زاویه‌ای و تعداد دور با شتاب زاویه‌ای ثابت.',
    formula_latex: '\\omega=\\omega_0+\\alpha t,\\quad \\theta=\\omega_0t+\\tfrac12\\alpha t^2',
    variables: [N('omega0', 'سرعت زاویه‌ای اولیه ω₀ (rad/s)', 'Initial ω', null, 2), N('alpha', 'شتاب زاویه‌ای α (rad/s²)', 'Angular accel.', null, 3), N('t', 'زمان t (s)', 'Time', 'time', 4)],
    outputs: [O('omega', 'سرعت زاویه‌ای نهایی', 'rad/s'), O('theta', 'جابه‌جایی زاویه‌ای', 'rad'), O('revolutions', 'تعداد دور', 'rev')],
    tests: [
      { input: { omega0: 2, alpha: 3, t: 4 }, expected: { omega: 14, theta: 32, revolutions: 5.092958 } },
      { input: { omega0: 0, alpha: 2, t: 5 }, expected: { omega: 10, theta: 25 } },
    ],
    compute({ omega0, alpha, t }) {
      if (t < 0) throw new Error('زمان باید نامنفی باشد');
      const omega = omega0 + alpha * t;
      const theta = omega0 * t + 0.5 * alpha * t * t;
      return out(
        { omega: round(omega, 6), theta: round(theta, 6), revolutions: round(theta / (2 * Math.PI), 6) },
        [`ω = ω₀ + αt = ${round(omega, 4)} rad/s`, `θ = ω₀t + ½αt² = ${round(theta, 4)} rad`, `تعداد دور = θ/2π = ${round(theta / (2 * Math.PI), 4)}`],
      );
    },
  }),

  make({
    id: 'moment_of_inertia',
    name_fa: 'ممان اینرسی و انرژی دورانی',
    name_en: 'Moment of Inertia',
    category_path: ['فیزیک', 'مکانیک کلاسیک'],
    tags: ['اینرسی', 'دوران', 'inertia'],
    description_fa: 'ممان اینرسی چند جسم استاندارد، تکانه زاویه‌ای و انرژی جنبشی دورانی.',
    formula_latex: 'I=\\sum m_ir_i^2,\\quad L=I\\omega,\\quad K=\\tfrac12I\\omega^2',
    difficulty: 'intermediate',
    variables: [
      N('mass', 'جرم m (kg)', 'Mass', 'mass', 2),
      N('size', 'شعاع یا طول (m)', 'Radius or length', 'length', 0.5),
      N('omega', 'سرعت زاویه‌ای ω (rad/s)', 'Angular speed', null, 10),
      T('shape', 'شکل (cylinder/sphere/hoop/rod/ring)', 'Shape', 'cylinder'),
    ],
    outputs: [O('inertia', 'ممان اینرسی', 'kg·m²'), O('angular_momentum', 'تکانه زاویه‌ای', 'kg·m²/s'), O('kinetic_energy', 'انرژی دورانی', 'J')],
    tests: [
      { input: { mass: 2, size: 0.5, omega: 10, shape: 'cylinder' }, expected: { inertia: 0.25, angular_momentum: 2.5, kinetic_energy: 12.5 } },
      { input: { mass: 2, size: 0.5, omega: 10, shape: 'sphere' }, expected: { inertia: 0.2, kinetic_energy: 10 } },
    ],
    compute({ mass, size, omega, shape }) {
      const key = String(shape).trim().toLowerCase();
      const table = {
        cylinder: [0.5, 'استوانه/دیسک توپر: I = ½mr²'],
        disk: [0.5, 'دیسک توپر: I = ½mr²'],
        hoop: [1, 'حلقه: I = mr²'],
        ring: [1, 'حلقه: I = mr²'],
        sphere: [0.4, 'کره توپر: I = ⅖mr²'],
        shell: [2 / 3, 'پوسته کره: I = ⅔mr²'],
        rod: [1 / 12, 'میله حول مرکز: I = mL²/12'],
      };
      if (!(key in table)) throw new Error('شکل باید cylinder، sphere، hoop، rod یا ring باشد');
      if (mass <= 0 || size <= 0) throw new Error('جرم و اندازه باید مثبت باشند');
      const [factor, note] = table[key];
      const inertia = factor * mass * size * size;
      return out(
        { inertia: round(inertia, 8), angular_momentum: round(inertia * omega, 8), kinetic_energy: round(0.5 * inertia * omega * omega, 8) },
        [note, `I = ${round(inertia, 6)} kg·m²`, `L = Iω = ${round(inertia * omega, 4)} ، K = ½Iω² = ${round(0.5 * inertia * omega * omega, 4)} J`],
      );
    },
  }),

  make({
    id: 'angular_momentum',
    name_fa: 'تکانه زاویه‌ای',
    name_en: 'Angular Momentum',
    category_path: ['فیزیک', 'مکانیک کلاسیک'],
    tags: ['تکانه', 'دوران', 'momentum'],
    description_fa: 'تکانه زاویه‌ای، انرژی دورانی و شتاب گریز از مرکز با ممان اینرسی معلوم.',
    formula_latex: 'L=I\\omega,\\quad K=\\tfrac12I\\omega^2',
    variables: [N('I', 'ممان اینرسی I (kg·m²)', 'Moment of inertia', null, 0.5), N('omega', 'سرعت زاویه‌ای ω (rad/s)', 'Angular speed', null, 4), N('r', 'شعاع چرخش r (m)', 'Radius', 'length', 0.5)],
    outputs: [O('angular_momentum', 'تکانه زاویه‌ای', 'kg·m²/s'), O('kinetic_energy', 'انرژی دورانی', 'J'), O('centripetal_acceleration', 'شتاب مرکزگرا', 'm/s²')],
    tests: [
      { input: { I: 0.5, omega: 4, r: 0.5 }, expected: { angular_momentum: 2, kinetic_energy: 4, centripetal_acceleration: 8 } },
      { input: { I: 2, omega: 3, r: 1 }, expected: { angular_momentum: 6, kinetic_energy: 9 } },
    ],
    compute({ I, omega, r }) {
      if (I <= 0) throw new Error('ممان اینرسی باید مثبت باشد');
      if (r <= 0) throw new Error('شعاع باید مثبت باشد');
      return out(
        {
          angular_momentum: round(I * omega, 8),
          kinetic_energy: round(0.5 * I * omega * omega, 8),
          centripetal_acceleration: round(omega * omega * r, 8),
          linear_speed: round(omega * r, 8),
        },
        [`L = Iω = ${round(I * omega, 4)} kg·m²/s`, `K = ½Iω² = ${round(0.5 * I * omega * omega, 4)} J`, `a_c = ω²r = ${round(omega * omega * r, 4)} m/s²`],
      );
    },
  }),

  make({
    id: 'bernoulli_equation',
    name_fa: 'معادله برنولی',
    name_en: "Bernoulli's Equation",
    category_path: ['فیزیک', 'مکانیک کلاسیک'],
    tags: ['شاره', 'فشار', 'bernoulli'],
    description_fa: 'محاسبه فشار نقطه دوم در جریان ایده‌آل با پایستگی انرژی.',
    formula_latex: 'P_1+\\tfrac12\\rho v_1^2+\\rho gh_1=P_2+\\tfrac12\\rho v_2^2+\\rho gh_2',
    difficulty: 'intermediate',
    variables: [N('P1', 'فشار نقطه ۱ (Pa)', 'Pressure 1', 'pressure', 101325), N('v1', 'سرعت ۱ (m/s)', 'Velocity 1', 'speed', 2), N('v2', 'سرعت ۲ (m/s)', 'Velocity 2', 'speed', 6), N('h1', 'ارتفاع ۱ (m)', 'Height 1', 'length', 0), N('h2', 'ارتفاع ۲ (m)', 'Height 2', 'length', 5), N('rho', 'چگالی شاره (kg/m³)', 'Density', 'density', 1000)],
    outputs: [O('P2', 'فشار نقطه ۲', 'Pa'), O('dynamic_pressure', 'فشار دینامیکی', 'Pa')],
    tests: [
      { input: { P1: 101325, v1: 2, v2: 6, h1: 0, h2: 5, rho: 1000 }, expected: { P2: 36291.75 } },
      { input: { P1: 100000, v1: 0, v2: 0, h1: 0, h2: 0, rho: 1000 }, expected: { P2: 100000 } },
    ],
    compute({ P1, v1, v2, h1, h2, rho }) {
      if (rho <= 0) throw new Error('چگالی باید مثبت باشد');
      const P2 = P1 + 0.5 * rho * (v1 * v1 - v2 * v2) + rho * g * (h1 - h2);
      return out(
        { P2: round(P2, 4), dynamic_pressure: round(0.5 * rho * v2 * v2, 4), head_loss: round((P1 - P2) / (rho * g), 6) },
        [`P₂ = P₁ + ½ρ(v₁²−v₂²) + ρg(h₁−h₂)`, `= ${round(P2, 2)} Pa`, `فشار دینامیکی نقطه ۲ = ½ρv₂² = ${round(0.5 * rho * v2 * v2, 2)} Pa`],
      );
    },
  }),

  make({
    id: 'continuity_equation',
    name_fa: 'معادله پیوستگی',
    name_en: 'Continuity Equation',
    category_path: ['فیزیک', 'مکانیک کلاسیک'],
    tags: ['شاره', 'دبی', 'continuity'],
    description_fa: 'دبی حجمی و سرعت جریان در لوله با تغییر سطح مقطع.',
    formula_latex: 'A_1v_1=A_2v_2=Q',
    variables: [N('A1', 'سطح مقطع ۱ (m²)', 'Area 1', 'area', 0.02), N('v1', 'سرعت ۱ (m/s)', 'Velocity 1', 'speed', 3), N('A2', 'سطح مقطع ۲ (m²)', 'Area 2', 'area', 0.005)],
    outputs: [O('flow_rate', 'دبی حجمی', 'm³/s'), O('v2', 'سرعت ۲', 'm/s'), O('mass_flow_water', 'دبی جرمی آب', 'kg/s')],
    tests: [
      { input: { A1: 0.02, v1: 3, A2: 0.005 }, expected: { flow_rate: 0.06, v2: 12 } },
      { input: { A1: 0.01, v1: 2, A2: 0.02 }, expected: { flow_rate: 0.02, v2: 1 } },
    ],
    compute({ A1, v1, A2 }) {
      if (A1 <= 0 || A2 <= 0) throw new Error('سطح مقطع‌ها باید مثبت باشند');
      const Q = A1 * v1;
      return out(
        { flow_rate: round(Q, 8), v2: round(Q / A2, 8), mass_flow_water: round(Q * 1000, 6) },
        [`Q = A₁v₁ = ${round(Q, 6)} m³/s`, `v₂ = Q/A₂ = ${round(Q / A2, 6)} m/s`, `دبی جرمی آب = ρQ = ${round(Q * 1000, 4)} kg/s`],
      );
    },
  }),

  make({
    id: 'buoyancy_archimedes',
    name_fa: 'نیروی شناوری ارشمیدس',
    name_en: "Archimedes' Buoyancy",
    category_path: ['فیزیک', 'مکانیک کلاسیک'],
    tags: ['شناوری', 'ارشمیدس', 'buoyancy'],
    description_fa: 'نیروی شناوری، وزن ظاهری و بررسی شناور یا غرق شدن جسم.',
    formula_latex: 'F_b=\\rho_f V g',
    variables: [N('volume', 'حجم جسم (m³)', 'Volume', 'volume', 0.002), N('fluid_density', 'چگالی شاره (kg/m³)', 'Fluid density', 'density', 1000), N('mass', 'جرم جسم (kg)', 'Object mass', 'mass', 5)],
    outputs: [O('buoyant_force', 'نیروی شناوری', 'N'), O('apparent_weight', 'وزن ظاهری', 'N'), O('state', 'وضعیت', null)],
    tests: [
      { input: { volume: 0.002, fluid_density: 1000, mass: 5 }, expected: { buoyant_force: 19.613, apparent_weight: 29.42, state: 'غرق می‌شود' } },
      { input: { volume: 0.002, fluid_density: 1000, mass: 1 }, expected: { state: 'شناور می‌شود' } },
    ],
    compute({ volume, fluid_density, mass }) {
      if (volume <= 0 || fluid_density <= 0) throw new Error('حجم و چگالی باید مثبت باشند');
      const buoyant = fluid_density * volume * g;
      const weight = mass * g;
      return out(
        { buoyant_force: round(buoyant, 4), weight: round(weight, 4), apparent_weight: round(weight - buoyant, 4), state: weight > buoyant ? 'غرق می‌شود' : 'شناور می‌شود' },
        [`F_b = ρVg = ${round(buoyant, 4)} N`, `وزن جسم = mg = ${round(weight, 4)} N`, weight > buoyant ? 'وزن بیشتر از شناوری است ⟹ غرق می‌شود' : 'نیروی شناوری کافی است ⟹ شناور می‌شود'],
      );
    },
  }),

  make({
    id: 'elastic_collision',
    name_fa: 'برخورد کاملاً کشسان',
    name_en: 'Elastic Collision (1D)',
    category_path: ['فیزیک', 'مکانیک کلاسیک'],
    tags: ['برخورد', 'کشسان', 'collision'],
    description_fa: 'سرعت‌های نهایی دو جسم در برخورد یک‌بعدی کاملاً کشسان با بررسی پایستگی انرژی.',
    formula_latex: "v_1'=\\frac{(m_1-m_2)u_1+2m_2u_2}{m_1+m_2}",
    difficulty: 'intermediate',
    variables: [N('m1', 'جرم ۱ (kg)', 'Mass 1', 'mass', 2), N('u1', 'سرعت اولیه ۱ (m/s)', 'Velocity 1', 'speed', 4), N('m2', 'جرم ۲ (kg)', 'Mass 2', 'mass', 3), N('u2', 'سرعت اولیه ۲ (m/s)', 'Velocity 2', 'speed', -1)],
    outputs: [O('v1', 'سرعت نهایی ۱', 'm/s'), O('v2', 'سرعت نهایی ۲', 'm/s'), O('energy_check', 'انرژی جنبشی کل', 'J')],
    tests: [
      { input: { m1: 2, u1: 4, m2: 3, u2: -1 }, expected: { v1: -2, v2: 3, energy_check: 17.5 } },
      { input: { m1: 1, u1: 2, m2: 1, u2: 0 }, expected: { v1: 0, v2: 2 } },
    ],
    compute({ m1, u1, m2, u2 }) {
      if (m1 <= 0 || m2 <= 0) throw new Error('جرم‌ها باید مثبت باشند');
      const total = m1 + m2;
      const v1 = ((m1 - m2) * u1 + 2 * m2 * u2) / total;
      const v2 = ((m2 - m1) * u2 + 2 * m1 * u1) / total;
      const energy = 0.5 * m1 * u1 * u1 + 0.5 * m2 * u2 * u2;
      return out(
        { v1: round(v1, 8), v2: round(v2, 8), energy_check: round(energy, 8), momentum_before: round(m1 * u1 + m2 * u2, 8), momentum_after: round(m1 * v1 + m2 * v2, 8) },
        [`v₁′ = ((m₁−m₂)u₁ + 2m₂u₂)/(m₁+m₂) = ${round(v1, 4)} m/s`, `v₂′ = ${round(v2, 4)} m/s`, `کنترل تکانه: ${round(m1 * u1 + m2 * u2, 4)} = ${round(m1 * v1 + m2 * v2, 4)}`],
      );
    },
  }),

  make({
    id: 'rocket_equation',
    name_fa: 'معادله موشک (تسیولکوفسکی)',
    name_en: 'Rocket Equation',
    category_path: ['فیزیک', 'مکانیک کلاسیک'],
    tags: ['موشک', 'تکانه', 'rocket'],
    description_fa: 'محاسبه تغییر سرعت موشک با سرعت خروج گاز و نسبت جرم اولیه به نهایی.',
    formula_latex: '\\Delta v=v_e\\ln\\frac{m_0}{m_1}',
    difficulty: 'advanced',
    variables: [N('exhaust', 'سرعت خروج گاز v_e (m/s)', 'Exhaust velocity', 'speed', 3000), N('m0', 'جرم اولیه (kg)', 'Initial mass', 'mass', 10000), N('m1', 'جرم نهایی (kg)', 'Final mass', 'mass', 3000)],
    outputs: [O('delta_v', 'تغییر سرعت Δv', 'm/s'), O('propellant_mass', 'جرم سوخت مصرفی', 'kg'), O('mass_ratio', 'نسبت جرم', null)],
    tests: [
      { input: { exhaust: 3000, m0: 10000, m1: 3000 }, expected: { delta_v: 3611.9, propellant_mass: 7000, mass_ratio: 3.333333 } },
      { input: { exhaust: 2000, m0: 5000, m1: 5000 }, expected: { delta_v: 0, mass_ratio: 1 } },
    ],
    compute({ exhaust, m0, m1 }) {
      if (m0 <= 0 || m1 <= 0 || m1 > m0) throw new Error('باید 0 < m₁ ≤ m₀ باشد');
      const ratio = m0 / m1;
      return out(
        { delta_v: round(exhaust * Math.log(ratio), 4), propellant_mass: round(m0 - m1, 6), mass_ratio: round(ratio, 8), propellant_fraction: round((1 - m1 / m0) * 100, 4) },
        [`Δv = v_e·ln(m₀/m₁)`, `= ${exhaust} × ln(${round(ratio, 4)})`, `= ${round(exhaust * Math.log(ratio), 2)} m/s`],
      );
    },
  }),

  // ── الکترومغناطیس ────────────────────────────────────────────────────────
  make({
    id: 'magnetic_force_wire',
    name_fa: 'نیروی مغناطیسی بر سیم',
    name_en: 'Magnetic Force on a Wire',
    category_path: ['فیزیک', 'الکترومغناطیس'],
    tags: ['مغناطیس', 'سیم', 'lorentz'],
    description_fa: 'نیروی وارد بر سیم حامل جریان در میدان مغناطیسی با زاویه دلخواه.',
    formula_latex: 'F=BIL\\sin\\theta',
    variables: [N('B', 'میدان مغناطیسی B (T)', 'Magnetic field', 'magnetic_field', 0.5), N('I', 'جریان I (A)', 'Current', 'current', 10), N('L', 'طول سیم L (m)', 'Length', 'length', 2), N('angle', 'زاویه با میدان (درجه)', 'Angle', 'angle', 90)],
    outputs: [O('force', 'نیرو', 'N'), O('force_per_meter', 'نیرو بر متر', 'N/m')],
    tests: [
      { input: { B: 0.5, I: 10, L: 2, angle: 90 }, expected: { force: 10, force_per_meter: 5 } },
      { input: { B: 0.5, I: 10, L: 2, angle: 30 }, expected: { force: 5 } },
    ],
    compute({ B, I, L, angle }) {
      const radians = (angle * Math.PI) / 180;
      const force = B * I * L * Math.sin(radians);
      return out(
        { force: round(force, 8), force_per_meter: round(force / L, 8), direction: 'عمود بر صفحه سیم و میدان (قاعده دست راست)' },
        [`F = BIL·sinθ = ${B}×${I}×${L}×sin(${angle}°)`, `= ${round(force, 6)} N`, 'جهت با قاعده دست راست تعیین می‌شود'],
      );
    },
  }),

  make({
    id: 'capacitance_parallel_plate',
    name_fa: 'خازن صفحه موازی',
    name_en: 'Parallel Plate Capacitor',
    category_path: ['فیزیک', 'الکترومغناطیس'],
    tags: ['خازن', 'ظرفیت', 'capacitor'],
    description_fa: 'ظرفیت، بار و انرژی ذخیره‌شده خازن صفحه موازی با دی‌الکتریک.',
    formula_latex: 'C=\\frac{\\varepsilon_0\\varepsilon_r A}{d},\\quad U=\\tfrac12CV^2',
    variables: [N('area', 'مساحت صفحات A (m²)', 'Plate area', 'area', 0.01), N('distance', 'فاصله صفحات d (m)', 'Separation', 'length', 0.001), N('er', 'ثابت دی‌الکتریک εr', 'Relative permittivity', null, 2), N('voltage', 'ولتاژ V (V)', 'Voltage', 'voltage', 12)],
    outputs: [O('capacitance', 'ظرفیت', 'F'), O('charge', 'بار', 'C'), O('energy', 'انرژی', 'J')],
    tests: [
      { input: { area: 0.01, distance: 0.001, er: 2, voltage: 12 }, expected: { capacitance: 1.770838e-10, charge: 2.125e-9 } },
      { input: { area: 0.02, distance: 0.002, er: 1, voltage: 10 }, expected: { capacitance: 8.854188e-11 } },
    ],
    compute({ area, distance, er, voltage }) {
      if (area <= 0 || distance <= 0 || er < 1) throw new Error('مساحت و فاصله باید مثبت و εr ≥ ۱ باشد');
      const capacitance = (eps0 * er * area) / distance;
      return out(
        { capacitance: round(capacitance, 16), charge: round(capacitance * voltage, 16), energy: round(0.5 * capacitance * voltage * voltage, 16), capacitance_pf: round(capacitance * 1e12, 4) },
        [`C = ε₀ε_r A/d = ${(capacitance).toExponential(4)} F`, `Q = CV = ${(capacitance * voltage).toExponential(4)} C`, `U = ½CV² = ${(0.5 * capacitance * voltage * voltage).toExponential(4)} J`],
      );
    },
  }),

  make({
    id: 'faraday_induced_emf',
    name_fa: 'نیروی محرکه القایی فارادی',
    name_en: 'Faraday Induced EMF',
    category_path: ['فیزیک', 'الکترومغناطیس'],
    tags: ['القا', 'فارادی', 'emf'],
    description_fa: 'نیروی محرکه القایی از تغییر شار مغناطیسی در یک حلقه با N دور.',
    formula_latex: '\\mathcal{E}=-N\\frac{\\Delta\\Phi}{\\Delta t},\\quad \\Phi=BA',
    variables: [N('turns', 'تعداد دور N', 'Turns', null, 100), N('B1', 'میدان اولیه B₁ (T)', 'Initial field', 'magnetic_field', 0), N('B2', 'میدان نهایی B₂ (T)', 'Final field', 'magnetic_field', 0.5), N('area', 'مساحت حلقه A (m²)', 'Loop area', 'area', 0.02), N('dt', 'زمان تغییر Δt (s)', 'Time interval', 'time', 0.1)],
    outputs: [O('emf', 'نیروی محرکه', 'V'), O('flux_change', 'تغییر شار', 'Wb'), O('current', 'جریان (R=1Ω)', 'A')],
    tests: [
      { input: { turns: 100, B1: 0, B2: 0.5, area: 0.02, dt: 0.1 }, expected: { emf: -10, magnitude: 10, flux_change: 0.01 } },
      { input: { turns: 50, B1: 0.2, B2: 0.2, area: 0.5, dt: 0.5 }, expected: { emf: 0 } },
    ],
    compute({ turns, B1, B2, area, dt }) {
      if (dt <= 0) throw new Error('بازه زمان باید مثبت باشد');
      if (turns < 1) throw new Error('تعداد دور باید حداقل ۱ باشد');
      const fluxChange = (B2 - B1) * area;
      const emf = (-turns * fluxChange) / dt;
      return out(
        { emf: round(emf, 8), flux_change: round(fluxChange, 8), current: round(emf, 8), magnitude: round(Math.abs(emf), 8) },
        [`ΔΦ = ΔB·A = ${round(fluxChange, 6)} Wb`, `|ℰ| = N·ΔΦ/Δt = ${round(Math.abs(emf), 6)} V`, 'علامت منفی نشانه قانون لنز است'],
      );
    },
  }),

  make({
    id: 'transformer_ratio',
    name_fa: 'ترانسفورماتور',
    name_en: 'Transformer',
    category_path: ['فیزیک', 'الکترومغناطیس'],
    tags: ['ترانس', 'ولتاژ', 'transformer'],
    description_fa: 'نسبت دور، ولتاژ و جریان ثانویه و توان ترانسفورماتور ایده‌آل.',
    formula_latex: '\\frac{V_2}{V_1}=\\frac{N_2}{N_1},\\quad V_1I_1=V_2I_2',
    variables: [N('V1', 'ولتاژ اولیه V₁ (V)', 'Primary voltage', 'voltage', 240), N('N1', 'دور اولیه N₁', 'Primary turns', null, 1000), N('N2', 'دور ثانویه N₂', 'Secondary turns', null, 50), N('I1', 'جریان اولیه I₁ (A)', 'Primary current', 'current', 1)],
    outputs: [O('V2', 'ولتاژ ثانویه', 'V'), O('I2', 'جریان ثانویه', 'A'), O('type', 'نوع ترانس', null), O('power', 'توان', 'W')],
    tests: [
      { input: { V1: 240, N1: 1000, N2: 50, I1: 1 }, expected: { V2: 12, I2: 20, type: 'کاهنده' } },
      { input: { V1: 240, N1: 1000, N2: 2000, I1: 0.5 }, expected: { V2: 480, I2: 0.25, type: 'افزاینده' } },
    ],
    compute({ V1, N1, N2, I1 }) {
      if (N1 <= 0 || N2 <= 0) throw new Error('تعداد دورها باید مثبت باشند');
      const V2 = (V1 * N2) / N1;
      const I2 = (V1 * I1) / V2;
      return out(
        { V2: round(V2, 6), I2: round(I2, 6), type: N2 > N1 ? 'افزاینده' : N2 < N1 ? 'کاهنده' : 'ایزوله', power: round(V1 * I1, 6), ratio: round(N2 / N1, 6) },
        [`V₂/V₁ = N₂/N₁ = ${round(N2 / N1, 4)}`, `V₂ = ${round(V2, 4)} V ، I₂ = ${round(I2, 4)} A`, `توان = V₁I₁ = ${round(V1 * I1, 4)} W`],
      );
    },
  }),

  make({
    id: 'rms_voltage',
    name_fa: 'ولتاژ مؤثر (RMS)',
    name_en: 'RMS Voltage',
    category_path: ['فیزیک', 'الکترومغناطیس'],
    tags: ['جریان متناوب', 'RMS', 'AC'],
    description_fa: 'محاسبه ولتاژ مؤثر، ولتاژ قله‌به‌قله و توان متوسط از ولتاژ قله.',
    formula_latex: 'V_{rms}=\\frac{V_p}{\\sqrt2},\\quad V_{pp}=2V_p',
    variables: [N('Vpeak', 'ولتاژ قله Vp (V)', 'Peak voltage', 'voltage', 170), N('resistance', 'مقاومت بار (Ω)', 'Load resistance', 'resistance', 100)],
    outputs: [O('vrms', 'ولتاژ مؤثر', 'V'), O('vpp', 'ولتاژ قله‌به‌قله', 'V'), O('power', 'توان متوسط', 'W')],
    tests: [
      { input: { Vpeak: 170, resistance: 100 }, expected: { vrms: 120.208, vpp: 340 } },
      { input: { Vpeak: 325, resistance: 50 }, expected: { vrms: 229.81 } },
    ],
    compute({ Vpeak, resistance }) {
      if (resistance <= 0) throw new Error('مقاومت باید مثبت باشد');
      const vrms = Vpeak / Math.SQRT2;
      return out(
        { vrms: round(vrms, 6), vpp: round(2 * Vpeak, 6), power: round((vrms * vrms) / resistance, 6), average_abs: round((2 * Vpeak) / Math.PI, 6) },
        [`V_rms = V_p/√2 = ${round(vrms, 4)} V`, `V_pp = 2V_p = ${round(2 * Vpeak, 4)} V`, `P_avg = V_rms²/R = ${round((vrms * vrms) / resistance, 4)} W`],
      );
    },
  }),

  make({
    id: 'lc_resonance',
    name_fa: 'تشدید مدار LC',
    name_en: 'LC Resonance',
    category_path: ['فیزیک', 'الکترومغناطیس'],
    tags: ['تشدید', 'سلف', 'خازن'],
    description_fa: 'فرکانس تشدید مدار LC، دوره تناوب و فرکانس زاویه‌ای.',
    formula_latex: 'f_0=\\frac{1}{2\\pi\\sqrt{LC}}',
    variables: [N('L', 'اندوکتانس L (H)', 'Inductance', 'inductance', 0.01), N('C', 'ظرفیت C (F)', 'Capacitance', 'capacitance', 1e-6)],
    outputs: [O('frequency', 'فرکانس تشدید', 'Hz'), O('angular_frequency', 'فرکانس زاویه‌ای', 'rad/s'), O('period', 'دوره', 's')],
    tests: [
      { input: { L: 0.01, C: 1e-6 }, expected: { frequency: 1591.549, period: 0.000628 } },
      { input: { L: 1, C: 1e-6 }, expected: { frequency: 159.155 } },
    ],
    compute({ L, C }) {
      if (L <= 0 || C <= 0) throw new Error('L و C باید مثبت باشند');
      const angular = 1 / Math.sqrt(L * C);
      return out(
        { frequency: round(angular / (2 * Math.PI), 6), angular_frequency: round(angular, 6), period: round((2 * Math.PI) / angular, 10) },
        [`ω₀ = 1/√(LC) = ${round(angular, 4)} rad/s`, `f₀ = ω₀/2π = ${round(angular / (2 * Math.PI), 4)} Hz`, `T = 2π√(LC) = ${round((2 * Math.PI) / angular, 8)} s`],
      );
    },
  }),

  // ── ترمودینامیک ──────────────────────────────────────────────────────────
  make({
    id: 'latent_heat',
    name_fa: 'گرمای نهان',
    name_en: 'Latent Heat',
    category_path: ['فیزیک', 'ترمودینامیک'],
    tags: ['گرما', 'ذوب', 'تبخیر'],
    description_fa: 'گرمای لازم برای تغییر فاز (ذوب/تبخیر) و زمان لازم با توان مشخص.',
    formula_latex: 'Q=mL',
    variables: [N('mass', 'جرم (kg)', 'Mass', 'mass', 2), N('latent', 'گرمای نهان (J/kg)', 'Latent heat', null, 334000), N('power', 'توان گرمادهی (W)', 'Heater power', 'power', 2000)],
    outputs: [O('heat', 'گرمای لازم', 'J'), O('heat_kj', 'گرما', 'kJ'), O('time', 'زمان لازم', 's')],
    tests: [
      { input: { mass: 2, latent: 334000, power: 2000 }, expected: { heat: 668000, time: 334 } },
      { input: { mass: 0.5, latent: 2260000, power: 1000 }, expected: { heat: 1130000 } },
    ],
    compute({ mass, latent, power }) {
      if (mass < 0) throw new Error('جرم باید نامنفی باشد');
      if (power <= 0) throw new Error('توان باید مثبت باشد');
      const heat = mass * latent;
      return out(
        { heat: round(heat, 6), heat_kj: round(heat / 1000, 6), time: round(heat / power, 6) },
        [`Q = mL = ${mass} × ${latent} = ${round(heat, 2)} J`, `= ${round(heat / 1000, 4)} kJ`, `زمان با توان ${power} W = ${round(heat / power, 2)} s`],
      );
    },
  }),

  make({
    id: 'thermal_expansion',
    name_fa: 'انبساط طولی حرارتی',
    name_en: 'Thermal Expansion',
    category_path: ['فیزیک', 'ترمودینامیک'],
    tags: ['انبساط', 'دما', 'expansion'],
    description_fa: 'تغییر طول، طول نهایی و کرنش حرارتی میله با ضریب انبساط خطی.',
    formula_latex: '\\Delta L=\\alpha L_0\\Delta T',
    variables: [N('alpha', 'ضریب انبساط α (1/K)', 'Expansion coefficient', null, 1.2e-5), N('L0', 'طول اولیه L₀ (m)', 'Initial length', 'length', 10), N('dT', 'تغییر دما ΔT (K)', 'Temperature change', 'temperature_delta', 50)],
    outputs: [O('delta_length', 'تغییر طول', 'm'), O('final_length', 'طول نهایی', 'm'), O('strain', 'کرنش', null)],
    tests: [
      { input: { alpha: 1.2e-5, L0: 10, dT: 50 }, expected: { delta_length: 0.006, final_length: 10.006, strain: 0.0006 } },
      { input: { alpha: 2.3e-5, L0: 2, dT: -40 }, expected: { delta_length: -0.00184 } },
    ],
    compute({ alpha, L0, dT }) {
      const delta = alpha * L0 * dT;
      return out(
        { delta_length: round(delta, 10), final_length: round(L0 + delta, 10), strain: round(alpha * dT, 12), stress_steel: round((alpha * dT) * 200e9, 4) },
        [`ΔL = αL₀ΔT = ${alpha} × ${L0} × ${dT}`, `= ${round(delta, 8)} m`, `طول نهایی = ${round(L0 + delta, 8)} m`],
      );
    },
  }),

  make({
    id: 'entropy_change',
    name_fa: 'تغییر آنتروپی',
    name_en: 'Entropy Change',
    category_path: ['فیزیک', 'ترمودینامیک'],
    tags: ['آنتروپی', 'دما', 'entropy'],
    description_fa: 'تغییر آنتروپی گرم شدن/سرد شدن ماده و مقایسه با ΔQ/T.',
    formula_latex: '\\Delta S=mc\\ln\\frac{T_2}{T_1}',
    variables: [N('mass', 'جرم (kg)', 'Mass', 'mass', 1), N('specific_heat', 'گرمای ویژه c (J/kg·K)', 'Specific heat', null, 4186), N('T1', 'دمای اولیه T₁ (K)', 'Initial temperature', 'temperature', 300), N('T2', 'دمای نهایی T₂ (K)', 'Final temperature', 'temperature', 350)],
    outputs: [O('entropy', 'تغییر آنتروپی', 'J/K'), O('heat', 'گرمای مبادله‌شده', 'J'), O('direction', 'جهت فرایند', null)],
    tests: [
      { input: { mass: 1, specific_heat: 4186, T1: 300, T2: 350 }, expected: { entropy: 645.28 } },
      { input: { mass: 2, specific_heat: 1000, T1: 400, T2: 400 }, expected: { entropy: 0 } },
    ],
    compute({ mass, specific_heat, T1, T2 }) {
      if (T1 <= 0 || T2 <= 0) throw new Error('دماها باید بر حسب کلوین و مثبت باشند');
      if (mass < 0) throw new Error('جرم باید نامنفی باشد');
      const entropy = mass * specific_heat * Math.log(T2 / T1);
      return out(
        { entropy: round(entropy, 6), heat: round(mass * specific_heat * (T2 - T1), 6), direction: entropy > 0 ? 'افزایش آنتروپی (طبیعی)' : entropy < 0 ? 'کاهش آنتروپی (نیازمند کار)' : 'بی‌تغییر' },
        [`ΔS = mc·ln(T₂/T₁) = ${mass}×${specific_heat}×ln(${T2}/${T1})`, `= ${round(entropy, 4)} J/K`, entropy > 0 ? 'فرایند خودبه‌خودی' : 'فرایند غیرخودبه‌خودی'],
      );
    },
  }),

  make({
    id: 'adiabatic_process',
    name_fa: 'فرایند بی‌دررو',
    name_en: 'Adiabatic Process',
    category_path: ['فیزیک', 'ترمودینامیک'],
    tags: ['بی‌دررو', 'گاز', 'adiabatic'],
    description_fa: 'فشار و دمای نهایی در تراکم بی‌دررو گاز با توان آیزنتروپیک γ.',
    formula_latex: 'P_1V_1^{\\gamma}=P_2V_2^{\\gamma},\\quad T_2=T_1\\left(\\frac{V_1}{V_2}\\right)^{\\gamma-1}',
    difficulty: 'intermediate',
    variables: [N('P1', 'فشار اولیه (Pa)', 'Initial pressure', 'pressure', 100000), N('V1', 'حجم اولیه (m³)', 'Initial volume', 'volume', 1), N('V2', 'حجم نهایی (m³)', 'Final volume', 'volume', 0.5), N('gamma', 'توان آیزنتروپیک γ', 'Heat capacity ratio', null, 1.4), N('T1', 'دمای اولیه (K)', 'Initial temperature', 'temperature', 300)],
    outputs: [O('P2', 'فشار نهایی', 'Pa'), O('T2', 'دمای نهایی', 'K'), O('work', 'کار انجام‌شده', 'J')],
    tests: [
      { input: { P1: 100000, V1: 1, V2: 0.5, gamma: 1.4, T1: 300 }, expected: { P2: 263902.3, T2: 395.85 } },
      { input: { P1: 101325, V1: 1, V2: 1, gamma: 1.4, T1: 300 }, expected: { P2: 101325, T2: 300 } },
    ],
    compute({ P1, V1, V2, gamma, T1 }) {
      if (V1 <= 0 || V2 <= 0) throw new Error('حجم‌ها باید مثبت باشند');
      if (gamma <= 1) throw new Error('γ باید بزرگ‌تر از ۱ باشد');
      const P2 = P1 * (V1 / V2) ** gamma;
      const T2 = T1 * (V1 / V2) ** (gamma - 1);
      const work = (P1 * V1 - P2 * V2) / (gamma - 1);
      return out(
        { P2: round(P2, 4), T2: round(T2, 4), work: round(work, 4) },
        [`P₂ = P₁(V₁/V₂)^γ = ${round(P2, 2)} Pa`, `T₂ = T₁(V₁/V₂)^(γ−1) = ${round(T2, 2)} K`, `کار = (P₁V₁ − P₂V₂)/(γ−1) = ${round(work, 2)} J`],
      );
    },
  }),

  // ── اپتیک ────────────────────────────────────────────────────────────────
  make({
    id: 'mirror_equation',
    name_fa: 'معادله آینه کروی',
    name_en: 'Spherical Mirror Equation',
    category_path: ['فیزیک', 'اپتیک'],
    tags: ['آینه', 'تصویر', 'optics'],
    description_fa: 'فاصله تصویر، بزرگ‌نمایی و نوع تصویر در آینه کروی.',
    formula_latex: '\\frac1f=\\frac1{d_o}+\\frac1{d_i},\\quad m=-\\frac{d_i}{d_o}',
    variables: [N('f', 'فاصله کانونی f (cm)', 'Focal length', 'length', 10), N('do', 'فاصله جسم (cm)', 'Object distance', 'length', 30)],
    outputs: [O('di', 'فاصله تصویر', 'cm'), O('magnification', 'بزرگ‌نمایی', null), O('image_type', 'نوع تصویر', null)],
    tests: [
      { input: { f: 10, do: 30 }, expected: { di: 15, magnification: -0.5 } },
      { input: { f: 10, do: 5 }, expected: { di: -10, magnification: 2 } },
    ],
    compute({ f, do: distance }) {
      if (distance === 0) throw new Error('فاصله جسم نباید صفر باشد');
      if (f === 0) throw new Error('فاصله کانونی نباید صفر باشد');
      const di = 1 / (1 / f - 1 / distance);
      const magnification = -di / distance;
      const imageType =
        di > 0 ? (Math.abs(magnification) > 1 ? 'حقیقی، معکوس، بزرگ‌تر' : 'حقیقی، معکوس، کوچک‌تر') : 'مجازی، مستقیم، بزرگ‌تر';
      return out(
        { di: round(di, 6), magnification: round(magnification, 6), image_type: imageType, image_height_ratio: round(Math.abs(magnification), 6) },
        [`1/f = 1/d_o + 1/d_i ⟹ d_i = ${round(di, 4)} cm`, `m = −d_i/d_o = ${round(magnification, 4)}`, `تصویر: ${imageType}`],
      );
    },
  }),

  make({
    id: 'diffraction_grating',
    name_fa: 'توری پراش',
    name_en: 'Diffraction Grating',
    category_path: ['فیزیک', 'اپتیک'],
    tags: ['پراش', 'توری', 'grating'],
    description_fa: 'زاویه پراش مرتبه m با فاصله شیارهای توری و طول موج نور.',
    formula_latex: 'd\\sin\\theta=m\\lambda',
    variables: [N('lines_per_mm', 'تعداد شیار در میلی‌متر', 'Lines per mm', null, 500), N('order', 'مرتبه پراش m', 'Order m', null, 2), N('wavelength_nm', 'طول موج (nm)', 'Wavelength', 'wavelength', 500)],
    outputs: [O('angle_deg', 'زاویه پراش', '°'), O('slit_spacing_nm', 'فاصله شیارها', 'nm'), O('max_order', 'بیشترین مرتبه', null)],
    tests: [
      { input: { lines_per_mm: 500, order: 2, wavelength_nm: 500 }, expected: { angle_deg: 30, slit_spacing_nm: 2000 } },
      { input: { lines_per_mm: 1000, order: 1, wavelength_nm: 600 }, expected: { angle_deg: 36.869898 } },
    ],
    compute({ lines_per_mm, order, wavelength_nm }) {
      if (lines_per_mm <= 0) throw new Error('تعداد شیار باید مثبت باشد');
      const spacing = 1e-3 / lines_per_mm;
      const wavelength = wavelength_nm * 1e-9;
      const sinTheta = (order * wavelength) / spacing;
      if (Math.abs(sinTheta) > 1) throw new Error('برای این مرتبه پراشی وجود ندارد (sinθ > 1)');
      return out(
        { angle_deg: round((Math.asin(sinTheta) * 180) / Math.PI, 6), slit_spacing_nm: round(spacing * 1e9, 6), max_order: Math.floor(spacing / wavelength) },
        [`d = 1/(${lines_per_mm} mm⁻¹) = ${round(spacing * 1e9, 2)} nm`, `sinθ = mλ/d = ${round(sinTheta, 6)}`, `θ = ${round((Math.asin(sinTheta) * 180) / Math.PI, 4)}°`],
      );
    },
  }),

  make({
    id: 'young_double_slit',
    name_fa: 'آزمایش دو شکاف یانگ',
    name_en: 'Young Double Slit',
    category_path: ['فیزیک', 'اپتیک'],
    tags: ['تداخل', 'شکاف', 'interference'],
    description_fa: 'فاصله نوارهای روشن و موقعیت نوار mام روی پرده در آزمایش یانگ.',
    formula_latex: '\\Delta y=\\frac{\\lambda L}{d}',
    variables: [N('wavelength_nm', 'طول موج (nm)', 'Wavelength', 'wavelength', 600), N('distance', 'فاصله تا پرده L (m)', 'Screen distance', 'length', 2), N('slit', 'فاصله شکاف‌ها d (mm)', 'Slit separation', 'length', 0.5), N('order', 'شماره نوار m', 'Fringe order', null, 3)],
    outputs: [O('fringe_spacing_mm', 'فاصله نوارها', 'mm'), O('fringe_position_mm', 'موقعیت نوار m', 'mm')],
    tests: [
      { input: { wavelength_nm: 600, distance: 2, slit: 0.5, order: 3 }, expected: { fringe_spacing_mm: 2.4, fringe_position_mm: 7.2 } },
      { input: { wavelength_nm: 500, distance: 1, slit: 1, order: 1 }, expected: { fringe_spacing_mm: 0.5 } },
    ],
    compute({ wavelength_nm, distance, slit, order }) {
      if (slit <= 0 || distance <= 0) throw new Error('فاصله‌ها باید مثبت باشند');
      const spacing = (wavelength_nm * 1e-9 * distance) / (slit * 1e-3);
      return out(
        { fringe_spacing_mm: round(spacing * 1000, 8), fringe_position_mm: round(spacing * order * 1000, 8), spacing_m: round(spacing, 12) },
        [`Δy = λL/d = ${round(spacing * 1000, 4)} mm`, `موقعیت نوار ${order}: y = mΔy = ${round(spacing * order * 1000, 4)} mm`],
      );
    },
  }),

  make({
    id: 'lens_power',
    name_fa: 'توان عدسی',
    name_en: 'Lens Power (Diopters)',
    category_path: ['فیزیک', 'اپتیک'],
    tags: ['عدسی', 'دیوپتر', 'lens'],
    description_fa: 'توان عدسی بر حسب دیوپتر و فاصله کانونی متناظر در محیط.',
    formula_latex: 'P=\\frac{1}{f\\,(\\mathrm m)}',
    variables: [N('focal_cm', 'فاصله کانونی (cm)', 'Focal length', 'length', 25)],
    outputs: [O('power', 'توان عدسی', 'D'), O('focal_m', 'فاصله کانونی', 'm'), O('type', 'نوع عدسی', null)],
    tests: [
      { input: { focal_cm: 25 }, expected: { power: 4, type: 'همگرا (محدب)' } },
      { input: { focal_cm: -50 }, expected: { power: -2, type: 'واگرا (مقعر)' } },
    ],
    compute({ focal_cm }) {
      if (focal_cm === 0) throw new Error('فاصله کانونی نباید صفر باشد');
      const focal = focal_cm / 100;
      return out(
        { power: round(1 / focal, 6), focal_m: round(focal, 6), type: focal > 0 ? 'همگرا (محدب)' : 'واگرا (مقعر)' },
        [`f = ${round(focal, 4)} m`, `P = 1/f = ${round(1 / focal, 4)} دیوپتر`, focal > 0 ? 'عدسی همگرا' : 'عدسی واگرا'],
      );
    },
  }),

  // ── فیزیک مدرن ───────────────────────────────────────────────────────────
  make({
    id: 'photoelectric_effect',
    name_fa: 'اثر فوتوالکتریک',
    name_en: 'Photoelectric Effect',
    category_path: ['فیزیک', 'فیزیک مدرن'],
    tags: ['فوتون', 'اینشتین', 'photoelectric'],
    description_fa: 'انرژی فوتون، انرژی جنبشی بیشینه الکترون و فرکانس آستانه.',
    formula_latex: 'K_{max}=hf-W=h\\frac{c}{\\lambda}-W',
    difficulty: 'advanced',
    variables: [N('wavelength_nm', 'طول موج نور (nm)', 'Wavelength', 'wavelength', 400), N('work_ev', 'تابع کار (eV)', 'Work function', null, 2)],
    outputs: [O('photon_energy_ev', 'انرژی فوتون', 'eV'), O('kinetic_ev', 'انرژی جنبشی بیشینه', 'eV'), O('threshold_nm', 'طول موج آستانه', 'nm')],
    tests: [
      { input: { wavelength_nm: 400, work_ev: 2 }, expected: { photon_energy_ev: 3.0996, kinetic_ev: 1.0996 } },
      { input: { wavelength_nm: 700, work_ev: 2 }, expected: { kinetic_ev: 0 } },
    ],
    compute({ wavelength_nm, work_ev }) {
      if (wavelength_nm <= 0) throw new Error('طول موج باید مثبت باشد');
      const wavelength = wavelength_nm * 1e-9;
      const photonEnergyJ = (h * c) / wavelength;
      const photonEnergyEv = photonEnergyJ / CONST.e;
      const kineticEv = photonEnergyEv - work_ev;
      return out(
        {
          photon_energy_ev: round(photonEnergyEv, 6),
          kinetic_ev: round(Math.max(0, kineticEv), 6),
          kinetic_j: Math.max(0, kineticEv) * CONST.e,
          threshold_nm: round((h * c) / (work_ev * CONST.e) * 1e9, 4),
          emits: kineticEv > 0,
        },
        [`E = hc/λ = ${round(photonEnergyEv, 4)} eV`, `K_max = E − W = ${round(kineticEv, 4)} eV`, kineticEv > 0 ? 'الکترون گسیل می‌شود' : 'انرژی فوتون کمتر از تابع کار است ⟹ گسیلی رخ نمی‌دهد'],
      );
    },
  }),

  make({
    id: 'de_broglie_wavelength',
    name_fa: 'طول موج دوبروی',
    name_en: 'de Broglie Wavelength',
    category_path: ['فیزیک', 'فیزیک مدرن'],
    tags: ['کوانتوم', 'موج ماده', 'de broglie'],
    description_fa: 'طول موج ماده برای ذره با جرم و سرعت داده‌شده یا انرژی جنبشی.',
    formula_latex: '\\lambda=\\frac{h}{mv}',
    difficulty: 'advanced',
    variables: [N('mass', 'جرم ذره (kg)', 'Particle mass', 'mass', 9.1093837015e-31), N('velocity', 'سرعت (m/s)', 'Velocity', 'speed', 1e6)],
    outputs: [O('wavelength_m', 'طول موج', 'm'), O('wavelength_nm', 'طول موج', 'nm'), O('momentum', 'تکانه', 'kg·m/s')],
    tests: [
      { input: { mass: 9.1093837015e-31, velocity: 1e6 }, expected: { wavelength_nm: 0.7273 } },
      { input: { mass: 1, velocity: 1 }, expected: { wavelength_m: 6.62607e-34 } },
    ],
    compute({ mass, velocity }) {
      if (mass <= 0 || velocity <= 0) throw new Error('جرم و سرعت باید مثبت باشند');
      const momentum = mass * velocity;
      const wavelength = h / momentum;
      return out(
        { wavelength_m: round(wavelength, 16), wavelength_nm: round(wavelength * 1e9, 8), momentum: momentum.toExponential(6), ke_ev: round((0.5 * mass * velocity * velocity) / CONST.e, 8) },
        [`p = mv = ${momentum.toExponential(4)} kg·m/s`, `λ = h/p = ${wavelength.toExponential(4)} m`, `= ${round(wavelength * 1e9, 6)} nm`],
      );
    },
  }),

  make({
    id: 'bohr_energy',
    name_fa: 'ترازهای انرژی بور',
    name_en: 'Bohr Energy Levels',
    category_path: ['فیزیک', 'فیزیک مدرن'],
    tags: ['اتم', 'بور', 'کوانتوم'],
    description_fa: 'انرژی تراز nام اتم هیدروژن، شعاع مدار و سرعت الکترون.',
    formula_latex: 'E_n=-\\frac{13.6}{n^2}\\,\\mathrm{eV}',
    difficulty: 'intermediate',
    variables: [N('n', 'عدد کوانتومی اصلی n', 'Principal quantum number', null, 2, { min: 1, max: 20 })],
    outputs: [O('energy_ev', 'انرژی تراز', 'eV'), O('radius_nm', 'شعاع مدار', 'nm'), O('velocity_ms', 'سرعت الکترون', 'm/s')],
    tests: [
      { input: { n: 2 }, expected: { energy_ev: -3.4, radius_nm: 0.211667 } },
      { input: { n: 1 }, expected: { energy_ev: -13.6, radius_nm: 0.0529177 } },
    ],
    compute({ n }) {
      if (!Number.isInteger(n) || n < 1 || n > 20) throw new Error('n باید عدد صحیح بین ۱ و ۲۰ باشد');
      const energy = -13.605693 / (n * n);
      return out(
        { energy_ev: round(energy, 6), radius_nm: round(0.0529177 * n * n, 7), velocity_ms: round((2.187691e6 / n), 4), energy_j: energy * CONST.e },
        [`Eₙ = −13.6/n² = ${round(energy, 4)} eV`, `rₙ = n²a₀ = ${round(0.0529177 * n * n, 5)} nm`, `vₙ = v₁/n = ${round(2.187691e6 / n, 2)} m/s`],
      );
    },
  }),

  make({
    id: 'rydberg_wavelength',
    name_fa: 'فرمول ریدبرگ',
    name_en: 'Rydberg Formula',
    category_path: ['فیزیک', 'فیزیک مدرن'],
    tags: ['طیف', 'هیدروژن', 'rydberg'],
    description_fa: 'طول موج خطوط طیفی هیدروژن و انرژی فوتون گسیلی بین دو تراز.',
    formula_latex: '\\frac1\\lambda=R\\left(\\frac{1}{n_1^2}-\\frac{1}{n_2^2}\\right)',
    difficulty: 'intermediate',
    variables: [N('n1', 'تراز پایین n₁', 'Lower level', null, 1, { min: 1 }), N('n2', 'تراز بالا n₂', 'Upper level', null, 2, { min: 1 })],
    outputs: [O('wavelength_nm', 'طول موج', 'nm'), O('energy_ev', 'انرژی فوتون', 'eV'), O('series', 'سری طیفی', null)],
    tests: [
      { input: { n1: 1, n2: 2 }, expected: { wavelength_nm: 121.502, energy_ev: 10.2 } },
      { input: { n1: 2, n2: 3 }, expected: { wavelength_nm: 656.1 } },
    ],
    compute({ n1, n2 }) {
      if (!Number.isInteger(n1) || !Number.isInteger(n2) || n1 < 1 || n2 < 1) throw new Error('n₁ و n₂ باید عدد صحیح مثبت باشند');
      if (n2 <= n1) throw new Error('باید n₂ > n₁ باشد');
      const inverse = CONST.Ry * (1 / (n1 * n1) - 1 / (n2 * n2));
      const wavelength = 1 / inverse;
      const series = { 1: 'لایمن (فرابنفش)', 2: 'بالمر (مرئی)', 3: 'پاشن (فروسرخ)', 4: 'براکت', 5: 'پفوند' }[n1] || 'سری‌های بالا';
      return out(
        { wavelength_nm: round(wavelength * 1e9, 4), energy_ev: round(13.605693 * (1 / (n1 * n1) - 1 / (n2 * n2)), 6), series },
        [`1/λ = R(1/n₁² − 1/n₂²) = ${inverse.toExponential(4)} m⁻¹`, `λ = ${round(wavelength * 1e9, 2)} nm`, `سری: ${series}`],
      );
    },
  }),

  make({
    id: 'heisenberg_uncertainty',
    name_fa: 'اصل عدم قطعیت هایزنبرگ',
    name_en: 'Heisenberg Uncertainty',
    category_path: ['فیزیک', 'فیزیک مدرن'],
    tags: ['کوانتوم', 'عدم قطعیت', 'uncertainty'],
    description_fa: 'کمینه عدم قطعیت تکانه و انرژی برای عدم قطعیت مکان/زمان داده‌شده.',
    formula_latex: '\\Delta p\\ge\\frac{\\hbar}{2\\Delta x},\\quad \\Delta E\\ge\\frac{\\hbar}{2\\Delta t}',
    difficulty: 'advanced',
    variables: [N('dx', 'عدم قطعیت مکان Δx (m)', 'Position uncertainty', 'length', 1e-10), N('dt', 'عدم قطعیت زمان Δt (s)', 'Time uncertainty', 'time', 1e-10)],
    outputs: [O('delta_p', 'عدم قطعیت تکانه', 'kg·m/s'), O('delta_v_electron', 'عدم قطعیت سرعت الکترون', 'm/s'), O('delta_e_ev', 'عدم قطعیت انرژی', 'eV')],
    tests: [
      { input: { dx: 1e-10, dt: 1e-10 }, expected: { delta_p: 5.27286e-25, delta_e_ev: 3.2911e-6 } },
      { input: { dx: 1e-9, dt: 1e-9 }, expected: { delta_p: 5.27286e-26 } },
    ],
    compute({ dx, dt }) {
      if (dx <= 0 || dt <= 0) throw new Error('عدم قطعیت‌ها باید مثبت باشند');
      const dp = hbar / (2 * dx);
      const dE = hbar / (2 * dt);
      return out(
        { delta_p: dp, delta_v_electron: round(dp / CONST.me, 6), delta_e_ev: dE / CONST.e, delta_e_j: dE },
        [`Δp ≥ ħ/(2Δx) = ${dp.toExponential(4)} kg·m/s`, `Δv ≥ Δp/mₑ = ${round(dp / CONST.me, 4)} m/s`, `ΔE ≥ ħ/(2Δt) = ${(dE / CONST.e).toExponential(4)} eV`],
      );
    },
  }),
];
