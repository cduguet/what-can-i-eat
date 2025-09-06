import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { FoodAnalysisResult, FoodSuitability } from '@/types';

interface ResultRowProps {
  result: FoodAnalysisResult;
  onPress?: (res: FoodAnalysisResult) => void;
}

const suitabilityMeta = (theme: any, s: FoodSuitability) => {
  switch (s) {
    case FoodSuitability.GOOD:
      return { color: theme.colors.semantic.safe, icon: '✅' };
    case FoodSuitability.CAREFUL:
      return { color: theme.colors.semantic.caution, icon: '⚠️' };
    case FoodSuitability.AVOID:
      return { color: theme.colors.semantic.avoid, icon: '❌' };
    default:
      return { color: theme.colors.textSecondary, icon: '•' };
  }
};

export const ResultRow: React.FC<ResultRowProps> = ({ result, onPress }) => {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const meta = suitabilityMeta(theme, result.suitability);
  const styles = createStyles(theme);

  const toggle = () => {
    setExpanded(!expanded);
    onPress?.(result);
  };

  return (
    <View style={styles.rowContainer}>
      <TouchableOpacity style={styles.row} onPress={toggle} accessibilityRole="button">
        <Text style={[styles.icon]}>{meta.icon}</Text>
        <View style={styles.rowText}>
          <Text style={styles.title}>{result.itemName}</Text>
          <Text style={[styles.metaText, { color: meta.color }]}>
            {Math.round(result.confidence * 100)}% confident
          </Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.details}>
          <Text style={styles.detailText}>{result.explanation}</Text>
          {!!result.questionsToAsk?.length && (
            <View style={{ marginTop: 8 }}>
              {result.questionsToAsk.map((q, i) => (
                <Text key={i} style={styles.detailText}>• {q}</Text>
              ))}
            </View>
          )}
          {!!result.concerns?.length && (
            <View style={styles.concerns}>
              {result.concerns.map((c, i) => (
                <Text key={i} style={[styles.concernChip]}>{c}</Text>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  rowContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  icon: {
    fontSize: 18,
    marginRight: 10,
  },
  rowText: { flex: 1 },
  title: {
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text,
    fontSize: 16,
  },
  metaText: {
    marginTop: 2,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  details: {
    paddingBottom: 14,
  },
  detailText: {
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  concerns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  concernChip: {
    backgroundColor: theme.colors.semantic.avoidLight,
    color: theme.colors.semantic.avoid,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 12,
  },
});

export default ResultRow;

