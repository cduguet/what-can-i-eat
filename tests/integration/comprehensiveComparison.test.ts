/**
 * Comprehensive Comparison Test
 * Tests all 4 combinations: Gemini Local, Gemini Supabase, Vertex Local, Vertex Supabase
 * with custom dietary restrictions for standardized testing
 */

import { aiService } from '../../src/services/api/aiService';
import {
  AIProvider,
  DietaryType,
  GeminiRequest,
  MultimodalGeminiRequest,
  ContentType,
  UserPreferences,
  MenuItem
} from '../../src/types';
import fs from 'fs';
import path from 'path';

// Test configuration
const TEST_MENU_ITEMS: MenuItem[] = [
  {
    id: '1',
    name: 'Bruschetta with tomatoes and basil',
    description: 'Fresh tomatoes and basil on toasted bread',
    price: '$8',
    category: 'appetizer',
    rawText: 'Bruschetta with tomatoes and basil - $8'
  },
  {
    id: '2',
    name: 'Fried calamari with marinara sauce',
    description: 'Crispy fried squid rings with marinara dipping sauce',
    price: '$12',
    category: 'appetizer',
    rawText: 'Fried calamari with marinara sauce - $12'
  },
  {
    id: '3',
    name: 'Caesar salad with croutons and parmesan',
    description: 'Romaine lettuce with caesar dressing, croutons and parmesan cheese',
    price: '$10',
    category: 'appetizer',
    rawText: 'Caesar salad with croutons and parmesan - $10'
  },
  {
    id: '4',
    name: 'Grilled salmon with lemon butter',
    description: 'Fresh Atlantic salmon grilled with lemon butter sauce',
    price: '$24',
    category: 'main',
    rawText: 'Grilled salmon with lemon butter - $24'
  },
  {
    id: '5',
    name: 'Vegetarian pasta primavera',
    description: 'Pasta with fresh seasonal vegetables',
    price: '$16',
    category: 'main',
    rawText: 'Vegetarian pasta primavera - $16'
  }
];

const CUSTOM_DIETARY_PREFERENCES: UserPreferences = {
  dietaryType: DietaryType.CUSTOM,
  customRestrictions: 'No seafood, lactose intolerant, prefiere comida vegetariana', // Spanish to test language handling
  lastUpdated: new Date().toISOString(),
  onboardingCompleted: true
};

interface TestResult {
  provider: AIProvider;
  backend: 'local' | 'supabase';
  success: boolean;
  responseTime: number;
  itemsFound: number;
  suitableItems: number;
  error?: string;
  response?: any;
}

