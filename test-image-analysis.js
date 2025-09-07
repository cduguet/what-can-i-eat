require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_IMAGE_PATH = 'tests/assets/test_menu.jpg';

async function testImageAnalysis() {
  console.log('🖼️  IMAGE-BASED MENU ANALYSIS TEST');
  console.log('=====================================');
  console.log(`Testing with image: ${TEST_IMAGE_PATH}`);
  console.log('No text-based menu items - pure image analysis');
  console.log('');

  // Check if test image exists
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    console.log('❌ Test image not found:', TEST_IMAGE_PATH);
    return;
  }

  // Load and encode image
  const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
  const imageBase64 = imageBuffer.toString('base64');
  const imageMimeType = 'image/jpeg';
  const imageDataUrl = `data:${imageMimeType};base64,${imageBase64}`;
  
  console.log(`📸 Image loaded: ${Math.round(imageBuffer.length / 1024)}KB`);
  console.log('');

  // Test dietary preferences
  const dietaryPreferences = {
    dietaryType: 'vegetarian',
    customRestrictions: ['No gluten', 'No dairy']
  };

  // Test both Gemini and Vertex AI with Supabase backend
  const providers = ['gemini', 'vertex'];
  const results = [];

  for (const provider of providers) {
    console.log(`🔗 Testing ${provider.toUpperCase()} Supabase Image Analysis`);
    console.log('='.repeat(60));
    
    try {
      const requestPayload = {
        type: 'analyze_multimodal',
        provider: provider,
        dietaryPreferences: dietaryPreferences,
        contentParts: [
          {
            type: 'image',
            data: imageDataUrl
          }
        ],
        requestId: `image-test-${provider}-${Date.now()}`
      };

      console.log('📤 Sending multimodal request to Supabase...');
      console.log(`   Provider: ${provider}`);
      console.log(`   Type: analyze_multimodal`);
      console.log(`   Image size: ${Math.round(imageBuffer.length / 1024)}KB`);
      console.log(`   Request ID: ${requestPayload.requestId}`);

      const startTime = Date.now();
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/ai-menu-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(requestPayload)
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ ${provider.toUpperCase()} Supabase failed: ${response.status} - ${errorText}`);
        results.push({
          provider: provider,
          success: false,
          error: `${response.status} - ${errorText}`,
          responseTime: responseTime
        });
        continue;
      }

      const data = await response.json();
      
      console.log(`✅ Supabase ${provider.toUpperCase()} Response:`);
      console.log(`   Success: ${data.success}`);
      console.log(`   Items analyzed: ${data.results ? data.results.length : 0}`);
      console.log(`   Processing time: ${responseTime}ms`);
      console.log(`   Confidence: ${data.confidence || 'N/A'}`);
      console.log(`   Request ID: ${data.requestId || 'N/A'}`);
      
      if (data.results && data.results.length > 0) {
        console.log(`   Sample result: ${data.results[0].itemName} - ${data.results[0].suitability}`);
        console.log('');
        console.log('📋 All detected items:');
        data.results.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.itemName} - ${item.suitability} (${item.explanation})`);
        });
      } else {
        console.log('   ⚠️  No menu items detected from image');
      }

      results.push({
        provider: provider,
        success: data.success,
        itemsFound: data.results ? data.results.length : 0,
        confidence: data.confidence || 0,
        responseTime: responseTime,
        requestId: data.requestId,
        results: data.results || []
      });

    } catch (error) {
      console.log(`❌ ${provider.toUpperCase()} Supabase error: ${error.message}`);
      results.push({
        provider: provider,
        success: false,
        error: error.message,
        responseTime: 0
      });
    }
    
    console.log('');
  }

  // Summary
  console.log('📊 IMAGE ANALYSIS TEST SUMMARY');
  console.log('==============================');
  
  const successfulTests = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  console.log(`✅ Successful tests: ${successfulTests}/${totalTests}`);
  console.log(`❌ Failed tests: ${totalTests - successfulTests}/${totalTests}`);
  console.log('');

  if (successfulTests > 0) {
    console.log('🏆 Performance Summary:');
    results.forEach(result => {
      if (result.success) {
        console.log(`  ${result.provider.toUpperCase()} Supabase: ${result.responseTime}ms (${result.itemsFound} items, confidence: ${result.confidence})`);
      }
    });
    console.log('');
  }

  // Check if items were actually detected
  const totalItemsDetected = results.reduce((sum, r) => sum + (r.itemsFound || 0), 0);
  
  if (totalItemsDetected === 0) {
    console.log('⚠️  WARNING: No menu items were detected from the image!');
    console.log('   This could indicate:');
    console.log('   - Image quality issues');
    console.log('   - AI model limitations');
    console.log('   - Prompt configuration problems');
  } else {
    console.log(`🎯 SUCCESS: ${totalItemsDetected} total menu items detected across all providers`);
  }

  console.log('');
  console.log(`💾 Test completed with image: ${TEST_IMAGE_PATH}`);
  
  // Save results
  const resultsFile = 'image-analysis-test-results.json';
  fs.writeFileSync(resultsFile, JSON.stringify({
    testImage: TEST_IMAGE_PATH,
    imageSizeKB: Math.round(imageBuffer.length / 1024),
    dietaryPreferences: dietaryPreferences,
    timestamp: new Date().toISOString(),
    results: results,
    summary: {
      successfulTests: successfulTests,
      totalTests: totalTests,
      totalItemsDetected: totalItemsDetected
    }
  }, null, 2));
  
  console.log(`💾 Results saved to: ${resultsFile}`);
}

// Run the test
testImageAnalysis().catch(console.error);