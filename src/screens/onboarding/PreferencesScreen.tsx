import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Switch, Card, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { ProgressIndicator } from '@/components/common';
import { UserSettings, UserPreferences, DietaryType } from '@/types';
import { OnboardingStackParamList } from './OnboardingNavigator';

type PreferencesNavigationProp = StackNavigationProp<OnboardingStackParamList, 'Preferences'>;
type PreferencesRouteProp = RouteProp<OnboardingStackParamList, 'Preferences'>;

interface PreferencesScreenProps {
  navigation: PreferencesNavigationProp;
  route: PreferencesRouteProp;
}

/**
 * Preferences screen for onboarding flow
 * Allows users to configure app settings and accessibility options
 */
export const PreferencesScreen: React.FC<PreferencesScreenProps> = ({
  navigation,
  route
}) => {
  const { dietaryType, customRestrictions } = route.params;
  const [preferences, setPreferences] = useState<UserSettings>({
    hapticFeedback: true,
    notifications: true,
    highContrast: false,
    textSize: 'medium',
    language: 'en',
  });

  const handleTogglePreference = async (key: keyof UserSettings, value: boolean) => {
    // Provide haptic feedback if enabled
    if (preferences.hapticFeedback) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleTextSizeChange = async (size: 'small' | 'medium' | 'large') => {
    // Provide haptic feedback if enabled
    if (preferences.hapticFeedback) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setPreferences(prev => ({
      ...prev,
      textSize: size,
    }));
  };

  const handleContinue = async () => {
    // Provide haptic feedback if enabled
    if (preferences.hapticFeedback) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Create user preferences object
    const userPreferences: UserPreferences = {
      dietaryType,
      customRestrictions: customRestrictions || undefined,
      userName: undefined, // Can be set later
      lastUpdated: new Date().toISOString(),
      onboardingCompleted: true,
    };
    
    // Navigate to completion screen
    navigation.navigate('Completion', {
      preferences: userPreferences,
      settings: preferences,
    });
  };

  const handleBack = async () => {
    // Provide haptic feedback if enabled
    if (preferences.hapticFeedback) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Indicator */}
        <ProgressIndicator
          currentStep={4}
          totalSteps={5}
          accessibilityLabel="Preferences screen, step 4 of 5"
        />

        {/* Header */}
        <View style={styles.headerContainer}>
          <Text variant="headlineMedium" style={styles.title}>
            Customize your experience
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Configure app settings to match your preferences
          </Text>
        </View>

        {/* Preferences Cards */}
        <View style={styles.preferencesContainer}>
          {/* General Settings */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                General Settings
              </Text>
              
              <View style={styles.preferenceItem}>
                <View style={styles.preferenceInfo}>
                  <Text variant="bodyMedium" style={styles.preferenceLabel}>
                    Haptic Feedback
                  </Text>
                  <Text variant="bodySmall" style={styles.preferenceDescription}>
                    Feel vibrations when interacting with the app
                  </Text>
                </View>
                <Switch
                  value={preferences.hapticFeedback}
                  onValueChange={(value) => handleTogglePreference('hapticFeedback', value)}
                  accessibilityLabel="Toggle haptic feedback"
                />
              </View>

              <Divider style={styles.divider} />

              <View style={styles.preferenceItem}>
                <View style={styles.preferenceInfo}>
                  <Text variant="bodyMedium" style={styles.preferenceLabel}>
                    Notifications
                  </Text>
                  <Text variant="bodySmall" style={styles.preferenceDescription}>
                    Receive updates and reminders
                  </Text>
                </View>
                <Switch
                  value={preferences.notifications}
                  onValueChange={(value) => handleTogglePreference('notifications', value)}
                  accessibilityLabel="Toggle notifications"
                />
              </View>
            </Card.Content>
          </Card>

          {/* Accessibility Settings */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Accessibility
              </Text>
              
              <View style={styles.preferenceItem}>
                <View style={styles.preferenceInfo}>
                  <Text variant="bodyMedium" style={styles.preferenceLabel}>
                    High Contrast
                  </Text>
                  <Text variant="bodySmall" style={styles.preferenceDescription}>
                    Increase contrast for better visibility
                  </Text>
                </View>
                <Switch
                  value={preferences.highContrast}
                  onValueChange={(value) => handleTogglePreference('highContrast', value)}
                  accessibilityLabel="Toggle high contrast mode"
                />
              </View>

              <Divider style={styles.divider} />

              <View style={styles.textSizeContainer}>
                <Text variant="bodyMedium" style={styles.preferenceLabel}>
                  Text Size
                </Text>
                <Text variant="bodySmall" style={styles.preferenceDescription}>
                  Choose your preferred text size
                </Text>
                
                <View style={styles.textSizeButtons}>
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <Button
                      key={size}
                      mode={preferences.textSize === size ? 'contained' : 'outlined'}
                      onPress={() => handleTextSizeChange(size)}
                      style={[
                        styles.textSizeButton,
                        preferences.textSize === size && styles.selectedTextSizeButton
                      ]}
                      compact
                      accessibilityLabel={`Set text size to ${size}`}
                      accessibilityState={{ selected: preferences.textSize === size }}
                    >
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </Button>
                  ))}
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={handleBack}
            style={styles.backButton}
            contentStyle={styles.buttonContent}
            accessibilityLabel="Go back to previous screen"
          >
            Back
          </Button>
          
          <Button
            mode="contained"
            onPress={handleContinue}
            style={styles.continueButton}
            contentStyle={styles.buttonContent}
            accessibilityLabel="Continue to completion"
            accessibilityHint="Proceeds to final onboarding step"
          >
            Continue
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  headerContainer: {
    marginVertical: 24,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    color: '#006064',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666666',
    lineHeight: 24,
  },
  preferencesContainer: {
    flex: 1,
    marginVertical: 16,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  cardTitle: {
    color: '#006064',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 16,
  },
  preferenceLabel: {
    color: '#212121',
    fontWeight: '500',
    marginBottom: 4,
  },
  preferenceDescription: {
    color: '#666666',
    lineHeight: 18,
  },
  divider: {
    marginVertical: 12,
  },
  textSizeContainer: {
    paddingVertical: 8,
  },
  textSizeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  textSizeButton: {
    flex: 1,
    borderColor: '#006064',
  },
  selectedTextSizeButton: {
    backgroundColor: '#006064',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    paddingBottom: 20,
    gap: 16,
  },
  backButton: {
    flex: 1,
    borderColor: '#006064',
    borderRadius: 8,
  },
  continueButton: {
    flex: 1,
    backgroundColor: '#006064',
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});