import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center">
      <div aria-hidden="true" className="mb-4 font-serif text-7xl text-primary">
        404
      </div>
      <h1 className="text-headline-small text-on-surface">صفحه پیدا نشد</h1>
      <p className="mt-1 text-body-medium text-on-surface-variant" dir="ltr">
        Page not found — the address may be wrong or the page may have moved.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/" className="min-h-12 rounded-full bg-primary px-5 leading-[3rem] text-label-large text-on-primary">
          بازگشت به خانه / Home
        </Link>
        <Link
          href="/categories/"
          className="min-h-12 rounded-full border border-outline-variant px-5 leading-[3rem] text-label-large text-primary"
        >
          دسته‌بندی‌ها / Categories
        </Link>
      </div>
    </main>
  );
}
