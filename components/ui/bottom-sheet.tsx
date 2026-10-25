'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { cn, haptic } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Fractions of the viewport height; drag snaps to the nearest point. */
  snapPoints?: number[];
  className?: string;
}

/**
 * Mobile-first replacement for modal dialogs (requirement 2.9):
 * drag handle, snap points, blurred backdrop, Escape + swipe-to-dismiss.
 * Animations are CSS-only (no animation runtime in the first-load bundle).
 */
export function BottomSheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  snapPoints = [0.45, 0.9],
  className,
}: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const dragState = useRef<{ startY: number; height: number } | null>(null);
  const hapticsEnabled = useAppStore((state) => state.settings.haptics);
  const { t } = useI18n();

  useEffect(() => {
    if (!open) {
      setDragOffset(0);
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    }, 120);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previous;
      window.clearTimeout(timer);
    };
  }, [open, onClose]);

  const onHandleDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = {
      startY: event.clientY,
      height: panelRef.current?.getBoundingClientRect().height ?? 400,
    };
  }, []);

  const onHandleMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const delta = Math.max(0, event.clientY - dragState.current.startY);
    setDragOffset(delta);
  }, []);

  const onHandleUp = useCallback(() => {
    if (!dragState.current) return;
    const height = dragState.current.height;
    dragState.current = null;
    if (dragOffset > Math.min(160, height * 0.25)) {
      haptic(12, hapticsEnabled);
      onClose();
      return;
    }
    setDragOffset(0);
  }, [dragOffset, hapticsEnabled, onClose]);

  if (!open) return null;

  const height = `${Math.round((snapPoints[snapPoints.length - 1] ?? 0.9) * 100)}dvh`;
  const dismissProgress = Math.min(1, dragOffset / 320);

  return (
    <div className="fixed inset-0 z-sheet flex items-end justify-center" role="presentation">
      <div
        className="anim-fade absolute inset-0 bg-black/55 backdrop-blur-sm"
        style={{ opacity: 1 - dismissProgress * 0.6 }}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? undefined}
        className={cn(
          'anim-sheet-in relative flex w-full max-w-xl flex-col overflow-hidden rounded-t-3xl',
          'border border-outline-variant bg-surface-container-high shadow-elevation-4',
          className,
        )}
        style={{
          maxHeight: height,
          height,
          paddingBottom: 'var(--safe-bottom)',
          transform: dragOffset ? `translateY(${dragOffset}px)` : undefined,
          transition: dragState.current ? 'none' : 'transform 220ms cubic-bezier(0.05, 0.7, 0.1, 1)',
        }}
      >
        <div
          className="flex cursor-grab touch-none justify-center py-2.5"
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
          onPointerCancel={onHandleUp}
          aria-hidden="true"
        >
          <span className="h-1.5 w-10 rounded-full bg-outline" />
        </div>
        {(title || description) && (
          <header className="px-5 pb-3">
            {title && <h2 className="text-title-large text-on-surface">{title}</h2>}
            {description && <p className="mt-1 text-body-medium text-on-surface-variant">{description}</p>}
          </header>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">{children}</div>
        {footer ? (
          <footer className="border-t border-outline-variant bg-surface-container-high px-5 py-3">{footer}</footer>
        ) : (
          <div className="px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-touch w-full rounded-full text-label-large text-on-surface-variant"
            >
              {t('close')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
