'use client';

/**
 * A ~2 KB toast system that replaces `sonner` (10.5 KB gzip in the first-load
 * bundle). It keeps the same ergonomics — `toast.success/error/message` callable
 * from anywhere, including outside React — and renders with the Material 3
 * tokens so light/AMOLED themes stay in sync.
 *
 * Accessibility: a polite live region for confirmations, `role="alert"` for
 * failures, dismiss buttons with accessible names, and no focus stealing.
 */
import { useEffect, useState } from 'react';
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  duration?: number;
  action?: ToastAction;
  description?: string;
}

export interface ToastRecord extends ToastOptions {
  id: number;
  message: string;
  variant: ToastVariant;
  createdAt: number;
}

type Listener = (toasts: ToastRecord[]) => void;

const DEFAULT_DURATION = 3200;
const MAX_VISIBLE = 3;

let nextId = 1;
let toasts: ToastRecord[] = [];
const listeners = new Set<Listener>();

const emit = () => {
  for (const listener of listeners) listener(toasts);
};

const dismiss = (id: number) => {
  const next = toasts.filter((entry) => entry.id !== id);
  if (next.length === toasts.length) return;
  toasts = next;
  emit();
};

const push = (variant: ToastVariant, message: string, options: ToastOptions = {}) => {
  const record: ToastRecord = {
    id: nextId++,
    message,
    variant,
    createdAt: Date.now(),
    duration: options.duration ?? DEFAULT_DURATION,
    action: options.action,
    description: options.description,
  };
  // Keep the list bounded; the oldest toast falls off first.
  toasts = [...toasts, record].slice(-MAX_VISIBLE);
  emit();
  return record.id;
};

export const toast = {
  success: (message: string, options?: ToastOptions) => push('success', message, options),
  error: (message: string, options?: ToastOptions) => push('error', message, options),
  message: (message: string, options?: ToastOptions) => push('info', message, options),
  dismiss,
};

const icons: Record<ToastVariant, typeof Info> = {
  success: CheckCircle2,
  error: TriangleAlert,
  info: Info,
};

const accents: Record<ToastVariant, string> = {
  success: 'text-success',
  error: 'text-error',
  info: 'text-primary',
};

function ToastRow({ record, onDismiss }: { record: ToastRecord; onDismiss: (id: number) => void }) {
  const Icon = icons[record.variant];

  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(record.id), record.duration);
    return () => window.clearTimeout(timer);
  }, [record.id, record.duration, onDismiss]);

  return (
    <div
      role={record.variant === 'error' ? 'alert' : 'status'}
      className="pointer-events-auto flex w-full items-start gap-2.5 rounded-xl border border-outline-variant bg-surface-container-high px-3.5 py-3 shadow-elevation-3 anim-slide-down"
    >
      <Icon className={`mt-0.5 h-4.5 w-4.5 shrink-0 ${accents[record.variant]}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-title-small font-medium text-on-surface">{record.message}</p>
        {record.description && (
          <p className="mt-0.5 text-body-small text-on-surface-variant">{record.description}</p>
        )}
      </div>
      {record.action && (
        <button
          type="button"
          onClick={() => {
            record.action?.onClick();
            onDismiss(record.id);
          }}
          className="min-h-8 shrink-0 rounded-full bg-primary px-3 text-label-medium font-semibold text-on-primary"
        >
          {record.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={() => onDismiss(record.id)}
        aria-label="بستن"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-on-surface/10"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

/** Mount once (see `components/providers.tsx`). */
export function Toaster() {
  const [current, setCurrent] = useState<ToastRecord[]>(toasts);

  useEffect(() => {
    const listener: Listener = (list) => setCurrent([...list]);
    listeners.add(listener);
    listener(toasts);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (!current.length) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 top-[calc(3.5rem+var(--safe-top))] z-toast mx-auto flex max-w-md flex-col gap-2 px-3"
    >
      {current.map((record) => (
        <ToastRow key={record.id} record={record} onDismiss={dismiss} />
      ))}
    </div>
  );
}
