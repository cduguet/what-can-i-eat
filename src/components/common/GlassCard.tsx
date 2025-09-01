import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { glass } from '@/theme/utils';

interface GlassCardProps {
  children: React.ReactNode;
  /** glass strength: light | medium | strong */
  variant?: 'light' | 'medium' | 'strong';
  style?: ViewStyle | ViewStyle[];
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, variant = 'medium', style }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme, variant);
  return <View style={[styles.container, style]}>{children}</View>;
};

const createStyles = (theme: any, variant: 'light' | 'medium' | 'strong') =>
  StyleSheet.create({
    container: {
      ...glass.createGlassContainer(theme, variant),
      padding: theme.spacing.md,
    },
  });

