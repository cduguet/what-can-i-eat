import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, TextInput, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { ProgressIndicator } from '@/components/common';
import { DietaryType, UserPreferences, UserSettings } from '@/types';
import { OnboardingStackParamList } from './OnboardingNavigator';
import { useTheme } from '@/theme/ThemeProvider';

type CustomRestrictionsNavigationProp = StackNavigationProp<OnboardingStackParamList, 'CustomRestrictions'>;
type CustomRestrictionsRouteProp = RouteProp<OnboardingStackParamList, 'CustomRestrictions'>;

interface CustomRestrictionsScreenProps {
  navigation: CustomRestrictionsNavigationProp;
  route: CustomRestrictionsRouteProp;
}

/**
 * Custom restrictions screen for onboarding flow
 * Allows users to input their specific dietary restrictions
 */
export const CustomRestrictionsScreen: React.FC<CustomRestrictionsScreenProps> = ({
  navigation,
  route
}) => {
  const { theme } = useTheme();
  const { dietaryType } = route.params;
  const [customRestrictions, setCustomRestrictions] = useState('');
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validateInput = (text: string): boolean => {
    const trimmedText = text.trim();
    
    if (trimmedText.length === 0) {
      setErrorMessage('Please enter your dietary restrictions');
      setHasError(true);
      return false;
    }
    
    if (trimmedText.length < 3) {
      setErrorMessage('Please provide more details about your restrictions');
      setHasError(true);
      return false;
    }
    
    if (trimmedText.length > 500) {
      setErrorMessage('Please keep your restrictions under 500 characters');
      setHasError(true);
      return false;
    }
    
    setHasError(false);
    setErrorMessage('');
    return true;
  };

  const handleTextChange = (text: string) => {
    setCustomRestrictions(text);
    
    // Clear errors when user starts typing
    if (hasError && text.trim().length > 0) {
      setHasError(false);
      setErrorMessage('');
    }
  };

  const handleContinue = async () => {
    // Provide haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (!validateInput(customRestrictions)) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Provide success haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Create user preferences object
    const userPreferences: UserPreferences = {
      dietaryType,
      customRestrictions: customRestrictions.trim(),
      userName: undefined,
      lastUpdated: new Date().toISOString(),
      onboardingCompleted: true,
    };
    
    // Create default settings
    const defaultSettings: UserSettings = {
      hapticFeedback: true,
      notifications: true,
      highContrast: false,
      textSize: 'medium',
      language: 'en',
    };
    
    // Navigate directly to completion screen
    navigation.navigate('Completion', {
      preferences: userPreferences,
      settings: defaultSettings,
    });
  };

  const handleBack = async () => {
    // Provide haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const isValid = customRestrictions.trim().length >= 3 && !hasError;

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress Indicator */}
          <ProgressIndicator
            currentStep={3}
            totalSteps={4}
            accessibilityLabel="Custom restrictions screen, step 3 of 4"
          />

          {/* Header */}
          <View style={styles.headerContainer}>
            <Text variant="headlineMedium" style={styles.title}>
              Tell us about your dietary restrictions
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Be as specific as possible to get the most accurate recommendations
            </Text>
          </View>

          {/* Input Section */}
          <View style={styles.inputContainer}>
            <TextInput
              label="Dietary Restrictions"
              value={customRestrictions}
              onChangeText={handleTextChange}
              multiline
              numberOfLines={6}
              mode="outlined"
              style={styles.textInput}
              placeholder="e.g., No nuts, shellfish, or dairy. Gluten-free preferred..."
              error={hasError}
              accessibilityLabel="Enter your custom dietary restrictions"
              accessibilityHint="Describe any foods you cannot or prefer not to eat"
            />
            
            <HelperText type={hasError ? 'error' : 'info'} visible={hasError || customRestrictions.length > 0}>
              {hasError ? errorMessage : `${customRestrictions.length}/500 characters`}
            </HelperText>

            {/* Examples */}
            <View style={styles.examplesContainer}>
              <Text variant="titleSmall" style={styles.examplesTitle}>
                Examples:
              </Text>
              <Text variant="bodySmall" style={styles.exampleText}>
                • "No nuts, dairy, or eggs due to allergies"
              </Text>
              <Text variant="bodySmall" style={styles.exampleText}>
                • "Gluten-free and low sodium diet"
              </Text>
              <Text variant="bodySmall" style={styles.exampleText}>
                • "No red meat, shellfish, or spicy foods"
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={handleBack}
            style={styles.backButton}
            contentStyle={styles.buttonContent}
            accessibilityLabel="Go back to dietary selection"
          >
            Back
          </Button>
          
          <Button
            mode="contained"
            onPress={handleContinue}
            disabled={!isValid}
            style={[
              styles.continueButton,
              !isValid && styles.disabledButton
            ]}
            contentStyle={styles.buttonContent}
            accessibilityLabel="Continue to completion"
            accessibilityHint={
              isValid
                ? "Proceeds to final onboarding step"
                : "Enter valid dietary restrictions to continue"
            }
          >
            Continue
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.md,
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
  inputContainer: {
    flex: 1,
    marginVertical: theme.spacing.md,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.xs,
  },
  examplesContainer: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    elevation: 1,
  },
  examplesTitle: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  exampleText: {
    color: theme.colors.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    gap: 16,
  },
  backButton: {
    flex: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  continueButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  disabledButton: {
    backgroundColor: theme.colors.border,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
