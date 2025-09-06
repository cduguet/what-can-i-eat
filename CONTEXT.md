What Can I Eat — Context Summary

Purpose
- Single source for high-level project context and coordination notes.
- Keep this concise. Link to code and docs for details.

Sources Of Truth
- Code: `src/` (types, screens, services, components).
- Docs: `docs/` (see `docs/design-system.md` for theming, `docs/api-security-architecture.md`).
- Env: `.env.example` → copy to `.env` and fill required keys.

Tech Stack
- Framework: Expo SDK 53 (`expo` ^53.0.22).
- Language: TypeScript (~5.8.3).
- UI: React Native + React Native Paper.
- Navigation: React Navigation 7.
- State: React hooks; AsyncStorage for persistence.
- AI: Google Gemini via `@google/genai`.

Architecture (Current)
- Entry: `App.tsx` wires ThemeProvider, NavigationContainer, onboarding routing, and main stack.
- Onboarding (4 steps):
  - `WelcomeScreen` → `DietarySelectionScreen` → `CustomRestrictionsScreen` (only for Custom) → `CompletionScreenWrapper`.
  - Preferences are persisted to AsyncStorage; default settings applied on completion.
  - Fact-checked: `src/screens/onboarding/OnboardingNavigator.tsx` exports only the 4 screens; `PreferencesScreen.tsx` remains in repo but is unused and not exported.
- Main
  - `HomeScreen`: primary camera action, URL/text inputs, recent activity chips; includes “View Demo Results” and long-press on settings icon to reset onboarding (confirmed in file).
  - `CameraScreen`: capture/preview/processing UI.
  - `ResultsScreen`: categorized results UI (Good / Careful / Avoid) with filters and summary.

Services
- Gemini API: `src/services/api/geminiService.ts` with retry, timeout, parsing, and tests; config in `src/services/api/config.ts`.
- OCR: `src/services/ocr/ocrService.ts` (legacy note in `DEPRECATED.md` present).
- Caching: `src/services/cache/offlineCache.ts` for storing results.
- Auth (stubbed): `src/services/auth/authService.ts` sets up basic auth state tracking used by `App.tsx`.

Theming (Modern Palette)
- Source: `src/theme/index.ts`, provider `src/theme/ThemeProvider.tsx`.
- Light: primary `#14B8A6`, secondary `#F59E0B`, accent `#22D3EE`, background `#F8FAFC`, surface `#FFFFFF`.
- Dark: primary `#2DD4BF`, background `#0B1220`, surface `#111827`, text `#E5E7EB`.
- Semantic tokens for results: safe/caution/avoid with light variants.
- Glass effects tokens available; used selectively (see `docs/design-system.md`).

Data & Storage
- AsyncStorage keys used by app: `onboarding_completed`, `user_preferences`, `user_settings`, `onboarding_progress` (during flow).
- Types are centralized in `src/types/index.ts` (DietaryType, FoodSuitability, MenuInputType, API types, UI state, etc.).

Environment & Scripts
- Install: `npm install`
- Run: `npm start` (or `npm run ios` / `android` / `web`).
- Lint/Format/Typecheck: `npx eslint . --ext .ts,.tsx`, `npx prettier --check .`, `npx tsc --noEmit`.
- Tests: `npm test` (Jest). Note: current Jest config fails on RN polyfills in this environment; not addressed here.
- No global installs: use `npx expo ...` rather than installing Expo CLI globally.

Environment Variables (Expo public)
- Required: `EXPO_PUBLIC_GEMINI_API_KEY`.
- Optional: `EXPO_PUBLIC_GEMINI_ENDPOINT`, `EXPO_PUBLIC_API_TIMEOUT` (ms), `EXPO_PUBLIC_MAX_RETRIES`.
- Example: see `.env.example`.

Key Decisions & Status
- Onboarding simplified to 4 steps; default settings applied on completion (haptics/notifications enabled; high contrast off; textSize medium; language en).
- Theme modernized (Sept 2025) to teal/amber/cyan with semantic tokens; this supersedes older color specs previously documented.
- Gemini via `@google/genai` in dev; consider Vertex AI for production (security/SLA) later.
- Home screen includes developer helpers: demo results button and long-press settings icon to reset onboarding.

File Pointers
- Onboarding: `src/screens/onboarding/*` (unused legacy file: `PreferencesScreen.tsx`).
- Main: `src/screens/main/HomeScreen.tsx`.
- Camera: `src/screens/camera/CameraScreen.tsx` and `src/components/camera/*`.
- Results: `src/screens/results/ResultsScreen.tsx`, `src/components/results/*`.
- Services: `src/services/api/*`, `src/services/ocr/*`, `src/services/cache/*`.
- Theme: `src/theme/*`.

