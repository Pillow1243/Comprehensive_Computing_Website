/**
 * Unit conversion tables for the tools hub.
 *
 * Every category converts to a base unit and back, so adding a unit is a single
 * entry. Temperature is offset-based and handled separately.
 */
export type UnitCategory =
  | 'length'
  | 'mass'
  | 'temperature'
  | 'area'
  | 'volume'
  | 'speed'
  | 'pressure'
  | 'energy'
  | 'power'
  | 'force'
  | 'angle'
  | 'time'
  | 'data';

export interface UnitDef {
  /** factor to the base unit of the category */
  factor: number;
  fa: string;
  en: string;
  symbol: string;
}

export interface UnitCategoryDef {
  id: UnitCategory;
  fa: string;
  en: string;
  icon: string;
  units: Record<string, UnitDef>;
  base: string;
}

const u = (factor: number, fa: string, en: string, symbol: string): UnitDef => ({ factor, fa, en, symbol });

export const UNIT_CATEGORIES: UnitCategoryDef[] = [
  {
    id: 'length',
    fa: 'طول',
    en: 'Length',
    icon: 'Ruler',
    base: 'm',
    units: {
      m: u(1, 'متر', 'Metre', 'm'),
      km: u(1000, 'کیلومتر', 'Kilometre', 'km'),
      cm: u(0.01, 'سانتی‌متر', 'Centimetre', 'cm'),
      mm: u(0.001, 'میلی‌متر', 'Millimetre', 'mm'),
      µm: u(1e-6, 'میکرومتر', 'Micrometre', 'µm'),
      nm: u(1e-9, 'نانومتر', 'Nanometre', 'nm'),
      mi: u(1609.344, 'مایل', 'Mile', 'mi'),
      yd: u(0.9144, 'یارد', 'Yard', 'yd'),
      ft: u(0.3048, 'فوت', 'Foot', 'ft'),
      in: u(0.0254, 'اینچ', 'Inch', 'in'),
      nmi: u(1852, 'مایل دریایی', 'Nautical mile', 'nmi'),
      ly: u(9.4607304725808e15, 'سال نوری', 'Light year', 'ly'),
    },
  },
  {
    id: 'mass',
    fa: 'جرم',
    en: 'Mass',
    icon: 'Weight',
    base: 'kg',
    units: {
      kg: u(1, 'کیلوگرم', 'Kilogram', 'kg'),
      g: u(0.001, 'گرم', 'Gram', 'g'),
      mg: u(1e-6, 'میلی‌گرم', 'Milligram', 'mg'),
      µg: u(1e-9, 'میکروگرم', 'Microgram', 'µg'),
      t: u(1000, 'تن', 'Tonne', 't'),
      lb: u(0.45359237, 'پوند', 'Pound', 'lb'),
      oz: u(0.028349523125, 'اونس', 'Ounce', 'oz'),
      st: u(6.35029318, 'استون', 'Stone', 'st'),
      gr: u(6.479891e-5, 'گرین', 'Grain', 'gr'),
      u: u(1.66053906660e-27, 'واحد جرم اتمی', 'Atomic mass unit', 'u'),
    },
  },
  {
    id: 'temperature',
    fa: 'دما',
    en: 'Temperature',
    icon: 'Thermometer',
    base: 'K',
    units: {
      C: u(1, 'سلسیوس', 'Celsius', '°C'),
      F: u(1, 'فارنهایت', 'Fahrenheit', '°F'),
      K: u(1, 'کلوین', 'Kelvin', 'K'),
      R: u(1, 'رانکین', 'Rankine', '°R'),
    },
  },
  {
    id: 'area',
    fa: 'مساحت',
    en: 'Area',
    icon: 'Square',
    base: 'm²',
    units: {
      'm²': u(1, 'متر مربع', 'Square metre', 'm²'),
      'km²': u(1e6, 'کیلومتر مربع', 'Square kilometre', 'km²'),
      'cm²': u(1e-4, 'سانتی‌متر مربع', 'Square centimetre', 'cm²'),
      ha: u(10000, 'هکتار', 'Hectare', 'ha'),
      acre: u(4046.8564224, 'ایکر', 'Acre', 'ac'),
      'ft²': u(0.09290304, 'فوت مربع', 'Square foot', 'ft²'),
      'in²': u(0.00064516, 'اینچ مربع', 'Square inch', 'in²'),
    },
  },
  {
    id: 'volume',
    fa: 'حجم',
    en: 'Volume',
    icon: 'Beaker',
    base: 'm³',
    units: {
      'm³': u(1, 'متر مکعب', 'Cubic metre', 'm³'),
      L: u(0.001, 'لیتر', 'Litre', 'L'),
      mL: u(1e-6, 'میلی‌لیتر', 'Millilitre', 'mL'),
      'cm³': u(1e-6, 'سانتی‌متر مکعب', 'Cubic centimetre', 'cm³'),
      gal: u(0.003785411784, 'گالن آمریکایی', 'US gallon', 'gal'),
      qt: u(0.000946352946, 'کوارت', 'Quart', 'qt'),
      'ft³': u(0.028316846592, 'فوت مکعب', 'Cubic foot', 'ft³'),
      'in³': u(1.6387064e-5, 'اینچ مکعب', 'Cubic inch', 'in³'),
    },
  },
  {
    id: 'speed',
    fa: 'سرعت',
    en: 'Speed',
    icon: 'Gauge',
    base: 'm/s',
    units: {
      'm/s': u(1, 'متر بر ثانیه', 'Metre per second', 'm/s'),
      'km/h': u(1 / 3.6, 'کیلومتر بر ساعت', 'Kilometre per hour', 'km/h'),
      mph: u(0.44704, 'مایل بر ساعت', 'Mile per hour', 'mph'),
      kn: u(0.514444, 'گره', 'Knot', 'kn'),
      'ft/s': u(0.3048, 'فوت بر ثانیه', 'Foot per second', 'ft/s'),
      c: u(299792458, 'سرعت نور', 'Speed of light', 'c'),
    },
  },
  {
    id: 'pressure',
    fa: 'فشار',
    en: 'Pressure',
    icon: 'CircleGauge',
    base: 'Pa',
    units: {
      Pa: u(1, 'پاسکال', 'Pascal', 'Pa'),
      kPa: u(1000, 'کیلوپاسکال', 'Kilopascal', 'kPa'),
      MPa: u(1e6, 'مگاپاسکال', 'Megapascal', 'MPa'),
      bar: u(1e5, 'بار', 'Bar', 'bar'),
      atm: u(101325, 'اتمسفر', 'Atmosphere', 'atm'),
      psi: u(6894.757293168, 'پوند بر اینچ مربع', 'Pound per square inch', 'psi'),
      mmHg: u(133.322387415, 'میلی‌متر جیوه', 'Millimetre of mercury', 'mmHg'),
      torr: u(133.322368421, 'تور', 'Torr', 'Torr'),
    },
  },
  {
    id: 'energy',
    fa: 'انرژی',
    en: 'Energy',
    icon: 'Zap',
    base: 'J',
    units: {
      J: u(1, 'ژول', 'Joule', 'J'),
      kJ: u(1000, 'کیلوژول', 'Kilojoule', 'kJ'),
      cal: u(4.184, 'کالری', 'Calorie', 'cal'),
      kcal: u(4184, 'کیلوکالری', 'Kilocalorie', 'kcal'),
      Wh: u(3600, 'وات‌ساعت', 'Watt hour', 'Wh'),
      kWh: u(3.6e6, 'کیلووات‌ساعت', 'Kilowatt hour', 'kWh'),
      eV: u(1.602176634e-19, 'الکترون‌ولت', 'Electronvolt', 'eV'),
      BTU: u(1055.05585262, 'بی‌تی‌یو', 'British thermal unit', 'BTU'),
      TNT: u(4.184e9, 'تن تی‌ان‌تی', 'Tonne of TNT', 'tTNT'),
    },
  },
  {
    id: 'power',
    fa: 'توان',
    en: 'Power',
    icon: 'Activity',
    base: 'W',
    units: {
      W: u(1, 'وات', 'Watt', 'W'),
      kW: u(1000, 'کیلووات', 'Kilowatt', 'kW'),
      MW: u(1e6, 'مگاوات', 'Megawatt', 'MW'),
      hp: u(745.699871582, 'اسب بخار', 'Horsepower', 'hp'),
      'kcal/h': u(1.163, 'کیلوکالری بر ساعت', 'Kilocalorie per hour', 'kcal/h'),
      'BTU/h': u(0.29307107, 'بی‌تی‌یو بر ساعت', 'BTU per hour', 'BTU/h'),
    },
  },
  {
    id: 'force',
    fa: 'نیرو',
    en: 'Force',
    icon: 'Move3d',
    base: 'N',
    units: {
      N: u(1, 'نیوتن', 'Newton', 'N'),
      kN: u(1000, 'کیلونیوتن', 'Kilonewton', 'kN'),
      dyn: u(1e-5, 'داین', 'Dyne', 'dyn'),
      lbf: u(4.4482216152605, 'پوند-نیرو', 'Pound-force', 'lbf'),
      kgf: u(9.80665, 'کیلوگرم-نیرو', 'Kilogram-force', 'kgf'),
    },
  },
  {
    id: 'angle',
    fa: 'زاویه',
    en: 'Angle',
    icon: 'Compass',
    base: 'rad',
    units: {
      deg: u(Math.PI / 180, 'درجه', 'Degree', '°'),
      rad: u(1, 'رادیان', 'Radian', 'rad'),
      grad: u(Math.PI / 200, 'گرادیان', 'Gradian', 'grad'),
      turn: u(Math.PI * 2, 'دور کامل', 'Turn', 'turn'),
    },
  },
  {
    id: 'time',
    fa: 'زمان',
    en: 'Time',
    icon: 'Clock',
    base: 's',
    units: {
      s: u(1, 'ثانیه', 'Second', 's'),
      ms: u(0.001, 'میلی‌ثانیه', 'Millisecond', 'ms'),
      min: u(60, 'دقیقه', 'Minute', 'min'),
      h: u(3600, 'ساعت', 'Hour', 'h'),
      d: u(86400, 'روز', 'Day', 'd'),
      wk: u(604800, 'هفته', 'Week', 'wk'),
      yr: u(31557600, 'سال', 'Year', 'yr'),
    },
  },
  {
    id: 'data',
    fa: 'داده',
    en: 'Data',
    icon: 'Database',
    base: 'B',
    units: {
      B: u(1, 'بایت', 'Byte', 'B'),
      KB: u(1000, 'کیلوبایت', 'Kilobyte', 'KB'),
      MB: u(1e6, 'مگابایت', 'Megabyte', 'MB'),
      GB: u(1e9, 'گیگابایت', 'Gigabyte', 'GB'),
      TB: u(1e12, 'ترابایت', 'Terabyte', 'TB'),
      KiB: u(1024, 'کیبی‌بایت', 'Kibibyte', 'KiB'),
      MiB: u(1024 ** 2, 'میبی‌بایت', 'Mebibyte', 'MiB'),
      GiB: u(1024 ** 3, 'گیبی‌بایت', 'Gibibyte', 'GiB'),
      bit: u(0.125, 'بیت', 'Bit', 'bit'),
    },
  },
];

