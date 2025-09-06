import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { FoodAnalysisResult, FoodSuitability } from '@/types';
import ProgressRing from './ProgressRing';
import Pill from '@/components/ui/Pill';

interface Props {
  results: FoodAnalysisResult[];
  style?: any;
}

const summarize = (results: FoodAnalysisResult[]) => {
  const total = results.length;
  const good = results.filter(r => r.suitability === FoodSuitability.GOOD).length;
  const careful = results.filter(r => r.suitability === FoodSuitability.CAREFUL).length;
  const avoid = results.filter(r => r.suitability === FoodSuitability.AVOID).length;
  const safety = total ? good / total : 0;
  return { total, good, careful, avoid, safety };
};

export const ResultsSummaryFlat: React.FC<Props> = ({ results, style }) => {
  const { theme } = useTheme();
  const s = summarize(results);
  const styles = createStyles(theme);

  const statusText = s.safety >= 0.7 ? 'Plenty of safe options' : s.safety >= 0.4 ? 'Some safe options' : 'Limited safe options';

  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        <ProgressRing
          progress={s.safety}
          label={`${Math.round(s.safety * 100)}%`}
          sublabel="Safe options"
          color={s.safety >= 0.7 ? theme.colors.semantic.safe : s.safety >= 0.4 ? theme.colors.semantic.caution : theme.colors.semantic.avoid}
        />
        <View style={styles.summaryText}>
          <Text style={styles.title}>Analysis</Text>
          <Text style={styles.subtitle}>{s.total} items analyzed</Text>
          <Text style={styles.status}>{statusText}</Text>
          <View style={styles.pills}>
            <Pill label={`${s.good} Safe`} color={theme.colors.semantic.safeLight} textColor={theme.colors.semantic.safe} />
            <Pill label={`${s.careful} Ask`} color={theme.colors.semantic.cautionLight} textColor={theme.colors.semantic.caution} />
            <Pill label={`${s.avoid} Avoid`} color={theme.colors.semantic.avoidLight} textColor={theme.colors.semantic.avoid} />
          </View>
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 20,
    color: theme.colors.text,
  },
  subtitle: {
    marginTop: 4,
    color: theme.colors.textSecondary,
  },
  status: {
    marginTop: 8,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text,
  },
  pills: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
});

export default ResultsSummaryFlat;

