'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { CONSTANTS, CONSTANT_GROUPS, type PhysicalConstant } from '@/lib/constants';
import { cn, formatNumber } from '@/lib/utils';

const groups = Object.keys(CONSTANT_GROUPS) as PhysicalConstant['group'][];

export default function ConstantsPage() {
  const { t, lang } = useI18n();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<PhysicalConstant['group'] | 'all'>('all');
  const [copied, setCopied] = useState<string | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CONSTANTS.filter((constant) => {
      if (group !== 'all' && constant.group !== group) return false;
      if (!q) return true;
      return (
        constant.symbol.toLowerCase().includes(q) ||
        constant.nameEn.toLowerCase().includes(q) ||
        constant.nameFa.includes(q) ||
        constant.unit.toLowerCase().includes(q)
      );
    });
  }, [query, group]);

  const copy = async (constant: PhysicalConstant) => {
    try {
      await navigator.clipboard.writeText(`${constant.nameEn} = ${constant.value} ${constant.unit}`);
      setCopied(constant.symbol);
      toast.success(t('copiedToClipboard'));
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error(t('errorTitle'));
    }
  };

  return (
    <div className="space-y-4 px-4 pb-8 pt-3">
      <div className="flex items-center gap-2 rounded-full bg-surface-container-high px-4">
        <Search className="h-5 w-5 shrink-0 text-on-surface-variant" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('searchConstant')}
          aria-label={t('searchConstant')}
          autoComplete="off"
          className="h-12 min-w-0 flex-1 bg-transparent text-body-medium text-on-surface outline-none placeholder:text-on-surface-variant/70"
        />
      </div>

      <div className="chip-rail -mx-4 px-4">
        <button
          type="button"
          onClick={() => setGroup('all')}
          aria-pressed={group === 'all'}
          className={cn(
            'shrink-0 rounded-full px-3 py-1.5 text-label-medium',
            group === 'all'
              ? 'bg-primary font-semibold text-on-primary'
              : 'border border-outline-variant bg-surface-container text-on-surface-variant',
          )}
        >
          {t('all')}
        </button>
        {groups.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setGroup(group === key ? 'all' : key)}
            aria-pressed={group === key}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-label-medium',
              group === key
                ? 'bg-primary font-semibold text-on-primary'
                : 'border border-outline-variant bg-surface-container text-on-surface-variant',
            )}
          >
            {lang === 'fa' ? CONSTANT_GROUPS[key].fa : CONSTANT_GROUPS[key].en}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {list.map((constant) => (
          <li
            key={constant.symbol}
            className="rounded-2xl border border-outline-variant bg-surface-container p-3.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-body-large font-medium text-on-surface">
                  <span className="mono-result rounded-md bg-surface-container-highest px-1.5 py-0.5 text-label-large text-primary" dir="ltr">
                    {constant.symbol}
                  </span>
                  <span className="truncate">{lang === 'fa' ? constant.nameFa : constant.nameEn}</span>
                </p>
                <p className="mono-result mt-1.5 text-title-medium font-semibold text-on-surface" dir="ltr">
                  {formatNumber(constant.value, {
                    decimals: 10,
                    lang,
                    scientific: Math.abs(constant.value) >= 1e6 || Math.abs(constant.value) < 1e-3,
                  })}{' '}
                  <span className="text-body-small font-normal text-on-surface-variant">{constant.unit}</span>
                </p>
                <p className="mt-0.5 text-label-small text-on-surface-variant">
                  {constant.exact
                    ? t('exactValue')
                    : constant.uncertainty
                      ? `${t('uncertainty')}: ±${constant.uncertainty}`
                      : (lang === 'fa' ? CONSTANT_GROUPS[constant.group].fa : CONSTANT_GROUPS[constant.group].en)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => copy(constant)}
                aria-label={t('copy')}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-surface-variant"
              >
                {copied === constant.symbol ? (
                  <Check className="h-4.5 w-4.5 text-success" aria-hidden="true" />
                ) : (
                  <Copy className="h-4.5 w-4.5" aria-hidden="true" />
                )}
              </button>
            </div>
          </li>
        ))}
      </ul>

      {list.length === 0 && (
        <p className="py-10 text-center text-body-medium text-on-surface-variant">{t('noResults')}</p>
      )}
    </div>
  );
}
