import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
      <div aria-hidden="true" className="mb-3 font-serif text-6xl text-primary">
        404
      </div>
      <h1 className="text-title-large text-on-surface">صفحه پیدا نشد / Page not found</h1>
      <p className="mt-2 text-body-medium text-on-surface-variant">آدرس را بررسی کنید یا به فهرست بازگردید.</p>
      <Link href="/" className="mt-5 min-h-12 rounded-full bg-primary px-5 leading-[3rem] text-label-large text-on-primary">
        خانه / Home
      </Link>
    </main>
  );
}
