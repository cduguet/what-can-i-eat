import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { Text, Button, Card, TextInput, Portal, Modal, IconButton } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList, UserPreferences, MenuInputType, CameraPermissionStatus } from '@/types';
import { CameraButton } from '@/components/common/CameraButton';
import AccentButton from '@/components/ui/AccentButton';
import Pill from '@/components/ui/Pill';
import { RecentActivity } from '@/components/common/RecentActivity';
import { useTheme } from '@/theme/ThemeProvider';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface HomeScreenProps {}

/**
 * Main home screen interface with camera, URL, and text input options
 * 
 * Features:
 * - Primary camera button for menu scanning
 * - URL input for restaurant website analysis
 * - Text input for manual menu entry
 * - Recent activity display
 * - User preferences integration
 * - Accessibility support
 */
export const HomeScreen: React.FC<HomeScreenProps> = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // State management
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isUrlModalVisible, setIsUrlModalVisible] = useState(false);
  const [isTextModalVisible, setIsTextModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [textError, setTextError] = useState('');

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  /**
   * Load user preferences and settings from AsyncStorage
   */
  const loadUserData = async () => {
    try {
      const [preferencesData] = await Promise.all([
        AsyncStorage.getItem('user_preferences'),
      ]);

      if (preferencesData) {
        setUserPreferences(JSON.parse(preferencesData));
      }
      // No extra app settings required
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  /**
   * Provide haptic feedback if enabled
   */
  const triggerHapticFeedback = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  /**
   * Handle camera button press
   */
  const handleCameraPress = async () => {
    await triggerHapticFeedback();
    // Navigate to camera screen (will be implemented by camera module)
    navigation.navigate('Camera');
  };

  /**
   * Validate URL input
   */
  const validateUrl = (url: string): boolean => {
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return urlPattern.test(url);
  };

  /**
   * Handle URL input submission
   */
  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) {
      setUrlError('Please enter a URL');
      return;
    }

    if (!validateUrl(urlInput)) {
      setUrlError('Please enter a valid URL');
      return;
    }

    await triggerHapticFeedback();
    setIsLoading(true);
    setUrlError('');

    try {
      // Navigate to results with URL data
      navigation.navigate('Results', { menuUrl: urlInput });
      setIsUrlModalVisible(false);
      setUrlInput('');
    } catch (error) {
      console.error('Failed to process URL:', error);
      setUrlError('Failed to process URL. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle text input submission
   */
  const handleTextSubmit = async () => {
    if (!textInput.trim()) {
      setTextError('Please enter menu text');
      return;
    }

    if (textInput.trim().length < 10) {
      setTextError('Please enter at least 10 characters');
      return;
    }

    await triggerHapticFeedback();
    setIsLoading(true);
    setTextError('');

    try {
      // Navigate to results with text data
      navigation.navigate('Results', { menuText: textInput });
      setIsTextModalVisible(false);
      setTextInput('');
    } catch (error) {
      console.error('Failed to process text:', error);
      setTextError('Failed to process text. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle URL modal open
   */
  const handleUrlModalOpen = async () => {
    await triggerHapticFeedback();
    setIsUrlModalVisible(true);
    setUrlError('');
  };

  /**
   * Handle text modal open
   */
  const handleTextModalOpen = async () => {
    await triggerHapticFeedback();
    setIsTextModalVisible(true);
    setTextError('');
  };

  /**
   * Handle settings navigation
   */
  const handleSettingsPress = async () => {
    await triggerHapticFeedback();
    navigation.navigate('Settings');
  };

  /**
   * Get dietary preference display text
   */
  const getDietaryDisplayText = (): string => {
    if (!userPreferences) return 'Not set';
    
    switch (userPreferences.dietaryType) {
      case 'vegan':
        return 'Vegan';
      case 'vegetarian':
        return 'Vegetarian';
      case 'custom':
        return 'Custom restrictions';
      default:
        return 'Not set';
    }
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="always"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={[styles.header, { paddingTop: Math.max(16, insets.top + 8) }]}>
          <View style={styles.headerContent}>
            <Text variant="headlineMedium" style={styles.title}>
              What Can I Eat?
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Scan, analyze, and discover safe food options
            </Text>
          </View>
          <IconButton
            icon="cog"
            size={24}
            iconColor={theme.colors.primary}
            onPress={handleSettingsPress}
            onLongPress={async () => {
              Alert.alert(
                'Reset Onboarding?',
                'This will clear your onboarding status and preferences. You may need to restart the app to see onboarding screens again.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Reset', 
                    style: 'destructive', 
                    onPress: async () => {
                      try {
                        await AsyncStorage.removeItem('onboarding_completed');
                        await AsyncStorage.removeItem('user_preferences');
                        await AsyncStorage.removeItem('user_settings');
                        Alert.alert('Onboarding reset', 'Restart the app to view the updated onboarding flow.');
                      } catch (e) {
                        console.error('Failed to reset onboarding:', e);
                      }
                    }
                  }
                ]
              );
            }}
            accessibilityLabel="Settings"
          />
        </View>

        {/* User Preferences Display */}
        {userPreferences && (
          <View style={styles.prefsRow}>
            <Pill
              label={getDietaryDisplayText()}
              color={theme.colors.semantic.safeLight}
              textColor={theme.colors.semantic.safe}
            />
          </View>
        )}

        {/* Primary Camera Action */}
        <View style={styles.primarySection}>
          <CameraButton
            onPress={handleCameraPress}
            disabled={isLoading}
          />
        </View>

        {/* Secondary Input Options */}
        <View style={styles.secondarySection}>
          <View style={styles.inlineButtons}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <AccentButton title="Analyze URL" onPress={handleUrlModalOpen} />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <AccentButton title="Enter Text" onPress={handleTextModalOpen} color={theme.colors.border} textColor={theme.colors.text} />
            </View>
          </View>

          {/* Developer helper to preview results UI */}
          <View style={{ marginTop: 12 }}>
            <Button
              mode="outlined"
              icon="eye"
              onPress={() => navigation.navigate('Results')}
              accessibilityLabel="Preview demo results"
            >
              View Demo Results
            </Button>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentSection}>
          <RecentActivity />
        </View>
      </ScrollView>

      {/* URL Input Modal */}
      <Portal>
        <Modal
          visible={isUrlModalVisible}
          onDismiss={() => setIsUrlModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.modalCard}>
            <Card.Title
              title="Analyze Menu URL"
              subtitle="Enter a restaurant website URL to analyze"
              left={(props) => <IconButton {...props} icon="web" />}
              right={(props) => (
                <IconButton
                  {...props}
                  icon="close"
                  onPress={() => setIsUrlModalVisible(false)}
                />
              )}
            />
            <Card.Content>
              <TextInput
                label="Restaurant URL"
                value={urlInput}
                onChangeText={(text) => {
                  setUrlInput(text);
                  setUrlError('');
                }}
                placeholder="https://restaurant.com/menu"
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                error={!!urlError}
                style={styles.textInput}
              />
              {urlError ? (
                <Text variant="bodySmall" style={styles.errorText}>
                  {urlError}
                </Text>
              ) : null}
              <Text variant="bodySmall" style={styles.helperText}>
                We'll analyze the menu from the restaurant's website
              </Text>
            </Card.Content>
            <Card.Actions style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setIsUrlModalVisible(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleUrlSubmit}
                loading={isLoading}
                disabled={isLoading || !urlInput.trim()}
              >
                Analyze URL
              </Button>
            </Card.Actions>
          </Card>
        </Modal>
      </Portal>

      {/* Text Input Modal */}
      <Portal>
        <Modal
          visible={isTextModalVisible}
          onDismiss={() => setIsTextModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.modalCard}>
            <Card.Title
              title="Enter Menu Text"
              subtitle="Type or paste menu items to analyze"
              left={(props) => <IconButton {...props} icon="text" />}
              right={(props) => (
                <IconButton
                  {...props}
                  icon="close"
                  onPress={() => setIsTextModalVisible(false)}
                />
              )}
            />
            <Card.Content>
              <TextInput
                label="Menu Text"
                value={textInput}
                onChangeText={(text) => {
                  // Enforce character limit
                  if (text.length <= 5000) {
                    setTextInput(text);
                    setTextError('');
                  }
                }}
                maxLength={5000}
                placeholder="Enter menu items, ingredients, or descriptions..."
                multiline
                numberOfLines={6}
                error={!!textError}
                style={styles.textAreaInput}
              />
              {textError ? (
                <Text variant="bodySmall" style={styles.errorText}>
                  {textError}
                </Text>
              ) : null}
              <Text variant="bodySmall" style={styles.helperText}>
                {textInput.length}/5000 characters • Minimum 10 characters
                {textInput.length > 4500 && (
                  <Text style={{ color: '#ff4444' }}> • Approaching limit</Text>
                )}
              </Text>
            </Card.Content>
            <Card.Actions style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setIsTextModalVisible(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleTextSubmit}
                loading={isLoading}
                disabled={isLoading || textInput.trim().length < 10}
              >
                Analyze Text
              </Button>
            </Card.Actions>
          </Card>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  prefsRow: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  primarySection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  secondarySection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  inlineButtons: { flexDirection: 'row' },
  recentSection: {
    paddingHorizontal: 20,
  },
  modalContainer: {
    padding: 20,
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
  },
  modalActions: {
    justifyContent: 'flex-end',
    paddingTop: 8,
  },
  textInput: {
    marginBottom: 8,
  },
  textAreaInput: {
    marginBottom: 8,
    minHeight: 120,
  },
  errorText: {
    color: theme.colors.error,
    marginBottom: 4,
  },
  helperText: {
    color: theme.colors.textSecondary,
  },
});
