/**
 * ResultsScreen Component
 * 
 * Main results display screen with comprehensive three-tier layout for showing
 * dietary analysis results. Features filtering, sorting, categorization, and
 * detailed result cards with Material Design styling.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, FAB, Portal, Snackbar, ActivityIndicator, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';

import {
  RootStackParamList,
  FoodAnalysisResult,
  FoodSuitability,
  ResultsFilter,
  CategorizedResults,
  LoadingState,
  AppError,
  ErrorSeverity
} from '@/types';
import { ResultsSummary } from '@/components/results/ResultsSummary';
import { FilterBar } from '@/components/results/FilterBar';
import { CategorySectionList } from '@/components/results/CategorySection';
import { useTheme } from '@/theme/ThemeProvider';
import { saveAnalysisToCache } from '@/services/cache/recentCache';
import { MenuInputType, DietaryType, UserPreferences, GeminiRequest } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { geminiService } from '@/services/api/geminiService';
import { parseMenuText, fetchAndExtractMenuFromUrl } from '@/services/menu/menuInputService';

type ResultsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Results'>;
type ResultsScreenRouteProp = RouteProp<RootStackParamList, 'Results'>;

interface ResultsScreenProps {
  navigation: ResultsScreenNavigationProp;
  route: ResultsScreenRouteProp;
}

/**
 * Mock analysis results for demonstration
 * TODO: Replace with actual API integration
 */
const getMockResults = (): FoodAnalysisResult[] => [
  {
    itemId: '1',
    itemName: 'Grilled Vegetable Salad',
    suitability: FoodSuitability.GOOD,
    explanation: 'This salad contains only vegetables and appears to be prepared without any animal products. The grilled vegetables are likely cooked in oil rather than butter.',
    confidence: 0.9,
    concerns: [],
  },
  {
    itemId: '2',
    itemName: 'Pasta Primavera',
    suitability: FoodSuitability.CAREFUL,
    explanation: 'While this pasta dish contains vegetables, it may contain dairy products like parmesan cheese or cream in the sauce. The pasta itself might also contain eggs.',
    questionsToAsk: [
      'Does the sauce contain any dairy products?',
      'Is the pasta made with eggs?',
      'What type of oil is used for cooking?'
    ],
    confidence: 0.7,
    concerns: ['Potential dairy', 'Possible eggs in pasta'],
  },
  {
    itemId: '3',
    itemName: 'Chicken Caesar Salad',
    suitability: FoodSuitability.AVOID,
    explanation: 'This dish contains chicken, which is not suitable for vegetarian or vegan diets. The Caesar dressing typically contains anchovies and parmesan cheese.',
    confidence: 0.95,
    concerns: ['Contains chicken', 'Caesar dressing with anchovies', 'Parmesan cheese'],
  },
  {
    itemId: '4',
    itemName: 'Quinoa Buddha Bowl',
    suitability: FoodSuitability.GOOD,
    explanation: 'This bowl appears to contain quinoa, vegetables, and plant-based proteins. It looks like a safe option for most dietary restrictions.',
    confidence: 0.85,
    concerns: [],
  },
  {
    itemId: '5',
    itemName: 'Fish and Chips',
    suitability: FoodSuitability.AVOID,
    explanation: 'Contains fish, which is not suitable for vegetarian or vegan diets. The batter may also contain dairy products.',
    confidence: 0.98,
    concerns: ['Contains fish', 'Potential dairy in batter'],
  },
];

/**
 * Filter and sort results based on current filter settings
 */
const filterAndSortResults = (
  results: FoodAnalysisResult[], 
  filter: ResultsFilter
): FoodAnalysisResult[] => {
  let filteredResults = [...results];

  // Filter by suitability
  if (filter.suitability && filter.suitability.length > 0) {
    filteredResults = filteredResults.filter(result => 
      filter.suitability!.includes(result.suitability)
    );
  }

  // Filter by search text
  if (filter.searchText && filter.searchText.trim().length > 0) {
    const searchLower = filter.searchText.toLowerCase();
    filteredResults = filteredResults.filter(result =>
      result.itemName.toLowerCase().includes(searchLower) ||
      result.explanation.toLowerCase().includes(searchLower)
    );
  }

  // Sort results
  filteredResults.sort((a, b) => {
    let comparison = 0;
    
    switch (filter.sortBy) {
      case 'name':
        comparison = a.itemName.localeCompare(b.itemName);
        break;
      case 'confidence':
        comparison = a.confidence - b.confidence;
        break;
      case 'suitability':
        const suitabilityOrder = {
          [FoodSuitability.GOOD]: 0,
          [FoodSuitability.CAREFUL]: 1,
          [FoodSuitability.AVOID]: 2,
        };
        comparison = suitabilityOrder[a.suitability] - suitabilityOrder[b.suitability];
        break;
      default:
        comparison = 0;
    }

    return filter.sortDirection === 'desc' ? -comparison : comparison;
  });

  return filteredResults;
};

