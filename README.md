What Can I Eat?

**Overview**
- **Goal:** Help users quickly determine which menu items are safe based on their dietary restrictions (vegan, vegetarian, or custom rules).
- **Platforms:** iOS, Android, and Web via Expo.
- **Core Features:** Camera menu scanning, URL/text analysis, categorized results (Good/Careful/Avoid), modern theming, accessibility.

**Key Links**
- Project context and current truth: `CONTEXT.md`
- Agent/process guidelines: `AGENTS.md`
- Design system and theming: `docs/design-system.md`

**Features**
- **Onboarding:** 4-step flow to set dietary preferences; defaults applied on completion.
- **Inputs:** Camera scan, website URL, or pasted text.
- **AI Analysis:** Integrates with Google Gemini via `@google/genai`.
- **Results UI:** Color-coded cards, filters, summary, and accessibility support.
- **Recent Activity:** Quick access to past analyses (cached).
- **Developer Shortcuts:** On Home, tap “View Demo Results”; long-press settings icon to reset onboarding.

**Requirements**
- **Node:** 18 LTS recommended (16+ may work).
- **Package Manager:** npm 9+ (or pnpm/yarn if you prefer, adapt commands).
- **Expo:** Use `npx expo` (no global install required).
- **iOS:** Xcode (macOS).
- **Android:** Android Studio + emulator.

**Quick Start**
- Clone repo, then:
  - `npm install`
  - Copy `.env.example` → `.env` and set `EXPO_PUBLIC_GEMINI_API_KEY`
  - `npm start` (or `npm run ios` / `npm run android` / `npm run web`)

**Environment Variables**
- Required:
  - `EXPO_PUBLIC_GEMINI_API_KEY`: Your Gemini API key.
- Optional:
  - `EXPO_PUBLIC_GEMINI_ENDPOINT`: Override Gemini endpoint.
  - `EXPO_PUBLIC_API_TIMEOUT`: Request timeout in ms (default 30000).
  - `EXPO_PUBLIC_MAX_RETRIES`: Retry count (default 3).
- Example file: `.env.example`

**Scripts**
- **Start dev server:** `npm start`
- **Platform launchers:** `npm run ios`, `npm run android`, `npm run web`
- **Tests:** `npm test`
- **Lint:** `npx eslint . --ext .ts,.tsx`
- **Format:** `npx prettier --check .` (or `--write` to format)
- **Typecheck:** `npx tsc --noEmit`

**Directory Structure**
- `App.tsx`: App entry; navigation, theme, onboarding gating.
- `src/screens/onboarding/*`: Onboarding flow (Welcome, DietarySelection, CustomRestrictions, CompletionWrapper).
- `src/screens/main/HomeScreen.tsx`: Main hub (camera, URL/text, recent activity).
- `src/screens/camera/CameraScreen.tsx`: Capture/preview/OCR processing UI.
- `src/screens/results/ResultsScreen.tsx`: Categorized results with filters and summary.
- `src/components/*`: Reusable UI (common, camera, results).
- `src/services/api/*`: Gemini service, config, tests.
- `src/services/ocr/*`: OCR module (see `DEPRECATED.md` for notes).
- `src/services/cache/*`: Offline caching helpers.
- `src/theme/*`: Theme tokens and provider.
- `src/types/index.ts`: Centralized TypeScript types (dietary, API, UI state, etc.).

**Architecture Overview**
- **Navigation:** Stack navigation; shows onboarding until completed, then main app.
- **Persistence:** AsyncStorage keys `onboarding_completed`, `user_preferences`, `user_settings`.
- **AI Integration:** `src/services/api/geminiService.ts` with timeout/retry and response parsing; config from `src/services/api/config.ts` reads Expo public env vars.
- **Theming:** `src/theme/index.ts` defines modern light/dark palettes with semantic tokens and glass effects. Use `useTheme()` from `ThemeProvider`.

**Testing**
- Run: `npm test`
- Notes:
  - The repo configures Jest (`jest.config.js`) with RN preset, TypeScript via `ts-jest`, and a transform allowlist for RN/Expo packages.
  - If you see polyfill parse errors from RN packages, ensure your Node and npm match the Requirements above. Some environments may need a clean install (`rm -rf node_modules && npm install`).

**Troubleshooting**
- **“API key missing” at runtime:** Set `EXPO_PUBLIC_GEMINI_API_KEY` in `.env` and restart.
- **Jest polyfill errors:** Confirm Node 18+, and that `transformIgnorePatterns` in `jest.config.js` includes RN/Expo packages; try a clean install.
- **Expo iOS/Android emulator issues:** Ensure simulators are installed and running; try `npx expo start -c` to clear cache.

**Contributing**
- Read `AGENTS.md` for how we work (planning, patches, tests, commit hygiene).
- Update `CONTEXT.md` when behavior/config changes and add a dated coordination entry.
- Use the PR template checklist (`.github/pull_request_template.md`).

**Security**
- Do not commit secrets. Only use Expo public env vars for client-side configuration. For production, consider migrating to Vertex AI with proper backend mediation.

**Roadmap (High Level)**
- Optional: Vertex AI migration for production security/SLA.
- Optional: Shared “Surface/GlassCard” primitives to reduce styling duplication.
- Optional: E2E tests and CI cache for Expo builds.

Happy building! If something feels unclear, open an issue or a PR with a proposed improvement to this README.
