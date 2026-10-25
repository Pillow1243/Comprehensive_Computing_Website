'use client';

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn, haptic } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
  helper?: string;
  unit?: string | null;
  suffix?: ReactNode;
  numeric?: boolean;
  /** Shown as a trailing toggle, e.g. ° / rad for angles. */
  angleToggle?: { unit: 'deg' | 'rad'; onChange: (unit: 'deg' | 'rad') => void };
  containerClassName?: string;
}

/**
 * M3 outlined text field.
 * `inputMode` defaults to `decimal` for numbers and `text` for everything else
 * (requirement B20); text fields disable autocorrect/autocomplete and spellcheck.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    label,
    value,
    onValueChange,
    error,
    helper,
    unit,
    suffix,
    numeric = true,
    angleToggle,
    containerClassName,
    className,
    id,
    inputMode,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? `field-${generatedId}`;
  const helpId = `${fieldId}-help`;
  const hapticsEnabled = useAppStore((state) => state.settings.haptics);
  const hasError = Boolean(error);

  return (
    <div className={cn('w-full', containerClassName)}>
      <div
        className={cn(
          'group relative rounded-lg border bg-surface-container-lowest transition-colors duration-150',
          hasError ? 'border-error' : 'border-outline-variant focus-within:border-primary',
          'focus-within:ring-1 focus-within:ring-primary',
        )}
      >
        <label
          htmlFor={fieldId}
          className={cn(
            'pointer-events-none absolute start-3 top-2 z-10 bg-surface-container-lowest px-1 text-label-medium',
            hasError ? 'text-error' : 'text-on-surface-variant group-focus-within:text-primary',
          )}
        >
          {label}
        </label>
        <div className="flex items-center gap-1 ps-3 pe-1">
          <input
            ref={ref}
            id={fieldId}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            inputMode={inputMode ?? (numeric ? 'decimal' : 'text')}
            autoComplete={numeric ? 'off' : 'off'}
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
            aria-invalid={hasError || undefined}
            aria-describedby={error || helper ? helpId : undefined}
            dir={numeric ? 'ltr' : undefined}
            className={cn(
              'tnum h-14 w-full min-w-0 bg-transparent pt-3.5 pb-1.5 text-body-large text-on-surface outline-none',
              'placeholder:text-on-surface-variant/60',
              numeric && 'text-start font-latin',
              className,
            )}
            {...props}
          />
          {unit && (
            <span className="shrink-0 pe-1 text-body-small text-on-surface-variant" aria-hidden="true">
              {unit}
            </span>
          )}
          {angleToggle ? (
            <div className="mb-0.5 flex shrink-0 rounded-full bg-surface-container p-0.5" role="group" aria-label="Angle unit">
              {(['deg', 'rad'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    haptic(8, hapticsEnabled);
                    angleToggle.onChange(mode);
                  }}
                  aria-pressed={angleToggle.unit === mode}
                  className={cn(
                    'h-8 min-w-11 rounded-full px-2 text-label-medium transition-colors',
                    angleToggle.unit === mode
                      ? 'bg-primary text-on-primary'
                      : 'text-on-surface-variant',
                  )}
                >
                  {mode === 'deg' ? '°' : 'rad'}
                </button>
              ))}
            </div>
          ) : (
            suffix
          )}
        </div>
      </div>
      {(error || helper) && (
        <p
          id={helpId}
          className={cn('mt-1.5 px-1 text-body-small', hasError ? 'text-error' : 'text-on-surface-variant')}
          role={hasError ? 'alert' : undefined}
        >
          {error ?? helper}
        </p>
      )}
    </div>
  );
});
