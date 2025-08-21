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
  OCRResult,
  LoadingState,
  AppError,
} from '@/types';
import { cameraService, CameraType, FlashMode } from '@/services/camera/cameraService';
import { ocrService } from '@/services/ocr/ocrService';
import { CameraPreview } from '@/components/camera/CameraPreview';
import { CameraControls } from '@/components/camera/CameraControls';
import { OCRProcessingIndicator } from '@/components/camera/OCRProcessingIndicator';

type CameraScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Camera'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Camera screen with live preview, controls, and OCR processing
 *
 * Features:
 * - Live camera preview
 * - Permission handling
 * - Photo capture with feedback
 * - OCR text extraction
 * - Flash and camera controls
 * - Error handling and recovery
 * - Navigation to results
 */
export const CameraScreen: React.FC = () => {
  const navigation = useNavigation<CameraScreenNavigationProp>();
  const cameraRef = useRef<any>(null);

  // Camera state
  const [cameraState, setCameraState] = useState<CameraState>({
    permissionStatus: CameraPermissionStatus.UNDETERMINED,
    cameraReady: false,
    takingPhoto: false,
    ocrProcessing: {
      isLoading: false,
      progress: 0,
      message: '',
    },
  });

  // UI state
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState<CameraResult | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);

  // Initialize camera on mount
  useEffect(() => {
    initializeCamera();
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
   * Take photo and process with OCR
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

      // Start OCR processing
      await processImageWithOCR(photo.uri);

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
   * Process captured image with OCR
   */
  const processImageWithOCR = async (imageUri: string) => {
    try {
      // Set OCR processing state
      setCameraState(prev => ({
        ...prev,
        ocrProcessing: {
          isLoading: true,
          progress: 0,
          message: 'Processing image...',
        },
      }));

      // Update progress
      setTimeout(() => {
        setCameraState(prev => ({
          ...prev,
          ocrProcessing: {
            ...prev.ocrProcessing,
            progress: 30,
            message: 'Extracting text...',
          },
        }));
      }, 500);

      // Process image for OCR
      const processedImageUri = await cameraService.processImageForOCR(imageUri, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.9,
      });

      // Update progress
      setCameraState(prev => ({
        ...prev,
        ocrProcessing: {
          ...prev.ocrProcessing,
          progress: 60,
          message: 'Analyzing menu...',
        },
      }));

      // Extract text with OCR
      const ocrResult = await ocrService.extractTextFromImage(processedImageUri, {
        language: 'en',
        preprocessImage: true,
        includeConfidence: true,
        includeBoundingBoxes: false,
      });

      setOcrResult(ocrResult);

      // Update progress
      setCameraState(prev => ({
        ...prev,
        ocrProcessing: {
          ...prev.ocrProcessing,
          progress: 90,
          message: 'Finalizing...',
        },
      }));

      // Complete processing
      setTimeout(() => {
        setCameraState(prev => ({
          ...prev,
          ocrProcessing: {
            isLoading: false,
            progress: 100,
            message: 'Complete!',
          },
        }));

        // Navigate to results after a brief delay
        setTimeout(() => {
          if (ocrResult.success) {
            navigation.navigate('Results', {
              imageUri: capturedImage?.uri,
              menuText: ocrResult.text,
            });
          } else {
            Alert.alert(
              'OCR Error',
              'Failed to extract text from image. Please try again with better lighting.',
              [{ text: 'OK' }]
            );
          }
        }, 1000);
      }, 500);

    } catch (error) {
      console.error('OCR processing failed:', error);
      setCameraState(prev => ({
        ...prev,
        ocrProcessing: {
          isLoading: false,
          progress: 0,
          message: '',
        },
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
          <ActivityIndicator size="large" color="#006064" />
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
          iconColor="#FFFFFF"
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
          iconColor="#FFFFFF"
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

      {/* Instructions Overlay */}
      <View style={styles.instructionsOverlay}>
        <Text variant="bodyMedium" style={styles.instructionsText}>
          Point your camera at a menu and tap the capture button
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraPreview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#FFFFFF',
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  ocrIndicator: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    zIndex: 20,
  },
  instructionsOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 12,
    zIndex: 5,
  },
  instructionsText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  permissionModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
  },
  permissionCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
  },
  permissionText: {
    lineHeight: 22,
    marginBottom: 16,
  },
  permissionActions: {
    justifyContent: 'flex-end',
  },
});