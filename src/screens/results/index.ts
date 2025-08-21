/**
 * Results Screen Exports
 * 
 * Centralized exports for all results screen components and utilities.
 * Provides clean import paths for other parts of the application.
 */

// Main Results Screen
export { ResultsScreen } from './ResultsScreen';

// Results Components (re-exported for convenience)
export { ResultCard } from '@/components/results/ResultCard';
export { CategorySection, CategorySectionList } from '@/components/results/CategorySection';
export { ResultsSummary } from '@/components/results/ResultsSummary';
export { FilterBar } from '@/components/results/FilterBar';

// Type exports for results functionality
export type {
  FoodAnalysisResult,
  FoodSuitability,
  ResultsFilter,
  CategorizedResults,
  ResultsSummary as ResultsSummaryType,
  ResultCardData,
} from '@/types';