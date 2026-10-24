# پیکربندی رسپانسیو و PWA ✅ (پیاده‌سازی‌شده در `apps/web/styles.css`)

- Breakpoints اجباری: xs 320 / sm 480 / md 768 / lg 1024 / xl 1280 / 2xl 1536 / 3xl 1920 — گرید فرمول‌ها: ۱→۲→۲→۳→۳→۴→۵ ستون؛ sidebar از lg به بالا ثابت، پایین‌تر Drawer.
- Mobile-first، تاچ‌تارگت ≥44×44px، `viewport-fit=cover` + `env(safe-area-inset-*)` برای notch/Dynamic Island، پشتیبانی Portrait/Landscape و `prefers-reduced-motion`.
- ورودی‌ها: کیبورد (focus-visible، skip-link، ARIA live برای نتیجه)، ماوس، تاچ، قلم (pointer events استاندارد؛ بدون وابستگی به hover).
- فونت: Vazirmatn با fallback Tahoma/system-ui/Noto Sans Arabic — بدون دانلود اجباری فونت (سرعت + آفلاین).
- تم: `prefers-color-scheme` + انتخاب دستی (localStorage)؛ جهت: RTL فارسی / LTR انگلیسی با یک کلیک.
- PWA: `manifest.webmanifest` (standalone، هر orientation)، Service Worker آفلاین‌اول با cache نسخه‌دار، دکمه نصب (beforeinstallprompt)، نشان آفلاین.
- اپ بومی: `infra/native-apps.md` (Capacitor iOS/Android، Tauri دسکتاپ) — وب‌اپ استاتیک بدون تغییر داخل shell می‌رود.
- Wear OS/TV/کنسول: همان وب‌اپ با گرید تک‌ستونی و تارگت‌های بزرگ قابل استفاده است؛ نسخه حداقلی اختصاصی در فاز ۳.
- تست دستگاه: ماتریس BrowserStack در CI فاز ۱ (کامنت در `.github/workflows/ci.yml`).
