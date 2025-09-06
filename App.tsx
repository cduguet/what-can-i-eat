import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { RootStackParamList, UserPreferences, UserSettings } from '@/types';
import { OnboardingNavigator } from '@/screens/onboarding/OnboardingNavigator';
import { HomeScreen } from '@/screens/main/HomeScreen';
import { RecentActivityScreen } from '@/screens/main/RecentActivityScreen';
import { CameraScreen } from '@/screens/camera/CameraScreen';
import { ResultsScreen } from '@/screens/results/ResultsScreen';
import { authService, AuthState } from '@/services/auth/authService';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

// Temporary placeholder screen for Settings
import { StyleSheet, Text, View } from 'react-native';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';

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

// Main App component wrapped with theme
function AppContent() {
  const { theme } = useTheme();
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
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.primary }]}>
          {isInitializing ? 'Initializing...' : 'Loading...'}
        </Text>
        {authState && (
          <Text style={[styles.authStatusText, { color: theme.colors.textSecondary }]}>
            {authState.isAuthenticated ? 'Authenticated' : 'Connecting...'}
          </Text>
        )}
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      {!isOnboardingComplete ? (
        <OnboardingNavigator onComplete={handleOnboardingComplete} />
      ) : (
        <Stack.Navigator initialRouteName="Home">
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
            options={{ title: 'Analysis Results', headerShown: false }}
          />
          <Stack.Screen name="RecentActivity" component={RecentActivityScreen} options={{ title: 'Recent Activity', headerShown: false }} />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={() => ({
              title: 'Settings',
              headerBackTitleVisible: false,
              headerBackTitle: ' ',
              headerTruncatedBackTitle: ' ',
              headerTintColor: theme.colors.text,
              headerStyle: {
                backgroundColor: theme.colors.background,
                elevation: 0,
                shadowOpacity: 0,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: theme.colors.border,
              },
              headerTitleStyle: {
                fontFamily: theme.typography.fontFamily.bold,
                fontSize: 20,
                color: theme.colors.text,
              },
            })}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '500',
  },
  authStatusText: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: '400',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
