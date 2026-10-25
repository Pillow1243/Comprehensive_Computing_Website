'use client';

import { forwardRef, useCallback, useState, type ButtonHTMLAttributes, type PointerEvent } from 'react';
import { cn, haptic } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

export type ButtonVariant =
  | 'filled'
  | 'tonal'
  | 'outlined'
  | 'text'
  | 'elevated'
  | 'fab'
  | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'state-layer relative inline-flex select-none items-center justify-center gap-2 rounded-full font-medium ' +
  'transition-[transform,background-color,box-shadow,color] duration-150 ease-emphasized ' +
  'disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97] ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ' +
  'tap-none min-h-touch';

const variants: Record<ButtonVariant, string> = {
  filled: 'bg-primary text-on-primary shadow-elevation-1 hover:shadow-elevation-2',
  tonal: 'bg-primary-container text-on-primary-container hover:shadow-elevation-1',
  outlined: 'border border-outline bg-transparent text-primary hover:bg-primary/10',
  text: 'bg-transparent text-primary hover:bg-primary/10',
  elevated: 'bg-surface-container-high text-primary shadow-elevation-1 hover:shadow-elevation-2',
  fab: 'bg-primary-container text-on-primary-container shadow-elevation-3 hover:shadow-elevation-4',
  danger: 'bg-error-container text-on-error-container hover:bg-error/25',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-10 px-4 text-label-large',
  md: 'h-12 px-6 text-label-large',
  lg: 'h-14 px-8 text-title-small',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  haptics?: boolean;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'filled',
    size = 'md',
    loading = false,
    fullWidth = false,
    haptics = true,
    children,
    onPointerDown,
    disabled,
    ...props
  },
  ref,
) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const hapticsEnabled = useAppStore((state) => state.settings.haptics);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (haptics) haptic(10, hapticsEnabled);
      const rect = event.currentTarget.getBoundingClientRect();
      const id = Date.now() + Math.random();
      setRipples((current) => [
        ...current.slice(-2),
        { id, x: event.clientX - rect.left, y: event.clientY - rect.top },
      ]);
      window.setTimeout(() => {
        setRipples((current) => current.filter((ripple) => ripple.id !== id));
      }, 520);
      onPointerDown?.(event);
    },
    [haptics, hapticsEnabled, onPointerDown],
  );

  return (
    <button
      ref={ref}
      type={props.type ?? 'button'}
      className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      onPointerDown={handlePointerDown}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          aria-hidden="true"
          className="pointer-events-none absolute h-24 w-24 rounded-full bg-current opacity-20"
          style={{
            left: ripple.x - 48,
            top: ripple.y - 48,
            animation: 'ripple 520ms cubic-bezier(0.2,0,0,1) forwards',
          }}
        />
      ))}
      {loading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      <span className={cn('inline-flex items-center gap-2', loading && 'opacity-90')}>{children}</span>
    </button>
  );
});

/** Shared classes for links that must look like buttons. */
export const buttonStyles = (variant: ButtonVariant = 'filled', size: ButtonSize = 'md', className?: string) =>
  cn(base, variants[variant], sizes[size], className);

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: 'standard' | 'filled' | 'tonal';
  size?: 'sm' | 'md' | 'lg';
}

const iconSizes = { sm: 'h-10 w-10', md: 'h-12 w-12', lg: 'h-14 w-14' };

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = 'standard', size = 'md', className, children, onPointerDown, ...props },
  ref,
) {
  const hapticsEnabled = useAppStore((state) => state.settings.haptics);
  return (
    <button
      ref={ref}
      type={props.type ?? 'button'}
      aria-label={label}
      title={label}
      onPointerDown={(event) => {
        haptic(8, hapticsEnabled);
        onPointerDown?.(event);
      }}
      className={cn(
        'state-layer tap-none inline-flex shrink-0 items-center justify-center rounded-full',
        'transition-transform duration-150 active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        iconSizes[size],
        variant === 'standard' && 'text-on-surface-variant',
        variant === 'filled' && 'bg-primary text-on-primary shadow-elevation-1',
        variant === 'tonal' && 'bg-surface-container-high text-on-surface',
        'disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
