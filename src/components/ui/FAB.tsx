import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme';

interface FABProps {
  onPress: () => void;
  label?: string;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  disabled?: boolean;
}

/**
 * Floating Action Button component
 * A circular button that floats above the content
 */
export const FAB: React.FC<FABProps> = ({
  onPress,
  label,
  style,
  labelStyle,
  disabled = false,
}) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        {
          backgroundColor: theme.colors.primary,
          shadowColor: theme.colors.shadow,
        },
        disabled && { opacity: 0.6 },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {label && (
        <Text
          style={[
            styles.label,
            { color: theme.colors.background },
            labelStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});