Coordination Log
- 2025-09-05: Summarized and pruned CONTEXT.md (removed outdated details, resolved conflicts favoring latest code). Verified: onboarding is 4-step; theme palette matches `src/theme/index.ts`; Gemini service present; no global CLI install guidance.
- 2025-09-05: Added maintenance rules, cross-links, and templates to AGENTS.md; added PR template enforcing CONTEXT updates. Files: `AGENTS.md`, `.github/pull_request_template.md`, `CONTEXT.md` (cross-link + template).
 - 2025-09-05: Added developer/user README with setup, scripts, env, structure, and links. Files: `README.md`.
- 2025-09-05: Recents now use real cached analyses from AsyncStorage (keys `wcie_cache_*` via secureGeminiService); removed mock fallback and wired tap to open `Results` with cached analysis. Files: `src/components/common/RecentActivity.tsx`, `src/components/common/recentActivityUtils.ts`, `src/components/common/__tests__/recentActivityUtils.test.ts`. Notes: falls back to legacy `cached_analyses` array if present.
- 2025-09-05: Saving analyses to Recents. ResultsScreen persists successful analyses to AsyncStorage under `wcie_cache_*` with metadata `{ inputType, source }`; RecentActivity reads metadata to show correct icon/title and also reads legacy `menu_analysis_cache_*` keys from SecureGeminiService. Files: `src/services/cache/recentCache.ts`, `src/screens/results/ResultsScreen.tsx`, `src/components/common/RecentActivity.tsx`.
- 2025-09-05: Added tests for RecentActivity rendering from AsyncStorage (new prefix, legacy prefix, and `cached_analyses` fallback) and utility tests. Files: `src/components/common/__tests__/RecentActivity.test.tsx`, `src/components/common/__tests__/recentActivityUtils.test.tsx`.
- 2025-09-05: Implemented URL/Text analysis flows. ResultsScreen now fetches URL content and parses menu text into items, then calls `geminiService.analyzeMenu`; also parses direct text input. Saves results to Recents with metadata. Files: `src/screens/results/ResultsScreen.tsx`, `src/services/menu/menuInputService.ts`, tests in `src/services/menu/__tests__/menuInputService.test.ts`.
- 2025-09-06: Settings redesigned to manage only Dietary Preferences (Vegan/Vegetarian/Custom + custom restrictions). Removed haptics/high-contrast/text-size from UI. Files: `src/screens/settings/SettingsScreen.tsx`. Notes: onboarding still seeds `user_settings` minimally; app no longer reads them on Home.
- 2025-09-06: Recent Activity full screen added and wired from Home widget “View All”. Reads both `wcie_cache_*` and `menu_analysis_cache_*`. Files: `src/screens/main/RecentActivityScreen.tsx`, `App.tsx`, `src/components/common/RecentActivity.tsx`, `src/types/index.ts`.
- 2025-09-06: Camera now loads `user_preferences` from AsyncStorage (removed TODO fallback). Files: `src/screens/camera/CameraScreen.tsx`.
- 2025-09-06: Flat UI refresh (phase 1). Results screen redesigned to iOS‑leaning flat layout: large progress ring, semantic pills, and row list (no cards). New primitives `Pill`, `AccentButton`, `ProgressRing`. Home tweaks: preferences pill + inline URL/Text buttons. Settings screen now uses pill toggles and outlined custom text box. Added dependency `react-native-svg` for progress ring. Files: `src/screens/results/ResultsScreen.tsx`, `src/components/results/ResultsSummaryFlat.tsx`, `src/components/results/CategorySectionFlat.tsx`, `src/components/results/ResultRow.tsx`, `src/components/results/ProgressRing.tsx`, `src/components/ui/Pill.tsx`, `src/components/ui/AccentButton.tsx`, `src/screens/main/HomeScreen.tsx`, `src/screens/settings/SettingsScreen.tsx`, `docs/design-system.md`, `package.json`.
- 2025-09-06: Results UI polish 2. Category sections now have faint tinted backgrounds (even lighter for better contrast with count pill); larger category titles; removed per‑row emojis. Also fixed sort button clipping on iOS. Files: `src/components/results/CategorySectionFlat.tsx`, `src/components/results/ResultRow.tsx`, `src/components/results/FilterBar.tsx`.

How To Update This Document
- Keep this summary tight; link to code/docs for detail.
- When updating functionality, adjust only the relevant bullets and add a brief, dated entry under “Coordination Log”.
- Verify claims against code before editing; when in doubt, prefer current code behavior.
- Cross-link: see `AGENTS.md` for the full working rules and commit/PR checklists.

Coordination Entry Template
- YYYY-MM-DD: Short description of change; Files: `path/one`, `path/two`. Notes: one line if needed.
