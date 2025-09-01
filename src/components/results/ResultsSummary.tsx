/**
 * ResultsSummary Component
 * 
 * Displays statistical summary and overview of analysis results including
 * total items, category breakdown, safety percentage, and confidence metrics.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, ProgressBar, Chip } from 'react-native-paper';
import { useTheme } from '@/theme/ThemeProvider';

import { FoodAnalysisResult, FoodSuitability, ResultsSummary as ResultsSummaryType } from '@/types';

interface ResultsSummaryProps {
  /** Analysis results to summarize */
  results: FoodAnalysisResult[];
  /** Custom styling */
  style?: any;
  /** Whether to show detailed breakdown */
  showDetails?: boolean;
  /** Whether to show confidence metrics */
  showConfidence?: boolean;
}

/**
 * Calculate summary statistics from results
 */
const calculateSummary = (results: FoodAnalysisResult[]): ResultsSummaryType => {
  const totalItems = results.length;
  
  const counts = {
    good: results.filter(r => r.suitability === FoodSuitability.GOOD).length,
    careful: results.filter(r => r.suitability === FoodSuitability.CAREFUL).length,
    avoid: results.filter(r => r.suitability === FoodSuitability.AVOID).length,
  };

  const safetyPercentage = totalItems > 0 
    ? Math.round((counts.good / totalItems) * 100)
    : 0;

  const averageConfidence = totalItems > 0
    ? results.reduce((sum, result) => sum + result.confidence, 0) / totalItems
    : 0;

  return {
    totalItems,
    counts,
    safetyPercentage,
    averageConfidence,
  };
};

/**
 * Get safety status configuration
 */
const getSafetyConfig = (safetyPercentage: number, colors: any) => {
  if (safetyPercentage >= 70) {
    return {
      status: 'Great Options',
      color: colors.semantic.safe,
      backgroundColor: colors.semantic.safeLight,
      description: 'This menu has many safe options for you',
    };
  } else if (safetyPercentage >= 40) {
    return {
      status: 'Some Options',
      color: colors.semantic.caution,
      backgroundColor: colors.semantic.cautionLight,
      description: 'This menu has some options, but ask questions',
    };
  } else {
    return {
      status: 'Limited Options',
      color: colors.semantic.avoid,
      backgroundColor: colors.semantic.avoidLight,
      description: 'This menu has limited safe options',
    };
  }
};

/**
 * Get confidence level text and color
 */
const getConfidenceConfig = (confidence: number, colors: any) => {
  if (confidence >= 0.8) {
    return {
      level: 'High Confidence',
      color: colors.semantic.safe,
      description: 'Very reliable analysis',
    };
  } else if (confidence >= 0.6) {
    return {
      level: 'Medium Confidence',
      color: colors.semantic.caution,
      description: 'Generally reliable analysis',
    };
  } else {
    return {
      level: 'Lower Confidence',
      color: colors.semantic.avoid,
      description: 'Consider double-checking with staff',
    };
  }
};

