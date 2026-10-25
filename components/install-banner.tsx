'use client';

import { Download, Smartphone, X } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useInstall } from '@/lib/install';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

/**
 * Custom install prompt (requirement 2.12) — no browser banners, no alert().
 */
export function InstallBanner() {
  const { available, installed, isIos, promptInstall, dismiss, dismissed } = useInstall();
  const { t } = useI18n();

  if (installed || dismissed) return null;
  if (!available && !isIos) return null;

  return (
    <section
      aria-label={t('installTitle')}
      className="relative overflow-hidden rounded-2xl border border-outline-variant bg-gradient-to-br from-primary-container/60 to-surface-container-high p-4"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-elevation-2">
          <Smartphone className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-title-small font-semibold text-on-surface">{t('installTitle')}</h2>
          <p className="mt-1 text-body-small text-on-surface-variant">
            {isIos ? t('iosInstallHint') : t('installHint')}
          </p>
          <div className="mt-3 flex gap-2">
            {available && (
              <Button
                size="sm"
                onClick={async () => {
                  const outcome = await promptInstall();
                  if (outcome === 'accepted') toast.success(t('installed'));
                  else if (outcome === 'unavailable') toast.message(t('installUnavailable'));
                }}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                {t('installApp')}
              </Button>
            )}
            <Button size="sm" variant="text" onClick={dismiss}>
              {t('later')}
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t('close')}
          className="-me-2 -mt-2 flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant hover:bg-on-surface/10"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
