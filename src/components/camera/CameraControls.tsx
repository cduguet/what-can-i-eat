import React from 'react';
import { View, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import { IconButton, FAB, Text } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { CameraType, FlashMode } from '@/services/camera/cameraService';
import { useTheme } from '@/theme/ThemeProvider';

const { width: screenWidth } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;

interface CameraControlsProps {
  /** Callback when take photo button is pressed */
  onTakePhoto: () => void;
  /** Callback when camera type toggle is pressed */
  onToggleCameraType: () => void;
  /** Callback when flash toggle is pressed */
  onToggleFlash: () => void;
  /** Whether currently taking photo */
  takingPhoto: boolean;
  /** Current flash mode */
  flashMode: FlashMode;
  /** Current camera type */
  cameraType: CameraType;
  /** Custom style */
  style?: ViewStyle;
}

/**
 * Camera controls component with capture and settings buttons
 * 
 * Features:
 * - Large capture button with visual feedback
 * - Camera type toggle (front/back)
 * - Flash mode toggle with visual indicators
 * - Haptic feedback on interactions
 * - Disabled states during capture
 * - Accessibility support
 */
export const CameraControls: React.FC<CameraControlsProps> = ({
  onTakePhoto,
  onToggleCameraType,
  onToggleFlash,
  takingPhoto,
  flashMode,
  cameraType,
  style,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  /**
   * Handle take photo with haptic feedback
   */
  const handleTakePhoto = async () => {
    if (!takingPhoto) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      onTakePhoto();
    }
  };

  /**
   * Handle camera type toggle with haptic feedback
   */
  const handleToggleCameraType = async () => {
    if (!takingPhoto) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onToggleCameraType();
    }
  };

  /**
   * Handle flash toggle with haptic feedback
   */
  const handleToggleFlash = async () => {
    if (!takingPhoto) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onToggleFlash();
    }
  };

  /**
   * Get flash icon based on current mode
   */
  const getFlashIcon = (): string => {
    switch (flashMode) {
      case FlashMode.off:
        return 'flash-off';
      case FlashMode.on:
        return 'flash';
      case FlashMode.auto:
        return 'flash-auto';
      default:
        return 'flash-auto';
    }
  };

  /**
   * Get flash mode text
   */
  const getFlashModeText = (): string => {
    switch (flashMode) {
      case FlashMode.off:
        return 'Off';
      case FlashMode.on:
        return 'On';
      case FlashMode.auto:
        return 'Auto';
      default:
        return 'Auto';
    }
  };

  /**
   * Get camera type icon
   */
  const getCameraTypeIcon = (): string => {
    return cameraType === CameraType.front ? 'camera-front' : 'camera-rear';
  };

  return (
    <View style={[styles.container, style]}>
      {/* Background overlay */}
      <View style={styles.overlay} />
      
      {/* Controls row */}
      <View style={styles.controlsRow}>
        {/* Flash control */}
        <View style={styles.sideControl}>
          <IconButton
            icon={getFlashIcon()}
            iconColor="#FFFFFF"
            size={isSmallDevice ? 24 : 28}
            onPress={handleToggleFlash}
            disabled={takingPhoto}
            style={[
              styles.controlButton,
              takingPhoto && styles.disabledButton,
            ]}
            accessibilityLabel={`Flash ${getFlashModeText()}`}
            accessibilityHint="Toggle flash mode"
          />
          <Text variant="bodySmall" style={styles.controlLabel}>
            {getFlashModeText()}
          </Text>
        </View>

        {/* Capture button */}
        <View style={styles.captureContainer}>
          <FAB
            icon={takingPhoto ? 'loading' : 'camera'}
            onPress={handleTakePhoto}
            disabled={takingPhoto}
            loading={takingPhoto}
            style={[
              styles.captureButton,
              takingPhoto && styles.capturingButton,
            ]}
            color="#FFFFFF"
            accessibilityLabel="Take photo"
            accessibilityHint="Capture menu photo for analysis"
          />
          <Text variant="bodySmall" style={styles.captureLabel}>
            {takingPhoto ? 'Capturing...' : 'Capture'}
          </Text>
        </View>

        {/* Camera type control */}
        <View style={styles.sideControl}>
          <IconButton
            icon={getCameraTypeIcon()}
            iconColor="#FFFFFF"
            size={isSmallDevice ? 24 : 28}
            onPress={handleToggleCameraType}
            disabled={takingPhoto}
            style={[
              styles.controlButton,
              takingPhoto && styles.disabledButton,
            ]}
            accessibilityLabel={`${cameraType === CameraType.front ? 'Front' : 'Back'} camera`}
            accessibilityHint="Switch between front and back camera"
          />
          <Text variant="bodySmall" style={styles.controlLabel}>
            {cameraType === CameraType.front ? 'Front' : 'Back'}
          </Text>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text variant="bodySmall" style={styles.instructionsText}>
          {takingPhoto 
            ? 'Processing photo...' 
            : 'Tap to capture • Make sure menu is clearly visible'
          }
        </Text>
      </View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    paddingBottom: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: -1,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    zIndex: 1,
  },
  sideControl: {
    alignItems: 'center',
    flex: 1,
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.5,
  },
  controlLabel: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 12,
  },
  captureContainer: {
    alignItems: 'center',
    flex: 2,
  },
  captureButton: {
    backgroundColor: theme.colors.primary,
    width: isSmallDevice ? 70 : 80,
    height: isSmallDevice ? 70 : 80,
    borderRadius: isSmallDevice ? 35 : 40,
    marginBottom: 8,
    elevation: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  capturingButton: {
    opacity: 0.85,
  },
  captureLabel: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  instructionsContainer: {
    alignItems: 'center',
    zIndex: 1,
  },
  instructionsText: {
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 18,
  },
});
