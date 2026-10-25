'use client';

import { useMemo, useState } from 'react';
import { Landmark } from 'lucide-react';
import {
  gregorianToJalali,
  jalaliAge,
  jalaliToGregorian,
  isJalaliLeap,
  isValidJalali,
  mehriehAtCurrentRate,
  netSalaryIran,
  percentOfFullAmount,
  type JalaliDate,
} from '@/lib/iran-tools';
import { useI18n } from '@/lib/i18n';
import { formatNumber } from '@/lib/utils';

const inputClass = 'h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 font-mono text-on-surface outline-none focus:border-primary';

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-label-medium text-on-surface-variant">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} dir="ltr" inputMode="decimal" className={inputClass} />
    </label>
  );
}

export default function IranDeskPage() {
  const { lang, numerals } = useI18n();
  const fa = lang !== 'en';
  const fmt = (value: number) => formatNumber(value, { decimals: 4, lang, numerals });

  const todayJalali = useMemo(() => {
    const now = new Date();
    return gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }, []);

  const [jy, setJy] = useState(String(todayJalali.jy));
  const [jm, setJm] = useState(String(todayJalali.jm));
  const [jd, setJd] = useState(String(todayJalali.jd));
  const [gy, setGy] = useState('2024');
  const [gm, setGm] = useState('3');
  const [gd, setGd] = useState('20');

  const [birth, setBirth] = useState<JalaliDate>({ jy: 1380, jm: 5, jd: 10 });
  const [at, setAt] = useState<JalaliDate>(todayJalali);

  const [gross, setGross] = useState('200000000');
  const [insuranceRate, setInsuranceRate] = useState('7');
  const [taxRate, setTaxRate] = useState('10');
  const [exempt, setExempt] = useState('0');
  const [mehriehPrincipal, setMehriehPrincipal] = useState('100000000');
  const [indexThen, setIndexThen] = useState('50');
  const [indexNow, setIndexNow] = useState('200');
  const [fullAmount, setFullAmount] = useState('16000000000');
  const [percent, setPercent] = useState('1');

  const jalali = { jy: Number(jy), jm: Number(jm), jd: Number(jd) };
  const jalaliValid = isValidJalali(jalali.jy, jalali.jm, jalali.jd);
  const gregorian = jalaliValid ? jalaliToGregorian(jalali.jy, jalali.jm, jalali.jd) : null;
  const backToJalali = gregorianToJalali(Number(gy) || 1, Number(gm) || 1, Number(gd) || 1);
  const age = useMemo(() => {
    try { return jalaliAge(birth, at); } catch { return null; }
  }, [birth, at]);
  const salary = netSalaryIran({
    gross: Number(gross) || 0,
    insuranceRatePercent: Number(insuranceRate) || 0,
    taxRatePercent: Number(taxRate) || 0,
    taxExemptMonthly: Number(exempt) || 0,
  });

  const dateField = (label: string, value: JalaliDate, onChange: (value: JalaliDate) => void) => (
    <fieldset>
      <legend className="mb-1 text-label-medium text-on-surface-variant">{label}</legend>
      <div className="grid grid-cols-3 gap-2" dir="ltr">
        <input aria-label={`${label} — year`} value={value.jy} onChange={(e) => onChange({ ...value, jy: Number(e.target.value) })} inputMode="numeric" className={inputClass} />
        <input aria-label={`${label} — month`} value={value.jm} onChange={(e) => onChange({ ...value, jm: Number(e.target.value) })} inputMode="numeric" className={inputClass} />
        <input aria-label={`${label} — day`} value={value.jd} onChange={(e) => onChange({ ...value, jd: Number(e.target.value) })} inputMode="numeric" className={inputClass} />
      </div>
    </fieldset>
  );

  return (
    <div className="space-y-5 px-4 pb-8 pt-3">
      <header className="hero-surface p-5">
        <p className="data-pill relative z-10"><Landmark className="h-3.5 w-3.5" aria-hidden="true" />{fa ? 'ابزارها' : 'Tools'}</p>
        <h1 className="relative z-10 mt-2 text-headline-medium font-bold text-on-surface">{fa ? 'میز ایران' : 'Iran desk'}</h1>
        <p className="relative z-10 mt-1 text-body-medium text-on-surface-variant">
          {fa
            ? 'تقویم شمسی دقیق و محاسبه‌گرهای بومی. نرخ‌ها و شاخص‌های قانونی هر سال عوض می‌شوند؛ پس اینجا ورودیِ قابل ویرایش شما هستند، نه عددِ از پیش‌قضاوت‌شده.'
            : 'An exact Jalali calendar and local calculators. Statutory rates and indices change yearly, so they are editable inputs here — never silently baked in.'}
        </p>
      </header>

      <section className="space-y-3 rounded-3xl border border-outline-variant bg-surface-container p-4">
        <h2 className="text-title-medium font-semibold text-on-surface">{fa ? 'تبدیل تاریخ شمسی ↔ میلادی' : 'Jalali ↔ Gregorian conversion'}</h2>
        <div className="grid grid-cols-3 gap-2" dir="ltr">
          <NumberField label={fa ? 'سال شمسی' : 'Jalali year'} value={jy} onChange={setJy} />
          <NumberField label={fa ? 'ماه' : 'Month'} value={jm} onChange={setJm} />
          <NumberField label={fa ? 'روز' : 'Day'} value={jd} onChange={setJd} />
        </div>
        {jalaliValid && gregorian ? (
          <p className="tnum rounded-xl bg-primary-container/40 p-3 text-body-large font-semibold text-on-surface" dir="ltr">
            {jalali.jy}/{jalali.jm}/{jalali.jd} = {gregorian.gy}-{String(gregorian.gm).padStart(2, '0')}-{String(gregorian.gd).padStart(2, '0')}
            {' · '}{isJalaliLeap(jalali.jy) ? (fa ? 'سال کبیسه' : 'leap year') : (fa ? 'سال عادی' : 'common year')}
          </p>
        ) : <p role="alert" className="text-body-small text-error">{fa ? 'تاریخ شمسی معتبر نیست.' : 'Invalid Jalali date.'}</p>}
        <div className="grid grid-cols-3 gap-2" dir="ltr">
          <NumberField label={fa ? 'سال میلادی' : 'Gregorian year'} value={gy} onChange={setGy} />
          <NumberField label={fa ? 'ماه' : 'Month'} value={gm} onChange={setGm} />
          <NumberField label={fa ? 'روز' : 'Day'} value={gd} onChange={setGd} />
        </div>
        <p className="tnum rounded-xl bg-surface-container-high/70 p-3 text-body-large font-semibold text-on-surface" dir="ltr">
          {gy}-{gm}-{gd} = {backToJalali.jy}/{backToJalali.jm}/{backToJalali.jd}
        </p>
        <p className="text-body-small text-on-surface-variant">{fa ? `امروز: ${todayJalali.jy}/${todayJalali.jm}/${todayJalali.jd} شمسی` : `Today: ${todayJalali.jy}/${todayJalali.jm}/${todayJalali.jd} Jalali`}</p>
      </section>

      <section className="space-y-3 rounded-3xl border border-outline-variant bg-surface-container p-4">
        <h2 className="text-title-medium font-semibold text-on-surface">{fa ? 'سن دقیق شمسی' : 'Exact Jalali age'}</h2>
        {dateField(fa ? 'تاریخ تولد (سال، ماه، روز)' : 'Birth date (year, month, day)', birth, setBirth)}
        {dateField(fa ? 'در تاریخ (سال، ماه، روز)' : 'At date (year, month, day)', at, setAt)}
        {age ? (
          <p className="rounded-xl bg-primary-container/40 p-3 text-body-large font-semibold text-on-surface">
            {fa ? `${age.years} سال و ${age.months} ماه و ${age.days} روز` : `${age.years}y ${age.months}m ${age.days}d`}
            <span className="tnum block text-body-small font-normal text-on-surface-variant" dir="ltr">{fmt(age.totalDays)} days</span>
          </p>
        ) : <p role="alert" className="text-body-small text-error">{fa ? 'بازهٔ تاریخ معتبر نیست.' : 'Invalid date range.'}</p>}
      </section>

      <section className="space-y-3 rounded-3xl border border-outline-variant bg-surface-container p-4">
        <h2 className="text-title-medium font-semibold text-on-surface">{fa ? 'حقوق خالص (نرخ‌ها قابل ویرایش)' : 'Net salary (editable rates)'}</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <NumberField label={fa ? 'حقوق ناخالص ماهانه' : 'Gross monthly salary'} value={gross} onChange={setGross} />
          <NumberField label={fa ? 'معافیت مالیاتی ماهانه' : 'Monthly tax exemption'} value={exempt} onChange={setExempt} />
          <NumberField label={fa ? 'درصد بیمهٔ کارمند' : 'Employee insurance %'} value={insuranceRate} onChange={setInsuranceRate} />
          <NumberField label={fa ? 'درصد مالیات مؤثر' : 'Effective tax %'} value={taxRate} onChange={setTaxRate} />
        </div>
        <dl className="grid grid-cols-3 gap-2" aria-live="polite">
          {[
            [fa ? 'بیمه' : 'Insurance', salary.insuranceEmployee],
            [fa ? 'مالیات' : 'Tax', salary.incomeTax],
            [fa ? 'خالص' : 'Net', salary.netPay],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-xl bg-surface-container-high/70 p-3">
              <dt className="text-label-small text-on-surface-variant">{label}</dt>
              <dd className="tnum mt-0.5 break-all font-mono text-body-medium font-bold text-on-surface" dir="ltr">{fmt(value as number)}</dd>
            </div>
          ))}
        </dl>
        <p className="text-body-small text-on-surface-variant">{fa ? 'نرخ قانونی جاری را از قانون بودجه و سازمان امور مالیاتی بررسی کنید؛ این ابزار نرخ را حدس نمی‌زند.' : 'Verify current statutory rates with official sources; this tool never guesses them.'}</p>
      </section>

      <section className="space-y-3 rounded-3xl border border-outline-variant bg-surface-container p-4">
        <h2 className="text-title-medium font-semibold text-on-surface">{fa ? 'مهریه به نرخ روز و درصد از مبلغ کامل' : 'Indexed mehrieh & percentage of a full amount'}</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          <NumberField label={fa ? 'اصل مبلغ مهریه' : 'Mehrieh principal'} value={mehriehPrincipal} onChange={setMehriehPrincipal} />
          <NumberField label={fa ? 'شاخص سال عقد' : 'Index at marriage'} value={indexThen} onChange={setIndexThen} />
          <NumberField label={fa ? 'شاخص سال پرداخت' : 'Index at payment'} value={indexNow} onChange={setIndexNow} />
        </div>
        <p className="tnum rounded-xl bg-primary-container/40 p-3 font-mono text-body-large font-semibold text-on-surface" dir="ltr">
          {(() => { try { return fmt(mehriehAtCurrentRate(Number(mehriehPrincipal) || 0, Number(indexThen) || 0, Number(indexNow) || 0)); } catch { return '—'; } })()}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <NumberField label={fa ? 'مبلغ کامل (مثلاً دیهٔ کامل سال مورد نظر)' : 'Full amount (e.g. that year’s full diyah)'} value={fullAmount} onChange={setFullAmount} />
          <NumberField label={fa ? 'درصد' : 'Percent'} value={percent} onChange={setPercent} />
        </div>
        <p className="tnum rounded-xl bg-surface-container-high/70 p-3 font-mono text-body-large font-semibold text-on-surface" dir="ltr">
          {fmt(percentOfFullAmount(Number(fullAmount) || 0, Number(percent) || 0))}
        </p>
        <p className="text-body-small text-on-surface-variant">{fa ? 'شاخص‌ها و مبالغ کامل رسماً و سالانه اعلام می‌شوند؛ نتیجهٔ این ابزار برآورد محاسباتی است، نه نظر حقوقی.' : 'Indices and full amounts are officially announced yearly; results are arithmetic estimates, not legal advice.'}</p>
      </section>
    </div>
  );
}
