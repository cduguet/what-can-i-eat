/**
 * Vertex AI Service
 * 
 * Core service for communicating with Google's Vertex AI API.
 * Handles authentication, request formatting, error handling, and retries.
 * Maintains the same interface as GeminiService for compatibility.
 */

import { VertexAI } from '@google-cloud/vertexai';
import { VertexAPIConfig, GeminiRequest, GeminiResponse, MultimodalGeminiRequest, MultimodalContentPart, ContentType, ImageData, AppError, ErrorSeverity } from '../../types';
import { buildMenuAnalysisPrompt, buildMultimodalPrompt, parseAPIResponse } from '../../utils/prompts';

/**
 * Vertex AI service class
 */
export class VertexService {
  private config: VertexAPIConfig;
  private vertexAI: VertexAI;

  constructor(config: VertexAPIConfig) {
    this.config = config;
    
    if (!this.validateConfig(config)) {
      throw new Error('Invalid Vertex AI configuration');
    }

    // Initialize Vertex AI with credentials
    const initOptions: any = {
      project: this.config.projectId,
      location: this.config.location,
    };

    // Add credentials if provided
    if (this.config.credentials) {
      try {
        // Try to parse as JSON first (service account key)
        const credentials = JSON.parse(this.config.credentials);
        initOptions.googleAuthOptions = { credentials };
      } catch {
        // If not JSON, treat as file path
        initOptions.googleAuthOptions = { keyFilename: this.config.credentials };
      }
    }

    this.vertexAI = new VertexAI(initOptions);

    console.log('Vertex AI service initialized:', this.getSanitizedConfig());
  }

