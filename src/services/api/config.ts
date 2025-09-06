/**
 * API Configuration Service
 *
 * Manages API configuration for both Gemini and Vertex AI services with secure key handling
 * and environment-based configuration with provider switching.
 */

import { GeminiAPIConfig, VertexAPIConfig, AIConfig, AIProvider } from '../../types';

/**
 * Default Gemini API configuration values
 */
const DEFAULT_GEMINI_CONFIG: Omit<GeminiAPIConfig, 'apiKey'> = {
  endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
  timeout: 30000, // 30 seconds
  maxRetries: 3,
};

/**
 * Default Vertex AI configuration values
 */
const DEFAULT_VERTEX_CONFIG: Omit<VertexAPIConfig, 'projectId' | 'location'> = {
  timeout: 30000, // 30 seconds
  maxRetries: 3,
};

/**
 * Environment variable keys for configuration
 */
const ENV_KEYS = {
  // Backend mode selection
  BACKEND_MODE: 'EXPO_PUBLIC_BACKEND_MODE',
  
  // Provider selection
  AI_PROVIDER: 'EXPO_PUBLIC_AI_PROVIDER',
  
  // Supabase configuration
  SUPABASE_URL: 'EXPO_PUBLIC_SUPABASE_URL',
  SUPABASE_ANON_KEY: 'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  
  // Gemini configuration
  GEMINI_API_KEY: 'EXPO_PUBLIC_GEMINI_API_KEY',
  GEMINI_ENDPOINT: 'EXPO_PUBLIC_GEMINI_ENDPOINT',
  
  // Vertex AI configuration
  VERTEX_PROJECT_ID: 'EXPO_PUBLIC_VERTEX_PROJECT_ID',
  VERTEX_LOCATION: 'EXPO_PUBLIC_VERTEX_LOCATION',
  VERTEX_CREDENTIALS: 'EXPO_PUBLIC_VERTEX_CREDENTIALS',
  
  // Common configuration
  API_TIMEOUT: 'EXPO_PUBLIC_API_TIMEOUT',
  MAX_RETRIES: 'EXPO_PUBLIC_MAX_RETRIES',
} as const;

/**
 * Backend mode types
 */
export enum BackendMode {
  LOCAL = 'local',
  SUPABASE = 'supabase'
}

/**
 * Get backend mode from environment variables
 *
 * @returns Backend mode (defaults to LOCAL for backward compatibility)
 */
export const getBackendMode = (): BackendMode => {
  const mode = process.env[ENV_KEYS.BACKEND_MODE]?.toLowerCase();

  if (mode === 'supabase') return BackendMode.SUPABASE;
  if (mode === 'local') return BackendMode.LOCAL;

  // Sensible fallback: if Supabase env is present, prefer Supabase backend
  const hasSupabase = !!(process.env[ENV_KEYS.SUPABASE_URL] && process.env[ENV_KEYS.SUPABASE_ANON_KEY]);
  return hasSupabase ? BackendMode.SUPABASE : BackendMode.LOCAL;
};

/**
 * Get AI provider from environment variables
 *
 * @returns AI provider (defaults to GEMINI for backward compatibility)
 */
export const getAIProvider = (): AIProvider => {
  const provider = process.env[ENV_KEYS.AI_PROVIDER]?.toLowerCase();
  
  switch (provider) {
    case 'vertex':
      return AIProvider.VERTEX;
    case 'gemini':
    default:
      return AIProvider.GEMINI;
  }
};

/**
 * Get Supabase configuration from environment variables
 *
 * @returns Supabase configuration
 * @throws Error if required configuration is missing
 */
export const getSupabaseConfig = () => {
  const url = process.env[ENV_KEYS.SUPABASE_URL];
  const anonKey = process.env[ENV_KEYS.SUPABASE_ANON_KEY];
  
  if (!url) {
    throw new Error(
      `Missing required environment variable: ${ENV_KEYS.SUPABASE_URL}. ` +
      'Please set your Supabase project URL in your environment configuration.'
    );
  }

  if (!anonKey) {
    throw new Error(
      `Missing required environment variable: ${ENV_KEYS.SUPABASE_ANON_KEY}. ` +
      'Please set your Supabase anonymous key in your environment configuration.'
    );
  }

  return {
    url,
    anonKey,
    provider: getAIProvider(),
    timeout: parseInt(process.env[ENV_KEYS.API_TIMEOUT] || '') || DEFAULT_GEMINI_CONFIG.timeout
  };
};

/**
 * Get complete AI configuration from environment variables
 *
 * @returns Complete AI configuration with provider-specific settings
 * @throws Error if required configuration is missing for the selected provider
 */
export const getAIConfig = (): AIConfig => {
  const provider = getAIProvider();
  const timeout = parseInt(process.env[ENV_KEYS.API_TIMEOUT] || '') || DEFAULT_GEMINI_CONFIG.timeout;
  const maxRetries = parseInt(process.env[ENV_KEYS.MAX_RETRIES] || '') || DEFAULT_GEMINI_CONFIG.maxRetries;

  const config: AIConfig = {
    provider,
  };

  if (provider === AIProvider.GEMINI) {
    config.gemini = getGeminiConfig(timeout, maxRetries);
  } else if (provider === AIProvider.VERTEX) {
    config.vertex = getVertexConfig(timeout, maxRetries);
  }

  return config;
};

