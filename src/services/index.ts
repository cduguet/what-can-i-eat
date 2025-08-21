/**
 * Services Index
 * 
 * Central export point for all application services.
 * This provides a clean import interface for components.
 */

// Authentication services
export { authService, AuthService } from './auth/authService';
export type { AuthResult, AuthState, AccountUpgradeData, SocialProvider } from './auth/authService';

// API services
export { geminiService, GeminiService } from './api/geminiService';
export { secureGeminiService, SecureGeminiService } from './api/supabaseService';

// Cache services
export { offlineCache, OfflineCache } from './cache/offlineCache';
export type { CacheStats } from './cache/offlineCache';

// Camera services
export { cameraService } from './camera/cameraService';

// OCR services
export { ocrService } from './ocr/ocrService';

// Default export for the secure service (recommended)
export { secureGeminiService as defaultApiService } from './api/supabaseService';