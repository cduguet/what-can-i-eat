# Supabase Backend Setup Guide

This guide explains how to set up and configure the Supabase backend for the "What Can I Eat" application.

## Overview

The application supports two backend modes:
- **Local Mode**: Direct API calls to AI providers (Gemini/Vertex AI)
- **Supabase Mode**: AI processing through Supabase Edge Functions

## Supabase Edge Function

### Function Details
- **Name**: `ai-menu-analysis`
- **Purpose**: Handles AI menu analysis requests using Gemini or Vertex AI
- **Features**:
  - Text-only menu analysis
  - Multimodal analysis (text + images)
  - Connection testing
  - Rate limiting (100 requests/minute per client)
  - Provider switching (Gemini/Vertex AI)

### Function Endpoints

The Edge Function accepts POST requests with the following payload:

```typescript
interface AIRequest {
  type: 'analyze' | 'analyze_multimodal' | 'test_connection';
  dietaryPreferences?: UserPreferences;
  menuItems?: MenuItem[];
  contentParts?: MultimodalContentPart[];
  context?: string;
  requestId: string;
  provider?: 'gemini' | 'vertex';
}
```

## Environment Variables Setup

### Required Supabase Environment Variables

The Edge Function requires these environment variables to be set in Supabase:

1. **GEMINI_API_KEY** (required when using Gemini provider)
   - Your Google Gemini API key
   - Get from: https://makersuite.google.com/app/apikey

2. **VERTEX_PROJECT_ID** (required when using Vertex AI provider)
   - Your Google Cloud project ID
   - Example: `gen-lang-client-0473924583`

3. **VERTEX_LOCATION** (required when using Vertex AI provider)
   - Google Cloud region for Vertex AI
   - Example: `europe-west1`

4. **VERTEX_CREDENTIALS** (required when using Vertex AI provider)
   - Service account credentials as JSON string
   - Get from Google Cloud Console > IAM & Admin > Service Accounts

5. **AI_PROVIDER** (optional)
   - Default AI provider: `gemini` or `vertex`
   - Defaults to `gemini` if not set

### Setting Environment Variables in Supabase

**Option 1: Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to Settings > Edge Functions
3. Add environment variables in the "Environment Variables" section

**Option 2: Supabase CLI**
```bash
# Set individual variables
supabase secrets set GEMINI_API_KEY=your_api_key_here
supabase secrets set VERTEX_PROJECT_ID=your_project_id
supabase secrets set VERTEX_LOCATION=europe-west1
supabase secrets set VERTEX_CREDENTIALS='{"type":"service_account",...}'
supabase secrets set AI_PROVIDER=gemini
```

## Client Configuration

### Environment Variables for Client

Set these in your `.env` file:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://nbworpqbjrkkfitmoggk.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Backend Mode Selection
EXPO_PUBLIC_BACKEND_MODE=supabase  # or 'local'

# AI Provider Selection (used by Supabase function)
EXPO_PUBLIC_AI_PROVIDER=gemini  # or 'vertex'

# Optional: Request timeout
EXPO_PUBLIC_API_TIMEOUT=30000
```

### Backend Mode Switching

The application automatically detects the backend mode from `EXPO_PUBLIC_BACKEND_MODE`:

- `supabase`: Uses Supabase Edge Functions
- `local`: Uses direct AI API calls (default)

## Usage Examples

### Using Supabase AI Service Directly

```typescript
import { SupabaseAIService } from './services/api/supabaseAIService';

const service = new SupabaseAIService({
  url: 'https://nbworpqbjrkkfitmoggk.supabase.co',
  anonKey: 'your_anon_key',
  provider: AIProvider.GEMINI
});

// Analyze menu
const result = await service.analyzeMenu({
  dietaryPreferences: userPreferences,
  menuItems: menuItems,
  requestId: 'unique-request-id'
});
```

### Using Main AI Service (Auto-detects Backend)

```typescript
import { aiService } from './services/api/aiService';

// Automatically uses Supabase or local based on EXPO_PUBLIC_BACKEND_MODE
const result = await aiService.analyzeMenu({
  dietaryPreferences: userPreferences,
  menuItems: menuItems,
  requestId: 'unique-request-id'
});
```

## Testing

### Test Connection

```typescript
const result = await aiService.testConnection();
console.log(result.success); // true if working
console.log(result.message); // Status message
console.log(result.latency); // Response time in ms
```

### Running Tests

```bash
# Run Supabase AI service tests
npm test -- src/services/api/__tests__/supabaseAIService.test.ts

# Run all AI service tests
npm test -- src/services/api/__tests__/
```

## Security Considerations

1. **Environment Variables**: Never commit API keys or credentials to version control
2. **Rate Limiting**: The Edge Function includes basic rate limiting (100 req/min per client)
3. **Authentication**: Uses Supabase anonymous key for public access
4. **CORS**: Configured to allow requests from any origin (adjust for production)

## Troubleshooting

### Common Issues

1. **"Function error" responses**
   - Check that environment variables are set in Supabase
   - Verify API keys are valid and have proper permissions

2. **Timeout errors**
   - Increase `EXPO_PUBLIC_API_TIMEOUT` value
   - Check network connectivity

3. **Rate limit exceeded**
   - Wait 1 minute before retrying
   - Consider implementing client-side rate limiting

4. **Invalid response format**
   - Check that AI provider is responding correctly
   - Verify prompt formatting in Edge Function

### Debugging

Enable debug logging by checking the Supabase Edge Function logs:

1. Go to Supabase Dashboard > Edge Functions
2. Select the `ai-menu-analysis` function
3. View logs for error details

## Migration from Local to Supabase

To migrate from local AI processing to Supabase:

1. Set up environment variables in Supabase (see above)
2. Update your `.env` file:
   ```bash
   EXPO_PUBLIC_BACKEND_MODE=supabase
   ```
3. Test the connection:
   ```typescript
   const result = await aiService.testConnection();
   ```
4. No code changes required - the AI service automatically switches backends

## Performance Considerations

- **Cold Starts**: Edge Functions may have cold start delays (~1-2 seconds)
- **Concurrent Requests**: Supabase handles scaling automatically
- **Response Times**: Expect 2-5 seconds for typical menu analysis
- **Rate Limits**: Built-in rate limiting prevents abuse

## Cost Implications

- **Supabase**: Edge Function invocations are billed per request
- **AI APIs**: Same costs as direct usage (Gemini/Vertex AI pricing)
- **Data Transfer**: Minimal impact for text-based requests
- **Storage**: No additional storage costs for this implementation