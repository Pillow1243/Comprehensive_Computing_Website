'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn, haptic } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export function Chip({ selected = false, icon, children, className, onClick, ...props }: ChipProps) {
  const hapticsEnabled = useAppStore((state) => state.settings.haptics);
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={(event) => {
        haptic(8, hapticsEnabled);
        onClick?.(event);
      }}
      className={cn(
        'tap-none inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-label-large transition-colors duration-150',
        selected
          ? 'border-transparent bg-primary-container text-on-primary-container'
          : 'border-outline-variant bg-transparent text-on-surface-variant hover:bg-on-surface/5',
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
