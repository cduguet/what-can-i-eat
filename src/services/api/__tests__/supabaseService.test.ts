/**
 * Supabase Service Tests
 * 
 * Comprehensive test suite for the SecureGeminiService class covering:
 * - Secure API requests through Edge Functions
 * - Authentication integration
 * - Local caching functionality
 * - Offline support
 * - Error handling and retry logic
 */

// Ensure env vars are set before requiring the module under test
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://mock-project.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'mock-anon-key';

// Defer requiring the module until after env vars and mocks are ready
let SecureGeminiService: typeof import('../supabaseService').SecureGeminiService;
import { authService } from '../../auth/authService';
import { GeminiRequest, GeminiResponse, DietaryType } from '../../../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('../../auth/authService', () => ({
  authService: {
    initializeAuth: jest.fn(),
    signInAnonymously: jest.fn(),
    getSupabaseClient: jest.fn(),
  },
}));
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    functions: {
      invoke: jest.fn(),
    },
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
    },
  })),
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('SecureGeminiService', () => {
  let secureGeminiService: SecureGeminiService;
  let mockSupabaseClient: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock Supabase client
    mockSupabaseClient = {
      functions: {
        invoke: jest.fn(),
      },
      auth: {
        getSession: jest.fn(),
        getUser: jest.fn(),
      },
    };

    // Mock createClient to return our mock
    const { createClient } = require('@supabase/supabase-js');
    createClient.mockReturnValue(mockSupabaseClient);

    // Import after env is set
    ({ SecureGeminiService } = require('../supabaseService'));
    // Create fresh service instance
    secureGeminiService = new SecureGeminiService();

    // Default: allow anonymous auth to succeed when needed
    mockAuthService.signInAnonymously.mockResolvedValue({ success: true, session: { user: { id: 'anon' } } } as any);

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  describe('analyzeMenu', () => {
    const mockRequest: GeminiRequest = {
      dietaryPreferences: {
        dietaryType: DietaryType.VEGAN,
        lastUpdated: '2023-01-01T00:00:00Z',
        onboardingCompleted: true,
      },
      menuItems: [
        {
          id: '1',
          name: 'Grilled Vegetables',
          rawText: 'Grilled Vegetables - Fresh seasonal vegetables',
        },
      ],
      requestId: 'test-request-123',
    };

    const mockResponse: GeminiResponse = {
      success: true,
      results: [
        {
          itemId: '1',
          itemName: 'Grilled Vegetables',
          suitability: 'good' as any,
          explanation: 'Suitable for vegan diet',
          confidence: 0.9,
        },
      ],
      confidence: 0.9,
      message: 'Analysis completed',
      requestId: 'test-request-123',
      processingTime: 1500,
    };

    it('should analyze menu successfully with authenticated user', async () => {
      // Mock authenticated session
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
      });

      // Mock successful Edge Function call
      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: {
          results: mockResponse.results,
          confidence: mockResponse.confidence,
          message: mockResponse.message,
        },
        error: null,
      });

      // Mock cache miss
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await secureGeminiService.analyzeMenu(mockRequest);

      expect(result.success).toBe(true);
      expect(result.results).toEqual(mockResponse.results);
      expect(result.requestId).toBe(mockRequest.requestId);
      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith('analyze-menu', {
        body: {
          dietaryPreferences: mockRequest.dietaryPreferences,
          menuItems: mockRequest.menuItems,
          context: mockRequest.context,
          requestId: mockRequest.requestId,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should authenticate anonymously if no session exists', async () => {
      // Mock no existing session
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
      });

      // Mock successful anonymous sign-in
      mockAuthService.signInAnonymously.mockResolvedValue({
        success: true,
        session: { user: { id: 'anon-user' } } as any,
      });

      // Mock successful Edge Function call
      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      // Mock cache miss
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await secureGeminiService.analyzeMenu(mockRequest);

      expect(mockAuthService.signInAnonymously).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should return cached result if available', async () => {
      // Mock authenticated session
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
      });

      // Mock cache hit
      const cachedEntry = {
        key: 'cache-key',
        data: mockResponse,
        timestamp: Date.now(),
        expiresAt: Date.now() + 86400000, // 24 hours from now
      };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(cachedEntry));

      const result = await secureGeminiService.analyzeMenu(mockRequest);

      expect(result.success).toBe(true);
      expect(result.results).toEqual(mockResponse.results);
      expect(mockSupabaseClient.functions.invoke).not.toHaveBeenCalled();
    });

    it('should handle offline mode gracefully', async () => {
      // Mock offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
      });

      // Mock authenticated session
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
      });

      // Mock cache miss
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await secureGeminiService.analyzeMenu(mockRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Offline mode');
      expect(mockSupabaseClient.functions.invoke).not.toHaveBeenCalled();
    });

    it('should retry on transient errors', async () => {
      // Mock authenticated session
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
      });

      // Mock cache miss
      mockAsyncStorage.getItem.mockResolvedValue(null);

      // Mock first call fails, second succeeds
      mockSupabaseClient.functions.invoke
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Network error' },
        })
        .mockResolvedValueOnce({
          data: mockResponse,
          error: null,
        });

      const result = await secureGeminiService.analyzeMenu(mockRequest);

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledTimes(2);
    });

    it('should handle authentication failures', async () => {
      // Mock no session
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
      });

      // Mock authentication failure
      mockAuthService.signInAnonymously.mockResolvedValue({
        success: false,
        error: 'Authentication failed',
      });

      const result = await secureGeminiService.analyzeMenu(mockRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Authentication failed');
    });

    it('should handle Edge Function errors', async () => {
      // Mock authenticated session
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
      });

      // Mock cache miss
      mockAsyncStorage.getItem.mockResolvedValue(null);

      // Mock Edge Function error
      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Rate limit exceeded' },
      });

      const result = await secureGeminiService.analyzeMenu(mockRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Rate limit exceeded');
    });

    it('should cache successful responses', async () => {
      // Mock authenticated session
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
      });

      // Mock cache miss
      mockAsyncStorage.getItem.mockResolvedValue(null);

      // Mock successful Edge Function call
      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      await secureGeminiService.analyzeMenu(mockRequest);

      // Verify caching was attempted
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
      const cacheWrites = mockAsyncStorage.setItem.mock.calls.filter(c => String(c[0]).startsWith('menu_analysis_cache_'));
      expect(cacheWrites.length).toBeGreaterThan(0);
      const setItemCall = cacheWrites[0];
      
      const cachedData = JSON.parse(setItemCall[1]);
      expect(cachedData.data).toEqual(expect.objectContaining({
        success: true,
        results: mockResponse.results,
      }));
    });
  });

  describe('testConnection', () => {
    it('should test connection successfully', async () => {
      // Mock authenticated session
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
      });

      // Mock successful test request
      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { success: true, results: [] },
        error: null,
      });

      const result = await secureGeminiService.testConnection();

      expect(result.success).toBe(true);
      expect(result.message).toContain('connection test passed');
      expect(typeof result.latency).toBe('number');
    });

    it('should handle connection test failures', async () => {
      // Mock authenticated session
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
      });

      // Mock failed test request
      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' },
      });

      const result = await secureGeminiService.testConnection();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Connection failed');
    });
  });

  describe.skip('getUserUsageStats', () => {
    beforeEach(() => {
      mockAuthService.signInAnonymously.mockResolvedValue({ success: true, session: { user: { id: 'anon' } } } as any);
    });
    it('should return usage statistics for authenticated user', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      // Mock database query
      const mockStats = {
        daily_requests: 5,
        monthly_requests: 150,
        last_reset_daily: '2023-01-01T00:00:00Z',
        tier: 'free',
      };

      // Mock Supabase query chain
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockStats,
          error: null,
        }),
      };

      mockSupabaseClient.from = jest.fn().mockReturnValue(mockQuery);

      const result = await secureGeminiService.getUserUsageStats();

      expect(result).toEqual({
        dailyRequests: mockStats.daily_requests,
        monthlyRequests: mockStats.monthly_requests,
        lastReset: mockStats.last_reset_daily,
        tier: mockStats.tier,
      });
    });

    it('should return null if no user authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const result = await secureGeminiService.getUserUsageStats();

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      mockSupabaseClient.from = jest.fn().mockReturnValue(mockQuery);

      const result = await secureGeminiService.getUserUsageStats();

      expect(result).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('should clear all cache entries', async () => {
      const mockKeys = [
        'menu_analysis_cache_key1',
        'menu_analysis_cache_key2',
        'other_key',
        'menu_analysis_cache_key3',
      ];

      mockAsyncStorage.getAllKeys.mockResolvedValue(mockKeys);
      mockAsyncStorage.multiRemove.mockResolvedValue();

      await secureGeminiService.clearCache();

      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        'menu_analysis_cache_key1',
        'menu_analysis_cache_key2',
        'menu_analysis_cache_key3',
      ]);
    });

    it('should handle cache clearing errors gracefully', async () => {
      mockAsyncStorage.getAllKeys.mockRejectedValue(new Error('Storage error'));

      // Should not throw
      await expect(secureGeminiService.clearCache()).resolves.toBeUndefined();
    });
  });

  describe('getSupabaseClient', () => {
    it('should return Supabase client instance', () => {
      const client = secureGeminiService.getSupabaseClient();

      expect(client).toBe(mockSupabaseClient);
    });
  });

  describe('cache key generation', () => {
    it('should generate consistent cache keys for identical requests', async () => {
      const request1: GeminiRequest = {
        dietaryPreferences: {
          dietaryType: DietaryType.VEGAN,
          lastUpdated: '2023-01-01T00:00:00Z',
          onboardingCompleted: true,
        },
        menuItems: [
          { id: '1', name: 'Item A', rawText: 'Item A' },
          { id: '2', name: 'Item B', rawText: 'Item B' },
        ],
        requestId: 'req-1',
      };

      const request2: GeminiRequest = {
        ...request1,
        requestId: 'req-2', // Different request ID
      };

      // Mock authenticated session
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
      });

      // Mock cache miss for both
      mockAsyncStorage.getItem.mockResolvedValue(null);

      // Mock successful responses
      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { success: true, results: [] },
        error: null,
      });

      await secureGeminiService.analyzeMenu(request1);
      await secureGeminiService.analyzeMenu(request2);

      // Both should use the same cache key (ignoring requestId)
      const setItemCalls = mockAsyncStorage.setItem.mock.calls;
      // Filter only cache writes for menu_analysis_cache_
      const cacheWrites = setItemCalls.filter(call => String(call[0]).startsWith('menu_analysis_cache_'));
      expect(cacheWrites.length).toBeGreaterThanOrEqual(2);
      
      const cacheKey1 = cacheWrites[0][0];
      const cacheKey2 = cacheWrites[1][0];
      expect(cacheKey1).toBe(cacheKey2);
    });
  });
});
