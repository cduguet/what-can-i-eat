import React from 'react';
import { View, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import { FAB, Text } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/ThemeProvider';

const { width: screenWidth } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;

interface CameraControlsProps {
  /** Callback when take photo button is pressed */
  onTakePhoto: () => void;
  /** Whether currently taking photo */
  takingPhoto: boolean;
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
  takingPhoto,
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

  return (
    <View style={[styles.container, style]}>
      {/* Background overlay */}
      <View style={styles.overlay} />
      
      {/* Controls row */}
      <View style={styles.controlsRow}>
        {/* Capture button */}
        <View style={[styles.captureContainer, { flex: 1 }] }>
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    zIndex: 1,
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
