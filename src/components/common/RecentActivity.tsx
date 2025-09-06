import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Icon, Chip, Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '@/theme/ThemeProvider';

import { RootStackParamList, CachedAnalysisResult, MenuInputType, FoodSuitability, GeminiResponse } from '@/types';
import type { AnalysisCacheEntry } from '@/services/cache/recentCache';
import { getTimeAgo, summarizeResults } from './recentActivityUtils';

type RecentActivityNavigationProp = StackNavigationProp<RootStackParamList>;

interface RecentActivityProps {
  /** Maximum number of recent items to display */
  maxItems?: number;
  /** Whether to show the "View All" button */
  showViewAll?: boolean;
}

interface RecentActivityItem {
  id: string;
  type: MenuInputType;
  title: string;
  subtitle: string;
  timestamp: string;
  resultsSummary?: {
    good: number;
    careful: number;
    avoid: number;
  };
}

/**
 * Recent activity component showing previously analyzed menus
 * 
 * Features:
 * - Display recent menu analyses
 * - Quick access to previous results
 * - Visual summary of analysis results
 * - Cached data integration
 * - Navigation to detailed results
 */
export const RecentActivity: React.FC<RecentActivityProps> = ({
  maxItems = 3,
  showViewAll = true,
}) => {
  const navigation = useNavigation<RecentActivityNavigationProp>();
  const { theme } = useTheme();
  const [recentItems, setRecentItems] = useState<RecentActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecentActivity();
  }, []);

  /**
   * Load recent activity from AsyncStorage
   */
  const loadRecentActivity = async () => {
    try {
      setIsLoading(true);
      // Prefer secure service cache entries (prefixes)
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith('wcie_cache_') || k.startsWith('menu_analysis_cache_'));

      if (cacheKeys.length > 0) {
        const entries = await AsyncStorage.multiGet(cacheKeys);
        const parsed = entries
          .map(([storageKey, value]) => {
            if (!value) return null;
            try {
              const obj = JSON.parse(value) as AnalysisCacheEntry;
              return { storageKey, ...obj };
            } catch {
              return null;
            }
          })
          .filter(Boolean) as Array<AnalysisCacheEntry & { storageKey: string }>;

        const items: RecentActivityItem[] = parsed
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, maxItems)
          .map(({ storageKey, data, timestamp, meta }) => ({
            id: storageKey,
            type: meta?.inputType ?? MenuInputType.TEXT,
            title: meta?.inputType === MenuInputType.IMAGE
              ? 'Camera Scan'
              : meta?.inputType === MenuInputType.URL
                ? 'Website Menu'
                : meta?.inputType === MenuInputType.TEXT
                  ? 'Text Analysis'
                  : 'Menu Analysis',
            subtitle: `${data.results?.length ?? 0} items analyzed • ${getTimeAgo(new Date(timestamp).toISOString())}`,
            timestamp: new Date(timestamp).toISOString(),
            resultsSummary: summarizeResults(data.results || []),
          }));

        setRecentItems(items);
        return;
      }

      // Legacy aggregated cache array (if present)
      const legacy = await AsyncStorage.getItem('cached_analyses');
      if (legacy) {
        const analyses: CachedAnalysisResult[] = JSON.parse(legacy);
        const recentAnalyses = analyses
          .sort((a, b) => new Date(b.cachedAt).getTime() - new Date(a.cachedAt).getTime())
          .slice(0, maxItems)
          .map(transformLegacyToRecentItem);
        setRecentItems(recentAnalyses);
        return;
      }

      // Nothing cached yet
      setRecentItems([]);
    } catch (error) {
      console.error('Failed to load recent activity:', error);
      setRecentItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Transform cached analysis to recent activity item
   */
  const transformLegacyToRecentItem = (analysis: CachedAnalysisResult): RecentActivityItem => {
    const resultsSummary = summarizeResults(analysis.results);
    return {
      id: analysis.key,
      type: analysis.menuInput.type,
      title: getItemTitle(analysis),
      subtitle: getItemSubtitle(analysis),
      timestamp: analysis.cachedAt,
      resultsSummary,
    };
  };

  /**
   * Get title for recent activity item
   */
  const getItemTitle = (analysis: CachedAnalysisResult): string => {
    switch (analysis.menuInput.type) {
      case MenuInputType.IMAGE:
        return 'Camera Scan';
      case MenuInputType.URL:
        return 'Website Menu';
      case MenuInputType.TEXT:
        return 'Text Analysis';
      default:
        return 'Menu Analysis';
    }
  };

  /**
   * Get subtitle for recent activity item
   */
  const getItemSubtitle = (analysis: CachedAnalysisResult): string => {
    const itemCount = analysis.results.length;
    const timeAgo = getTimeAgo(analysis.cachedAt);
    return `${itemCount} items analyzed • ${timeAgo}`;
  };

  /**
   * Get time ago string
   */
  // getTimeAgo imported from utils

  /**
   * Get sample data for demonstration
   */
  // Removed mock/sample data; show empty state when there are no cached entries

  /**
   * Handle item press
   */
  const handleItemPress = async (item: RecentActivityItem) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      // Prefer secure service cache entries
      if (item.id.startsWith('wcie_cache_')) {
        const raw = await AsyncStorage.getItem(item.id);
        if (raw) {
          const parsed = JSON.parse(raw) as { data: GeminiResponse };
          if (parsed.data) {
            navigation.navigate('Results', { analysis: parsed.data });
            return;
          }
        }
      }

      // Legacy cache array fallback: we don't have full metadata; reconstruct a minimal GeminiResponse
      const legacy = await AsyncStorage.getItem('cached_analyses');
      if (legacy) {
        const analyses: CachedAnalysisResult[] = JSON.parse(legacy);
        const match = analyses.find(a => a.key === item.id);
        if (match) {
          const response: GeminiResponse = {
            success: true,
            results: match.results,
            confidence: 0.85,
            message: 'Loaded from local cache',
            requestId: match.key,
            processingTime: 0,
          };
          navigation.navigate('Results', { analysis: response });
          return;
        }
      }

      console.warn('Cached analysis not found for item', item.id);
    } catch (e) {
      console.error('Failed to open cached analysis', e);
    }
  };

  /**
   * Handle view all press
   */
  const handleViewAllPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to full recent activity screen
    navigation.navigate('RecentActivity');
  };

  /**
   * Get icon for input type
   */
  const getTypeIcon = (type: MenuInputType): string => {
    switch (type) {
      case MenuInputType.IMAGE:
        return 'camera';
      case MenuInputType.URL:
        return 'web';
      case MenuInputType.TEXT:
        return 'text';
      default:
        return 'file-document';
    }
  };

  const styles = createStyles(theme);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Recent Activity
        </Text>
        <Card style={styles.loadingCard} elevation={2}>
          <Card.Content style={styles.loadingContent}>
            <Text variant="bodyMedium" style={styles.loadingText}>
              Loading recent activity...
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  if (recentItems.length === 0) {
    return (
      <View style={styles.container}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Recent Activity
        </Text>
        <Card style={styles.emptyCard} elevation={2}>
          <Card.Content style={styles.emptyContent}>
            <Icon
              source="history"
              size={48}
              color="#CCCCCC"
            />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No Recent Activity
            </Text>
            <Text variant="bodyMedium" style={styles.emptyDescription}>
              Start analyzing menus to see your recent activity here
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Recent Activity
        </Text>
        {showViewAll && recentItems.length >= maxItems && (
          <Button
            mode="text"
            onPress={handleViewAllPress}
            compact
            labelStyle={styles.viewAllLabel}
          >
            View All
          </Button>
        )}
      </View>
      
      <View style={styles.itemsContainer}>
        {recentItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => handleItemPress(item)}
            accessibilityRole="button"
            accessibilityLabel={`${item.title} - ${item.subtitle}`}
            accessibilityHint="Tap to view analysis results"
          >
            <Card style={styles.itemCard} elevation={3}>
              <Card.Content style={styles.itemContent}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemIconContainer}>
                    <Icon
                      source={getTypeIcon(item.type)}
                      size={20}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={styles.itemTextContainer}>
                    <Text variant="titleSmall" style={styles.itemTitle}>
                      {item.title}
                    </Text>
                    <Text variant="bodySmall" style={styles.itemSubtitle}>
                      {item.subtitle}
                    </Text>
                  </View>
                </View>
                
                {item.resultsSummary && (
                  <View style={styles.summaryContainer}>
                    <View style={styles.summaryChips}>
                      {item.resultsSummary.good > 0 && (
                        <Chip
                          icon="check-circle"
                          style={[styles.goodChip, { backgroundColor: theme.colors.semantic.safeLight }]}
                          textStyle={[styles.goodChipText, { color: theme.colors.semantic.safe }]}
                          compact
                        >
                          {item.resultsSummary.good}
                        </Chip>
                      )}
                      {item.resultsSummary.careful > 0 && (
                        <Chip
                          icon="alert-circle"
                          style={[styles.carefulChip, { backgroundColor: theme.colors.semantic.cautionLight }]}
                          textStyle={[styles.carefulChipText, { color: theme.colors.semantic.caution }]}
                          compact
                        >
                          {item.resultsSummary.careful}
                        </Chip>
                      )}
                      {item.resultsSummary.avoid > 0 && (
                        <Chip
                          icon="close-circle"
                          style={[styles.avoidChip, { backgroundColor: theme.colors.semantic.avoidLight }]}
                          textStyle={[styles.avoidChipText, { color: theme.colors.semantic.avoid }]}
                          compact
                        >
                          {item.resultsSummary.avoid}
                        </Chip>
                      )}
                    </View>
                  </View>
                )}
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginTop: theme.spacing.xs,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  itemsContainer: {
    gap: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    color: theme.colors.text,
  },
  viewAllLabel: {
    color: theme.colors.primary,
    fontSize: 14,
  },
  itemCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  itemContent: {
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.semantic.safeLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  itemSubtitle: {
    color: theme.colors.textSecondary,
  },
  summaryContainer: {
    marginTop: 8,
  },
  summaryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  goodChip: {},
  goodChipText: {
    fontSize: 12,
  },
  carefulChip: {},
  carefulChipText: {
    fontSize: 12,
  },
  avoidChip: {},
  avoidChipText: {
    fontSize: 12,
  },
  loadingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  loadingContent: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.textSecondary,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyContent: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    color: theme.colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    color: theme.colors.placeholder,
    textAlign: 'center',
    lineHeight: 20,
  },
});
