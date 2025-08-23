/**
 * Theme Utility Functions
 * 
 * This file contains helper functions for theme-aware styling,
 * color manipulation, and responsive design utilities.
 */

import { StyleSheet, Dimensions, Platform, PixelRatio } from 'react-native';
import { Theme, ThemedStyleSheet, GlassEffect } from './types';

/**
 * Device dimensions
 */
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Responsive scaling utilities
 */
export const responsive = {
  /**
   * Scale based on device width (for horizontal spacing/sizing)
   */
  wp: (percentage: number): number => {
    return PixelRatio.roundToNearestPixel((screenWidth * percentage) / 100);
  },

  /**
   * Scale based on device height (for vertical spacing/sizing)
   */
  hp: (percentage: number): number => {
    return PixelRatio.roundToNearestPixel((screenHeight * percentage) / 100);
  },

  /**
   * Scale font size based on device size
   */
  fontSize: (size: number): number => {
    const scale = screenWidth / 375; // Based on iPhone 11 Pro width
    const newSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  },

  /**
   * Check if device is tablet
   */
  isTablet: (): boolean => {
    return screenWidth >= 768;
  },

  /**
   * Get orientation
   */
  isLandscape: (): boolean => {
    return screenWidth > screenHeight;
  },
};

/**
 * Create themed StyleSheet
 * This is a wrapper around StyleSheet.create that provides theme access
 */
export function createThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  stylesFn: ThemedStyleSheet<T>
): (theme: Theme) => T {
  return (theme: Theme) => StyleSheet.create(stylesFn(theme));
}

/**
 * Color manipulation utilities
 */
export const colors = {
  /**
   * Convert hex to rgba
   */
  hexToRgba: (hex: string, alpha: number = 1): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;
    
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },

  /**
   * Lighten a color
   */
  lighten: (color: string, amount: number = 0.1): string => {
    // Simple implementation - for production, consider using a color library
    if (color.startsWith('rgba')) {
      return color.replace(/[\d.]+\)$/, (match) => {
        const alpha = parseFloat(match);
        return `${Math.min(1, alpha + amount)})`;
      });
    }
    return color;
  },

  /**
   * Darken a color
   */
  darken: (color: string, amount: number = 0.1): string => {
    // Simple implementation - for production, consider using a color library
    if (color.startsWith('rgba')) {
      return color.replace(/[\d.]+\)$/, (match) => {
        const alpha = parseFloat(match);
        return `${Math.max(0, alpha - amount)})`;
      });
    }
    return color;
  },

  /**
   * Get contrast color (black or white) based on background
   */
  getContrastColor: (backgroundColor: string): string => {
    // Simple implementation - returns black or white based on background
    // For production, consider implementing proper color contrast calculation
    const isDark = backgroundColor.includes('0, 0, 0') || 
                   backgroundColor.includes('#000') ||
                   backgroundColor.includes('#331f00');
    return isDark ? '#ffffff' : '#000000';
  },
};

/**
 * Glass effect utilities
 */
export const glass = {
  /**
   * Apply glass effect styles
   */
  applyGlassEffect: (effect: GlassEffect) => {
    const styles: any = {
      backgroundColor: effect.backgroundColor,
      borderWidth: effect.borderWidth,
      borderColor: effect.borderColor,
    };

    // Add platform-specific glass effects
    if (Platform.OS === 'ios') {
      // iOS supports some blur effects through libraries
      styles.overflow = 'hidden';
    }

    // Add overlay if specified
    if (effect.overlayColor) {
      styles.overlayColor = effect.overlayColor;
    }

    return styles;
  },

  /**
   * Create glass container style
   */
  createGlassContainer: (theme: Theme, variant: 'light' | 'medium' | 'strong' = 'medium') => {
    return {
      ...glass.applyGlassEffect(theme.glass[variant]),
      borderRadius: theme.borderRadius.lg,
      ...theme.shadows.md,
    };
  },
};

/**
 * Spacing utilities
 */
export const spacing = {
  /**
   * Create padding object
   */
  padding: (theme: Theme, size: keyof Theme['spacing'], sides?: 'all' | 'horizontal' | 'vertical' | 'top' | 'bottom' | 'left' | 'right') => {
    const value = theme.spacing[size];
    
    switch (sides) {
      case 'horizontal':
        return { paddingHorizontal: value };
      case 'vertical':
        return { paddingVertical: value };
      case 'top':
        return { paddingTop: value };
      case 'bottom':
        return { paddingBottom: value };
      case 'left':
        return { paddingLeft: value };
      case 'right':
        return { paddingRight: value };
      case 'all':
      default:
        return { padding: value };
    }
  },

  /**
   * Create margin object
   */
  margin: (theme: Theme, size: keyof Theme['spacing'], sides?: 'all' | 'horizontal' | 'vertical' | 'top' | 'bottom' | 'left' | 'right') => {
    const value = theme.spacing[size];
    
    switch (sides) {
      case 'horizontal':
        return { marginHorizontal: value };
      case 'vertical':
        return { marginVertical: value };
      case 'top':
        return { marginTop: value };
      case 'bottom':
        return { marginBottom: value };
      case 'left':
        return { marginLeft: value };
      case 'right':
        return { marginRight: value };
      case 'all':
      default:
        return { margin: value };
    }
  },
};

