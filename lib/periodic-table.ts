/**
 * Compact periodic table data (118 elements) used by the tools hub.
 * Atomic masses are IUPAC conventional atomic weights; values inside brackets
 * (Tc, Pm and the transuranics) use the mass number of the most stable isotope.
 */

export type ElementGroup =
  | 'nonmetal'
  | 'noble'
  | 'alkali'
  | 'alkaline'
  | 'metalloid'
  | 'halogen'
  | 'post-transition'
  | 'transition'
  | 'lanthanide'
  | 'actinide';

export interface Element {
  z: number;
  symbol: string;
  nameFa: string;
  nameEn: string;
  mass: number;
  group: ElementGroup;
  radioactive?: boolean;
}

type Row = [number, string, string, string, number];

const RAW: Row[] = [
  [1, 'H', 'هیدروژن', 'Hydrogen', 1.008],
  [2, 'He', 'هلیوم', 'Helium', 4.0026],
  [3, 'Li', 'لیتیوم', 'Lithium', 6.94],
  [4, 'Be', 'بریلیوم', 'Beryllium', 9.0122],
  [5, 'B', 'بور', 'Boron', 10.81],
  [6, 'C', 'کربن', 'Carbon', 12.011],
  [7, 'N', 'نیتروژن', 'Nitrogen', 14.007],
  [8, 'O', 'اکسیژن', 'Oxygen', 15.999],
  [9, 'F', 'فلوئور', 'Fluorine', 18.998],
  [10, 'Ne', 'نئون', 'Neon', 20.18],
  [11, 'Na', 'سدیم', 'Sodium', 22.99],
  [12, 'Mg', 'منیزیم', 'Magnesium', 24.305],
  [13, 'Al', 'آلومینیم', 'Aluminium', 26.982],
  [14, 'Si', 'سیلیسیم', 'Silicon', 28.085],
  [15, 'P', 'فسفر', 'Phosphorus', 30.974],
  [16, 'S', 'گوگرد', 'Sulfur', 32.06],
  [17, 'Cl', 'کلر', 'Chlorine', 35.45],
  [18, 'Ar', 'آرگون', 'Argon', 39.948],
  [19, 'K', 'پتاسیم', 'Potassium', 39.098],
  [20, 'Ca', 'کلسیم', 'Calcium', 40.078],
  [21, 'Sc', 'اسکاندیم', 'Scandium', 44.956],
  [22, 'Ti', 'تیتانیم', 'Titanium', 47.867],
  [23, 'V', 'وانادیم', 'Vanadium', 50.942],
  [24, 'Cr', 'کروم', 'Chromium', 51.996],
  [25, 'Mn', 'منگنز', 'Manganese', 54.938],
  [26, 'Fe', 'آهن', 'Iron', 55.845],
  [27, 'Co', 'کبالت', 'Cobalt', 58.933],
  [28, 'Ni', 'نیکل', 'Nickel', 58.693],
  [29, 'Cu', 'مس', 'Copper', 63.546],
  [30, 'Zn', 'روی', 'Zinc', 65.38],
  [31, 'Ga', 'گالیم', 'Gallium', 69.723],
  [32, 'Ge', 'ژرمانیم', 'Germanium', 72.63],
  [33, 'As', 'آرسنیک', 'Arsenic', 74.922],
  [34, 'Se', 'سلنیم', 'Selenium', 78.971],
  [35, 'Br', 'برم', 'Bromine', 79.904],
  [36, 'Kr', 'کریپتون', 'Krypton', 83.798],
  [37, 'Rb', 'روبیدیم', 'Rubidium', 85.468],
  [38, 'Sr', 'استرانسیم', 'Strontium', 87.62],
  [39, 'Y', 'ایتریم', 'Yttrium', 88.906],
  [40, 'Zr', 'زیرکونیم', 'Zirconium', 91.224],
  [41, 'Nb', 'نیوبیم', 'Niobium', 92.906],
  [42, 'Mo', 'مولیبدن', 'Molybdenum', 95.95],
  [43, 'Tc', 'تکنسیوم', 'Technetium', 98],
  [44, 'Ru', 'روتنیم', 'Ruthenium', 101.07],
  [45, 'Rh', 'رودیم', 'Rhodium', 102.91],
  [46, 'Pd', 'پالادیم', 'Palladium', 106.42],
  [47, 'Ag', 'نقره', 'Silver', 107.87],
  [48, 'Cd', 'کادمیم', 'Cadmium', 112.41],
  [49, 'In', 'ایندیم', 'Indium', 114.82],
  [50, 'Sn', 'قلع', 'Tin', 118.71],
  [51, 'Sb', 'آنتیموان', 'Antimony', 121.76],
  [52, 'Te', 'تلوریم', 'Tellurium', 127.6],
  [53, 'I', 'ید', 'Iodine', 126.9],
  [54, 'Xe', 'زنون', 'Xenon', 131.29],
  [55, 'Cs', 'سزیم', 'Caesium', 132.91],
  [56, 'Ba', 'باریم', 'Barium', 137.33],
  [57, 'La', 'لانتان', 'Lanthanum', 138.91],
  [58, 'Ce', 'سریم', 'Cerium', 140.12],
  [59, 'Pr', 'پرازئودیمیم', 'Praseodymium', 140.91],
  [60, 'Nd', 'نئودیمیم', 'Neodymium', 144.24],
  [61, 'Pm', 'پرومتیوم', 'Promethium', 145],
  [62, 'Sm', 'ساماریوم', 'Samarium', 150.36],
  [63, 'Eu', 'اروپیم', 'Europium', 151.96],
  [64, 'Gd', 'گادولینیم', 'Gadolinium', 157.25],
  [65, 'Tb', 'تربیوم', 'Terbium', 158.93],
  [66, 'Dy', 'دیسپروزیم', 'Dysprosium', 162.5],
  [67, 'Ho', 'هولمیم', 'Holmium', 164.93],
  [68, 'Er', 'اربیم', 'Erbium', 167.26],
  [69, 'Tm', 'تولیم', 'Thulium', 168.93],
  [70, 'Yb', 'ایتربیم', 'Ytterbium', 173.05],
  [71, 'Lu', 'لوتسیوم', 'Lutetium', 174.97],
  [72, 'Hf', 'هافنیم', 'Hafnium', 178.49],
  [73, 'Ta', 'تانتال', 'Tantalum', 180.95],
  [74, 'W', 'تنگستن', 'Tungsten', 183.84],
  [75, 'Re', 'رنیوم', 'Rhenium', 186.21],
  [76, 'Os', 'اسمیم', 'Osmium', 190.23],
  [77, 'Ir', 'ایریدیم', 'Iridium', 192.22],
  [78, 'Pt', 'پلاتین', 'Platinum', 195.08],
  [79, 'Au', 'طلا', 'Gold', 196.97],
  [80, 'Hg', 'جیوه', 'Mercury', 200.59],
  [81, 'Tl', 'تالیم', 'Thallium', 204.38],
  [82, 'Pb', 'سرب', 'Lead', 207.2],
  [83, 'Bi', 'بیسموت', 'Bismuth', 208.98],
  [84, 'Po', 'پولونیم', 'Polonium', 209],
  [85, 'At', 'آستاتین', 'Astatine', 210],
  [86, 'Rn', 'رادون', 'Radon', 222],
  [87, 'Fr', 'فرانسیم', 'Francium', 223],
  [88, 'Ra', 'رادیم', 'Radium', 226],
  [89, 'Ac', 'اکتینیم', 'Actinium', 227],
  [90, 'Th', 'توریم', 'Thorium', 232.04],
  [91, 'Pa', 'پروتاکتینیم', 'Protactinium', 231.04],
  [92, 'U', 'اورانیم', 'Uranium', 238.03],
  [93, 'Np', 'نپتونیم', 'Neptunium', 237],
  [94, 'Pu', 'پلوتونیم', 'Plutonium', 244],
  [95, 'Am', 'امریسیم', 'Americium', 243],
  [96, 'Cm', 'کوریم', 'Curium', 247],
  [97, 'Bk', 'برکلیم', 'Berkelium', 247],
  [98, 'Cf', 'کالیفرنیم', 'Californium', 251],
  [99, 'Es', 'اینشتینیم', 'Einsteinium', 252],
  [100, 'Fm', 'فرمیم', 'Fermium', 257],
  [101, 'Md', 'مندلیفیم', 'Mendelevium', 258],
  [102, 'No', 'نوبلیم', 'Nobelium', 259],
  [103, 'Lr', 'لورنسیوم', 'Lawrencium', 266],
  [104, 'Rf', 'رادرفوردیم', 'Rutherfordium', 267],
  [105, 'Db', 'دوبنیم', 'Dubnium', 268],
  [106, 'Sg', 'سیبورگیم', 'Seaborgium', 269],
  [107, 'Bh', 'بوریم', 'Bohrium', 270],
  [108, 'Hs', 'هاسیوم', 'Hassium', 269],
  [109, 'Mt', 'مایتنریم', 'Meitnerium', 278],
  [110, 'Ds', 'دارمشتادیم', 'Darmstadtium', 281],
  [111, 'Rg', 'رونتگنیم', 'Roentgenium', 282],
  [112, 'Cn', 'کوپرنیسیم', 'Copernicium', 285],
  [113, 'Nh', 'نیهونیوم', 'Nihonium', 286],
  [114, 'Fl', 'فلروویوم', 'Flerovium', 289],
  [115, 'Mc', 'مسکوویوم', 'Moscovium', 290],
  [116, 'Lv', 'لیورموریوم', 'Livermorium', 293],
  [117, 'Ts', 'تنسین', 'Tennessine', 294],
  [118, 'Og', 'اوگانسون', 'Oganesson', 294],
];

