import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface PillProps {
  label: string;
  color?: string; // background color
  textColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leading?: React.ReactNode;
}

export const Pill: React.FC<PillProps> = ({ label, color, textColor, style, textStyle, leading }) => {
  const { theme } = useTheme();
  const bg = color ?? theme.colors.border;
  const fg = textColor ?? theme.colors.text;

  return (
    <View style={[styles(theme).pill, { backgroundColor: bg }, style]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      {leading && <View style={styles(theme).leading}>{leading}</View>}
      <Text style={[styles(theme).label, { color: fg }, textStyle]}>{label}</Text>
    </View>
  );
};

const styles = (theme: any) => StyleSheet.create({
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
  },
  leading: {
    marginRight: 6,
  },
  label: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 12,
  },
});

export default Pill;

