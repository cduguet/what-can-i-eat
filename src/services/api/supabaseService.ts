/**
 * Secure Supabase API Service for "What Can I Eat" Application
 * 
 * Provides secure API communication through Supabase Edge Functions, replacing
 * direct Gemini API calls with a secure backend proxy. This service maintains
 * the same interface as GeminiService for seamless integration.
 * 
 * Features:
 * - Secure API key handling (keys stored in backend)
 * - User authentication and rate limiting
 * - Request caching and offline support
 * - Usage analytics and monitoring
 * - Error handling and retry logic
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeminiRequest, GeminiResponse, UserPreferences } from '../../types';
import { authService } from '../auth/authService';

// Environment variables for Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Cache entry interface for offline support
 */
interface CacheEntry {
  key: string;
  data: GeminiResponse;
  timestamp: number;
  expiresAt: number;
}

/**
 * API usage statistics interface
 */
interface UsageStats {
  dailyRequests: number;
  monthlyRequests: number;
  lastReset: string;
  tier: 'free' | 'premium' | 'unlimited';
}

/**
 * Secure Gemini Service Class
 * 
 * Provides the same interface as GeminiService but routes requests through
 * Supabase Edge Functions for enhanced security and features.
 */
export class SecureGeminiService {
  private supabase: SupabaseClient;
  private startTime: number = 0;
  private cachePrefix = 'menu_analysis_cache_';
  private maxRetries = 3;
  private timeout = 30000; // 30 seconds

