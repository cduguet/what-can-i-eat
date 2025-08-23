import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  WelcomeScreen,
  DietarySelectionScreen,
  CustomRestrictionsScreen
} from './index';
import { DietaryType, UserPreferences, UserSettings } from '@/types';
import { CompletionScreenWrapper } from './CompletionScreenWrapper';

// Define the onboarding stack parameter list
export type OnboardingStackParamList = {
  Welcome: undefined;
  DietarySelection: undefined;
  CustomRestrictions: { dietaryType: DietaryType };
  Completion: {
    preferences: UserPreferences;
    settings: UserSettings;
  };
};

const OnboardingStack = createStackNavigator<OnboardingStackParamList>();

interface OnboardingNavigatorProps {
  onComplete: (preferences: UserPreferences, settings: UserSettings) => void;
}

/**
 * Onboarding navigator that manages the flow between onboarding screens
 * Handles state management and persistence of user preferences
 */
export const OnboardingNavigator: React.FC<OnboardingNavigatorProps> = ({ 
  onComplete 
}) => {
  const [onboardingData, setOnboardingData] = useState({
    dietaryType: null as DietaryType | null,
    customRestrictions: '',
    settings: {
      hapticFeedback: true,
      notifications: true,
      highContrast: false,
      textSize: 'medium' as const,
      language: 'en',
    } as UserSettings,
  });

  const saveOnboardingProgress = async (data: any) => {
    try {
      await AsyncStorage.setItem('onboarding_progress', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save onboarding progress:', error);
    }
  };

  const loadOnboardingProgress = async () => {
    try {
      const saved = await AsyncStorage.getItem('onboarding_progress');
      if (saved) {
        const data = JSON.parse(saved);
        setOnboardingData(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Failed to load onboarding progress:', error);
    }
  };

  const completeOnboarding = async (preferences: UserPreferences, settings: UserSettings) => {
    try {
      // Save final preferences
      await AsyncStorage.setItem('user_preferences', JSON.stringify(preferences));
      await AsyncStorage.setItem('user_settings', JSON.stringify(settings));
      await AsyncStorage.setItem('onboarding_completed', 'true');
      
      // Clear progress data
      await AsyncStorage.removeItem('onboarding_progress');
      
      // Call completion callback
      onComplete(preferences, settings);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  useEffect(() => {
    loadOnboardingProgress();
  }, []);

  return (
    <OnboardingStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Disable swipe back to ensure proper flow
      }}
      initialRouteName="Welcome"
    >
      <OnboardingStack.Screen
        name="Welcome"
        component={WelcomeScreen}
      />
      <OnboardingStack.Screen
        name="DietarySelection"
        component={DietarySelectionScreen}
      />
      <OnboardingStack.Screen
        name="CustomRestrictions"
        component={CustomRestrictionsScreen}
      />
      <OnboardingStack.Screen
        name="Completion"
        children={(props) => (
          <CompletionScreenWrapper
            {...props}
            onComplete={completeOnboarding}
          />
        )}
      />
    </OnboardingStack.Navigator>
  );
};