'use client';

import { WifiOff } from 'lucide-react';
import { useNetwork } from '@/lib/network';
import { useI18n } from '@/lib/i18n';

export function OfflineBanner() {
  const { online } = useNetwork();
  const { t } = useI18n();

  if (online) return null;

  return (
    <div role="status" aria-live="polite" className="fixed inset-x-0 top-0 z-[55] safe-top">
      <div className="anim-slide-down mx-3 mt-2 flex items-center gap-2 rounded-full border border-outline-variant bg-tertiary-container px-4 py-2 text-on-tertiary-container shadow-elevation-2">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        <p className="truncate text-label-large">
          <span className="font-semibold">{t('offline')}</span>
          <span className="opacity-80"> — {t('offlineHint')}</span>
        </p>
      </div>
    </div>
  );
}
