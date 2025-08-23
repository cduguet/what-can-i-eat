import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { RootStackParamList, UserPreferences, UserSettings } from '@/types';
import { OnboardingNavigator } from '@/screens/onboarding/OnboardingNavigator';
import { HomeScreen } from '@/screens/main/HomeScreen';
import { CameraScreen } from '@/screens/camera/CameraScreen';
import { ResultsScreen } from '@/screens/results/ResultsScreen';
import { authService, AuthState } from '@/services/auth/authService';

// Temporary placeholder screen for Settings
import { StyleSheet, Text, View } from 'react-native';

const PlaceholderScreen = ({ route }: { route: { name: string } }) => (
  <View style={styles.container}>
    <Text style={styles.title}>What Can I Eat?</Text>
    <Text style={styles.subtitle}>{route.name} Screen</Text>
    <Text style={styles.description}>
      This is a placeholder for the {route.name.toLowerCase()} screen.
    </Text>
  </View>
);

const Stack = createStackNavigator<RootStackParamList>();

// Custom theme for the app with deep teal primary color
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#006064',
    accent: '#FF9800',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#212121',
  },
};

export default function App() {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize authentication first
      console.log('Initializing authentication...');
      const authResult = await authService.initializeAuth();
      
      if (!authResult.success) {
        console.error('Authentication initialization failed:', authResult.error);
      } else {
        console.log('Authentication initialized successfully');
      }

      // Set up auth state listener
      const unsubscribe = authService.onAuthStateChange((newAuthState) => {
        setAuthState(newAuthState);
        console.log('Auth state changed:', {
          isAuthenticated: newAuthState.isAuthenticated,
          isAnonymous: newAuthState.user?.is_anonymous,
        });
      });

      // Check onboarding status
      await checkOnboardingStatus();

      setIsInitializing(false);

      // Cleanup function
      return unsubscribe;
    } catch (error) {
      console.error('App initialization failed:', error);
      setIsInitializing(false);
    }
  };

  const checkOnboardingStatus = async () => {
    try {
      const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
      const preferences = await AsyncStorage.getItem('user_preferences');
      const settings = await AsyncStorage.getItem('user_settings');

      if (onboardingCompleted === 'true' && preferences && settings) {
        setUserPreferences(JSON.parse(preferences));
        setUserSettings(JSON.parse(settings));
        setIsOnboardingComplete(true);
      } else {
        setIsOnboardingComplete(false);
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      setIsOnboardingComplete(false);
    }
  };

  const handleOnboardingComplete = async (preferences: UserPreferences, settings: UserSettings) => {
    setUserPreferences(preferences);
    setUserSettings(settings);
    setIsOnboardingComplete(true);
  };

  // Show loading state while initializing app and checking onboarding status
  if (isInitializing || isOnboardingComplete === null || authState === null) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              {isInitializing ? 'Initializing...' : 'Loading...'}
            </Text>
            {authState && (
              <Text style={styles.authStatusText}>
                {authState.isAuthenticated ? 'Authenticated' : 'Connecting...'}
              </Text>
            )}
          </View>
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <StatusBar style="auto" />
          {!isOnboardingComplete ? (
            <OnboardingNavigator onComplete={handleOnboardingComplete} />
          ) : (
            <Stack.Navigator
              initialRouteName="Home"
              screenOptions={{
                headerStyle: {
                  backgroundColor: theme.colors.primary,
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            >
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{
                  title: 'What Can I Eat?',
                  headerShown: false // Hide header as the screen has its own title
                }}
              />
              <Stack.Screen
                name="Camera"
                component={CameraScreen}
                options={{
                  title: 'Scan Menu',
                  headerShown: false // Hide header for full-screen camera
                }}
              />
              <Stack.Screen
                name="Results"
                component={ResultsScreen}
                options={{ title: 'Analysis Results' }}
              />
              <Stack.Screen
                name="Settings"
                component={PlaceholderScreen}
                options={{ title: 'Settings' }}
              />
            </Stack.Navigator>
          )}
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#006064',
    fontWeight: '500',
  },
  authStatusText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontWeight: '400',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#006064',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 15,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});