const groupOf = (z: number): ElementGroup => {
  if ([3, 11, 19, 37, 55, 87].includes(z)) return 'alkali';
  if ([4, 12, 20, 38, 56, 88].includes(z)) return 'alkaline';
  if ([9, 17, 35, 53, 85, 117].includes(z)) return 'halogen';
  if ([2, 10, 18, 36, 54, 86, 118].includes(z)) return 'noble';
  if ([5, 14, 32, 33, 51, 52].includes(z)) return 'metalloid';
  if ([1, 6, 7, 8, 15, 16, 34].includes(z)) return 'nonmetal';
  if (z >= 57 && z <= 71) return 'lanthanide';
  if (z >= 89 && z <= 103) return 'actinide';
  if ((z >= 21 && z <= 30) || (z >= 39 && z <= 48) || (z >= 72 && z <= 80) || (z >= 104 && z <= 112)) return 'transition';
  return 'post-transition';
};

export const ELEMENTS: Element[] = RAW.map(([z, symbol, nameFa, nameEn, mass]) => ({
  z,
  symbol,
  nameFa,
  nameEn,
  mass,
  group: groupOf(z),
  radioactive: z === 43 || z === 61 || z >= 84,
}));

export const ELEMENT_BY_SYMBOL: Map<string, Element> = new Map(
  ELEMENTS.map((element) => [element.symbol.toLowerCase(), element]),
);

