import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, Card, Switch, Text, RadioButton, Button, TextInput } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/theme/ThemeProvider';
import { UserSettings } from '@/types';

const DEFAULT_SETTINGS: UserSettings = {
  hapticFeedback: true,
  notifications: true,
  highContrast: false,
  textSize: 'medium',
  language: 'en',
};

export const SettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('user_settings');
        if (raw) setSettings(JSON.parse(raw));
      } catch {}
      setLoading(false);
    })();
  }, []);

  const save = async (next: Partial<UserSettings> = {}) => {
    const merged = { ...settings, ...next };
    setSettings(merged);
    await AsyncStorage.setItem('user_settings', JSON.stringify(merged));
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Settings" />
      </Appbar.Header>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Title title="Accessibility & Feedback" />
          <Card.Content>
            <View style={styles.row}>
              <Text style={styles.label}>Haptic Feedback</Text>
              <Switch value={settings.hapticFeedback} onValueChange={(v) => save({ hapticFeedback: v })} />
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>High Contrast</Text>
              <Switch value={settings.highContrast} onValueChange={(v) => save({ highContrast: v })} />
            </View>
            <View style={styles.group}>
              <Text style={styles.label}>Text Size</Text>
              <RadioButton.Group
                onValueChange={(v) => save({ textSize: v as UserSettings['textSize'] })}
                value={settings.textSize}
              >
                <View style={styles.radioRow}>
                  <RadioButton value="small" />
                  <Text>Small</Text>
                </View>
                <View style={styles.radioRow}>
                  <RadioButton value="medium" />
                  <Text>Medium</Text>
                </View>
                <View style={styles.radioRow}>
                  <RadioButton value="large" />
                  <Text>Large</Text>
                </View>
              </RadioButton.Group>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="General" />
          <Card.Content>
            <View style={styles.row}>
              <Text style={styles.label}>Notifications</Text>
              <Switch value={settings.notifications} onValueChange={(v) => save({ notifications: v })} />
            </View>
            <TextInput
              label="Language"
              value={settings.language}
              onChangeText={(v) => save({ language: v })}
              style={{ marginTop: 12 }}
            />
          </Card.Content>
        </Card>

        <Button mode="contained" onPress={() => save() } disabled={loading}>
          Save
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
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  group: { marginTop: 8 },
  radioRow: { flexDirection: 'row', alignItems: 'center' },
  label: { color: theme.colors.text },
});