  /**
   * Analyze menu items using Vertex AI
   * 
   * @param request - Structured request with menu items and preferences
   * @returns Promise resolving to analysis results
   */
  async analyzeMenu(request: GeminiRequest): Promise<GeminiResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`Starting menu analysis for request ${request.requestId}`);
      
      // Build the analysis prompt
      const prompt = buildMenuAnalysisPrompt(
        request.dietaryPreferences,
        request.menuItems,
        request.requestId,
        request.context
      );

      // Make API request with retries
      const response = await this.makeRequestWithRetry(prompt);
      
      // Parse and validate response
      const parsedResponse = parseAPIResponse(response);
      
      // Build final response
      const result: GeminiResponse = {
        success: true,
        results: parsedResponse.results || [],
        confidence: parsedResponse.confidence || 0.8,
        message: parsedResponse.message,
        requestId: request.requestId,
        processingTime: Date.now() - startTime,
      };

      console.log(`Menu analysis completed for request ${request.requestId} in ${result.processingTime}ms`);
      return result;

    } catch (error) {
      console.error(`Menu analysis failed for request ${request.requestId}:`, error);
      
      return {
        success: false,
        results: [],
        confidence: 0,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        requestId: request.requestId,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Make API request with retry logic
   * 
   * @param prompt - The prompt to send to Vertex AI
   * @returns Promise resolving to response text
   */
  private async makeRequestWithRetry(prompt: string): Promise<string> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(`API request attempt ${attempt}/${this.config.maxRetries}`);
        
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        
        try {
          const model = this.vertexAI.preview.getGenerativeModel({
            model: 'gemini-1.5-flash-001',
          });
          
          const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              topK: 1,
              topP: 0.8,
              maxOutputTokens: 4096,
            },
          });
          
          clearTimeout(timeoutId);
          
          // Get the response text
          const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (!text) {
            throw new Error('Empty response from Vertex AI');
          }
          
          return text;
          
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`API request attempt ${attempt} failed:`, lastError.message);
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(lastError)) {
          break;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < this.config.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Check if error should not be retried
   * 
   * @param error - Error to check
   * @returns True if error should not be retried
   */
  private isNonRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    
    // Don't retry on authentication errors
    if (message.includes('authentication') || message.includes('unauthorized') || message.includes('forbidden')) {
      return true;
    }
    
    // Don't retry on quota exceeded errors
    if (message.includes('quota') || message.includes('rate limit')) {
      return true;
    }
    
    // Don't retry on invalid request format
    if (message.includes('invalid') && message.includes('request')) {
      return true;
    }
    
    return false;
  }

  /**
   * Test API connectivity with a simple request
   * 
   * @returns Promise resolving to test result
   */
  async testConnection(): Promise<{ success: boolean; message: string; latency?: number }> {
    const startTime = Date.now();
    
    try {
      const model = this.vertexAI.preview.getGenerativeModel({
        model: 'gemini-1.5-flash-001',
      });
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Respond with "API connection successful"' }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 100,
        },
      });
      
      const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
      
      const latency = Date.now() - startTime;
      
      if (text && text.toLowerCase().includes('successful')) {
        return {
          success: true,
          message: 'API connection test passed',
          latency,
        };
      } else {
        return {
          success: false,
          message: 'API responded but with unexpected content',
          latency,
        };
      }
      
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error during connection test',
      };
    }
  }

  /**
   * Analyze menu items using Vertex AI with multimodal input (text + images)
   *
   * @param request - Multimodal request with content parts (text and images)
   * @returns Promise resolving to analysis results
   */
  async analyzeMenuMultimodal(request: MultimodalGeminiRequest): Promise<GeminiResponse> {
    const startTime = Date.now();

    try {
      console.log(`Starting multimodal menu analysis for request ${request.requestId}`);

      // Build multimodal prompt with images and text
      const multimodalPrompt = buildMultimodalPrompt(
        request.dietaryPreferences,
        request.contentParts,
        request.requestId,
        request.context
      );

      // Make API request with retry logic for multimodal content
      const response = await this.makeMultimodalRequestWithRetry(multimodalPrompt);

      // Parse and validate response
      const parsedResponse = parseAPIResponse(response);

      // Build final response
      const result: GeminiResponse = {
        success: true,
        results: parsedResponse.results || [],
        confidence: parsedResponse.confidence || 0.8,
        message: parsedResponse.message,
        requestId: request.requestId,
        processingTime: Date.now() - startTime,
      };

      console.log(`Multimodal menu analysis completed for request ${request.requestId} in ${result.processingTime}ms`);
      return result;

    } catch (error) {
      console.error(`Multimodal menu analysis failed for request ${request.requestId}:`, error);

      return {
        success: false,
        results: [],
        confidence: 0,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        requestId: request.requestId,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Make multimodal API request with retry logic
   *
   * @param multimodalPrompt - Array of content parts (text and images)
   * @returns Promise resolving to response text
   */
  private async makeMultimodalRequestWithRetry(
    multimodalPrompt: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>
  ): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(`Multimodal API request attempt ${attempt}/${this.config.maxRetries}`);

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        try {
          const model = this.vertexAI.preview.getGenerativeModel({
            model: 'gemini-1.5-flash-001',
          });

          // Convert multimodal prompt to Vertex AI format
          const parts = multimodalPrompt.map(part => {
            if (part.text) {
              return { text: part.text };
            } else if (part.inlineData) {
              return {
                inlineData: {
                  mimeType: part.inlineData.mimeType,
                  data: part.inlineData.data,
                },
              };
            }
            return { text: '' };
          });

          const result = await model.generateContent({
            contents: [{ role: 'user', parts }],
            generationConfig: {
              temperature: 0.1,
              topK: 1,
              topP: 0.8,
              maxOutputTokens: 4096,
            },
          });

          clearTimeout(timeoutId);

          // Get the response text
          const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

          if (!text) {
            throw new Error('Empty response from Vertex AI');
          }

          return text;

        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`Multimodal API request attempt ${attempt} failed:`, lastError.message);

        // Don't retry on certain errors
        if (this.isNonRetryableError(lastError)) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.config.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Validate Vertex AI configuration
   * 
   * @param config - Configuration to validate
   * @returns True if configuration is valid
   */
  private validateConfig(config: VertexAPIConfig): boolean {
    return !!(
      config.projectId &&
      config.location &&
      config.timeout > 0 &&
      config.maxRetries >= 0
    );
  }

  /**
   * Get sanitized configuration for logging (without credentials)
   * 
   * @returns Configuration safe for logging
   */
  private getSanitizedConfig() {
    return {
      projectId: this.config.projectId,
      location: this.config.location,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
      credentialsPresent: !!this.config.credentials,
    };
  }
}