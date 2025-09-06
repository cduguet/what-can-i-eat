import React, { useEffect, useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import AccentButton from '@/components/ui/AccentButton';
import Pill from '@/components/ui/Pill';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/theme/ThemeProvider';
import { DietaryType, UserPreferences } from '@/types';
import { SafeAreaView } from 'react-native-safe-area-context';

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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'on-drag' : 'interactive'}
          >
            <Text style={styles.sectionTitle}>Dietary Preferences</Text>
            <View style={styles.pillsRow}>
              <Pill
                label="Vegan"
                color={
                  prefs.dietaryType === DietaryType.VEGAN
                    ? theme.colors.semantic.safeLight
                    : theme.colors.border
                }
                textColor={
                  prefs.dietaryType === DietaryType.VEGAN
                    ? theme.colors.semantic.safe
                    : theme.colors.text
                }
                style={styles.pill}
                leading={<Text>🌿</Text>}
                onPress={() => setPrefs((p) => ({ ...p, dietaryType: DietaryType.VEGAN }))}
              />
              <Pill
                label="Vegetarian"
                color={
                  prefs.dietaryType === DietaryType.VEGETARIAN
                    ? theme.colors.semantic.safeLight
                    : theme.colors.border
                }
                textColor={
                  prefs.dietaryType === DietaryType.VEGETARIAN
                    ? theme.colors.semantic.safe
                    : theme.colors.text
                }
                style={styles.pill}
                leading={<Text>🥗</Text>}
                onPress={() => setPrefs((p) => ({ ...p, dietaryType: DietaryType.VEGETARIAN }))}
              />
              <Pill
                label="Custom"
                color={
                  prefs.dietaryType === DietaryType.CUSTOM
                    ? theme.colors.semantic.cautionLight
                    : theme.colors.border
                }
                textColor={
                  prefs.dietaryType === DietaryType.CUSTOM
                    ? theme.colors.semantic.caution
                    : theme.colors.text
                }
                style={styles.pill}
                leading={<Text>✏️</Text>}
                onPress={() => setPrefs((p) => ({ ...p, dietaryType: DietaryType.CUSTOM }))}
              />
            </View>

            {prefs.dietaryType === DietaryType.CUSTOM && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.label}>Custom restrictions</Text>
                <TextInput
                  mode="outlined"
                  value={prefs.customRestrictions || ''}
                  onChangeText={(t) => setPrefs((p) => ({ ...p, customRestrictions: t }))}
                  placeholder="e.g., no gluten, no peanuts, no dairy"
                  multiline
                  style={styles.textArea}
                  outlineColor={theme.colors.primary}
                />
              </View>
            )}

            <View style={{ marginTop: 16 }}>
              <AccentButton title="Save Preferences" onPress={save} disabled={loading} />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16 },
  sectionTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: 18, color: theme.colors.text },
  pillsRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  pill: {},
  label: { color: theme.colors.textSecondary, marginBottom: 6 },
  textArea: { backgroundColor: theme.colors.surface },
});
