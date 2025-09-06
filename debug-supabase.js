/**
 * Debug script to test Supabase connection and identify issues
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function debugSupabase() {
  console.log('🔍 Debugging Supabase Configuration...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`BACKEND_MODE: ${process.env.BACKEND_MODE || 'Not set (will default)'}`);
  console.log(`AI_PROVIDER: ${process.env.AI_PROVIDER || 'Not set (will default)'}\n`);

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.log('❌ Missing required Supabase environment variables');
    return;
  }

  // Check JWT token validity
  console.log('🔑 JWT Token Analysis:');
  const anonKey = process.env.SUPABASE_ANON_KEY;
  console.log(`Token length: ${anonKey.length} characters`);
  
  try {
    // Basic JWT structure check
    const parts = anonKey.split('.');
    console.log(`JWT parts: ${parts.length} (should be 3)`);
    
    if (parts.length === 3) {
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      console.log(`Algorithm: ${header.alg}`);
      console.log(`Token type: ${header.typ}`);
      console.log(`Issuer: ${payload.iss}`);
      console.log(`Role: ${payload.role}`);
      console.log(`Expires: ${new Date(payload.exp * 1000).toISOString()}`);
      console.log(`Project ref: ${payload.ref}`);
    }
  } catch (error) {
    console.log(`❌ JWT parsing error: ${error.message}`);
  }

  console.log('\n🔌 Testing Supabase Connection...');
  
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Test basic connection
    console.log('Testing basic connection...');
    const { data, error } = await supabase.from('_supabase_migrations').select('*').limit(1);
    
    if (error) {
      console.log(`❌ Connection error: ${error.message}`);
    } else {
      console.log('✅ Basic connection successful');
    }

    // Test Edge Function
    console.log('\n🚀 Testing Edge Function...');
    const testPayload = {
      type: 'test_connection',
      requestId: `debug-${Date.now()}`
    };

    const { data: funcData, error: funcError } = await supabase.functions.invoke('ai-menu-analysis', {
      body: testPayload
    });

    if (funcError) {
      console.log(`❌ Edge Function error: ${funcError.message}`);
      console.log(`Error details:`, funcError);
    } else {
      console.log('✅ Edge Function response:', funcData);
    }

  } catch (error) {
    console.log(`❌ Supabase client error: ${error.message}`);
  }

  console.log('\n🔧 Configuration Analysis:');
  
  // Import and test the configuration
  try {
    const { getBackendMode, getSupabaseConfig } = require('./src/services/api/config.ts');
    
    console.log(`Backend mode: ${getBackendMode()}`);
    
    const config = getSupabaseConfig();
    console.log(`Config URL: ${config.url}`);
    console.log(`Config provider: ${config.provider}`);
    console.log(`Config timeout: ${config.timeout}`);
    
  } catch (error) {
    console.log(`❌ Config import error: ${error.message}`);
  }
}

debugSupabase().catch(console.error);