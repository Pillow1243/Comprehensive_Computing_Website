'use client';

import { useEffect } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button, buttonStyles } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { reportError } from '@/lib/telemetry';

/**
 * Shared route-level error UI (requirement B07).
 * Never renders a stack trace — only a reference id and a recovery path.
 */
export function RouteError({
  error,
  reset,
  scope = 'route',
}: {
  error: Error & { digest?: string };
  reset: () => void;
  scope?: string;
}) {
  const { t } = useI18n();

  useEffect(() => {
    reportError(error, { scope, digest: error.digest });
  }, [error, scope]);

  return (
    <div className="flex flex-col items-center px-6 py-14 text-center" role="alert">
      <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-error-container text-on-error-container">
        <AlertTriangle className="h-10 w-10" strokeWidth={1.6} aria-hidden="true" />
      </div>
      <h1 className="text-title-large text-on-surface">{t('errorTitle')}</h1>
      <p className="mt-2 max-w-sm text-body-medium text-on-surface-variant">{t('errorHint')}</p>
      {error.digest && (
        <p className="mt-3 rounded-full bg-surface-container-high px-3 py-1 font-mono text-label-small text-on-surface-variant">
          ref: {error.digest}
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={reset}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {t('retry')}
        </Button>
        <Link href="/" className={buttonStyles('outlined')}>
          <Home className="h-4 w-4" aria-hidden="true" />
          {t('goHome')}
        </Link>
      </div>
    </div>
  );
}
