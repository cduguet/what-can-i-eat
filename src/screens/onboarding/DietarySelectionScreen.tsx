import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { ProgressIndicator, DietaryOptionCard } from '@/components/common';
import { DietaryType } from '@/types';
import { OnboardingStackParamList } from './OnboardingNavigator';

type DietarySelectionNavigationProp = StackNavigationProp<OnboardingStackParamList, 'DietarySelection'>;
type DietarySelectionRouteProp = RouteProp<OnboardingStackParamList, 'DietarySelection'>;

interface DietarySelectionScreenProps {
  navigation: DietarySelectionNavigationProp;
  route: DietarySelectionRouteProp;
}

/**
 * Dietary selection screen for onboarding flow
 * Allows users to choose their dietary restrictions
 */
export const DietarySelectionScreen: React.FC<DietarySelectionScreenProps> = ({ 
  navigation 
}) => {
  const [selectedDietaryType, setSelectedDietaryType] = useState<DietaryType | null>(null);

  const handleDietarySelection = async (type: DietaryType) => {
    // Provide haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDietaryType(type);
  };

  const handleContinue = async () => {
    if (!selectedDietaryType) return;

    // Provide haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Navigate based on selection
    if (selectedDietaryType === DietaryType.CUSTOM) {
      // Navigate to custom restrictions screen
      navigation.navigate('CustomRestrictions', { dietaryType: selectedDietaryType });
    } else {
      // Navigate to preferences screen
      navigation.navigate('Preferences', { dietaryType: selectedDietaryType });
    }
  };

  const handleBack = async () => {
    // Provide haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
          currentStep={2}
          totalSteps={5}
          accessibilityLabel="Dietary selection screen, step 2 of 5"
        />

        {/* Header */}
        <View style={styles.headerContainer}>
          <Text variant="headlineMedium" style={styles.title}>
            What are your dietary preferences?
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Choose the option that best describes your dietary needs
          </Text>
        </View>

        {/* Dietary Options */}
        <View style={styles.optionsContainer}>
          <DietaryOptionCard
            type={DietaryType.VEGAN}
            selected={selectedDietaryType === DietaryType.VEGAN}
            onPress={handleDietarySelection}
          />
          
          <DietaryOptionCard
            type={DietaryType.VEGETARIAN}
            selected={selectedDietaryType === DietaryType.VEGETARIAN}
            onPress={handleDietarySelection}
          />
          
          <DietaryOptionCard
            type={DietaryType.CUSTOM}
            selected={selectedDietaryType === DietaryType.CUSTOM}
            onPress={handleDietarySelection}
          />
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
            disabled={!selectedDietaryType}
            style={[
              styles.continueButton,
              !selectedDietaryType && styles.disabledButton
            ]}
            contentStyle={styles.buttonContent}
            accessibilityLabel="Continue to next step"
            accessibilityHint={
              selectedDietaryType 
                ? "Proceeds to next onboarding step" 
                : "Select a dietary preference to continue"
            }
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
  optionsContainer: {
    flex: 1,
    marginVertical: 16,
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
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  buttonContent: {
    paddingVertical: 8,
  },
});