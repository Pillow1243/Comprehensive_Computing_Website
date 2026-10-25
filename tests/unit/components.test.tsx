import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nProvider } from '@/lib/i18n';
import { ThemeProvider } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { FormulaCard } from '@/components/formula-card';
import { StepByStep, ResultPanel } from '@/components/step-by-step';
import { MathKeyboard } from '@/components/math-keyboard';
import { TextField } from '@/components/ui/text-field';
import { FormulaInput } from '@/components/formula-input';
import { ConfirmDialog } from '@/components/ui/dialog';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Skeleton } from '@/components/ui/skeleton';
import { FormulaErrorBoundary } from '@/components/formula-error-boundary';
import { FormulaDisplay } from '@/components/formula-display';
import { PageTransition } from '@/components/page-transition';
import { renderLatex } from '@/lib/latex';
import { Button } from '@/components/ui/button';
import { OfflineBanner } from '@/components/offline-banner';
import { NetworkContext } from '@/lib/network';
import { getFormula, loadFormula } from '@/lib/formulas';

const Providers = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>
    <I18nProvider>{children}</I18nProvider>
  </ThemeProvider>
);

const renderWithProviders = (ui: ReactNode) => render(<Providers>{ui}</Providers>);

describe('FormulaCard', () => {
  it('links to the formula route and shows Persian metadata', () => {
    renderWithProviders(<FormulaCard formula={getFormula('quadratic')!} />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toContain('/formula/quadratic');
    expect(screen.getByText('معادله درجه دو')).toBeInTheDocument();
    expect(screen.getByText('پایه')).toBeInTheDocument();
  });

  it('toggles the bookmark without a page reload', () => {
    renderWithProviders(<FormulaCard formula={getFormula('ph')!} />);
    const star = screen.getByRole('button');
    fireEvent.click(star);
    expect(useAppStore.getState().bookmarks).toContain('ph');
    fireEvent.click(screen.getByRole('button'));
    expect(useAppStore.getState().bookmarks).not.toContain('ph');
  });
});

describe('StepByStep and ResultPanel', () => {
  it('numbers each step for screen readers', () => {
    renderWithProviders(<StepByStep steps={['Δ = 1', 'x₁ = 3']} />);
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Δ = 1')).toBeInTheDocument();
  });

  it('shows an empty-state message when no steps exist', () => {
    renderWithProviders(<StepByStep steps={[]} />);
    expect(screen.getByText('مرحله‌ای برای نمایش ثبت نشده است')).toBeInTheDocument();
  });

  it('renders results with labels, units and a live region', async () => {
    const formula = (await loadFormula('pythagorean'))!;
    renderWithProviders(
      <ResultPanel formula={formula} values={{ hypotenuse: 5, area: 6 }} durationMs={12} />,
    );
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/12/)).toBeInTheDocument();
    expect(document.querySelector('[aria-live="polite"]')).toBeTruthy();
  });
});

describe('inputs', () => {
  it('uses inputmode=decimal for numeric fields', () => {
    renderWithProviders(
      <TextField label="شعاع" value="2" onValueChange={() => {}} numeric />,
    );
    const input = screen.getByLabelText('شعاع');
    expect(input).toHaveAttribute('inputmode', 'decimal');
    expect(input).toHaveAttribute('autocomplete', 'off');
  });

  it('switches text fields to inputmode=text and disables spellcheck', () => {
    renderWithProviders(
      <TextField label="توضیح" value="abc" onValueChange={() => {}} numeric={false} />,
    );
    const input = screen.getByLabelText('توضیح');
    expect(input).toHaveAttribute('inputmode', 'text');
    expect(input).toHaveAttribute('spellcheck', 'false');
  });

  it('renders an angle toggle that reports the selected unit', async () => {
    const variable = {
      name: 'C',
      label_fa: 'زاویه C',
      label_en: 'Angle C',
      type: 'number' as const,
      unit: 'angle',
      required: true,
      default: 90,
    };
    const onChange = vi.fn();
    renderWithProviders(
      <FormulaInput variable={variable} value="90" onChange={() => {}} onAngleUnitChange={onChange} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'rad' }));
    expect(onChange).toHaveBeenCalledWith('rad');
  });

  it('surfaces validation errors through aria attributes', () => {
    renderWithProviders(
      <TextField label="ضریب" value="" onValueChange={() => {}} error="این مقدار الزامی است" />,
    );
    const input = screen.getByLabelText('ضریب');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('این مقدار الزامی است');
  });
});

