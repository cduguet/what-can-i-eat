/**
 * Supabase AI Service Tests
 *
 * Tests for the Supabase AI service that calls Edge Functions
 */

import { AIProvider, GeminiRequest, MultimodalGeminiRequest, ContentType, DietaryType } from '../../../types';

// Mock Supabase client
const mockSupabaseClient = {
  functions: {
    invoke: jest.fn()
  }
};

// Mock createClient
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}));

// Import after mocking
const { SupabaseAIService } = require('../supabaseAIService');

describe('SupabaseAIService', () => {
  let service: any;
  const mockConfig = {
    url: 'https://test.supabase.co',
    anonKey: 'test-anon-key',
    provider: AIProvider.GEMINI,
    timeout: 30000
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SupabaseAIService(mockConfig);
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(service).toBeInstanceOf(SupabaseAIService);
      expect(service.getProvider()).toBe(AIProvider.GEMINI);
    });

    it('should use default values for optional config', () => {
      const minimalConfig = {
        url: 'https://test.supabase.co',
        anonKey: 'test-anon-key'
      };
      const serviceWithDefaults = new SupabaseAIService(minimalConfig);
      expect(serviceWithDefaults.getProvider()).toBe(AIProvider.GEMINI);
    });
  });

  describe('analyzeMenu', () => {
    const mockRequest: GeminiRequest = {
      dietaryPreferences: {
        dietaryType: DietaryType.VEGAN,
        customRestrictions: 'nuts',
        lastUpdated: new Date().toISOString(),
        onboardingCompleted: true
      },
      menuItems: [
        {
          id: '1',
          name: 'Pasta',
          description: 'Tomato pasta',
          rawText: 'Pasta - Tomato pasta'
        }
      ],
      context: 'Test context',
      requestId: 'test-123'
    };

    it('should successfully analyze menu', async () => {
      const mockResponse = {
        success: true,
        results: [
          {
            itemId: '1',
            itemName: 'Pasta',
            suitability: 'good',
            explanation: 'Vegan friendly',
            confidence: 0.9,
            concerns: []
          }
        ],
        confidence: 0.9,
        message: 'Analysis complete',
        requestId: 'test-123',
        processingTime: 1000,
        provider: 'gemini'
      };

      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: mockResponse,
        error: null
      });

      const result = await service.analyzeMenu(mockRequest);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.requestId).toBe('test-123');
      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith(
        'ai-menu-analysis',
        {
          body: {
            type: 'analyze',
            dietaryPreferences: mockRequest.dietaryPreferences,
            menuItems: mockRequest.menuItems,
            context: mockRequest.context,
            requestId: mockRequest.requestId,
            provider: AIProvider.GEMINI
          },
          signal: expect.any(AbortSignal)
        }
      );
    });

    it('should handle Supabase function errors', async () => {
      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Function error' }
      });

      const result = await service.analyzeMenu(mockRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Function error');
      expect(result.results).toHaveLength(0);
    });

    it('should handle timeout errors', async () => {
      const shortTimeoutService = new SupabaseAIService({
        ...mockConfig,
        timeout: 50
      });

      // Simulate an aborted request (what invoke would do when signal aborts)
      const abortError = Object.assign(new Error('Aborted'), { name: 'AbortError' });
      mockSupabaseClient.functions.invoke.mockRejectedValueOnce(abortError);

      const result = await shortTimeoutService.analyzeMenu(mockRequest);

      expect(result.success).toBe(false);
      expect(result.message?.toLowerCase()).toContain('timeout');
    });
  });

  describe('analyzeMenuMultimodal', () => {
    const mockRequest: MultimodalGeminiRequest = {
      dietaryPreferences: {
        dietaryType: DietaryType.VEGETARIAN,
        customRestrictions: '',
        lastUpdated: new Date().toISOString(),
        onboardingCompleted: true
      },
      contentParts: [
        {
          type: ContentType.TEXT,
          data: 'Menu text'
        },
        {
          type: ContentType.IMAGE,
          data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
        }
      ],
      context: 'Multimodal test',
      requestId: 'test-multimodal-123'
    };

    it('should successfully analyze multimodal menu', async () => {
      const mockResponse = {
        success: true,
        results: [
          {
            itemId: 'generated_1',
            itemName: 'Pizza',
            suitability: 'good',
            explanation: 'Vegetarian friendly',
            confidence: 0.85,
            concerns: []
          }
        ],
        confidence: 0.85,
        message: 'Multimodal analysis complete',
        requestId: 'test-multimodal-123',
        processingTime: 1500,
        provider: 'gemini'
      };

      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: mockResponse,
        error: null
      });

      const result = await service.analyzeMenuMultimodal(mockRequest);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.requestId).toBe('test-multimodal-123');
      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith(
        'ai-menu-analysis',
        {
          body: {
            type: 'analyze_multimodal',
            dietaryPreferences: mockRequest.dietaryPreferences,
            contentParts: mockRequest.contentParts,
            context: mockRequest.context,
            requestId: mockRequest.requestId,
            provider: AIProvider.GEMINI
          },
          signal: expect.any(AbortSignal)
        }
      );
    });
  });

  describe('testConnection', () => {
    it('should successfully test connection', async () => {
      const mockResponse = {
        success: true,
        message: 'API connection test passed',
        requestId: expect.any(String),
        processingTime: 500,
        provider: 'gemini'
      };

      mockSupabaseClient.functions.invoke.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ data: mockResponse, error: null }), 10))
      );

      const result = await service.testConnection();

      expect(result.success).toBe(true);
      expect(result.message).toContain('GEMINI');
      expect(result.latency).toBeGreaterThan(0);
    });

    it('should handle connection test failures', async () => {
      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' }
      });

      const result = await service.testConnection();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Connection failed');
    });
  });

  describe('getConfig', () => {
    it('should return sanitized configuration', () => {
      const config = service.getConfig();

      expect(config).toEqual({
        url: mockConfig.url,
        provider: mockConfig.provider,
        timeout: mockConfig.timeout,
        anonKey: '***'
      });
    });
  });

  describe('getProvider', () => {
    it('should return current provider', () => {
      expect(service.getProvider()).toBe(AIProvider.GEMINI);
    });
  });
});

describe('createSupabaseAIService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should create service from environment variables', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    process.env.EXPO_PUBLIC_AI_PROVIDER = 'vertex';
    process.env.EXPO_PUBLIC_API_TIMEOUT = '60000';

    // Re-import to get fresh environment
    const { createSupabaseAIService } = require('../supabaseAIService');
    const service = createSupabaseAIService();

    expect(typeof service.testConnection).toBe('function');
  });

  it('should throw error for missing configuration', () => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    const { createSupabaseAIService } = require('../supabaseAIService');
    
    expect(() => createSupabaseAIService()).toThrow('Supabase configuration missing');
  });
});
