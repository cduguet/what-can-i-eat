import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Icon } from 'react-native-paper';
import { DietaryType } from '@/types';

interface DietaryOptionCardProps {
  /** Type of dietary option */
  type: DietaryType;
  /** Whether this option is selected */
  selected: boolean;
  /** Callback when option is pressed */
  onPress: (type: DietaryType) => void;
  /** Optional custom title */
  title?: string;
  /** Optional custom description */
  description?: string;
  /** Optional custom icon */
  icon?: string;
  /** Whether the card is disabled */
  disabled?: boolean;
}

/**
 * Card component for selecting dietary restrictions
 * Provides visual feedback for selection state
 */
export const DietaryOptionCard: React.FC<DietaryOptionCardProps> = ({
  type,
  selected,
  onPress,
  title,
  description,
  icon,
  disabled = false,
}) => {
  const getDefaultContent = (dietaryType: DietaryType) => {
    switch (dietaryType) {
      case DietaryType.VEGAN:
        return {
          title: 'Vegan',
          description: 'No animal products including dairy, eggs, or honey',
          icon: 'leaf',
        };
      case DietaryType.VEGETARIAN:
        return {
          title: 'Vegetarian',
          description: 'No meat or fish, but dairy and eggs are okay',
          icon: 'food-apple',
        };
      case DietaryType.CUSTOM:
        return {
          title: 'Custom',
          description: 'Define your own dietary restrictions',
          icon: 'pencil',
        };
      default:
        return {
          title: 'Unknown',
          description: 'Unknown dietary type',
          icon: 'help-circle',
        };
    }
  };

  const defaultContent = getDefaultContent(type);
  const cardTitle = title || defaultContent.title;
  const cardDescription = description || defaultContent.description;
  const cardIcon = icon || defaultContent.icon;

  const handlePress = () => {
    if (!disabled) {
      onPress(type);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${cardTitle} dietary option`}
      accessibilityHint={selected ? 'Currently selected' : 'Tap to select'}
      accessibilityState={{ selected, disabled }}
    >
      <Card
        style={[
          styles.card,
          selected && styles.selectedCard,
          disabled && styles.disabledCard,
        ]}
        elevation={selected ? 4 : 2}
      >
        <Card.Content style={styles.content}>
          <View style={styles.header}>
            <Icon
              source={cardIcon}
              size={32}
              color={selected ? '#006064' : '#666666'}
            />
            {selected && (
              <View style={styles.checkIcon}>
                <Icon
                  source="check-circle"
                  size={24}
                  color="#006064"
                />
              </View>
            )}
          </View>
          <Text
            variant="titleMedium"
            style={[
              styles.title,
              selected && styles.selectedTitle,
              disabled && styles.disabledText,
            ]}
          >
            {cardTitle}
          </Text>
          <Text
            variant="bodyMedium"
            style={[
              styles.description,
              disabled && styles.disabledText,
            ]}
          >
            {cardDescription}
          </Text>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#006064',
    backgroundColor: '#F0F9FF',
  },
  disabledCard: {
    opacity: 0.6,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkIcon: {
    marginLeft: 8,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#212121',
  },
  selectedTitle: {
    color: '#006064',
  },
  description: {
    color: '#666666',
    lineHeight: 20,
  },
  disabledText: {
    color: '#CCCCCC',
  },
});