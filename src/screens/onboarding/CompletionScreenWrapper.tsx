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
import { useTheme } from '@/theme/ThemeProvider';

type CompletionNavigationProp = StackNavigationProp<OnboardingStackParamList, 'Completion'>;
type CompletionRouteProp = RouteProp<OnboardingStackParamList, 'Completion'>;

interface CompletionScreenWrapperProps {
  navigation: CompletionNavigationProp;
  route: CompletionRouteProp;
  onComplete: (preferences: UserPreferences, settings: UserSettings) => void;
}

/**
 * Completion screen wrapper that handles onboarding completion
 * and navigation to the main app
 */
export const CompletionScreenWrapper: React.FC<CompletionScreenWrapperProps> = ({ 
  navigation,
  route,
  onComplete
}) => {
  const { theme } = useTheme();
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
    
    // Complete onboarding and navigate to main app
    onComplete(preferences, settings);
  };

  const handleGoToSettings = async () => {
    // Provide haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Complete onboarding but indicate user wants to go to settings
    onComplete(preferences, { ...settings, _navigateToSettings: true } as any);
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Indicator */}
        <ProgressIndicator
          currentStep={4}
          totalSteps={4}
          accessibilityLabel="Onboarding complete, step 4 of 4"
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
const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.md,
  },
  successContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.semantic.safeLight,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  successEmoji: {
    fontSize: 40,
  },
  headerContainer: {
    marginVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  summaryContainer: {
    marginVertical: theme.spacing.md,
  },
  summaryCard: {
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  summaryTitle: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  summaryDescription: {
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  tipsContainer: {
    marginVertical: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    elevation: 1,
  },
  tipsTitle: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  tipText: {
    color: theme.colors.textSecondary,
    marginBottom: 6,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: 16,
  },
  settingsButton: {
    flex: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  startButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
