/**
 * ResultCard Component
 * 
 * Individual result card for displaying food analysis results with Material Design styling.
 * Features expandable content, color-coded categories, and accessibility support.
 */

import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Card, Text, Chip, IconButton, Divider } from 'react-native-paper';
import * as Haptics from 'expo-haptics';

import { FoodAnalysisResult, FoodSuitability } from '@/types';

interface ResultCardProps {
  /** Analysis result data */
  result: FoodAnalysisResult;
  /** Whether card starts expanded */
  initialExpanded?: boolean;
  /** Callback when card is pressed */
  onPress?: (result: FoodAnalysisResult) => void;
  /** Whether to show confidence score */
  showConfidence?: boolean;
  /** Custom styling */
  style?: any;
}

/**
 * Get color scheme based on food suitability
 */
const getSuitabilityColors = (suitability: FoodSuitability) => {
  switch (suitability) {
    case FoodSuitability.GOOD:
      return {
        backgroundColor: '#E8F5E8',
        borderColor: '#4CAF50',
        chipColor: '#4CAF50',
        icon: 'check-circle',
        iconColor: '#4CAF50',
      };
    case FoodSuitability.CAREFUL:
      return {
        backgroundColor: '#FFF3E0',
        borderColor: '#FF9800',
        chipColor: '#FF9800',
        icon: 'alert-circle',
        iconColor: '#FF9800',
      };
    case FoodSuitability.AVOID:
      return {
        backgroundColor: '#FFEBEE',
        borderColor: '#F44336',
        chipColor: '#F44336',
        icon: 'close-circle',
        iconColor: '#F44336',
      };
    default:
      return {
        backgroundColor: '#F5F5F5',
        borderColor: '#9E9E9E',
        chipColor: '#9E9E9E',
        icon: 'help-circle',
        iconColor: '#9E9E9E',
      };
  }
};

/**
 * Get suitability display text
 */
const getSuitabilityText = (suitability: FoodSuitability): string => {
  switch (suitability) {
    case FoodSuitability.GOOD:
      return 'Safe to Eat';
    case FoodSuitability.CAREFUL:
      return 'Ask Questions';
    case FoodSuitability.AVOID:
      return 'Avoid';
    default:
      return 'Unknown';
  }
};

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  initialExpanded = false,
  onPress,
  showConfidence = true,
  style,
}) => {
  const [expanded, setExpanded] = useState(initialExpanded);
  const colors = getSuitabilityColors(result.suitability);

  const handlePress = () => {
    // Haptic feedback for interaction
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setExpanded(!expanded);
    onPress?.(result);
  };

  const handleExpandPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded(!expanded);
  };

  return (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: colors.backgroundColor,
          borderLeftColor: colors.borderColor,
        },
        style,
      ]}
      elevation={2}
      accessibilityRole="button"
      accessibilityLabel={`${result.itemName}, ${getSuitabilityText(result.suitability)}`}
      accessibilityHint={expanded ? "Tap to collapse details" : "Tap to expand details"}
    >
      <Pressable onPress={handlePress} style={styles.pressable}>
        <Card.Content style={styles.cardContent}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.titleSection}>
              <Text variant="titleMedium" style={styles.itemName} numberOfLines={2}>
                {result.itemName}
              </Text>
              <View style={styles.chipContainer}>
                <Chip
                  icon={colors.icon}
                  style={[styles.suitabilityChip, { backgroundColor: colors.chipColor }]}
                  textStyle={styles.chipText}
                  compact
                >
                  {getSuitabilityText(result.suitability)}
                </Chip>
                {showConfidence && (
                  <Chip
                    style={styles.confidenceChip}
                    textStyle={styles.confidenceText}
                    compact
                  >
                    {Math.round(result.confidence * 100)}% confident
                  </Chip>
                )}
              </View>
            </View>
            <IconButton
              icon={expanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              iconColor={colors.iconColor}
              onPress={handleExpandPress}
              accessibilityLabel={expanded ? "Collapse details" : "Expand details"}
            />
          </View>

          {/* Expandable Content */}
          {expanded && (
            <>
              <Divider style={styles.divider} />
              
              {/* Explanation Section */}
              <View style={styles.explanationSection}>
                <Text variant="labelLarge" style={styles.sectionTitle}>
                  Why this recommendation?
                </Text>
                <Text variant="bodyMedium" style={styles.explanation}>
                  {result.explanation}
                </Text>
              </View>

              {/* Questions to Ask (for CAREFUL items) */}
              {result.suitability === FoodSuitability.CAREFUL && result.questionsToAsk && result.questionsToAsk.length > 0 && (
                <View style={styles.questionsSection}>
                  <Text variant="labelLarge" style={styles.sectionTitle}>
                    Questions to ask the staff:
                  </Text>
                  {result.questionsToAsk.map((question, index) => (
                    <View key={index} style={styles.questionItem}>
                      <Text variant="bodyMedium" style={styles.questionText}>
                        • {question}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Concerns Section */}
              {result.concerns && result.concerns.length > 0 && (
                <View style={styles.concernsSection}>
                  <Text variant="labelLarge" style={styles.sectionTitle}>
                    Potential concerns:
                  </Text>
                  <View style={styles.concernsContainer}>
                    {result.concerns.map((concern, index) => (
                      <Chip
                        key={index}
                        style={styles.concernChip}
                        textStyle={styles.concernText}
                        compact
                      >
                        {concern}
                      </Chip>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}
        </Card.Content>
      </Pressable>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 6,
    marginHorizontal: 16,
    borderLeftWidth: 4,
    borderRadius: 12,
  },
  pressable: {
    borderRadius: 12,
  },
  cardContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleSection: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
    lineHeight: 22,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suitabilityChip: {
    height: 28,
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  confidenceChip: {
    backgroundColor: '#E0E0E0',
    height: 28,
  },
  confidenceText: {
    color: '#616161',
    fontSize: 11,
    fontWeight: '500',
  },
  divider: {
    marginVertical: 12,
    backgroundColor: '#E0E0E0',
  },
  explanationSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#424242',
    fontWeight: '600',
    marginBottom: 6,
  },
  explanation: {
    color: '#616161',
    lineHeight: 20,
  },
  questionsSection: {
    marginBottom: 12,
  },
  questionItem: {
    marginBottom: 4,
  },
  questionText: {
    color: '#616161',
    lineHeight: 18,
    paddingLeft: 8,
  },
  concernsSection: {
    marginBottom: 4,
  },
  concernsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  concernChip: {
    backgroundColor: '#FFCDD2',
    height: 26,
  },
  concernText: {
    color: '#C62828',
    fontSize: 11,
    fontWeight: '500',
  },
});