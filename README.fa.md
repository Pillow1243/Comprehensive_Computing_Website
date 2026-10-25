# SolveEverything — حل همه‌چیز

[English](README.md) · **فارسی**

[![CI](https://github.com/Pillow1243/Comprehensive_Computing_Website/actions/workflows/ci.yml/badge.svg)](https://github.com/Pillow1243/Comprehensive_Computing_Website/actions/workflows/ci.yml)
[![GitHub Pages](https://github.com/Pillow1243/Comprehensive_Computing_Website/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/Pillow1243/Comprehensive_Computing_Website/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-3.0.0-informational.svg)](CHANGELOG.md)
[![CodeQL](https://github.com/Pillow1243/Comprehensive_Computing_Website/actions/workflows/codeql.yml/badge.svg)](https://github.com/Pillow1243/Comprehensive_Computing_Website/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/Pillow1243/Comprehensive_Computing_Website/badge)](https://securityscorecards.dev/viewer/?uri=github.com/Pillow1243/Comprehensive_Computing_Website)
![PWA](https://img.shields.io/badge/PWA-%D9%86%D8%B5%D8%A8%E2%80%8C%D8%B4%D8%AF%D9%86%DB%8C%20%7C%20%D8%A2%D9%81%D9%84%D8%A7%DB%8C%D9%86-7c5cff)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](.github/PULL_REQUEST_TEMPLATE.md)

**هر معادله‌ای را گام‌به‌گام حل کن.** ماشین‌حساب علمی فارسی/انگلیسی برای ریاضی، فیزیک، شیمی، مهندسی، آمار و مالی؛ کلاینت‌محور، قابل نصب و آماده کار آفلاین.

**دمو:** [Pillow1243.github.io/Comprehensive_Computing_Website](https://Pillow1243.github.io/Comprehensive_Computing_Website/) · **وضعیت:** نسخه ۳.۰.۰ · **پیاده‌سازی‌شده:** ۲۸۹ حل‌گر فرمول با ۷۰۲ مورد تست خودکار، به‌همراه مبدل یکا (۱۳ دسته، ۹۵ یکا)، ابزار جرم مولی، جدول تناوبی تعاملی و مرجع ثابت‌های فیزیکی.

> Workflow استقرار آماده است، اما مالک ریپو باید یک‌بار از مسیر **Settings → Pages → GitHub Actions** منبع Pages را فعال کند و سپس از `main` انتشار دهد. راهنما: [استقرار](docs/DEPLOYMENT.md).

## چرا این پروژه؟

- **کلاینت‌محور:** محاسبات رایج در مرورگر انجام می‌شوند و ورودی‌ها به‌طور پیش‌فرض محلی می‌مانند.
- **آفلاین‌پذیر:** PWA نصب‌شدنی با کش فایل‌ها، تاریخچه/نشان‌گذاری محلی و رسم پویای ۲بعدی.
- **امن:** پارسر عبارت بدون `eval`؛ پیاده‌سازی فرمول‌ها تابع‌های مورداعتماد هستند، نه رشته کد قابل اجرا از JSON.
- **دوزبانه:** رابط فارسی RTL با امکان تغییر به انگلیسی LTR.
- **قابل بررسی:** JSON Schema، تست‌های اعلام‌شده، اعتبارسنج Registry و FastAPI/SymPy اختیاری برای عملیات سروری.

## شروع سریع

```bash
nvm use && npm ci
npm run dev
# مرورگر: http://localhost:3000
```

برای اجرای مستقیم PWA اولیه بدون build: `python3 -m http.server 8080 --directory apps/web`.

## قابلیت‌ها

| حوزه | اکنون | دامنه و محدودیت |
|---|---|---|
| حل‌گرها | ۲۸۹ فرمول کلاینتی در ریاضیات، فیزیک، شیمی، مهندسی، مالی و اقتصاد، کامپیوتر، سلامت، نجوم و زمین/محیط | هدف ۵۰۰+ فرمول هنوز در نقشه راه است؛ `ROADMAP.md` را ببینید. |
| گام‌ها و نمودار | مراحل حل، KaTeX با fallback متنی، نمودار پویای Canvas دوبعدی | CAS کامل، رسم سه‌بعدی و نمودارگر عمومی پیشرفته در آینده‌اند. |
| ابزارها | مبدل یکا (۱۳ دسته، ۹۵ یکا)، تحلیل جرم مولی و درصد جرمی (با پرانتز و هیدرات)، جدول تناوبی ۱۱۸ عنصری، مرجع ۳۲ ثابت فیزیکی، ماشین‌حساب با پارسر امن، مشتق/انتگرال/ریشه‌یابی عددی و آزمون تمرینی | تحلیل ابعادی کامل و رسم سه‌بعدی در آینده‌اند. |
| ذخیره‌سازی | تاریخچه، نشان‌گذاری، لینک قابل اشتراک و چاپ/PDF محلی | در Pages حساب کاربری یا ذخیره‌سازی تاریخچه سمت سرور وجود ندارد. |
| زبان و دستگاه | فارسی/انگلیسی، RTL/LTR، هفت breakpoint موبایل‌محور، safe area و هدف لمسی | ترجمه عربی و آزمون گواهی‌شده همه سیستم‌عامل‌ها در برنامه است. |
| آفلاین | PWA نصب‌شدنی و محاسبات محلی بدون API | مشتق نمادین و حل‌گرهای سنگین به API اختیاری نیاز دارند. |
| API | نمونه FastAPI + SymPy، CORS محدودشده، health و solver | باید جداگانه میزبانی شود؛ GitHub Pages پایتون، PostgreSQL، Redis یا worker اجرا نمی‌کند. |

## معماری

```text
GitHub Pages (خروجی استاتیک)
  └── پوسته استاتیک Next.js در /Comprehensive_Computing_Website/
        └── PWA در /app/ (Registry + پارسر امن + Canvas + localStorage)
             └── درخواست HTTPS اختیاری → FastAPI/SymPy روی میزبان جدا
```

پوسته Next فعلی یک bridge برای استقرار است و به معنی SSR اختصاصی برای همه فرمول‌ها نیست. `NEXT_PUBLIC_API_URL` فقط نشانی عمومی API است و هرگز نباید secret در آن قرار گیرد. اگر API تنظیم یا در دسترس نباشد، عملیات سروری پیام روشن می‌دهد و ابزارهای محلی همچنان کار می‌کنند.

## ساختار پروژه

```text
app/                           پوسته Next.js برای export استاتیک
apps/web/                      PWA دوزبانه، پارسر امن، نمودارها، واحدها و UI
backend/                       API اختیاری FastAPI + SymPy
packages/formula-registry/
  schema.json                  JSON Schema رجیستری
  catalog.json                 ۲۹ بخش موضوعی + نمایه فرمول‌های پیاده‌شده
scripts/                       همگام‌سازی/اعتبارسنجی کاتالوگ، پیش‌نمایش و Lighthouse
tests/                         تست‌های Node و اعتبارسنجی registry/API
e2e/                           سناریوهای Playwright برای دسکتاپ و هفت پروفایل اندروید
docs/                          استقرار، API، معماری، دسترس‌پذیری و تست
.github/workflows/              CI، Pages، CodeQL و OpenSSF Scorecard
infra/native-apps.md            راهنمای اولیه Capacitor / Tauri
db/schema.sql                   اسکیمای PostgreSQL برای قابلیت‌های میزبانی‌شده
```

## تست و خروجی Pages

```bash
npm run validate-registry     # ۱۵۵ فرمول، ۴۳۰ مورد تست، ۲۹ بخش کاتالوگ، manifest‌های همگام
npm run test:unit             # ۶۹۰ تست Vitest
npm test                      # تست‌های واحد + ۵۹۶ بررسی Node برای registry/API
npm run build                 # خروجی استاتیک Next در out/ (۱۶۲ صفحه)
npm run budget                # بودجه gzip: ۱۹۲٫۳ کیلوبایت صفحه اصلی / ۲۰۰
npm run test:all              # اعتبارسنجی → همه تست‌ها → build → بودجه
npx playwright install chromium
npm run test:e2e:ci           # ۷۹ سناریو روی دسکتاپ و هفت پروفایل اندروید
npm run lighthouse:ci         # بودجه‌های .lighthouserc.json
```

Build از `output: 'export'` استفاده می‌کند و دستور منسوخ `next export` را اجرا نمی‌کند. امتیاز Lighthouse قبل/بعد در این checkout اندازه‌گیری نشده؛ گزارش و روش تکرارپذیر: [performance report](docs/performance-report.md).

## مشارکت

هر فرمول باید دامنه، واحد، فراداده دوزبانه، خروجی، مراحل توضیحی و حداقل دو تست مستقل و قابل بررسی داشته باشد (تولیدکننده تا چهار مورد را هدف می‌گیرد). پس از ویرایش، `npm run sync-registry` و سپس validator و تست‌ها را اجرا کنید. راهنماها: [مشارکت](CONTRIBUTING.md)، [قالب فرمول](docs/FORMULA_TEMPLATE.md)، [JSON Schema](packages/formula-registry/schema.json).

## استقرار و راهنماها

- [راهنمای GitHub Pages، API جداگانه، دامنه، استقرار دستی و rollback](docs/DEPLOYMENT.md)
- [معماری](docs/ARCHITECTURE.md) · [API](docs/API.md) · [رسپانسیو](docs/RESPONSIVE.md) · [نقشه راه](ROADMAP.md)
- [قانون رفتار](CODE_OF_CONDUCT.md) · [امنیت](SECURITY.md) · [تغییرات](CHANGELOG.md) · [ارجاع علمی](CITATION.cff)
- Wireframe: [docs/WIREFRAME.md](docs/WIREFRAME.md). اسکرین‌شات واقعی پس از فراهم‌شدن امکان ضبط مرورگر اضافه می‌شود؛ ادعای تصویر ساختگی یا امتیاز اندازه‌گیری‌نشده نداریم.

## سلب مسئولیت

این ابزار آموزشی جایگزین بررسی مستقل، نظر متخصص مهندسی، مشاوره پزشکی یا مشاوره مالی نیست. محاسبات حساس را با منابع معتبر و استانداردهای مربوطه تطبیق دهید.
