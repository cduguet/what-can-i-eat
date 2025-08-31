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
  // Core brand colors
  primary: '#008585',      // Teal - Primary brand color
  secondary: '#c7522a',    // Burnt orange - Secondary brand color
  accent: '#74a892',       // Cyan - Accent color
  
  // Base colors
  background: '#fff9de',   // Light cream background
  surface: '#ffffff',      // White surface
  text: '#331f00',         // Dark brown text
  textSecondary: '#5c4033', // Lighter brown for secondary text
  
  // UI colors
  border: 'rgba(51, 31, 0, 0.12)',
  error: '#d32f2f',
  warning: '#f57c00',
  success: '#388e3c',
  info: '#0288d1',
  disabled: 'rgba(51, 31, 0, 0.38)',
  placeholder: 'rgba(51, 31, 0, 0.54)',
  backdrop: 'rgba(0, 0, 0, 0.5)',
  notification: '#ff6b6b',
  
  // Semantic colors for food categorization (pastelized)
  semantic: {
    safe: '#81c784',        // Pastel green
    caution: '#ffb74d',     // Pastel orange/yellow
    avoid: '#e57373',       // Pastel red
    safeLight: '#c8e6c9',   // Light pastel green
    cautionLight: '#ffe0b2', // Light pastel orange
    avoidLight: '#ffcdd2',  // Light pastel red
  },
  
  // Glass effect colors
  glass: {
    tint: 'rgba(255, 255, 255, 0.7)',
    blur: 'rgba(251, 242, 196, 0.8)',
    overlay: 'rgba(255, 255, 255, 0.1)',
    shimmer: 'rgba(255, 255, 255, 0.3)',
  },
};

/**
 * Liquid Glass color palette - Dark mode
 */
const darkColors: ColorPalette = {
  // Core brand colors (adjusted for dark mode)
  primary: '#00a6a6',      // Brighter teal for dark mode
  secondary: '#e8743f',    // Brighter burnt orange
  accent: '#8fbfad',       // Adjusted cyan
  
  // Base colors
  background: '#331f00',   // Dark brown background
  surface: '#4a2f0f',      // Slightly lighter brown surface
  text: '#fbf2c4',         // Light cream text
  textSecondary: '#d4c896', // Darker cream for secondary text
  
  // UI colors
  border: 'rgba(251, 242, 196, 0.12)',
  error: '#ef5350',
  warning: '#ff9800',
  success: '#66bb6a',
  info: '#29b6f6',
  disabled: 'rgba(251, 242, 196, 0.38)',
  placeholder: 'rgba(251, 242, 196, 0.54)',
  backdrop: 'rgba(0, 0, 0, 0.7)',
  notification: '#ff8787',
  
  // Semantic colors for food categorization (adjusted for dark mode)
  semantic: {
    safe: '#66bb6a',        // Brighter green
    caution: '#ffa726',     // Brighter orange
    avoid: '#ef5350',       // Brighter red
    safeLight: '#4a7c59',   // Darker green
    cautionLight: '#b87333', // Darker orange
    avoidLight: '#a73a3a',  // Darker red
  },
  
  // Glass effect colors
  glass: {
    tint: 'rgba(0, 0, 0, 0.5)',
    blur: 'rgba(51, 31, 0, 0.8)',
    overlay: 'rgba(255, 255, 255, 0.05)',
    shimmer: 'rgba(255, 255, 255, 0.1)',
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