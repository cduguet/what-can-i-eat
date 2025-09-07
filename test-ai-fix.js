/**
 * Direct test script to validate AI prompt fix
 * Bypasses Jest configuration issues by running as a simple Node.js script
 */

// Load environment variables
require('dotenv').config();

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_MENU_ITEMS = [
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

const CUSTOM_DIETARY_PREFERENCES = {
  dietaryType: 'custom',
  customRestrictions: 'No seafood, lactose intolerant, prefiere comida vegetariana', // Spanish to test language handling
  lastUpdated: new Date().toISOString(),
  onboardingCompleted: true
};

async function testSupabaseService() {
  console.log('🧪 Testing Supabase AI Service');
  console.log('================================');
  
  const startTime = Date.now();
  
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY');
    }

    console.log(`📡 Supabase URL: ${supabaseUrl}`);
    console.log(`🔑 Using API key: ${supabaseKey.substring(0, 20)}...`);

    const requestBody = {
      dietaryPreferences: CUSTOM_DIETARY_PREFERENCES,
      menuItems: TEST_MENU_ITEMS,
      context: 'AI prompt fix validation test',
      requestId: `fix-validation-${Date.now()}`
    };

    console.log('\n📤 Sending request to Supabase...');
    console.log(`   Menu items: ${TEST_MENU_ITEMS.length}`);
    console.log(`   Dietary restrictions: ${CUSTOM_DIETARY_PREFERENCES.customRestrictions}`);

    const response = await fetch(`${supabaseUrl}/functions/v1/ai-menu-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`Supabase API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('\n✅ Supabase Response Received');
    console.log(`⏱️  Response time: ${responseTime}ms`);
    console.log(`🎯 Success: ${data.success}`);
    console.log(`📊 Items analyzed: ${data.results?.length || 0}`);
    console.log(`🎯 Confidence: ${data.confidence}`);
    console.log(`🆔 Request ID: ${data.requestId}`);

    if (data.results && data.results.length > 0) {
      console.log('\n📋 Analysis Results:');
      data.results.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.itemName}`);
        console.log(`      Suitability: ${item.suitability}`);
        console.log(`      Confidence: ${item.confidence}`);
        console.log(`      Explanation: ${item.explanation}`);
        console.log('');
      });

      const suitableItems = data.results.filter(item => item.suitability === 'good').length;
      console.log(`🟢 Suitable items: ${suitableItems}/${data.results.length}`);
    }

    return {
      success: true,
      responseTime,
      itemsFound: data.results?.length || 0,
      suitableItems: data.results?.filter(item => item.suitability === 'good').length || 0,
      response: data
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.log(`\n❌ Supabase test failed: ${error.message}`);
    console.log(`⏱️  Time to failure: ${responseTime}ms`);
    
    return {
      success: false,
      responseTime,
      itemsFound: 0,
      suitableItems: 0,
      error: error.message
    };
  }
}

async function testImageAnalysis() {
  console.log('\n\n🖼️  Testing Image Analysis');
  console.log('===========================');
  
  const testImagePath = path.join(__dirname, 'tests/assets/test_menu.jpg');
  
  if (!fs.existsSync(testImagePath)) {
    console.log('⏭️  Skipping image test - no test image found');
    return { skipped: true };
  }

  const startTime = Date.now();
  
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    // Read and encode the image
    const imageBuffer = fs.readFileSync(testImagePath);
    const base64Image = imageBuffer.toString('base64');
    
    console.log(`📸 Image loaded: ${Math.round(imageBuffer.length / 1024)}KB`);

    const requestBody = {
      dietaryPreferences: CUSTOM_DIETARY_PREFERENCES,
      contentParts: [
        {
          type: 'text',
          data: 'Please analyze this menu image and identify items suitable for my dietary restrictions.'
        },
        {
          type: 'image',
          data: base64Image
        }
      ],
      context: 'AI prompt fix validation - image analysis',
      requestId: `image-fix-validation-${Date.now()}`
    };

    console.log('\n📤 Sending image analysis request...');

    const response = await fetch(`${supabaseUrl}/functions/v1/ai-menu-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`Image analysis API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('\n✅ Image Analysis Response Received');
    console.log(`⏱️  Response time: ${responseTime}ms`);
    console.log(`🎯 Success: ${data.success}`);
    console.log(`📊 Items detected: ${data.results?.length || 0}`);
    console.log(`🎯 Confidence: ${data.confidence}`);

    if (data.results && data.results.length > 0) {
      console.log('\n📋 Detected Items:');
      data.results.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.itemName}`);
        console.log(`      Suitability: ${item.suitability}`);
        console.log(`      Confidence: ${item.confidence}`);
      });

      const suitableItems = data.results.filter(item => item.suitability === 'good').length;
      console.log(`\n🟢 Suitable items: ${suitableItems}/${data.results.length}`);
      
      // This is the key test - we should now see many more items detected
      if (data.results.length >= 20) {
        console.log(`\n🎯 SUCCESS: AI prompt fix is working! Detected ${data.results.length} items (expected 20+)`);
        console.log('   The previous bug limited detection to ~5 items, now we see comprehensive analysis.');
      } else {
        console.log(`\n⚠️  WARNING: Only detected ${data.results.length} items, expected 20+ from the 31-item menu`);
        console.log('   This suggests the AI prompt fix may not be fully effective yet.');
      }
    }

    return {
      success: true,
      responseTime,
      itemsFound: data.results?.length || 0,
      suitableItems: data.results?.filter(item => item.suitability === 'good').length || 0,
      response: data
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.log(`\n❌ Image analysis failed: ${error.message}`);
    console.log(`⏱️  Time to failure: ${responseTime}ms`);
    
    return {
      success: false,
      responseTime,
      itemsFound: 0,
      suitableItems: 0,
      error: error.message
    };
  }
}

