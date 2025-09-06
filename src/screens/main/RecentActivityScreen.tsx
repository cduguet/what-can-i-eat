import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Appbar, Text, Chip, Icon } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/theme/ThemeProvider';
import { GeminiResponse, MenuInputType } from '@/types';
import type { AnalysisCacheEntry } from '@/services/cache/recentCache';
import * as Haptics from 'expo-haptics';
import { summarizeResults, getTimeAgo } from '@/components/common/recentActivityUtils';
import { useNavigation } from '@react-navigation/native';

export const RecentActivityScreen: React.FC = () => {
  const { theme } = useTheme();
  const nav = useNavigation<any>();
  const [items, setItems] = useState<Array<AnalysisCacheEntry & { storageKey: string }>>([]);

  useEffect(() => {
    (async () => {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith('wcie_cache_') || k.startsWith('menu_analysis_cache_'));
      const entries = await AsyncStorage.multiGet(cacheKeys);
      const parsed = entries.map(([storageKey, value]) => {
        if (!value) return null;
        try { return { storageKey, ...(JSON.parse(value) as AnalysisCacheEntry) }; } catch { return null; }
      }).filter(Boolean) as Array<AnalysisCacheEntry & { storageKey: string }>;
      parsed.sort((a, b) => b.timestamp - a.timestamp);
      setItems(parsed);
    })();
  }, []);

  const openItem = async (entry: AnalysisCacheEntry & { storageKey: string }) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    nav.navigate('Results', { analysis: entry.data });
  };

  const styles = createStyles(theme);
  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header} statusBarHeight={0}>
        <Appbar.BackAction onPress={() => nav.goBack()} />
        <Appbar.Content title="Recent Activity" />
      </Appbar.Header>
      <FlatList
        data={items}
        keyExtractor={(it) => it.storageKey}
        contentContainerStyle={{ paddingBottom: 8 }}
        renderItem={({ item }) => {
          const summary = summarizeResults(item.data.results || []);
          const subtitle = `${item.data.results?.length ?? 0} items analyzed • ${getTimeAgo(new Date(item.timestamp).toISOString())}`;
          return (
            <TouchableOpacity onPress={() => openItem(item)}>
              <View style={styles.itemRow}>
                <View style={styles.rowContent}>
                  <View style={styles.itemIconContainer}>
                    <Icon source={iconForType(item.meta?.inputType)} size={18} color={theme.colors.primary} />
                  </View>
                  <View style={styles.itemTextContainer}>
                    <Text variant="titleSmall" style={styles.itemTitle}>{titleForType(item.meta?.inputType)}</Text>
                    <Text variant="bodySmall" style={styles.itemSubtitle}>{subtitle}</Text>
                  </View>
                  <View style={styles.metricsRow}>
                    {summary.good > 0 && (
                      <Chip icon="check-circle" style={[styles.pill, { backgroundColor: theme.colors.semantic.safeLight }]} textStyle={{ color: theme.colors.semantic.safe }} compact>
                        {summary.good}
                      </Chip>
                    )}
                    {summary.careful > 0 && (
                      <Chip icon="alert-circle" style={[styles.pill, { backgroundColor: theme.colors.semantic.cautionLight }]} textStyle={{ color: theme.colors.semantic.caution }} compact>
                        {summary.careful}
                      </Chip>
                    )}
                    {summary.avoid > 0 && (
                      <Chip icon="close-circle" style={[styles.pill, { backgroundColor: theme.colors.semantic.avoidLight }]} textStyle={{ color: theme.colors.semantic.avoid }} compact>
                        {summary.avoid}
                      </Chip>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={() => (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ color: theme.colors.textSecondary }}>No recent activity yet</Text>
          </View>
        )}
      />
    </View>
  );
};

const titleForType = (t?: MenuInputType) => t === MenuInputType.IMAGE ? 'Camera Scan' : t === MenuInputType.URL ? 'Website Menu' : t === MenuInputType.TEXT ? 'Text Analysis' : 'Menu Analysis';
const iconForType = (t?: MenuInputType) => t === MenuInputType.IMAGE ? 'camera' : t === MenuInputType.URL ? 'web' : t === MenuInputType.TEXT ? 'text' : 'file-document';

const createStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    backgroundColor: theme.colors.background,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  itemRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    backgroundColor: 'transparent',
  },
  rowContent: { flexDirection: 'row', alignItems: 'center' },
  itemIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  itemTextContainer: { flex: 1 },
  itemTitle: { fontWeight: '600', color: theme.colors.text, marginBottom: 2 },
  itemSubtitle: { color: theme.colors.textSecondary },
  metricsRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginLeft: 8 },
  pill: { height: 26 },
});
