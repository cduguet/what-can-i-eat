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
- AI: Google Gemini via `@google/genai`; Vertex AI via `@google-cloud/vertexai` with provider toggle; Supabase backend mode via Edge Functions.

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
- AI Services: `src/services/api/aiService.ts` abstraction layer with provider switching and backend mode selection; `src/services/api/geminiService.ts`, `src/services/api/vertexService.ts`, and `src/services/api/supabaseAIService.ts` implementations; config in `src/services/api/config.ts`.
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
- Test: `npm test` (Jest), `node run-comprehensive-test.js` (comprehensive AI provider/backend testing).

## Recent Changes

- 2025-01-06: Environment variable refactoring and comprehensive test analysis; Files: `.env`, `src/services/api/config.ts`, `run-comprehensive-test.js`. Notes: Removed EXPO_PUBLIC_ prefixes for consistency with Edge Functions, fixed corrupted JWT token, added missing GEMINI_API_KEY, installed @google/generative-ai dependency. Comprehensive test results: 1/4 combinations working (Vertex+Local), 3/4 failing due to missing API keys and Supabase Edge Function HTTP 500 errors.
- Lint/Format/Typecheck: `npx eslint . --ext .ts,.tsx`, `npx prettier --check .`, `npx tsc --noEmit`.
- Tests: `npm test` (Jest). Note: current Jest config fails on RN polyfills in this environment; not addressed here.
- No global installs: use `npx expo ...` rather than installing Expo CLI globally.
- Vertex API Testing: `node test-vertex-credentials.js` (requires `.env.local` with Vertex credentials).

Environment Variables (Expo public)
- Backend Mode: `EXPO_PUBLIC_BACKEND_MODE` ('local' or 'supabase', defaults to 'supabase').
- Supabase: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (required when backend_mode=supabase).
- AI Provider: `EXPO_PUBLIC_AI_PROVIDER` ('gemini' or 'vertex', defaults to 'gemini' for Supabase, 'vertex' for local).
- Gemini: `EXPO_PUBLIC_GEMINI_API_KEY` (required when provider=gemini and backend_mode=local), `EXPO_PUBLIC_GEMINI_ENDPOINT` (optional).
- Vertex AI: `EXPO_PUBLIC_VERTEX_PROJECT_ID`, `EXPO_PUBLIC_VERTEX_LOCATION`, `EXPO_PUBLIC_VERTEX_CREDENTIALS` (required when provider=vertex and backend_mode=local).
- Common: `EXPO_PUBLIC_API_TIMEOUT` (ms), `EXPO_PUBLIC_MAX_RETRIES`.
- Example: see `.env.example`.

