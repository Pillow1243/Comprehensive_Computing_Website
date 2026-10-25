import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nProvider } from '@/lib/i18n';
import { ThemeProvider } from '@/lib/theme';
import { ToolCard } from '@/components/tool-card';
import { FormulaDescription } from '@/components/formula-description';
import { TOOLS } from '@/lib/tools';
import { getFormula } from '@/lib/formulas';
import { useAppStore } from '@/lib/store';

const Providers = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>
    <I18nProvider>{children}</I18nProvider>
  </ThemeProvider>
);

const renderWithProviders = (ui: ReactNode) => render(<Providers>{ui}</Providers>);

describe('ToolCard', () => {
  it('links to the tool route and renders Persian copy by default', () => {
    renderWithProviders(<ToolCard tool={TOOLS[0]} />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toContain('/tools/units');
    expect(screen.getByText('تبدیل یکا')).toBeInTheDocument();
    expect(screen.getAllByText(/یکا/).length).toBeGreaterThan(0);
  });

  it('renders the compact variant with the same destination', () => {
    renderWithProviders(<ToolCard tool={TOOLS[2]} compact />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toContain('/periodic-table');
    expect(screen.getByText('جدول تناوبی')).toBeInTheDocument();
  });

  it('switches to English copy', () => {
    useAppStore.setState({ settings: { ...useAppStore.getState().settings, language: 'en' } });
    renderWithProviders(<ToolCard tool={TOOLS[1]} />);
    expect(screen.getByText('Molar mass')).toBeInTheDocument();
    useAppStore.setState({ settings: { ...useAppStore.getState().settings, language: 'fa' } });
  });
});

describe('FormulaDescription', () => {
  it('loads the Persian summary lazily', async () => {
    const formula = getFormula('quadratic')!;
    renderWithProviders(<FormulaDescription formula={formula} />);
    await waitFor(() => {
      expect(screen.getByText(/درجه دو|دلتا/)).toBeInTheDocument();
    });
  });

  it('renders a generated English summary instead of Persian prose', () => {
    useAppStore.setState({ settings: { ...useAppStore.getState().settings, language: 'en' } });
    const formula = getFormula('pythagorean')!;
    renderWithProviders(<FormulaDescription formula={formula} />);
    expect(screen.getByText(/step-by-step Pythagorean/i)).toBeInTheDocument();
    useAppStore.setState({ settings: { ...useAppStore.getState().settings, language: 'fa' } });
  });
});
