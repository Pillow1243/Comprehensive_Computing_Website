'use client';

import { Search, X } from 'lucide-react';
import { useEffect, useRef, type FormEvent } from 'react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

export interface SearchFieldProps {
  value: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  showClear?: boolean;
}

/**
 * Search input with the correct Android keyboard ergonomics:
 * `inputmode="search"`, no autocomplete/autocorrect, 48 px touch target.
 */
export function SearchField({
  value,
  onChange,
  onSubmit,
  placeholder,
  autoFocus = false,
  className,
  showClear = true,
}: SearchFieldProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!autoFocus) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 180);
    return () => window.clearTimeout(timer);
  }, [autoFocus]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit?.(value);
    inputRef.current?.blur();
  };

  return (
    <form role="search" onSubmit={handleSubmit} className={cn('w-full', className)}>
      <div className="flex h-14 items-center gap-2 rounded-full bg-surface-container-high px-4 transition-shadow focus-within:shadow-glow">
        <Search className="h-5 w-5 shrink-0 text-on-surface-variant" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder ?? t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="h-full min-w-0 flex-1 bg-transparent text-body-large text-on-surface outline-none placeholder:text-on-surface-variant/70 [&::-webkit-search-cancel-button]:hidden"
        />
        {showClear && value && (
          <button
            type="button"
            aria-label={t('clearSearch')}
            onClick={() => {
              onChange?.('');
              inputRef.current?.focus();
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-on-surface/10"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </form>
  );
}
