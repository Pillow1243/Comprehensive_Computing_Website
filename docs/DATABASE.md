# اسکیمای دیتابیس
فایل اجرایی: `db/schema.sql` (PostgreSQL 16، در docker-compose به‌صورت خودکار اجرا می‌شود).

جداول: `users` (نقش‌ها: user/contributor/reviewer/admin)، `categories` (درخت)، `formulas` (Registry سروری؛ variables/outputs/tests به‌صورت JSONB + ایندکس GIN روی tags و جستجوی متنی)، `formula_versions` (نسخه‌بندی و changelog)، `calculations` (تاریخچه؛ برای مهمان فقط localStorage)، `bookmarks`، `shared_links`، `contributions` (پیشنهاد/تصحیح + داوری)، `quiz_attempts` (گیمیفیکیشن)، `api_keys` (quota)، `analytics_events`.
روابط کلیدی: calculations/bookmarks/versions → formulas(id) و users(id) با `ON DELETE CASCADE` برای داده کاربر. مهاجرت‌های بعدی با Alembic مدیریت می‌شود.
