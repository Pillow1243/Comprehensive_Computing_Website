import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { Toaster, toast } from '@/lib/toast';

const dismissAll = () => {
  for (const button of screen.queryAllByRole('button', { name: 'بستن' })) fireEvent.click(button);
};

describe('toast store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    dismissAll();
    vi.useRealTimers();
  });

  it('renders a success toast in a polite live region', () => {
    render(<Toaster />);
    act(() => {
      toast.success('ذخیره شد');
    });
    expect(screen.getByText('ذخیره شد')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('uses role="alert" for failures', () => {
    render(<Toaster />);
    act(() => {
      toast.error('محاسبه انجام نشد');
    });
    expect(screen.getByRole('alert')).toHaveTextContent('محاسبه انجام نشد');
  });

  it('auto-dismisses after the default duration', () => {
    render(<Toaster />);
    act(() => {
      toast.success('کپی شد');
    });
    expect(screen.getByText('کپی شد')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(3300);
    });
    expect(screen.queryByText('کپی شد')).not.toBeInTheDocument();
  });

  it('honours a custom duration and dismisses manually', () => {
    render(<Toaster />);
    act(() => {
      toast.message('نسخه جدید', { duration: 10_000 });
    });
    act(() => {
      vi.advanceTimersByTime(3300);
    });
    expect(screen.getByText('نسخه جدید')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'بستن' }));
    expect(screen.queryByText('نسخه جدید')).not.toBeInTheDocument();
  });

  it('runs the action button and closes the toast', () => {
    const onClick = vi.fn();
    render(<Toaster />);
    act(() => {
      toast.message('نسخه جدید آماده است', { action: { label: 'به‌روزرسانی', onClick } });
    });
    fireEvent.click(screen.getByRole('button', { name: 'به‌روزرسانی' }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.queryByText('نسخه جدید آماده است')).not.toBeInTheDocument();
  });

  it('caps the stack at three visible toasts', () => {
    render(<Toaster />);
    act(() => {
      toast.success('یک');
      toast.success('دو');
      toast.success('سه');
      toast.success('چهار');
    });
    expect(screen.queryByText('یک')).not.toBeInTheDocument();
    for (const label of ['دو', 'سه', 'چهار']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('renders nothing before the first toast', () => {
    const { container } = render(<Toaster />);
    expect(container).toBeEmptyDOMElement();
  });
});
