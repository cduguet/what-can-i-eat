/**
 * Supabase Integration Tests
 * 
 * Tests the actual Supabase Edge Function integration for AI menu analysis
 */

import { SupabaseAIService } from '../../src/services/api/supabaseAIService';
import { AIProvider, DietaryType, ContentType } from '../../src/types';

// Test configuration
const SUPABASE_CONFIG = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  provider: AIProvider.GEMINI,
  timeout: 30000
};

const hasSupabase = !!(SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey);
const describeIfSupabase = hasSupabase ? describe : describe.skip;

describeIfSupabase('Supabase Integration Tests', () => {
  let service: SupabaseAIService;

  beforeAll(() => {
    service = new SupabaseAIService(SUPABASE_CONFIG);
  });

  describe('Connection Test', () => {
    it('should successfully connect to Supabase Edge Function', async () => {
      console.log('Testing Supabase Edge Function connection...');
      
      const startTime = Date.now();
      const result = await service.testConnection();
      const endTime = Date.now();
      
      console.log('Connection test result:', {
        success: result.success,
        message: result.message,
        latency: endTime - startTime
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('connection test passed');
      expect(result.latency).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Text-based Menu Analysis', () => {
    it('should analyze a simple vegan menu', async () => {
      console.log('Testing text-based menu analysis...');
      
      const request = {
        dietaryPreferences: {
          dietaryType: DietaryType.VEGAN,
          customRestrictions: '',
          lastUpdated: new Date().toISOString(),
          onboardingCompleted: true
        },
        menuItems: [
          {
            id: '1',
            name: 'Quinoa Salad',
            description: 'Fresh quinoa with vegetables and olive oil dressing',
            rawText: 'Quinoa Salad - Fresh quinoa with vegetables and olive oil dressing'
          },
          {
            id: '2',
            name: 'Chicken Caesar Salad',
            description: 'Grilled chicken breast with romaine lettuce and parmesan',
            rawText: 'Chicken Caesar Salad - Grilled chicken breast with romaine lettuce and parmesan'
          }
        ],
        context: 'Integration test menu',
        requestId: `integration-test-${Date.now()}`
      };

      const startTime = Date.now();
      const result = await service.analyzeMenu(request);
      const endTime = Date.now();

      console.log('Menu analysis result:', {
        success: result.success,
        resultsCount: result.results.length,
        processingTime: endTime - startTime,
        confidence: result.confidence,
        requestId: result.requestId
      });

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.requestId).toBe(request.requestId);
      expect(result.confidence).toBeGreaterThan(0);
      
      // Check that the vegan item is marked as suitable
      const quinoaResult = result.results.find(r => r.itemName.includes('Quinoa'));
      expect(quinoaResult).toBeDefined();
      expect(['good', 'excellent']).toContain(quinoaResult?.suitability);
      
      // Check that the chicken item is marked as unsuitable for vegans
      const chickenResult = result.results.find(r => r.itemName.includes('Chicken'));
      expect(chickenResult).toBeDefined();
      expect(['poor', 'avoid']).toContain(chickenResult?.suitability);
    }, 30000);

    it('should handle dietary restrictions', async () => {
      console.log('Testing dietary restrictions handling...');
      
      const request = {
        dietaryPreferences: {
          dietaryType: DietaryType.VEGETARIAN,
          customRestrictions: 'nuts, dairy',
          lastUpdated: new Date().toISOString(),
          onboardingCompleted: true
        },
        menuItems: [
          {
            id: '1',
            name: 'Almond Pasta',
            description: 'Pasta with almond sauce and parmesan cheese',
            rawText: 'Almond Pasta - Pasta with almond sauce and parmesan cheese'
          }
        ],
        context: 'Dietary restrictions test',
        requestId: `restrictions-test-${Date.now()}`
      };

      const result = await service.analyzeMenu(request);

      console.log('Dietary restrictions result:', {
        success: result.success,
        itemSuitability: result.results[0]?.suitability,
        concerns: result.results[0]?.concerns
      });

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      
      // Should flag both nuts and dairy concerns
      const itemResult = result.results[0];
      expect(['poor', 'avoid']).toContain(itemResult.suitability);
      expect(itemResult.concerns?.length || 0).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Multimodal Analysis', () => {
    it('should analyze menu with text and image', async () => {
      console.log('Testing multimodal analysis...');
      
      // Simple test image (1x1 pixel PNG)
      const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      const request = {
        dietaryPreferences: {
          dietaryType: DietaryType.VEGETARIAN,
          customRestrictions: '',
          lastUpdated: new Date().toISOString(),
          onboardingCompleted: true
        },
        contentParts: [
          {
            type: ContentType.TEXT,
            data: 'Menu: 1. Margherita Pizza - Tomato sauce, mozzarella, basil'
          },
          {
            type: ContentType.IMAGE,
            data: `data:image/png;base64,${testImageBase64}`
          }
        ],
        context: 'Multimodal test',
        requestId: `multimodal-test-${Date.now()}`
      };

      const startTime = Date.now();
      const result = await service.analyzeMenuMultimodal(request);
      const endTime = Date.now();

      console.log('Multimodal analysis result:', {
        success: result.success,
        resultsCount: result.results.length,
        processingTime: endTime - startTime,
        confidence: result.confidence
      });

      expect(result.success).toBe(true);
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
    }, 45000);
  });

  describe('Error Handling', () => {
    it('should handle invalid requests gracefully', async () => {
      console.log('Testing error handling...');
      
      const invalidRequest = {
        dietaryPreferences: {
          dietaryType: DietaryType.VEGAN,
          customRestrictions: '',
          lastUpdated: new Date().toISOString(),
          onboardingCompleted: true
        },
        menuItems: [], // Empty menu items
        context: 'Error test',
        requestId: `error-test-${Date.now()}`
      };

      const result = await service.analyzeMenu(invalidRequest);

      console.log('Error handling result:', {
        success: result.success,
        message: result.message
      });

      // Should handle gracefully, either succeed with empty results or fail with clear message
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.message).toBe('string');
      expect(Array.isArray(result.results)).toBe(true);
    }, 15000);
  });

  describe('Performance Tests', () => {
    it('should complete analysis within reasonable time', async () => {
      console.log('Testing performance...');
      
      const request = {
        dietaryPreferences: {
          dietaryType: DietaryType.CUSTOM,
          customRestrictions: '',
          lastUpdated: new Date().toISOString(),
          onboardingCompleted: true
        },
        menuItems: [
          {
            id: '1',
            name: 'Grilled Salmon',
            description: 'Fresh Atlantic salmon with herbs',
            rawText: 'Grilled Salmon - Fresh Atlantic salmon with herbs'
          }
        ],
        context: 'Performance test',
        requestId: `performance-test-${Date.now()}`
      };

      const startTime = Date.now();
      const result = await service.analyzeMenu(request);
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      console.log('Performance test result:', {
        success: result.success,
        processingTime,
        serverProcessingTime: result.processingTime
      });

      expect(result.success).toBe(true);
      expect(processingTime).toBeLessThan(15000); // Should complete within 15 seconds
      expect(result.processingTime).toBeGreaterThan(0);
    }, 20000);
  });
});