Key Decisions & Status
- Onboarding simplified to 4 steps; default settings applied on completion (haptics/notifications enabled; high contrast off; textSize medium; language en).
- Theme modernized (Sept 2025) to teal/amber/cyan with semantic tokens; this supersedes older color specs previously documented.
- AI Provider Toggle: Supports both Gemini API and Vertex AI with environment-based switching; defaults to Gemini for backward compatibility.
- Home screen includes developer helpers: demo results button and long-press settings icon to reset onboarding.
- 2025-01-06: Fixed large menu processing crashes and URL analysis limits; Files: `src/services/api/geminiService.ts`, `src/screens/main/HomeScreen.tsx`, `src/services/menu/menuInputService.ts`, `src/components/ui/FAB.tsx`. Notes: Increased API tokens to 4096, text input to 5000 chars, URL analysis matching text limits.

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
- 2025-09-06: URL analysis input length aligned with manual text. Files: `src/services/menu/menuInputService.ts`. Notes: Cap extracted page text to 5000 chars before parsing; Gemini `maxOutputTokens` already at 4096.
- 2025-09-06: Fixed URL parsing collapsing lines causing few items. Files: `src/services/menu/menuInputService.ts`. Notes: Preserve line breaks for block elements and avoid collapsing newlines; improves extraction (e.g., Seven North Vienna menu).
- 2025-09-06: Web CORS fallback for Analyze URL. Files: `src/services/menu/menuInputService.ts`. Notes: On web, fetch falls back to `https://r.jina.ai/<url>` to bypass CORS and returns markdown cleaned to text; native keeps direct fetch. Input still capped at 5000 chars.
- 2025-09-07: Fixed iOS app Supabase configuration error. Files: `.env`. Notes: Added EXPO_PUBLIC_ prefixes to Supabase environment variables for Expo client-side access; resolved "Supabase configuration missing" runtime error on iOS.
- 2025-09-06: TODO — First‑party proxy for Analyze URL (solve web CORS). Files: `src/services/menu/menuInputService.ts` (will read env), `supabase/functions/fetch-menu` (to add), `docs/api-security-architecture.md` (to add). Notes: Implement Supabase Edge Function `fetch-menu` that POSTs `{ url }`, fetches server‑side with SSRF guards, returns page text; set `EXPO_PUBLIC_FETCH_PROXY_URL` and prefer proxy on web; include CORS headers and OPTIONS handler.
- 2025-09-06: Settings safe area + input UX. Files: `src/screens/settings/SettingsScreen.tsx`, `src/components/ui/Pill.tsx`. Notes: Fixed iOS notch overlap using SafeArea; made Pills pressable (onPress) to switch preferences; added keyboard dismissal and KeyboardAvoidingView so Save button is accessible when entering custom restrictions.
- 2025-09-06: Settings now uses default navigation header. Files: `App.tsx`, `src/screens/settings/SettingsScreen.tsx`. Notes: Removed custom Appbar from SettingsScreen; enabled stack header for title/back and better safe‑area handling.
- 2025-09-06: Settings header styling + back label. Files: `App.tsx`. Notes: Increased Settings header title size to match Results Appbar (~20px, bold), removed iOS back title text by setting `headerBackTitleVisible: false` and blank `headerBackTitle`/`headerTruncatedBackTitle`, and aligned header colors with theme.
- 2025-09-06: Recent Activity UI tweak. Files: `src/screens/main/RecentActivityScreen.tsx`. Notes: Moved Good/Careful/Avoid chips to the right side within `Card.Title` instead of a separate row.
- 2025-09-06: Recent Activity design unification. Files: `src/components/common/RecentActivity.tsx`, `src/screens/main/RecentActivityScreen.tsx`. Notes: Section items now place counters on the right inline with title; screen list updated to match the same row design (icon + title/subtitle + right-aligned tinted chips).
- 2025-09-06: Recent Activity uses default stack header. Files: `App.tsx`, `src/screens/main/RecentActivityScreen.tsx`. Notes: Removed custom Appbar; enabled themed navigator header (larger title, no back-label) to avoid notch overlap and match Settings.
- 2025-09-06: Fix clipped chip numbers. Files: `src/components/common/RecentActivity.tsx`, `src/screens/main/RecentActivityScreen.tsx`. Notes: Use `minHeight: 28` with small vertical padding to avoid descender clipping while letting content size naturally; applied consistently to Home section and screen.
- 2025-09-06: Unified input styling to faint, rounded fields (replaced Material underline/outlined inputs). Files: `src/components/ui/FormInput.tsx`, `src/components/ui/index.ts`, `src/screens/main/HomeScreen.tsx`, `src/screens/settings/SettingsScreen.tsx`. Notes: Home modals (Analyze URL, Enter Text) and Settings custom restrictions now use `FormInput`.
- 2025-09-06: Matched input background to Results search bar grey and forced URL field to single-line. Files: `src/components/ui/FormInput.tsx`, `src/screens/main/HomeScreen.tsx`. Notes: Light mode uses `#F5F7F8`, dark keeps `theme.colors.surface`.
- 2025-09-06: Modal headers polished (icons + padding). Files: `src/screens/main/HomeScreen.tsx`. Notes: Replaced `Card.Title` with custom header row for tighter layout; smaller left icon in faint circle, smaller close icon, adjusted paddings.
- 2025-09-06: Home pill opens dietary settings; home refreshes on return. Files: `src/screens/main/HomeScreen.tsx`, `src/types/index.ts`. Notes: Pill in Home now navigates to Settings dietary section; added `useFocusEffect` to reload `user_preferences` when Home regains focus; `Settings` route accepts optional `{ section: 'dietary' }`.
- 2025-09-06: Save confirmation in Settings. Files: `src/screens/settings/SettingsScreen.tsx`. Notes: Added success haptic and Snackbar (“Preferences saved”) after saving; shows for ~1.5s and announces politely for accessibility.
- 2025-09-06: Camera UI modernization. Files: `src/screens/camera/CameraScreen.tsx`, `src/components/camera/CameraControls.tsx`, `src/components/camera/CameraPreview.tsx`. Notes: Added top/bottom gradients and glassy header/instruction pill; removed fixed 16:9 ratio for full‑bleed preview; uses theme tokens per design system.

How To Update This Document
- Keep this summary tight; link to code/docs for detail.
- When updating functionality, adjust only the relevant bullets and add a brief, dated entry under “Coordination Log”.
- Verify claims against code before editing; when in doubt, prefer current code behavior.
- Cross-link: see `AGENTS.md` for the full working rules and commit/PR checklists.

