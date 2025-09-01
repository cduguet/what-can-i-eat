import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Icon } from 'react-native-paper';
import { useTheme } from '@/theme/ThemeProvider';
import * as Haptics from 'expo-haptics';
import { MenuInputType } from '@/types';

interface InputCardProps {
  /** Type of input (URL or TEXT) */
  type: MenuInputType;
  /** Card title */
  title: string;
  /** Card description */
  description: string;
  /** Icon name for the card */
  icon: string;
  /** Callback when card is pressed */
  onPress: () => void;
  /** Whether the card is disabled */
  disabled?: boolean;
  /** Custom style for the card */
  style?: any;
}

/**
 * Input card component for secondary input options (URL and text)
 * 
 * Features:
 * - Clean card design with icon and text
 * - Visual feedback on press
 * - Haptic feedback
 * - Accessibility support
 * - Disabled state handling
 */
export const InputCard: React.FC<InputCardProps> = ({
  type,
  title,
  description,
  icon,
  onPress,
  disabled = false,
  style,
}) => {
  const { theme } = useTheme();
  const handlePress = async () => {
    if (!disabled) {
      // Provide haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const getAccessibilityLabel = () => {
    switch (type) {
      case MenuInputType.URL:
        return `${title} - Enter a restaurant website URL to analyze`;
      case MenuInputType.TEXT:
        return `${title} - Type or paste menu text to analyze`;
      default:
        return `${title} - ${description}`;
    }
  };

  const getAccessibilityHint = () => {
    switch (type) {
      case MenuInputType.URL:
        return 'Opens URL input dialog';
      case MenuInputType.TEXT:
        return 'Opens text input dialog';
      default:
        return 'Opens input dialog';
    }
  };

  const styles = createStyles(theme);

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={getAccessibilityLabel()}
      accessibilityHint={getAccessibilityHint()}
      accessibilityState={{ disabled }}
      style={[styles.touchable, disabled && styles.disabledTouchable]}
    >
      <Card
        style={[
          styles.card,
          disabled && styles.disabledCard,
          style,
        ]}
        elevation={disabled ? 1 : 3}
      >
        <Card.Content style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={[styles.iconBackground, disabled && styles.disabledIconBackground]}>
              <Icon
                source={icon}
                size={24}
                color={disabled ? theme.colors.disabled : theme.colors.primary}
              />
            </View>
          </View>
          
          <View style={styles.textContainer}>
            <Text
              variant="titleMedium"
              style={[
                styles.title,
                disabled && styles.disabledText,
              ]}
            >
              {title}
            </Text>
            <Text
              variant="bodyMedium"
              style={[
                styles.description,
                disabled && styles.disabledText,
              ]}
            >
              {description}
            </Text>
          </View>
          
          <View style={styles.arrowContainer}>
            <Icon
              source="chevron-right"
              size={20}
              color={disabled ? theme.colors.disabled : theme.colors.textSecondary}
            />
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  touchable: {
    marginVertical: 6,
  },
  disabledTouchable: {
    opacity: 0.6,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  disabledCard: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
  },
  content: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 16,
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.semantic.safeLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledIconBackground: {
    backgroundColor: theme.colors.border,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  description: {
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledText: {
    color: theme.colors.disabled,
  },
});
