// Phase 5 — chemistry and engineering packs.
import { make, N, T, O, round, out, CONST } from './formula-kit.js';

const { g, R, R_atm, F } = CONST;

export const PHASE5_FORMULAS = [
  // ── شیمی: استوکیومتری ────────────────────────────────────────────────────
  make({
    id: 'limiting_reagent',
    name_fa: 'واکنش‌دهنده محدودکننده',
    name_en: 'Limiting Reagent',
    category_path: ['شیمی', 'استوکیومتری'],
    tags: ['استوکیومتری', 'محدودکننده', 'stoichiometry'],
    description_fa: 'تعیین واکنش‌دهنده محدودکننده و جرم فرآورده از جرم و جرم مولی دو واکنش‌دهنده.',
    formula_latex: 'n_i=\\frac{m_i}{M_i},\\qquad \\text{limit}=\\arg\\min\\frac{n_i}{\\nu_i}',
    difficulty: 'intermediate',
    variables: [
      N('mass_a', 'جرم واکنش‌دهنده A (g)', 'Mass A', 'mass', 4),
      N('molar_mass_a', 'جرم مولی A (g/mol)', 'Molar mass A', null, 2),
      N('coef_a', 'ضریب استوکیومتری A', 'Coefficient A', null, 1),
      N('mass_b', 'جرم واکنش‌دهنده B (g)', 'Mass B', 'mass', 106.5),
      N('molar_mass_b', 'جرم مولی B (g/mol)', 'Molar mass B', null, 71),
      N('coef_b', 'ضریب استوکیومتری B', 'Coefficient B', null, 1),
      N('product_molar_mass', 'جرم مولی فرآورده (g/mol)', 'Product molar mass', null, 36.46),
      N('product_coef', 'ضریب فرآورده', 'Product coefficient', null, 2),
    ],
    outputs: [O('limiting', 'واکنش‌دهنده محدودکننده', null), O('moles_product', 'مول فرآورده', 'mol'), O('mass_product', 'جرم فرآورده', 'g'), O('excess_moles', 'مول اضافی واکنش‌دهنده دیگر', 'mol')],
    tests: [
      { input: { mass_a: 4, molar_mass_a: 2, coef_a: 1, mass_b: 106.5, molar_mass_b: 71, coef_b: 1, product_molar_mass: 36.46, product_coef: 2 }, expected: { limiting: 'B', moles_product: 3, mass_product: 109.38 } },
      { input: { mass_a: 2, molar_mass_a: 2, coef_a: 1, mass_b: 142, molar_mass_b: 71, coef_b: 1, product_molar_mass: 36.46, product_coef: 2 }, expected: { limiting: 'A', mass_product: 72.92 } },
    ],
    compute({ mass_a, molar_mass_a, coef_a, mass_b, molar_mass_b, coef_b, product_molar_mass, product_coef }) {
      if ([molar_mass_a, molar_mass_b, coef_a, coef_b, product_molar_mass, product_coef].some((value) => value <= 0)) {
        throw new Error('جرم‌های مولی و ضرایب باید مثبت باشند');
      }
      if (mass_a < 0 || mass_b < 0) throw new Error('جرم‌ها باید نامنفی باشند');
      const molesA = mass_a / molar_mass_a;
      const molesB = mass_b / molar_mass_b;
      const ratioA = molesA / coef_a;
      const ratioB = molesB / coef_b;
      const limiting = ratioA <= ratioB ? 'A' : 'B';
      const limitingRatio = Math.min(ratioA, ratioB);
      const molesProduct = limitingRatio * product_coef;
      const excess = Math.abs(ratioA - ratioB) * (limiting === 'A' ? coef_b : coef_a);
      return out(
        {
          limiting,
          moles_product: round(molesProduct, 8),
          mass_product: round(molesProduct * product_molar_mass, 6),
          excess_moles: round(excess, 8),
          moles_a: round(molesA, 6),
          moles_b: round(molesB, 6),
        },
        [
          `n(A) = ${round(molesA, 4)} mol ، n(B) = ${round(molesB, 4)} mol`,
          `نسبت‌ها: A = ${round(ratioA, 4)} ، B = ${round(ratioB, 4)} ⟹ ${limiting} محدودکننده است`,
          `مول فرآورده = ${round(molesProduct, 4)} ⟹ جرم = ${round(molesProduct * product_molar_mass, 3)} g`,
        ],
      );
    },
  }),

  make({
    id: 'mole_conversion',
    name_fa: 'تبدیل مول و ذرات',
    name_en: 'Mole Conversions',
    category_path: ['شیمی', 'استوکیومتری'],
    tags: ['مول', 'آووگادرو', 'mole'],
    description_fa: 'تبدیل جرم به مول، تعداد ذرات و جرم یک مولکول با عدد آووگادرو.',
    formula_latex: 'n=\\frac{m}{M},\\qquad N=nN_A',
    variables: [N('mass', 'جرم نمونه (g)', 'Sample mass', 'mass', 58.44), N('molar_mass', 'جرم مولی (g/mol)', 'Molar mass', null, 58.44)],
    outputs: [O('moles', 'مول', 'mol'), O('particles', 'تعداد ذرات', null), O('molecules_per_gram', 'ذره در گرم', null)],
    tests: [
      { input: { mass: 58.44, molar_mass: 58.44 }, expected: { moles: 1, particles: 6.02214076e23 } },
      { input: { mass: 18, molar_mass: 18 }, expected: { moles: 1 } },
    ],
    compute({ mass, molar_mass }) {
      if (molar_mass <= 0) throw new Error('جرم مولی باید مثبت باشد');
      const moles = mass / molar_mass;
      return out(
        { moles: round(moles, 8), particles: moles * CONST.NA, molecules_per_gram: CONST.NA / molar_mass, mass_per_molecule: (molar_mass / CONST.NA).toExponential(6) },
        [`n = m/M = ${mass}/${molar_mass} = ${round(moles, 6)} mol`, `N = n·N_A = ${(moles * CONST.NA).toExponential(4)} ذره`, `N_A/M = ${(CONST.NA / molar_mass).toExponential(4)} ذره بر گرم`],
      );
    },
  }),

  make({
    id: 'gas_density_molar_mass',
    name_fa: 'چگالی گاز و جرم مولی',
    name_en: 'Gas Density & Molar Mass',
    category_path: ['شیمی', 'استوکیومتری'],
    tags: ['گاز', 'چگالی', 'molar mass'],
    description_fa: 'محاسبه چگالی گاز از معادله گاز ایده‌آل و جرم مولی متناظر.',
    formula_latex: '\\rho=\\frac{PM}{RT}',
    variables: [N('P', 'فشار P (Pa)', 'Pressure', 'pressure', 101325), N('T', 'دما T (K)', 'Temperature', 'temperature', 273.15), N('molar_mass_g', 'جرم مولی (g/mol)', 'Molar mass', null, 28.97)],
    outputs: [O('density', 'چگالی گاز', 'kg/m³'), O('density_gl', 'چگالی', 'g/L'), O('molar_volume', 'حجم مولی', 'L/mol')],
    tests: [
      { input: { P: 101325, T: 273.15, molar_mass_g: 28.97 }, expected: { density: 1.2923, molar_volume: 22.414 } },
      { input: { P: 101325, T: 273.15, molar_mass_g: 32 }, expected: { density: 1.4275 } },
    ],
    compute({ P, T, molar_mass_g }) {
      if (T <= 0) throw new Error('دما باید بر حسب کلوین و مثبت باشد');
      if (P <= 0 || molar_mass_g <= 0) throw new Error('فشار و جرم مولی باید مثبت باشند');
      const density = (P * (molar_mass_g / 1000)) / (R * T);
      return out(
        { density: round(density, 6), density_gl: round(density, 6), molar_volume: round(((R * T) / P) * 1000, 6), molar_mass_from_density: round((density * R * T) / P * 1000, 6) },
        [`ρ = PM/RT = ${round(density, 4)} kg/m³`, `= ${round(density, 4)} g/L`, `حجم مولی = RT/P = ${round((R * T) / P * 1000, 3)} L/mol`],
      );
    },
  }),

  make({
    id: 'dalton_partial_pressure',
    name_fa: 'فشار جزئی دالتون',
    name_en: "Dalton's Partial Pressure",
    category_path: ['شیمی', 'استوکیومتری'],
    tags: ['گاز', 'فشار جزئی', 'dalton'],
    description_fa: 'فشار جزئی سه گاز در مخلوط از کسر مولی و فشار کل.',
    formula_latex: 'p_i=x_iP_{tot},\\quad \\sum p_i=P_{tot}',
    variables: [N('n1', 'مول گاز ۱', 'Moles 1', null, 1), N('n2', 'مول گاز ۲', 'Moles 2', null, 2), N('n3', 'مول گاز ۳', 'Moles 3', null, 1), N('Ptotal', 'فشار کل (Pa)', 'Total pressure', 'pressure', 101325)],
    outputs: [O('p1', 'فشار جزئی ۱', 'Pa'), O('p2', 'فشار جزئی ۲', 'Pa'), O('p3', 'فشار جزئی ۳', 'Pa'), O('x1', 'کسر مولی ۱', null)],
    tests: [
      { input: { n1: 1, n2: 2, n3: 1, Ptotal: 101325 }, expected: { p1: 25331.25, p2: 50662.5, x1: 0.25 } },
      { input: { n1: 2, n2: 2, n3: 0, Ptotal: 100000 }, expected: { p1: 50000 } },
    ],
    compute({ n1, n2, n3, Ptotal }) {
      if (n1 < 0 || n2 < 0 || n3 < 0) throw new Error('مول‌ها باید نامنفی باشند');
      const total = n1 + n2 + n3;
      if (total <= 0) throw new Error('مجموع مول‌ها باید مثبت باشد');
      if (Ptotal <= 0) throw new Error('فشار کل باید مثبت باشد');
      const fraction = (n) => n / total;
      return out(
        {
          p1: round(fraction(n1) * Ptotal, 6),
          p2: round(fraction(n2) * Ptotal, 6),
          p3: round(fraction(n3) * Ptotal, 6),
          x1: round(fraction(n1), 6),
          x2: round(fraction(n2), 6),
        },
        [`n_total = ${total} mol`, `x₁ = ${round(fraction(n1), 4)} ⟹ p₁ = ${round(fraction(n1) * Ptotal, 2)} Pa`, `p₂ = ${round(fraction(n2) * Ptotal, 2)} Pa ، p₃ = ${round(fraction(n3) * Ptotal, 2)} Pa`],
      );
    },
  }),

  make({
    id: 'graham_effusion',
    name_fa: 'قانون گراهام (نفوذ گاز)',
    name_en: "Graham's Law",
    category_path: ['شیمی', 'استوکیومتری'],
    tags: ['گاز', 'نفوذ', 'graham'],
    description_fa: 'نسبت سرعت نفوذ دو گاز و زمان لازم برای عبور از سوراخ.',
    formula_latex: '\\frac{r_1}{r_2}=\\sqrt{\\frac{M_2}{M_1}}',
    variables: [N('M1', 'جرم مولی گاز ۱ (g/mol)', 'Molar mass 1', null, 2), N('M2', 'جرم مولی گاز ۲ (g/mol)', 'Molar mass 2', null, 32), N('time1', 'زمان عبور گاز ۱ (s)', 'Effusion time 1', 'time', 10)],
    outputs: [O('rate_ratio', 'نسبت سرعت نفوذ', null), O('time2', 'زمان عبور گاز ۲', 's'), O('lighter', 'گاز سبک‌تر', null)],
    tests: [
      { input: { M1: 2, M2: 32, time1: 10 }, expected: { rate_ratio: 4, time2: 40, lighter: 'گاز ۱' } },
      { input: { M1: 32, M2: 2, time1: 40 }, expected: { rate_ratio: 0.25, time2: 10 } },
    ],
    compute({ M1, M2, time1 }) {
      if (M1 <= 0 || M2 <= 0) throw new Error('جرم‌های مولی باید مثبت باشند');
      const ratio = Math.sqrt(M2 / M1);
      return out(
        { rate_ratio: round(ratio, 6), time2: round(time1 * ratio, 6), lighter: M1 < M2 ? 'گاز ۱' : M1 > M2 ? 'گاز ۲' : 'برابر' },
        [`r₁/r₂ = √(M₂/M₁) = √(${M2}/${M1}) = ${round(ratio, 4)}`, `t₂ = t₁·(r₁/r₂) = ${round(time1 * ratio, 3)} s`, `گاز سبک‌تر سریع‌تر نفوذ می‌کند: ${M1 < M2 ? 'گاز ۱' : 'گاز ۲'}`],
      );
    },
  }),

  make({
    id: 'percent_composition',
    name_fa: 'درصد جرمی عنصر',
    name_en: 'Percent Composition',
    category_path: ['شیمی', 'استوکیومتری'],
    tags: ['درصد جرمی', 'ترکیب', 'composition'],
    description_fa: 'درصد جرمی یک عنصر در ترکیب و جرم آن عنصر در مقدار دلخواه از ماده.',
    formula_latex: '\\%X=\\frac{n\\,M_X}{M_{compound}}\\times100',
    variables: [N('element_mass', 'جرم کل عنصر در فرمول (g/mol)', 'Element mass in formula', null, 32), N('compound_molar_mass', 'جرم مولی ترکیب (g/mol)', 'Compound molar mass', null, 64), N('sample_mass', 'جرم نمونه (g)', 'Sample mass', 'mass', 250)],
    outputs: [O('percent', 'درصد جرمی', '%'), O('element_mass_in_sample', 'جرم عنصر در نمونه', 'g'), O('mole_fraction_hint', 'سهم جرمی', null)],
    tests: [
      { input: { element_mass: 32, compound_molar_mass: 64, sample_mass: 250 }, expected: { percent: 50, element_mass_in_sample: 125 } },
      { input: { element_mass: 12, compound_molar_mass: 44, sample_mass: 100 }, expected: { percent: 27.272727 } },
    ],
    compute({ element_mass, compound_molar_mass, sample_mass }) {
      if (compound_molar_mass <= 0) throw new Error('جرم مولی ترکیب باید مثبت باشد');
      if (element_mass < 0 || element_mass > compound_molar_mass) throw new Error('جرم عنصر باید بین ۰ و جرم مولی ترکیب باشد');
      const percent = (element_mass / compound_molar_mass) * 100;
      return out(
        { percent: round(percent, 6), element_mass_in_sample: round((percent / 100) * sample_mass, 6), fraction: round(element_mass / compound_molar_mass, 6) },
        [`درصد جرمی = (${element_mass}/${compound_molar_mass})×100 = ${round(percent, 3)}٪`, `در ${sample_mass} g نمونه: ${round((percent / 100) * sample_mass, 3)} g عنصر`],
      );
    },
  }),

  make({
    id: 'molality_calculator',
    name_fa: 'مولالیته و کسر مولی',
    name_en: 'Molality & Mole Fraction',
    category_path: ['شیمی', 'استوکیومتری'],
    tags: ['مولالیته', 'محلول', 'molality'],
    description_fa: 'مولالیته، کسر مولی حل‌شونده و درصد جرمی محلول آبی.',
    formula_latex: 'm=\\frac{n_{solute}}{m_{solvent}(\\mathrm{kg})},\\quad x=\\frac{n}{n+n_{solvent}}',
    variables: [N('moles_solute', 'مول حل‌شونده', 'Moles of solute', null, 0.5), N('solvent_kg', 'جرم حلال (kg)', 'Solvent mass', 'mass', 2), N('molar_mass_solute', 'جرم مولی حل‌شونده (g/mol)', 'Solute molar mass', null, 58.44)],
    outputs: [O('molality', 'مولالیته', 'mol/kg'), O('mole_fraction', 'کسر مولی حل‌شونده', null), O('mass_percent', 'درصد جرمی', '%')],
    tests: [
      { input: { moles_solute: 0.5, solvent_kg: 2, molar_mass_solute: 58.44 }, expected: { molality: 0.25, mass_percent: 1.4397 } },
      { input: { moles_solute: 1, solvent_kg: 1, molar_mass_solute: 58.44 }, expected: { molality: 1 } },
    ],
    compute({ moles_solute, solvent_kg, molar_mass_solute }) {
      if (solvent_kg <= 0) throw new Error('جرم حلال باید مثبت باشد');
      if (moles_solute < 0) throw new Error('مول حل‌شونده باید نامنفی باشد');
      const molesSolvent = (solvent_kg * 1000) / 18.015;
      const soluteMass = moles_solute * molar_mass_solute;
      const totalMass = soluteMass + solvent_kg * 1000;
      return out(
        {
          molality: round(moles_solute / solvent_kg, 8),
          mole_fraction: round(moles_solute / (moles_solute + molesSolvent), 8),
          mass_percent: round((soluteMass / totalMass) * 100, 6),
          solute_mass_g: round(soluteMass, 6),
        },
        [`m = n/جرم حلال = ${round(moles_solute / solvent_kg, 4)} mol/kg`, `کسر مولی = ${round(moles_solute / (moles_solute + molesSolvent), 4)}`, `درصد جرمی = ${round((soluteMass / totalMass) * 100, 4)}٪`],
      );
    },
  }),

  make({
    id: 'ppm_concentration',
    name_fa: 'غلظت ppm',
    name_en: 'ppm Concentration',
    category_path: ['شیمی', 'استوکیومتری'],
    tags: ['ppm', 'غلظت', 'concentration'],
    description_fa: 'تبدیل جرم حل‌شونده به ppm، درصد و مولاریته.',
    formula_latex: '\\mathrm{ppm}=\\frac{m_{solute}(\\mathrm{mg})}{V(\\mathrm L)}',
    variables: [N('mass_mg', 'جرم حل‌شونده (mg)', 'Solute mass', null, 5), N('volume_L', 'حجم محلول (L)', 'Volume', 'volume', 1), N('molar_mass', 'جرم مولی (g/mol)', 'Molar mass', null, 100)],
    outputs: [O('ppm', 'غلظت', 'ppm'), O('percent', 'درصد', '%'), O('molarity', 'مولاریته', 'mol/L')],
    tests: [
      { input: { mass_mg: 5, volume_L: 1, molar_mass: 100 }, expected: { ppm: 5, percent: 0.0005, molarity: 5e-5 } },
      { input: { mass_mg: 250, volume_L: 0.5, molar_mass: 50 }, expected: { ppm: 500 } },
    ],
    compute({ mass_mg, volume_L, molar_mass }) {
      if (volume_L <= 0) throw new Error('حجم باید مثبت باشد');
      if (molar_mass <= 0) throw new Error('جرم مولی باید مثبت باشد');
      const ppm = mass_mg / volume_L;
      const grams = mass_mg / 1000;
      return out(
        { ppm: round(ppm, 8), percent: round((ppm / 10000), 8), molarity: round(grams / molar_mass / volume_L, 12) },
        [`ppm = mg/L = ${round(ppm, 4)}`, `درصد = ppm/10⁴ = ${round(ppm / 10000, 6)}٪`, `مولاریته = ${(grams / molar_mass / volume_L).toExponential(4)} mol/L`],
      );
    },
  }),

  // ── شیمی: اسید و باز ─────────────────────────────────────────────────────
  make({
    id: 'strong_base_ph',
    name_fa: 'pH باز قوی',
    name_en: 'Strong Base pH',
    category_path: ['شیمی', 'اسید و باز'],
    tags: ['pH', 'باز', 'pOH'],
    description_fa: 'محاسبه pOH، pH و غلظت یون‌ها برای باز قوی تک‌ظرفیتی.',
    formula_latex: 'pOH=-\\log[OH^-],\\quad pH=14-pOH',
    variables: [N('concentration', 'غلظت باز (mol/L)', 'Base concentration', 'concentration', 0.01)],
    outputs: [O('pOH', 'pOH', null), O('pH', 'pH', null), O('h_concentration', 'غلظت [H⁺]', 'mol/L')],
    tests: [
      { input: { concentration: 0.01 }, expected: { pOH: 2, pH: 12 } },
      { input: { concentration: 0.0001 }, expected: { pOH: 4, pH: 10 } },
    ],
    compute({ concentration }) {
      if (concentration <= 0) throw new Error('غلظت باید مثبت باشد');
      const pOH = -Math.log10(concentration);
      return out(
        { pOH: round(pOH, 4), pH: round(14 - pOH, 4), h_concentration: 10 ** -(14 - pOH), oh_concentration: concentration, nature: 14 - pOH > 7 ? 'بازی' : 'خنثی/اسیدی' },
        [`pOH = −log(${concentration}) = ${round(pOH, 4)}`, `pH = 14 − pOH = ${round(14 - pOH, 4)}`, `[H⁺] = 10^(−pH) = ${(10 ** -(14 - pOH)).toExponential(3)} mol/L`],
      );
    },
  }),

  make({
    id: 'ka_from_ph',
    name_fa: 'ثابت تفکیک اسید از pH',
    name_en: 'Ka from pH',
    category_path: ['شیمی', 'اسید و باز'],
    tags: ['Ka', 'pH', 'اسید ضعیف'],
    description_fa: 'محاسبه Ka، pKa و درصد تفکیک اسید ضعیف از pH و غلظت اولیه.',
    formula_latex: 'K_a=\\frac{[H^+]^2}{C-[H^+]},\\quad \\alpha=\\frac{[H^+]}{C}',
    difficulty: 'intermediate',
    variables: [N('pH', 'pH محلول', 'Solution pH', null, 3), N('concentration', 'غلظت اولیه اسید (mol/L)', 'Initial concentration', 'concentration', 0.1)],
    outputs: [O('ka', 'ثابت Ka', null), O('pka', 'pKa', null), O('dissociation_percent', 'درصد تفکیک', '%')],
    tests: [
      { input: { pH: 3, concentration: 0.1 }, expected: { ka: 1.0101e-5, pka: 4.9957, dissociation_percent: 1 } },
      { input: { pH: 5, concentration: 0.01 }, expected: { dissociation_percent: 0.1 } },
    ],
    compute({ pH, concentration }) {
      if (concentration <= 0) throw new Error('غلظت باید مثبت باشد');
      const h = 10 ** -pH;
      if (h >= concentration) throw new Error('pH با غلظت ناسازگار است ([H⁺] ≥ C)');
      const ka = (h * h) / (concentration - h);
      return out(
        { ka, pka: round(-Math.log10(ka), 6), dissociation_percent: round((h / concentration) * 100, 6), h_concentration: h },
        [`[H⁺] = 10^(−${pH}) = ${h.toExponential(3)} mol/L`, `Ka = [H⁺]²/(C−[H⁺]) = ${ka.toExponential(4)}`, `pKa = ${round(-Math.log10(ka), 4)} ، درصد تفکیک = ${round((h / concentration) * 100, 3)}٪`],
      );
    },
  }),

  make({
    id: 'ksp_solubility',
    name_fa: 'حاصل‌ضرب انحلال‌پذیری',
    name_en: 'Ksp from Solubility',
    category_path: ['شیمی', 'اسید و باز'],
    tags: ['Ksp', 'انحلال', 'solubility'],
    description_fa: 'محاسبه Ksp از انحلال‌پذیری مولی برای نمک‌های AB، AB₂ و A₂B₃.',
    formula_latex: 'AB: K_{sp}=s^2,\\quad AB_2: K_{sp}=4s^3,\\quad A_2B_3: K_{sp}=108s^5',
    difficulty: 'intermediate',
    variables: [N('solubility', 'انحلال‌پذیری مولی s (mol/L)', 'Molar solubility', 'concentration', 1.3e-5), T('type', 'نوع نمک (AB/AB2/A2B3)', 'Salt type', 'AB')],
    outputs: [O('ksp', 'Ksp', null), O('cation', 'غلظت کاتیون', 'mol/L'), O('anion', 'غلظت آنیون', 'mol/L')],
    tests: [
      { input: { solubility: 1.3e-5, type: 'AB' }, expected: { ksp: 1.69e-10, cation: 1.3e-5 } },
      { input: { solubility: 1e-3, type: 'AB2' }, expected: { ksp: 4e-9 } },
    ],
    compute({ solubility, type }) {
      if (solubility <= 0) throw new Error('انحلال‌پذیری باید مثبت باشد');
      const key = String(type).replace(/\s/g, '').toUpperCase();
      const table = { AB: [1, 1], AB2: [1, 2], A2B: [2, 1], A2B3: [2, 3], AB3: [1, 3] };
      if (!(key in table)) throw new Error('نوع نمک باید AB، AB2، A2B یا A2B3 باشد');
      const [a, b] = table[key];
      const ksp = a ** a * b ** b * solubility ** (a + b);
      return out(
        { ksp, cation: round(a * solubility, 12), anion: round(b * solubility, 12), expression: `Ksp = ${a ** a * b ** b}·s^${a + b}` },
        [`${key} ⟹ Ksp = ${a ** a * b ** b}·s^${a + b}`, `s = ${solubility} mol/L`, `Ksp = ${ksp.toExponential(4)}`],
      );
    },
  }),

  make({
    id: 'titration_analysis',
    name_fa: 'محاسبات تیتراسیون',
    name_en: 'Titration Analysis',
    category_path: ['شیمی', 'اسید و باز'],
    tags: ['تیتراسیون', 'اسید', 'باز'],
    description_fa: 'حجم لازم تیتران با نسبت استوکیومتری و محاسبه غلظت مجهول.',
    formula_latex: '\\frac{M_1V_1}{n_1}=\\frac{M_2V_2}{n_2}',
    variables: [N('M1', 'غلظت تیتران (mol/L)', 'Titrant concentration', 'concentration', 0.1), N('V1', 'حجم تیتران (mL)', 'Titrant volume', 'volume', 25), N('n1', 'ضریب استوکیومتری تیتران', 'Titrant coefficient', null, 1), N('M2', 'غلظت مجهول (mol/L)', 'Analyte concentration', 'concentration', 0.2), N('n2', 'ضریب استوکیومتری مجهول', 'Analyte coefficient', null, 2)],
    outputs: [O('V2', 'حجم مجهول', 'mL'), O('equivalents', 'معادل‌های اسید-باز', 'mol'), O('check', 'کنترل', null)],
    tests: [
      { input: { M1: 0.1, V1: 25, n1: 1, M2: 0.2, n2: 2 }, expected: { V2: 25, equivalents: 0.0025 } },
      { input: { M1: 0.05, V1: 20, n1: 2, M2: 0.1, n2: 1 }, expected: { V2: 5 } },
    ],
    compute({ M1, V1, n1, M2, n2 }) {
      if (M1 <= 0 || M2 <= 0 || V1 <= 0) throw new Error('غلظت‌ها و حجم باید مثبت باشند');
      if (n1 <= 0 || n2 <= 0) throw new Error('ضرایب باید مثبت باشند');
      const equivalents = (M1 * (V1 / 1000)) / n1;
      const V2 = ((equivalents * n2) / M2) * 1000;
      return out(
        { V2: round(V2, 6), equivalents: round(equivalents, 8), moles_titrant: round((M1 * V1) / 1000, 8), check: `M₁V₁/n₁ = ${round(equivalents, 6)}` },
        [`M₁V₁/n₁ = (${M1}×${V1}/1000)/${n1} = ${round(equivalents, 6)}`, `V₂ = n₂·معادل/M₂ = ${round(V2, 4)} mL`, `نقطه هم‌ارزی در ${round(V2, 2)} میلی‌لیتر تیتران`],
      );
    },
  }),

  // ── شیمی: تعادل و سینتیک ─────────────────────────────────────────────────
  make({
    id: 'reaction_quotient',
    name_fa: 'ضریب واکنش Q',
    name_en: 'Reaction Quotient',
    category_path: ['شیمی', 'تعادل'],
    tags: ['تعادل', 'Q', 'le chatelier'],
    description_fa: 'مقایسه Q با K و تعیین جهت جابه‌جایی تعادل.',
    formula_latex: 'Q=\\frac{[P]^p}{[R]^r}',
    variables: [N('product_conc', 'غلظت فرآورده (mol/L)', 'Product concentration', 'concentration', 0.2), N('product_coef', 'ضریب فرآورده', 'Product coefficient', null, 2), N('reactant_conc', 'غلظت واکنش‌دهنده (mol/L)', 'Reactant concentration', 'concentration', 0.1), N('reactant_coef', 'ضریب واکنش‌دهنده', 'Reactant coefficient', null, 1), N('K', 'ثابت تعادل K', 'Equilibrium constant', null, 1)],
    outputs: [O('Q', 'ضریب واکنش', null), O('direction', 'جهت جابه‌جایی', null), O('ratio', 'Q/K', null)],
    tests: [
      { input: { product_conc: 0.2, product_coef: 2, reactant_conc: 0.1, reactant_coef: 1, K: 0.4 }, expected: { Q: 0.4, direction: 'در تعادل است' } },
      { input: { product_conc: 0.2, product_coef: 2, reactant_conc: 0.1, reactant_coef: 1, K: 1 }, expected: { direction: 'به سمت فرآورده‌ها' } },
    ],
    compute({ product_conc, product_coef, reactant_conc, reactant_coef, K }) {
      if (product_conc < 0 || reactant_conc <= 0) throw new Error('غلظت‌ها باید مثبت باشند');
      if (K <= 0) throw new Error('K باید مثبت باشد');
      const Q = product_conc ** product_coef / reactant_conc ** reactant_coef;
      const ratio = Q / K;
      const direction = Math.abs(ratio - 1) < 1e-9 ? 'در تعادل است' : ratio < 1 ? 'به سمت فرآورده‌ها' : 'به سمت واکنش‌دهنده‌ها';
      return out(
        { Q: round(Q, 8), direction, ratio: round(ratio, 8) },
        [`Q = [P]^p/[R]^r = ${round(Q, 6)}`, `Q/K = ${round(ratio, 6)}`, `⟹ واکنش ${direction}`],
      );
    },
  }),

  make({
    id: 'kp_from_kc',
    name_fa: 'تبدیل Kc و Kp',
    name_en: 'Kp from Kc',
    category_path: ['شیمی', 'تعادل'],
    tags: ['تعادل', 'Kp', 'Kc'],
    description_fa: 'محاسبه Kp از Kc با تغییر تعداد مول گازی و دما.',
    formula_latex: 'K_p=K_c(RT)^{\\Delta n}',
    variables: [N('Kc', 'ثابت Kc', 'Kc', null, 0.5), N('T', 'دما (K)', 'Temperature', 'temperature', 500), N('delta_n', 'تغییر مول گازی Δn', 'Change in gas moles', null, 1)],
    outputs: [O('Kp', 'ثابت Kp', null), O('rt', 'ضریب RT', null), O('shift', 'اثر فشار', null)],
    tests: [
      { input: { Kc: 0.5, T: 500, delta_n: 1 }, expected: { Kp: 20.5143 } },
      { input: { Kc: 2, T: 300, delta_n: 0 }, expected: { Kp: 2 } },
    ],
    compute({ Kc, T, delta_n }) {
      if (Kc <= 0) throw new Error('Kc باید مثبت باشد');
      if (T <= 0) throw new Error('دما باید مثبت باشد');
      const rt = R_atm * T;
      return out(
        { Kp: round(Kc * rt ** delta_n, 8), rt: round(rt, 6), shift: delta_n > 0 ? 'افزایش فشار ⟹ جابه‌جایی به سمت مول کمتر' : delta_n < 0 ? 'افزایش فشار ⟹ جابه‌جایی به سمت مول بیشتر' : 'فشار بی‌اثر است' },
        [`RT = 0.082057 × ${T} = ${round(rt, 4)}`, `Kp = Kc(RT)^Δn = ${round(Kc * rt ** delta_n, 6)}`, delta_n === 0 ? 'Δn = 0 ⟹ Kp = Kc' : `Δn = ${delta_n}`],
      );
    },
  }),

  make({
    id: 'first_order_kinetics',
    name_fa: 'سینتیک مرتبه اول',
    name_en: 'First-Order Kinetics',
    category_path: ['شیمی', 'سینتیک'],
    tags: ['سینتیک', 'نیمه‌عمر', 'kinetics'],
    description_fa: 'نیمه‌عمر، غلظت باقی‌مانده و زمان رسیدن به غلظت هدف در واکنش مرتبه اول.',
    formula_latex: '[A]=[A]_0e^{-kt},\\quad t_{1/2}=\\frac{\\ln2}{k}',
    variables: [N('A0', 'غلظت اولیه (mol/L)', 'Initial concentration', 'concentration', 1), N('k', 'ثابت سرعت k (1/s)', 'Rate constant', null, 0.1), N('t', 'زمان t (s)', 'Time', 'time', 10)],
    outputs: [O('concentration', 'غلظت در زمان t', 'mol/L'), O('half_life', 'نیمه‌عمر', 's'), O('remaining_percent', 'درصد باقی‌مانده', '%')],
    tests: [
      { input: { A0: 1, k: 0.1, t: 10 }, expected: { concentration: 0.367879, half_life: 6.931472, remaining_percent: 36.7879 } },
      { input: { A0: 2, k: 0.05, t: 0 }, expected: { concentration: 2 } },
    ],
    compute({ A0, k, t }) {
      if (A0 <= 0) throw new Error('غلظت اولیه باید مثبت باشد');
      if (k <= 0) throw new Error('ثابت سرعت باید مثبت باشد');
      if (t < 0) throw new Error('زمان باید نامنفی باشد');
      const concentration = A0 * Math.exp(-k * t);
      return out(
        { concentration: round(concentration, 8), half_life: round(Math.LN2 / k, 6), remaining_percent: round((concentration / A0) * 100, 6), rate: round(k * concentration, 8) },
        [`[A] = ${A0}·e^(−${k}×${t}) = ${round(concentration, 6)} mol/L`, `t½ = ln2/k = ${round(Math.LN2 / k, 4)} s`, `باقی‌مانده = ${round((concentration / A0) * 100, 3)}٪`],
      );
    },
  }),

  make({
    id: 'activation_energy_two_temp',
    name_fa: 'انرژی فعال‌سازی (دو دما)',
    name_en: 'Activation Energy (Two Temperatures)',
    category_path: ['شیمی', 'سینتیک'],
    tags: ['آرنیوس', 'فعال‌سازی', 'arrhenius'],
    description_fa: 'محاسبه انرژی فعال‌سازی از دو ثابت سرعت در دو دما و ضریب آرنیوس.',
    formula_latex: '\\ln\\frac{k_2}{k_1}=\\frac{E_a}{R}\\left(\\frac1{T_1}-\\frac1{T_2}\\right)',
    difficulty: 'intermediate',
    variables: [N('k1', 'ثابت سرعت k₁', 'Rate constant 1', null, 0.001), N('T1', 'دمای T₁ (K)', 'Temperature 1', 'temperature', 300), N('k2', 'ثابت سرعت k₂', 'Rate constant 2', null, 0.01), N('T2', 'دمای T₂ (K)', 'Temperature 2', 'temperature', 320)],
    outputs: [O('ea', 'انرژی فعال‌سازی', 'J/mol'), O('ea_kj', 'انرژی فعال‌سازی', 'kJ/mol'), O('ratio', 'k₂/k₁', null)],
    tests: [
      { input: { k1: 0.001, T1: 300, k2: 0.01, T2: 320 }, expected: { ea: 91896.5, ratio: 10 } },
      { input: { k1: 0.001, T1: 300, k2: 0.001, T2: 400 }, expected: { ea: 0 } },
    ],
    compute({ k1, T1, k2, T2 }) {
      if (k1 <= 0 || k2 <= 0) throw new Error('ثابت‌های سرعت باید مثبت باشند');
      if (T1 <= 0 || T2 <= 0 || T1 === T2) throw new Error('دماها باید مثبت و متفاوت باشند');
      const ea = (R * Math.log(k2 / k1)) / (1 / T1 - 1 / T2);
      return out(
        { ea: round(ea, 4), ea_kj: round(ea / 1000, 6), ratio: round(k2 / k1, 8), temperature_coefficient: round((k2 / k1) ** (10 / (T2 - T1)), 6) },
        [`ln(k₂/k₁) = ln(${round(k2 / k1, 4)}) = ${round(Math.log(k2 / k1), 4)}`, `Ea = R·ln(k₂/k₁)/(1/T₁−1/T₂)`, `= ${round(ea / 1000, 3)} kJ/mol`],
      );
    },
  }),

  // ── شیمی: الکتروشیمی ─────────────────────────────────────────────────────
  make({
    id: 'cell_emf',
    name_fa: 'نیروی محرکه سلول گالوانی',
    name_en: 'Galvanic Cell EMF',
    category_path: ['شیمی', 'الکتروشیمی'],
    tags: ['الکتروشیمی', 'سلول', 'emf'],
    description_fa: 'EMF استاندارد سلول از پتانسیل دو نیم‌سلول و انرژی آزاد گیبس واکنش.',
    formula_latex: 'E^\\circ_{cell}=E^\\circ_{cathode}-E^\\circ_{anode},\\quad \\Delta G^\\circ=-nFE^\\circ',
    variables: [N('cathode', 'پتانسیل کاتد (V)', 'Cathode potential', 'voltage', 1.1), N('anode', 'پتانسیل آند (V)', 'Anode potential', 'voltage', -0.76), N('electrons', 'تعداد الکترون n', 'Electrons n', null, 2, { min: 1 })],
    outputs: [O('emf', 'EMF سلول', 'V'), O('delta_g', 'انرژی آزاد گیبس', 'kJ/mol'), O('spontaneous', 'خودبه‌خودی؟', null)],
    tests: [
      { input: { cathode: 1.1, anode: -0.76, electrons: 2 }, expected: { emf: 1.86, delta_g: -358.93, spontaneous: true } },
      { input: { cathode: -0.76, anode: 1.1, electrons: 2 }, expected: { emf: -1.86, spontaneous: false } },
    ],
    compute({ cathode, anode, electrons }) {
      if (!Number.isInteger(electrons) || electrons < 1) throw new Error('n باید عدد صحیح مثبت باشد');
      const emf = cathode - anode;
      const deltaG = -electrons * F * emf;
      return out(
        { emf: round(emf, 6), delta_g: round(deltaG / 1000, 4), spontaneous: emf > 0, equilibrium_constant_log: round((electrons * emf) / 0.05916, 4) },
        [`E°cell = E°کاتد − E°آند = ${round(emf, 4)} V`, `ΔG° = −nFE° = ${round(deltaG / 1000, 2)} kJ/mol`, emf > 0 ? 'واکنش خودبه‌خودی است' : 'واکنش غیرخودبه‌خودی است'],
      );
    },
  }),

  make({
    id: 'electrolysis_time',
    name_fa: 'زمان الکترولیز',
    name_en: 'Electrolysis Time',
    category_path: ['شیمی', 'الکتروشیمی'],
    tags: ['الکترولیز', 'فارادی', 'electrolysis'],
    description_fa: 'بار و زمان لازم برای رسوب مقدار مشخصی فلز با جریان الکتریکی.',
    formula_latex: 'Q=nzF,\\quad t=\\frac{Q}{I}',
    variables: [N('moles', 'مول فلز مورد نظر (mol)', 'Moles to deposit', null, 0.1), N('electrons', 'تعداد الکترون z', 'Electrons z', null, 2, { min: 1 }), N('current', 'جریان I (A)', 'Current', 'current', 2), N('molar_mass', 'جرم مولی فلز (g/mol)', 'Metal molar mass', null, 63.55)],
    outputs: [O('charge', 'بار عبوری', 'C'), O('time_s', 'زمان لازم', 's'), O('mass', 'جرم رسوب', 'g')],
    tests: [
      { input: { moles: 0.1, electrons: 2, current: 2, molar_mass: 63.55 }, expected: { charge: 19297.066, time_s: 9648.533, mass: 6.355 } },
      { input: { moles: 0.5, electrons: 1, current: 5, molar_mass: 107.87 }, expected: { mass: 53.935 } },
    ],
    compute({ moles, electrons, current, molar_mass }) {
      if (current <= 0) throw new Error('جریان باید مثبت باشد');
      if (!Number.isInteger(electrons) || electrons < 1) throw new Error('z باید عدد صحیح مثبت باشد');
      if (moles < 0) throw new Error('مول باید نامنفی باشد');
      const charge = moles * electrons * F;
      return out(
        { charge: round(charge, 4), time_s: round(charge / current, 4), time_min: round(charge / current / 60, 4), mass: round(moles * molar_mass, 6) },
        [`Q = n·z·F = ${round(charge, 2)} C`, `t = Q/I = ${round(charge / current, 2)} s (≈ ${round(charge / current / 60, 2)} دقیقه)`, `جرم رسوب = nM = ${round(moles * molar_mass, 3)} g`],
      );
    },
  }),

  // ── مهندسی: استاتیک و مقاومت مصالح ───────────────────────────────────────
  make({
    id: 'section_modulus',
    name_fa: 'ممان اینرسی مقطع و مدول مقطع',
    name_en: 'Section Properties',
    category_path: ['مهندسی', 'استاتیک'],
    tags: ['مقطع', 'اینرسی', 'beam'],
    description_fa: 'ممان اینرسی، مدول مقطع، شعاع ژیراسیون و تنش خمشی مجاز مقطع مستطیلی.',
    formula_latex: 'I=\\frac{bh^3}{12},\\quad S=\\frac{bh^2}{6},\\quad \\sigma=\\frac{M}{S}',
    variables: [N('b', 'عرض b (mm)', 'Width', 'length', 100), N('h', 'ارتفاع h (mm)', 'Height', 'length', 200), N('moment', 'گشتاور خمشی M (N·m)', 'Bending moment', null, 5000)],
    outputs: [O('inertia', 'ممان اینرسی I', 'mm⁴'), O('section_modulus', 'مدول مقطع S', 'mm³'), O('bending_stress', 'تنش خمشی', 'MPa')],
    tests: [
      { input: { b: 100, h: 200, moment: 5000 }, expected: { inertia: 66666666.6667, section_modulus: 666666.6667, bending_stress: 7.5 } },
      { input: { b: 50, h: 100, moment: 1000 }, expected: { section_modulus: 83333.3333 } },
    ],
    compute({ b, h, moment }) {
      if (b <= 0 || h <= 0) throw new Error('ابعاد مقطع باید مثبت باشند');
      const inertia = (b * h ** 3) / 12;
      const sectionModulus = (b * h * h) / 6;
      // M in N·m, S in mm³ → σ[MPa] = M[N·mm]/S[mm³]
      const stress = (moment * 1000) / sectionModulus;
      return out(
        { inertia: round(inertia, 4), section_modulus: round(sectionModulus, 4), bending_stress: round(stress, 6), radius_gyration: round(h / Math.sqrt(12), 6) },
        [`I = bh³/12 = ${round(inertia, 0)} mm⁴`, `S = bh²/6 = ${round(sectionModulus, 0)} mm³`, `σ = M/S = ${round(stress, 3)} MPa`],
      );
    },
  }),

  make({
    id: 'beam_deflection_cantilever',
    name_fa: 'خمش تیر یک‌سر درگیر',
    name_en: 'Cantilever Deflection',
    category_path: ['مهندسی', 'استاتیک'],
    tags: ['تیر', 'خمش', 'deflection'],
    description_fa: 'خمش و شیب انتهای تیر یک‌سر درگیر با بار متمرکز و تنش خمشی حداکثر.',
    formula_latex: '\\delta=\\frac{FL^3}{3EI},\\quad \\theta=\\frac{FL^2}{2EI}',
    difficulty: 'intermediate',
    variables: [N('force', 'بار F (N)', 'Point load', 'force', 1000), N('length', 'طول تیر L (m)', 'Length', 'length', 2), N('E', 'مدول یانگ E (GPa)', 'Young modulus', null, 200), N('inertia_mm4', 'ممان اینرسی I (mm⁴)', 'Second moment', null, 66666666.6667), N('height_mm', 'ارتفاع مقطع h (mm)', 'Section height', 'length', 200)],
    outputs: [O('deflection', 'خمش انتها', 'mm'), O('slope', 'شیب انتها', 'rad'), O('max_stress', 'تنش حداکثر', 'MPa')],
    tests: [
      { input: { force: 1000, length: 2, E: 200, inertia_mm4: 66666666.6667, height_mm: 200 }, expected: { deflection: 0.2, slope: 0.00015, max_stress: 3 } },
      { input: { force: 500, length: 1, E: 200, inertia_mm4: 1000000, height_mm: 50 }, expected: { deflection: 0.833333 } },
    ],
    compute({ force, length, E, inertia_mm4, height_mm }) {
      if (length <= 0 || E <= 0 || inertia_mm4 <= 0 || height_mm <= 0) throw new Error('طول، مدول یانگ، ممان اینرسی و ارتفاع باید مثبت باشند');
      const EPa = E * 1e9;
      const I = inertia_mm4 * 1e-12;
      const deflection = (force * length ** 3) / (3 * EPa * I);
      const slope = (force * length ** 2) / (2 * EPa * I);
      const maxMoment = force * length; // N·m
      const stress = (maxMoment * 1000 * (height_mm / 2)) / inertia_mm4; // N·mm × mm / mm⁴ = MPa
      return out(
        {
          deflection: round(deflection * 1000, 6),
          slope: round(slope, 10),
          max_stress: round(stress, 6),
          max_moment: round(maxMoment, 6),
        },
        [`δ = FL³/(3EI) = ${round(deflection * 1000, 4)} mm`, `θ = FL²/(2EI) = ${round(slope, 8)} rad`, `σ_max = M·c/I = ${round(stress, 3)} MPa`],
      );
    },
  }),

  // ── مهندسی: سیالات ───────────────────────────────────────────────────────
  make({
    id: 'darcy_weisbach',
    name_fa: 'افت فشار دارسی-وایسباخ',
    name_en: 'Darcy–Weisbach Head Loss',
    category_path: ['مهندسی', 'مکانیک سیالات'],
    tags: ['لوله', 'افت فشار', 'fluid'],
    description_fa: 'افت بار اصطکاکی و افت فشار در لوله با ضریب اصطکاک داده‌شده.',
    formula_latex: 'h_f=f\\frac{L}{D}\\frac{v^2}{2g}',
    variables: [N('f', 'ضریب اصطکاک f', 'Friction factor', null, 0.02), N('length', 'طول لوله L (m)', 'Pipe length', 'length', 100), N('diameter', 'قطر لوله D (m)', 'Diameter', 'length', 0.1), N('velocity', 'سرعت جریان v (m/s)', 'Velocity', 'speed', 2), N('density', 'چگالی شاره (kg/m³)', 'Density', 'density', 1000)],
    outputs: [O('head_loss', 'افت بار', 'm'), O('pressure_drop', 'افت فشار', 'kPa'), O('flow_rate', 'دبی', 'L/s')],
    tests: [
      { input: { f: 0.02, length: 100, diameter: 0.1, velocity: 2, density: 1000 }, expected: { head_loss: 4.0789, pressure_drop: 40 } },
      { input: { f: 0.03, length: 50, diameter: 0.2, velocity: 1, density: 1000 }, expected: { head_loss: 0.382432 } },
    ],
    compute({ f, length, diameter, velocity, density }) {
      if (diameter <= 0 || length <= 0) throw new Error('طول و قطر باید مثبت باشند');
      const headLoss = f * (length / diameter) * ((velocity * velocity) / (2 * g));
      const pressureDrop = headLoss * density * g;
      return out(
        { head_loss: round(headLoss, 6), pressure_drop: round(pressureDrop / 1000, 6), flow_rate: round((Math.PI * diameter ** 2 * velocity) / 4 * 1000, 6) },
        [`h_f = f(L/D)(v²/2g) = ${round(headLoss, 4)} m`, `ΔP = ρgh_f = ${round(pressureDrop / 1000, 4)} kPa`, `دبی = A·v = ${round((Math.PI * diameter ** 2 * velocity) / 4 * 1000, 3)} L/s`],
      );
    },
  }),

  make({
    id: 'manning_flow',
    name_fa: 'معادله مانینگ',
    name_en: "Manning's Equation",
    category_path: ['مهندسی', 'مکانیک سیالات'],
    tags: ['کانال', 'دبی', 'manning'],
    description_fa: 'دبی کانال باز با سطح مقطع مستطیلی، شیب و ضریب زبری مانینگ.',
    formula_latex: 'Q=\\frac1nAR^{2/3}S^{1/2}',
    variables: [N('width', 'عرض کانال (m)', 'Channel width', 'length', 2), N('depth', 'عمق آب (m)', 'Flow depth', 'length', 1), N('n', 'ضریب زبری n', 'Manning roughness', null, 0.013), N('slope', 'شیب بستر S (m/m)', 'Bed slope', null, 0.001)],
    outputs: [O('flow_rate', 'دبی', 'm³/s'), O('hydraulic_radius', 'شعاع هیدرولیکی', 'm'), O('velocity', 'سرعت متوسط', 'm/s')],
    tests: [
      { input: { width: 2, depth: 1, n: 0.013, slope: 0.001 }, expected: { flow_rate: 3.0649, hydraulic_radius: 0.5 } },
      { input: { width: 1, depth: 0.5, n: 0.015, slope: 0.002 }, expected: { hydraulic_radius: 0.25 } },
    ],
    compute({ width, depth, n, slope }) {
      if (width <= 0 || depth <= 0 || n <= 0 || slope <= 0) throw new Error('ابعاد، زبری و شیب باید مثبت باشند');
      const area = width * depth;
      const perimeter = width + 2 * depth;
      const radius = area / perimeter;
      const velocity = (1 / n) * radius ** (2 / 3) * Math.sqrt(slope);
      return out(
        { flow_rate: round(area * velocity, 6), hydraulic_radius: round(radius, 6), velocity: round(velocity, 6), area: round(area, 6) },
        [`A = ${round(area, 4)} m² ، P = ${round(perimeter, 4)} m ⟹ R = ${round(radius, 4)} m`, `v = (1/n)R^(2/3)√S = ${round(velocity, 4)} m/s`, `Q = Av = ${round(area * velocity, 4)} m³/s`],
      );
    },
  }),

  make({
    id: 'pump_power',
    name_fa: 'توان پمپ',
    name_en: 'Pump Power',
    category_path: ['مهندسی', 'مکانیک سیالات'],
    tags: ['پمپ', 'توان', 'pump'],
    description_fa: 'توان هیدرولیکی و توان محور پمپ با دبی، هد و بازده.',
    formula_latex: 'P_{hyd}=\\rho gQH,\\quad P_{shaft}=\\frac{P_{hyd}}{\\eta}',
    variables: [N('flow', 'دبی Q (m³/s)', 'Flow rate', null, 0.05), N('head', 'هد H (m)', 'Head', 'length', 20), N('efficiency', 'بازده η (٪)', 'Efficiency', '%', 70), N('density', 'چگالی (kg/m³)', 'Density', 'density', 1000)],
    outputs: [O('hydraulic_power', 'توان هیدرولیکی', 'kW'), O('shaft_power', 'توان محور', 'kW'), O('motor_power', 'توان موتور (ضریب ۱.۱۵)', 'kW')],
    tests: [
      { input: { flow: 0.05, head: 20, efficiency: 70, density: 1000 }, expected: { hydraulic_power: 9.80665, shaft_power: 14.0095 } },
      { input: { flow: 0.01, head: 10, efficiency: 50, density: 1000 }, expected: { hydraulic_power: 0.980665 } },
    ],
    compute({ flow, head, efficiency, density }) {
      if (flow < 0 || head < 0) throw new Error('دبی و هد باید نامنفی باشند');
      if (efficiency <= 0 || efficiency > 100) throw new Error('بازده باید بین ۰ و ۱۰۰ درصد باشد');
      const hydraulic = density * g * flow * head;
      const shaft = hydraulic / (efficiency / 100);
      return out(
        { hydraulic_power: round(hydraulic / 1000, 6), shaft_power: round(shaft / 1000, 6), motor_power: round((shaft * 1.15) / 1000, 6) },
        [`P_hyd = ρgQH = ${round(hydraulic / 1000, 4)} kW`, `P_shaft = P_hyd/η = ${round(shaft / 1000, 4)} kW`, `توان موتور پیشنهادی ≈ ${round((shaft * 1.15) / 1000, 3)} kW`],
      );
    },
  }),

  // ── مهندسی: انتقال حرارت و کنترل ─────────────────────────────────────────
  make({
    id: 'heat_exchanger_lmtd',
    name_fa: 'مبدل حرارتی (LMTD)',
    name_en: 'Heat Exchanger LMTD',
    category_path: ['مهندسی', 'انتقال حرارت'],
    tags: ['مبدل', 'حرارت', 'lmtd'],
    description_fa: 'اختلاف دمای لگاریتمی میانگین و نرخ انتقال حرارت مبدل جریان مخالف.',
    formula_latex: '\\Delta T_{lm}=\\frac{\\Delta T_1-\\Delta T_2}{\\ln(\\Delta T_1/\\Delta T_2)}',
    difficulty: 'intermediate',
    variables: [N('Th_in', 'دمای ورودی گرم (C)', 'Hot inlet', 'temperature', 90), N('Th_out', 'دمای خروجی گرم (C)', 'Hot outlet', 'temperature', 60), N('Tc_in', 'دمای ورودی سرد (C)', 'Cold inlet', 'temperature', 20), N('Tc_out', 'دمای خروجی سرد (C)', 'Cold outlet', 'temperature', 50), N('UA', 'UA (W/K)', 'UA value', null, 2000)],
    outputs: [O('lmtd', 'LMTD', 'K'), O('heat_rate', 'نرخ انتقال حرارت', 'kW'), O('effectiveness', 'بازده حرارتی', '%')],
    tests: [
      { input: { Th_in: 90, Th_out: 60, Tc_in: 20, Tc_out: 50, UA: 2000 }, expected: { lmtd: 40, heat_rate: 80 } },
      { input: { Th_in: 100, Th_out: 60, Tc_in: 20, Tc_out: 40, UA: 1000 }, expected: { lmtd: 49.326 }} ,
    ],
    compute({ Th_in, Th_out, Tc_in, Tc_out, UA }) {
      const d1 = Th_in - Tc_out;
      const d2 = Th_out - Tc_in;
      if (d1 <= 0 || d2 <= 0) throw new Error('دماها باید سازگار باشند (اختلاف‌ها مثبت)');
      const lmtd = Math.abs(d1 - d2) < 1e-9 ? d1 : (d1 - d2) / Math.log(d1 / d2);
      const heat = UA * lmtd;
      const maxHeat = UA * (Th_in - Tc_in);
      return out(
        { lmtd: round(lmtd, 6), heat_rate: round(heat / 1000, 6), effectiveness: round((heat / maxHeat) * 100, 4) },
        [`ΔT₁ = ${round(d1, 2)} K ، ΔT₂ = ${round(d2, 2)} K`, `LMTD = ${round(lmtd, 3)} K`, `Q = UA·LMTD = ${round(heat / 1000, 3)} kW`],
      );
    },
  }),

  make({
    id: 'op_amp_gain',
    name_fa: 'تقویت‌کننده عملیاتی',
    name_en: 'Op-Amp Gain',
    category_path: ['مهندسی', 'مدار و الکترونیک'],
    tags: ['تقویت‌کننده', 'op-amp', 'gain'],
    description_fa: 'بهره ولتاژ مدار معکوس و غیرمعکوس و ولتاژ خروجی.',
    formula_latex: 'A_v=-\\frac{R_f}{R_{in}}\\;\\text{(inverting)},\\quad A_v=1+\\frac{R_f}{R_{in}}',
    variables: [N('Rf', 'مقاومت فیدبک Rf (Ω)', 'Feedback resistor', 'resistance', 10000), N('Rin', 'مقاومت ورودی Rin (Ω)', 'Input resistor', 'resistance', 1000), N('Vin', 'ولتاژ ورودی (V)', 'Input voltage', 'voltage', 0.5), T('mode', 'حالت (inverting/non-inverting)', 'Mode', 'inverting')],
    outputs: [O('gain', 'بهره', null), O('vout', 'ولتاژ خروجی', 'V'), O('bandwidth_hint', 'نوع', null)],
    tests: [
      { input: { Rf: 10000, Rin: 1000, Vin: 0.5, mode: 'inverting' }, expected: { gain: -10, vout: -5 } },
      { input: { Rf: 10000, Rin: 1000, Vin: 0.5, mode: 'non-inverting' }, expected: { gain: 11, vout: 5.5 } },
    ],
    compute({ Rf, Rin, Vin, mode }) {
      if (Rin <= 0 || Rf < 0) throw new Error('مقاومت‌ها باید معتبر باشند');
      const key = String(mode).trim().toLowerCase();
      if (!['inverting', 'non-inverting', 'noninverting'].includes(key)) throw new Error('حالت باید inverting یا non-inverting باشد');
      const gain = key === 'inverting' ? -Rf / Rin : 1 + Rf / Rin;
      return out(
        { gain: round(gain, 6), vout: round(gain * Vin, 6), bandwidth_hint: key === 'inverting' ? 'معکوس‌کننده' : 'غیرمعکوس‌کننده', rf_check: round(Math.abs(gain), 6) },
        [`بهره = ${key === 'inverting' ? '−Rf/Rin' : '1 + Rf/Rin'} = ${round(gain, 4)}`, `Vout = A·Vin = ${round(gain * Vin, 4)} V`],
      );
    },
  }),

  make({
    id: 'nyquist_sampling',
    name_fa: 'قضیه نمونه‌برداری نایکوئیست',
    name_en: 'Nyquist Sampling',
    category_path: ['مهندسی', 'کنترل'],
    tags: ['نمونه‌برداری', 'نایکوئیست', 'signal'],
    description_fa: 'کمینه نرخ نمونه‌برداری، فرکانس نایکوئیست و فرکانس آلیاسینگ.',
    formula_latex: 'f_s\\ge2f_{max},\\quad f_{alias}=|f-kf_s|',
    variables: [N('signal', 'فرکانس سیگنال (Hz)', 'Signal frequency', 'frequency', 1000), N('fs', 'نرخ نمونه‌برداری (Hz)', 'Sampling rate', 'frequency', 2500)],
    outputs: [O('nyquist_rate', 'نرخ نایکوئیست', 'Hz'), O('alias', 'فرکانس آلیاس', 'Hz'), O('adequate', 'نمونه‌برداری کافی؟', null)],
    tests: [
      { input: { signal: 1000, fs: 2500 }, expected: { nyquist_rate: 2000, alias: 1000, adequate: true } },
      { input: { signal: 3000, fs: 2500 }, expected: { alias: 500, adequate: false } },
    ],
    compute({ signal, fs }) {
      if (signal <= 0 || fs <= 0) throw new Error('فرکانس‌ها باید مثبت باشند');
      const ratio = signal / fs;
      const alias = Math.abs(signal - Math.round(ratio) * fs);
      return out(
        { nyquist_rate: round(2 * signal, 6), alias: round(alias, 6), adequate: fs >= 2 * signal, samples_per_cycle: round(fs / signal, 6) },
        [`نرخ نایکوئیست = 2f = ${round(2 * signal, 2)} Hz`, `f_s = ${fs} Hz ⟹ ${fs >= 2 * signal ? 'کافی است' : 'کافی نیست (آلیاسینگ)'}`, `فرکانس مشاهده‌شده = ${round(alias, 2)} Hz`],
      );
    },
  }),

  make({
    id: 'pid_controller',
    name_fa: 'کنترل‌کننده PID',
    name_en: 'PID Controller',
    category_path: ['مهندسی', 'کنترل'],
    tags: ['کنترل', 'PID', 'کنترل صنعتی'],
    description_fa: 'خروجی گسسته کنترل‌کننده PID با محاسبه جمله‌های تناسبی، انتگرالی و مشتقی.',
    formula_latex: 'u=K_pe+K_i\\!\\int\\!e\\,dt+K_d\\frac{de}{dt}',
    difficulty: 'intermediate',
    variables: [N('Kp', 'بهره تناسبی Kp', 'Proportional gain', null, 2), N('Ki', 'بهره انتگرالی Ki', 'Integral gain', null, 0.5), N('Kd', 'بهره مشتقی Kd', 'Derivative gain', null, 0.1), N('error', 'خطای فعلی e(t)', 'Current error', null, 10), N('prev_error', 'خطای قبلی', 'Previous error', null, 4), N('dt', 'گام زمانی dt (s)', 'Time step', 'time', 0.5), N('integral', 'انتگرال تجمعی قبلی', 'Integral term', null, 5)],
    outputs: [O('output', 'خروجی کنترل', null), O('p_term', 'جمله تناسبی', null), O('i_term', 'جمله انتگرالی', null), O('d_term', 'جمله مشتقی', null)],
    tests: [
      { input: { Kp: 2, Ki: 0.5, Kd: 0.1, error: 10, prev_error: 4, dt: 0.5, integral: 5 }, expected: { output: 26.2, p_term: 20, i_term: 5, d_term: 1.2 } },
      { input: { Kp: 1, Ki: 1, Kd: 0, error: 3, prev_error: 3, dt: 1, integral: 0 }, expected: { output: 6, d_term: 0 } },
    ],
    compute({ Kp, Ki, Kd, error, prev_error, dt, integral }) {
      if (dt <= 0) throw new Error('گام زمانی باید مثبت باشد');
      const integralTerm = integral + error * dt;
      const p = Kp * error;
      const i = Ki * integralTerm;
      const d = Kd * ((error - prev_error) / dt);
      return out(
        { output: round(p + i + d, 8), p_term: round(p, 8), i_term: round(i, 8), d_term: round(d, 8), integral: round(integralTerm, 8) },
        [`P = Kp·e = ${round(p, 4)}`, `I = Ki·(∫e + e·dt) = ${round(i, 4)}`, `D = Kd·Δe/dt = ${round(d, 4)} ⟹ u = ${round(p + i + d, 4)}`],
      );
    },
  }),

  make({
    id: 'first_order_step_response',
    name_fa: 'پاسخ پله سیستم مرتبه اول',
    name_en: 'First-Order Step Response',
    category_path: ['مهندسی', 'کنترل'],
    tags: ['کنترل', 'مرتبه اول', 'step response'],
    description_fa: 'پاسخ زمانی سیستم مرتبه اول، زمان نشست و مقدار در لحظه t.',
    formula_latex: 'y(t)=K\\left(1-e^{-t/\\tau}\\right)',
    variables: [N('gain', 'بهره K', 'Gain', null, 1), N('tau', 'ثابت زمانی τ (s)', 'Time constant', 'time', 2), N('t', 'زمان (s)', 'Time', 'time', 6)],
    outputs: [O('value', 'خروجی y(t)', null), O('settling_time', 'زمان نشست ۲٪', 's'), O('percent', 'درصد از نهایی', '%')],
    tests: [
      { input: { gain: 1, tau: 2, t: 6 }, expected: { value: 0.950213, settling_time: 8, percent: 95.0213 } },
      { input: { gain: 10, tau: 1, t: 0 }, expected: { value: 0, percent: 0 } },
    ],
    compute({ gain, tau, t }) {
      if (tau <= 0) throw new Error('ثابت زمانی باید مثبت باشد');
      if (t < 0) throw new Error('زمان باید نامنفی باشد');
      const fraction = 1 - Math.exp(-t / tau);
      return out(
        { value: round(gain * fraction, 8), settling_time: round(4 * tau, 6), percent: round(fraction * 100, 6), rise_time: round(2.1972 * tau, 6) },
        [`y(t) = ${gain}(1 − e^(−${t}/${tau})) = ${round(gain * fraction, 6)}`, `زمان نشست ۲٪ = 4τ = ${round(4 * tau, 4)} s`, `درصد از مقدار نهایی = ${round(fraction * 100, 3)}٪`],
      );
    },
  }),
];
