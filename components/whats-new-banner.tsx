'use client';

import Link from 'next/link';
import { PartyPopper, X } from 'lucide-react';
import { APP_VERSION } from '@/lib/version';
import { useI18n } from '@/lib/i18n';
import { useAppStore, useHydrated } from '@/lib/store';

/**
 * One-shot "what's new" card (v4.1): appears on the home screen the first
 * time a new app version runs, then dismisses itself into the store.
 */
export function WhatsNewBanner() {
  const { t } = useI18n();
  const hydrated = useHydrated();
  const seen = useAppStore((state) => state.whatsNewSeen);
  const markSeen = useAppStore((state) => state.markWhatsNewSeen);

  if (!hydrated || seen === APP_VERSION) return null;

  return (
    <section
      aria-label={t('whatsNew')}
      className="anim-fade-up gradient-border shine relative rounded-3xl p-4"
    >
      <button
        type="button"
        onClick={() => markSeen(APP_VERSION)}
        aria-label={t('dismiss')}
        className="absolute end-2 top-2 flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-on-surface/10"
      >
        <X className="h-4.5 w-4.5" aria-hidden="true" />
      </button>
      <div className="flex items-start gap-3 pe-6">
        <span className="icon-bubble anim-float h-11 w-11 shrink-0">
          <PartyPopper className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-title-medium font-bold text-on-surface">
            {t('whatsNewV41Title')}
            <span className="rounded-full brand-gradient px-2 py-0.5 text-label-small font-bold text-white">
              {APP_VERSION}
            </span>
          </p>
          <p className="mt-1 text-body-small leading-relaxed text-on-surface-variant">
            {t('whatsNewV41Body')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/tools/"
              onClick={() => markSeen(APP_VERSION)}
              className="inline-flex min-h-10 items-center rounded-full brand-gradient px-4 text-label-large font-semibold text-white shadow-glow"
            >
              {t('exploreNew')}
            </Link>
            <button
              type="button"
              onClick={() => markSeen(APP_VERSION)}
              className="inline-flex min-h-10 items-center rounded-full border border-outline-variant px-4 text-label-large text-on-surface"
            >
              {t('dismiss')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
