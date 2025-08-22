/**
 * Gemini Multimodal API Tests
 *
 * Tests for the multimodal functionality that allows direct image analysis
 * without OCR preprocessing.
 */

import * as fs from 'fs';
import * as path from 'path';
import { GeminiService } from '../../src/services/api/geminiService';
import {
  MultimodalGeminiRequest,
  MultimodalContentPart,
  ContentType,
  DietaryType,
  UserPreferences
} from '../../src/types';

// Mock the API configuration
jest.mock('../../src/services/api/config', () => ({
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

describe('GeminiService Multimodal', () => {
  let geminiService: GeminiService;
  let mockGenerateContent: jest.Mock;

  // Helper function to load test image as base64
  const loadTestImageAsBase64 = (): string => {
    const imagePath = path.join(__dirname, '../assets/test_menu.jpg');
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Data = imageBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64Data}`;
  };

  // Load the actual test image
  const testImageBase64 = loadTestImageAsBase64();

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create service instance
    geminiService = new GeminiService();
    
    // Get mock function
    const { GoogleGenAI } = require('@google/genai');
    const mockInstance = new GoogleGenAI();
    mockGenerateContent = mockInstance.models.generateContent;
  });

  describe('analyzeMenuMultimodal', () => {
    it('should successfully analyze menu with image and text', async () => {
      // Mock successful API response
      const mockResponse = {
        text: JSON.stringify({
          success: true,
          results: [
            {
              itemId: 'item-0',
              itemName: 'Garden Salad',
              suitability: 'good',
              explanation: 'This salad contains only plant-based ingredients visible in the image.',
              confidence: 0.95,
              concerns: [],
            },
            {
              itemId: 'item-1',
              itemName: 'Chicken Caesar Salad',
              suitability: 'avoid',
              explanation: 'Contains chicken and likely parmesan cheese, not suitable for vegan diet.',
              confidence: 0.92,
              concerns: ['chicken', 'cheese'],
            },
          ],
          confidence: 0.93,
          requestId: 'test-multimodal-request',
          processingTime: 0,
        }),
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      // Create test preferences
      const preferences: UserPreferences = {
        dietaryType: DietaryType.VEGAN,
        lastUpdated: new Date().toISOString(),
        onboardingCompleted: true,
      };

      // Create multimodal content parts
      const contentParts: MultimodalContentPart[] = [
        {
          type: ContentType.TEXT,
          data: 'Please analyze this menu for vegan options',
        },
        {
          type: ContentType.IMAGE,
          data: testImageBase64,
        },
      ];

      // Create multimodal request
      const request: MultimodalGeminiRequest = {
        dietaryPreferences: preferences,
        contentParts,
        requestId: 'test-multimodal-request',
        context: 'Testing multimodal menu analysis',
      };

      const result = await geminiService.analyzeMenuMultimodal(request);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].suitability).toBe('good');
      expect(result.results[1].suitability).toBe('avoid');
      expect(result.requestId).toBe('test-multimodal-request');
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);

      // Verify the API was called with multimodal content
      const apiCall = mockGenerateContent.mock.calls[0][0];
      expect(apiCall.model).toBe('gemini-1.5-flash-latest');
      expect(apiCall.contents).toBeDefined();
      expect(Array.isArray(apiCall.contents)).toBe(true);
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      mockGenerateContent.mockRejectedValue(new Error('Multimodal API Error'));

      const preferences: UserPreferences = {
        dietaryType: DietaryType.VEGETARIAN,
        lastUpdated: new Date().toISOString(),
        onboardingCompleted: true,
      };

      const contentParts: MultimodalContentPart[] = [
        {
          type: ContentType.IMAGE,
          data: testImageBase64,
        },
      ];

      const request: MultimodalGeminiRequest = {
        dietaryPreferences: preferences,
        contentParts,
        requestId: 'test-error-request',
      };

      const result = await geminiService.analyzeMenuMultimodal(request);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Multimodal API Error');
      expect(result.results).toHaveLength(0);
      expect(result.requestId).toBe('test-error-request');
    });

    it('should handle mixed content types correctly', async () => {
      const mockResponse = {
        text: JSON.stringify({
          success: true,
          results: [
            {
              itemId: 'item-0',
              itemName: 'Veggie Burger',
              suitability: 'careful',
              explanation: 'Need to verify if the bun and patty are vegan-friendly.',
              questionsToAsk: [
                'Is the bun made without eggs or dairy?',
                'What ingredients are in the veggie patty?',
              ],
              confidence: 0.75,
              concerns: ['potential dairy in bun'],
            },
          ],
          confidence: 0.75,
          requestId: 'test-mixed-content',
          processingTime: 0,
        }),
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const preferences: UserPreferences = {
        dietaryType: DietaryType.VEGAN,
        lastUpdated: new Date().toISOString(),
        onboardingCompleted: true,
      };

      const contentParts: MultimodalContentPart[] = [
        {
          type: ContentType.TEXT,
          data: 'This is a restaurant menu with various options',
        },
        {
          type: ContentType.IMAGE,
          data: testImageBase64,
        },
        {
          type: ContentType.TEXT,
          data: 'Please focus on items that might be suitable for vegans',
        },
      ];

      const request: MultimodalGeminiRequest = {
        dietaryPreferences: preferences,
        contentParts,
        requestId: 'test-mixed-content',
      };

      const result = await geminiService.analyzeMenuMultimodal(request);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].suitability).toBe('careful');
      expect(result.results[0].questionsToAsk).toBeDefined();
      expect(result.results[0].questionsToAsk?.length).toBe(2);
    });

    it('should validate content parts structure', async () => {
      const preferences: UserPreferences = {
        dietaryType: DietaryType.CUSTOM,
        customRestrictions: 'No nuts, no dairy',
        lastUpdated: new Date().toISOString(),
        onboardingCompleted: true,
      };

      // Test with empty content parts
      const emptyRequest: MultimodalGeminiRequest = {
        dietaryPreferences: preferences,
        contentParts: [],
        requestId: 'test-empty-content',
      };

      // This should still work but might return empty results
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          success: true,
          results: [],
          confidence: 0,
          requestId: 'test-empty-content',
          processingTime: 0,
        }),
      });

      const result = await geminiService.analyzeMenuMultimodal(emptyRequest);
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(0);
    });

    it('should handle custom dietary restrictions', async () => {
      const mockResponse = {
        text: JSON.stringify({
          success: true,
          results: [
            {
              itemId: 'item-0',
              itemName: 'Almond Crusted Fish',
              suitability: 'avoid',
              explanation: 'Contains almonds which are restricted in your custom diet.',
              confidence: 0.98,
              concerns: ['almonds', 'nuts'],
            },
            {
              itemId: 'item-1',
              itemName: 'Grilled Vegetables',
              suitability: 'good',
              explanation: 'Simple grilled vegetables without nuts or dairy.',
              confidence: 0.90,
              concerns: [],
            },
          ],
          confidence: 0.94,
          requestId: 'test-custom-diet',
          processingTime: 0,
        }),
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const preferences: UserPreferences = {
        dietaryType: DietaryType.CUSTOM,
        customRestrictions: 'No nuts, no dairy, no shellfish',
        lastUpdated: new Date().toISOString(),
        onboardingCompleted: true,
      };

      const contentParts: MultimodalContentPart[] = [
        {
          type: ContentType.IMAGE,
          data: testImageBase64,
        },
      ];

      const request: MultimodalGeminiRequest = {
        dietaryPreferences: preferences,
        contentParts,
        requestId: 'test-custom-diet',
      };

      const result = await geminiService.analyzeMenuMultimodal(request);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].suitability).toBe('avoid');
      expect(result.results[0].concerns).toContain('almonds');
      expect(result.results[1].suitability).toBe('good');
    });
  });

  describe('buildMultimodalPrompt integration', () => {
    it('should properly format multimodal prompts', async () => {
      // This test verifies that the prompt building works correctly
      const preferences: UserPreferences = {
        dietaryType: DietaryType.VEGETARIAN,
        lastUpdated: new Date().toISOString(),
        onboardingCompleted: true,
      };

      const contentParts: MultimodalContentPart[] = [
        {
          type: ContentType.TEXT,
          data: 'Menu analysis request',
        },
        {
          type: ContentType.IMAGE,
          data: testImageBase64,
        },
      ];

      const request: MultimodalGeminiRequest = {
        dietaryPreferences: preferences,
        contentParts,
        requestId: 'test-prompt-format',
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          success: true,
          results: [],
          confidence: 1.0,
          requestId: 'test-prompt-format',
          processingTime: 0,
        }),
      });

      await geminiService.analyzeMenuMultimodal(request);

      // Verify the API was called with the correct structure
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-1.5-flash-latest',
        contents: expect.any(Array),
        config: {
          temperature: 0.1,
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
          abortSignal: expect.any(AbortSignal),
        },
      });

      const contents = mockGenerateContent.mock.calls[0][0].contents;
      expect(Array.isArray(contents)).toBe(true);
      expect(contents.length).toBeGreaterThan(0);
    });
  });
});