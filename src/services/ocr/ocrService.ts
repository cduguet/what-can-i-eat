import * as ImageManipulator from 'expo-image-manipulator';
import {
  OCRResult,
  TextBoundingBox,
  AppError,
  ErrorSeverity,
  ImageProcessingOptions
} from '@/types';

/**
 * @deprecated This OCR service is deprecated in favor of direct multimodal analysis with Gemini API.
 *
 * The new approach sends images directly to Gemini's multimodal API, which provides:
 * - Better accuracy than OCR + text analysis
 * - No intermediate text extraction step
 * - Direct understanding of menu layout and context
 * - Reduced processing time and complexity
 *
 * Use GeminiService.analyzeMenuMultimodal() instead.
 *
 * Legacy OCR service for text recognition from images
 *
 * Features:
 * - Text extraction from menu images
 * - Image preprocessing for better OCR accuracy
 * - Confidence scoring for results
 * - Multi-language support
 * - Text cleaning and formatting
 * - Bounding box detection
 */
export class OCRService {
  private static instance: OCRService;

  /**
   * Get singleton instance of OCRService
   */
  public static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  /**
   * @deprecated Use GeminiService.analyzeMenuMultimodal() instead for better accuracy and performance.
   *
   * Extract text from image using OCR
   * Note: This is a mock implementation. In a real app, you would integrate with:
   * - Google Cloud Vision API
   * - AWS Textract
   * - Azure Computer Vision
   * - Tesseract.js for client-side OCR
   */
  public async extractTextFromImage(
    imageUri: string,
    options: {
      language?: string;
      preprocessImage?: boolean;
      includeConfidence?: boolean;
      includeBoundingBoxes?: boolean;
    } = {}
  ): Promise<OCRResult> {
    const startTime = Date.now();
    
    try {
      const {
        language = 'en',
        preprocessImage = true,
        includeConfidence = true,
        includeBoundingBoxes = false
      } = options;

      // Preprocess image for better OCR accuracy
      let processedImageUri = imageUri;
      if (preprocessImage) {
        processedImageUri = await this.preprocessImageForOCR(imageUri);
      }

      // Mock OCR processing - In real implementation, call actual OCR service
      const mockResult = await this.mockOCRProcessing(
        processedImageUri, 
        language,
        includeConfidence,
        includeBoundingBoxes
      );

      const processingTime = Date.now() - startTime;

      return {
        text: mockResult.text,
        confidence: mockResult.confidence,
        boundingBoxes: mockResult.boundingBoxes,
        processingTime,
        success: true
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('OCR processing failed:', error);
      
      return {
        text: '',
        confidence: 0,
        processingTime,
        success: false,
        error: error instanceof Error ? error.message : 'OCR processing failed'
      };
    }
  }

  /**
   * Preprocess image for better OCR accuracy
   */
  private async preprocessImageForOCR(imageUri: string): Promise<string> {
    try {
      const actions: ImageManipulator.Action[] = [
        // Enhance contrast and brightness for better text recognition
        {
          resize: {
            width: 1920, // Optimal resolution for OCR
            height: 1080
          }
        }
      ];

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        actions,
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return result.uri;
    } catch (error) {
      console.error('Image preprocessing failed:', error);
      // Return original image if preprocessing fails
      return imageUri;
    }
  }

  /**
   * Mock OCR processing for demonstration
   * In a real implementation, this would call an actual OCR service
   */
  private async mockOCRProcessing(
    imageUri: string,
    language: string,
    includeConfidence: boolean,
    includeBoundingBoxes: boolean
  ): Promise<{
    text: string;
    confidence: number;
    boundingBoxes?: TextBoundingBox[];
  }> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock menu text extraction
    const mockMenuTexts = [
      `APPETIZERS
Bruschetta - Fresh tomatoes, basil, garlic on toasted bread - $8.99
Calamari Rings - Crispy fried squid with marinara sauce - $12.99
Caesar Salad - Romaine lettuce, parmesan, croutons, caesar dressing - $9.99

MAIN COURSES
Margherita Pizza - Fresh mozzarella, tomatoes, basil - $16.99
Chicken Parmesan - Breaded chicken breast with marinara and mozzarella - $19.99
Grilled Salmon - Atlantic salmon with lemon herb butter - $22.99
Beef Lasagna - Layers of pasta, meat sauce, and cheese - $18.99

DESSERTS
Tiramisu - Classic Italian dessert with coffee and mascarpone - $7.99
Chocolate Cake - Rich chocolate cake with vanilla ice cream - $6.99`,

      `BREAKFAST MENU
Pancakes - Fluffy buttermilk pancakes with maple syrup - $9.99
Eggs Benedict - Poached eggs on english muffin with hollandaise - $12.99
Avocado Toast - Smashed avocado on sourdough with tomatoes - $10.99
French Toast - Thick cut brioche with cinnamon and vanilla - $11.99

BEVERAGES
Coffee - Freshly brewed dark roast - $3.99
Orange Juice - Fresh squeezed - $4.99
Green Tea - Organic loose leaf - $3.49`,

      `LUNCH SPECIALS
Grilled Chicken Sandwich - With lettuce, tomato, mayo on brioche - $13.99
Fish Tacos - Grilled mahi-mahi with cabbage slaw and lime crema - $15.99
Quinoa Bowl - Mixed greens, roasted vegetables, tahini dressing - $12.99
Turkey Club - Triple decker with bacon, lettuce, tomato - $14.99`
    ];

    const randomText = mockMenuTexts[Math.floor(Math.random() * mockMenuTexts.length)];
    const confidence = 0.85 + Math.random() * 0.1; // 85-95% confidence

    let boundingBoxes: TextBoundingBox[] | undefined;
    
    if (includeBoundingBoxes) {
      // Mock bounding boxes for demonstration
      boundingBoxes = this.generateMockBoundingBoxes(randomText);
    }

    return {
      text: randomText,
      confidence: includeConfidence ? confidence : 1.0,
      boundingBoxes
    };
  }

