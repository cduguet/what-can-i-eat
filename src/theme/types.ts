/**
 * Theme Type Definitions
 * 
 * This file contains all TypeScript interfaces and types for the theme system.
 * It provides strong typing for the Liquid Glass visual style theme configuration.
 */

import { TextStyle, ViewStyle } from 'react-native';

/**
 * Color palette for the Liquid Glass theme
 */
export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
  disabled: string;
  placeholder: string;
  backdrop: string;
  notification: string;
  
  // Semantic colors for food categorization
  semantic: {
    safe: string;
    caution: string;
    avoid: string;
    safeLight: string;
    cautionLight: string;
    avoidLight: string;
  };
  
  // Glass effect colors
  glass: {
    tint: string;
    blur: string;
    overlay: string;
    shimmer: string;
  };
}

/**
 * Typography configuration
 */
export interface Typography {
  fontFamily: {
    regular: string;
    medium: string;
    bold: string;
    light: string;
  };
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  letterSpacing: {
    tight: number;
    normal: number;
    wide: number;
  };
}

/**
 * Spacing configuration
 */
export interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
}

/**
 * Border radius configuration
 */
export interface BorderRadius {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

/**
 * Shadow configuration for elevation
 */
export interface Shadows {
  none: ViewStyle;
  sm: ViewStyle;
  md: ViewStyle;
  lg: ViewStyle;
  xl: ViewStyle;
}

/**
 * Animation configuration
 */
export interface Animation {
  duration: {
    fast: number;
    normal: number;
    slow: number;
  };
  easing: {
    linear: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
  };
}

/**
 * Glass morphism effects
 * Note: backdropFilter is not supported in React Native,
 * so we use alternative properties to achieve glass effects
 */
export interface GlassEffect {
  backgroundColor: string;
  borderWidth: number;
  borderColor: string;
  // Additional properties for custom glass implementation
  blurAmount?: number;
  overlayColor?: string;
}

export interface GlassEffects {
  light: GlassEffect;
  medium: GlassEffect;
  strong: GlassEffect;
}

/**
 * Theme mode
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Complete theme interface
 */
export interface Theme {
  mode: ThemeMode;
  colors: ColorPalette;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadows: Shadows;
  animation: Animation;
  glass: GlassEffects;
}

/**
 * Theme context value
 */
export interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

/**
 * Style sheet factory function type
 */
export type ThemedStyleSheet<T> = (theme: Theme) => T;

/**
 * Common component style props
 */
export interface ThemedStyleProps {
  style?: ViewStyle | TextStyle | Array<ViewStyle | TextStyle>;
  theme?: Theme;
}