# استراتژی تست
- **Unit (الان، سبز: ۹۹ تست):** `node --test tests/formulas.test.mjs` — هر فرمولِ registry دست‌کم یک تست ورودی→خروجی اعلام‌شده دارد؛ تست پارسر عبارت (بدون eval)، مشتق/انتگرال/ریشه عددی و تبدیل واحد. قانون پروژه: فرمول بدون تست merge نمی‌شود.
- **API smoke (CI):** بالا آوردن FastAPI و بررسی `/health` و `/api/v1/solve` برای pH.
- **Static/PWA smoke (CI):** سرو استاتیک و بررسی وجود manifest و service worker.
- **فاز ۱:** Playwright E2E (جریان جستجو→حل→اشتراک)، تست رسپانسیو در viewportهای ۳۲۰/۴۸۰/۷۶۸/۱۰۲۴/۱۲۸۰/۱۵۳۶/۱۹۲۰، ماتریس BrowserStack، تست بار k6 (هدف ۱۰۰k کاربر همزمان روی API کش‌شده)، اسکن OWASP ZAP.
