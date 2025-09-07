/**
 * Gemini Service Tests
 * 
 * Tests for the Gemini API service functionality.
 */

import { GeminiService } from '../geminiService';
import { DietaryType } from '../../../types';

// Mock the API configuration
jest.mock('../config', () => ({
  getAPIConfig: () => ({
    apiKey: 'test-api-key',
    endpoint: 'https://test-endpoint.com',
    timeout: 30000,
    maxRetries: 3,
  }),
  validateAPIConfig: () => true,
  getSanitizedConfig: (config: any) => ({
    endpoint: config.endpoint,
    timeout: config.timeout,
    maxRetries: config.maxRetries,
    apiKeyPresent: !!config.apiKey,
  }),
}));

// Mock the GoogleGenAI
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: jest.fn(),
    },
  })),
}));

describe('GeminiService', () => {
  let geminiService: GeminiService;
  let mockGenerateContent: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create service instance (constructor will new GoogleGenAI)
    geminiService = new GeminiService();

    // Extract the mocked instance used by the service
    const { GoogleGenAI } = require('@google/genai');
    const mockedCtor = GoogleGenAI as jest.Mock;
    const usedInstance = mockedCtor.mock.results[0]?.value;
    mockGenerateContent = usedInstance.models.generateContent;
  });

  describe('analyzeMenu', () => {
    it('should successfully analyze menu items', async () => {
      // Mock successful API response
      const mockResponseData = {
        success: true,
        results: [
          {
            itemId: 'item-0',
            itemName: 'Garden Salad',
            suitability: 'good',
            explanation: 'This salad contains only plant-based ingredients.',
            confidence: 0.95,
            concerns: [],
          },
        ],
        confidence: 0.95,
        requestId: 'test-request-id',
        processingTime: 0,
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockResponseData)
      });

      const request = {
        dietaryPreferences: {
          dietaryType: DietaryType.VEGAN,
          lastUpdated: new Date().toISOString(),
          onboardingCompleted: true,
        },
        menuItems: [
          {
            id: 'item-0',
            name: 'Garden Salad',
            description: 'Fresh mixed greens with tomatoes and cucumbers',
            rawText: 'Garden Salad - Fresh mixed greens with tomatoes and cucumbers $12',
          },
        ],
        requestId: 'test-request-id',
      };

      const result = await geminiService.analyzeMenu(request);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].suitability).toBe('good');
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      const request = {
        dietaryPreferences: {
          dietaryType: DietaryType.VEGAN,
          lastUpdated: new Date().toISOString(),
          onboardingCompleted: true,
        },
        menuItems: [
          {
            id: 'item-0',
            name: 'Test Item',
            rawText: 'Test Item $10',
          },
        ],
        requestId: 'test-request-id',
      };

      const result = await geminiService.analyzeMenu(request);

      expect(result.success).toBe(false);
      expect(result.message).toBe('API Error');
      expect(result.results).toHaveLength(0);
    });
  });

  describe('testConnection', () => {
    it('should successfully test API connection', async () => {
      // Mock successful connection test
      mockGenerateContent.mockResolvedValue({
        text: 'API connection successful',
      });

      // Add slight delay to simulate latency
      mockGenerateContent.mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({ text: 'API connection successful' }), 5)));

      const result = await geminiService.testConnection();

      expect(result.success).toBe(true);
      expect(result.message).toBe('API connection test passed');
      expect(result.latency).toBeGreaterThan(0);
    });

    it('should handle connection test failure', async () => {
      // Mock connection test failure
      mockGenerateContent.mockRejectedValue(new Error('Connection failed'));

      const result = await geminiService.testConnection();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Connection failed');
      expect(result.latency).toBeUndefined();
    });
  });
});