  constructor() {
    // Initialize Supabase client with AsyncStorage for session persistence
    this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });

    console.log('SecureGeminiService initialized with Supabase backend');
  }

  /**
   * Analyze menu items using secure Supabase Edge Function
   * 
   * This method maintains the same interface as GeminiService.analyzeMenu()
   * but routes requests through the secure backend proxy.
   * 
   * @param request - Structured request with menu items and preferences
   * @returns Promise resolving to analysis results
   */
  async analyzeMenu(request: GeminiRequest): Promise<GeminiResponse> {
    this.startTime = Date.now();
    
    try {
      console.log(`Starting secure menu analysis for request ${request.requestId}`);
      
      // Ensure user is authenticated
      await this.ensureAuthenticated();

      // Check local cache first for offline support
      const cachedResult = await this.checkLocalCache(request);
      if (cachedResult) {
        console.log(`Returning cached result for request ${request.requestId}`);
        return {
          ...cachedResult,
          requestId: request.requestId,
          processingTime: Date.now() - this.startTime,
        };
      }

      // Check network connectivity
      if (!this.isOnline()) {
        return this.getOfflineResponse(request);
      }

      // Make secure API request through Edge Function
      const response = await this.makeSecureRequest(request);
      
      // Cache successful response for offline use
      if (response.success) {
        await this.cacheResponse(request, response);
      }

      console.log(`Secure menu analysis completed for request ${request.requestId} in ${response.processingTime}ms`);
      return response;

    } catch (error) {
      console.error(`Secure menu analysis failed for request ${request.requestId}:`, error);
      
      // Try to return cached result as fallback
      const cachedFallback = await this.checkLocalCache(request);
      if (cachedFallback) {
        console.log(`Returning cached fallback for request ${request.requestId}`);
        return {
          ...cachedFallback,
          requestId: request.requestId,
          processingTime: Date.now() - this.startTime,
        };
      }

      // Return error response
      return {
        success: false,
        results: [],
        confidence: 0,
        message: error instanceof Error ? error.message : 'Analysis failed',
        requestId: request.requestId,
        processingTime: Date.now() - this.startTime,
      };
    }
  }

  /**
   * Make secure API request through Supabase Edge Function
   * 
   * @param request - The analysis request
   * @returns Promise resolving to analysis response
   */
  private async makeSecureRequest(request: GeminiRequest): Promise<GeminiResponse> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`Secure API request attempt ${attempt}/${this.maxRetries}`);
        
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        try {
          // Call Supabase Edge Function
          const { data, error } = await this.supabase.functions.invoke('analyze-menu', {
            body: {
              dietaryPreferences: request.dietaryPreferences,
              menuItems: request.menuItems,
              context: request.context,
              requestId: request.requestId,
            },
            headers: {
              'Content-Type': 'application/json',
            },
          });

          clearTimeout(timeoutId);

          if (error) {
            throw new Error(`Edge Function error: ${error.message}`);
          }

          if (!data) {
            throw new Error('Empty response from Edge Function');
          }

          // Build response object
          const response: GeminiResponse = {
            success: true,
            results: data.results || [],
            confidence: data.confidence || 0.8,
            message: data.message,
            requestId: request.requestId,
            processingTime: Date.now() - this.startTime,
          };

          return response;
          
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`Secure API request attempt ${attempt} failed:`, lastError.message);
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(lastError)) {
          break;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < this.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Ensure user is authenticated
   * 
   * Creates anonymous session if no session exists.
   */
  private async ensureAuthenticated(): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();
    
    if (!session) {
      console.log('No session found, creating anonymous session...');
      const result = await authService.signInAnonymously();
      
      if (!result.success) {
        throw new Error(`Authentication failed: ${result.error}`);
      }
    }
  }

  /**
   * Check local cache for existing analysis
   * 
   * @param request - The analysis request
   * @returns Cached response or null
   */
  private async checkLocalCache(request: GeminiRequest): Promise<GeminiResponse | null> {
    try {
      const cacheKey = this.generateCacheKey(request);
      const cachedData = await AsyncStorage.getItem(`${this.cachePrefix}${cacheKey}`);
      
      if (!cachedData) {
        return null;
      }

      const cacheEntry: CacheEntry = JSON.parse(cachedData);
      
      // Check if cache is still valid
      if (Date.now() > cacheEntry.expiresAt) {
        // Remove expired cache
        await AsyncStorage.removeItem(`${this.cachePrefix}${cacheKey}`);
        return null;
      }

      console.log(`Cache hit for key: ${cacheKey}`);
      return cacheEntry.data;
      
    } catch (error) {
      console.warn('Error checking local cache:', error);
      return null;
    }
  }

  /**
   * Cache successful response for offline use
   * 
   * @param request - The original request
   * @param response - The successful response
   */
  private async cacheResponse(request: GeminiRequest, response: GeminiResponse): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(request);
      const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
      
      const cacheEntry: CacheEntry = {
        key: cacheKey,
        data: response,
        timestamp: Date.now(),
        expiresAt,
      };

      await AsyncStorage.setItem(
        `${this.cachePrefix}${cacheKey}`,
        JSON.stringify(cacheEntry)
      );

      console.log(`Cached response for key: ${cacheKey}`);
      
    } catch (error) {
      console.warn('Error caching response:', error);
    }
  }

  /**
   * Generate cache key for request
   * 
   * @param request - The analysis request
   * @returns Cache key string
   */
  private generateCacheKey(request: GeminiRequest): string {
    const content = JSON.stringify({
      dietaryType: request.dietaryPreferences.dietaryType,
      customRestrictions: request.dietaryPreferences.customRestrictions,
      menuItems: request.menuItems.map(item => ({
        name: item.name,
        description: item.description,
        ingredients: item.ingredients,
      })),
    });

    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Get offline response when network is unavailable
   * 
   * @param request - The analysis request
   * @returns Offline response
   */
  private getOfflineResponse(request: GeminiRequest): GeminiResponse {
    return {
      success: false,
      results: [],
      confidence: 0,
      message: 'Offline mode - please connect to internet to analyze menu',
      requestId: request.requestId,
      processingTime: Date.now() - this.startTime,
    };
  }

  /**
   * Check if device is online
   * 
   * @returns True if online
   */
  private isOnline(): boolean {
    // In React Native, we can use NetInfo, but for now use a simple check
    return typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
  }

  /**
   * Check if error should not be retried
   * 
   * @param error - Error to check
   * @returns True if error should not be retried
   */
  private isNonRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    
    // Don't retry on authentication errors
    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return true;
    }
    
    // Don't retry on rate limit errors
    if (message.includes('rate limit') || message.includes('quota')) {
      return true;
    }
    
    // Don't retry on invalid request format
    if (message.includes('invalid') && message.includes('request')) {
      return true;
    }
    
    return false;
  }

  /**
   * Test API connectivity through Edge Function
   * 
   * @returns Promise resolving to test result
   */
  async testConnection(): Promise<{ success: boolean; message: string; latency?: number }> {
    const startTime = Date.now();
    
    try {
      await this.ensureAuthenticated();
      
      // Test with a simple request
      const testRequest: GeminiRequest = {
        dietaryPreferences: {
          dietaryType: 'vegan' as any,
          lastUpdated: new Date().toISOString(),
          onboardingCompleted: true,
        },
        menuItems: [{
          id: 'test',
          name: 'Test Item',
          rawText: 'Test Item',
        }],
        requestId: 'connection-test',
      };

      const response = await this.makeSecureRequest(testRequest);
      const latency = Date.now() - startTime;
      
      if (response.success) {
        return {
          success: true,
          message: 'Secure API connection test passed',
          latency,
        };
      } else {
        return {
          success: false,
          message: 'API responded but analysis failed',
          latency,
        };
      }
      
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error during connection test',
      };
    }
  }

  /**
   * Get user usage statistics
   * 
   * @returns Promise resolving to usage stats
   */
  async getUserUsageStats(): Promise<UsageStats | null> {
    try {
      await this.ensureAuthenticated();
      
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return null;
      }

      const { data, error } = await this.supabase
        .from('users_quota')
        .select('daily_requests, monthly_requests, last_reset_daily, tier')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        dailyRequests: data.daily_requests,
        monthlyRequests: data.monthly_requests,
        lastReset: data.last_reset_daily,
        tier: data.tier,
      };
      
    } catch (error) {
      console.warn('Error fetching usage stats:', error);
      return null;
    }
  }

  /**
   * Clear local cache
   * 
   * @returns Promise resolving when cache is cleared
   */
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
        console.log(`Cleared ${cacheKeys.length} cache entries`);
      }
      
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  }

  /**
   * Get Supabase client instance
   * 
   * For use by other services that need direct Supabase access.
   * 
   * @returns Supabase client
   */
  getSupabaseClient(): SupabaseClient {
    return this.supabase;
  }
}

// Export singleton instance
export const secureGeminiService = new SecureGeminiService();

// Export default
export default secureGeminiService;