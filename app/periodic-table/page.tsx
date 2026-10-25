'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  ELEMENTS,
  ELEMENT_GROUPS,
  elementPosition,
  type Element,
  type ElementGroup,
} from '@/lib/periodic-table';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { formatNumber } from '@/lib/utils';

const groupKeys = Object.keys(ELEMENT_GROUPS) as ElementGroup[];

export default function PeriodicTablePage() {
  const { t, lang } = useI18n();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ElementGroup | 'all'>('all');
  const [selected, setSelected] = useState<Element | null>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ELEMENTS.filter((element) => {
      if (filter !== 'all' && element.group !== filter) return false;
      if (!q) return true;
      return (
        element.symbol.toLowerCase().includes(q) ||
        element.nameEn.toLowerCase().includes(q) ||
        element.nameFa.includes(q) ||
        String(element.z) === q
      );
    });
  }, [query, filter]);

  const highlighted = new Set(matches.map((element) => element.z));
  const searching = Boolean(query.trim()) || filter !== 'all';

  return (
    <div className="space-y-4 px-3 pb-8 pt-3">
      <div className="flex items-center gap-2 rounded-full bg-surface-container-high px-4">
        <Search className="h-5 w-5 shrink-0 text-on-surface-variant" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('searchElement')}
          aria-label={t('searchElement')}
          autoComplete="off"
          spellCheck={false}
          className="h-12 min-w-0 flex-1 bg-transparent text-body-medium text-on-surface outline-none placeholder:text-on-surface-variant/70"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label={t('clearSearch')}
            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="chip-rail -mx-3 px-3">
        <button
          type="button"
          onClick={() => setFilter('all')}
          aria-pressed={filter === 'all'}
          className={
            filter === 'all'
              ? 'shrink-0 rounded-full bg-primary px-3 py-1.5 text-label-medium font-semibold text-on-primary'
              : 'shrink-0 rounded-full border border-outline-variant bg-surface-container px-3 py-1.5 text-label-medium text-on-surface-variant'
          }
        >
          {t('allGroups')}
        </button>
        {groupKeys.map((key) => {
          const meta = ELEMENT_GROUPS[key];
          const active = filter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(active ? 'all' : key)}
              aria-pressed={active}
              className="shrink-0 rounded-full border px-3 py-1.5 text-label-medium"
              style={{
                borderColor: active ? meta.color : 'rgb(var(--md-outline-variant))',
                backgroundColor: active ? `rgb(${meta.color} / 0.16)` : 'rgb(var(--md-surface-container))',
                color: active ? meta.color : 'rgb(var(--md-on-surface-variant))',
              }}
            >
              {lang === 'fa' ? meta.fa : meta.en}
            </button>
          );
        })}
      </div>

      <div className="-mx-3 overflow-x-auto px-3 pb-1">
        <div
          dir="ltr"
          className="grid min-w-[46rem] gap-[3px]"
          style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}
          role="grid"
          aria-label={t('periodicTable')}
        >
          {ELEMENTS.map((element) => {
            const { row, col } = elementPosition(element.z);
            const meta = ELEMENT_GROUPS[element.group];
            const dimmed = searching && !highlighted.has(element.z);
            return (
              <button
                key={element.z}
                type="button"
                role="gridcell"
                onClick={() => setSelected(element)}
                aria-label={`${element.nameEn} (${element.symbol}) — ${t('atomicNumber')} ${element.z}`}
                className="relative flex aspect-square flex-col items-center justify-center rounded-[6px] border text-center transition-opacity"
                style={{
                  gridRow: row,
                  gridColumn: col,
                  borderColor: `rgb(${meta.color} / 0.45)`,
                  backgroundColor: `rgb(${meta.color} / ${dimmed ? '0.04' : '0.13'})`,
                  color: dimmed ? 'rgb(var(--md-on-surface-variant))' : meta.color,
                  opacity: dimmed ? 0.35 : 1,
                }}
              >
                <span className="absolute start-1 top-0.5 text-[8px] leading-none opacity-70">
                  {element.z}
                </span>
                <span className="mt-1 text-[11px] font-bold leading-none sm:text-sm" dir="ltr">
                  {element.symbol}
                </span>
                <span className="mt-0.5 hidden truncate px-0.5 text-[7px] leading-none opacity-80 sm:block">
                  {lang === 'fa' ? element.nameFa : element.nameEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {searching && (
        <p className="text-center text-body-small text-on-surface-variant" aria-live="polite">
          {t('resultsCount', { count: matches.length })}
        </p>
      )}

      <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {groupKeys.map((key) => {
          const meta = ELEMENT_GROUPS[key];
          return (
            <li key={key} className="flex items-center gap-1.5 text-label-small text-on-surface-variant">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: meta.color }} aria-hidden="true" />
              {lang === 'fa' ? meta.fa : meta.en}
            </li>
          );
        })}
      </ul>

      <BottomSheet
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? (lang === 'fa' ? selected.nameFa : selected.nameEn) : ''}
        description={selected ? ELEMENT_GROUPS[selected.group][lang === 'fa' ? 'fa' : 'en'] : undefined}
        snapPoints={[0.45]}
      >
        {selected && (
          <div className="space-y-3 pb-4">
            <div
              className="flex items-center gap-4 rounded-2xl border p-4"
              style={{
                borderColor: `rgb(${ELEMENT_GROUPS[selected.group].color} / 0.45)`,
                backgroundColor: `rgb(${ELEMENT_GROUPS[selected.group].color} / 0.12)`,
              }}
            >
              <span
                className="mono-result text-display-medium font-bold"
                style={{ color: ELEMENT_GROUPS[selected.group].color }}
                dir="ltr"
              >
                {selected.symbol}
              </span>
              <span className="text-body-medium text-on-surface-variant" dir="ltr">
                <span className="block text-title-medium text-on-surface">
                  {lang === 'fa' ? selected.nameFa : selected.nameEn}
                </span>
                {selected.nameEn} · #{selected.z}
              </span>
            </div>
            <dl className="divide-y divide-outline-variant overflow-hidden rounded-2xl border border-outline-variant">
              <div className="flex items-center justify-between px-4 py-2.5">
                <dt className="text-body-medium text-on-surface-variant">{t('atomicNumber')}</dt>
                <dd className="mono-result text-body-medium font-semibold text-on-surface">
                  {formatNumber(selected.z, { decimals: 0, lang })}
                </dd>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <dt className="text-body-medium text-on-surface-variant">{t('atomicMass')}</dt>
                <dd className="mono-result text-body-medium font-semibold text-on-surface" dir="ltr">
                  {selected.mass} u
                </dd>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <dt className="text-body-medium text-on-surface-variant">{t('group')}</dt>
                <dd className="text-body-medium font-medium text-on-surface">
                  {lang === 'fa' ? ELEMENT_GROUPS[selected.group].fa : ELEMENT_GROUPS[selected.group].en}
                </dd>
              </div>
              {selected.radioactive && (
                <div className="flex items-center justify-between px-4 py-2.5">
                  <dt className="text-body-medium text-on-surface-variant">{t('radioactive')}</dt>
                  <dd className="text-body-medium font-medium text-error">☢</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
