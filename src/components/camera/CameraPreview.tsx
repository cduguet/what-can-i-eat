import React, { forwardRef } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { CameraView } from 'expo-camera';
import { CameraType, FlashMode } from '@/services/camera/cameraService';

interface CameraPreviewProps {
  /** Camera type (front/back) */
  cameraType: CameraType;
  /** Flash mode */
  flashMode: FlashMode;
  /** Callback when camera is ready */
  onCameraReady: () => void;
  /** Custom style */
  style?: ViewStyle;
}

/**
 * Camera preview component with live camera feed
 *
 * Features:
 * - Real-time camera preview
 * - Camera type switching (front/back)
 * - Flash mode control
 * - Camera ready callback
 * - Responsive design
 */
export const CameraPreview = forwardRef<any, CameraPreviewProps>(
  ({ cameraType, flashMode, onCameraReady, style }, ref) => {
    return (
      <CameraView
        ref={ref}
        style={[styles.camera, style]}
        facing={cameraType}
        flash={flashMode}
        onCameraReady={onCameraReady}
        autofocus="on"
      />
    );
  }
);

CameraPreview.displayName = 'CameraPreview';

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
});
