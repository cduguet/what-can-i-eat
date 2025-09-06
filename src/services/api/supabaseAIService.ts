/**
 * Supabase AI Service
 * 
 * Client service for calling the Supabase Edge Function that handles AI API calls.
 * Provides the same interface as the local AI services but routes requests through Supabase.
 */

import { createClient } from '@supabase/supabase-js';
import { 
  GeminiRequest, 
  GeminiResponse, 
  MultimodalGeminiRequest,
  AIProvider,
  AppError,
  ErrorSeverity 
} from '../../types';
import { IAIService } from './aiService';

/**
 * Supabase AI service configuration
 */
export interface SupabaseAIConfig {
  /** Supabase project URL */
  url: string;
  /** Supabase anonymous key */
  anonKey: string;
  /** AI provider to use (gemini or vertex) */
  provider?: AIProvider;
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * Request payload for Supabase Edge Function
 */
interface SupabaseAIRequest {
  type: 'analyze' | 'analyze_multimodal' | 'test_connection';
  dietaryPreferences?: any;
  menuItems?: any[];
  contentParts?: any[];
  context?: string;
  requestId: string;
  provider?: 'gemini' | 'vertex';
}

/**
 * Response from Supabase Edge Function
 */
interface SupabaseAIResponse {
  success: boolean;
  results?: any[];
  confidence?: number;
  message?: string;
  requestId: string;
  processingTime: number;
  provider: string;
  error?: string;
  timestamp?: string;
}

/**
 * Supabase AI Service implementation
 */
export class SupabaseAIService implements IAIService {
  private config: SupabaseAIConfig;
  private supabase: any;

  constructor(config: SupabaseAIConfig) {
    this.config = {
      timeout: 30000,
      provider: AIProvider.GEMINI,
      ...config
    };

    // Initialize Supabase client
    this.supabase = createClient(this.config.url, this.config.anonKey);

    console.log('Supabase AI service initialized:', {
      url: this.config.url,
      provider: this.config.provider,
      timeout: this.config.timeout
    });
  }

  /**
   * Analyze menu items using AI via Supabase Edge Function
   * 
   * @param request - Structured request with menu items and preferences
   * @returns Promise resolving to analysis results
   */
  async analyzeMenu(request: GeminiRequest): Promise<GeminiResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`Starting Supabase menu analysis for request ${request.requestId}`);
      
      const payload: SupabaseAIRequest = {
        type: 'analyze',
        dietaryPreferences: request.dietaryPreferences,
        menuItems: request.menuItems,
        context: request.context,
        requestId: request.requestId,
        provider: this.config.provider
      };

      const response = await this.callEdgeFunction(payload);
      
      // Build final response
      const result: GeminiResponse = {
        success: response.success,
        results: response.results || [],
        confidence: response.confidence || 0.8,
        message: response.message,
        requestId: request.requestId,
        processingTime: Date.now() - startTime,
      };

      console.log(`Supabase menu analysis completed for request ${request.requestId} in ${result.processingTime}ms`);
      return result;

    } catch (error) {
      console.error(`Supabase menu analysis failed for request ${request.requestId}:`, error);
      
      return {
        success: false,
        results: [],
        confidence: 0,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        requestId: request.requestId,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Analyze menu items using AI with multimodal input via Supabase Edge Function
   *
   * @param request - Multimodal request with content parts (text and images)
   * @returns Promise resolving to analysis results
   */
  async analyzeMenuMultimodal(request: MultimodalGeminiRequest): Promise<GeminiResponse> {
    const startTime = Date.now();

    try {
      console.log(`Starting Supabase multimodal menu analysis for request ${request.requestId}`);

      const payload: SupabaseAIRequest = {
        type: 'analyze_multimodal',
        dietaryPreferences: request.dietaryPreferences,
        contentParts: request.contentParts,
        context: request.context,
        requestId: request.requestId,
        provider: this.config.provider
      };

      const response = await this.callEdgeFunction(payload);

      // Build final response
      const result: GeminiResponse = {
        success: response.success,
        results: response.results || [],
        confidence: response.confidence || 0.8,
        message: response.message,
        requestId: request.requestId,
        processingTime: Date.now() - startTime,
      };

      console.log(`Supabase multimodal menu analysis completed for request ${request.requestId} in ${result.processingTime}ms`);
      return result;

    } catch (error) {
      console.error(`Supabase multimodal menu analysis failed for request ${request.requestId}:`, error);

      return {
        success: false,
        results: [],
        confidence: 0,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        requestId: request.requestId,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Test API connectivity via Supabase Edge Function
   * 
   * @returns Promise resolving to test result
   */
  async testConnection(): Promise<{ success: boolean; message: string; latency?: number }> {
    const startTime = Date.now();
    
    try {
      console.log('Testing Supabase AI connection');
      
      const payload: SupabaseAIRequest = {
        type: 'test_connection',
        requestId: `test_${Date.now()}`,
        provider: this.config.provider
      };

      const response = await this.callEdgeFunction(payload);
      
      const latency = Date.now() - startTime;
      
      return {
        success: response.success,
        message: `Supabase ${this.config.provider?.toUpperCase()}: ${response.message || 'Connection test completed'}`,
        latency,
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Supabase ${this.config.provider?.toUpperCase()}: ${error instanceof Error ? error.message : 'Unknown error during connection test'}`,
      };
    }
  }

  /**
   * Call the Supabase Edge Function
   * 
   * @param payload - Request payload
   * @returns Promise resolving to response
   */
  private async callEdgeFunction(payload: SupabaseAIRequest): Promise<SupabaseAIResponse> {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const { data, error } = await this.supabase.functions.invoke('ai-menu-analysis', {
        body: payload,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data received from Supabase function');
      }

      // Check if the response indicates an error
      if (!data.success && data.error) {
        throw new Error(data.error);
      }

      return data as SupabaseAIResponse;

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Get current configuration (sanitized)
   * 
   * @returns Sanitized configuration
   */
  getConfig() {
    return {
      url: this.config.url,
      provider: this.config.provider,
      timeout: this.config.timeout,
      // Don't expose the anon key
      anonKey: this.config.anonKey ? '***' : undefined
    };
  }

  /**
   * Get current AI provider
   * 
   * @returns Current AI provider
   */
  getProvider(): AIProvider {
    return this.config.provider || AIProvider.GEMINI;
  }
}

/**
 * Create Supabase AI service instance from environment variables
 * 
 * @returns Configured Supabase AI service
 */
export function createSupabaseAIService(): SupabaseAIService {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const provider = process.env.AI_PROVIDER as AIProvider;

  if (!url || !anonKey) {
    throw new Error('Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY');
  }

  return new SupabaseAIService({
    url,
    anonKey,
    provider: provider || AIProvider.GEMINI,
    timeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000', 10)
  });
}

/**
 * Default Supabase AI service instance (created from environment variables)
 */
export const supabaseAIService = createSupabaseAIService();