/**
 * Every colour resolves to a `--el-*` token (see globals.css) so the table
 * keeps WCAG contrast in both the light and AMOLED dark themes.
 */
export const ELEMENT_GROUPS: Record<ElementGroup, { fa: string; en: string; color: string }> = {
  nonmetal: { fa: 'نافلز', en: 'Nonmetal', color: 'var(--el-nonmetal)' },
  noble: { fa: 'گاز نجیب', en: 'Noble gas', color: 'var(--el-noble)' },
  alkali: { fa: 'فلز قلیایی', en: 'Alkali metal', color: 'var(--el-alkali)' },
  alkaline: { fa: 'فلز قلیایی خاکی', en: 'Alkaline earth', color: 'var(--el-alkaline)' },
  metalloid: { fa: 'شبه‌فلز', en: 'Metalloid', color: 'var(--el-metalloid)' },
  halogen: { fa: 'هالوژن', en: 'Halogen', color: 'var(--el-halogen)' },
  'post-transition': { fa: 'فلز پس‌گذار', en: 'Post-transition', color: 'var(--el-post-transition)' },
  transition: { fa: 'فلز گذار', en: 'Transition metal', color: 'var(--el-transition)' },
  lanthanide: { fa: 'لانتانید', en: 'Lanthanide', color: 'var(--el-lanthanide)' },
  actinide: { fa: 'اکتینید', en: 'Actinide', color: 'var(--el-actinide)' },
};

/**
 * Position of an element on the standard 18-column table.
 * Rows 9 and 10 hold the lanthanide and actinide series.
 */
export const elementPosition = (z: number): { row: number; col: number } => {
  if (z === 1) return { row: 1, col: 1 };
  if (z === 2) return { row: 1, col: 18 };
  if (z <= 10) return { row: 2, col: z <= 4 ? z - 2 : z + 8 };
  if (z <= 18) return { row: 3, col: z <= 12 ? z - 10 : z };
  if (z <= 36) return { row: 4, col: z - 18 };
  if (z <= 54) return { row: 5, col: z - 36 };
  if (z <= 56) return { row: 6, col: z - 54 };
  if (z <= 71) return { row: 9, col: z - 54 };
  if (z <= 86) return { row: 6, col: z - 68 };
  if (z <= 88) return { row: 7, col: z - 86 };
  if (z <= 103) return { row: 10, col: z - 86 };
  return { row: 7, col: z - 100 };
};
