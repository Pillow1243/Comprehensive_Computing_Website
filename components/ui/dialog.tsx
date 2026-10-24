'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
  className?: string;
}

/**
 * Custom confirmation dialog — never `window.confirm` (requirement B13).
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onClose,
  children,
  className,
}: ConfirmDialogProps) {
  const { t } = useI18n();
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const timer = window.setTimeout(() => confirmRef.current?.focus(), 120);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(timer);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-5">
      <div className="anim-fade absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description ? 'dialog-description' : undefined}
        className={cn(
          'anim-scale-in relative w-full max-w-sm rounded-3xl border border-outline-variant bg-surface-container-high p-6 shadow-elevation-4',
          className,
        )}
      >
        <h2 id="dialog-title" className="text-title-large text-on-surface">
          {title}
        </h2>
        {description && (
          <p id="dialog-description" className="mt-2 text-body-medium text-on-surface-variant">
            {description}
          </p>
        )}
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="text" onClick={onClose}>
            {cancelLabel ?? t('cancel')}
          </Button>
          <Button
            ref={confirmRef}
            variant={destructive ? 'danger' : 'filled'}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel ?? t('delete')}
          </Button>
        </div>
      </div>
    </div>
  );
}
