'use client';

import { forwardRef, useEffect, useState } from 'react';
import { TextField } from '@/components/ui/text-field';
import type { FormulaVariable } from '@/lib/formulas';
import { variableLabel } from '@/lib/formulas';
import { useI18n } from '@/lib/i18n';
import { useMediaQuery } from '@/lib/hooks';

export interface FormulaInputProps {
  variable: FormulaVariable;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  onFocus?: () => void;
  angleUnit?: 'deg' | 'rad';
  onAngleUnitChange?: (unit: 'deg' | 'rad') => void;
  /** When true the system keyboard stays closed; the math keyboard is used. */
  mathKeyboard?: boolean;
  helper?: string;
}

/**
 * One validated formula input.
 *
 * · numeric fields → `inputmode="decimal"` on pointer devices, `none` on touch
 *   so the in-app math keyboard owns input (requirement 2.5.3)
 * · text fields    → `inputmode="text"`, autocomplete off, spellcheck off
 * · angle fields    → ° / rad toggle, converted to degrees before computing
 */
export const FormulaInput = forwardRef<HTMLInputElement, FormulaInputProps>(function FormulaInput(
  { variable, value, onChange, error, onFocus, angleUnit, onAngleUnitChange, mathKeyboard, helper },
  ref,
) {
  const { lang, t } = useI18n();
  const isTouch = useMediaQuery('(pointer: coarse)');
  const [localUnit, setLocalUnit] = useState<'deg' | 'rad'>('deg');

  const unit = angleUnit ?? localUnit;
  const isAngle = variable.unit === 'angle';
  const isNumeric = variable.type === 'number';

  useEffect(() => {
    if (variable.default !== undefined && value === '') onChange(String(variable.default));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variable.name]);

  return (
    <TextField
      ref={ref}
      id={`input-${variable.name}`}
      name={variable.name}
      label={variableLabel(variable, lang)}
      value={value}
      onValueChange={onChange}
      error={error}
      helper={helper ?? (isAngle ? `${t('angle')}: ${unit === 'deg' ? t('degrees') : t('radians')}` : undefined)}
      numeric={isNumeric}
      unit={isAngle ? (unit === 'deg' ? '°' : 'rad') : variable.unit}
      inputMode={isNumeric && mathKeyboard && isTouch ? 'none' : undefined}
      onFocus={onFocus}
      autoCapitalize={isNumeric ? 'off' : 'sentences'}
      data-formula-input={variable.name}
      angleToggle={
        isAngle
          ? {
              unit,
              onChange: (next) => {
                setLocalUnit(next);
                onAngleUnitChange?.(next);
              },
            }
          : undefined
      }
    />
  );
});
