/**
 * ResultsSummary Component
 * 
 * Displays statistical summary and overview of analysis results including
 * total items, category breakdown, safety percentage, and confidence metrics.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, ProgressBar, Chip } from 'react-native-paper';

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
const getSafetyConfig = (safetyPercentage: number) => {
  if (safetyPercentage >= 70) {
    return {
      status: 'Great Options',
      color: '#4CAF50',
      backgroundColor: '#E8F5E8',
      description: 'This menu has many safe options for you',
    };
  } else if (safetyPercentage >= 40) {
    return {
      status: 'Some Options',
      color: '#FF9800',
      backgroundColor: '#FFF3E0',
      description: 'This menu has some options, but ask questions',
    };
  } else {
    return {
      status: 'Limited Options',
      color: '#F44336',
      backgroundColor: '#FFEBEE',
      description: 'This menu has limited safe options',
    };
  }
};

/**
 * Get confidence level text and color
 */
const getConfidenceConfig = (confidence: number) => {
  if (confidence >= 0.8) {
    return {
      level: 'High Confidence',
      color: '#4CAF50',
      description: 'Very reliable analysis',
    };
  } else if (confidence >= 0.6) {
    return {
      level: 'Medium Confidence',
      color: '#FF9800',
      description: 'Generally reliable analysis',
    };
  } else {
    return {
      level: 'Lower Confidence',
      color: '#F44336',
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
  const summary = calculateSummary(results);
  const safetyConfig = getSafetyConfig(summary.safetyPercentage);
  const confidenceConfig = getConfidenceConfig(summary.averageConfidence);

  if (summary.totalItems === 0) {
    return (
      <Card style={[styles.summaryCard, style]} elevation={2}>
        <Card.Content style={styles.emptyContent}>
          <Text variant="titleMedium" style={styles.emptyTitle}>
            No Results
          </Text>
          <Text variant="bodyMedium" style={styles.emptyDescription}>
            No menu items were found to analyze. Try taking a clearer photo or entering text manually.
          </Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={[styles.summaryCard, style]} elevation={2}>
      <Card.Content style={styles.content}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.title}>
            Analysis Summary
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {summary.totalItems} item{summary.totalItems !== 1 ? 's' : ''} analyzed
          </Text>
        </View>

        {/* Safety Overview */}
        <View style={[styles.safetySection, { backgroundColor: safetyConfig.backgroundColor }]}>
          <View style={styles.safetyHeader}>
            <Text variant="titleMedium" style={[styles.safetyStatus, { color: safetyConfig.color }]}>
              {safetyConfig.status}
            </Text>
            <Text variant="headlineSmall" style={[styles.safetyPercentage, { color: safetyConfig.color }]}>
              {summary.safetyPercentage}%
            </Text>
          </View>
          <Text variant="bodyMedium" style={styles.safetyDescription}>
            {safetyConfig.description}
          </Text>
          
          {/* Progress Bar */}
          <ProgressBar
            progress={summary.safetyPercentage / 100}
            color={safetyConfig.color}
            style={styles.progressBar}
          />
        </View>

        {/* Category Breakdown */}
        {showDetails && (
          <View style={styles.breakdownSection}>
            <Text variant="titleMedium" style={styles.breakdownTitle}>
              Category Breakdown
            </Text>
            <View style={styles.categoryChips}>
              <Chip
                icon="check-circle"
                style={[styles.categoryChip, styles.goodChip]}
                textStyle={styles.chipText}
                compact
              >
                {summary.counts.good} Safe
              </Chip>
              <Chip
                icon="alert-circle"
                style={[styles.categoryChip, styles.carefulChip]}
                textStyle={styles.chipText}
                compact
              >
                {summary.counts.careful} Ask
              </Chip>
              <Chip
                icon="close-circle"
                style={[styles.categoryChip, styles.avoidChip]}
                textStyle={styles.chipText}
                compact
              >
                {summary.counts.avoid} Avoid
              </Chip>
            </View>
          </View>
        )}

        {/* Confidence Section */}
        {showConfidence && (
          <View style={styles.confidenceSection}>
            <View style={styles.confidenceHeader}>
              <Text variant="titleMedium" style={styles.confidenceTitle}>
                Analysis Confidence
              </Text>
              <Chip
                style={[styles.confidenceChip, { backgroundColor: confidenceConfig.color }]}
                textStyle={styles.confidenceChipText}
                compact
              >
                {Math.round(summary.averageConfidence * 100)}%
              </Chip>
            </View>
            <Text variant="bodySmall" style={styles.confidenceDescription}>
              {confidenceConfig.description}
            </Text>
          </View>
        )}

        {/* Quick Tips */}
        <View style={styles.tipsSection}>
          <Text variant="labelLarge" style={styles.tipsTitle}>
            💡 Quick Tips
          </Text>
          <View style={styles.tipsList}>
            {summary.counts.careful > 0 && (
              <Text variant="bodySmall" style={styles.tipText}>
                • Ask staff about ingredients for "Ask Questions" items
              </Text>
            )}
            {summary.counts.avoid > 0 && (
              <Text variant="bodySmall" style={styles.tipText}>
                • Double-check "Avoid" items with restaurant staff
              </Text>
            )}
            {summary.averageConfidence < 0.7 && (
              <Text variant="bodySmall" style={styles.tipText}>
                • Consider retaking photo for better text clarity
              </Text>
            )}
            <Text variant="bodySmall" style={styles.tipText}>
              • Always inform staff about your dietary restrictions
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
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
    color: '#424242',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyDescription: {
    color: '#757575',
    textAlign: 'center',
    lineHeight: 20,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    color: '#212121',
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#757575',
  },
  safetySection: {
    padding: 16,
    borderRadius: 8,
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
    color: '#616161',
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
    color: '#424242',
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
  goodChip: {
    backgroundColor: '#4CAF50',
  },
  carefulChip: {
    backgroundColor: '#FF9800',
  },
  avoidChip: {
    backgroundColor: '#F44336',
  },
  chipText: {
    color: '#FFFFFF',
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
    color: '#424242',
    fontWeight: '600',
  },
  confidenceChip: {
    height: 28,
  },
  confidenceChipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  confidenceDescription: {
    color: '#757575',
  },
  tipsSection: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#006064',
  },
  tipsTitle: {
    color: '#424242',
    fontWeight: '600',
    marginBottom: 8,
  },
  tipsList: {
    gap: 4,
  },
  tipText: {
    color: '#616161',
    lineHeight: 16,
  },
});