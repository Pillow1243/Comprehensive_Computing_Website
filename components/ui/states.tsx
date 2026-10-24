'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { AlertTriangle, ArrowLeft, Home, RefreshCw, SearchX } from 'lucide-react';
import { Button, buttonStyles } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <div
        aria-hidden="true"
        className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-container-high text-on-surface-variant"
      >
        {icon ?? <SearchX className="h-9 w-9" strokeWidth={1.5} />}
      </div>
      <h2 className="text-title-medium text-on-surface">{title}</h2>
      {description && <p className="mt-2 max-w-xs text-body-medium text-on-surface-variant">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title,
  message,
  onRetry,
  showHome = true,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHome?: boolean;
  className?: string;
}) {
  const { t, isRtl } = useI18n();
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-10 text-center', className)}>
      <div
        aria-hidden="true"
        className="relative mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-error-container text-on-error-container"
      >
        <AlertTriangle className="h-10 w-10" strokeWidth={1.6} />
        <span className="absolute -bottom-1 -end-1 flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-secondary shadow-elevation-1">
          !
        </span>
      </div>
      <h2 className="text-title-medium text-on-surface">{title ?? t('errorTitle')}</h2>
      <p className="mt-2 max-w-sm text-body-medium text-on-surface-variant">{message ?? t('errorHint')}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {onRetry && (
          <Button variant="filled" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t('retry')}
          </Button>
        )}
        {showHome && (
          <Link href="/" className={buttonStyles('outlined')}>
            <Home className="h-4 w-4" aria-hidden="true" />
            {t('goHome')}
          </Link>
        )}
        <span className="sr-only" aria-live="polite">
          {title ?? t('errorTitle')}
        </span>
      </div>
      {isRtl && <ArrowLeft className="sr-only" aria-hidden="true" />}
    </div>
  );
}
