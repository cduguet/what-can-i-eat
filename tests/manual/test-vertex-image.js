require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function main() {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const testImagePath = path.join(__dirname, '../assets/test_menu.jpg');

  if (!supabaseUrl || !anonKey) {
    console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  if (!fs.existsSync(testImagePath)) {
    console.error('Test image not found:', testImagePath);
    process.exit(1);
  }

  const imageBuffer = fs.readFileSync(testImagePath);
  const base64Image = imageBuffer.toString('base64');
  const imageDataUrl = `data:image/jpeg;base64,${base64Image}`;

  // Reproduce app SYSTEM_PROMPT + dietary context + analysis instructions
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

  const dietaryContext = `DIETARY RESTRICTIONS: Strict vegan diet
- NO animal products: meat, poultry, fish, dairy, eggs, honey
- NO animal-derived ingredients: gelatin, casein, whey, etc.
- NO cross-contamination with animal products
- Check cooking methods (shared grills, animal fats)`;

  const requestId = `vertex-image-${Date.now()}`;
  const analysisInstructions = `ANALYSIS INSTRUCTIONS:
1. Analyze each menu item against the dietary restrictions
2. Categorize as "good", "careful", or "avoid"
3. Provide clear explanations for each categorization
4. For "careful" items, suggest specific questions to ask staff
5. Assign confidence scores based on information clarity
6. Include request ID: ${requestId}

Be thorough but concise. Focus on food safety and dietary compliance.`;

  const systemText = [SYSTEM_PROMPT, dietaryContext, analysisInstructions].join('\n\n');

  const requestPayload = {
    type: 'analyze_multimodal',
    provider: 'vertex',
    dietaryPreferences: {
      dietaryType: 'vegan',
      onboardingCompleted: true,
      lastUpdated: new Date().toISOString(),
    },
    // Match app multimodal prompt composition: system text first, then image, then a plain instruction
    contentParts: [
      { type: 'text', data: systemText },
      { type: 'image', data: imageDataUrl },
      { type: 'text', data: 'Analyze the attached menu image for dietary suitability.' },
    ],
    requestId,
  };

  const start = Date.now();
  const res = await fetch(`${supabaseUrl}/functions/v1/ai-menu-analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify(requestPayload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${text}`);
  }

  const data = await res.json();
  const elapsed = Date.now() - start;
  const count = data?.results?.length || 0;
  console.log(`Vertex multimodal response in ${elapsed}ms`);
  console.log(`Items detected: ${count}`);

  if (count > 0) {
    console.log('Sample items:');
    console.log(data.results.slice(0, 5).map(r => ({ name: r.itemName, suitability: r.suitability })));
  }

  if (count < 20) {
    console.warn(`Warning: expected at least 20 items, got ${count}.`);
    process.exitCode = 2;
  } else {
    console.log('Success: >= 20 items detected.');
  }
}

main().catch((e) => {
  console.error('Test failed:', e?.message || e);
  process.exit(1);
});
