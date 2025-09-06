import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import {
  Text,
  IconButton,
  Portal,
  Modal,
  Card,
  Button,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import {
  RootStackParamList,
  CameraState,
  CameraPermissionStatus,
  CameraResult,
  LoadingState,
  AppError,
  ContentType,
  UserPreferences,
  MultimodalGeminiRequest,
  MultimodalContentPart,
  DietaryType,
  GeminiResponse,
} from '@/types';
import { cameraService, CameraType, FlashMode } from '@/services/camera/cameraService';
import { geminiService } from '@/services/api/geminiService';
import { CameraPreview } from '@/components/camera/CameraPreview';
import { CameraControls } from '@/components/camera/CameraControls';
import { OCRProcessingIndicator } from '@/components/camera/OCRProcessingIndicator';
import { useTheme } from '@/theme/ThemeProvider';

type CameraScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Camera'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Camera screen with live preview, controls, and multimodal analysis
 *
 * Features:
 * - Live camera preview
 * - Permission handling
 * - Photo capture with feedback
 * - Direct image analysis with Gemini
 * - Flash and camera controls
 * - Error handling and recovery
 * - Navigation to results
 */
export const CameraScreen: React.FC = () => {
  const navigation = useNavigation<CameraScreenNavigationProp>();
  const { theme } = useTheme();
  const cameraRef = useRef<any>(null);

  // Camera state
  const [cameraState, setCameraState] = useState<CameraState>({
    permissionStatus: CameraPermissionStatus.UNDETERMINED,
    cameraReady: false,
    takingPhoto: false,
    ocrProcessing: { // Re-using this state for multimodal processing
      isLoading: false,
      progress: 0,
      message: '',
    },
  });

  // UI state
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState<CameraResult | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);

  // Initialize camera on mount
  useEffect(() => {
    initializeCamera();
    (async () => {
      try {
        const prefs = await AsyncStorage.getItem('user_preferences');
        if (prefs) {
          setUserPreferences(JSON.parse(prefs));
        } else {
          setUserPreferences({
            dietaryType: DietaryType.VEGAN,
            lastUpdated: new Date().toISOString(),
            onboardingCompleted: true,
          });
        }
      } catch {
        setUserPreferences({
          dietaryType: DietaryType.VEGAN,
          lastUpdated: new Date().toISOString(),
          onboardingCompleted: true,
        });
      }
    })();
    return () => {
      cameraService.cleanup();
    };
  }, []);

  // Set camera reference when ready
  useEffect(() => {
    if (cameraRef.current && cameraState.cameraReady) {
      cameraService.setCameraRef(cameraRef.current);
    }
  }, [cameraState.cameraReady]);

  /**
   * Initialize camera and check permissions
   */
  const initializeCamera = async () => {
    try {
      const permissionStatus = await cameraService.getCameraPermissionStatus();
      
      if (permissionStatus === CameraPermissionStatus.GRANTED) {
        setCameraState(prev => ({
          ...prev,
          permissionStatus,
          cameraReady: true,
        }));
      } else {
        setCameraState(prev => ({
          ...prev,
          permissionStatus,
        }));
        
        if (permissionStatus === CameraPermissionStatus.UNDETERMINED) {
          await requestCameraPermission();
        } else {
          setShowPermissionModal(true);
        }
      }
    } catch (error) {
      console.error('Failed to initialize camera:', error);
      setCameraState(prev => ({
        ...prev,
        error: error as AppError,
      }));
    }
  };

  /**
   * Request camera permission
   */
  const requestCameraPermission = async () => {
    try {
      const result = await cameraService.requestCameraPermission();
      
      setCameraState(prev => ({
        ...prev,
        permissionStatus: result.status,
        cameraReady: result.status === CameraPermissionStatus.GRANTED,
      }));

      if (result.status === CameraPermissionStatus.DENIED) {
        setShowPermissionModal(true);
      }
    } catch (error) {
      console.error('Failed to request camera permission:', error);
      Alert.alert(
        'Permission Error',
        'Failed to request camera permission. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Handle camera ready event
   */
  const handleCameraReady = () => {
    setCameraState(prev => ({
      ...prev,
      cameraReady: true,
    }));
  };

  /**
   * Take photo and process with multimodal analysis
   */
  const handleTakePhoto = async () => {
    if (!cameraState.cameraReady || cameraState.takingPhoto) {
      return;
    }

    try {
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Set taking photo state
      setCameraState(prev => ({
        ...prev,
        takingPhoto: true,
      }));

      // Capture photo
      const photo = await cameraService.takePicture({
        quality: 0.8,
        skipProcessing: false,
      });

      setCapturedImage(photo);

      // Start multimodal analysis
      await processImage(photo);

    } catch (error) {
      console.error('Failed to take photo:', error);
      Alert.alert(
        'Camera Error',
        'Failed to capture photo. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setCameraState(prev => ({
        ...prev,
        takingPhoto: false,
      }));
    }
  };

  /**
   * Process captured image with multimodal analysis
   */
  const processImage = async (photo: CameraResult) => {
    try {
      // Set processing state
      setCameraState(prev => ({
        ...prev,
        ocrProcessing: { // Re-using ocrProcessing state for general processing
          isLoading: true,
          progress: 0,
          message: 'Preparing image...',
        },
      }));

      // Simulate progress
      setTimeout(() => {
        setCameraState(prev => ({
          ...prev,
          ocrProcessing: { ...prev.ocrProcessing, progress: 30, message: 'Analyzing menu...' },
        }));
      }, 500);

      // Convert image to base64
      const base64 = await cameraService.imageToBase64(photo.uri);

      const contentParts: MultimodalContentPart[] = [
        {
          type: ContentType.IMAGE,
          data: `data:image/jpeg;base64,${base64}`,
        },
        {
          type: ContentType.TEXT,
          data: 'Analyze the attached menu image for dietary suitability.',
        },
      ];

      const request: MultimodalGeminiRequest = {
        dietaryPreferences: userPreferences || {
          dietaryType: DietaryType.VEGAN,
          lastUpdated: new Date().toISOString(),
          onboardingCompleted: true,
        },
        contentParts,
        requestId: `multimodal-${Date.now()}`,
      };

      const analysisResult = await geminiService.analyzeMenuMultimodal(request);

      // Update progress
      setCameraState(prev => ({
        ...prev,
        ocrProcessing: { ...prev.ocrProcessing, progress: 90, message: 'Finalizing...' },
      }));

      // Complete processing
      setTimeout(() => {
        setCameraState(prev => ({
          ...prev,
          ocrProcessing: { isLoading: false, progress: 100, message: 'Complete!' },
        }));

        // Navigate to results after a brief delay
        setTimeout(() => {
          if (analysisResult.success) {
            navigation.navigate('Results', {
              imageUri: photo.uri,
              analysis: analysisResult,
            });
          } else {
            Alert.alert(
              'Analysis Error',
              analysisResult.message || 'Failed to analyze the menu. Please try again.',
              [{ text: 'OK' }]
            );
          }
        }, 1000);
      }, 500);

    } catch (error) {
      console.error('Multimodal analysis failed:', error);
      setCameraState(prev => ({
        ...prev,
        ocrProcessing: { isLoading: false, progress: 0, message: '' },
      }));

      Alert.alert(
        'Processing Error',
        'Failed to process image. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Toggle camera type (front/back)
   */
  const handleToggleCameraType = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cameraService.toggleCameraType();
    // Force re-render by updating state
    setCameraState(prev => ({ ...prev }));
  };

  /**
   * Toggle flash mode
   */
  const handleToggleFlash = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cameraService.toggleFlashMode();
    // Force re-render by updating state
    setCameraState(prev => ({ ...prev }));
  };

  /**
   * Handle back navigation
   */
  const handleGoBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  /**
   * Handle permission modal actions
   */
  const handleOpenSettings = () => {
    setShowPermissionModal(false);
    // In a real app, you would open device settings
    Alert.alert(
      'Open Settings',
      'Please go to Settings > Privacy > Camera and enable camera access for this app.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => {
          // Linking.openSettings(); // Uncomment in real app
        }},
      ]
    );
  };

  const styles = createStyles(theme);

  // Show permission modal if needed
  if (showPermissionModal) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <Portal>
          <Modal
            visible={true}
            dismissable={false}
            contentContainerStyle={styles.permissionModalContainer}
          >
            <Card style={styles.permissionCard}>
              <Card.Title
                title="Camera Permission Required"
                subtitle="We need camera access to scan menus"
                left={(props) => <IconButton {...props} icon="camera" />}
              />
              <Card.Content>
                <Text variant="bodyMedium" style={styles.permissionText}>
                  To scan and analyze menus, this app needs access to your camera. 
                  Your photos are processed locally and not stored permanently.
                </Text>
              </Card.Content>
              <Card.Actions style={styles.permissionActions}>
                <Button
                  mode="outlined"
                  onPress={handleGoBack}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleOpenSettings}
                >
                  Open Settings
                </Button>
              </Card.Actions>
            </Card>
          </Modal>
        </Portal>
      </SafeAreaView>
    );
  }

  // Show loading if camera not ready
  if (!cameraState.cameraReady) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyLarge" style={styles.loadingText}>
            Initializing camera...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Camera Preview */}
      <CameraPreview
        ref={cameraRef}
        cameraType={cameraService.getCameraType()}
        flashMode={cameraService.getFlashMode()}
        onCameraReady={handleCameraReady}
        style={styles.cameraPreview}
      />

      {/* Header Controls */}
      <View style={styles.headerControls}>
        <IconButton
          icon="arrow-left"
          iconColor={theme.colors.surface}
          size={24}
          onPress={handleGoBack}
          style={styles.headerButton}
        />
        <Text variant="titleMedium" style={styles.headerTitle}>
          Scan Menu
        </Text>
        <IconButton
          icon={cameraService.getFlashMode() === FlashMode.off ? 'flash-off' :
                cameraService.getFlashMode() === FlashMode.on ? 'flash' : 'flash-auto'}
          iconColor={theme.colors.surface}
          size={24}
          onPress={handleToggleFlash}
          style={styles.headerButton}
        />
      </View>

      {/* Camera Controls */}
      <CameraControls
        onTakePhoto={handleTakePhoto}
        onToggleCameraType={handleToggleCameraType}
        onToggleFlash={handleToggleFlash}
        takingPhoto={cameraState.takingPhoto}
        flashMode={cameraService.getFlashMode()}
        cameraType={cameraService.getCameraType()}
        style={styles.cameraControls}
      />

      {/* OCR Processing Indicator */}
      {cameraState.ocrProcessing.isLoading && (
        <OCRProcessingIndicator
          progress={cameraState.ocrProcessing.progress || 0}
          message={cameraState.ocrProcessing.message || 'Processing...'}
          style={styles.ocrIndicator}
        />
      )}

      {/* Instructions Overlay - Only show when not processing */}
      {!cameraState.ocrProcessing.isLoading && !cameraState.takingPhoto && (
        <View style={styles.instructionsOverlay}>
          <Text variant="bodyMedium" style={styles.instructionsText}>
            Point your camera at a menu and tap the capture button
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Keep black for camera
  },
  cameraPreview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000', // Keep black for camera
  },
  loadingText: {
    color: theme.colors.surface,
    marginTop: 16,
  },
  headerControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: (StatusBar.currentHeight || 0) + 16,
    zIndex: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerTitle: {
    color: theme.colors.surface,
    fontWeight: 'bold',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 30,
  },
  ocrIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 100,
  },
  instructionsOverlay: {
    position: 'absolute',
    bottom: 200,
    left: 20,
    right: 20,
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    zIndex: 10,
  },
  instructionsText: {
    color: theme.colors.surface,
    textAlign: 'center',
  },
  permissionModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.backdrop,
  },
  permissionCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.colors.surface,
  },
  permissionText: {
    lineHeight: 22,
  },
  permissionActions: {
    justifyContent: 'flex-end',
    paddingTop: 16,
  },
});
