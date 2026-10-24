# ∑ SolveEverything — حل همه‌چیز

پلتفرم وب جامع حل گام‌به‌گام معادلات و محاسبات ریاضی، فیزیک، شیمی، مهندسی و مالی؛ با رسم پویا، پشتیبانی کامل واحد، فارسی/انگلیسی (RTL/LTR)، رسپانسیو برای همه دستگاه‌ها و PWA آفلاین.

## 🚀 اجرای فوری (بدون build)
```bash
python3 -m http.server 8080 --directory apps/web
# → http://localhost:8080
```
یا با Docker: `docker compose up` (وب: 8080، API: 8000/docs، PostgreSQL، Redis)

## ✅ وضعیت فاز ۰ (MVP)
- **۴۶ فرمول فعال و تست‌شده** (۹۹ تست خودکار سبز): قانون کسینوس‌ها/سینوس‌ها، هرون، معادله درجه‌دو، مشتق چندجمله‌ای، آمار توصیفی، توزیع نرمال، رگرسیون، pH، مولاریته، گاز ایده‌آل، آرنیوس، نرنست، قانون اهم، سینماتیک، نسبیت، بهره مرکب، قسط وام، NPV، آنتروپی شانون، ماتریس ۲×۲ و…
- **ابزارها:** ماشین‌حساب علمی (پارسر امن بدون eval + مشتق/انتگرال/ریشه عددی)، رسم تابع، مبدل واحد، تمرین/آزمون خودکار، تاریخچه و نشان‌شده‌ها، اشتراک‌گذاری لینکی، چاپ/PDF، کپی LaTeX
- **کاتالوگ کامل:** هر ۲۹ بخش مشخصات (~۱۹۵ موضوع) در `packages/formula-registry/catalog.json`
- **بک‌اند:** FastAPI + SymPy (`/api/v1/solve`، مشتق/انتگرال نمادین) — تست‌شده زنده

## ساختار پروژه
```
apps/web/            وب‌اپ PWA (index, styles, app, registry=Formula Registry, engine=پارسر+واحد, plot=Renderer, sw, manifest)
backend/             FastAPI Math Engine (main.py, registry_data.py, Dockerfile, requirements.txt)
db/schema.sql        اسکیمای PostgreSQL
packages/formula-registry/catalog.json   کاتالوگ ۲۹ بخش
tests/               تست‌های واحد فرمول‌ها و موتور (node --test)
docs/                ARCHITECTURE, API, DATABASE, WIREFRAME, RESPONSIVE, FORMULA_TEMPLATE, TESTING, ROADMAP_PHASE0
infra/native-apps.md Capacitor (iOS/Android) + Tauri (Desktop)
.github/workflows/   CI: تست وب + API + PWA
docker-compose.yml   web + api + worker + PostgreSQL + Redis
```

## تست
```bash
node --test tests/formulas.test.mjs   # 99 passed
```

مستندات کامل: [معماری](docs/ARCHITECTURE.md) • [API](docs/API.md) • [رسپانسیو](docs/RESPONSIVE.md) • [مشارکت](CONTRIBUTING.md) • [نقشه راه فاز ۰](docs/ROADMAP_PHASE0.md)
