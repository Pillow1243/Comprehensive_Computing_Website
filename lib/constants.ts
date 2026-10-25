/**
 * Physical constants used by the constants reference page. Values follow the
 * 2019 SI redefinition (CODATA 2018) — the ones marked exact have zero
 * uncertainty by definition.
 */
export interface PhysicalConstant {
  symbol: string;
  nameFa: string;
  nameEn: string;
  value: number;
  unit: string;
  uncertainty?: number;
  group: 'universal' | 'electromagnetic' | 'atomic' | 'astronomical' | 'physicochemical';
  exact?: boolean;
}

export const CONSTANTS: PhysicalConstant[] = [
  { symbol: 'c', nameFa: 'سرعت نور در خلأ', nameEn: 'Speed of light', value: 299792458, unit: 'm/s', group: 'universal', exact: true },
  { symbol: 'h', nameFa: 'ثابت پلانک', nameEn: 'Planck constant', value: 6.62607015e-34, unit: 'J·s', group: 'universal', exact: true },
  { symbol: 'ħ', nameFa: 'ثابت پلانک کاهش‌یافته', nameEn: 'Reduced Planck constant', value: 1.054571817e-34, unit: 'J·s', group: 'universal', uncertainty: 0 },
  { symbol: 'G', nameFa: 'ثابت گرانش', nameEn: 'Gravitational constant', value: 6.6743e-11, unit: 'm³/(kg·s²)', group: 'universal', uncertainty: 1.5e-15 },
  { symbol: 'σ', nameFa: 'ثابت اشتفان–بولتزمان', nameEn: 'Stefan–Boltzmann constant', value: 5.670374419e-8, unit: 'W/(m²·K⁴)', group: 'universal' },
  { symbol: 'k_B', nameFa: 'ثابت بولتزمان', nameEn: 'Boltzmann constant', value: 1.380649e-23, unit: 'J/K', group: 'universal', exact: true },
  { symbol: 'N_A', nameFa: 'عدد آووگادرو', nameEn: 'Avogadro constant', value: 6.02214076e23, unit: '1/mol', group: 'physicochemical', exact: true },
  { symbol: 'R', nameFa: 'ثابت گازها', nameEn: 'Gas constant', value: 8.314462618, unit: 'J/(mol·K)', group: 'physicochemical', exact: true },
  { symbol: 'F', nameFa: 'ثابت فارادی', nameEn: 'Faraday constant', value: 96485.33212, unit: 'C/mol', group: 'electromagnetic' },
  { symbol: 'e', nameFa: 'بار بنیادی', nameEn: 'Elementary charge', value: 1.602176634e-19, unit: 'C', group: 'electromagnetic', exact: true },
  { symbol: 'ε₀', nameFa: 'گذردهی خلأ', nameEn: 'Vacuum permittivity', value: 8.8541878128e-12, unit: 'F/m', group: 'electromagnetic' },
  { symbol: 'μ₀', nameFa: 'تراوایی خلأ', nameEn: 'Vacuum permeability', value: 1.25663706212e-6, unit: 'H/m', group: 'electromagnetic' },
  { symbol: 'k_e', nameFa: 'ثابت کولن', nameEn: 'Coulomb constant', value: 8.9875517923e9, unit: 'N·m²/C²', group: 'electromagnetic' },
  { symbol: 'm_e', nameFa: 'جرم الکترون', nameEn: 'Electron mass', value: 9.1093837015e-31, unit: 'kg', group: 'atomic' },
  { symbol: 'm_p', nameFa: 'جرم پروتون', nameEn: 'Proton mass', value: 1.67262192369e-27, unit: 'kg', group: 'atomic' },
  { symbol: 'm_n', nameFa: 'جرم نوترون', nameEn: 'Neutron mass', value: 1.67492749804e-27, unit: 'kg', group: 'atomic' },
  { symbol: 'u', nameFa: 'واحد جرم اتمی', nameEn: 'Atomic mass unit', value: 1.66053906660e-27, unit: 'kg', group: 'atomic' },
  { symbol: 'a₀', nameFa: 'شعاع بور', nameEn: 'Bohr radius', value: 5.29177210903e-11, unit: 'm', group: 'atomic' },
  { symbol: 'α', nameFa: 'ثابت ساختار ریز', nameEn: 'Fine-structure constant', value: 7.2973525693e-3, unit: '—', group: 'atomic' },
  { symbol: 'R_∞', nameFa: 'ثابت ریدبرگ', nameEn: 'Rydberg constant', value: 10973731.568160, unit: '1/m', group: 'atomic' },
  { symbol: 'μ_B', nameFa: 'مگنتون بور', nameEn: 'Bohr magneton', value: 9.2740100783e-24, unit: 'J/T', group: 'atomic' },
  { symbol: 'g_n', nameFa: 'شتاب گرانش زمین', nameEn: 'Standard gravity', value: 9.80665, unit: 'm/s²', group: 'astronomical', exact: true },
  { symbol: 'AU', nameFa: 'واحد نجومی', nameEn: 'Astronomical unit', value: 1.495978707e11, unit: 'm', group: 'astronomical', exact: true },
  { symbol: 'pc', nameFa: 'پارسک', nameEn: 'Parsec', value: 3.0856775814913673e16, unit: 'm', group: 'astronomical', exact: true },
  { symbol: 'ly', nameFa: 'سال نوری', nameEn: 'Light year', value: 9.4607304725808e15, unit: 'm', group: 'astronomical', exact: true },
  { symbol: 'M_☉', nameFa: 'جرم خورشید', nameEn: 'Solar mass', value: 1.98847e30, unit: 'kg', group: 'astronomical', uncertainty: 1e26 },
  { symbol: 'L_☉', nameFa: 'درخشندگی خورشید', nameEn: 'Solar luminosity', value: 3.828e26, unit: 'W', group: 'astronomical' },
  { symbol: 'H₀', nameFa: 'ثابت هابل', nameEn: 'Hubble constant', value: 70, unit: 'km/s/Mpc', group: 'astronomical', uncertainty: 5 },
  { symbol: 'T₀', nameFa: 'دمای نقطه سه‌گانه آب', nameEn: 'Water triple point', value: 273.16, unit: 'K', group: 'physicochemical', exact: true },
  { symbol: 'V_m', nameFa: 'حجم مولی گاز (STP)', nameEn: 'Molar volume at STP', value: 22.41396954e-3, unit: 'm³/mol', group: 'physicochemical' },
  { symbol: 'σ_sb', nameFa: 'ثابت وین', nameEn: 'Wien displacement constant', value: 2.897771955e-3, unit: 'm·K', group: 'universal' },
  { symbol: 'E_h', nameFa: 'هارتری (انرژی)', nameEn: 'Hartree energy', value: 4.3597447222071e-18, unit: 'J', group: 'atomic' },
];

export const CONSTANT_GROUPS: Record<PhysicalConstant['group'], { fa: string; en: string }> = {
  universal: { fa: 'کیهانی', en: 'Universal' },
  electromagnetic: { fa: 'الکترومغناطیس', en: 'Electromagnetic' },
  atomic: { fa: 'اتمی و کوانتومی', en: 'Atomic & quantum' },
  astronomical: { fa: 'نجومی', en: 'Astronomical' },
  physicochemical: { fa: 'فیزیکوشیمیایی', en: 'Physicochemical' },
};
