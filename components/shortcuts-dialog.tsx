'use client';

import { useEffect, useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import { OPEN_SHORTCUTS_EVENT } from '@/components/command-palette';
import { useI18n } from '@/lib/i18n';

/**
 * Keyboard-shortcuts cheat sheet (v4.1). Opens with "?" anywhere outside a
 * text field, from the command palette, or from Settings (custom event).
 */
export function ShortcutsDialog() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        Boolean(target?.isContentEditable);
      if (typing) return;
      if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setOpen((value) => !value);
      } else if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_SHORTCUTS_EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_SHORTCUTS_EVENT, onOpen);
    };
  }, []);

  if (!open) return null;

  const rows: Array<{ keys: string[]; label: string }> = [
    { keys: ['Ctrl', 'K'], label: t('shortcutOpenPalette') },
    { keys: ['⌘', 'K'], label: t('shortcutOpenPalette') },
    { keys: ['?'], label: t('shortcutHelp') },
    { keys: ['Esc'], label: t('shortcutClose') },
  ];

  return (
    <div role="dialog" aria-modal="true" aria-label={t('keyboardShortcuts')} className="fixed inset-0 z-modal px-3">
      <button
        type="button"
        aria-label={t('shortcutClose')}
        onClick={() => setOpen(false)}
        className="anim-fade absolute inset-0 h-full w-full cursor-default bg-scrim/70 backdrop-blur-sm"
      />
      <div className="anim-scale-in glass-card relative mx-auto mt-[16dvh] w-full max-w-sm rounded-3xl p-5 shadow-elevation-5">
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t('shortcutClose')}
          className="absolute end-2 top-2 flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-on-surface/10"
        >
          <X className="h-4.5 w-4.5" aria-hidden="true" />
        </button>
        <h2 className="flex items-center gap-2 text-title-large font-bold text-on-surface">
          <Keyboard className="h-5 w-5 text-primary" aria-hidden="true" />
          {t('keyboardShortcuts')}
        </h2>
        <dl className="mt-4 space-y-3">
          {rows.map((row, index) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <dt className="text-body-medium text-on-surface-variant">{row.label}</dt>
              <dd className="flex items-center gap-1" dir="ltr">
                {row.keys.map((key) => (
                  <kbd key={key} className="key-cap">
                    {key}
                  </kbd>
                ))}
              </dd>
            </div>
          ))}
        </dl>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-5 w-full rounded-full brand-gradient py-2.5 text-label-large font-semibold text-white shadow-glow"
        >
          {t('dismiss')}
        </button>
      </div>
    </div>
  );
}
