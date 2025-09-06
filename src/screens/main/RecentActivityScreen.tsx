import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Appbar, Card, Text, Chip, Icon } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/theme/ThemeProvider';
import { GeminiResponse, MenuInputType } from '@/types';
import type { AnalysisCacheEntry } from '@/services/cache/recentCache';
import * as Haptics from 'expo-haptics';
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
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => nav.goBack()} />
        <Appbar.Content title="Recent Activity" />
      </Appbar.Header>
      <FlatList
        data={items}
        keyExtractor={(it) => it.storageKey}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openItem(item)}>
            <Card style={styles.card}>
              <Card.Title
                title={titleForType(item.meta?.inputType)}
                subtitle={`${item.data.results?.length ?? 0} items analyzed`}
                left={(props) => <Icon {...props} source={iconForType(item.meta?.inputType)} color={theme.colors.primary} />}
              />
              {item.data.results && (
                <Card.Content>
                  <View style={styles.chips}>
                    <Chip icon="check-circle" compact>{item.data.results.filter(r => r.suitability === 'good').length}</Chip>
                    <Chip icon="alert-circle" compact>{item.data.results.filter(r => r.suitability === 'careful').length}</Chip>
                    <Chip icon="close-circle" compact>{item.data.results.filter(r => r.suitability === 'avoid').length}</Chip>
                  </View>
                </Card.Content>
              )}
            </Card>
          </TouchableOpacity>
        )}
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
  header: { backgroundColor: theme.colors.primary },
  card: { marginBottom: 12, backgroundColor: theme.colors.surface },
  chips: { flexDirection: 'row', gap: 8 },
});

