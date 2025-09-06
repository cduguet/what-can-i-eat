/**
 * AI Service Abstraction Layer
 * 
 * Provides a unified interface for AI services (Gemini and Vertex AI) with automatic
 * provider switching based on environment configuration. Maintains backward compatibility
 * while enabling seamless transitions between different AI providers.
 */

import { GeminiService } from './geminiService';
import { VertexService } from './vertexService';
import { SupabaseAIService } from './supabaseAIService';
import {
  AIProvider,
  AIConfig,
  GeminiRequest,
  GeminiResponse,
  MultimodalGeminiRequest,
  AppError,
  ErrorSeverity
} from '../../types';
import {
  getAIConfig,
  getAIProvider,
  validateAIConfig,
  getSanitizedAIConfig,
  getBackendMode,
  getSupabaseConfig,
  BackendMode
} from './config';

/**
 * Common interface for AI services
 */
export interface IAIService {
  /**
   * Analyze menu items using AI
   *
   * @param request - Structured request with menu items and preferences
   * @returns Promise resolving to analysis results
   */
  analyzeMenu(request: GeminiRequest): Promise<GeminiResponse>;

  /**
   * Analyze menu items using AI with multimodal input (text + images)
   *
   * @param request - Multimodal request with content parts (text and images)
   * @returns Promise resolving to analysis results
   */
  analyzeMenuMultimodal(request: MultimodalGeminiRequest): Promise<GeminiResponse>;

  /**
   * Test API connectivity with a simple request
   *
   * @returns Promise resolving to test result
   */
  testConnection(): Promise<{ success: boolean; message: string; latency?: number }>;

  /**
   * Get current configuration (optional method for services that support it)
   *
   * @returns Service configuration
   */
  getConfig?(): any;

  /**
   * Get current AI provider (optional method for services that support it)
   *
   * @returns Current AI provider
   */
  getProvider?(): AIProvider;
}

/**
 * AI Service abstraction layer
 */
export class AIService implements IAIService {
  private config: AIConfig | null = null;
  private service: IAIService;
  private provider: AIProvider;
  private backendMode: BackendMode;

  constructor(config?: AIConfig) {
    this.backendMode = getBackendMode();
    
    if (this.backendMode === BackendMode.SUPABASE) {
      // Use Supabase backend
      const supabaseConfig = getSupabaseConfig();
      this.service = new SupabaseAIService(supabaseConfig);
      this.provider = supabaseConfig.provider;
      console.log('AI service initialized with Supabase backend:', {
        mode: this.backendMode,
        provider: this.provider,
        url: supabaseConfig.url
      });
    } else {
      // Use local AI services
      this.config = config || getAIConfig();
      this.provider = this.config.provider;
      
      if (!validateAIConfig(this.config)) {
        throw new Error('Invalid AI configuration');
      }

      // Initialize the appropriate service based on provider
      this.service = this.createService();

      console.log('AI service initialized with local backend:', getSanitizedAIConfig(this.config));
    }
  }

  /**
   * Create the appropriate service instance based on provider
   *
   * @returns AI service instance
   */
  private createService(): IAIService {
    if (!this.config) {
      throw new Error('AI configuration is missing');
    }

    switch (this.provider) {
      case AIProvider.VERTEX:
        if (!this.config.vertex) {
          throw new Error('Vertex AI configuration is missing');
        }
        return new VertexService(this.config.vertex);
      
      case AIProvider.GEMINI:
      default:
        if (!this.config.gemini) {
          throw new Error('Gemini API configuration is missing');
        }
        return new GeminiService(this.config.gemini);
    }
  }

  /**
   * Get current AI provider
   * 
   * @returns Current AI provider
   */
  getProvider(): AIProvider {
    return this.provider;
  }

  /**
   * Get current configuration (sanitized)
   *
   * @returns Sanitized configuration
   */
  getConfig() {
    if (this.backendMode === BackendMode.SUPABASE) {
      return {
        backendMode: this.backendMode,
        provider: this.provider,
        supabase: this.service.getConfig?.() || 'Supabase backend'
      };
    }
    return {
      backendMode: this.backendMode,
      ...getSanitizedAIConfig(this.config!)
    };
  }

  /**
   * Get current backend mode
   *
   * @returns Current backend mode
   */
  getBackendMode(): BackendMode {
    return this.backendMode;
  }

