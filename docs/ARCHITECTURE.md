# معماری SolveEverything

## تصمیم کلیدی فاز ۱: Pages-compatible client-first build
نسخه فعال همچنان موتور محاسباتی **کلاینت‌محور** است. برای استقرار روی GitHub Pages، یک shell استاتیک Next.js با `output: 'export'` اضافه شده است؛ `scripts/prepare-static-app.mjs` برنامه PWA موجود (`apps/web`) و `catalog.json` را در `public/app/` قرار می‌دهد و صفحه Next همان برنامه را در ریشه Pages میزبانی می‌کند. این bridge عمداً منطق محاسبه را بازنویسی یا به کلاینت وابسته به FastAPI نمی‌کند. جزئیات استقرار: `docs/DEPLOYMENT.md`.

## تصمیم کلیدی فاز ۰ (و چرایی)
نسخه فاز ۰ به‌صورت **وب‌اپ استاتیک zero-build** (`apps/web`، ماژول‌های ES خالص) پیاده شده است:
- دلیل: روی هر OS/مرورگری بدون build اجرا می‌شود، آفلاین (Service Worker) است، داخل Capacitor/Tauri بدون تغییر می‌نشیند و پیش‌نمایش/تست آن فوری است.
- ماژول‌ها (`registry.js`, `phase1-formulas.js`, `engine.js`, `api.js`, `plot.js`) در سمت‌کاربر بارگذاری می‌شوند؛ registry کد رشته‌ای را `eval` نمی‌کند. Shell فعلی Next.js 16 هنوز یک bridge است، نه بازنویسی React/SSR: `app/page.tsx` میزبان PWA در `public/app/` است. مهاجرت به صفحات استاتیک اختصاصی/بین‌المللی هر فرمول و Schema.org MathSolver در فاز بعد انجام می‌شود.
- محاسبات سبک سمت کاربر (زیر ۱۰۰ms، حریم خصوصی، آفلاین) و محاسبات سنگین (CAS/PDE/بهینه‌سازی بزرگ) سمت سرور FastAPI+SymPy با صف Celery/Redis انجام می‌شود — همان مرزبندی مشخصات.

```
Browser/PWA/Capacitor/Tauri
  └─ Web App ── Registry (JSON/JS) ── Engine (parser, units) ── Plot (Canvas)
        │ REST (فقط محاسبات سنگین)          localStorage: history/bookmarks/settings
        ▼
FastAPI Math Engine ── SymPy/SciPy/NumPy ── Celery+Redis (کارهای طولانی، WebSocket streaming در فاز۲)
PostgreSQL (users, formulas, calculations…) ── Redis (cache/rate-limit) ── S3/MinIO (خروجی‌ها)
```

## خروجی‌های درخواستی — نقشه تحویل
| # | خروجی | محل |
|---|---|---|
|۱|ساختار پروژه|`README.md` + همین سند|
|۲|اسکیمای دیتابیس|`db/schema.sql` + `docs/DATABASE.md`|
|۳|طراحی API|`docs/API.md` + `backend/main.py` (OpenAPI در `/docs`)|
|۴|Registry/Solver/Renderer|`apps/web/registry.js` ،`engine.js` ،`plot.js`|
|۵|سه فرمول نمونه با تست|قانون کسینوس، مشتق چندجمله‌ای، pH — در registry با فیلد `tests` + تست API در CI|
|۶|wireframe صفحه فرمول|`docs/WIREFRAME.md`|
|۷|صفحه اصلی و درخت دسته‌بندی|`apps/web` (sidebar + hero) و `docs/WIREFRAME.md`|
|۸|auth و تاریخچه|تاریخچه/نشان‌شده‌ها در وب‌اپ (localStorage مهمان)؛ auth در `docs/API.md` (NextAuth + جدول users) — اتصال سروری فاز ۱|
|۹|استراتژی تست|`docs/TESTING.md` + `tests/` (۳۷۲ تست Node؛ ۲۶۶ مورد تست فرمول)|
|۱۰|Docker/CI|`docker-compose.yml`، `backend/Dockerfile`، `.github/workflows/ci.yml`|
|۱۱|مشارکت|`CONTRIBUTING.md` + `docs/FORMULA_TEMPLATE.md`|
|۱۲|برنامه فاز ۰|`docs/ROADMAP_PHASE0.md`|
|۱۳|رسپانسیو/PWA|`docs/RESPONSIVE.md` + `styles.css` + `manifest.webmanifest` + `sw.js` + `infra/native-apps.md`|

## کاتالوگ
`packages/formula-registry/catalog.json`: ۲۹ بخش موضوعی و آیتم‌های برنامه‌ریزی‌شده؛ ۱۵۵ فرمول پیاده‌سازی‌شده با ۳۵۵ مورد تست اعلام‌شده. این کاتالوگ هنوز پیاده‌سازی کامل فهرست علمی (۵۰۰+) نیست.

## امنیت
پارسر عبارت کلاینتی بدون `eval` و پارسر AST نمادین allow-list شده برای API؛ سقف طول/پیچیدگی، rate-limit نمونه، CORS بر اساس `CORS_ORIGINS`، و CSP محدودکننده در متای HTML. GitHub Pages اجازه تنظیم هدرهای دلخواه (از جمله HSTS و `frame-ancestors`) را از repo نمی‌دهد؛ برای سیاست‌های قوی‌تر باید CDN/هاست پاسخ‌هدر‌پذیر جلوی Pages قرار گیرد. هیچ source string از Registry اجرا نمی‌شود؛ فقط توابع مورداعتماد ماژول‌ها.
