# معماری SolveEverything

## تصمیم کلیدی فاز ۰ (و چرایی)
نسخه فاز ۰ به‌صورت **وب‌اپ استاتیک zero-build** (`apps/web`، ماژول‌های ES خالص) پیاده شده است:
- دلیل: روی هر OS/مرورگری بدون build اجرا می‌شود، آفلاین (Service Worker) است، داخل Capacitor/Tauri بدون تغییر می‌نشیند و پیش‌نمایش/تست آن فوری است.
- ماژول‌ها (`registry.js` = Formula Registry، `engine.js` = موتور عبارت/واحد، `plot.js` = Renderer) خالص و بدون وابستگی به DOM (به‌جز plot) هستند و **عیناً** به Next.js 14 منتقل می‌شوند؛ نقشه مهاجرت: `registry.js → packages/formula-registry`، صفحات → `app/[locale]/formula/[id]/page.tsx` (SSR + Schema.org MathSolver برای SEO).
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
|۹|استراتژی تست|`docs/TESTING.md` + `tests/formulas.test.mjs` (۹۹ تست سبز)|
|۱۰|Docker/CI|`docker-compose.yml`، `backend/Dockerfile`، `.github/workflows/ci.yml`|
|۱۱|مشارکت|`CONTRIBUTING.md` + `docs/FORMULA_TEMPLATE.md`|
|۱۲|برنامه فاز ۰|`docs/ROADMAP_PHASE0.md`|
|۱۳|رسپانسیو/PWA|`docs/RESPONSIVE.md` + `styles.css` + `manifest.webmanifest` + `sw.js` + `infra/native-apps.md`|

## کاتالوگ
`packages/formula-registry/catalog.json`: هر ۲۹ بخش مشخصات با آیتم‌های برنامه‌ریزی‌شده؛ ۴۶ فرمول پیاده‌سازی‌شده و تست‌شده (registry). وضعیت هر بخش: partial/planned.

## امنیت
پارسر عبارت سفارشی بدون `eval` (سمت کاربر) و allow-list روی AST پایتون (سمت سرور)، rate-limit، سقف طول ورودی، CSP در استقرار (هدر وب‌سرور)، عدم اجرای compute رشته‌ای از Registry — فقط توابع تعریف‌شده در کد.
