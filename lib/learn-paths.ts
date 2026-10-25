/**
 * Curated learning paths (v4).
 *
 * Each path is an ordered ladder of existing formula solvers. Progress is
 * derived from on-device signals only (completed steps, calculation history
 * and recents), so it works offline with no account.
 */

export interface LearnPath {
  id: string;
  icon: string;
  accent: string;
  tint: string;
  titleFa: string;
  titleEn: string;
  descriptionFa: string;
  descriptionEn: string;
  minutes: number;
  formulaIds: string[];
}

export const LEARN_PATHS: LearnPath[] = [
  {
    id: 'algebra-foundations',
    icon: 'Sigma',
    accent: '#8AB4FF',
    tint: 'from-[#8AB4FF]/22 to-[#6366F1]/10',
    titleFa: 'جبر از پایه',
    titleEn: 'Algebra foundations',
    descriptionFa: 'از درصد و نسبت شروع کنید و قدم‌به‌قدم به معادله درجه دو، دستگاه معادلات و دنباله‌ها برسید.',
    descriptionEn: 'From percentages to quadratics, linear systems and sequences.',
    minutes: 45,
    formulaIds: ['percent_change', 'gcd_lcm', 'quadratic', 'linear_system_2', 'arithmetic_seq', 'geometric_seq', 'factorial', 'ncr_npr'],
  },
  {
    id: 'geometry-shapes',
    icon: 'Shapes',
    accent: '#7ADFA0',
    tint: 'from-[#7ADFA0]/22 to-[#059669]/10',
    titleFa: 'هندسه و شکل‌ها',
    titleEn: 'Geometry & shapes',
    descriptionFa: 'فیثاغورس، هرون و دایره؛ بعد فاصله نقاط و در پایان یک چرخش واقعی در فضای سه‌بعدی.',
    descriptionEn: 'Pythagoras, Heron and circles — finishing with a real 3D rotation.',
    minutes: 35,
    formulaIds: ['pythagorean', 'heron', 'circle', 'distance_midpoint', 'euler_rotation_3d', 'quaternion_axis_angle'],
  },
  {
    id: 'mechanics-motion',
    icon: 'Rocket',
    accent: '#FFC46B',
    tint: 'from-[#FFC46B]/22 to-[#F59E0B]/10',
    titleFa: 'مکانیک و حرکت',
    titleEn: 'Mechanics & motion',
    descriptionFa: 'حرکت با شتاب ثابت، نیرو و انرژی، موج و گرما؛ سرانجام مانور مداری هوهمان مثل یک مهندس فضایی.',
    descriptionEn: 'Motion, energy, waves and heat — ending with an orbital Hohmann transfer.',
    minutes: 50,
    formulaIds: ['kinematics', 'newton_energy', 'wave', 'heat', 'rk4_decay_ode', 'hohmann_transfer'],
  },
  {
    id: 'electricity-signals',
    icon: 'AudioWaveform',
    accent: '#C4B5FD',
    tint: 'from-[#C4B5FD]/22 to-[#7C3AED]/10',
    titleFa: 'برق و سیگنال',
    titleEn: 'Electricity & signals',
    descriptionFa: 'قانون اهم و موج، سپس دنیای پردازش سیگنال: نسبت سیگنال به نویز، نایکوئیست و طیف فرکانسی.',
    descriptionEn: "Ohm's law and waves, then signal processing: SNR, Nyquist and the frequency spectrum.",
    minutes: 40,
    formulaIds: ['ohm_circuit', 'wave', 'snr_decibel', 'nyquist_aliasing', 'moving_average_filter', 'dft_dominant_frequency'],
  },
  {
    id: 'chemistry-basics',
    icon: 'FlaskConical',
    accent: '#67E8F9',
    tint: 'from-[#67E8F9]/22 to-[#0891B2]/10',
    titleFa: 'شیمی پایه',
    titleEn: 'Chemistry basics',
    descriptionFa: 'pH، مولاریته و قانون گاز کامل؛ سه ستون اصلی محاسبات شیمی مدرسه و دانشگاه.',
    descriptionEn: 'pH, molarity and the ideal-gas law — the three pillars of school chemistry maths.',
    minutes: 30,
    formulaIds: ['ph', 'molarity', 'ideal_gas'],
  },
  {
    id: 'data-statistics',
    icon: 'BarChart3',
    accent: '#FF9CBF',
    tint: 'from-[#FF9CBF]/22 to-[#DB2777]/10',
    titleFa: 'داده و آمار',
    titleEn: 'Data & statistics',
    descriptionFa: 'از آمار توصیفی و نمره Z تا توزیع نرمال، هموارسازی نمایی و خودهمبستگی سری‌های زمانی.',
    descriptionEn: 'Descriptive stats and z-scores through to smoothing and autocorrelation.',
    minutes: 55,
    formulaIds: ['descriptive_stats', 'z_score', 'normal_dist', 'sma_forecast_trend', 'exponential_smoothing', 'autocorrelation_series'],
  },
  {
    id: 'personal-finance',
    icon: 'Wallet',
    accent: '#FDBA74',
    tint: 'from-[#FDBA74]/22 to-[#EA580C]/10',
    titleFa: 'مالی شخصی',
    titleEn: 'Personal finance',
    descriptionFa: 'بهره ساده و مرکب، قسط وام و در پایان مقدار سفارش اقتصادی؛ ریاضی پول روزمره.',
    descriptionEn: 'Simple and compound interest, loan payments and economic order quantity.',
    minutes: 35,
    formulaIds: ['percent_change', 'simple_interest', 'compound_interest', 'loan_payment', 'economic_order_quantity'],
  },
  {
    id: 'v4-frontiers',
    icon: 'Sparkles',
    accent: '#F0ABFC',
    tint: 'from-[#F0ABFC]/22 to-[#C026D3]/10',
    titleFa: 'مرزهای تازه در نسخه ۴',
    titleEn: 'New frontiers in v4',
    descriptionFa: 'تور سریع دنیای جدید نسخهٔ چهارم: توابع خاص، نظریه بازی، صف، یادگیری ماشین، منطق فازی و رنگ و موسیقی.',
    descriptionEn: 'A fast tour of the new v4 worlds: special functions, game theory, queues, ML, fuzzy logic, colour and music.',
    minutes: 60,
    formulaIds: [
      'gamma_function',
      'bessel_j0_j1',
      'zero_sum_mixed_nash',
      'queue_mm1',
      'erlang_b_blocking',
      'logistic_sigmoid_loss',
      'softmax_cross_entropy',
      'fuzzy_membership',
      'weibull_reliability',
      'rgb_color_convert',
      'music_note_frequency',
    ],
  },
];

export const getLearnPath = (id: string): LearnPath | undefined =>
  LEARN_PATHS.find((path) => path.id === id);

export interface PathProgress {
  doneCount: number;
  total: number;
  percent: number;
  nextFormulaId: string | null;
  completed: boolean;
}

/** Progress from any set of "seen or completed" formula ids. */
export function pathProgress(path: LearnPath, doneIds: ReadonlySet<string>): PathProgress {
  const doneCount = path.formulaIds.filter((id) => doneIds.has(id)).length;
  const total = path.formulaIds.length;
  const nextFormulaId = path.formulaIds.find((id) => !doneIds.has(id)) ?? null;
  return {
    doneCount,
    total,
    percent: total === 0 ? 0 : Math.round((doneCount / total) * 100),
    nextFormulaId,
    completed: doneCount === total && total > 0,
  };
}