  /**
   * Analyze menu items using the configured AI provider
   * 
   * @param request - Structured request with menu items and preferences
   * @returns Promise resolving to analysis results
   */
  async analyzeMenu(request: GeminiRequest): Promise<GeminiResponse> {
    try {
      console.log(`Analyzing menu using ${this.provider} provider for request ${request.requestId}`);
      return await this.service.analyzeMenu(request);
    } catch (error) {
      console.error(`Menu analysis failed with ${this.provider} provider:`, error);
      throw this.wrapError(error, 'analyzeMenu');
    }
  }

  /**
   * Analyze menu items using the configured AI provider with multimodal input
   *
   * @param request - Multimodal request with content parts (text and images)
   * @returns Promise resolving to analysis results
   */
  async analyzeMenuMultimodal(request: MultimodalGeminiRequest): Promise<GeminiResponse> {
    try {
      console.log(`Analyzing multimodal menu using ${this.provider} provider for request ${request.requestId}`);
      return await this.service.analyzeMenuMultimodal(request);
    } catch (error) {
      console.error(`Multimodal menu analysis failed with ${this.provider} provider:`, error);
      throw this.wrapError(error, 'analyzeMenuMultimodal');
    }
  }

  /**
   * Test connectivity with the configured AI provider
   * 
   * @returns Promise resolving to test result
   */
  async testConnection(): Promise<{ success: boolean; message: string; latency?: number }> {
    try {
      console.log(`Testing connection with ${this.provider} provider`);
      const result = await this.service.testConnection();
      
      return {
        ...result,
        message: `${this.provider.toUpperCase()}: ${result.message}`,
      };
    } catch (error) {
      console.error(`Connection test failed with ${this.provider} provider:`, error);
      return {
        success: false,
        message: `${this.provider.toUpperCase()}: ${error instanceof Error ? error.message : 'Unknown error during connection test'}`,
      };
    }
  }

  /**
   * Wrap errors with provider context
   * 
   * @param error - Original error
   * @param operation - Operation that failed
   * @returns Wrapped error with context
   */
  private wrapError(error: unknown, operation: string): Error {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Error(`${this.provider.toUpperCase()} ${operation} failed: ${message}`);
  }

  /**
   * Switch to a different AI provider (for runtime switching)
   * 
   * @param newProvider - New provider to switch to
   * @param newConfig - Optional new configuration
   */
  async switchProvider(newProvider: AIProvider, newConfig?: AIConfig): Promise<void> {
    try {
      console.log(`Switching AI provider from ${this.provider} to ${newProvider}`);
      
      // Use provided config or get new config from environment
      const config = newConfig || getAIConfig();
      
      if (config.provider !== newProvider) {
        throw new Error(`Configuration provider (${config.provider}) does not match requested provider (${newProvider})`);
      }

      if (!validateAIConfig(config)) {
        throw new Error(`Invalid configuration for ${newProvider} provider`);
      }

      // Update internal state
      this.config = config;
      this.provider = newProvider;
      this.service = this.createService();

      console.log(`Successfully switched to ${newProvider} provider:`, getSanitizedAIConfig(this.config));
    } catch (error) {
      console.error(`Failed to switch to ${newProvider} provider:`, error);
      throw error;
    }
  }

  /**
   * Check if a specific provider is available (has valid configuration)
   * 
   * @param provider - Provider to check
   * @returns True if provider is available
   */
  static isProviderAvailable(provider: AIProvider): boolean {
    try {
      const config = getAIConfig();
      
      if (provider === AIProvider.GEMINI) {
        return !!(config.gemini?.apiKey);
      } else if (provider === AIProvider.VERTEX) {
        return !!(config.vertex?.projectId && config.vertex?.location);
      }
      
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Get list of available providers
   * 
   * @returns Array of available providers
   */
  static getAvailableProviders(): AIProvider[] {
    const providers: AIProvider[] = [];
    
    if (AIService.isProviderAvailable(AIProvider.GEMINI)) {
      providers.push(AIProvider.GEMINI);
    }
    
    if (AIService.isProviderAvailable(AIProvider.VERTEX)) {
      providers.push(AIProvider.VERTEX);
    }
    
    return providers;
  }
}

/**
 * Default AI service instance
 * Uses environment configuration to determine provider
 */
export const aiService = new AIService();

/**
 * Legacy export for backward compatibility
 * @deprecated Use aiService instead
 */
export const geminiService = aiService;