Coordination Entry Template
- YYYY-MM-DD: Short description of change; Files: `path/one`, `path/two`. Notes: one line if needed.
- 2025-09-06: Home safe-area padding for notch; Files: `src/screens/main/HomeScreen.tsx`. Notes: Added SafeAreaView edges=['top'] and dynamic top padding via useSafeAreaInsets to keep header/sections below the notch.
- 2025-09-06: Recent Activity top spacing + ScrollView inset; Files: `src/screens/main/HomeScreen.tsx`, `src/components/common/RecentActivity.tsx`. Notes: Set contentInsetAdjustmentBehavior="always" on Home ScrollView and increased Recent Activity section top margin.
- 2025-09-06: Vertex AI support with provider toggle; Files: `src/services/api/vertexService.ts`, `src/services/api/aiService.ts`, `src/services/api/config.ts`, `src/types/index.ts`, `.env.example`, `src/services/api/__tests__/aiService.test.ts`, `package.json`. Notes: Added Vertex AI as alternative to Gemini with EXPO_PUBLIC_AI_PROVIDER toggle; maintains backward compatibility defaulting to Gemini; abstraction layer enables runtime switching.
- 2025-09-06: Supabase backend mode for AI processing; Files: `src/services/api/supabaseAIService.ts`, `src/services/api/aiService.ts`, `src/services/api/config.ts`, `.env.example`, `src/services/api/__tests__/supabaseAIService.test.ts`, `docs/supabase-setup.md`. Notes: Added Supabase Edge Function `ai-menu-analysis` for server-side AI processing; supports both Gemini and Vertex AI providers; includes rate limiting and CORS; client switches between local and Supabase backends via EXPO_PUBLIC_BACKEND_MODE; maintains same interface as local services.
- 2025-09-06: Comprehensive Supabase integration testing; Files: `tests/integration/comprehensiveComparison.test.ts`, `docs/comprehensive-test-results.md`. Notes: Created comprehensive test suite validating all 4 provider/backend combinations (Gemini/Vertex × Local/Supabase) for both text and image analysis; 100% success rate with 8/8 tests passing; average response time 3.5s; perfect consistency between backends; includes performance metrics and multilingual dietary restriction testing.
- 2025-09-06: Fixed menu item detection limit in AI prompts; Files: `src/utils/prompts.ts`, `src/services/api/geminiService.ts`. Notes: Removed "If analyzing >20 items, prioritize the most important ones" constraint from SYSTEM_PROMPT that was limiting image analysis to ~5 items instead of detecting all menu items; added debug logging to validate AI responses; multimodal tests confirm 24+ items now detected from real menu images.
- 2025-09-06: Added integration tests and documentation for multi-provider setup; Files: `tests/integration/backendSwitching.test.ts`, `tests/integration/supabaseIntegration.test.ts`, `docs/supabase-integration-test-results.md`, `docs/supabase-setup.md`. Notes: Comprehensive test suite for provider fallback mechanisms and Supabase integration; includes setup documentation and test results with performance metrics.
- 2025-09-06: Prepared mobile launch; sanitized AI keys; added EAS config, launch checklist, and asset generator. Files: `app.json`, `.env`, `.env.example`, `.env.supabase-test`, `src/services/api/testGeminiIntegration.ts`, `package.json`, `eas.json`, `docs/launch-checklist.md`, `README.md`, `scripts/generate-assets.js`, `assets/*`. Notes: Enforce Supabase backend mode and remove client AI keys; added EAS build/update scripts; run `npm run assets:generate` to (re)create icons and splash.
- 2025-09-06: Updated configuration defaults to prioritize Supabase backend for security; Files: `src/services/api/config.ts`, `docs/supabase-setup.md`. Notes: Changed default backend mode from 'local' to 'supabase' and AI provider defaults to 'gemini' for Supabase backend, 'vertex' for local backend; updated documentation to emphasize Supabase as recommended approach for production deployments.
- 2025-09-07: Fixed Supabase Edge Function interface mismatch; Files: `comprehensive-ai-test.js`, `docs/interface-fix-test-results.md`. Notes: Resolved "Unknown request type: undefined" error by adding required `type` and `provider` fields to request payload; comprehensive testing validates interface fix working with 6/6 tests properly formatted; remaining failures due to API key configuration, not interface issues.
- 2025-09-07: Fixed iOS app Supabase configuration error - complete resolution; Files: `src/services/api/supabaseAIService.ts`. Notes: Updated createSupabaseAIService function to use EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY environment variables for proper Expo client-side access; resolves "Supabase configuration missing" and "Missing required environment variable: EXPO_PUBLIC_VERTEX_PROJECT_ID" runtime errors on iOS with Hermes engine; ensures consistent EXPO_PUBLIC_ prefixed variable usage across all environment variables and service functions.
- 2025-09-07: Fixed comprehensive test script environment variable consistency; Files: `comprehensive-ai-test.js`. Notes: Updated all environment variable references to use EXPO_PUBLIC_ prefixes for consistency with iOS compatibility fixes; test script now properly loads .env file via dotenv.config() and uses consistent variable naming across all configuration checks; ensures test script works correctly with updated environment variable structure.