export const ResultsSummary: React.FC<ResultsSummaryProps> = ({
  results,
  style,
  showDetails = true,
  showConfidence = true,
}) => {
  const { theme } = useTheme();
  const summary = calculateSummary(results);
  const safetyConfig = getSafetyConfig(summary.safetyPercentage, theme.colors);
  const confidenceConfig = getConfidenceConfig(summary.averageConfidence, theme.colors);

  if (summary.totalItems === 0) {
    return (
      <Card style={[styles(theme).summaryCard, style]} elevation={2}>
        <Card.Content style={styles(theme).emptyContent}>
          <Text variant="titleMedium" style={styles(theme).emptyTitle}>
            No Results
          </Text>
          <Text variant="bodyMedium" style={styles(theme).emptyDescription}>
            No menu items were found to analyze. Try taking a clearer photo or entering text manually.
          </Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={[styles(theme).summaryCard, style]} elevation={2}>
      <Card.Content style={styles(theme).content}>
        {/* Header Section */}
        <View style={styles(theme).header}>
          <Text variant="titleLarge" style={styles(theme).title}>
            Analysis Summary
          </Text>
          <Text variant="bodyMedium" style={styles(theme).subtitle}>
            {summary.totalItems} item{summary.totalItems !== 1 ? 's' : ''} analyzed
          </Text>
        </View>

        {/* Safety Overview */}
        <View style={[styles(theme).safetySection, { backgroundColor: safetyConfig.backgroundColor }]}>
          <View style={styles(theme).safetyHeader}>
            <Text variant="titleMedium" style={[styles(theme).safetyStatus, { color: safetyConfig.color }]}>
              {safetyConfig.status}
            </Text>
            <Text variant="headlineSmall" style={[styles(theme).safetyPercentage, { color: safetyConfig.color }]}>
              {summary.safetyPercentage}%
            </Text>
          </View>
          <Text variant="bodyMedium" style={styles(theme).safetyDescription}>
            {safetyConfig.description}
          </Text>
          
          {/* Progress Bar */}
          <ProgressBar
            progress={summary.safetyPercentage / 100}
            color={safetyConfig.color}
            style={styles(theme).progressBar}
          />
        </View>

        {/* Category Breakdown */}
        {showDetails && (
          <View style={styles(theme).breakdownSection}>
            <Text variant="titleMedium" style={styles(theme).breakdownTitle}>
              Category Breakdown
            </Text>
            <View style={styles(theme).categoryChips}>
              <Chip
                icon="check-circle"
                style={[styles(theme).categoryChip, { backgroundColor: theme.colors.semantic.safe }]}
                textStyle={styles(theme).chipText}
                compact
              >
                {summary.counts.good} Safe
              </Chip>
              <Chip
                icon="alert-circle"
                style={[styles(theme).categoryChip, { backgroundColor: theme.colors.semantic.caution }]}
                textStyle={styles(theme).chipText}
                compact
              >
                {summary.counts.careful} Ask
              </Chip>
              <Chip
                icon="close-circle"
                style={[styles(theme).categoryChip, { backgroundColor: theme.colors.semantic.avoid }]}
                textStyle={styles(theme).chipText}
                compact
              >
                {summary.counts.avoid} Avoid
              </Chip>
            </View>
          </View>
        )}

        {/* Confidence Section */}
        {showConfidence && (
          <View style={styles(theme).confidenceSection}>
            <View style={styles(theme).confidenceHeader}>
              <Text variant="titleMedium" style={styles(theme).confidenceTitle}>
                Analysis Confidence
              </Text>
              <Chip
                style={[styles(theme).confidenceChip, { backgroundColor: confidenceConfig.color }]}
                textStyle={styles(theme).confidenceChipText}
                compact
              >
                {Math.round(summary.averageConfidence * 100)}%
              </Chip>
            </View>
            <Text variant="bodySmall" style={styles(theme).confidenceDescription}>
              {confidenceConfig.description}
            </Text>
          </View>
        )}

        {/* Quick Tips */}
        <View style={styles(theme).tipsSection}>
          <Text variant="labelLarge" style={styles(theme).tipsTitle}>
            💡 Quick Tips
          </Text>
          <View style={styles(theme).tipsList}>
            {summary.counts.careful > 0 && (
              <Text variant="bodySmall" style={styles(theme).tipText}>
                • Ask staff about ingredients for "Ask Questions" items
              </Text>
            )}
            {summary.counts.avoid > 0 && (
              <Text variant="bodySmall" style={styles(theme).tipText}>
                • Double-check "Avoid" items with restaurant staff
              </Text>
            )}
            {summary.averageConfidence < 0.7 && (
              <Text variant="bodySmall" style={styles(theme).tipText}>
                • Consider retaking photo for better text clarity
              </Text>
            )}
            <Text variant="bodySmall" style={styles(theme).tipText}>
              • Always inform staff about your dietary restrictions
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = (theme: any) => StyleSheet.create({
  summaryCard: {
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
  },
  content: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyDescription: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    color: theme.colors.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: theme.colors.textSecondary,
  },
  safetySection: {
    padding: 16,
    borderRadius: theme.borderRadius.sm,
    marginBottom: 16,
  },
  safetyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  safetyStatus: {
    fontWeight: '600',
  },
  safetyPercentage: {
    fontWeight: '700',
  },
  safetyDescription: {
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  breakdownSection: {
    marginBottom: 16,
  },
  breakdownTitle: {
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    height: 32,
  },
  chipText: {
    color: theme.colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  confidenceSection: {
    marginBottom: 16,
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  confidenceTitle: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  confidenceChip: {
    height: 28,
  },
  confidenceChipText: {
    color: theme.colors.surface,
    fontSize: 11,
    fontWeight: '600',
  },
  confidenceDescription: {
    color: theme.colors.textSecondary,
  },
  tipsSection: {
    backgroundColor: theme.mode === 'light' ? '#F8F9FA' : theme.colors.surface,
    padding: 12,
    borderRadius: theme.borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  tipsTitle: {
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipsList: {
    gap: 4,
  },
  tipText: {
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
});
