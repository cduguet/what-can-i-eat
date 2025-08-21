/**
 * API Configuration Service
 * 
 * Manages API configuration for Gemini AI service with secure key handling
 * and environment-based configuration.
 */

import { GeminiAPIConfig } from '../../types';

/**
 * Default API configuration values
 */
const DEFAULT_CONFIG: Omit<GeminiAPIConfig, 'apiKey'> = {
  endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
  timeout: 30000, // 30 seconds
  maxRetries: 3,
};

/**
 * Environment variable keys for configuration
 */
const ENV_KEYS = {
  GEMINI_API_KEY: 'EXPO_PUBLIC_GEMINI_API_KEY',
  API_ENDPOINT: 'EXPO_PUBLIC_GEMINI_ENDPOINT',
  API_TIMEOUT: 'EXPO_PUBLIC_API_TIMEOUT',
  MAX_RETRIES: 'EXPO_PUBLIC_MAX_RETRIES',
} as const;

/**
 * Get API configuration from environment variables
 * 
 * @returns Complete API configuration
 * @throws Error if required API key is missing
 */
export const getAPIConfig = (): GeminiAPIConfig => {
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
    endpoint: process.env[ENV_KEYS.API_ENDPOINT] || DEFAULT_CONFIG.endpoint,
    timeout: parseInt(process.env[ENV_KEYS.API_TIMEOUT] || '') || DEFAULT_CONFIG.timeout,
    maxRetries: parseInt(process.env[ENV_KEYS.MAX_RETRIES] || '') || DEFAULT_CONFIG.maxRetries,
  };

  return config;
};

/**
 * Validate API configuration
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
 * Get sanitized configuration for logging (without API key)
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