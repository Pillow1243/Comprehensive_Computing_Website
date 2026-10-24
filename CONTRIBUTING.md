# راهنمای مشارکت — SolveEverything

1. Fork و branch از `main` بسازید. 2. فرمول جدید را طبق `docs/FORMULA_TEMPLATE.md` به `apps/web/registry.js` اضافه کنید (حتماً با `tests`).
3. `node --test tests/formulas.test.mjs` باید سبز شود؛ برای بک‌اند: `uvicorn backend.main:app` و بررسی `/health`.
4. id فرمول را به `packages/formula-registry/catalog.json` اضافه و در PR توضیح + منبع (reference) بنویسید.
5. PR با عنوان `formula: <id>`؛ داور محاسبات و تست‌ها را بررسی می‌کند (فرمول بدون تست پذیرفته نمی‌شود).
سبک کد: توابع خالص در compute، پیام خطای واضح فارسی، گردکردن با `r()`، بدون `eval`.
