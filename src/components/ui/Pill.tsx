import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, Pressable } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface PillProps {
  label: string;
  color?: string; // background color
  textColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leading?: React.ReactNode;
  onPress?: () => void;
}

export const Pill: React.FC<PillProps> = ({ label, color, textColor, style, textStyle, leading, onPress }) => {
  const { theme } = useTheme();
  const bg = color ?? theme.colors.border;
  const fg = textColor ?? theme.colors.text;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles(theme).pill,
          { backgroundColor: bg, opacity: pressed ? 0.9 : 1 },
          style,
        ]}
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={8}
      >
        {leading && <View style={styles(theme).leading}>{leading}</View>}
        <Text style={[styles(theme).label, { color: fg }, textStyle]}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <View
      style={[styles(theme).pill, { backgroundColor: bg }, style]}
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
