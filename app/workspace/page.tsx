'use client';

import Link from 'next/link';
import { ArrowUpRight, Briefcase, Download, Pin, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/states';
import { downloadTextFile, recordsAsMarkdown, type CalculationExportRecord } from '@/lib/calculation-export';
import { useI18n } from '@/lib/i18n';
import { useAppStore, useHydrated, type WorkspaceItem } from '@/lib/store';
import { toast } from '@/lib/toast';
import { formatNumber } from '@/lib/utils';

const buildRecord = (item: WorkspaceItem, lang: string): CalculationExportRecord => ({
  formula_id: item.formulaId ?? 'note',
  formula_name: item.title,
  formula_latex: '',
  inputs: item.inputs,
  input_units: Object.fromEntries(Object.keys(item.inputs).map((key) => [key, null])),
  outputs: item.values,
  output_units: Object.fromEntries(Object.keys(item.values).map((key) => [key, null])),
  steps: item.note ? [item.note] : [],
  created_at: new Date(item.createdAt).toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-GB'),
});

export default function WorkspacePage() {
  const { t, lang, numerals } = useI18n();
  const hydrated = useHydrated();
  const workspace = useAppStore((state) => state.workspace);
  const history = useAppStore((state) => state.history);
  const addItem = useAppStore((state) => state.addWorkspaceItem);
  const updateItem = useAppStore((state) => state.updateWorkspaceItem);
  const deleteItem = useAppStore((state) => state.deleteWorkspaceItem);

  const fmt = (value: unknown) => formatNumber(value, { decimals: 6, lang, numerals });
  const unpinned = history.slice(0, 6);

  const pin = (entry: (typeof history)[number]) => {
    addItem({
      title: lang === 'fa' ? entry.name_fa : entry.name_en,
      note: '',
      formulaId: entry.formulaId,
      inputs: entry.inputs,
      values: entry.values,
    });
    toast.success(t('savedToWorkspace'));
  };

  const exportAll = () => {
    const labels = {
      inputs: t('reportInputs'),
      outputs: t('reportOutputs'),
      steps: t('stepsTitle'),
      generatedWith: t('reportGenerated'),
    };
    downloadTextFile(
      recordsAsMarkdown(workspace.map((item) => buildRecord(item, lang)), t('workspaceTitle'), labels),
      'text/markdown;charset=utf-8',
      'solveeverything-workspace.md',
    );
    toast.success(t('exportReady'));
  };

  return (
    <div className="space-y-6 px-4 pb-8 pt-3">
      <header className="hero-surface p-5">
        <p className="data-pill relative z-10">
          <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
          {t('appName')}
        </p>
        <h1 className="relative z-10 mt-2 text-headline-medium font-bold text-on-surface">{t('workspaceTitle')}</h1>
        <p className="relative z-10 mt-1 text-body-medium text-on-surface-variant">{t('workspaceHint')}</p>
        {hydrated && workspace.length > 0 && (
          <Button variant="tonal" className="relative z-10 mt-3" onClick={exportAll}>
            <Download className="h-4.5 w-4.5" aria-hidden="true" />
            {t('exportWorkspaceMd')}
          </Button>
        )}
      </header>

      {hydrated && workspace.length === 0 ? (
        <EmptyState
          icon={<Pin className="h-9 w-9" aria-hidden="true" />}
          title={t('workspaceEmpty')}
          description={t('workspaceEmptyHint')}
        />
      ) : (
        <section className="space-y-3" aria-label={t('workspaceTitle')}>
          {workspace.map((item) => (
            <article key={item.id} className="card-lift rounded-3xl border border-outline-variant bg-surface-container p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="min-w-0 text-title-medium font-semibold text-on-surface">{item.title}</h2>
                <div className="flex shrink-0 gap-1">
                  {item.formulaId && (
                    <Link
                      href={`/formula/${item.formulaId}/`}
                      aria-label={item.title}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-primary"
                    >
                      <ArrowUpRight className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      deleteItem(item.id);
                      toast.success(t('deleted'));
                    }}
                    aria-label={t('delete')}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-error"
                  >
                    <Trash2 className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
              {Object.keys(item.values).length > 0 && (
                <dl className="mt-2 grid grid-cols-2 gap-1.5">
                  {Object.entries(item.values)
                    .slice(0, 6)
                    .map(([name, value]) => (
                      <div key={name} className="rounded-lg bg-surface-container-lowest/80 px-2.5 py-2">
                        <dt className="truncate text-label-small text-on-surface-variant" dir="ltr">{name}</dt>
                        <dd className="mono-result truncate text-label-large font-semibold text-on-surface">{fmt(value)}</dd>
                      </div>
                    ))}
                </dl>
              )}
              <textarea
                value={item.note}
                onChange={(event) => updateItem(item.id, { note: event.target.value })}
                placeholder={t('notePlaceholder')}
                rows={2}
                aria-label={t('notePlaceholder')}
                className="mt-3 w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-2.5 text-body-medium text-on-surface outline-none focus:border-primary"
              />
              <p className="mt-1.5 text-label-small text-on-surface-variant">
                {new Date(item.createdAt).toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-GB')}
              </p>
            </article>
          ))}
        </section>
      )}

      {hydrated && unpinned.length > 0 && (
        <section className="space-y-2" aria-label={t('history')}>
          <h2 className="text-title-large font-semibold text-on-surface">{t('recentFormulas')}</h2>
          <ul className="space-y-1.5">
            {unpinned.map((entry) => (
              <li key={entry.id} className="flex items-center gap-2 rounded-2xl border border-outline-variant bg-surface-container px-3 py-2.5">
                <span className="min-w-0 flex-1 truncate text-label-large text-on-surface">
                  {lang === 'fa' ? entry.name_fa : entry.name_en}
                </span>
                <button
                  type="button"
                  onClick={() => pin(entry)}
                  className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full bg-primary-container px-3 text-label-medium font-semibold text-on-primary-container"
                >
                  <Pin className="h-4 w-4" aria-hidden="true" />
                  {t('pinToWorkspace')}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
