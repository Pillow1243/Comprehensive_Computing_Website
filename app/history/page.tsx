'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Bookmark, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/states';
import { Chip } from '@/components/ui/chip';
import { FormulaCard } from '@/components/formula-card';
import { getFormula, formulaName } from '@/lib/formulas';
import { useI18n } from '@/lib/i18n';
import { useAppStore, useHydrated, type HistoryEntry } from '@/lib/store';
import { cn, formatNumber, groupByDate, haptic } from '@/lib/utils';

type Tab = 'history' | 'bookmarks';

export default function HistoryPage() {
  const { t, lang, isRtl } = useI18n();
  const hydrated = useHydrated();
  const history = useAppStore((state) => state.history);
  const bookmarks = useAppStore((state) => state.bookmarks);
  const deleteHistory = useAppStore((state) => state.deleteHistory);
  const clearHistory = useAppStore((state) => state.clearHistory);
  const hapticsEnabled = useAppStore((state) => state.settings.haptics);
  const [tab, setTab] = useState<Tab>('history');
  const [target, setTarget] = useState<HistoryEntry | null>(null);
  const [clearOpen, setClearOpen] = useState(false);

  const groups = useMemo(() => {
    const byDate = groupByDate(
      history.map((entry) => entry.createdAt),
      lang === 'fa' ? 'fa-IR' : lang === 'ar' ? 'ar-EG' : 'en-US',
    );
    return byDate.map((group) => ({
      ...group,
      entries: group.items
        .map((stamp) => history.find((entry) => entry.createdAt === stamp))
        .filter((entry): entry is HistoryEntry => Boolean(entry)),
    }));
  }, [history, lang]);

  return (
    <div className="px-4 pb-8 pt-3">
      <div className="mb-3 flex gap-1 rounded-full bg-surface-container p-1" role="tablist" aria-label={t('history')}>
        <button
          role="tab"
          aria-selected={tab === 'history'}
          onClick={() => setTab('history')}
          className={cn(
            'flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full text-label-large transition-colors',
            tab === 'history' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant',
          )}
        >
          <Clock className="h-4 w-4" aria-hidden="true" />
          {t('history')}
        </button>
        <button
          role="tab"
          aria-selected={tab === 'bookmarks'}
          onClick={() => setTab('bookmarks')}
          className={cn(
            'flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full text-label-large transition-colors',
            tab === 'bookmarks' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant',
          )}
        >
          <Bookmark className="h-4 w-4" aria-hidden="true" />
          {t('bookmarks')}
        </button>
      </div>

      {tab === 'history' ? (
        !hydrated ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="skeleton h-20 rounded-xl" />
            ))}
          </div>
        ) : history.length ? (
          <div className="space-y-4">
            {groups.map((group) => (
              <section key={group.key} aria-label={group.label}>
                <h2 className="mb-1.5 px-1 text-label-medium font-medium text-on-surface-variant">
                  {group.label}
                </h2>
                <ul className="space-y-2">
                    {group.entries.map((entry) => {
                      const formula = getFormula(entry.formulaId);
                      const params = new URLSearchParams(
                        Object.entries(entry.inputs).map(([key, value]) => [key, String(value)]),
                      ).toString();
                      const href = formula ? `/formula/${formula.id}/${params ? `?${params}` : ''}` : '/';
                      const preview = Object.entries(entry.values).slice(0, 2);
                      return (
                        <li key={entry.id} className="anim-fade relative overflow-hidden rounded-xl">
                          <div
                            aria-hidden="true"
                            className="absolute inset-0 flex items-center justify-end bg-error-container pe-5 text-on-error-container"
                          >
                            <Trash2 className="h-5 w-5" />
                          </div>
                          <div
                            data-testid="history-row"
                            className="relative touch-pan-y bg-surface-container"
                            onPointerDown={(event) => {
                              const startX = event.clientX;
                              const element = event.currentTarget;
                              const move = (moveEvent: PointerEvent) => {
                                const dx = Math.max(-96, Math.min(0, moveEvent.clientX - startX));
                                element.style.transform = `translateX(${dx}px)`;
                              };
                              const up = (upEvent: PointerEvent) => {
                                element.removeEventListener('pointermove', move);
                                element.removeEventListener('pointerup', up);
                                element.removeEventListener('pointercancel', up);
                                const dx = upEvent.clientX - startX;
                                element.style.transform = '';
                                if (dx < -80) {
                                  haptic(12, hapticsEnabled);
                                  setTarget(entry);
                                }
                              };
                              element.addEventListener('pointermove', move);
                              element.addEventListener('pointerup', up);
                              element.addEventListener('pointercancel', up);
                            }}
                          >
                            <div className="flex items-center gap-2 p-3">
                              <Link href={href} className="min-w-0 flex-1">
                                <span className="flex items-center justify-between gap-2">
                                  <span className="truncate text-body-large font-medium text-on-surface">
                                    {formula
                                      ? formulaName(formula, lang)
                                      : lang === 'fa'
                                        ? entry.name_fa
                                        : entry.name_en}
                                  </span>
                                  <span className="shrink-0 text-label-small text-on-surface-variant">
                                    {new Intl.DateTimeFormat(lang === 'fa' ? 'fa-IR' : 'en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    }).format(entry.createdAt)}
                                  </span>
                                </span>
                                <span
                                  className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-label-small text-on-surface-variant"
                                  dir="ltr"
                                >
                                  {preview.map(([key, value]) => (
                                    <span key={key} className="tnum font-mono">
                                      {key}: {typeof value === 'number' ? formatNumber(value, { decimals: 4, lang }) : String(value)}
                                    </span>
                                  ))}
                                </span>
                              </Link>
                              <button
                                type="button"
                                onClick={() => setTarget(entry)}
                                aria-label={t('delete')}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-on-surface/10"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                </ul>
              </section>
            ))}
            <button
              type="button"
              onClick={() => setClearOpen(true)}
              className="mx-auto flex min-h-12 items-center gap-2 rounded-full px-4 text-label-large text-error"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {t('deleteAllHistory')}
            </button>
            <p className="text-center text-label-small text-on-surface-variant">
              {isRtl ? 'برای حذف، کارت را به کنار بکشید' : 'Swipe a card to delete it'}
            </p>
          </div>
        ) : (
          <EmptyState
            icon={<Clock className="h-9 w-9" aria-hidden="true" />}
            title={t('historyEmpty')}
            description={t('historyEmptyHint')}
            action={
              <Link
                href="/categories/"
                className="rounded-full bg-primary px-5 py-2.5 text-label-large text-on-primary"
              >
                {t('browseCategories')}
              </Link>
            }
          />
        )
      ) : bookmarks.length ? (
        <div className="space-y-2">
          {bookmarks.map((id) => {
            const formula = getFormula(id);
            if (!formula) return null;
            return <FormulaCard key={id} formula={formula} />;
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Bookmark className="h-9 w-9" aria-hidden="true" />}
          title={t('noBookmarks')}
          description={t('suggested')}
          action={
            <Link href="/search/" className="chip-rail">
              <Chip>{t('search')}</Chip>
            </Link>
          }
        />
      )}

      <ConfirmDialog
        open={Boolean(target)}
        title={t('deleteHistoryConfirm')}
        description={target ? (getFormula(target.formulaId) ? formulaName(getFormula(target.formulaId)!, lang) : '') : ''}
        destructive
        onClose={() => setTarget(null)}
        onConfirm={() => {
          if (target) {
            deleteHistory(target.id);
            toast.success(t('deleted'));
          }
        }}
      />
      <ConfirmDialog
        open={clearOpen}
        title={t('deleteAllHistory')}
        description={t('clearCacheConfirmHint')}
        destructive
        confirmLabel={t('deleteAllHistory')}
        onClose={() => setClearOpen(false)}
        onConfirm={() => {
          clearHistory();
          toast.success(t('historyCleared'));
        }}
      />
    </div>
  );
}
