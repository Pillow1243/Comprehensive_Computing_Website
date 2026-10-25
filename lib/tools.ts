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
];

export const getTool = (id: string) => TOOLS.find((tool) => tool.id === id);
