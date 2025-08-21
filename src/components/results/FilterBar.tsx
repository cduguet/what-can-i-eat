/**
 * FilterBar Component
 * 
 * Provides filtering and sorting controls for analysis results including
 * category filters, search functionality, and sort options with Material Design.
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Searchbar, Chip, Menu, Button, Divider, Text } from 'react-native-paper';
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
const getSuitabilityConfig = (suitability: FoodSuitability) => {
  switch (suitability) {
    case FoodSuitability.GOOD:
      return {
        label: 'Safe',
        icon: 'check-circle',
        color: '#4CAF50',
      };
    case FoodSuitability.CAREFUL:
      return {
        label: 'Ask',
        icon: 'alert-circle',
        color: '#FF9800',
      };
    case FoodSuitability.AVOID:
      return {
        label: 'Avoid',
        icon: 'close-circle',
        color: '#F44336',
      };
    default:
      return {
        label: 'Unknown',
        icon: 'help-circle',
        color: '#9E9E9E',
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
  showSortOptions = true,
  style,
}) => {
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
          iconColor="#006064"
        />
      )}

      {/* Filter Controls */}
      <View style={styles.controlsContainer}>
        {/* Category Filters */}
        {showCategoryFilters && (
          <View style={styles.categoryFilters}>
            {Object.values(FoodSuitability).map((suitability) => {
              const config = getSuitabilityConfig(suitability);
              const isSelected = filter.suitability?.includes(suitability) ?? true;
              
              return (
                <Chip
                  key={suitability}
                  icon={config.icon}
                  selected={isSelected}
                  onPress={() => handleSuitabilityToggle(suitability)}
                  style={[
                    styles.categoryChip,
                    isSelected && { backgroundColor: config.color },
                  ]}
                  textStyle={[
                    styles.categoryChipText,
                    isSelected && { color: '#FFFFFF' },
                  ]}
                  compact
                >
                  {config.label}
                </Chip>
              );
            })}
          </View>
        )}

        {/* Sort and Reset Controls */}
        <View style={styles.actionControls}>
          {/* Sort Menu */}
          {showSortOptions && (
            <Menu
              visible={sortMenuVisible}
              onDismiss={() => setSortMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setSortMenuVisible(true)}
                  icon="sort"
                  style={styles.sortButton}
                  labelStyle={styles.sortButtonText}
                  compact
                >
                  {getSortOptionText(filter.sortBy, filter.sortDirection)}
                </Button>
              }
              contentStyle={styles.menuContent}
            >
              <Menu.Item
                onPress={() => handleSortChange('name')}
                title="Name"
                leadingIcon="sort-alphabetical-ascending"
              />
              <Menu.Item
                onPress={() => handleSortChange('suitability')}
                title="Category"
                leadingIcon="sort-variant"
              />
              <Menu.Item
                onPress={() => handleSortChange('confidence')}
                title="Confidence"
                leadingIcon="sort-numeric-ascending"
              />
            </Menu>
          )}

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              mode="text"
              onPress={handleResetFilters}
              icon="filter-off"
              style={styles.resetButton}
              labelStyle={styles.resetButtonText}
              compact
            >
              Reset
            </Button>
          )}
        </View>
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchBar: {
    marginBottom: 12,
    backgroundColor: '#F5F5F5',
    elevation: 0,
  },
  searchInput: {
    fontSize: 16,
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
    backgroundColor: '#F5F5F5',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#616161',
  },
  actionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortButton: {
    borderColor: '#006064',
    borderWidth: 1,
    height: 32,
  },
  sortButtonText: {
    fontSize: 12,
    color: '#006064',
    fontWeight: '500',
  },
  resetButton: {
    height: 32,
  },
  resetButtonText: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '500',
  },
  menuContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  divider: {
    marginTop: 12,
    backgroundColor: '#E0E0E0',
  },
  resultsCount: {
    paddingTop: 8,
    alignItems: 'center',
  },
  resultsText: {
    color: '#757575',
    fontStyle: 'italic',
  },
});