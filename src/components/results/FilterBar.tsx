/**
 * FilterBar Component
 * 
 * Provides filtering and sorting controls for analysis results including
 * category filters, search functionality, and sort options with Material Design.
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Searchbar, Chip, Divider, Text } from 'react-native-paper';
import { useTheme } from '@/theme/ThemeProvider';
import * as Haptics from 'expo-haptics';

import { FoodSuitability, ResultsFilter } from '@/types';

interface FilterBarProps {
  /** Current filter state */
  filter: ResultsFilter;
  /** Callback when filter changes */
  onFilterChange: (filter: ResultsFilter) => void;
  /** Total number of results */
  totalResults?: number;
  /** Number of filtered results */
  filteredResults?: number;
  /** Whether to show search bar */
  showSearch?: boolean;
  /** Whether to show category filters */
  showCategoryFilters?: boolean;
  /** Whether to show sort options */
  showSortOptions?: boolean;
  /** Custom styling */
  style?: any;
}

/**
 * Get suitability display configuration
 */
const getSuitabilityConfig = (suitability: FoodSuitability, colors: any) => {
  switch (suitability) {
    case FoodSuitability.GOOD:
      return {
        label: 'Safe',
        icon: 'check-circle',
        color: colors.semantic.safe,
        light: colors.semantic.safeLight,
      };
    case FoodSuitability.CAREFUL:
      return {
        label: 'Ask',
        icon: 'alert-circle',
        color: colors.semantic.caution,
        light: colors.semantic.cautionLight,
      };
    case FoodSuitability.AVOID:
      return {
        label: 'Avoid',
        icon: 'close-circle',
        color: colors.semantic.avoid,
        light: colors.semantic.avoidLight,
      };
    default:
      return {
        label: 'Unknown',
        icon: 'help-circle',
        color: colors.border,
        light: colors.surface,
      };
  }
};

/**
 * Get sort option display text
 */
const getSortOptionText = (sortBy: string, sortDirection: string): string => {
  const directionText = sortDirection === 'asc' ? '↑' : '↓';
  switch (sortBy) {
    case 'name':
      return `Name ${directionText}`;
    case 'suitability':
      return `Category ${directionText}`;
    case 'confidence':
      return `Confidence ${directionText}`;
    default:
      return `Sort ${directionText}`;
  }
};

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onFilterChange,
  totalResults = 0,
  filteredResults = 0,
  showSearch = true,
  showCategoryFilters = true,
  showSortOptions = false,
  style,
}) => {
  const { theme } = useTheme();
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  const handleSearchChange = (searchText: string) => {
    onFilterChange({
      ...filter,
      searchText: searchText.trim() || undefined,
    });
  };

  const handleSuitabilityToggle = (suitability: FoodSuitability) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const currentSuitabilities = filter.suitability || [];
    const isSelected = currentSuitabilities.includes(suitability);
    
    let newSuitabilities: FoodSuitability[];
    if (isSelected) {
      // Remove if already selected
      newSuitabilities = currentSuitabilities.filter(s => s !== suitability);
    } else {
      // Add if not selected
      newSuitabilities = [...currentSuitabilities, suitability];
    }

    onFilterChange({
      ...filter,
      suitability: newSuitabilities,
    });
  };

  const handleSortChange = (sortBy: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    let newSortDirection = 'asc';
    
    // If same sort field, toggle direction
    if (filter.sortBy === sortBy) {
      newSortDirection = filter.sortDirection === 'asc' ? 'desc' : 'asc';
    }

    onFilterChange({
      ...filter,
      sortBy: sortBy as 'name' | 'suitability' | 'confidence',
      sortDirection: newSortDirection as 'asc' | 'desc',
    });

    setSortMenuVisible(false);
  };

  const handleResetFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    onFilterChange({
      suitability: [FoodSuitability.GOOD, FoodSuitability.CAREFUL, FoodSuitability.AVOID],
      searchText: undefined,
      categories: undefined,
      sortBy: 'suitability',
      sortDirection: 'asc',
    });
  };

  const hasActiveFilters = 
    (filter.searchText && filter.searchText.length > 0) ||
    (filter.suitability && filter.suitability.length < 3);

  const isFiltered = filteredResults < totalResults;

  const styles = createStyles(theme);

  return (
    <View style={[styles.container, style]}>
      {/* Search Bar */}
      {showSearch && (
        <Searchbar
          placeholder="Search menu items..."
          value={filter.searchText || ''}
          onChangeText={handleSearchChange}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor={theme.colors.primary}
          placeholderTextColor={theme.colors.placeholder}
        />
      )}

      {/* Filter Controls */}
      <View style={styles.controlsContainer}>
        {/* Category Filters */}
        {showCategoryFilters && (
          <View style={styles.categoryFilters}>
            {Object.values(FoodSuitability).map((suitability) => {
              const config = getSuitabilityConfig(suitability as FoodSuitability, theme.colors);
              const isSelected = filter.suitability?.includes(suitability as FoodSuitability) ?? true;

              return (
                <Chip
                  key={suitability}
                  icon={config.icon}
                  selected={isSelected}
                  onPress={() => handleSuitabilityToggle(suitability as FoodSuitability)}
                  style={[
                    styles.categoryChip,
                    { borderColor: config.color },
                    isSelected && { backgroundColor: config.color },
                    !isSelected && { backgroundColor: config.light },
                  ]}
                  textStyle={[
                    styles.categoryChipText,
                    isSelected ? { color: theme.colors.surface } : { color: theme.colors.text }
                  ]}
                  compact
                >
                  {config.label}
                </Chip>
              );
            })}
          </View>
        )}

        {/* Action controls (sort/reset) removed per design request */}
      </View>

      {/* Results Count */}
      {isFiltered && (
        <>
          <Divider style={styles.divider} />
          <View style={styles.resultsCount}>
            <Text variant="bodySmall" style={styles.resultsText}>
              Showing {filteredResults} of {totalResults} items
            </Text>
          </View>
        </>
      )}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchBar: {
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.mode === 'light' ? '#F5F7F8' : theme.colors.surface,
    elevation: 0,
  },
  searchInput: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  categoryChip: {
    height: 32,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // sort/reset styles removed
  divider: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.border,
  },
  resultsCount: {
    paddingTop: theme.spacing.xs,
    alignItems: 'center',
  },
  resultsText: {
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
});
