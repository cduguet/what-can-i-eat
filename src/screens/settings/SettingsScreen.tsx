import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, Card, Text, RadioButton, Button, TextInput } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/theme/ThemeProvider';
import { DietaryType, UserPreferences } from '@/types';

export const SettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const [prefs, setPrefs] = useState<UserPreferences>({
    dietaryType: DietaryType.VEGAN,
    lastUpdated: new Date().toISOString(),
    onboardingCompleted: true,
    customRestrictions: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('user_preferences');
        if (raw) setPrefs(JSON.parse(raw));
      } catch {}
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    const next = { ...prefs, lastUpdated: new Date().toISOString() };
    setPrefs(next);
    await AsyncStorage.setItem('user_preferences', JSON.stringify(next));
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Settings" />
      </Appbar.Header>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Title title="Dietary Preferences" subtitle="Used for all analyses" />
          <Card.Content>
            <RadioButton.Group
              onValueChange={(v) => setPrefs(p => ({ ...p, dietaryType: v as DietaryType }))}
              value={prefs.dietaryType}
            >
              <View style={styles.radioRow}>
                <RadioButton value={DietaryType.VEGAN} />
                <Text>Vegan</Text>
              </View>
              <View style={styles.radioRow}>
                <RadioButton value={DietaryType.VEGETARIAN} />
                <Text>Vegetarian</Text>
              </View>
              <View style={styles.radioRow}>
                <RadioButton value={DietaryType.CUSTOM} />
                <Text>Custom</Text>
              </View>
            </RadioButton.Group>

            {prefs.dietaryType === DietaryType.CUSTOM && (
              <TextInput
                label="Custom restrictions"
                value={prefs.customRestrictions || ''}
                onChangeText={(t) => setPrefs(p => ({ ...p, customRestrictions: t }))}
                placeholder="e.g., no gluten, no peanuts, no dairy"
                multiline
                style={{ marginTop: 12 }}
              />
            )}
          </Card.Content>
        </Card>

        <Button mode="contained" onPress={save} disabled={loading}>
          Save Preferences
        </Button>
      </View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { backgroundColor: theme.colors.primary },
  content: { padding: 16, gap: 16 },
  card: { backgroundColor: theme.colors.surface },
  radioRow: { flexDirection: 'row', alignItems: 'center' },
});
