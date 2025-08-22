/**
 * Gemini Multimodal API Integration Test
 * 
 * Tests the multimodal functionality that allows direct image analysis
 * without OCR preprocessing.
 */

const fs = require('fs');
const path = require('path');

// Set environment variable
process.env.EXPO_PUBLIC_GEMINI_API_KEY = 'AIzaSyDnGdFeppcakzERBPcGBC-VUGfqe4gNAxc';

const { GoogleGenAI } = require('@google/genai');

/**
 * Load test image as base64 data URI
 */
function loadTestImageAsBase64() {
  const imagePath = path.join(__dirname, '../assets/test_menu.jpg');
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Data = imageBuffer.toString('base64');
  return `data:image/jpeg;base64,${base64Data}`;
}

/**
 * Build multimodal prompt for Gemini API
 */
function buildMultimodalPrompt(dietaryType, imageBase64, context = '') {
  const systemPrompt = `You are a dietary analysis expert helping users with food restrictions identify safe menu items.

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
  "requestId": "multimodal-test-request",
  "processingTime": 0
}

CATEGORIZATION RULES:
- "good": Items that are clearly safe based on dietary restrictions
- "careful": Items that need staff clarification (unclear ingredients, preparation methods)
- "avoid": Items that clearly violate dietary restrictions

For "careful" items, provide specific questions to ask restaurant staff.
Always include confidence scores and detailed explanations.`;

  const dietaryContext = getDietaryContext(dietaryType);
  
  const analysisInstructions = `ANALYSIS INSTRUCTIONS:
1. Analyze the menu image for visible menu items
2. Categorize each item as "good", "careful", or "avoid" based on dietary restrictions
3. Provide clear explanations for each categorization
4. For "careful" items, suggest specific questions to ask staff
5. Assign confidence scores based on information clarity
6. Include request ID: multimodal-test-request

Be thorough but concise. Focus on food safety and dietary compliance.
${context ? `ADDITIONAL CONTEXT: ${context}` : ''}`;

  // Build multimodal content array
  const contents = [
    {
      text: `${systemPrompt}\n\n${dietaryContext}\n\n${analysisInstructions}`
    },
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64.split(',')[1] // Remove data:image/jpeg;base64, prefix
      }
    }
  ];

  return contents;
}

/**
 * Get dietary context based on type
 */
function getDietaryContext(dietaryType) {
  switch (dietaryType) {
    case 'vegan':
      return `DIETARY RESTRICTIONS: Strict vegan diet
- NO animal products: meat, poultry, fish, dairy, eggs, honey
- NO animal-derived ingredients: gelatin, casein, whey, etc.
- NO cross-contamination with animal products
- Check cooking methods (shared grills, animal fats)`;
    
    case 'vegetarian':
      return `DIETARY RESTRICTIONS: Vegetarian diet
- NO meat, poultry, fish, or seafood
- NO meat-based broths, stocks, or sauces
- Dairy and eggs are acceptable
- Check for hidden meat ingredients (bacon bits, anchovies, etc.)`;
    
    default:
      return 'DIETARY RESTRICTIONS: No specific restrictions provided';
  }
}

/**
 * Test multimodal menu analysis
 */
async function testMultimodalAnalysis() {
  console.log('🧪 Testing Gemini Multimodal API Integration...\n');

  try {
    // Initialize Gemini AI for Developer API (not Vertex AI)
    const genAI = new GoogleGenAI({
      apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
      vertexai: false  // Explicitly use Gemini Developer API
    });

    // Load test image
    console.log('📷 Loading test menu image...');
    const testImageBase64 = loadTestImageAsBase64();
    console.log(`✅ Image loaded successfully (${Math.round(testImageBase64.length / 1024)}KB)\n`);

    // Test 1: Vegan Multimodal Analysis
    console.log('📋 Test 1: Vegan Multimodal Menu Analysis');
    console.log('=' .repeat(60));

    const veganPrompt = buildMultimodalPrompt(
      'vegan', 
      testImageBase64, 
      'Analyze this menu image for vegan-friendly options'
    );

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
    console.log('Raw response:', veganResponse.substring(0, 200) + '...');

    try {
      const veganData = JSON.parse(veganResponse);
      console.log(`✅ Vegan Multimodal Analysis Result:`);
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

        if (carefulItems.length > 0) {
          console.log(`\n   ⚠️ Careful items examples:`);
          carefulItems.slice(0, 1).forEach(item => {
            console.log(`      - ${item.itemName}: ${item.explanation}`);
            if (item.questionsToAsk && item.questionsToAsk.length > 0) {
              console.log(`        Questions: ${item.questionsToAsk.slice(0, 2).join(', ')}`);
            }
          });
        }
      }
      
      console.log('✅ Vegan multimodal analysis test PASSED\n');
      
    } catch (parseError) {
      console.log('❌ Failed to parse vegan multimodal response:', parseError.message);
      console.log('Raw response:', veganResponse);
      return false;
    }

    // Test 2: Vegetarian Multimodal Analysis
    console.log('📋 Test 2: Vegetarian Multimodal Menu Analysis');
    console.log('=' .repeat(60));

    const vegetarianPrompt = buildMultimodalPrompt(
      'vegetarian', 
      testImageBase64, 
      'Analyze this menu image for vegetarian-friendly options'
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
      console.log(`✅ Vegetarian Multimodal Analysis Result:`);
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
      
      console.log('✅ Vegetarian multimodal analysis test PASSED\n');
      
    } catch (parseError) {
      console.log('❌ Failed to parse vegetarian multimodal response:', parseError.message);
      console.log('Raw response:', vegetarianResponse);
      return false;
    }

    console.log('🎉 All Gemini Multimodal API tests completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Multimodal test failed with error:', error);
    return false;
  }
}

// Run the test
testMultimodalAnalysis()
  .then((success) => {
    if (success) {
      console.log('\n📊 Multimodal Test Summary: ✅ ALL TESTS PASSED');
      console.log('\n🚀 Multimodal functionality is working correctly!');
      console.log('   - Images can be sent directly to Gemini API');
      console.log('   - No OCR preprocessing required');
      console.log('   - AI can analyze menu images directly');
      process.exit(0);
    } else {
      console.log('\n📊 Multimodal Test Summary: ❌ TESTS FAILED');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('💥 Multimodal test suite failed:', error);
    process.exit(1);
  });