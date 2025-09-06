Design System Overview

This app uses a modern, theme-driven design system built on top of React Native Paper (Material 3) and a custom Liquid Glass aesthetic. The design emphasizes clarity, accessibility, and visual warmth using teal as the primary brand color with cream and brown neutrals.

Flat iOS‑leaning Refresh (September 2025)
- Cards → Sections: we removed most heavy cards in primary flows. Use flat sections with generous spacing and light dividers. Rounded corners reserved for images, pills, and buttons.
- Large visuals: introduce a circular progress ring for results and big iconography where helpful.
- Pills everywhere: category counts, preferences, and quick filters use pill chips with semantic colors.
- Buttons: full‑width, pill‑shaped primary actions. Subtle secondary actions use neutral surfaces.
- Header bars: light, border‑bottom only; no solid brand color bars.

Key Goals
- Cohesive theming: consistent colors, spacing, and typography across all modules.
- Modern surfaces: soft elevation, rounded corners, and optional glass effects.
- Clear hierarchy: stronger headings, readable body text, and informative chips.
- Dark mode parity: all tokens work in both light and dark modes.

Modern Palette (2025 refresh)
- Light mode:
  - primary `#14B8A6`, secondary `#F59E0B`, accent `#22D3EE`
  - background `#F8FAFC`, surface `#FFFFFF`
  - text `#0F172A`, textSecondary `#475569`, border `#E2E8F0`
  - semantic: safe `#22C55E`/`#DCFCE7`, caution `#F59E0B`/`#FEF3C7`, avoid `#EF4444`/`#FEE2E2`
- Dark mode:
  - primary `#2DD4BF`, secondary `#F59E0B`, accent `#22D3EE`
  - background `#0B1220`, surface `#111827`
  - text `#E5E7EB`, textSecondary `#94A3B8`, border `rgba(229,231,235,0.12)`
  - semantic: safe `#34D399`/`#14532D`, caution `#F59E0B`/`#78350F`, avoid `#F87171`/`#7F1D1D`

Theme Tokens
- Colors: `primary`, `secondary`, `accent`, `background`, `surface`, `text`, `textSecondary`, `border`, semantic (`safe`, `caution`, `avoid` + light variants), and glass tint/overlay.
- Typography: font families (regular, medium, bold, light), sizes (`xs`…`xxxl`), line heights, and letter spacing.
- Spacing: `xs`, `sm`, `md`, `lg`, `xl`, `xxl`, `xxxl` for consistent padding/margins.
- Radius: `sm`, `md`, `lg`, `xl`, and `full` for rounded corners.
- Shadows: `sm`, `md`, `lg`, `xl` mapped to RN shadow+elevation.
- Animation: durations (`fast`, `normal`, `slow`) and easing keywords.
- Glass: `light`, `medium`, `strong` surface variants for simulated glassmorphism in RN.

Implementation Highlights
- Theme source: `src/theme/index.ts`, `src/theme/types.ts`, `src/theme/ThemeProvider.tsx`.
- Utilities: `src/theme/utils.ts` for responsive helpers and glass surface styles.
- Provider: `ThemeProvider` follows system color scheme and exposes `theme`, `toggleTheme`, `setTheme`.

Component Guidelines
- Use `useTheme()` for colors, spacing, radius, and shadows.
- Prefer theme tokens over hex values. Avoid hardcoded colors.
- Cards and surfaces: prefer flat sections. When a surface is needed, use `theme.colors.surface` with minimal or no elevation and a hairline divider.
- Chips: semantic colors for category states; white text on strong chips, dark text on light chips.
- Buttons: reserved for primary actions; avoid heavy borders; rely on color and elevation.
- Text: headings use `title*`/`headline*` variants; body copy uses `body*`; de-emphasize with `textSecondary`.

Light/Dark Mode
- Colors and glass effects adapt automatically by theme mode.
- Paper theme is synchronized inside `ThemeProvider` to ensure consistent controls and surfaces.

Recent Changes (Modernization Pass)
- Refactored to theme-driven styling:
  - `src/components/results/FilterBar.tsx`
  - `src/components/common/InputCard.tsx`
- `src/components/results/ResultsSummaryFlat.tsx` (new) replaces the old summary card with a large progress ring and pills.
- `src/components/results/CategorySectionFlat.tsx` and `ResultRow.tsx` (new) replace card‑based lists with clean rows.
- UI primitives: `src/components/ui/Pill.tsx`, `src/components/ui/AccentButton.tsx`, `src/components/results/ProgressRing.tsx`.
- Results screen refactor to flat layout: `src/screens/results/ResultsScreen.tsx`.
- Home tweaks: preferences shown as pill, inline secondary actions via pill buttons.
- Settings refresh: pill toggles for Vegan/Vegetarian/Custom and outlined text area for custom restrictions.
  - Minor polish to `src/components/common/DietaryOptionCard.tsx` and `CameraButton.tsx`
  - Added ThemeProvider to test wrappers for components relying on theme.
- Camera UI modernization:
  - `src/components/camera/CameraControls.tsx` uses theme tokens for capture button and spacing.
  - `src/components/camera/OCRProcessingIndicator.tsx` uses theme gradient and semantic colors.
- Onboarding visuals: gradient logo and themed cards in `WelcomeScreen.tsx`.
- Primitive: `src/components/common/GlassCard.tsx` for optional glassy surfaces.

Usage Examples
- Colors: `style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}`
- Spacing: `padding: theme.spacing.md` or via utilities.
- Radius: `borderRadius: theme.borderRadius.md`.
- Semantic chips: safe/caution/avoid + their light variants for states.
- Camera controls: use theme for primary capture button, keep overlay white labels for contrast.
- Gradient surfaces: `expo-linear-gradient` with `theme.colors.primary` + `theme.colors.accent`.

Next Steps (Optional)
- Introduce shared primitives (e.g., Surface, GlassCard) to reduce style duplication.
- Add subtle motion: press scale/tint and section enters with timing curves.
- Use `expo-linear-gradient` for hero sections or prominent CTAs.
