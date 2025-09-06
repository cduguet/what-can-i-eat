Launch Checklist

Goal: ship the app to your phone safely (no AI keys on client) and optionally to TestFlight/Internal App Sharing. This follows Expo’s recommended EAS Update/Build flow.

Images (App Icon & Splash)
- Source: place a 1024×1024 square PNG at `assets/icon.png`.
- Adaptive icon: keep `assets/adaptive-icon.png` (1024×1024) with safe margins for Android.
- Splash: `assets/splash-icon.png` (1024×1024) used with `resizeMode: contain` and white background.
- Where configured: `app.json` → `expo.icon`, `expo.splash.image`, `expo.android.adaptiveIcon.foregroundImage`.
- Optional: run `npx expo-optimize` to compress assets before release.

Security (No AI Keys on Client)
- Required client vars only:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Ensure:
  - `EXPO_PUBLIC_BACKEND_MODE=supabase`
  - NO `EXPO_PUBLIC_GEMINI_API_KEY` or Vertex credentials set in production builds.
  - Supabase Edge Function holds and uses the AI provider keys server-side.
- Code refs:
  - Client calls go through `src/services/api/supabaseAIService.ts`.
  - Provider choice set via `EXPO_PUBLIC_AI_PROVIDER` and handled in Edge Function.

Preflight Checklist
- App config:
  - `app.json`: name/slug set, and temporary identifiers updated (`ios.bundleIdentifier`, `android.package`).
  - Update identifiers to your final values before store submission.
- Env:
  - `.env` includes only Supabase vars; no AI keys.
  - `EXPO_PUBLIC_BACKEND_MODE=supabase`.
- Functionality:
  - Supabase Edge Function for AI is deployed and working (name: `ai-menu-analysis`).
  - Test path: open app → run a sample analysis → confirm results.
- QA basics:
  - Run `npm test`, `npx tsc --noEmit`, `npx eslint . --ext .ts,.tsx`.
  - Try on iOS Simulator and Android Emulator with `npm run ios` / `npm run android`.

Distribute To Your Phone
Option A — Expo Go + EAS Update (fastest, no native build)
- One-time: `npx expo login` (if prompted).
- Publish an update:
  - Preview channel: `npm run update:preview`
  - Production channel: `npm run update:prod`
- In Expo Go on your phone, open the project via QR or from your account to load the published update.

Option B — Development Build (uses your native runtime, still fast sharing)
- iOS: `npm run build:dev` then install via build link/TestFlight.
- Android: `npm run build:dev` then install via build link/Internal App Sharing.
- Start dev server: `npx expo start --dev-client` to iterate with the dev build.

Option C — Store/External Test (production build)
- Set final identifiers in `app.json`:
  - iOS: `expo.ios.bundleIdentifier`
  - Android: `expo.android.package`
- Build binaries:
  - iOS: `npm run build:prod -- --platform ios`
  - Android: `npm run build:prod -- --platform android`
- Submit:
  - iOS: `npx eas submit --platform ios --latest`
  - Android: `npx eas submit --platform android --latest`

Post-Launch
- Use `eas update` to ship over-the-air JS updates without rebuilding.
- Keep secrets out of the client; rotate keys if compromises are suspected.

References
- Config: `app.json`
- Client AI service: `src/services/api/supabaseAIService.ts`
- Env docs: `README.md`, `.env.example`
- Security architecture: `docs/api-security-architecture.md`
