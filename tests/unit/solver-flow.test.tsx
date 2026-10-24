import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ThemeProvider } from '@/lib/theme';
import { I18nProvider } from '@/lib/i18n';
import { loadFormula } from '@/lib/formulas';
import { useAppStore } from '@/lib/store';
import { FormulaSolver } from '@/components/formula-solver';

/**
 * End-to-end component test of the solver without a browser:
 * Worker is unavailable in jsdom, so the client falls back to the local
 * registry — exactly the degraded path a blocked worker takes in production.
 */

const renderSolver = async (id: string) => {
  const formula = (await loadFormula(id))!;
  render(
    <ThemeProvider>
      <I18nProvider>
        <FormulaSolver formula={formula} />
      </I18nProvider>
    </ThemeProvider>,
  );
  return formula;
};

describe('FormulaSolver flow', () => {
  beforeEach(() => {
    useAppStore.setState({ history: [], recent: [], bookmarks: [] });
  });

  it('computes, shows results and records history', async () => {
    await renderSolver('quadratic');

    // Defaults are prefilled from the manifest
    expect((screen.getByLabelText('ضریب a') as HTMLInputElement).value).toBe('1');
    expect((screen.getByLabelText('ضریب b') as HTMLInputElement).value).toBe('-5');
    expect((screen.getByLabelText('ضریب c') as HTMLInputElement).value).toBe('6');

    const computeButtons = screen.getAllByRole('button', { name: /^محاسبه$|^در حال محاسبه…$/ });
    await act(async () => {
      fireEvent.click(computeButtons[computeButtons.length - 1]);
    });

    await waitFor(() => expect(screen.getByText('نتایج')).toBeInTheDocument(), { timeout: 8000 });
    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument());

    const history = useAppStore.getState().history;
    expect(history).toHaveLength(1);
    expect(history[0].formulaId).toBe('quadratic');
    expect(history[0].values).toMatchObject({ x1: 3, x2: 2, discriminant: 1 });
    expect(useAppStore.getState().recent[0]).toBe('quadratic');
  }, 20_000);

  it('blocks computation and explains invalid input', async () => {
    await renderSolver('quadratic');
    const a = screen.getByLabelText('ضریب a');
    await act(async () => {
      fireEvent.change(a, { target: { value: 'abc' } });
    });
    const computeButtons = screen.getAllByRole('button', { name: /^محاسبه$/ });
    await act(async () => {
      fireEvent.click(computeButtons[computeButtons.length - 1]);
    });
    await waitFor(() => expect(screen.getByText(/عدد معتبر وارد کنید/)).toBeInTheDocument());
    expect(useAppStore.getState().history).toHaveLength(0);
  }, 20_000);

  it('rejects inputs outside the declared domain', async () => {
    await renderSolver('polygon');
    const sides = screen.getByLabelText('تعداد اضلاع n');
    await act(async () => {
      fireEvent.change(sides, { target: { value: '1' } });
    });
    const computeButtons = screen.getAllByRole('button', { name: /^محاسبه$/ });
    await act(async () => {
      fireEvent.click(computeButtons[computeButtons.length - 1]);
    });
    await waitFor(() => expect(screen.getByText(/محدوده/)).toBeInTheDocument());
  }, 20_000);

  it('shows step-by-step content after computing', async () => {
    await renderSolver('pythagorean');
    const computeButtons = screen.getAllByRole('button', { name: /^محاسبه$/ });
    await act(async () => {
      fireEvent.click(computeButtons[computeButtons.length - 1]);
    });
    await waitFor(() => expect(screen.getByText('نتایج')).toBeInTheDocument(), { timeout: 8000 });
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'مراحل' }));
    });
    await waitFor(() => expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0));
    expect(screen.getByText(/c = √/)).toBeInTheDocument();
  }, 20_000);

  it('loads an example into the inputs', async () => {
    await renderSolver('heron');
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'مثال' }));
    });
    const example = screen.getByRole('button', { name: /مثال 1/ });
    await act(async () => {
      fireEvent.click(example);
    });
    expect((screen.getByLabelText('ضلع a') as HTMLInputElement).value).toBe('3');
    expect((screen.getByLabelText('ضلع b') as HTMLInputElement).value).toBe('4');
    expect((screen.getByLabelText('ضلع c') as HTMLInputElement).value).toBe('5');
  }, 20_000);

  it('toggles bookmarks from the app bar', async () => {
    await renderSolver('ph');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'نشان‌کردن' }));
    });
    expect(useAppStore.getState().bookmarks).toContain('ph');
  }, 20_000);
});
