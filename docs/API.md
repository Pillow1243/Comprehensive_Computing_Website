# طراحی API — REST `/api/v1`

| Method | Endpoint | توضیح | نمونه |
|---|---|---|---|
|GET|`/health`|سلامت سرویس|`{status:"ok"}`|
|GET|`/api/v1/formulas?q=&category=`|جستجو/فهرست فرمول‌ها|پاسخ: `{count, items[]}`|
|POST|`/api/v1/solve`|حل سمت سرور|`{formula_id, inputs}` → `{result:{values,steps}}`|
|POST|`/api/v1/calculus/derivative?point=`|مشتق نمادین (SymPy) + مقدار در نقطه|`{expression:"x^3-2x"}` → `{derivative, latex, at_point}`|
|POST|`/api/v1/calculus/integrate?a=&b=`|انتگرال نامعین/معین|→ `{indefinite, definite}`|

فاز ۱: `POST /auth/*` (NextAuth: ایمیل/رمز argon2id + OAuth گوگل/گیت‌هاب، JWT session)، `GET/POST /me/history`، `PUT/DELETE /me/bookmarks/{id}`، `POST /share` (لینک کوتاه)، `POST /contributions` + داوری، `GET /formulas/{id}` (صفحه SEO)، GraphQL و SDK (`sdk/js`, `sdk/python`)، کلید API و quota (جدول `api_keys`).
خطاها: `{detail}` با کدهای 400/401/404/422/429. Rate-limit: ۱۲۰ درخواست/دقیقه/IP (در تولید: Redis + بر اساس API-key).
OpenAPI زنده: اجرای بک‌اند و مراجعه به `/docs`.
