'use client';

import { useEffect, useRef, useState } from 'react';
import { Copy, Maximize2, X } from 'lucide-react';
import { toast } from '@/lib/toast';
import { cn, copyToClipboard } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

export interface FormulaDisplayProps {
  latex: string;
  /**
   * KaTeX markup rendered at build time (see `lib/latex.ts`). When present the
   * formula is part of the first paint and the browser never downloads KaTeX.
   */
  html?: string;
  displayMode?: boolean;
  className?: string;
  /** Hide the copy/expand chrome for dense lists. */
  compact?: boolean;
}

/**
 * Formula surface with the mobile overflow problem solved (requirement 2.6):
 * horizontal scroll with snap, a full-screen expander for long formulas, and
 * long-press-to-copy. LaTeX itself always stays LTR.
 *
 * The markup is rendered at build time and passed in, so this component only
 * adds the interaction chrome and never pulls a math renderer into the bundle.
 */
export function FormulaDisplay({
  latex,
  html: prerenderedHtml,
  displayMode = true,
  className,
  compact = false,
}: FormulaDisplayProps) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pages that statically export their formulas pass the build-time markup in;
  // nothing else needs KaTeX, so the renderer is not imported at all any more.
  const html = prerenderedHtml || null;

  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setExpanded(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [expanded]);

  const copyLatex = async () => {
    const ok = await copyToClipboard(latex);
    if (ok) toast.success(t('copiedToClipboard'));
    else toast.error(t('copy'));
  };

  if (!html) {
    return (
      <pre
        dir="ltr"
        className={cn(
          'formula-scroll rounded-lg bg-surface-container p-3 font-mono text-body-small text-on-surface',
          className,
        )}
      >
        {latex}
      </pre>
    );
  }

  return (
    <div className={cn('group relative', className)}>
      <div
        dir="ltr"
        role="math"
        aria-label={latex}
        className={cn(
          'formula-scroll relative rounded-xl bg-surface-container-high px-4 py-3 text-on-surface',
          displayMode ? 'text-center' : 'text-start',
        )}
        onPointerDown={() => {
          pressTimer.current = setTimeout(() => {
            void copyLatex();
          }, 550);
        }}
        onPointerUp={() => {
          if (pressTimer.current) clearTimeout(pressTimer.current);
        }}
        onPointerLeave={() => {
          if (pressTimer.current) clearTimeout(pressTimer.current);
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          void copyLatex();
        }}
        title={t('longPressCopy')}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {!compact && (
        <div className="absolute end-1 top-1 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <button
            type="button"
            onClick={() => void copyLatex()}
            aria-label={t('copyLatex')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-highest/90 text-on-surface-variant backdrop-blur"
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label={t('fullscreen')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-highest/90 text-on-surface-variant backdrop-blur"
          >
            <Maximize2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {expanded && (
          <div
            className="anim-fade fixed inset-0 z-modal flex flex-col bg-surface/95 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-label={t('formula')}
          >
            <div className="safe-top flex items-center justify-between px-3 py-2">
              <span className="text-label-large text-on-surface-variant">{t('formula')}</span>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label={t('close')}
                className="flex h-12 w-12 items-center justify-center rounded-full text-on-surface"
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="flex flex-1 items-center justify-center overflow-auto p-4">
              <div
                dir="ltr"
                className="formula-scroll max-w-full rounded-2xl bg-surface-container-high p-6 text-on-surface [&_.katex]:text-3xl"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          </div>
        )}
    </div>
  );
}
