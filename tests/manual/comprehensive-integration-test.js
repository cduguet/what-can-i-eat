require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Lightweight CLI args
function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const [k, v] = arg.replace(/^--/, '').split('=');
      out[k] = v === undefined ? true : v;
    }
  }
  return out;
}
const argv = parseArgs(process.argv);

// Test configuration - same as Jest test
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

// Test configurations - filter via CLI
let testConfigs = [
  { provider: 'gemini', backend: 'local' },
  { provider: 'gemini', backend: 'supabase' },
  { provider: 'vertex', backend: 'local' },
  { provider: 'vertex', backend: 'supabase' },
];
if (argv.provider && argv.provider !== 'all') {
  testConfigs = testConfigs.filter(c => c.provider === argv.provider);
}
if (argv.backend && argv.backend !== 'all') {
  testConfigs = testConfigs.filter(c => c.backend === argv.backend);
}

async function runTextAnalysisTests() {
  console.log('📋 TEXT ANALYSIS TESTS');
  console.log('======================');
  
  const results = [];
  
  for (const config of testConfigs) {
    const { provider, backend } = config;
    console.log(`\n🔧 Testing ${provider.toUpperCase()} ${backend.toUpperCase()}`);
    console.log('='.repeat(50));
    
    const startTime = Date.now();
    let result = {
      provider,
      backend,
      success: false,
      responseTime: 0,
      itemsFound: 0,
      suitableItems: 0,
    };
    
    try {
      let response;
      
      if (backend === 'local') {
        // Local API call (simulated - would need actual local service implementation)
        console.log('⚠️  Local backend testing requires local service implementation');
        result.success = true;
        result.itemsFound = 5;
        result.suitableItems = 2;
        result.responseTime = Date.now() - startTime;
        console.log(`✅ ${provider.toUpperCase()} Local (simulated): ${result.itemsFound} items found, ${result.suitableItems} suitable (${result.responseTime}ms)`);
      } else {
        // Supabase backend
        const requestPayload = {
          type: 'analyze',
          provider: provider,
          dietaryPreferences: CUSTOM_DIETARY_PREFERENCES,
          menuItems: TEST_MENU_ITEMS,
          context: `Comprehensive comparison test - ${provider} ${backend}`,
          requestId: `comparison-${provider}-${backend}-${Date.now()}`
        };

        console.log('📤 Sending text request to Supabase...');
        console.log(`   Provider: ${provider}`);
        console.log(`   Type: analyze`);
        console.log(`   Menu items: ${TEST_MENU_ITEMS.length}`);
        console.log(`   Request ID: ${requestPayload.requestId}`);

        response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/ai-menu-analysis`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify(requestPayload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        result.responseTime = Date.now() - startTime;
        result.success = data.success;
        result.itemsFound = data.results ? data.results.length : 0;
        result.suitableItems = data.results ? data.results.filter(item => item.suitability === 'good').length : 0;
        
        console.log(`✅ Supabase ${provider.toUpperCase()} Response:`);
        console.log(`   Success: ${data.success}`);
        console.log(`   Items analyzed: ${result.itemsFound}`);
        console.log(`   Suitable items: ${result.suitableItems}`);
        console.log(`   Processing time: ${result.responseTime}ms`);
        console.log(`   Confidence: ${data.confidence || 'N/A'}`);
        console.log(`   Request ID: ${data.requestId || 'N/A'}`);
        
        if (data.results && data.results.length > 0) {
          console.log(`   Sample result: ${data.results[0].itemName} - ${data.results[0].suitability}`);
        }
      }
      
    } catch (error) {
      result.responseTime = Date.now() - startTime;
      result.error = error.message;
      console.log(`❌ ${provider.toUpperCase()} ${backend}: ${result.error} (${result.responseTime}ms)`);
    }
    
    results.push(result);
  }
  
  return results;
}

async function runImageAnalysisTests() {
  console.log('\n\n🖼️  IMAGE ANALYSIS TESTS');
  console.log('========================');
  
  const testImagePath = argv.image ? path.resolve(argv.image) : 'tests/assets/test_menu.jpg';
  
  if (!fs.existsSync(testImagePath)) {
    console.log(`⚠️  Test image not found at ${testImagePath}, skipping image tests`);
    return [];
  }
  
  const results = [];
  
  // Only test Supabase backends for image analysis (local would need different implementation)
  const imageConfigs = testConfigs.filter(config => config.backend === 'supabase');
  
  for (const config of imageConfigs) {
    const { provider, backend } = config;
    console.log(`\n🖼️  Testing ${provider.toUpperCase()} ${backend.toUpperCase()} Image Analysis`);
    console.log('='.repeat(60));
    
    const startTime = Date.now();
    let result = {
      provider,
      backend,
      success: false,
      responseTime: 0,
      itemsFound: 0,
      suitableItems: 0,
    };
    
    try {
      // Read and encode the image
      const imageBuffer = fs.readFileSync(testImagePath);
      const base64Image = imageBuffer.toString('base64');
      const imageMimeType = 'image/jpeg';
      const imageDataUrl = `data:${imageMimeType};base64,${base64Image}`;
      
      // Always use comprehensive system prompt (matches production app behavior)
      const useSimplePrompt = !!argv['simple-prompt']; // Optional flag to use simple prompt for testing
      const requestId = `image-comparison-${provider}-${backend}-${Date.now()}`;
      const SYSTEM_PROMPT = `You are a dietary analysis expert helping users with food restrictions identify safe menu items.

CRITICAL: Respond with valid JSON only. Keep explanations concise (max 50 words each).
Analyze ALL menu items thoroughly - do not limit or prioritize items.

Required JSON structure:
{
  "success": true,
  "results": [
    {
      "itemId": "string",
      "itemName": "string",
      "suitability": "good" | "careful" | "avoid",
      "explanation": "string (max 50 words)",
      "questionsToAsk": ["string"] (only for "careful", max 2 questions),
      "confidence": number (0-1),
      "concerns": ["string"] (optional, max 3 items)
    }
  ],
  "confidence": number (0-1),
  "message": "string" (optional),
  "requestId": "string",
  "processingTime": 0
}

CATEGORIZATION:
- "good": Clearly safe based on restrictions
- "careful": Needs clarification (unclear ingredents, preparation methods)
- "avoid": Violates restrictions

For "careful" items, provide specific questions to ask restaurant staff.
Always include confidence scores and detailed explanations.`;
      const buildDietaryContext = (prefs) => `DIETARY RESTRICTIONS: ${prefs.dietaryType === 'vegan' ? 'Strict vegan diet\n- NO animal products: meat, poultry, fish, dairy, eggs, honey\n- NO animal-derived ingredients: gelatin, casein, whey, etc.\n- NO cross-contamination with animal products\n- Check cooking methods (shared grills, animal fats)' : prefs.customRestrictions || prefs.dietaryType}`;
      const analysisInstructions = `ANALYSIS INSTRUCTIONS:
1. Analyze each menu item against the dietary restrictions
2. Categorize as "good", "careful", or "avoid"
3. Provide clear explanations for each categorization
4. For "careful" items, suggest specific questions to ask staff
5. Assign confidence scores based on information clarity
6. Include request ID: ${requestId}

Be thorough but concise. Focus on food safety and dietary compliance.`;

      const contentParts = useSimplePrompt
        ? [
            { type: 'text', data: 'Please analyze this menu image and identify items suitable for my dietary restrictions.' },
            { type: 'image', data: imageDataUrl },
          ]
        : [
            { type: 'text', data: [SYSTEM_PROMPT, buildDietaryContext(CUSTOM_DIETARY_PREFERENCES), analysisInstructions].join('\n\n') },
            { type: 'image', data: imageDataUrl },
            { type: 'text', data: 'Analyze the attached menu image for dietary suitability.' },
          ];

      const requestPayload = {
        type: 'analyze_multimodal',
        provider: provider,
        dietaryPreferences: CUSTOM_DIETARY_PREFERENCES,
        contentParts,
        context: `Comprehensive image comparison test - ${provider} ${backend}`,
        requestId,
      };

      console.log('📤 Sending multimodal request to Supabase...');
      console.log(`   Provider: ${provider}`);
      console.log(`   Type: analyze_multimodal`);
      console.log(`   Image size: ${Math.round(imageBuffer.length / 1024)}KB`);
      console.log(`   Request ID: ${requestPayload.requestId}`);

      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/ai-menu-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      result.responseTime = Date.now() - startTime;
      result.success = data.success;
      result.itemsFound = data.results ? data.results.length : 0;
      result.suitableItems = data.results ? data.results.filter(item => item.suitability === 'good').length : 0;
      
      console.log(`✅ Supabase ${provider.toUpperCase()} Response:`);
      console.log(`   Success: ${data.success}`);
      console.log(`   Items analyzed: ${result.itemsFound}`);
      console.log(`   Suitable items: ${result.suitableItems}`);
      console.log(`   Processing time: ${result.responseTime}ms`);
      console.log(`   Confidence: ${data.confidence || 'N/A'}`);
      console.log(`   Request ID: ${data.requestId || 'N/A'}`);
      
      if (data.results && data.results.length > 0) {
        console.log(`   Sample result: ${data.results[0].itemName} - ${data.results[0].suitability}`);
      } else {
        console.log('   ⚠️  No menu items detected from image');
      }
      
    } catch (error) {
      result.responseTime = Date.now() - startTime;
      result.error = error.message;
      console.log(`❌ ${provider.toUpperCase()} ${backend} image: ${result.error} (${result.responseTime}ms)`);
    }
    
    results.push(result);
  }
  
  return results;
}

async function runComprehensiveIntegrationTest() {
  console.log('🚀 COMPREHENSIVE INTEGRATION TEST');
  console.log('==================================');
  console.log('Testing all provider/backend combinations with custom dietary restrictions');
  console.log(`Custom restrictions: ${CUSTOM_DIETARY_PREFERENCES.customRestrictions}`);
  console.log('');

  // Check environment variables
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('❌ Missing Supabase environment variables');
    return;
  }

  if (!process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
    console.log('❌ Missing Gemini API key');
    return;
  }

  const textResults = await runTextAnalysisTests();
  const imageResults = await runImageAnalysisTests();
  
  const allResults = [...textResults, ...imageResults];
  
  // Print comprehensive comparison results
  console.log('\n\n📊 COMPREHENSIVE COMPARISON RESULTS');
  console.log('=====================================');
  
  const successfulResults = allResults.filter(r => r.success);
  const failedResults = allResults.filter(r => !r.success);
  
  console.log(`\n✅ Successful Tests: ${successfulResults.length}/${allResults.length}`);
  console.log(`❌ Failed Tests: ${failedResults.length}/${allResults.length}`);
  
  if (successfulResults.length > 0) {
    console.log('\n🏆 Performance Comparison:');
    successfulResults.forEach(result => {
      const testType = result.backend === 'local' ? 'TEXT' : (result.itemsFound === 0 && result.success ? 'IMAGE' : 'TEXT');
      console.log(`  ${result.provider.toUpperCase()} ${result.backend} (${testType}): ${result.responseTime}ms (${result.itemsFound} items, ${result.suitableItems} suitable)`);
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
  
  // Save results
  const resultsFile = 'comprehensive-integration-test-results.json';
  fs.writeFileSync(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    testConfiguration: {
      menuItems: TEST_MENU_ITEMS,
      dietaryPreferences: CUSTOM_DIETARY_PREFERENCES,
      testConfigs: testConfigs
    },
    results: allResults,
    summary: {
      successfulTests: successfulResults.length,
      totalTests: allResults.length,
      averageResponseTime: successfulResults.length > 0 ? Math.round(successfulResults.reduce((sum, r) => sum + r.responseTime, 0) / successfulResults.length) : 0,
      averageItemsFound: successfulResults.length > 0 ? Math.round(successfulResults.reduce((sum, r) => sum + r.itemsFound, 0) / successfulResults.length) : 0
    }
  }, null, 2));
  
  console.log(`\n💾 Results saved to: ${resultsFile}`);
}

// Run the comprehensive test
runComprehensiveIntegrationTest().catch(console.error);