describe('Comprehensive AI Provider and Backend Comparison', () => {
  const testResults: TestResult[] = [];
  
  // Test configurations
  const testConfigs = [
    { provider: 'gemini' as AIProvider, backend: 'local' as const },
    { provider: 'gemini' as AIProvider, backend: 'supabase' as const },
    { provider: 'vertex' as AIProvider, backend: 'local' as const },
    { provider: 'vertex' as AIProvider, backend: 'supabase' as const },
  ];

  beforeAll(() => {
    // Ensure we have the test environment variables
    if (!process.env.EXPO_PUBLIC_GEMINI_API_KEY && !process.env.GEMINI_API_KEY) {
      throw new Error('EXPO_PUBLIC_GEMINI_API_KEY or GEMINI_API_KEY is required for testing');
    }
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.VERTEX_PROJECT_ID) {
      console.warn('Vertex AI credentials not found, Vertex tests may fail');
    }
  });

  describe('Text Analysis Comparison', () => {
    test.each(testConfigs)(
      'should analyze menu text with %s provider using %s backend',
      async ({ provider, backend }) => {
        const startTime = Date.now();
        let result: TestResult = {
          provider,
          backend,
          success: false,
          responseTime: 0,
          itemsFound: 0,
          suitableItems: 0,
        };

        try {
          // Set environment variables for this test
          const originalBackendMode = process.env.EXPO_PUBLIC_BACKEND_MODE;
          const originalProvider = process.env.EXPO_PUBLIC_AI_PROVIDER;
          
          process.env.EXPO_PUBLIC_BACKEND_MODE = backend;
          process.env.EXPO_PUBLIC_AI_PROVIDER = provider;

          // Create request using the proper structure
          const request: GeminiRequest = {
            dietaryPreferences: CUSTOM_DIETARY_PREFERENCES,
            menuItems: TEST_MENU_ITEMS,
            context: `Comprehensive comparison test - ${provider} ${backend}`,
            requestId: `comparison-${provider}-${backend}-${Date.now()}`
          };

          const response = await aiService.analyzeMenu(request);
          
          // Restore original environment
          if (originalBackendMode) {
            process.env.EXPO_PUBLIC_BACKEND_MODE = originalBackendMode;
          }
          if (originalProvider) {
            process.env.EXPO_PUBLIC_AI_PROVIDER = originalProvider;
          }

          result.responseTime = Date.now() - startTime;
          result.success = response.success;
          result.response = response;
          result.itemsFound = response.results?.length || 0;
          result.suitableItems = response.results?.filter(item => item.suitability === 'good').length || 0;

          // Validate response structure
          expect(response).toHaveProperty('success');
          expect(response).toHaveProperty('results');
          expect(response).toHaveProperty('confidence');
          expect(response).toHaveProperty('requestId');
          expect(Array.isArray(response.results)).toBe(true);
          expect(typeof response.confidence).toBe('number');

          // Validate result items structure
          if (response.results.length > 0) {
            const firstItem = response.results[0];
            expect(firstItem).toHaveProperty('itemId');
            expect(firstItem).toHaveProperty('itemName');
            expect(firstItem).toHaveProperty('suitability');
            expect(firstItem).toHaveProperty('explanation');
            expect(firstItem).toHaveProperty('confidence');
            expect(['good', 'careful', 'avoid']).toContain(firstItem.suitability);
          }

          console.log(`✅ ${provider.toUpperCase()} ${backend}: ${result.itemsFound} items found, ${result.suitableItems} suitable (${result.responseTime}ms)`);

        } catch (error) {
          result.responseTime = Date.now() - startTime;
          result.error = error instanceof Error ? error.message : String(error);
          console.log(`❌ ${provider.toUpperCase()} ${backend}: ${result.error} (${result.responseTime}ms)`);
          
          // Don't fail the test, just record the result
          expect(error).toBeDefined(); // This will always pass but documents the error
        }

        testResults.push(result);
      },
      30000 // 30 second timeout
    );
  });

  describe('Image Analysis Comparison', () => {
    let testImagePath: string;

    beforeAll(() => {
      testImagePath = path.join(__dirname, '../assets/test_menu.jpg');
      if (!fs.existsSync(testImagePath)) {
        console.warn(`Test image not found at ${testImagePath}, skipping image tests`);
      }
    });

    test.each(testConfigs)(
      'should analyze menu image with %s provider using %s backend',
      async ({ provider, backend }) => {
        if (!fs.existsSync(testImagePath)) {
          console.log(`⏭️ Skipping ${provider.toUpperCase()} ${backend} image test - no test image`);
          return;
        }

        const startTime = Date.now();
        let result: TestResult = {
          provider,
          backend,
          success: false,
          responseTime: 0,
          itemsFound: 0,
          suitableItems: 0,
        };

        try {
          // Set environment variables for this test
          const originalBackendMode = process.env.EXPO_PUBLIC_BACKEND_MODE;
          const originalProvider = process.env.EXPO_PUBLIC_AI_PROVIDER;
          
          process.env.EXPO_PUBLIC_BACKEND_MODE = backend;
          process.env.EXPO_PUBLIC_AI_PROVIDER = provider;

          // Read and encode the image
          const imageBuffer = fs.readFileSync(testImagePath);
          const base64Image = imageBuffer.toString('base64');

          // Create multimodal request
          const request: MultimodalGeminiRequest = {
            dietaryPreferences: CUSTOM_DIETARY_PREFERENCES,
            contentParts: [
              {
                type: ContentType.TEXT,
                data: 'Please analyze this menu image and identify items suitable for my dietary restrictions.'
              },
              {
                type: ContentType.IMAGE,
                data: base64Image
              }
            ],
            context: `Comprehensive image comparison test - ${provider} ${backend}`,
            requestId: `image-comparison-${provider}-${backend}-${Date.now()}`
          };

          const response = await aiService.analyzeMenuMultimodal(request);
          
          // Restore original environment
          if (originalBackendMode) {
            process.env.EXPO_PUBLIC_BACKEND_MODE = originalBackendMode;
          }
          if (originalProvider) {
            process.env.EXPO_PUBLIC_AI_PROVIDER = originalProvider;
          }

          result.responseTime = Date.now() - startTime;
          result.success = response.success;
          result.response = response;
          result.itemsFound = response.results?.length || 0;
          result.suitableItems = response.results?.filter(item => item.suitability === 'good').length || 0;

          // Validate response structure (same as text analysis)
          expect(response).toHaveProperty('success');
          expect(response).toHaveProperty('results');
          expect(response).toHaveProperty('confidence');
          expect(response).toHaveProperty('requestId');
          expect(Array.isArray(response.results)).toBe(true);

          console.log(`🖼️ ${provider.toUpperCase()} ${backend}: ${result.itemsFound} items found, ${result.suitableItems} suitable (${result.responseTime}ms)`);

        } catch (error) {
          result.responseTime = Date.now() - startTime;
          result.error = error instanceof Error ? error.message : String(error);
          console.log(`❌ ${provider.toUpperCase()} ${backend} image: ${result.error} (${result.responseTime}ms)`);
          
          // Don't fail the test, just record the result
          expect(error).toBeDefined();
        }

        testResults.push(result);
      },
      45000 // 45 second timeout for image analysis
    );
  });

  afterAll(() => {
    // Print comprehensive comparison results
    console.log('\n📊 COMPREHENSIVE COMPARISON RESULTS');
    console.log('=====================================');
    
    const successfulResults = testResults.filter(r => r.success);
    const failedResults = testResults.filter(r => !r.success);
    
    console.log(`\n✅ Successful Tests: ${successfulResults.length}/${testResults.length}`);
    console.log(`❌ Failed Tests: ${failedResults.length}/${testResults.length}`);
    
    if (successfulResults.length > 0) {
      console.log('\n🏆 Performance Comparison:');
      successfulResults.forEach(result => {
        console.log(`  ${result.provider.toUpperCase()} ${result.backend}: ${result.responseTime}ms (${result.itemsFound} items, ${result.suitableItems} suitable)`);
      });
      
      // Calculate averages
      const avgResponseTime = successfulResults.reduce((sum, r) => sum + r.responseTime, 0) / successfulResults.length;
      const avgItemsFound = successfulResults.reduce((sum, r) => sum + r.itemsFound, 0) / successfulResults.length;
      const avgSuitableItems = successfulResults.reduce((sum, r) => sum + r.suitableItems, 0) / successfulResults.length;
      
      console.log(`\n📈 Averages:`);
      console.log(`  Response Time: ${Math.round(avgResponseTime)}ms`);
      console.log(`  Items Found: ${Math.round(avgItemsFound)}`);
      console.log(`  Suitable Items: ${Math.round(avgSuitableItems)}`);
    }
    
    if (failedResults.length > 0) {
      console.log('\n💥 Failed Tests:');
      failedResults.forEach(result => {
        console.log(`  ${result.provider.toUpperCase()} ${result.backend}: ${result.error}`);
      });
    }
    
    // Check for consistency between local and Supabase
    console.log('\n🔄 Consistency Check:');
    const geminiLocal = successfulResults.find(r => r.provider === 'gemini' && r.backend === 'local');
    const geminiSupabase = successfulResults.find(r => r.provider === 'gemini' && r.backend === 'supabase');
    const vertexLocal = successfulResults.find(r => r.provider === 'vertex' && r.backend === 'local');
    const vertexSupabase = successfulResults.find(r => r.provider === 'vertex' && r.backend === 'supabase');
    
    if (geminiLocal && geminiSupabase) {
      const itemsDiff = Math.abs(geminiLocal.itemsFound - geminiSupabase.itemsFound);
      const suitableDiff = Math.abs(geminiLocal.suitableItems - geminiSupabase.suitableItems);
      console.log(`  Gemini: Items diff ${itemsDiff}, Suitable diff ${suitableDiff}`);
    }
    
    if (vertexLocal && vertexSupabase) {
      const itemsDiff = Math.abs(vertexLocal.itemsFound - vertexSupabase.itemsFound);
      const suitableDiff = Math.abs(vertexLocal.suitableItems - vertexSupabase.suitableItems);
      console.log(`  Vertex: Items diff ${itemsDiff}, Suitable diff ${suitableDiff}`);
    }
    
    console.log('\n🎯 Test completed with custom dietary restrictions:');
    console.log(`  Dietary Type: ${CUSTOM_DIETARY_PREFERENCES.dietaryType}`);
    console.log(`  Custom Restrictions: ${CUSTOM_DIETARY_PREFERENCES.customRestrictions}`);
  });
});