export const unitCategory = (id: UnitCategory) =>
  UNIT_CATEGORIES.find((category) => category.id === id) ?? UNIT_CATEGORIES[0];

/** Temperature conversions route through kelvin. */
const toKelvin = (value: number, unit: string) => {
  switch (unit) {
    case 'C':
      return value + 273.15;
    case 'F':
      return (value - 32) * (5 / 9) + 273.15;
    case 'R':
      return value * (5 / 9);
    default:
      return value;
  }
};

const fromKelvin = (kelvin: number, unit: string) => {
  switch (unit) {
    case 'C':
      return kelvin - 273.15;
    case 'F':
      return (kelvin - 273.15) * (9 / 5) + 32;
    case 'R':
      return kelvin * (9 / 5);
    default:
      return kelvin;
  }
};

export const convertUnit = (
  value: number,
  categoryId: UnitCategory,
  from: string,
  to: string,
): number => {
  const category = unitCategory(categoryId);
  const fromUnit = category.units[from];
  const toUnit = category.units[to];
  if (!fromUnit || !toUnit) throw new Error('واحد نامعتبر است');
  if (categoryId === 'temperature') return fromKelvin(toKelvin(value, from), to);
  return (value * fromUnit.factor) / toUnit.factor;
};

/** Human-friendly formatter: keeps small and large magnitudes readable. */
export const formatUnitValue = (value: number, lang: 'fa' | 'en' | 'ar' = 'fa', numerals: 'latin' | 'native' = 'latin') => {
  if (!Number.isFinite(value)) return '—';
  const digits = (text: string) =>
    numerals === 'native'
      ? text.replace(/[0-9]/g, (digit) =>
          (lang === 'ar' ? '٠١٢٣٤٥٦٧٨٩' : '۰۱۲۳۴۵۶۷۸۹')[Number(digit)],
        )
      : text;
  if (value !== 0 && (Math.abs(value) >= 1e12 || Math.abs(value) < 1e-6)) {
    return digits(value.toExponential(6));
  }
  return digits(new Intl.NumberFormat('en-US', { maximumFractionDigits: 8 }).format(value));
};
