import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { ProgressIndicator } from '@/components/common';
import { useTheme } from '@/theme/ThemeProvider';
import { OnboardingStackParamList } from './OnboardingNavigator';

type WelcomeScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'Welcome'>;
type WelcomeScreenRouteProp = RouteProp<OnboardingStackParamList, 'Welcome'>;

interface WelcomeScreenProps {
  navigation: WelcomeScreenNavigationProp;
  route: WelcomeScreenRouteProp;
}

/**
 * Welcome screen for onboarding flow
 * Introduces the app and its purpose to new users
 */
export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  
  const handleGetStarted = async () => {
    // Provide haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Navigate to dietary selection screen
    navigation.navigate('DietarySelection');
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
          currentStep={1}
          totalSteps={4}
          accessibilityLabel="Welcome screen, step 1 of 4"
        />

        {/* App Logo/Icon Placeholder */}
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>🍽️</Text>
          </View>
        </View>

        {/* Welcome Content */}
        <View style={styles.contentContainer}>
          <Text variant="headlineLarge" style={styles.title}>
            Welcome to What Can I Eat?
          </Text>
          
          <Text variant="bodyLarge" style={styles.subtitle}>
            Your personal dietary companion
          </Text>

          <Card style={styles.featureCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.featureTitle}>
                🔍 Smart Menu Analysis
              </Text>
              <Text variant="bodyMedium" style={styles.featureDescription}>
                Scan restaurant menus and get instant recommendations based on your dietary preferences
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.featureCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.featureTitle}>
                🌱 Personalized Filtering
              </Text>
              <Text variant="bodyMedium" style={styles.featureDescription}>
                Set your dietary restrictions and get tailored suggestions for every meal
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.featureCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.featureTitle}>
                ✅ Confidence Ratings
              </Text>
              <Text variant="bodyMedium" style={styles.featureDescription}>
                Know exactly what's safe to eat with our detailed analysis and recommendations
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Get Started Button */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleGetStarted}
            style={styles.getStartedButton}
            contentStyle={styles.buttonContent}
            accessibilityLabel="Get started with onboarding"
            accessibilityHint="Proceeds to dietary preferences setup"
          >
            Get Started
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
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  logoText: {
    fontSize: 48,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginBottom: 32,
  },
  featureCard: {
    width: '100%',
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  featureTitle: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  featureDescription: {
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 32,
    paddingBottom: 20,
  },
  getStartedButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});