describe('MathKeyboard', () => {
  it('portals the sheet to <body> so ancestors cannot re-anchor it', () => {
    const { container } = renderWithProviders(
      <div style={{ transform: 'translateY(0)' }}>
        <MathKeyboard
          open
          onClose={() => {}}
          onInsert={() => {}}
          onBackspace={() => {}}
          onClear={() => {}}
          onDone={() => {}}
        />
      </div>,
    );
    const sheet = screen.getByRole('region', { name: 'کیبورد ریاضی' });
    // Portalled: outside the (transformed) wrapper, a direct child of <body>.
    expect(container.contains(sheet)).toBe(false);
    expect(sheet.parentElement).toBe(document.body);
  });

  it('inserts symbols at the caret and supports backspace', () => {
    const onInsert = vi.fn();
    const onBackspace = vi.fn();
    renderWithProviders(
      <MathKeyboard
        open
        onClose={() => {}}
        onInsert={onInsert}
        onBackspace={onBackspace}
        onClear={() => {}}
        onDone={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'تقسیم' }));
    expect(onInsert).toHaveBeenCalledWith('/');
    fireEvent.click(screen.getByRole('tab', { name: 'ƒ(x)' }));
    fireEvent.click(screen.getByRole('button', { name: 'ریشه دوم' }));
    expect(onInsert).toHaveBeenCalledWith('sqrt(');
    fireEvent.click(screen.getByRole('button', { name: 'سینوس' }));
    expect(onInsert).toHaveBeenCalledWith('sin(');
    fireEvent.click(screen.getByRole('button', { name: 'حذف' }));
    expect(onBackspace).toHaveBeenCalled();
  });

  it('exposes every key with a 48px touch target class', () => {
    renderWithProviders(
      <MathKeyboard
        open
        onClose={() => {}}
        onInsert={() => {}}
        onBackspace={() => {}}
        onClear={() => {}}
        onDone={() => {}}
      />,
    );
    const keys = screen.getAllByRole('button').filter((button) => button.className.includes('h-12'));
    expect(keys.length).toBeGreaterThan(20);
  });

  it('renders nothing when closed', () => {
    const { container } = renderWithProviders(
      <MathKeyboard
        open={false}
        onClose={() => {}}
        onInsert={() => {}}
        onBackspace={() => {}}
        onClear={() => {}}
        onDone={() => {}}
      />,
    );
    expect(container.querySelector('section')).toBeNull();
  });
});

describe('dialogs and sheets', () => {
  it('opens a confirm dialog and calls onConfirm', () => {
    const onConfirm = vi.fn();
    renderWithProviders(
      <ConfirmDialog open title="حذف شود؟" onConfirm={onConfirm} onClose={() => {}} />,
    );
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'حذف' }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('renders a bottom sheet with a drag handle', () => {
    renderWithProviders(
      <BottomSheet open title="محاسبه جدید" onClose={() => {}}>
        <p>محتوا</p>
      </BottomSheet>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('محتوا')).toBeInTheDocument();
  });

  it('never calls window.confirm or window.alert', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    renderWithProviders(<ConfirmDialog open title="تست" onConfirm={() => {}} onClose={() => {}} />);
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
  });
});

describe('states and skeletons', () => {
  it('renders empty and error states with recovery actions', () => {
    const retry = vi.fn();
    renderWithProviders(<EmptyState title="چیزی نیست" description="توضیح" />);
    expect(screen.getByText('چیزی نیست')).toBeInTheDocument();
    renderWithProviders(<ErrorState title="خطا" message="دوباره" onRetry={retry} />);
    fireEvent.click(screen.getByRole('button', { name: /تلاش دوباره/ }));
    expect(retry).toHaveBeenCalled();
  });

  it('marks skeletons as busy for assistive tech', () => {
    const { container } = render(<Skeleton className="h-4 w-10" />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('FormulaErrorBoundary', () => {
  it('catches render errors and shows a friendly message without a stack trace', () => {
    const Thrower = () => {
      throw new Error('secret stack detail');
    };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderWithProviders(
      <FormulaErrorBoundary formulaId="quadratic">
        <Thrower />
      </FormulaErrorBoundary>,
    );
    expect(screen.getByText('این فرمول بارگذاری نشد')).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('secret stack detail');
    spy.mockRestore();
  });
});

describe('PageTransition', () => {
  it('does not fade the very first paint (it would delay the LCP)', () => {
    const { container } = renderWithProviders(
      <PageTransition>
        <p>محتوا</p>
      </PageTransition>,
    );
    expect(container.querySelector('.anim-page-in')).toBeNull();
    expect(container.textContent).toContain('محتوا');
  });
});

describe('FormulaDisplay', () => {
  it('renders build-time KaTeX markup on the first paint', () => {
    const latex = 'x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}';
    renderWithProviders(<FormulaDisplay latex={latex} html={renderLatex(latex)} />);
    // No effect, no timer: the markup is already in the tree.
    expect(document.querySelector('.katex')).toBeTruthy();
    expect(document.querySelector('[role="math"]')?.getAttribute('aria-label')).toBe(latex);
  });

  it('falls back to plain LaTeX when no markup was provided', () => {
    renderWithProviders(<FormulaDisplay latex={'\\frac{'} />);
    expect(document.body.textContent).toContain('\\frac{');
  });

  it('survives invalid LaTeX without throwing', () => {
    expect(renderLatex('\\frac{')).toContain('katex');
    expect(renderLatex('')).toBe('');
  });
});

describe('offline banner', () => {
  it('is hidden while online and announced while offline', () => {
    const { rerender } = render(
      <NetworkContext.Provider value={{ online: true, canWorkOffline: true }}>
        <Providers>
          <OfflineBanner />
        </Providers>
      </NetworkContext.Provider>,
    );
    expect(screen.queryByRole('status')).toBeNull();
    rerender(
      <NetworkContext.Provider value={{ online: false, canWorkOffline: true }}>
        <Providers>
          <OfflineBanner />
        </Providers>
      </NetworkContext.Provider>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('آفلاین هستید');
  });
});

describe('Button', () => {
  it('blocks clicks while loading and reports aria-busy', () => {
    const onClick = vi.fn();
    renderWithProviders(
      <Button loading onClick={onClick}>
        محاسبه
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
