import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { FoodAnalysisResult, FoodSuitability } from '@/types';
import ResultRow from './ResultRow';
import Pill from '@/components/ui/Pill';

interface CategorySectionFlatProps {
  category: FoodSuitability;
  results: FoodAnalysisResult[];
  onResultPress?: (r: FoodAnalysisResult) => void;
}

const configFor = (theme: any, c: FoodSuitability) => {
  switch (c) {
    case FoodSuitability.GOOD:
      return { title: 'Safe', color: theme.colors.semantic.safe, light: theme.colors.semantic.safeLight, emoji: '✅' };
    case FoodSuitability.CAREFUL:
      return { title: 'Ask', color: theme.colors.semantic.caution, light: theme.colors.semantic.cautionLight, emoji: '⚠️' };
    case FoodSuitability.AVOID:
      return { title: 'Avoid', color: theme.colors.semantic.avoid, light: theme.colors.semantic.avoidLight, emoji: '❌' };
    default:
      return { title: 'Other', color: theme.colors.textSecondary, light: theme.colors.border, emoji: '•' };
  }
};

export const CategorySectionFlat: React.FC<CategorySectionFlatProps> = ({ category, results, onResultPress }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [open, setOpen] = useState(true);
  const cfg = configFor(theme, category);

  return (
    <View style={styles.section}>
      <View style={[styles.sectionBox, { backgroundColor: cfg.light }]}>        
        <TouchableOpacity style={styles.header} onPress={() => setOpen(!open)} accessibilityRole="button">
          <Text style={styles.headerEmoji}>{cfg.emoji}</Text>
          <Text style={[styles.headerTitle, { color: cfg.color }]}>{cfg.title}</Text>
          <View style={{ flex: 1 }} />
          <Pill label={String(results.length)} color={cfg.light} textColor={cfg.color} />
        </TouchableOpacity>

        {open && (
          <View style={styles.list}>
            {results.length === 0 ? (
              <Text style={styles.empty}>No items</Text>
            ) : (
              results.map((r) => (
                <ResultRow key={r.itemId || r.itemName} result={r} onPress={onResultPress} />
              ))
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  section: {
    marginTop: 16,
  },
  sectionBox: {
    marginHorizontal: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  headerTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 18,
  },
  list: {
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  empty: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
});

export default CategorySectionFlat;
