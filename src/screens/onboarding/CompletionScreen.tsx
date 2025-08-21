import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { ProgressIndicator } from '@/components/common';
import { UserPreferences, UserSettings } from '@/types';
import { OnboardingStackParamList } from './OnboardingNavigator';

type CompletionNavigationProp = StackNavigationProp<OnboardingStackParamList, 'Completion'>;
type CompletionRouteProp = RouteProp<OnboardingStackParamList, 'Completion'>;

interface CompletionScreenProps {
  navigation: CompletionNavigationProp;
  route: CompletionRouteProp;
}

/**
 * Completion screen for onboarding flow
 * Congratulates user and provides next steps
 */
export const CompletionScreen: React.FC<CompletionScreenProps> = ({
  navigation,
  route
}) => {
  const { preferences, settings } = route.params;
  useEffect(() => {
    // Provide success haptic feedback when screen loads
    const playSuccessHaptic = async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };
    
    playSuccessHaptic();
  }, []);

  const handleStartUsing = async () => {
    // Provide haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Navigate to main app (Camera screen for now)
    navigation.navigate('Camera');
  };

  const handleGoToSettings = async () => {
    // Provide haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Navigate to settings
    navigation.navigate('Settings');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Indicator */}
        <ProgressIndicator
          currentStep={5}
          totalSteps={5}
          accessibilityLabel="Onboarding complete, step 5 of 5"
        />

        {/* Success Icon */}
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>🎉</Text>
          </View>
        </View>

        {/* Header */}
        <View style={styles.headerContainer}>
          <Text variant="headlineLarge" style={styles.title}>
            You're all set!
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Welcome to What Can I Eat? Let's start exploring menus together.
          </Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <Card style={styles.summaryCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.summaryTitle}>
                🍽️ Ready to Scan
              </Text>
              <Text variant="bodyMedium" style={styles.summaryDescription}>
                Your dietary preferences have been saved. Start by taking a photo of any menu to get personalized recommendations.
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.summaryCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.summaryTitle}>
                ⚙️ Customize Anytime
              </Text>
              <Text variant="bodyMedium" style={styles.summaryDescription}>
                You can always update your dietary restrictions and preferences in the settings menu.
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.summaryCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.summaryTitle}>
                🔍 Smart Analysis
              </Text>
              <Text variant="bodyMedium" style={styles.summaryDescription}>
                Our AI will analyze menu items and categorize them as safe, questionable, or to avoid based on your preferences.
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Quick Tips */}
        <View style={styles.tipsContainer}>
          <Text variant="titleMedium" style={styles.tipsTitle}>
            Quick Tips:
          </Text>
          <Text variant="bodySmall" style={styles.tipText}>
            • Take clear photos of menus for best results
          </Text>
          <Text variant="bodySmall" style={styles.tipText}>
            • Always double-check with restaurant staff for allergies
          </Text>
          <Text variant="bodySmall" style={styles.tipText}>
            • Update your preferences as your diet changes
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={handleGoToSettings}
            style={styles.settingsButton}
            contentStyle={styles.buttonContent}
            accessibilityLabel="Go to settings"
            accessibilityHint="Review and modify your preferences"
          >
            Review Settings
          </Button>
          
          <Button
            mode="contained"
            onPress={handleStartUsing}
            style={styles.startButton}
            contentStyle={styles.buttonContent}
            accessibilityLabel="Start using the app"
            accessibilityHint="Begin scanning menus"
          >
            Start Scanning
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
  successContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  successEmoji: {
    fontSize: 40,
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
  summaryContainer: {
    marginVertical: 16,
  },
  summaryCard: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  summaryTitle: {
    color: '#006064',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summaryDescription: {
    color: '#666666',
    lineHeight: 20,
  },
  tipsContainer: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 1,
  },
  tipsTitle: {
    color: '#006064',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tipText: {
    color: '#666666',
    marginBottom: 6,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    paddingBottom: 20,
    gap: 16,
  },
  settingsButton: {
    flex: 1,
    borderColor: '#006064',
    borderRadius: 8,
  },
  startButton: {
    flex: 1,
    backgroundColor: '#006064',
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});