/**
 * Gemini API Integration Test
 * 
 * Test script to verify the Gemini API integration works with real API calls.
 */

import { DietaryType, MenuInputType } from '../../types';
import { menuAnalysisService } from './menuAnalysisService';

// For local testing only: set EXPO_PUBLIC_GEMINI_API_KEY in your environment.
// Do NOT hardcode API keys in source.
if (!process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
  console.warn('[testGeminiIntegration] EXPO_PUBLIC_GEMINI_API_KEY not set. Set it in a local .env file for manual tests.');
}

/**
 * Test menu data for analysis
 */
const testMenuData = `
APPETIZERS
Garden Salad - Fresh mixed greens, tomatoes, cucumbers, carrots with balsamic vinaigrette $12
Caesar Salad - Romaine lettuce, parmesan cheese, croutons, caesar dressing $14
Buffalo Wings - Chicken wings with buffalo sauce, served with blue cheese dip $16
Mozzarella Sticks - Breaded mozzarella with marinara sauce $10

MAIN COURSES
Grilled Chicken Breast - Herb-seasoned chicken with roasted vegetables $22
Beef Burger - Angus beef patty, lettuce, tomato, onion, cheese, served with fries $18
Margherita Pizza - Tomato sauce, fresh mozzarella, basil, olive oil $20
Pasta Primavera - Penne pasta with seasonal vegetables in olive oil and garlic $19
Grilled Salmon - Atlantic salmon with lemon butter sauce and rice pilaf $26
Vegetable Stir Fry - Mixed vegetables with tofu in teriyaki sauce over rice $17

DESSERTS
Chocolate Cake - Rich chocolate cake with vanilla ice cream $8
Tiramisu - Classic Italian dessert with coffee and mascarpone $9
Fresh Fruit Bowl - Seasonal fresh fruits $6
`;

/**
 * Test vegan dietary preferences
 */
const veganPreferences = {
  dietaryType: DietaryType.VEGAN,
  lastUpdated: new Date().toISOString(),
  onboardingCompleted: true,
};

/**
 * Test vegetarian dietary preferences
 */
const vegetarianPreferences = {
  dietaryType: DietaryType.VEGETARIAN,
  lastUpdated: new Date().toISOString(),
  onboardingCompleted: true,
};

/**
 * Run the Gemini API test
 */
async function runGeminiTest() {
  console.log('🧪 Starting Gemini API Integration Test...\n');

  try {
    // Test 1: Vegan Analysis
    console.log('📋 Test 1: Analyzing menu for VEGAN dietary preferences');
    console.log('=' .repeat(60));
    
    const veganMenuInput = {
      type: MenuInputType.TEXT,
      data: testMenuData,
      timestamp: new Date().toISOString(),
    };

    const veganResult = await menuAnalysisService.analyzeMenu(veganMenuInput, veganPreferences);
    
    console.log(`✅ Vegan Analysis Result:`);
    console.log(`   Success: ${veganResult.success}`);
    console.log(`   Confidence: ${veganResult.confidence}`);
    console.log(`   Items analyzed: ${veganResult.results.length}`);
    console.log(`   Processing time: ${veganResult.processingTime}ms`);
    
    if (veganResult.success) {
      const goodItems = veganResult.results.filter(r => r.suitability === 'good');
      const carefulItems = veganResult.results.filter(r => r.suitability === 'careful');
      const avoidItems = veganResult.results.filter(r => r.suitability === 'avoid');
      
      console.log(`   Good items: ${goodItems.length}`);
      console.log(`   Careful items: ${carefulItems.length}`);
      console.log(`   Avoid items: ${avoidItems.length}`);
      
      // Show some examples
      if (goodItems.length > 0) {
        console.log(`\n   ✅ Good items examples:`);
        goodItems.slice(0, 2).forEach(item => {
          console.log(`      - ${item.itemName}: ${item.explanation}`);
        });
      }
      
      if (avoidItems.length > 0) {
        console.log(`\n   ❌ Avoid items examples:`);
        avoidItems.slice(0, 2).forEach(item => {
          console.log(`      - ${item.itemName}: ${item.explanation}`);
        });
      }
    } else {
      console.log(`   ❌ Error: ${veganResult.message}`);
    }

    console.log('\n' + '=' .repeat(60));

    // Test 2: Vegetarian Analysis
    console.log('\n📋 Test 2: Analyzing menu for VEGETARIAN dietary preferences');
    console.log('=' .repeat(60));
    
    const vegetarianMenuInput = {
      type: MenuInputType.TEXT,
      data: testMenuData,
      timestamp: new Date().toISOString(),
    };

    const vegetarianResult = await menuAnalysisService.analyzeMenu(vegetarianMenuInput, vegetarianPreferences);
    
    console.log(`✅ Vegetarian Analysis Result:`);
    console.log(`   Success: ${vegetarianResult.success}`);
    console.log(`   Confidence: ${vegetarianResult.confidence}`);
    console.log(`   Items analyzed: ${vegetarianResult.results.length}`);
    console.log(`   Processing time: ${vegetarianResult.processingTime}ms`);
    
    if (vegetarianResult.success) {
      const goodItems = vegetarianResult.results.filter(r => r.suitability === 'good');
      const carefulItems = vegetarianResult.results.filter(r => r.suitability === 'careful');
      const avoidItems = vegetarianResult.results.filter(r => r.suitability === 'avoid');
      
      console.log(`   Good items: ${goodItems.length}`);
      console.log(`   Careful items: ${carefulItems.length}`);
      console.log(`   Avoid items: ${avoidItems.length}`);
      
      // Show some examples
      if (goodItems.length > 0) {
        console.log(`\n   ✅ Good items examples:`);
        goodItems.slice(0, 2).forEach(item => {
          console.log(`      - ${item.itemName}: ${item.explanation}`);
        });
      }
      
      if (avoidItems.length > 0) {
        console.log(`\n   ❌ Avoid items examples:`);
        avoidItems.slice(0, 2).forEach(item => {
          console.log(`      - ${item.itemName}: ${item.explanation}`);
        });
      }
    } else {
      console.log(`   ❌ Error: ${vegetarianResult.message}`);
    }

    console.log('\n' + '=' .repeat(60));
    console.log('🎉 Gemini API Integration Test Completed Successfully!');
    
    return {
      veganTest: veganResult.success,
      vegetarianTest: vegetarianResult.success,
      veganResults: veganResult,
      vegetarianResults: vegetarianResult,
    };

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    throw error;
  }
}

// Export for use in other files
export { runGeminiTest };

// Run test if this file is executed directly
if (require.main === module) {
  runGeminiTest()
    .then((results) => {
      console.log('\n📊 Test Summary:');
      console.log(`   Vegan test: ${results.veganTest ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`   Vegetarian test: ${results.vegetarianTest ? '✅ PASSED' : '❌ FAILED'}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test suite failed:', error);
      process.exit(1);
    });
}
