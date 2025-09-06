import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface AccentButtonProps {
  title: string;
  onPress: () => void;
  color?: string; // background
  textColor?: string;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export const AccentButton: React.FC<AccentButtonProps> = ({
  title,
  onPress,
  color,
  textColor,
  disabled,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();
  const bg = color ?? theme.colors.primary;
  const fg = textColor ?? theme.colors.surface;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles(theme).button, { backgroundColor: bg, opacity: disabled ? 0.6 : 1 }, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
    >
      <Text style={[styles(theme).label, { color: fg }, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = (theme: any) => StyleSheet.create({
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 16,
  },
});

export default AccentButton;