/**
 * Typography utilities
 */
export const typography = {
  /**
   * Create text style
   */
  createTextStyle: (
    theme: Theme,
    options: {
      size?: keyof Theme['typography']['fontSize'];
      weight?: 'regular' | 'medium' | 'bold' | 'light';
      color?: string;
      align?: 'left' | 'center' | 'right' | 'justify';
      lineHeight?: keyof Theme['typography']['lineHeight'];
      letterSpacing?: keyof Theme['typography']['letterSpacing'];
    } = {}
  ) => {
    const {
      size = 'md',
      weight = 'regular',
      color = theme.colors.text,
      align,
      lineHeight = 'normal',
      letterSpacing = 'normal',
    } = options;

    return {
      fontFamily: theme.typography.fontFamily[weight],
      fontSize: theme.typography.fontSize[size],
      color,
      ...(align && { textAlign: align }),
      lineHeight: theme.typography.fontSize[size] * theme.typography.lineHeight[lineHeight],
      letterSpacing: theme.typography.letterSpacing[letterSpacing],
    };
  },

  /**
   * Create heading style
   */
  heading: (theme: Theme, level: 1 | 2 | 3 | 4 | 5 | 6) => {
    const sizeMap = {
      1: 'xxxl',
      2: 'xxl',
      3: 'xl',
      4: 'lg',
      5: 'md',
      6: 'sm',
    } as const;

    return typography.createTextStyle(theme, {
      size: sizeMap[level],
      weight: 'bold',
      lineHeight: 'tight',
    });
  },
};

/**
 * Shadow utilities
 */
export const shadows = {
  /**
   * Apply shadow based on elevation level
   */
  elevation: (theme: Theme, level: keyof Theme['shadows']) => {
    return theme.shadows[level];
  },

  /**
   * Create custom shadow
   */
  custom: (options: {
    color?: string;
    offsetX?: number;
    offsetY?: number;
    opacity?: number;
    radius?: number;
    elevation?: number;
  }) => {
    const {
      color = '#000',
      offsetX = 0,
      offsetY = 2,
      opacity = 0.2,
      radius = 2,
      elevation = 2,
    } = options;

    return {
      shadowColor: color,
      shadowOffset: { width: offsetX, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
      elevation: Platform.OS === 'android' ? elevation : undefined,
    };
  },
};

/**
 * Animation utilities
 */
export const animations = {
  /**
   * Get animation config
   */
  getConfig: (theme: Theme, type: 'fast' | 'normal' | 'slow' = 'normal') => {
    return {
      duration: theme.animation.duration[type],
      useNativeDriver: true,
    };
  },

  /**
   * Common animation presets
   */
  presets: {
    fadeIn: (theme: Theme) => ({
      from: { opacity: 0 },
      to: { opacity: 1 },
      ...animations.getConfig(theme),
    }),
    
    fadeOut: (theme: Theme) => ({
      from: { opacity: 1 },
      to: { opacity: 0 },
      ...animations.getConfig(theme),
    }),
    
    slideInUp: (theme: Theme) => ({
      from: { translateY: 100, opacity: 0 },
      to: { translateY: 0, opacity: 1 },
      ...animations.getConfig(theme),
    }),
    
    slideInDown: (theme: Theme) => ({
      from: { translateY: -100, opacity: 0 },
      to: { translateY: 0, opacity: 1 },
      ...animations.getConfig(theme),
    }),
    
    scale: (theme: Theme) => ({
      from: { scale: 0.8, opacity: 0 },
      to: { scale: 1, opacity: 1 },
      ...animations.getConfig(theme),
    }),
  },
};

/**
 * Layout utilities
 */
export const layout = {
  /**
   * Center content
   */
  center: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },

  /**
   * Row layout
   */
  row: {
    flexDirection: 'row' as const,
  },

  /**
   * Column layout
   */
  column: {
    flexDirection: 'column' as const,
  },

  /**
   * Absolute fill
   */
  absoluteFill: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  /**
   * Create flex container
   */
  flex: (value: number = 1) => ({
    flex: value,
  }),
};

/**
 * Export all utilities as a single object for convenience
 */
export const themeUtils = {
  responsive,
  colors,
  glass,
  spacing,
  typography,
  shadows,
  animations,
  layout,
  createThemedStyles,
};