  /**
   * Generate mock bounding boxes for text
   */
  private generateMockBoundingBoxes(text: string): TextBoundingBox[] {
    const lines = text.split('\n').filter(line => line.trim());
    const boundingBoxes: TextBoundingBox[] = [];
    
    lines.forEach((line, index) => {
      boundingBoxes.push({
        text: line.trim(),
        bounds: {
          x: 50 + Math.random() * 20,
          y: 100 + (index * 40) + Math.random() * 10,
          width: line.length * 8 + Math.random() * 50,
          height: 30 + Math.random() * 10
        },
        confidence: 0.8 + Math.random() * 0.15
      });
    });

    return boundingBoxes;
  }

  /**
   * Clean and format extracted text
   */
  public cleanExtractedText(text: string): string {
    return text
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters that might interfere with analysis
      .replace(/[^\w\s\-$.,()]/g, '')
      // Normalize line breaks
      .replace(/\n\s*\n/g, '\n')
      // Trim whitespace
      .trim();
  }

  /**
   * Extract menu items from OCR text
   */
  public extractMenuItems(ocrText: string): Array<{
    name: string;
    description?: string;
    price?: string;
    category?: string;
  }> {
    const cleanText = this.cleanExtractedText(ocrText);
    const lines = cleanText.split('\n').filter(line => line.trim());
    const menuItems: Array<{
      name: string;
      description?: string;
      price?: string;
      category?: string;
    }> = [];

    let currentCategory = '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) continue;

      // Check if line is a category (all caps, no price)
      if (trimmedLine === trimmedLine.toUpperCase() && !this.containsPrice(trimmedLine)) {
        currentCategory = trimmedLine;
        continue;
      }

      // Extract menu item with price
      const priceMatch = trimmedLine.match(/\$[\d,]+\.?\d*/);
      if (priceMatch) {
        const price = priceMatch[0];
        const nameAndDescription = trimmedLine.replace(price, '').trim();
        
        // Split name and description (usually separated by ' - ')
        const parts = nameAndDescription.split(' - ');
        const name = parts[0].trim();
        const description = parts.slice(1).join(' - ').trim() || undefined;

        menuItems.push({
          name,
          description,
          price,
          category: currentCategory || undefined
        });
      }
    }

    return menuItems;
  }

  /**
   * Check if text contains a price
   */
  private containsPrice(text: string): boolean {
    return /\$[\d,]+\.?\d*/.test(text);
  }

  /**
   * Validate OCR result quality
   */
  public validateOCRQuality(result: OCRResult): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check confidence threshold
    if (result.confidence < 0.7) {
      issues.push('Low confidence score');
      suggestions.push('Try taking the photo in better lighting');
    }

    // Check text length
    if (result.text.length < 50) {
      issues.push('Very little text detected');
      suggestions.push('Make sure the menu is fully visible and in focus');
    }

    // Check for common OCR errors
    if (result.text.includes('|||') || result.text.includes('~~~')) {
      issues.push('Text recognition artifacts detected');
      suggestions.push('Try holding the camera steadier');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }

  /**
   * Create standardized OCR error
   */
  private createOCRError(
    message: string,
    code: string,
    severity: ErrorSeverity,
    originalError?: any
  ): AppError {
    return {
      message,
      code,
      severity,
      timestamp: new Date().toISOString(),
      userMessage: message,
      recoveryActions: [
        {
          label: 'Retry OCR',
          type: 'retry'
        },
        {
          label: 'Take New Photo',
          type: 'reset'
        }
      ]
    };
  }
}

/**
 * Export singleton instance
 */
export const ocrService = OCRService.getInstance();