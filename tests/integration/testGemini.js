/**
 * Simple Gemini API Test
 */

// Set environment variable
process.env.EXPO_PUBLIC_GEMINI_API_KEY = 'AIzaSyDnGdFeppcakzERBPcGBC-VUGfqe4gNAxc';

const { GoogleGenAI } = require('@google/genai');

async function testGeminiAPI() {
  console.log('🧪 Testing Gemini API Integration...\n');

  try {
    // Initialize Gemini AI for Developer API (not Vertex AI)
    const genAI = new GoogleGenAI({
      apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
      vertexai: false  // Explicitly use Gemini Developer API
    });

    // Test 1: Connection Test
    console.log('📡 Test 1: Connection Test');
    console.log('=' .repeat(50));
    
    const connectionResult = await genAI.models.generateContent({
      model: 'gemini-1.5-flash-latest',
      contents: 'Respond with "API connection successful"',
      config: {
        temperature: 0.1,
        maxOutputTokens: 100,
      },
    });

    const connectionResponse = connectionResult.text;
    console.log(`Response: ${connectionResponse}`);
    
    if (connectionResponse && connectionResponse.toLowerCase().includes('successful')) {
      console.log('✅ Connection test PASSED\n');
    } else {
      console.log('❌ Connection test FAILED\n');
      return;
    }

    // Test 2: Vegan Menu Analysis
    console.log('📋 Test 2: Vegan Menu Analysis');
    console.log('=' .repeat(50));

    const veganPrompt = `You are a dietary analysis expert helping users with food restrictions identify safe menu items.

RESPONSE FORMAT: You must respond with valid JSON only, no additional text or explanations outside the JSON structure.

Required JSON structure:
{
  "success": true,
  "results": [
    {
      "itemId": "string",
      "itemName": "string", 
      "suitability": "good" | "careful" | "avoid",
      "explanation": "string",
      "questionsToAsk": ["string"] (optional, only for "careful" items),
      "confidence": number (0-1),
      "concerns": ["string"] (optional)
    }
  ],
  "confidence": number (0-1),
  "message": "string" (optional),
  "requestId": "test-request-123",
  "processingTime": 0
}

CATEGORIZATION RULES:
- "good": Items that are clearly safe based on dietary restrictions
- "careful": Items that need staff clarification (unclear ingredients, preparation methods)
- "avoid": Items that clearly violate dietary restrictions

For "careful" items, provide specific questions to ask restaurant staff.
Always include confidence scores and detailed explanations.

DIETARY RESTRICTIONS: Strict vegan diet
- NO animal products: meat, poultry, fish, dairy, eggs, honey
- NO animal-derived ingredients: gelatin, casein, whey, etc.
- NO cross-contamination with animal products
- Check cooking methods (shared grills, animal fats)

MENU ITEMS TO ANALYZE (6 items):
1. Garden Salad
   Description: Fresh mixed greens with tomatoes and cucumbers
   Category: Appetizers

2. Caesar Salad
   Description: Romaine lettuce, parmesan cheese, croutons, caesar dressing
   Category: Appetizers

3. Grilled Chicken Breast
   Description: Herb-seasoned chicken with roasted vegetables
   Category: Main Courses

4. Margherita Pizza
   Description: Tomato sauce, fresh mozzarella, basil, olive oil
   Category: Main Courses

5. Pasta Primavera
   Description: Penne pasta with seasonal vegetables in olive oil and garlic
   Category: Main Courses

6. Vegetable Stir Fry
   Description: Mixed vegetables with tofu in teriyaki sauce over rice
   Category: Main Courses

ANALYSIS INSTRUCTIONS:
1. Analyze each menu item against the dietary restrictions
2. Categorize as "good", "careful", or "avoid"
3. Provide clear explanations for each categorization
4. For "careful" items, suggest specific questions to ask staff
5. Assign confidence scores based on information clarity
6. Include request ID: test-request-123

Be thorough but concise. Focus on food safety and dietary compliance.`;

    const veganResult = await genAI.models.generateContent({
      model: 'gemini-1.5-flash-latest',
      contents: veganPrompt,
      config: {
        temperature: 0.1,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    });

    const veganResponse = veganResult.text;
    console.log('Raw response:', veganResponse);

    try {
      const veganData = JSON.parse(veganResponse);
      console.log(`✅ Vegan Analysis Result:`);
      console.log(`   Success: ${veganData.success}`);
      console.log(`   Confidence: ${veganData.confidence}`);
      console.log(`   Items analyzed: ${veganData.results.length}`);
      
      if (veganData.success && veganData.results) {
        const goodItems = veganData.results.filter(r => r.suitability === 'good');
        const carefulItems = veganData.results.filter(r => r.suitability === 'careful');
        const avoidItems = veganData.results.filter(r => r.suitability === 'avoid');
        
        console.log(`   Good items: ${goodItems.length}`);
        console.log(`   Careful items: ${carefulItems.length}`);
        console.log(`   Avoid items: ${avoidItems.length}`);
        
        // Show examples
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
      }
      
      console.log('✅ Vegan menu analysis test PASSED\n');
      
    } catch (parseError) {
      console.log('❌ Failed to parse vegan analysis response:', parseError.message);
      console.log('Raw response:', veganResponse);
    }

    // Test 3: Vegetarian Menu Analysis
    console.log('📋 Test 3: Vegetarian Menu Analysis');
    console.log('=' .repeat(50));

    const vegetarianPrompt = veganPrompt.replace(
      'DIETARY RESTRICTIONS: Strict vegan diet\n- NO animal products: meat, poultry, fish, dairy, eggs, honey\n- NO animal-derived ingredients: gelatin, casein, whey, etc.\n- NO cross-contamination with animal products\n- Check cooking methods (shared grills, animal fats)',
      'DIETARY RESTRICTIONS: Vegetarian diet\n- NO meat, poultry, fish, or seafood\n- NO meat-based broths, stocks, or sauces\n- Dairy and eggs are acceptable\n- Check for hidden meat ingredients (bacon bits, anchovies, etc.)'
    );

    const vegetarianResult = await genAI.models.generateContent({
      model: 'gemini-1.5-flash-latest',
      contents: vegetarianPrompt,
      config: {
        temperature: 0.1,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    });

    const vegetarianResponse = vegetarianResult.text;
    
    try {
      const vegetarianData = JSON.parse(vegetarianResponse);
      console.log(`✅ Vegetarian Analysis Result:`);
      console.log(`   Success: ${vegetarianData.success}`);
      console.log(`   Confidence: ${vegetarianData.confidence}`);
      console.log(`   Items analyzed: ${vegetarianData.results.length}`);
      
      if (vegetarianData.success && vegetarianData.results) {
        const goodItems = vegetarianData.results.filter(r => r.suitability === 'good');
        const carefulItems = vegetarianData.results.filter(r => r.suitability === 'careful');
        const avoidItems = vegetarianData.results.filter(r => r.suitability === 'avoid');
        
        console.log(`   Good items: ${goodItems.length}`);
        console.log(`   Careful items: ${carefulItems.length}`);
        console.log(`   Avoid items: ${avoidItems.length}`);
        
        // Show examples
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
      }
      
      console.log('✅ Vegetarian menu analysis test PASSED\n');
      
    } catch (parseError) {
      console.log('❌ Failed to parse vegetarian analysis response:', parseError.message);
      console.log('Raw response:', vegetarianResponse);
    }

    console.log('🎉 All Gemini API tests completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Run the test
testGeminiAPI()
  .then((success) => {
    if (success) {
      console.log('\n📊 Test Summary: ✅ ALL TESTS PASSED');
      process.exit(0);
    } else {
      console.log('\n📊 Test Summary: ❌ TESTS FAILED');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });