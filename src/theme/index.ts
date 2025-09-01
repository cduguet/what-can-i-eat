/**
 * Theme Configuration
 * 
 * Main theme configuration file implementing the Liquid Glass visual style.
 * This file defines both light and dark theme variants with the specified color palette.
 */

import { Platform } from 'react-native';
import { 
  Theme, 
  ThemeMode, 
  ColorPalette, 
  Typography, 
  Spacing, 
  BorderRadius, 
  Shadows, 
  Animation, 
  GlassEffects 
} from './types';

/**
 * Liquid Glass color palette - Light mode
 */
const lightColors: ColorPalette = {
  // Core brand colors (modernized palette)
  primary: '#14B8A6',      // Teal 500
  secondary: '#F59E0B',    // Amber 500
  accent: '#22D3EE',       // Cyan 400

  // Base colors
  background: '#F8FAFC',   // Slate 50
  surface: '#FFFFFF',      // White surface
  text: '#0F172A',         // Slate 900
  textSecondary: '#475569', // Slate 600

  // UI colors
  border: '#E2E8F0',       // Slate 200
  error: '#EF4444',
  warning: '#F59E0B',
  success: '#22C55E',
  info: '#3B82F6',
  disabled: 'rgba(15, 23, 42, 0.38)',
  placeholder: 'rgba(15, 23, 42, 0.54)',
  backdrop: 'rgba(2, 6, 23, 0.5)',
  notification: '#F43F5E',

  // Semantic colors for food categorization (modern, accessible)
  semantic: {
    safe: '#22C55E',        // Green 500
    caution: '#F59E0B',     // Amber 500
    avoid: '#EF4444',       // Red 500
    safeLight: '#DCFCE7',   // Green 100
    cautionLight: '#FEF3C7', // Amber 100
    avoidLight: '#FEE2E2',  // Red 100
  },

  // Glass effect colors
  glass: {
    tint: 'rgba(255, 255, 255, 0.7)',
    blur: 'rgba(248, 250, 252, 0.8)',
    overlay: 'rgba(255, 255, 255, 0.08)',
    shimmer: 'rgba(255, 255, 255, 0.25)',
  },
};

/**
 * Liquid Glass color palette - Dark mode
 */
const darkColors: ColorPalette = {
  // Core brand colors (brightened for dark surfaces)
  primary: '#2DD4BF',      // Teal 400
  secondary: '#F59E0B',    // Amber 500
  accent: '#22D3EE',       // Cyan 400

  // Base colors
  background: '#0B1220',   // Deep navy/ink
  surface: '#111827',      // Gray 900
  text: '#E5E7EB',         // Gray 200
  textSecondary: '#94A3B8', // Gray 400

  // UI colors
  border: 'rgba(229, 231, 235, 0.12)',
  error: '#F87171',
  warning: '#F59E0B',
  success: '#34D399',
  info: '#60A5FA',
  disabled: 'rgba(229, 231, 235, 0.38)',
  placeholder: 'rgba(229, 231, 235, 0.54)',
  backdrop: 'rgba(0, 0, 0, 0.7)',
  notification: '#FB7185',

  // Semantic colors for food categorization (dark-optimized)
  semantic: {
    safe: '#34D399',        // Green 400
    caution: '#F59E0B',     // Amber 500
    avoid: '#F87171',       // Red 400
    safeLight: '#14532D',   // Dark green overlay
    cautionLight: '#78350F', // Dark amber overlay
    avoidLight: '#7F1D1D',  // Dark red overlay
  },

  // Glass effect colors
  glass: {
    tint: 'rgba(0, 0, 0, 0.45)',
    blur: 'rgba(11, 18, 32, 0.75)',
    overlay: 'rgba(255, 255, 255, 0.06)',
    shimmer: 'rgba(255, 255, 255, 0.12)',
  },
};

/**
 * Typography configuration
 */
const typography: Typography = {
  fontFamily: {
    regular: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }) as string,
    medium: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
      default: 'System',
    }) as string,
    bold: Platform.select({
      ios: 'System',
      android: 'Roboto-Bold',
      default: 'System',
    }) as string,
    light: Platform.select({
      ios: 'System',
      android: 'Roboto-Light',
      default: 'System',
    }) as string,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
};

/**
 * Spacing scale
 */
const spacing: Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

/**
 * Border radius scale
 */
const borderRadius: BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  full: 9999,
};

/**
 * Shadow definitions
 */
const shadows: Shadows = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 8,
  },
};

/**
 * Animation configuration
 */
const animation: Animation = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

/**
 * Glass morphism effects for light theme
 * Note: React Native doesn't support backdropFilter, so we simulate glass effects
 * with semi-transparent backgrounds and borders
 */
const lightGlassEffects: GlassEffects = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    blurAmount: 10,
    overlayColor: 'rgba(255, 255, 255, 0.1)',
  },
  medium: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    blurAmount: 20,
    overlayColor: 'rgba(255, 255, 255, 0.15)',
  },
  strong: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    blurAmount: 30,
    overlayColor: 'rgba(255, 255, 255, 0.2)',
  },
};

/**
 * Glass morphism effects for dark theme
 */
const darkGlassEffects: GlassEffects = {
  light: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    blurAmount: 10,
    overlayColor: 'rgba(0, 0, 0, 0.1)',
  },
  medium: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    blurAmount: 20,
    overlayColor: 'rgba(0, 0, 0, 0.15)',
  },
  strong: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    blurAmount: 30,
    overlayColor: 'rgba(0, 0, 0, 0.2)',
  },
};

/**
 * Create theme object
 */
const createTheme = (mode: ThemeMode): Theme => ({
  mode,
  colors: mode === 'light' ? lightColors : darkColors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animation,
  glass: mode === 'light' ? lightGlassEffects : darkGlassEffects,
});

/**
 * Exported themes
 */
export const lightTheme = createTheme('light');
export const darkTheme = createTheme('dark');

/**
 * Default theme
 */
export const defaultTheme = lightTheme;

/**
 * Theme creator function for custom themes
 */
export const createCustomTheme = (
  mode: ThemeMode,
  customColors?: Partial<ColorPalette>,
  customTypography?: Partial<Typography>,
  customSpacing?: Partial<Spacing>,
  customBorderRadius?: Partial<BorderRadius>,
  customShadows?: Partial<Shadows>,
  customAnimation?: Partial<Animation>,
  customGlass?: Partial<GlassEffects>
): Theme => {
  const baseTheme = createTheme(mode);
  
  return {
    ...baseTheme,
    colors: { ...baseTheme.colors, ...customColors },
    typography: { ...baseTheme.typography, ...customTypography },
    spacing: { ...baseTheme.spacing, ...customSpacing },
    borderRadius: { ...baseTheme.borderRadius, ...customBorderRadius },
    shadows: { ...baseTheme.shadows, ...customShadows },
    animation: { ...baseTheme.animation, ...customAnimation },
    glass: { ...baseTheme.glass, ...customGlass },
  };
};
