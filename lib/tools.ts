/**
 * Tool registry for the /tools hub. Kept in one place so the home rail, the
 * tools page and the top bar all agree on ordering and copy.
 */
export interface ToolDef {
  id: string;
  href: string;
  icon: string;
  fa: string;
  en: string;
  descriptionFa: string;
  descriptionEn: string;
  accent: string;
  tint: string;
}

export const TOOLS: ToolDef[] = [
  {
    id: 'graph',
    href: '/tools/graph/',
    icon: 'LineChart',
    fa: 'ماشین‌حساب نموداری',
    en: 'Graphing calculator',
    descriptionFa: 'رسم هم‌زمان سه تابع با مشتق، انتگرال، ریشه‌ها و زوم و جابه‌جایی.',
    descriptionEn: 'Plot up to three functions with derivatives, integrals, roots, zoom and pan.',
    accent: '#F0ABFC',
    tint: 'from-[#F0ABFC]/22 to-[#C026D3]/10',
  },
  {
    id: 'assistant',
    href: '/tools/assistant/',
    icon: 'MessagesSquare',
    fa: 'دستیار حل مسئله',
    en: 'Word-problem assistant',
    descriptionFa: 'صورت مسئله را بچسبانید؛ فرمول مناسب و عددهایش خودکار پیدا می‌شوند.',
    descriptionEn: 'Paste a word problem — the right formula and its numbers are found for you.',
    accent: '#67E8F9',
    tint: 'from-[#67E8F9]/22 to-[#0891B2]/10',
  },
  {
    id: 'matrix',
    href: '/tools/matrix/',
    icon: 'Table2',
    fa: 'آزمایشگاه ماتریس',
    en: 'Matrix lab',
    descriptionFa: 'جمع، ضرب، دترمینان، وارون، مقادیر ویژه و حل دستگاه خطی تا ۶×۶.',
    descriptionEn: 'Add, multiply, determinant, inverse, eigenvalues and linear solves up to 6×6.',
    accent: '#C4B5FD',
    tint: 'from-[#C4B5FD]/22 to-[#7C3AED]/10',
  },
  {
    id: 'statistics',
    href: '/tools/statistics/',
    icon: 'BarChart3',
    fa: 'آزمایشگاه آمار و داده',
    en: 'Statistics & data lab',
    descriptionFa: 'داده بچسبانید: آمار توصیفی، هیستوگرام، داده‌های پرت و رگرسیون خطی.',
    descriptionEn: 'Paste data for descriptive statistics, histograms, outliers and regression.',
    accent: '#FF9CBF',
    tint: 'from-[#FF9CBF]/22 to-[#DB2777]/10',
  },
  {
    id: 'units',
    href: '/tools/units/',
    icon: 'Ruler',
    fa: 'تبدیل یکا',
    en: 'Unit converter',
    descriptionFa: '۱۳ دسته و بیش از ۹۰ یکا، از نانومتر تا سال نوری.',
    descriptionEn: '13 categories, 90+ units, from nanometres to light years.',
    accent: '#8AB4FF',
    tint: 'from-[#8AB4FF]/22 to-[#6366F1]/10',
  },
  {
    id: 'chemistry',
    href: '/tools/chemistry/',
    icon: 'FlaskConical',
    fa: 'جرم مولی و ترکیب',
    en: 'Molar mass',
    descriptionFa: 'فرمول شیمیایی را بنویسید؛ جرم مولی و درصد هر عنصر را ببینید.',
    descriptionEn: 'Type any formula to get molar mass and percent composition.',
    accent: '#7ADFA0',
    tint: 'from-[#7ADFA0]/22 to-[#059669]/10',
  },
  {
    id: 'periodic-table',
    href: '/periodic-table/',
    icon: 'Grid3x3',
    fa: 'جدول تناوبی',
    en: 'Periodic table',
    descriptionFa: 'جدول تعاملی ۱۱۸ عنصر با جستجو، دسته‌بندی و جزئیات.',
    descriptionEn: 'An interactive 118-element table with search and details.',
    accent: '#FFC46B',
    tint: 'from-[#FFC46B]/22 to-[#F59E0B]/10',
  },
  {
    id: 'constants',
    href: '/constants/',
    icon: 'BookMarked',
    fa: 'مرجع ثابت‌ها',
    en: 'Constants',
    descriptionFa: 'ثابت‌های دقیق فیزیک و شیمی با یکای SI و خطای اندازه‌گیری.',
    descriptionEn: 'Exact physics and chemistry constants in SI with uncertainty.',
    accent: '#FF9CBF',
    tint: 'from-[#FF9CBF]/22 to-[#DB2777]/10',
  },
  {
    id: 'practice',
    href: '/practice/',
    icon: 'Dumbbell',
    fa: 'تمرین و آزمون',
    en: 'Practice & quiz',
    descriptionFa: 'سؤال‌های چهارگزینه‌ای با راه‌حل، زنجیره موفقیت و چالش روزانه.',
    descriptionEn: 'Multiple-choice practice with solutions, streaks and a daily challenge.',
    accent: '#7ADFA0',
    tint: 'from-[#7ADFA0]/22 to-[#059669]/10',
  },
  {
    id: 'learn',
    href: '/learn/',
    icon: 'GraduationCap',
    fa: 'مسیرهای یادگیری',
    en: 'Learning paths',
    descriptionFa: 'نردبان‌های قدم‌به‌قدم از جبر و مکانیک تا مرزهای تازه نسخهٔ چهارم.',
    descriptionEn: 'Step-by-step ladders from algebra to the new v4 frontiers.',
    accent: '#FFC46B',
    tint: 'from-[#FFC46B]/22 to-[#F59E0B]/10',
  },
  {
    id: 'workspace',
    href: '/workspace/',
    icon: 'Briefcase',
    fa: 'فضای کاری',
    en: 'Workspace',
    descriptionFa: 'میز مطالعه شخصی: محاسبه‌های سنجاق‌شده، یادداشت و گزارش کامل.',
    descriptionEn: 'Your study desk: pinned calculations, notes and full reports.',
    accent: '#8AB4FF',
    tint: 'from-[#8AB4FF]/22 to-[#6366F1]/10',
  },
];

export const getTool = (id: string) => TOOLS.find((tool) => tool.id === id);
