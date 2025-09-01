Design System Overview

This app uses a modern, theme-driven design system built on top of React Native Paper (Material 3) and a custom Liquid Glass aesthetic. The design emphasizes clarity, accessibility, and visual warmth using teal as the primary brand color with cream and brown neutrals.

Key Goals
- Cohesive theming: consistent colors, spacing, and typography across all modules.
- Modern surfaces: soft elevation, rounded corners, and optional glass effects.
- Clear hierarchy: stronger headings, readable body text, and informative chips.
- Dark mode parity: all tokens work in both light and dark modes.

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
- Cards and surfaces: use `theme.colors.surface` + `theme.colors.border`, rounded corners from `theme.borderRadius`, and appropriate `elevation`.
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
  - `src/components/results/ResultsSummary.tsx`
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
