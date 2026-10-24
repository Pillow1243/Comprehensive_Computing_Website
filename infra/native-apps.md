# اپ بومی — Phase 3
## Capacitor (iOS/Android)
```bash
npm i @capacitor/core @capacitor/cli
npx cap init SolveEverything io.solveeverything.app --web-dir=apps/web
npx cap add ios && npx cap add android && npx cap sync
```
## Tauri (Windows/macOS/Linux)
```bash
npm i -D @tauri-apps/cli
npx tauri init --app-name SolveEverything --window-title SolveEverything --frontend-dist ../apps/web
```
وب‌اپ فعلی zero-build و استاتیک است، بنابراین بدون تغییر در هر دو shell اجرا می‌شود.