/**
 * Categorize results into Good/Careful/Avoid groups
 */
const categorizeResults = (results: FoodAnalysisResult[]): CategorizedResults => {
  const good = results.filter(r => r.suitability === FoodSuitability.GOOD);
  const careful = results.filter(r => r.suitability === FoodSuitability.CAREFUL);
  const avoid = results.filter(r => r.suitability === FoodSuitability.AVOID);

  return {
    good,
    careful,
    avoid,
    totalItems: results.length,
    appliedFilter: {
      suitability: [FoodSuitability.GOOD, FoodSuitability.CAREFUL, FoodSuitability.AVOID],
      sortBy: 'suitability',
      sortDirection: 'asc',
    },
  };
};

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  
  // State management
  const [results, setResults] = useState<FoodAnalysisResult[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: true,
    message: 'Analyzing menu items...',
  });
  const [error, setError] = useState<AppError | null>(null);
  const [filter, setFilter] = useState<ResultsFilter>({
    suitability: [FoodSuitability.GOOD, FoodSuitability.CAREFUL, FoodSuitability.AVOID],
    sortBy: 'suitability',
    sortDirection: 'asc',
  });
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Memoized filtered and categorized results
  const filteredResults = useMemo(() => 
    filterAndSortResults(results, filter), 
    [results, filter]
  );

  const categorizedResults = useMemo(() => 
    categorizeResults(filteredResults), 
    [filteredResults]
  );

  // Load results on component mount
  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading({ isLoading: true, message: 'Analyzing menu items...' });

      if (route.params?.analysis) {
        const analysisResult = route.params.analysis;
        if (analysisResult.success) {
          setResults(analysisResult.results);
          setSnackbarMessage(`Analysis complete! Found ${analysisResult.results.length} menu items.`);
          // Persist to recent cache with input type metadata
          try {
            const inputType: MenuInputType = route.params.imageUri
              ? MenuInputType.IMAGE
              : route.params.menuUrl
                ? MenuInputType.URL
                : route.params.menuText
                  ? MenuInputType.TEXT
                  : MenuInputType.TEXT;
            const source = route.params.imageUri || route.params.menuUrl || (route.params.menuText ? route.params.menuText.slice(0, 100) : undefined);
            await saveAnalysisToCache(analysisResult, { inputType, source });
          } catch (e) {
            console.warn('Failed to save analysis to cache', e);
          }
        } else {
          throw new Error(analysisResult.message || 'Analysis failed');
        }
      } else if (route.params?.menuText) {
        // Analyze provided text input
        const prefs = await getUserPreferences();
        const menuItems = parseMenuText(route.params.menuText);
        if (menuItems.length === 0) {
          throw new Error('No menu items found in text');
        }
        const request: GeminiRequest = {
          dietaryPreferences: prefs,
          menuItems,
          requestId: `text-${Date.now()}`,
        };
        const analysisResult = await geminiService.analyzeMenu(request);
        if (analysisResult.success) {
          setResults(analysisResult.results);
          setSnackbarMessage(`Analyzed ${analysisResult.results.length} items from text.`);
          await saveAnalysisToCache(analysisResult, { inputType: MenuInputType.TEXT, source: route.params.menuText.slice(0, 120) });
        } else {
          throw new Error(analysisResult.message || 'Analysis failed');
        }
      } else if (route.params?.menuUrl) {
        // Fetch URL and analyze extracted items
        const prefs = await getUserPreferences();
        setLoading({ isLoading: true, message: 'Fetching menu from URL...' });
        const menuItems = await fetchAndExtractMenuFromUrl(route.params.menuUrl);
        if (menuItems.length === 0) {
          throw new Error('No menu items found at URL');
        }
        const request: GeminiRequest = {
          dietaryPreferences: prefs,
          menuItems,
          requestId: `url-${Date.now()}`,
        };
        setLoading({ isLoading: true, message: 'Analyzing menu items...' });
        const analysisResult = await geminiService.analyzeMenu(request);
        if (analysisResult.success) {
          setResults(analysisResult.results);
          setSnackbarMessage(`Analyzed ${analysisResult.results.length} items from URL.`);
          await saveAnalysisToCache(analysisResult, { inputType: MenuInputType.URL, source: route.params.menuUrl });
        } else {
          throw new Error(analysisResult.message || 'Analysis failed');
        }
      } else {
        // Fallback to mock results only when invoked as demo
        const mockResults = getMockResults();
        setResults(mockResults);
        setSnackbarMessage(`Displaying mock results. Found ${mockResults.length} menu items.`);
      }

      setLoading({ isLoading: false });
      setSnackbarVisible(true);

    } catch (err) {
      const appError: AppError = {
        code: 'ANALYSIS_FAILED',
        message: 'Failed to analyze menu items',
        severity: ErrorSeverity.HIGH,
        timestamp: new Date().toISOString(),
        userMessage: 'Unable to analyze the menu. Please try again.',
        recoveryActions: [
          { label: 'Retry', type: 'retry' },
          { label: 'Go Back', type: 'navigate', params: { screen: 'Home' } },
        ],
      };
      
      setError(appError);
      setLoading({ isLoading: false });
    }
  };

  const getUserPreferences = async (): Promise<UserPreferences> => {
    try {
      const stored = await AsyncStorage.getItem('user_preferences');
      if (stored) return JSON.parse(stored);
    } catch {}
    // Default to vegan if not set
    return {
      dietaryType: DietaryType.VEGAN,
      onboardingCompleted: true,
      lastUpdated: new Date().toISOString(),
    } as UserPreferences;
  };

  const handleRetry = () => {
    setError(null);
    loadResults();
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleShareResults = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const shareText = `Menu Analysis Results:\n\n` +
        `✅ Safe items: ${categorizedResults.good.length}\n` +
        `⚠️ Ask about: ${categorizedResults.careful.length}\n` +
        `❌ Avoid: ${categorizedResults.avoid.length}\n\n` +
        `Generated by What Can I Eat app`;

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(shareText);
      } else {
        setSnackbarMessage('Sharing not available on this device');
        setSnackbarVisible(true);
      }
    } catch (err) {
      setSnackbarMessage('Failed to share results');
      setSnackbarVisible(true);
    }
  };

  const handleResultPress = (result: FoodAnalysisResult) => {
    // Handle individual result press (could open detail modal)
    console.log('Result pressed:', result.itemName);
  };

  const styles = createStyles(theme);

  // Loading state
  if (loading.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={handleGoBack} />
          <Appbar.Content title="Analysis Results" />
        </Appbar.Header>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="titleMedium" style={styles.loadingText}>
            {loading.message}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={handleGoBack} />
          <Appbar.Content title="Analysis Results" />
        </Appbar.Header>
        
        <View style={styles.errorContainer}>
          <Text variant="titleLarge" style={styles.errorTitle}>
            Analysis Failed
          </Text>
          <Text variant="bodyMedium" style={styles.errorMessage}>
            {error.userMessage}
          </Text>
          <View style={styles.errorActions}>
            {error.recoveryActions?.map((action, index) => (
              <FAB
                key={index}
                label={action.label}
                onPress={action.type === 'retry' ? handleRetry : handleGoBack}
                style={styles.errorButton}
              />
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={handleGoBack} />
        <Appbar.Content title="Analysis Results" />
        <Appbar.Action icon="share" onPress={handleShareResults} />
        <Appbar.Action icon="refresh" onPress={handleRetry} />
      </Appbar.Header>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Results Summary */}
        <ResultsSummary
          results={filteredResults}
          style={styles.summary}
        />

        {/* Filter Bar */}
        <FilterBar
          filter={filter}
          onFilterChange={setFilter}
          totalResults={results.length}
          filteredResults={filteredResults.length}
          style={styles.filterBar}
        />

        {/* Category Sections */}
        <CategorySectionList
          categorizedResults={categorizedResults}
          onResultPress={handleResultPress}
          style={styles.categoryList}
        />
      </ScrollView>

      {/* Floating Action Button */}
      <Portal>
        <FAB
          icon="camera"
          label="Scan Another"
          onPress={() => navigation.navigate('Camera')}
          style={styles.fab}
        />
      </Portal>

      {/* Snackbar for notifications */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
  },
  content: {
    flex: 1,
  },
  summary: {
    marginTop: 8,
  },
  filterBar: {
    marginTop: 8,
  },
  categoryList: {
    paddingBottom: 80, // Space for FAB
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    color: theme.colors.error,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 16,
  },
  errorButton: {
    backgroundColor: theme.colors.primary,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
  snackbar: {
    backgroundColor: theme.colors.text,
  },
});
