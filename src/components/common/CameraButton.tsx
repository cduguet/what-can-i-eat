import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Icon, Card } from 'react-native-paper';
import * as Haptics from 'expo-haptics';

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
  const handlePress = async () => {
    if (!disabled) {
      // Provide haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

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
                color={disabled ? '#CCCCCC' : '#FFFFFF'}
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

const styles = StyleSheet.create({
  touchable: {
    marginVertical: 8,
  },
  disabledTouchable: {
    opacity: 0.6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#006064',
  },
  disabledCard: {
    borderColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
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
    backgroundColor: '#006064',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#006064',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledIconBackground: {
    backgroundColor: '#E0E0E0',
    shadowOpacity: 0,
    elevation: 0,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    fontWeight: 'bold',
    color: '#006064',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  hintContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    width: '100%',
  },
  hint: {
    color: '#999999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  disabledText: {
    color: '#CCCCCC',
  },
});