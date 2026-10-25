/**
 * English names for the Persian category tree.
 *
 * The registry stores `category_path` in Persian (it is the canonical id in the
 * catalog), so the English UI needs one translation table instead of a parallel
 * data set that could drift.
 */
export const CATEGORY_EN: Record<string, string> = {
  ریاضیات: 'Mathematics',
  فیزیک: 'Physics',
  شیمی: 'Chemistry',
  مهندسی: 'Engineering',
  'مالی و اقتصاد': 'Finance & economics',
  'کامپیوتر و اطلاعات': 'CS & information',
  'زیست و سلامت': 'Bio & health',
  'نجوم و فضا': 'Astronomy & space',
  'زمین و محیط': 'Earth & environment',
  'حساب و نظریه اعداد': 'Number theory & arithmetic',
  جبر: 'Algebra',
  'هندسه و مثلثات': 'Geometry & trigonometry',
  'حساب دیفرانسیل': 'Calculus',
  'جبر خطی': 'Linear algebra',
  'آمار و احتمال': 'Statistics & probability',
  'ریاضیات گسسته': 'Discrete mathematics',
  ترکیبیات: 'Combinatorics',
  'مکانیک کلاسیک': 'Classical mechanics',
  الکترومغناطیس: 'Electromagnetism',
  ترمودینامیک: 'Thermodynamics',
  اپتیک: 'Optics',
  'فیزیک مدرن': 'Modern physics',
  استوکیومتری: 'Stoichiometry',
  'اسید و باز': 'Acids & bases',
  تعادل: 'Equilibrium',
  الکتروشیمی: 'Electrochemistry',
  سینتیک: 'Kinetics',
  استاتیک: 'Statics',
  'مدار و الکترونیک': 'Circuits & electronics',
  'مکانیک سیالات': 'Fluid mechanics',
  'انتقال حرارت': 'Heat transfer',
  کنترل: 'Control systems',
  'بهره وام': 'Interest & loans',
  سرمایهگذاری: 'Investment',
  'نظریه اطلاعات': 'Information theory',
  سلامت: 'Health',
  'رشد و اپیدمی': 'Growth & epidemics',
  'حرکت مداری': 'Orbital motion',
  کیهانشناسی: 'Cosmology',
  زلزله: 'Seismology',
  'جو و اقلیم': 'Atmosphere & climate',
  'بهینه‌سازی': 'Optimisation',
  'توابع خاص': 'Special functions',
  'نظریه بازی': 'Game theory',
  'سری زمانی': 'Time series',
  'محاسبات عددی': 'Numerical methods',
  'نظریه صف': 'Queueing theory',
  'پردازش سیگنال': 'Signal processing',
  'قابلیت اطمینان': 'Reliability engineering',
  رباتیک: 'Robotics & orbits',
  'یادگیری ماشین': 'Machine learning',
  'گرافیک سه‌بعدی': '3D graphics',
  'پردازش تصویر و صدا': 'Image & audio processing',
  'موسیقی و رنگ': 'Music & colour',
  'منطق فازی': 'Fuzzy logic',
  ناوبری: 'Navigation',
};

/** Translate one Persian segment, falling back to the original string. */
export const categorySegment = (segment: string, lang: string): string =>
  lang === 'fa' ? segment : (CATEGORY_EN[segment] ?? segment);

/** Translate a whole category path for display. */
export const categoryPathLabel = (path: string[], lang: string): string =>
  path.map((segment) => categorySegment(segment, lang)).join(' · ');
