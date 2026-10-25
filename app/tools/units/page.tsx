'use client';

import { useMemo, useState } from 'react';
import { ArrowLeftRight, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { formatNumber } from '@/lib/utils';
import {
  UNIT_CATEGORIES,
  convertUnit,
  formatUnitValue,
  unitCategory,
  type UnitCategory,
} from '@/lib/units';

export default function UnitsPage() {
  const { t, lang, numerals } = useI18n();
  const [category, setCategory] = useState<UnitCategory>('length');
  const [amount, setAmount] = useState('1');
  const [from, setFrom] = useState('m');
  const [to, setTo] = useState('ft');

  const definition = unitCategory(category);
  const units = Object.entries(definition.units);
  const numeric = Number(amount.replace(/,/g, ''));

  const converted = useMemo(() => {
    if (!Number.isFinite(numeric)) return Number.NaN;
    try {
      return convertUnit(numeric, category, from, to);
    } catch {
      return Number.NaN;
    }
  }, [numeric, category, from, to]);

  const table = useMemo(() => {
    if (!Number.isFinite(numeric)) return [];
    return units.map(([id, unit]) => {
      try {
        return { id, unit, value: convertUnit(numeric, category, from, id) };
      } catch {
        return { id, unit, value: Number.NaN };
      }
    });
  }, [numeric, category, from, units]);

  const selectCategory = (id: UnitCategory) => {
    const next = unitCategory(id);
    const keys = Object.keys(next.units);
    setCategory(id);
    setFrom(keys[0]);
    setTo(keys[1] ?? keys[0]);
  };

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(converted));
      toast.success(t('copiedToClipboard'));
    } catch {
      toast.error(t('errorTitle'));
    }
  };

  const unitLabel = (id: string) => {
    const unit = definition.units[id];
    if (!unit) return id;
    return `${lang === 'fa' ? unit.fa : unit.en} (${unit.symbol})`;
  };

  return (
    <div className="space-y-5 px-4 pb-8 pt-3">
      <div className="chip-rail -mx-4 px-4" role="tablist" aria-label={t('unitConverter')}>
        {UNIT_CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === category}
            onClick={() => selectCategory(item.id)}
            className={
              item.id === category
                ? 'shrink-0 rounded-full bg-primary px-4 py-2 text-label-large font-semibold text-on-primary'
                : 'shrink-0 rounded-full border border-outline-variant bg-surface-container px-4 py-2 text-label-large text-on-surface-variant'
            }
          >
            {lang === 'fa' ? item.fa : item.en}
          </button>
        ))}
      </div>

      <section className="hero-surface space-y-3 p-4" aria-label={t('unitConverter')}>
        <label className="block">
          <span className="mb-1 block text-label-medium text-on-surface-variant">{t('value')}</span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            aria-label={t('value')}
            className="h-14 w-full rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 text-headline-small font-semibold mono-result text-on-surface outline-none focus:border-primary"
          />
        </label>

        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <label className="block min-w-0">
            <span className="mb-1 block text-label-medium text-on-surface-variant">{t('from')}</span>
            <select
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              aria-label={t('from')}
              className="h-12 w-full rounded-xl border border-outline-variant bg-surface-container px-2 text-body-medium text-on-surface outline-none focus:border-primary"
            >
              {units.map(([id]) => (
                <option key={id} value={id}>
                  {unitLabel(id)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={swap}
            aria-label={t('swap')}
            className="mb-0.5 flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant bg-surface-container-high text-on-surface"
          >
            <ArrowLeftRight className="h-4.5 w-4.5 rtl:rotate-180" aria-hidden="true" />
          </button>
          <label className="block min-w-0">
            <span className="mb-1 block text-label-medium text-on-surface-variant">{t('to')}</span>
            <select
              value={to}
              onChange={(event) => setTo(event.target.value)}
              aria-label={t('to')}
              className="h-12 w-full rounded-xl border border-outline-variant bg-surface-container px-2 text-body-medium text-on-surface outline-none focus:border-primary"
            >
              {units.map(([id]) => (
                <option key={id} value={id}>
                  {unitLabel(id)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div
          className="flex items-center justify-between gap-2 rounded-2xl bg-surface-container-high/70 px-4 py-4"
          aria-live="polite"
        >
          <div className="min-w-0">
            <p className="text-label-medium text-on-surface-variant">{t('result')}</p>
            <p className="mono-result truncate text-headline-small font-bold text-primary">
              {formatUnitValue(converted, lang, numerals)}
            </p>
            <p className="text-label-small text-on-surface-variant">
              {definition.units[to]?.symbol ?? to}
            </p>
          </div>
          <button
            type="button"
            onClick={copy}
            aria-label={t('copy')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-container-highest text-on-surface-variant"
          >
            <Copy className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>
      </section>

      <section aria-labelledby="unit-table-heading" className="space-y-2">
        <h2 id="unit-table-heading" className="text-title-medium font-semibold text-on-surface">
          {t('allUnits')}
        </h2>
        <ul className="divide-y divide-outline-variant overflow-hidden rounded-2xl border border-outline-variant bg-surface-container">
          {table.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="text-body-medium text-on-surface-variant">
                {lang === 'fa' ? row.unit.fa : row.unit.en}
                <span className="ms-1 text-label-small opacity-70">{row.unit.symbol}</span>
              </span>
              <span className="mono-result text-body-medium font-semibold text-on-surface">
                {formatNumber(row.value, { decimals: 6, lang, numerals, scientific: Math.abs(row.value) >= 1e12 })}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
