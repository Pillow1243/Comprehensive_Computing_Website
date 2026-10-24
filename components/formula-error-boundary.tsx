'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportError } from '@/lib/telemetry';

interface Props {
  formulaId: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Per-formula error boundary (requirement B07).
 * A single broken solver can never take down the page, and no stack trace is
 * ever shown to the user — only a short, bilingual, actionable message.
 */
export class FormulaErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, {
      formulaId: this.props.formulaId,
      scope: 'formula-boundary',
      componentStack: info.componentStack,
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="px-4 py-10 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-error-container text-3xl text-on-error-container">
          !
        </div>
        <h1 className="text-title-large text-on-surface">این فرمول بارگذاری نشد</h1>
        <p className="mt-1 text-body-medium text-on-surface-variant" dir="ltr">
          This formula could not be loaded. Your other calculations are unaffected.
        </p>
        <p className="mt-2 text-body-small text-on-surface-variant">
          ورودی‌های خود را دوباره بررسی کنید یا فرمول دیگری را امتحان کنید. گزارش خطا برای تیم ارسال شد.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="min-h-12 rounded-full bg-primary px-5 text-label-large text-on-primary"
          >
            تلاش دوباره / Try again
          </button>
          <a
            href="../"
            className="min-h-12 rounded-full border border-outline-variant px-5 leading-[3rem] text-label-large text-primary"
          >
            فهرست فرمول‌ها / All formulas
          </a>
        </div>
      </div>
    );
  }
}
