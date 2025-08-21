import { Camera } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import {
  CameraResult,
  CameraPermissionResult,
  CameraPermissionStatus,
  ImageProcessingOptions,
  AppError,
  ErrorSeverity
} from '@/types';

// Define camera types and flash modes as enums
export enum CameraType {
  back = 'back',
  front = 'front'
}

export enum FlashMode {
  off = 'off',
  on = 'on',
  auto = 'auto'
}

/**
 * Camera service for handling camera operations, permissions, and image processing
 *
 * Features:
 * - Camera permission management
 * - Photo capture with metadata
 * - Image processing and optimization
 * - Flash and camera type controls
 * - Error handling and recovery
 */
export class CameraService {
  private static instance: CameraService;
  private cameraRef: any = null;
  private currentCameraType: CameraType = CameraType.back;
  private currentFlashMode: FlashMode = FlashMode.auto;

  /**
   * Get singleton instance of CameraService
   */
  public static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }

  /**
   * Request camera permissions
   */
  public async requestCameraPermission(): Promise<CameraPermissionResult> {
    try {
      const { status, canAskAgain } = await Camera.requestCameraPermissionsAsync();
      
      let permissionStatus: CameraPermissionStatus;
      switch (status) {
        case 'granted':
          permissionStatus = CameraPermissionStatus.GRANTED;
          break;
        case 'denied':
          permissionStatus = CameraPermissionStatus.DENIED;
          break;
        default:
          permissionStatus = CameraPermissionStatus.UNDETERMINED;
      }

      return {
        status: permissionStatus,
        canAskAgain,
        expires: undefined // Expo doesn't provide expiration info
      };
    } catch (error) {
      console.error('Failed to request camera permission:', error);
      throw this.createCameraError(
        'Failed to request camera permission',
        'PERMISSION_REQUEST_FAILED',
        ErrorSeverity.HIGH,
        error
      );
    }
  }

  /**
   * Check current camera permission status
   */
  public async getCameraPermissionStatus(): Promise<CameraPermissionStatus> {
    try {
      const { status } = await Camera.getCameraPermissionsAsync();
      
      switch (status) {
        case 'granted':
          return CameraPermissionStatus.GRANTED;
        case 'denied':
          return CameraPermissionStatus.DENIED;
        default:
          return CameraPermissionStatus.UNDETERMINED;
      }
    } catch (error) {
      console.error('Failed to get camera permission status:', error);
      return CameraPermissionStatus.UNDETERMINED;
    }
  }

  /**
   * Set camera reference for operations
   */
  public setCameraRef(ref: any): void {
    this.cameraRef = ref;
  }

  /**
   * Take a photo with the camera
   */
  public async takePicture(options?: {
    quality?: number;
    base64?: boolean;
    skipProcessing?: boolean;
  }): Promise<CameraResult> {
    if (!this.cameraRef) {
      throw this.createCameraError(
        'Camera not initialized',
        'CAMERA_NOT_INITIALIZED',
        ErrorSeverity.HIGH
      );
    }

    try {
      const photo = await this.cameraRef.takePictureAsync({
        quality: options?.quality || 0.8,
        base64: options?.base64 || false,
        skipProcessing: options?.skipProcessing || false,
      });

      const result: CameraResult = {
        uri: photo.uri,
        width: photo.width,
        height: photo.height,
        type: 'image',
        timestamp: new Date().toISOString(),
      };

      // Get file size if possible
      try {
        const fileInfo = await MediaLibrary.getAssetInfoAsync(photo.uri);
        if (fileInfo && 'fileSize' in fileInfo) {
          result.fileSize = fileInfo.fileSize as number;
        }
      } catch (error) {
        // File size is optional, continue without it
        console.warn('Could not get file size:', error);
      }

      return result;
    } catch (error) {
      console.error('Failed to take picture:', error);
      throw this.createCameraError(
        'Failed to capture photo',
        'PHOTO_CAPTURE_FAILED',
        ErrorSeverity.MEDIUM,
        error
      );
    }
  }

  /**
   * Process and optimize image for OCR
   */
  public async processImageForOCR(
    imageUri: string,
    options: ImageProcessingOptions = {}
  ): Promise<string> {
    try {
      const {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 0.8,
        compress = true,
        format = 'jpeg'
      } = options;

      const manipulatorOptions: ImageManipulator.Action[] = [];

      // Resize if needed
      if (maxWidth || maxHeight) {
        manipulatorOptions.push({
          resize: {
            width: maxWidth,
            height: maxHeight,
          }
        });
      }

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        manipulatorOptions,
        {
          compress: compress ? quality : 1,
          format: format === 'jpeg' ? ImageManipulator.SaveFormat.JPEG : ImageManipulator.SaveFormat.PNG,
        }
      );

      return result.uri;
    } catch (error) {
      console.error('Failed to process image:', error);
      throw this.createCameraError(
        'Failed to process image',
        'IMAGE_PROCESSING_FAILED',
        ErrorSeverity.MEDIUM,
        error
      );
    }
  }

  /**
   * Toggle camera type (front/back)
   */
  public toggleCameraType(): CameraType {
    this.currentCameraType = this.currentCameraType === CameraType.back 
      ? CameraType.front 
      : CameraType.back;
    return this.currentCameraType;
  }

  /**
   * Get current camera type
   */
  public getCameraType(): CameraType {
    return this.currentCameraType;
  }

  /**
   * Set camera type
   */
  public setCameraType(type: CameraType): void {
    this.currentCameraType = type;
  }

  /**
   * Toggle flash mode
   */
  public toggleFlashMode(): FlashMode {
    switch (this.currentFlashMode) {
      case FlashMode.off:
        this.currentFlashMode = FlashMode.on;
        break;
      case FlashMode.on:
        this.currentFlashMode = FlashMode.auto;
        break;
      case FlashMode.auto:
        this.currentFlashMode = FlashMode.off;
        break;
      default:
        this.currentFlashMode = FlashMode.auto;
    }
    return this.currentFlashMode;
  }

  /**
   * Get current flash mode
   */
  public getFlashMode(): FlashMode {
    return this.currentFlashMode;
  }

  /**
   * Set flash mode
   */
  public setFlashMode(mode: FlashMode): void {
    this.currentFlashMode = mode;
  }

  /**
   * Get flash mode display text
   */
  public getFlashModeText(): string {
    switch (this.currentFlashMode) {
      case FlashMode.off:
        return 'Off';
      case FlashMode.on:
        return 'On';
      case FlashMode.auto:
        return 'Auto';
      default:
        return 'Auto';
    }
  }

  /**
   * Check if camera is available
   */
  public async isCameraAvailable(): Promise<boolean> {
    try {
      const permissionStatus = await this.getCameraPermissionStatus();
      return permissionStatus === CameraPermissionStatus.GRANTED;
    } catch (error) {
      console.error('Failed to check camera availability:', error);
      return false;
    }
  }

  /**
   * Create standardized camera error
   */
  private createCameraError(
    message: string,
    code: string,
    severity: ErrorSeverity,
    originalError?: any
  ): AppError {
    return {
      message,
      code,
      severity,
      timestamp: new Date().toISOString(),
      userMessage: message,
      recoveryActions: [
        {
          label: 'Retry',
          type: 'retry'
        },
        {
          label: 'Check Permissions',
          type: 'reset'
        }
      ]
    };
  }

  /**
   * Cleanup camera resources
   */
  public cleanup(): void {
    this.cameraRef = null;
  }
}

/**
 * Export singleton instance
 */
export const cameraService = CameraService.getInstance();