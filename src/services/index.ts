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
export { aiService, AIService } from './api/aiService';
// Note: aiService handles all providers (gemini, vertex, supabase) via configuration

// Cache services
export { offlineCache, OfflineCache } from './cache/offlineCache';
export type { CacheStats } from './cache/offlineCache';

// Camera services
export { cameraService } from './camera/cameraService';

// Menu services
export { parseMenuText, fetchAndExtractMenuFromUrl } from './menu/menuInputService';

// Trial services
export { trialService } from './trial/trialService';

// Default export for the AI service (recommended)
export { aiService as defaultApiService } from './api/aiService';
