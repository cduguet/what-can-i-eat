/**
 * Theme Provider Component
 * 
 * This component provides theme context to the entire application,
 * managing theme state and providing theme switching functionality.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider as PaperProvider } from 'react-native-paper';
import { Theme, ThemeMode, ThemeContextValue } from './types';
import { lightTheme, darkTheme } from './index';

/**
 * Storage key for persisting theme preference
 */
const THEME_STORAGE_KEY = '@what-can-i-eat:theme-mode';

/**
 * Theme Context
 */
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Custom hook to use theme context
 */
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Theme Provider Props
 */
interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
  followSystemTheme?: boolean;
}

/**
 * Theme Provider Component
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultMode = 'light',
  followSystemTheme = true,
}) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>(defaultMode);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load saved theme preference on mount
   */
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
          setThemeMode(savedTheme as ThemeMode);
        } else if (followSystemTheme && systemColorScheme) {
          setThemeMode(systemColorScheme as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, [followSystemTheme, systemColorScheme]);

  /**
   * Update theme mode when system theme changes
   */
  useEffect(() => {
    if (followSystemTheme && systemColorScheme && !isLoading) {
      setThemeMode(systemColorScheme as ThemeMode);
    }
  }, [systemColorScheme, followSystemTheme, isLoading]);

  /**
   * Save theme preference
   */
  const saveThemePreference = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    saveThemePreference(newMode);
  };

  /**
   * Set specific theme mode
   */
  const setTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    saveThemePreference(mode);
  };

  /**
   * Get current theme object
   */
  const theme: Theme = themeMode === 'light' ? lightTheme : darkTheme;

  /**
   * Create Paper theme configuration
   */
  const paperTheme = {
    ...theme,
    dark: themeMode === 'dark',
    mode: 'adaptive' as const,
    colors: {
      primary: theme.colors.primary,
      accent: theme.colors.accent,
      background: theme.colors.background,
      surface: theme.colors.surface,
      error: theme.colors.error,
      text: theme.colors.text,
      onSurface: theme.colors.text,
      disabled: theme.colors.disabled,
      placeholder: theme.colors.placeholder,
      backdrop: theme.colors.backdrop,
      notification: theme.colors.notification,
      // Additional Paper-specific colors
      onBackground: theme.colors.text,
      onPrimary: themeMode === 'light' ? '#ffffff' : '#000000',
      onAccent: themeMode === 'light' ? '#ffffff' : '#000000',
      onError: '#ffffff',
      // Paper v5 specific
      primaryContainer: theme.colors.primary,
      secondaryContainer: theme.colors.secondary,
      tertiaryContainer: theme.colors.accent,
      errorContainer: theme.colors.error,
      surfaceVariant: theme.colors.surface,
      outline: theme.colors.border,
      outlineVariant: theme.colors.border,
      inverseSurface: themeMode === 'light' ? theme.colors.text : theme.colors.background,
      inverseOnSurface: themeMode === 'light' ? theme.colors.background : theme.colors.text,
      inversePrimary: theme.colors.primary,
      elevation: {
        level0: 'transparent',
        level1: theme.colors.surface,
        level2: theme.colors.surface,
        level3: theme.colors.surface,
        level4: theme.colors.surface,
        level5: theme.colors.surface,
      },
      surfaceDisabled: theme.colors.disabled,
      onSurfaceDisabled: theme.colors.disabled,
      onSurfaceVariant: theme.colors.textSecondary,
    },
    fonts: {
      // Material Design 3 typography scale
      displayLarge: {
        fontFamily: theme.typography.fontFamily.regular,
        fontSize: 57,
        fontWeight: '400' as const,
        letterSpacing: 0,
        lineHeight: 64,
      },
      displayMedium: {
        fontFamily: theme.typography.fontFamily.regular,
        fontSize: 45,
        fontWeight: '400' as const,
        letterSpacing: 0,
        lineHeight: 52,
      },
      displaySmall: {
        fontFamily: theme.typography.fontFamily.regular,
        fontSize: 36,
        fontWeight: '400' as const,
        letterSpacing: 0,
        lineHeight: 44,
      },
      headlineLarge: {
        fontFamily: theme.typography.fontFamily.regular,
        fontSize: 32,
        fontWeight: '400' as const,
        letterSpacing: 0,
        lineHeight: 40,
      },
      headlineMedium: {
        fontFamily: theme.typography.fontFamily.regular,
        fontSize: 28,
        fontWeight: '400' as const,
        letterSpacing: 0,
        lineHeight: 36,
      },
      headlineSmall: {
        fontFamily: theme.typography.fontFamily.regular,
        fontSize: 24,
        fontWeight: '400' as const,
        letterSpacing: 0,
        lineHeight: 32,
      },
      titleLarge: {
        fontFamily: theme.typography.fontFamily.medium,
        fontSize: 22,
        fontWeight: '500' as const,
        letterSpacing: 0,
        lineHeight: 28,
      },
      titleMedium: {
        fontFamily: theme.typography.fontFamily.medium,
        fontSize: 16,
        fontWeight: '500' as const,
        letterSpacing: 0.15,
        lineHeight: 24,
      },
      titleSmall: {
        fontFamily: theme.typography.fontFamily.medium,
        fontSize: 14,
        fontWeight: '500' as const,
        letterSpacing: 0.1,
        lineHeight: 20,
      },
      labelLarge: {
        fontFamily: theme.typography.fontFamily.medium,
        fontSize: 14,
        fontWeight: '500' as const,
        letterSpacing: 0.1,
        lineHeight: 20,
      },
      labelMedium: {
        fontFamily: theme.typography.fontFamily.medium,
        fontSize: 12,
        fontWeight: '500' as const,
        letterSpacing: 0.5,
        lineHeight: 16,
      },
      labelSmall: {
        fontFamily: theme.typography.fontFamily.medium,
        fontSize: 11,
        fontWeight: '500' as const,
        letterSpacing: 0.5,
        lineHeight: 16,
      },
      bodyLarge: {
        fontFamily: theme.typography.fontFamily.regular,
        fontSize: 16,
        fontWeight: '400' as const,
        letterSpacing: 0.15,
        lineHeight: 24,
      },
      bodyMedium: {
        fontFamily: theme.typography.fontFamily.regular,
        fontSize: 14,
        fontWeight: '400' as const,
        letterSpacing: 0.25,
        lineHeight: 20,
      },
      bodySmall: {
        fontFamily: theme.typography.fontFamily.regular,
        fontSize: 12,
        fontWeight: '400' as const,
        letterSpacing: 0.4,
        lineHeight: 16,
      },
      // Legacy variants for backward compatibility
      regular: {
        fontFamily: theme.typography.fontFamily.regular,
        fontWeight: 'normal' as const,
      },
      medium: {
        fontFamily: theme.typography.fontFamily.medium,
        fontWeight: '500' as const,
      },
      light: {
        fontFamily: theme.typography.fontFamily.light,
        fontWeight: '300' as const,
      },
      thin: {
        fontFamily: theme.typography.fontFamily.light,
        fontWeight: '100' as const,
      },
    },
    animation: {
      scale: 1.0,
    },
  };

  /**
   * Context value
   */
  const contextValue: ThemeContextValue = {
    theme,
    toggleTheme,
    setTheme,
  };

  // Don't render children until theme is loaded
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      <PaperProvider theme={paperTheme}>
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
};

/**
 * HOC to inject theme props into components
 */
export function withTheme<P extends object>(
  Component: React.ComponentType<P & { theme: Theme }>
): React.FC<Omit<P, 'theme'>> {
  return (props: Omit<P, 'theme'>) => {
    const { theme } = useTheme();
    return <Component {...(props as P)} theme={theme} />;
  };
}

/**
 * Export theme hook for convenience
 */
export { Theme, ThemeMode } from './types';