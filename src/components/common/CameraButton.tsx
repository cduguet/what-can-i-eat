import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Icon, Card } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/ThemeProvider';

interface CameraButtonProps {
  /** Callback when camera button is pressed */
  onPress: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Custom button text */
  buttonText?: string;
  /** Custom description text */
  description?: string;
}

/**
 * Primary camera button component for menu scanning
 * 
 * Features:
 * - Large, prominent design for primary action
 * - Camera icon and descriptive text
 * - Haptic feedback on press
 * - Accessibility support
 * - Loading and disabled states
 */
export const CameraButton: React.FC<CameraButtonProps> = ({
  onPress,
  disabled = false,
  buttonText = 'Take Photo',
  description = 'Scan a menu with your camera',
}) => {
  const { theme } = useTheme();
  const handlePress = async () => {
    if (!disabled) {
      // Provide haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  const styles = createStyles(theme);

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${buttonText} - ${description}`}
      accessibilityHint="Opens camera to scan menu items"
      accessibilityState={{ disabled }}
      style={[styles.touchable, disabled && styles.disabledTouchable]}
    >
      <Card
        style={[
          styles.card,
          disabled && styles.disabledCard,
        ]}
        elevation={disabled ? 1 : 5}
      >
        <Card.Content style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={[styles.iconBackground, disabled && styles.disabledIconBackground]}>
              <Icon
                source="camera"
                size={48}
                color={disabled ? theme.colors.disabled : theme.colors.surface}
              />
            </View>
          </View>
          
          <View style={styles.textContainer}>
            <Text
              variant="headlineSmall"
              style={[
                styles.buttonText,
                disabled && styles.disabledText,
              ]}
            >
              {buttonText}
            </Text>
            <Text
              variant="bodyLarge"
              style={[
                styles.description,
                disabled && styles.disabledText,
              ]}
            >
              {description}
            </Text>
          </View>
          
          <View style={styles.hintContainer}>
            <Text
              variant="bodySmall"
              style={[
                styles.hint,
                disabled && styles.disabledText,
              ]}
            >
              Point your camera at a menu to get started
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  touchable: {
    marginVertical: 8,
  },
  disabledTouchable: {
    opacity: 0.6,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  disabledCard: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledIconBackground: {
    backgroundColor: theme.colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  hintContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    width: '100%',
  },
  hint: {
    color: theme.colors.placeholder,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  disabledText: {
    color: theme.colors.disabled,
  },
});