async function main() {
  console.log('🚀 AI Prompt Fix Validation Test');
  console.log('=================================');
  console.log('This test validates that the AI prompt fix is working correctly');
  console.log('and that menu item detection is no longer limited to ~5 items.\n');

  // Check environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.log('❌ Missing required environment variables:');
    console.log('   - SUPABASE_URL');
    console.log('   - SUPABASE_ANON_KEY');
    console.log('\nPlease set these variables and try again.');
    process.exit(1);
  }

  const results = [];

  // Test 1: Text-based menu analysis
  const textResult = await testSupabaseService();
  results.push({ type: 'text', ...textResult });

  // Test 2: Image-based menu analysis (the key test for the fix)
  const imageResult = await testImageAnalysis();
  if (!imageResult.skipped) {
    results.push({ type: 'image', ...imageResult });
  }

  // Summary
  console.log('\n\n📊 TEST SUMMARY');
  console.log('================');
  
  const successfulTests = results.filter(r => r.success);
  const failedTests = results.filter(r => !r.success);
  
  console.log(`✅ Successful tests: ${successfulTests.length}/${results.length}`);
  console.log(`❌ Failed tests: ${failedTests.length}/${results.length}`);
  
  if (successfulTests.length > 0) {
    console.log('\n🏆 Performance Summary:');
    successfulTests.forEach(result => {
      console.log(`  ${result.type.toUpperCase()}: ${result.responseTime}ms (${result.itemsFound} items, ${result.suitableItems} suitable)`);
    });
    
    // Calculate averages
    const avgResponseTime = successfulTests.reduce((sum, r) => sum + r.responseTime, 0) / successfulTests.length;
    const avgItemsFound = successfulTests.reduce((sum, r) => sum + r.itemsFound, 0) / successfulTests.length;
    const avgSuitableItems = successfulTests.reduce((sum, r) => sum + r.suitableItems, 0) / successfulTests.length;
    
    console.log(`\n📈 Averages:`);
    console.log(`  Response Time: ${Math.round(avgResponseTime)}ms`);
    console.log(`  Items Found: ${Math.round(avgItemsFound)}`);
    console.log(`  Suitable Items: ${Math.round(avgSuitableItems)}`);
  }
  
  if (failedTests.length > 0) {
    console.log('\n💥 Failed Tests:');
    failedTests.forEach(result => {
      console.log(`  ${result.type.toUpperCase()}: ${result.error}`);
    });
  }
  
  // Key validation message
  const imageTest = results.find(r => r.type === 'image');
  if (imageTest && imageTest.success && imageTest.itemsFound >= 20) {
    console.log('\n🎉 AI PROMPT FIX VALIDATION: SUCCESS!');
    console.log(`   Image analysis detected ${imageTest.itemsFound} items, confirming the fix is working.`);
    console.log('   Previous bug limited detection to ~5 items, now we see comprehensive analysis.');
  } else if (imageTest && imageTest.success) {
    console.log('\n⚠️  AI PROMPT FIX VALIDATION: PARTIAL');
    console.log(`   Image analysis detected ${imageTest.itemsFound} items, which is better than the previous ~5 limit.`);
    console.log('   However, we expected 20+ items from the 31-item test menu.');
  } else {
    console.log('\n❓ AI PROMPT FIX VALIDATION: INCONCLUSIVE');
    console.log('   Could not complete image analysis test to validate the fix.');
  }
  
  console.log('\n🎯 Test completed with custom dietary restrictions:');
  console.log(`   Dietary Type: ${CUSTOM_DIETARY_PREFERENCES.dietaryType}`);
  console.log(`   Custom Restrictions: ${CUSTOM_DIETARY_PREFERENCES.customRestrictions}`);
}

// Run the test
main().catch(error => {
  console.error('\n💥 Test script failed:', error);
  process.exit(1);
});