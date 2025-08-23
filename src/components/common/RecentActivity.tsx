import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Card, Text, Icon, Chip, Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import {
  RootStackParamList,
  CachedAnalysisResult,
  MenuInputType,
  FoodSuitability,
} from '@/types';

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
      const cachedData = await AsyncStorage.getItem('cached_analyses');
      
      if (cachedData) {
        const analyses: CachedAnalysisResult[] = JSON.parse(cachedData);
        const recentAnalyses = analyses
          .sort((a, b) => new Date(b.cachedAt).getTime() - new Date(a.cachedAt).getTime())
          .slice(0, maxItems)
          .map(transformToRecentItem);
        
        setRecentItems(recentAnalyses);
      } else {
        // Show sample data if no cached analyses exist
        setRecentItems(getSampleData());
      }
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
  const transformToRecentItem = (analysis: CachedAnalysisResult): RecentActivityItem => {
    const resultsSummary = analysis.results.reduce(
      (acc, result) => {
        acc[result.suitability]++;
        return acc;
      },
      { good: 0, careful: 0, avoid: 0 } as { good: number; careful: number; avoid: number }
    );

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
  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  /**
   * Get sample data for demonstration
   */
  const getSampleData = (): RecentActivityItem[] => [
    {
      id: 'sample-1',
      type: MenuInputType.IMAGE,
      title: 'Camera Scan',
      subtitle: '8 items analyzed • 2 hours ago',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      resultsSummary: { good: 5, careful: 2, avoid: 1 },
    },
    {
      id: 'sample-2',
      type: MenuInputType.URL,
      title: 'Website Menu',
      subtitle: '12 items analyzed • 1 day ago',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      resultsSummary: { good: 8, careful: 3, avoid: 1 },
    },
    {
      id: 'sample-3',
      type: MenuInputType.TEXT,
      title: 'Text Analysis',
      subtitle: '5 items analyzed • 3 days ago',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      resultsSummary: { good: 3, careful: 1, avoid: 1 },
    },
  ];

  /**
   * Handle item press
   */
  const handleItemPress = async (item: RecentActivityItem) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to results screen with cached data
    // This would need to be implemented with proper result loading
    console.log('Navigate to results for item:', item.id);
  };

  /**
   * Handle view all press
   */
  const handleViewAllPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to full recent activity screen
    console.log('Navigate to full recent activity');
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

  /**
   * Render recent activity item
   */
  const renderItem = ({ item }: { item: RecentActivityItem }) => (
    <TouchableOpacity
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
                color="#006064"
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
                    style={styles.goodChip}
                    textStyle={styles.goodChipText}
                    compact
                  >
                    {item.resultsSummary.good}
                  </Chip>
                )}
                {item.resultsSummary.careful > 0 && (
                  <Chip
                    icon="alert-circle"
                    style={styles.carefulChip}
                    textStyle={styles.carefulChipText}
                    compact
                  >
                    {item.resultsSummary.careful}
                  </Chip>
                )}
                {item.resultsSummary.avoid > 0 && (
                  <Chip
                    icon="close-circle"
                    style={styles.avoidChip}
                    textStyle={styles.avoidChipText}
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
  );

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
      
      <FlatList
        data={recentItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#212121',
  },
  viewAllLabel: {
    color: '#006064',
    fontSize: 14,
  },
  itemCard: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    // Add overflow hidden to ensure shadows render properly on all sides
    overflow: 'visible',
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
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  itemSubtitle: {
    color: '#666666',
  },
  summaryContainer: {
    marginTop: 8,
  },
  summaryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  goodChip: {
    backgroundColor: '#E8F5E8',
  },
  goodChipText: {
    color: '#2E7D32',
    fontSize: 12,
  },
  carefulChip: {
    backgroundColor: '#FFF3E0',
  },
  carefulChipText: {
    color: '#F57C00',
    fontSize: 12,
  },
  avoidChip: {
    backgroundColor: '#FFEBEE',
  },
  avoidChipText: {
    color: '#D32F2F',
    fontSize: 12,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'visible',
  },
  loadingContent: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666666',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'visible',
  },
  emptyContent: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
});