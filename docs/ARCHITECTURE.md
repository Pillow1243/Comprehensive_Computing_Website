# معماری SolveEverything

## سامانه‌ای که اکنون build و منتشر می‌شود

نسخه‌ی اصلی وب با Next.js App Router و `output: 'export'` ساخته می‌شود. صفحه‌های خانه، دسته‌ها، ابزارها و هر فرمول HTML استاتیک دارند؛ worker محاسباتی و Service Worker در مرورگر کار می‌کنند. `apps/web/registry.js` منبع توابع محاسباتی مورداعتماد است؛ JSON رجیستری هرگز به‌عنوان کد اجرا نمی‌شود. `scripts/build-formula-index.mjs` داده‌ی جست‌وجو و جزئیات را می‌سازد. `apps/web/` همچنین یک PWA مستقل قدیمی/بدون build را نگه می‌دارد؛ صفحه‌ی ریشه‌ی Next آن را iframe نمی‌کند.

```text
Browser / installed PWA
  ├─ Next.js static UI + generated formula manifests
  ├─ Web Worker → trusted local solvers and numerical tools
  ├─ localStorage → preferences, bookmarks, recent calculations, history
  ├─ Service Worker → app shell and previously visited routes/assets
  └─ optional HTTPS calls → separately deployed FastAPI prototype

GitHub Pages → static files only
FastAPI, PostgreSQL, Redis, authentication, background jobs → not deployed by Pages
```

محاسبات محلی و نگهداری تاریخچه روی همان دستگاه انجام می‌شوند. اگر API جداگانه تنظیم نشده باشد، عملیات سروری باید شکست روشن بدهد؛ تنظیم URL عمومی API به‌معنی آن نیست که API واقعاً deploy یا production-ready شده است. Service Worker shell و مسیرهای بازدیدشده را cache می‌کند؛ آفلاین‌بودن هر صفحه‌ی فرمولِ بازنشده تضمین‌شده نیست.

## وضعیت علمی کاتالوگ

`packages/formula-registry/catalog.json` اکنون ۳۱۵ شناسه‌ی پیاده‌سازی‌شده در ۲۹ بخش دارد. هر فرمول موردهای محاسباتی خود را دارد، اما «عبور از تست کد» با «بازبینی علمی مستقل» یکی نیست. وضعیت علمی در `scientific_review_status` مستقل از `validated` ثبت می‌شود؛ مقدار `validated` تنها سازگاری کد با تست‌های اعلام‌شده را توصیف می‌کند. فرمولی را `domain_reviewed` نکنید مگر منبع HTTPS معتبر، بازبین مسئول و تاریخ واقعی بازبینی ثبت شده باشد.

همگام‌سازی و اعتبارسنجی:

```bash
npm run sync-registry
npm run build:index
npm run validate-registry
npm test
```

اسکریپت همگام‌سازی شمار پیاده‌سازی و وضعیت `planned`/`partial` هر بخش را از شناسه‌های واقعی محاسبه می‌کند. این کار تکمیل علمی یک حوزه را ادعا نمی‌کند.

## اجزای اختیاری/نمونه

`backend/main.py` یک prototype جداگانه‌ی FastAPI/SymPy است. `db/schema.sql` اسکیمای پیشنهادی برای قابلیت‌های آینده است، نه اثبات وجود حساب کاربری یا پایگاه داده‌ی فعال. rate limit فعلی process-local است و برای مقیاس چند نمونه کافی نیست. پیش از تولید باید deploy جدا، محدودیت منابع و timeout، rate limit مشترک Redis، تست یکپارچه، مانیتورینگ، سیاست داده/حریم خصوصی، backup/restore و بازبینی امنیتی انجام شود. جزئیات: [`DEPLOYMENT.md`](DEPLOYMENT.md)، [`API.md`](API.md)، [`DATABASE.md`](DATABASE.md).

## امنیت و حریم خصوصی

- expression parser و registry از `eval`/`new Function` استفاده نمی‌کنند.
- worker lazy-load می‌شود؛ ورودی‌های محاسبه‌ی معمول به سرور ارسال نمی‌شوند.
- لینک محاسبه ورودی‌ها را در query string کد می‌کند؛ کاربر نباید داده‌ی حساس را در لینک بگذارد.
- CSP در خروجی استاتیک محدودیت‌هایی دارد؛ GitHub Pages کنترل کامل response headers را نمی‌دهد.
- تاریخچه و نشان‌ها local-only هستند؛ ورود، sync ابری، telemetry فعال و حساب کاربری پیاده‌سازی‌شده نیستند.

هر ادعای API عمومی، دسترس‌پذیری WCAG، ظرفیت هم‌زمانی یا عملکرد باید با deployment و اندازه‌گیری واقعی پشتیبانی شود؛ فایل معماری به‌تنهایی مدرک اجرای آن قابلیت نیست.
