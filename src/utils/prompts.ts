/**
 * Prompt Engineering Utilities
 * 
 * Constructs intelligent prompts for Gemini API to analyze menu items
 * based on user dietary preferences and restrictions.
 */

import { UserPreferences, MenuItem, DietaryType } from '../types';

/**
 * System prompt that defines the AI's role and response format
 */
const SYSTEM_PROMPT = `You are a dietary analysis expert helping users with food restrictions identify safe menu items.

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
  "requestId": "string",
  "processingTime": 0
}

CATEGORIZATION RULES:
- "good": Items that are clearly safe based on dietary restrictions
- "careful": Items that need staff clarification (unclear ingredients, preparation methods)
- "avoid": Items that clearly violate dietary restrictions

For "careful" items, provide specific questions to ask restaurant staff.
Always include confidence scores and detailed explanations.`;

/**
 * Build dietary context based on user preferences
 */
const buildDietaryContext = (preferences: UserPreferences): string => {
  switch (preferences.dietaryType) {
    case DietaryType.VEGAN:
      return `DIETARY RESTRICTIONS: Strict vegan diet
- NO animal products: meat, poultry, fish, dairy, eggs, honey
- NO animal-derived ingredients: gelatin, casein, whey, etc.
- NO cross-contamination with animal products
- Check cooking methods (shared grills, animal fats)`;

    case DietaryType.VEGETARIAN:
      return `DIETARY RESTRICTIONS: Vegetarian diet
- NO meat, poultry, fish, or seafood
- NO meat-based broths, stocks, or sauces
- Dairy and eggs are acceptable
- Check for hidden meat ingredients (bacon bits, anchovies, etc.)`;

    case DietaryType.CUSTOM:
      return `DIETARY RESTRICTIONS: Custom restrictions
${preferences.customRestrictions || 'No specific restrictions provided'}
- Analyze based on the custom restrictions above
- Be extra cautious with unclear ingredients`;

    default:
      return 'DIETARY RESTRICTIONS: No specific restrictions provided';
  }
};

/**
 * Build menu items context for the prompt
 */
const buildMenuItemsContext = (menuItems: MenuItem[]): string => {
  if (menuItems.length === 0) {
    return 'No menu items provided for analysis.';
  }

  const itemsText = menuItems
    .map((item, index) => {
      const parts = [
        `${index + 1}. ${item.name}`,
        item.description ? `Description: ${item.description}` : '',
        item.ingredients?.length ? `Ingredients: ${item.ingredients.join(', ')}` : '',
        item.category ? `Category: ${item.category}` : '',
        item.price ? `Price: ${item.price}` : '',
      ].filter(Boolean);
      
      return parts.join('\n   ');
    })
    .join('\n\n');

  return `MENU ITEMS TO ANALYZE (${menuItems.length} items):
${itemsText}`;
};

/**
 * Build analysis instructions
 */
const buildAnalysisInstructions = (requestId: string): string => {
  return `ANALYSIS INSTRUCTIONS:
1. Analyze each menu item against the dietary restrictions
2. Categorize as "good", "careful", or "avoid"
3. Provide clear explanations for each categorization
4. For "careful" items, suggest specific questions to ask staff
5. Assign confidence scores based on information clarity
6. Include request ID: ${requestId}

Be thorough but concise. Focus on food safety and dietary compliance.`;
};

/**
 * Construct complete prompt for menu analysis
 * 
 * @param preferences - User's dietary preferences
 * @param menuItems - Menu items to analyze
 * @param requestId - Unique request identifier
 * @param context - Additional context or instructions
 * @returns Complete prompt for Gemini API
 */
export const buildMenuAnalysisPrompt = (
  preferences: UserPreferences,
  menuItems: MenuItem[],
  requestId: string,
  context?: string
): string => {
  const sections = [
    SYSTEM_PROMPT,
    buildDietaryContext(preferences),
    buildMenuItemsContext(menuItems),
    buildAnalysisInstructions(requestId),
  ];

  if (context) {
    sections.push(`ADDITIONAL CONTEXT: ${context}`);
  }

  return sections.join('\n\n');
};

/**
 * Build a simplified prompt for testing API connectivity
 * 
 * @param requestId - Unique request identifier
 * @returns Simple test prompt
 */
export const buildTestPrompt = (requestId: string): string => {
  return `${SYSTEM_PROMPT}

DIETARY RESTRICTIONS: Vegan diet - no animal products

MENU ITEMS TO ANALYZE (1 item):
1. Garden Salad
   Description: Fresh mixed greens with tomatoes and cucumbers

ANALYSIS INSTRUCTIONS:
1. Analyze the garden salad for vegan compatibility
2. Respond with the required JSON format
3. Include request ID: ${requestId}

This is a test request to verify API connectivity.`;
};

/**
 * Extract and validate response format from the Gemini API.
 * This function is designed to be robust and handle cases where the API
 * might return the JSON object wrapped in markdown or other text.
 *
 * @param response - Raw API response text
 * @returns Parsed and validated response object
 */
export const parseAPIResponse = (response: string): any => {
  try {
    // Find the start and end of the JSON object
    const jsonStart = response.indexOf('{');
    const jsonEnd = response.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No JSON object found in the response.');
    }

    const jsonString = response.substring(jsonStart, jsonEnd + 1);
    
    const parsed = JSON.parse(jsonString);
    
    // Basic validation to ensure the parsed object has the expected structure
    if (typeof parsed.success !== 'boolean' || !Array.isArray(parsed.results)) {
      throw new Error('Invalid response format: missing required fields (success, results).');
    }

    return parsed;
  } catch (error) {
    console.error("Raw response that failed parsing:", response);
    throw new Error(`Failed to parse API response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Build multimodal prompt for menu analysis with images</search>
</search_and_replace>
 *
 * @param preferences - User's dietary preferences
 * @param contentParts - Array of content parts (text and images)
 * @param requestId - Unique request identifier
 * @param context - Additional context or instructions
 * @returns Complete prompt for Gemini API
 */
export const buildMultimodalPrompt = (
  preferences: UserPreferences,
  contentParts: Array<{ type: 'text' | 'image'; data: string }>,
  requestId: string,
  context?: string
): Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> => {
  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

  // Add system prompt as text
  parts.push({
    text: `${SYSTEM_PROMPT}

${buildDietaryContext(preferences)}

${buildAnalysisInstructions(requestId)}`
  });

  // Add all content parts (text and images)
  for (const part of contentParts) {
    if (part.type === 'text') {
      parts.push({
        text: part.data
      });
    } else if (part.type === 'image') {
      // Extract MIME type from data URL
      const matches = part.data.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        parts.push({
          inlineData: {
            mimeType: matches[1],
            data: matches[2]
          }
        });
      }
    }
  }

  // Add additional context if provided
  if (context) {
    parts.push({
      text: `ADDITIONAL CONTEXT: ${context}`
    });
  }

  return parts;
};