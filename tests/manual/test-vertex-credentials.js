#!/usr/bin/env node

/**
 * Test script to verify Vertex AI credentials are working
 * Run with: node test-vertex-credentials.js
 */

require('dotenv').config({ path: '.env.local' });

const { GoogleAuth } = require('google-auth-library');

async function testVertexCredentials() {
  console.log('🧪 Testing Vertex AI Credentials...\n');

  // Check environment variables
  const projectId = process.env.EXPO_PUBLIC_VERTEX_PROJECT_ID;
  const location = process.env.EXPO_PUBLIC_VERTEX_LOCATION;
  const credentials = process.env.EXPO_PUBLIC_VERTEX_CREDENTIALS;
  const aiProvider = process.env.EXPO_PUBLIC_AI_PROVIDER;

  console.log('📋 Environment Variables:');
  console.log(`  AI Provider: ${aiProvider}`);
  console.log(`  Project ID: ${projectId}`);
  console.log(`  Location: ${location}`);
  console.log(`  Credentials: ${credentials ? '✅ Present' : '❌ Missing'}\n`);

  if (!projectId || !location || !credentials) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  try {
    // Parse credentials
    const credentialsObj = JSON.parse(credentials);
    console.log('✅ Credentials JSON parsed successfully');
    console.log(`  Service Account: ${credentialsObj.client_email}`);
    console.log(`  Project ID (from creds): ${credentialsObj.project_id}\n`);

    // Test authentication
    const auth = new GoogleAuth({
      credentials: credentialsObj,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    console.log('🔐 Testing authentication...');
    const authClient = await auth.getClient();
    const accessToken = await authClient.getAccessToken();
    
    if (accessToken.token) {
      console.log('✅ Authentication successful!');
      console.log(`  Token type: ${accessToken.token.substring(0, 20)}...\n`);
    }

    // Test Vertex AI API endpoint
    console.log('🌐 Testing Vertex AI API endpoint...');
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models`;
    
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Vertex AI API endpoint accessible!');
      console.log(`  Available models: ${data.models ? data.models.length : 'Unknown'}\n`);
    } else {
      console.log(`⚠️  API response status: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log(`  Error: ${errorText}\n`);
    }

    console.log('🎉 Vertex AI credentials test completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Run your Expo app with: npm start');
    console.log('  2. Test the Vertex AI integration in your app');
    console.log('  3. Check the app logs for any authentication issues');

  } catch (error) {
    console.error('❌ Error testing credentials:', error.message);
    
    if (error.message.includes('JSON')) {
      console.error('  💡 Check that EXPO_PUBLIC_VERTEX_CREDENTIALS is valid JSON');
    } else if (error.message.includes('auth') || error.message.includes('token')) {
      console.error('  💡 Check that the service account has proper permissions');
    } else if (error.message.includes('fetch') || error.message.includes('network')) {
      console.error('  💡 Check your internet connection and API endpoint');
    }
    
    process.exit(1);
  }
}

// Run the test
testVertexCredentials().catch(console.error);