/**
 * Get Gemini API configuration from environment variables
 *
 * @param timeout - Request timeout in milliseconds
 * @param maxRetries - Maximum retry attempts
 * @returns Complete Gemini API configuration
 * @throws Error if required API key is missing
 */
export const getGeminiConfig = (timeout?: number, maxRetries?: number): GeminiAPIConfig => {
  // Get API key from environment
  const apiKey = process.env[ENV_KEYS.GEMINI_API_KEY];
  
  if (!apiKey) {
    throw new Error(
      `Missing required environment variable: ${ENV_KEYS.GEMINI_API_KEY}. ` +
      'Please set your Gemini API key in your environment configuration.'
    );
  }

  // Build configuration with environment overrides
  const config: GeminiAPIConfig = {
    apiKey,
    endpoint: process.env[ENV_KEYS.GEMINI_ENDPOINT] || DEFAULT_GEMINI_CONFIG.endpoint,
    timeout: timeout || DEFAULT_GEMINI_CONFIG.timeout,
    maxRetries: maxRetries || DEFAULT_GEMINI_CONFIG.maxRetries,
  };

  return config;
};

/**
 * Get Vertex AI configuration from environment variables
 *
 * @param timeout - Request timeout in milliseconds
 * @param maxRetries - Maximum retry attempts
 * @returns Complete Vertex AI configuration
 * @throws Error if required configuration is missing
 */
export const getVertexConfig = (timeout?: number, maxRetries?: number): VertexAPIConfig => {
  // Get required configuration from environment
  const projectId = process.env[ENV_KEYS.VERTEX_PROJECT_ID];
  const location = process.env[ENV_KEYS.VERTEX_LOCATION];
  
  if (!projectId) {
    throw new Error(
      `Missing required environment variable: ${ENV_KEYS.VERTEX_PROJECT_ID}. ` +
      'Please set your Google Cloud project ID in your environment configuration.'
    );
  }

  if (!location) {
    throw new Error(
      `Missing required environment variable: ${ENV_KEYS.VERTEX_LOCATION}. ` +
      'Please set your Google Cloud location in your environment configuration.'
    );
  }

  // Build configuration with environment overrides
  const config: VertexAPIConfig = {
    projectId,
    location,
    credentials: process.env[ENV_KEYS.VERTEX_CREDENTIALS],
    timeout: timeout || DEFAULT_VERTEX_CONFIG.timeout,
    maxRetries: maxRetries || DEFAULT_VERTEX_CONFIG.maxRetries,
  };

  return config;
};

/**
 * Get API configuration from environment variables (backward compatibility)
 *
 * @returns Complete API configuration
 * @throws Error if required API key is missing
 */
export const getAPIConfig = (): GeminiAPIConfig => {
  return getGeminiConfig();
};

/**
 * Validate Gemini API configuration
 *
 * @param config - Configuration to validate
 * @returns True if configuration is valid
 */
export const validateAPIConfig = (config: GeminiAPIConfig): boolean => {
  return !!(
    config.apiKey &&
    config.endpoint &&
    config.timeout > 0 &&
    config.maxRetries >= 0
  );
};

/**
 * Validate Vertex AI configuration
 *
 * @param config - Configuration to validate
 * @returns True if configuration is valid
 */
export const validateVertexConfig = (config: VertexAPIConfig): boolean => {
  return !!(
    config.projectId &&
    config.location &&
    config.timeout > 0 &&
    config.maxRetries >= 0
  );
};

/**
 * Validate AI configuration based on provider
 *
 * @param config - Configuration to validate
 * @returns True if configuration is valid
 */
export const validateAIConfig = (config: AIConfig): boolean => {
  if (config.provider === AIProvider.GEMINI && config.gemini) {
    return validateAPIConfig(config.gemini);
  } else if (config.provider === AIProvider.VERTEX && config.vertex) {
    return validateVertexConfig(config.vertex);
  }
  return false;
};

/**
 * Get sanitized configuration for logging (without sensitive data)
 *
 * @param config - Configuration to sanitize
 * @returns Configuration safe for logging
 */
export const getSanitizedConfig = (config: GeminiAPIConfig) => ({
  endpoint: config.endpoint,
  timeout: config.timeout,
  maxRetries: config.maxRetries,
  apiKeyPresent: !!config.apiKey,
});

/**
 * Get sanitized Vertex configuration for logging (without sensitive data)
 *
 * @param config - Configuration to sanitize
 * @returns Configuration safe for logging
 */
export const getSanitizedVertexConfig = (config: VertexAPIConfig) => ({
  projectId: config.projectId,
  location: config.location,
  timeout: config.timeout,
  maxRetries: config.maxRetries,
  credentialsPresent: !!config.credentials,
});

/**
 * Get sanitized AI configuration for logging (without sensitive data)
 *
 * @param config - Configuration to sanitize
 * @returns Configuration safe for logging
 */
export const getSanitizedAIConfig = (config: AIConfig) => {
  const result: any = {
    provider: config.provider,
  };

  if (config.provider === AIProvider.GEMINI && config.gemini) {
    result.gemini = getSanitizedConfig(config.gemini);
  } else if (config.provider === AIProvider.VERTEX && config.vertex) {
    result.vertex = getSanitizedVertexConfig(config.vertex);
  }

  return result;
};
