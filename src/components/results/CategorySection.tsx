/**
 * CategorySection Component
 * 
 * Organizes and displays food analysis results by category (Good/Careful/Avoid)
 * with collapsible sections, visual indicators, and accessibility support.
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, IconButton, Chip, Divider } from 'react-native-paper';
import * as Haptics from 'expo-haptics';

import { FoodAnalysisResult, FoodSuitability } from '@/types';
import { ResultCard } from './ResultCard';

interface CategorySectionProps {
  /** Category type */
  category: FoodSuitability;
  /** Results for this category */
  results: FoodAnalysisResult[];
  /** Whether section starts expanded */
  initialExpanded?: boolean;
  /** Whether to show result count */
  showCount?: boolean;
  /** Whether to show confidence scores */
  showConfidence?: boolean;
  /** Callback when a result card is pressed */
  onResultPress?: (result: FoodAnalysisResult) => void;
  /** Custom styling */
  style?: any;
}

/**
 * Get category configuration including colors, icons, and text
 */
const getCategoryConfig = (category: FoodSuitability) => {
  switch (category) {
    case FoodSuitability.GOOD:
      return {
        title: 'Safe to Eat',
        description: 'These items are safe based on your dietary preferences',
        backgroundColor: '#E8F5E8',
        headerColor: '#4CAF50',
        icon: 'check-circle',
        iconColor: '#4CAF50',
        emptyMessage: 'No safe items found in this menu.',
      };
    case FoodSuitability.CAREFUL:
      return {
        title: 'Ask Questions',
        description: 'These items need clarification from restaurant staff',
        backgroundColor: '#FFF3E0',
        headerColor: '#FF9800',
        icon: 'alert-circle',
        iconColor: '#FF9800',
        emptyMessage: 'No items requiring clarification.',
      };
    case FoodSuitability.AVOID:
      return {
        title: 'Avoid',
        description: 'These items should be avoided based on your dietary restrictions',
        backgroundColor: '#FFEBEE',
        headerColor: '#F44336',
        icon: 'close-circle',
        iconColor: '#F44336',
        emptyMessage: 'No items to avoid found.',
      };
    default:
      return {
        title: 'Unknown',
        description: 'Items with unknown suitability',
        backgroundColor: '#F5F5F5',
        headerColor: '#9E9E9E',
        icon: 'help-circle',
        iconColor: '#9E9E9E',
        emptyMessage: 'No items in this category.',
      };
  }
};

export const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  results,
  initialExpanded = true,
  showCount = true,
  showConfidence = true,
  onResultPress,
  style,
}) => {
  const [expanded, setExpanded] = useState(initialExpanded);
  const config = getCategoryConfig(category);
  const hasResults = results.length > 0;

  const handleToggleExpanded = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded(!expanded);
  };

  const handleResultPress = (result: FoodAnalysisResult) => {
    onResultPress?.(result);
  };

  return (
    <Card
      style={[
        styles.categoryCard,
        { backgroundColor: config.backgroundColor },
        style,
      ]}
      elevation={1}
    >
      {/* Category Header */}
      <Card.Content style={styles.headerContent}>
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <IconButton
                icon={config.icon}
                size={24}
                iconColor={config.iconColor}
                style={styles.categoryIcon}
              />
              <Text
                variant="titleLarge"
                style={[styles.categoryTitle, { color: config.headerColor }]}
              >
                {config.title}
              </Text>
              {showCount && hasResults && (
                <Chip
                  style={[styles.countChip, { backgroundColor: config.headerColor }]}
                  textStyle={styles.countText}
                  compact
                >
                  {results.length}
                </Chip>
              )}
            </View>
            <Text variant="bodyMedium" style={styles.categoryDescription}>
              {config.description}
            </Text>
          </View>
          
          <IconButton
            icon={expanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            iconColor={config.iconColor}
            onPress={handleToggleExpanded}
            accessibilityLabel={expanded ? `Collapse ${config.title} section` : `Expand ${config.title} section`}
          />
        </View>
      </Card.Content>

      {/* Expandable Content */}
      {expanded && (
        <>
          <Divider style={styles.headerDivider} />
          
          {hasResults ? (
            <View style={styles.resultsContainer}>
              {results.map((result, index) => (
                <ResultCard
                  key={result.itemId || `${category}-${index}`}
                  result={result}
                  showConfidence={showConfidence}
                  onPress={handleResultPress}
                  style={styles.resultCard}
                />
              ))}
            </View>
          ) : (
            <Card.Content style={styles.emptyContent}>
              <Text variant="bodyMedium" style={styles.emptyMessage}>
                {config.emptyMessage}
              </Text>
            </Card.Content>
          )}
        </>
      )}
    </Card>
  );
};

/**
 * CategorySectionList Component
 * 
 * Renders multiple category sections in a scrollable list
 */
interface CategorySectionListProps {
  /** Categorized results */
  categorizedResults: {
    good: FoodAnalysisResult[];
    careful: FoodAnalysisResult[];
    avoid: FoodAnalysisResult[];
  };
  /** Whether to show confidence scores */
  showConfidence?: boolean;
  /** Callback when a result card is pressed */
  onResultPress?: (result: FoodAnalysisResult) => void;
  /** Custom styling */
  style?: any;
}

export const CategorySectionList: React.FC<CategorySectionListProps> = ({
  categorizedResults,
  showConfidence = true,
  onResultPress,
  style,
}) => {
  return (
    <ScrollView
      style={[styles.sectionList, style]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.sectionListContent}
    >
      {/* Good Items Section */}
      <CategorySection
        category={FoodSuitability.GOOD}
        results={categorizedResults.good}
        showConfidence={showConfidence}
        onResultPress={onResultPress}
        style={styles.section}
      />

      {/* Careful Items Section */}
      <CategorySection
        category={FoodSuitability.CAREFUL}
        results={categorizedResults.careful}
        showConfidence={showConfidence}
        onResultPress={onResultPress}
        style={styles.section}
      />

      {/* Avoid Items Section */}
      <CategorySection
        category={FoodSuitability.AVOID}
        results={categorizedResults.avoid}
        showConfidence={showConfidence}
        onResultPress={onResultPress}
        style={styles.section}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  categoryCard: {
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  headerContent: {
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryIcon: {
    margin: 0,
    marginRight: 8,
  },
  categoryTitle: {
    fontWeight: '700',
    flex: 1,
  },
  countChip: {
    height: 28,
    marginLeft: 8,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryDescription: {
    color: '#616161',
    lineHeight: 18,
    marginLeft: 40, // Align with title text
  },
  headerDivider: {
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  resultsContainer: {
    paddingBottom: 8,
  },
  resultCard: {
    marginHorizontal: 0,
    marginVertical: 4,
    marginLeft: 16,
    marginRight: 16,
  },
  emptyContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptyMessage: {
    color: '#9E9E9E',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  sectionList: {
    flex: 1,
  },
  sectionListContent: {
    paddingVertical: 8,
  },
  section: {
    marginBottom: 8,
  },
});