/**
 * AI Service Tests
 * 
 * Tests for the AI service abstraction layer to ensure proper provider switching
 * and backward compatibility.
 */

import { AIService } from '../aiService';
import { AIProvider, AIConfig } from '../../../types';

// Mock environment variables
const mockEnv = {
  EXPO_PUBLIC_AI_PROVIDER: 'gemini',
  EXPO_PUBLIC_GEMINI_API_KEY: 'test-gemini-key',
  EXPO_PUBLIC_VERTEX_PROJECT_ID: 'test-project',
  EXPO_PUBLIC_VERTEX_LOCATION: 'us-central1',
};

// Mock the config module
jest.mock('../config', () => {
  const actual = jest.requireActual('../config');
  return {
    ...actual,
    getAIConfig: jest.fn(() => ({
      provider: 'gemini',
      gemini: {
        apiKey: 'test-gemini-key',
        endpoint: 'https://test-endpoint.com',
        timeout: 30000,
        maxRetries: 3,
      },
    })),
    validateAIConfig: jest.fn(() => true),
    getSanitizedAIConfig: jest.fn((config) => ({
      provider: config.provider,
      gemini: config.gemini ? { ...config.gemini, apiKey: '[REDACTED]' } : undefined,
    })),
    getBackendMode: jest.fn(() => 'local'),
    getSupabaseConfig: jest.fn(() => ({
      url: 'http://localhost',
      anonKey: 'anon',
      provider: 'gemini',
      timeout: 30000,
    })),
  };
});

// Mock the service implementations
jest.mock('../geminiService', () => ({
  GeminiService: jest.fn().mockImplementation(() => ({
    analyzeMenu: jest.fn().mockResolvedValue({ success: true, results: [] }),
    analyzeMenuMultimodal: jest.fn().mockResolvedValue({ success: true, results: [] }),
    testConnection: jest.fn().mockResolvedValue({ success: true, message: 'Connected' }),
  })),
}));

jest.mock('../vertexService', () => ({
  VertexService: jest.fn().mockImplementation(() => ({
    analyzeMenu: jest.fn().mockResolvedValue({ success: true, results: [] }),
    analyzeMenuMultimodal: jest.fn().mockResolvedValue({ success: true, results: [] }),
    testConnection: jest.fn().mockResolvedValue({ success: true, message: 'Connected' }),
  })),
}));

describe('AIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with Gemini provider by default', () => {
      const aiService = new AIService();
      expect(aiService.getProvider()).toBe(AIProvider.GEMINI);
    });

    it('should throw for Vertex local mode in client', () => {
      const customConfig: AIConfig = {
        provider: AIProvider.VERTEX,
        vertex: {
          projectId: 'test-project',
          location: 'us-central1',
          timeout: 30000,
          maxRetries: 3,
        },
      };

      expect(() => new AIService(customConfig)).toThrow('Vertex local mode is not supported');
    });
  });

  describe('provider availability', () => {
    it('should check if Gemini provider is available', () => {
      const isAvailable = AIService.isProviderAvailable(AIProvider.GEMINI);
      expect(typeof isAvailable).toBe('boolean');
    });

    it('should check if Vertex provider is available', () => {
      const isAvailable = AIService.isProviderAvailable(AIProvider.VERTEX);
      expect(typeof isAvailable).toBe('boolean');
    });

    it('should get list of available providers', () => {
      const providers = AIService.getAvailableProviders();
      expect(Array.isArray(providers)).toBe(true);
    });
  });

  describe('service methods', () => {
    let aiService: AIService;

    beforeEach(() => {
      aiService = new AIService();
    });

    it('should analyze menu', async () => {
      const request = {
        requestId: 'test-123',
        dietaryPreferences: {
          dietaryType: 'vegan' as any,
          lastUpdated: new Date().toISOString(),
          onboardingCompleted: true,
        },
        menuItems: [],
      };

      const result = await aiService.analyzeMenu(request);
      expect(result.success).toBe(true);
    });

    it('should analyze multimodal menu', async () => {
      const request = {
        requestId: 'test-123',
        dietaryPreferences: {
          dietaryType: 'vegan' as any,
          lastUpdated: new Date().toISOString(),
          onboardingCompleted: true,
        },
        contentParts: [],
      };

      const result = await aiService.analyzeMenuMultimodal(request);
      expect(result.success).toBe(true);
    });

    it('should test connection', async () => {
      const result = await aiService.testConnection();
      expect(result.success).toBe(true);
      expect(result.message).toContain('GEMINI');
    });
  });

  describe('configuration', () => {
    it('should return sanitized config', () => {
      const aiService = new AIService();
      const config = aiService.getConfig();
      expect(config).toBeDefined();
      expect(config.provider).toBe(AIProvider.GEMINI);
    });
  });
});
