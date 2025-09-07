/**
 * Comprehensive TypeScript type definitions for the "What Can I Eat" application
 * 
 * This file contains all type definitions organized by domain:
 * - Core Enums and Constants
 * - User Preferences & Dietary Restrictions
 * - Menu Analysis & Input Processing
 * - API Communication (Gemini)
 * - UI State Management
 * - Camera & Media Handling
 * - Results Display & Categorization
 * - Storage & Persistence
 * - Error Handling
 * - Accessibility
 * - Utility Types
 */

// =============================================================================
// CORE ENUMS AND CONSTANTS
// =============================================================================

/**
 * Dietary restriction types supported by the application
 */
export enum DietaryType {
  VEGAN = 'vegan',
  VEGETARIAN = 'vegetarian',
  CUSTOM = 'custom'
}

/**
 * Food suitability categories for analysis results
 */
export enum FoodSuitability {
  GOOD = 'good',
  CAREFUL = 'careful',
  AVOID = 'avoid'
}

/**
 * Menu input source types
 */
export enum MenuInputType {
  TEXT = 'text',
  URL = 'url',
  IMAGE = 'image'
}

/**
 * Camera permission states
 */
export enum CameraPermissionStatus {
  UNDETERMINED = 'undetermined',
  GRANTED = 'granted',
  DENIED = 'denied'
}

/**
 * Network request states
 */
export enum NetworkState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// =============================================================================
// NAVIGATION TYPES
// =============================================================================

/**
 * Root navigation stack parameter list
 */
export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  Camera: undefined;
  Results: {
    imageUri?: string;
    menuText?: string;
    menuUrl?: string;
    analysis?: GeminiResponse;
  };
  Settings: { section?: 'dietary' } | undefined;
  RecentActivity: undefined;
};

// =============================================================================
// USER PREFERENCES & DIETARY RESTRICTIONS
// =============================================================================

/**
 * User dietary preferences configuration
 */
export interface UserPreferences {
  /** Selected dietary type */
  dietaryType: DietaryType;
  /** Custom dietary restrictions text (used when dietaryType is CUSTOM) */
  customRestrictions?: string;
  /** User's name for personalization */
  userName?: string;
  /** When preferences were last updated */
  lastUpdated: string;
  /** Whether onboarding has been completed */
  onboardingCompleted: boolean;
}

/**
 * User profile information
 */
export interface UserProfile {
  /** Unique user identifier */
  id: string;
  /** User preferences */
  preferences: UserPreferences;
  /** App usage statistics */
  stats: UserStats;
  /** User settings */
  settings: UserSettings;
}

/**
 * User app usage statistics
 */
export interface UserStats {
  /** Total number of menu analyses performed */
  totalAnalyses: number;
  /** Number of photos taken */
  photosTaken: number;
  /** Date of first app use */
  firstUse: string;
  /** Date of last app use */
  lastUse: string;
}

/**
 * User application settings
 */
export interface UserSettings {
  /** Enable haptic feedback */
  hapticFeedback: boolean;
  /** Enable push notifications */
  notifications: boolean;
  /** High contrast mode for accessibility */
  highContrast: boolean;
  /** Text size preference */
  textSize: 'small' | 'medium' | 'large';
  /** Preferred language */
  language: string;
}

// =============================================================================
// MENU ANALYSIS & INPUT PROCESSING
// =============================================================================

/**
 * Menu input data structure
 */
export interface MenuInput {
  /** Type of input source */
  type: MenuInputType;
  /** Raw input data */
  data: string;
  /** Timestamp when input was created */
  timestamp: string;
  /** Optional metadata */
  metadata?: MenuInputMetadata;
}

/**
 * Metadata for menu input
 */
export interface MenuInputMetadata {
  /** Source URL if applicable */
  sourceUrl?: string;
  /** Image dimensions if applicable */
  imageDimensions?: {
    width: number;
    height: number;
  };
  /** File size in bytes if applicable */
  fileSize?: number;
  /** MIME type if applicable */
  mimeType?: string;
}

/**
 * OCR processing result
 */
export interface OCRResult {
  /** Extracted text from image */
  text: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Text bounding boxes */
  boundingBoxes?: TextBoundingBox[];
  /** Processing time in milliseconds */
  processingTime: number;
  /** Whether OCR was successful */
  success: boolean;
  /** Error message if OCR failed */
  error?: string;
}

/**
 * Text bounding box for OCR results
 */
export interface TextBoundingBox {
  /** Detected text */
  text: string;
  /** Bounding box coordinates */
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Confidence score for this text block */
  confidence: number;
}

/**
 * Individual menu item structure
 */
export interface MenuItem {
  /** Unique identifier */
  id: string;
  /** Item name */
  name: string;
  /** Item description */
  description?: string;
  /** Price if available */
  price?: string;
  /** Category (appetizer, main, dessert, etc.) */
  category?: string;
  /** Detected ingredients */
  ingredients?: string[];
  /** Raw text from menu */
  rawText: string;
}

/**
 * Processed menu structure
 */
export interface ProcessedMenu {
  /** List of menu items */
  items: MenuItem[];
  /** Restaurant name if detected */
  restaurantName?: string;
  /** Menu categories found */
  categories: string[];
  /** Processing metadata */
  metadata: {
    /** Total items found */
    totalItems: number;
    /** Processing timestamp */
    processedAt: string;
    /** Source of menu data */
    source: MenuInputType;
  };
}

// =============================================================================
// API COMMUNICATION (GEMINI)
// =============================================================================

/**
 * Gemini API configuration
 */
export interface GeminiAPIConfig {
  /** API key for authentication */
  apiKey: string;
  /** API endpoint URL */
  endpoint: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Maximum retry attempts */
  maxRetries: number;
}

/**
 * Vertex AI configuration
 */
export interface VertexAPIConfig {
  /** Google Cloud project ID */
  projectId: string;
  /** Google Cloud location/region */
  location: string;
  /** Service account credentials (JSON string or file path) */
  credentials?: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Maximum retry attempts */
  maxRetries: number;
}

/**
 * AI Provider types
 */
export enum AIProvider {
  GEMINI = 'gemini',
  VERTEX = 'vertex'
}

/**
 * Combined AI configuration
 */
export interface AIConfig {
  /** AI provider to use */
  provider: AIProvider;
  /** Gemini configuration (when provider is GEMINI) */
  gemini?: GeminiAPIConfig;
  /** Vertex configuration (when provider is VERTEX) */
  vertex?: VertexAPIConfig;
}

/**
 * AI API request structure
 */
export interface AIAnalysisRequest {
  /** User's dietary preferences */
  dietaryPreferences: UserPreferences;
  /** Menu items to analyze */
  menuItems: MenuItem[];
  /** Additional context or instructions */
  context?: string;
  /** Request ID for tracking */
  requestId: string;
}

/**
 * Gemini API response structure
 */
export interface GeminiResponse {
  /** Whether the request was successful */
  success: boolean;
  /** Analysis results for each menu item */
  results: FoodAnalysisResult[];
  /** Overall confidence score */
  confidence: number;
  /** Response message */
  message?: string;
  /** Request ID that was processed */
  requestId: string;
  /** Processing time in milliseconds */
  processingTime: number;
}

/**
 * Individual food analysis result
 */
export interface FoodAnalysisResult {
  /** Menu item ID */
  itemId: string;
  /** Item name */
  itemName: string;
  /** Suitability category */
  suitability: FoodSuitability;
  /** Explanation for the categorization */
  explanation: string;
  /** Specific questions to ask staff (for CAREFUL items) */
  questionsToAsk?: string[];
  /** Confidence score for this analysis */
  confidence: number;
  /** Detected allergens or concerns */
  concerns?: string[];
}

/**
 * API error response structure
 */
export interface APIErrorResponse {
  /** Error occurred */
  success: false;
  /** Error code */
  errorCode: string;
  /** Human-readable error message */
  message: string;
  /** Detailed error information */
  details?: string;
  /** Request ID that failed */
  requestId?: string;
  /** Timestamp of error */
  timestamp: string;
}

// =============================================================================
// UI STATE MANAGEMENT
// =============================================================================

/**
 * Generic loading state interface
 */
export interface LoadingState {
  /** Whether currently loading */
  isLoading: boolean;
  /** Loading progress (0-100) */
  progress?: number;
  /** Loading message to display */
  message?: string;
  /** Whether operation can be cancelled */
  cancellable?: boolean;
}

/**
 * Form validation state
 */
export interface FormValidationState {
  /** Whether form is valid */
  isValid: boolean;
  /** Field-specific errors */
  fieldErrors: Record<string, string>;
  /** General form errors */
  generalErrors: string[];
  /** Whether form has been touched */
  touched: boolean;
}

/**
 * Onboarding screen state
 */
export interface OnboardingState {
  /** Current onboarding step */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** User preferences being configured */
  preferences: Partial<UserPreferences>;
  /** Form validation state */
  validation: FormValidationState;
  /** Loading state */
  loading: LoadingState;
}

/**
 * Camera screen state
 */
export interface CameraState {
  /** Camera permission status */
  permissionStatus: CameraPermissionStatus;
  /** Whether camera is ready */
  cameraReady: boolean;
  /** Whether currently taking photo */
  takingPhoto: boolean;
  /** Last captured image */
  lastImage?: CameraResult;
  /** OCR processing state */
  ocrProcessing: LoadingState;
  /** Any camera errors */
  error?: AppError;
}

/**
 * Results screen state
 */
export interface ResultsState {
  /** Analysis results */
  results: FoodAnalysisResult[];
  /** Current filter settings */
  filters: ResultsFilter;
  /** Loading state for analysis */
  loading: LoadingState;
  /** Any errors during analysis */
  error?: AppError;
  /** Whether results can be shared */
  shareable: boolean;
}

/**
 * Settings screen state
 */
export interface SettingsState {
  /** Current user preferences */
  preferences: UserPreferences;
  /** Current user settings */
  settings: UserSettings;
  /** Whether settings are being saved */
  saving: LoadingState;
  /** Form validation state */
  validation: FormValidationState;
  /** Whether data export is available */
  exportAvailable: boolean;
}

// =============================================================================
// CAMERA & MEDIA HANDLING
// =============================================================================

/**
 * Camera capture result
 */
export interface CameraResult {
  /** Image URI */
  uri: string;
  /** Image width */
  width: number;
  /** Image height */
  height: number;
  /** Image type */
  type: 'image';
  /** File size in bytes */
  fileSize?: number;
  /** When photo was taken */
  timestamp: string;
}

/**
 * Camera permission request result
 */
export interface CameraPermissionResult {
  /** Permission status */
  status: CameraPermissionStatus;
  /** Whether user can ask again */
  canAskAgain: boolean;
  /** Expiration time for permission */
  expires?: string;
}

/**
 * Media library access result
 */
export interface MediaLibraryResult {
  /** Selected image URI */
  uri: string;
  /** Image metadata */
  metadata: {
    width: number;
    height: number;
    fileSize: number;
    mimeType: string;
  };
  /** Whether selection was cancelled */
  cancelled: boolean;
}

/**
 * Image processing options
 */
export interface ImageProcessingOptions {
  /** Maximum width for resizing */
  maxWidth?: number;
  /** Maximum height for resizing */
  maxHeight?: number;
  /** Image quality (0-1) */
  quality?: number;
  /** Whether to compress image */
  compress?: boolean;
  /** Output format */
  format?: 'jpeg' | 'png';
}

// =============================================================================
// RESULTS DISPLAY & CATEGORIZATION
// =============================================================================

/**
 * Results filter configuration
 */
export interface ResultsFilter {
  /** Show items by suitability */
  suitability: FoodSuitability[];
  /** Search text filter */
  searchText?: string;
  /** Category filter */
  categories?: string[];
  /** Sort order */
  sortBy: 'name' | 'suitability' | 'confidence';
  /** Sort direction */
  sortDirection: 'asc' | 'desc';
}

/**
 * Categorized results for display
 */
export interface CategorizedResults {
  /** Items safe to eat */
  good: FoodAnalysisResult[];
  /** Items requiring clarification */
  careful: FoodAnalysisResult[];
  /** Items to avoid */
  avoid: FoodAnalysisResult[];
  /** Total number of items */
  totalItems: number;
  /** Filter applied */
  appliedFilter: ResultsFilter;
}

/**
 * Result card display data
 */
export interface ResultCardData {
  /** Analysis result */
  result: FoodAnalysisResult;
  /** Whether card is expanded */
  expanded: boolean;
  /** Card background color based on suitability */
  backgroundColor: string;
  /** Icon to display */
  icon: string;
  /** Whether to show detailed explanation */
  showDetails: boolean;
}

/**
 * Results summary statistics
 */
export interface ResultsSummary {
  /** Total items analyzed */
  totalItems: number;
  /** Count by suitability */
  counts: {
    good: number;
    careful: number;
    avoid: number;
  };
  /** Overall safety percentage */
  safetyPercentage: number;
  /** Analysis confidence */
  averageConfidence: number;
}

// =============================================================================
// STORAGE & PERSISTENCE
// =============================================================================

/**
 * AsyncStorage data schema
 */
export interface StorageSchema {
  /** User preferences */
  userPreferences: UserPreferences;
  /** User profile */
  userProfile: UserProfile;
  /** Cached analysis results */
  cachedResults: CachedAnalysisResult[];
  /** App configuration */
  appConfig: AppConfiguration;
  /** Usage analytics */
  analytics: AnalyticsData;
}

/**
 * Cached analysis result
 */
export interface CachedAnalysisResult {
  /** Cache key */
  key: string;
  /** Analysis results */
  results: FoodAnalysisResult[];
  /** When cached */
  cachedAt: string;
  /** Cache expiration */
  expiresAt: string;
  /** Source menu input */
  menuInput: MenuInput;
}

/**
 * App configuration stored locally
 */
export interface AppConfiguration {
  /** App version */
  version: string;
  /** API configuration */
  apiConfig: GeminiAPIConfig;
  /** Feature flags */
  features: Record<string, boolean>;
  /** Debug settings */
  debug: {
    enabled: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };
}

/**
 * Analytics data for app usage
 */
export interface AnalyticsData {
  /** Session information */
  sessions: SessionData[];
  /** Feature usage counts */
  featureUsage: Record<string, number>;
  /** Error occurrences */
  errors: ErrorOccurrence[];
  /** Performance metrics */
  performance: PerformanceMetrics;
}

/**
 * User session data
 */
export interface SessionData {
  /** Session ID */
  sessionId: string;
  /** Session start time */
  startTime: string;
  /** Session end time */
  endTime?: string;
  /** Screens visited */
  screensVisited: string[];
  /** Actions performed */
  actions: string[];
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  /** Average API response time */
  avgApiResponseTime: number;
  /** Average OCR processing time */
  avgOcrProcessingTime: number;
  /** App startup time */
  appStartupTime: number;
  /** Memory usage statistics */
  memoryUsage: {
    average: number;
    peak: number;
  };
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Application error interface
 */
export interface AppError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Error severity */
  severity: ErrorSeverity;
  /** Detailed error information */
  details?: string;
  /** Error stack trace */
  stack?: string;
  /** When error occurred */
  timestamp: string;
  /** User-friendly message */
  userMessage: string;
  /** Suggested recovery actions */
  recoveryActions?: RecoveryAction[];
}

/**
 * Recovery action for errors
 */
export interface RecoveryAction {
  /** Action label */
  label: string;
  /** Action type */
  type: 'retry' | 'navigate' | 'reset' | 'contact';
  /** Action parameters */
  params?: Record<string, any>;
}

/**
 * Error occurrence for analytics
 */
export interface ErrorOccurrence {
  /** Error details */
  error: AppError;
  /** User context when error occurred */
  context: {
    screen: string;
    action: string;
    userAgent?: string;
  };
  /** Whether error was resolved */
  resolved: boolean;
  /** Resolution method */
  resolution?: string;
}

/**
 * Network error specific interface
 */
export interface NetworkError extends AppError {
  /** HTTP status code */
  statusCode?: number;
  /** Request URL */
  url?: string;
  /** Request method */
  method?: string;
  /** Whether error is retryable */
  retryable: boolean;
}

/**
 * Validation error interface
 */
export interface ValidationError extends AppError {
  /** Field that failed validation */
  field: string;
  /** Validation rule that failed */
  rule: string;
  /** Expected value or format */
  expected?: string;
  /** Actual value received */
  received?: string;
}

// =============================================================================
// ACCESSIBILITY
// =============================================================================

/**
 * Accessibility configuration
 */
export interface AccessibilityConfig {
  /** Screen reader enabled */
  screenReaderEnabled: boolean;
  /** High contrast mode */
  highContrastMode: boolean;
  /** Reduced motion preference */
  reducedMotion: boolean;
  /** Text scaling factor */
  textScaling: number;
  /** Voice over settings */
  voiceOver: VoiceOverConfig;
}

/**
 * Voice over configuration
 */
export interface VoiceOverConfig {
  /** Whether voice over is enabled */
  enabled: boolean;
  /** Speech rate (0.1 - 2.0) */
  speechRate: number;
  /** Voice pitch (0.5 - 2.0) */
  pitch: number;
  /** Voice volume (0.0 - 1.0) */
  volume: number;
  /** Preferred voice identifier */
  voiceId?: string;
}

/**
 * Screen reader announcement
 */
export interface ScreenReaderAnnouncement {
  /** Message to announce */
  message: string;
  /** Announcement priority */
  priority: 'low' | 'medium' | 'high';
  /** Whether to interrupt current speech */
  interrupt: boolean;
  /** Delay before announcement */
  delay?: number;
}

/**
 * Focus management interface
 */
export interface FocusManager {
  /** Currently focused element ID */
  currentFocus?: string;
  /** Focus history */
  focusHistory: string[];
  /** Whether focus is trapped in modal */
  trapFocus: boolean;
  /** Focus restoration point */
  restorePoint?: string;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Generic API response wrapper
 */
export type APIResponse<T> = {
  success: true;
  data: T;
  message?: string;
} | APIErrorResponse;

/**
 * Async operation result
 */
export type AsyncResult<T, E = AppError> = {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
};

/**
 * Pagination parameters
 */
export interface PaginationParams {
  /** Page number (0-based) */
  page: number;
  /** Items per page */
  limit: number;
  /** Total number of items */
  total?: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  /** Data items */
  items: T[];
  /** Pagination info */
  pagination: PaginationParams & {
    /** Whether there are more pages */
    hasMore: boolean;
    /** Total pages */
    totalPages: number;
  };
}

/**
 * Timestamp utility type
 */
export type Timestamp = string; // ISO 8601 format

/**
 * ID utility type
 */
export type ID = string;

/**
 * Optional fields utility type
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Required fields utility type
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Deep partial utility type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// =============================================================================
// LEGACY TYPES (for backward compatibility)
// =============================================================================

/**
 * @deprecated Use FoodAnalysisResult instead
 */
export interface FoodItem {
  id: string;
  name: string;
  canEat: boolean;
  reason?: string;
  allergens?: string[];
  nutritionalInfo?: NutritionalInfo;
}

/**
 * Nutritional information interface
 */
export interface NutritionalInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
}

/**
 * @deprecated Use GeminiResponse instead
 */
export interface AnalysisResponse {
  success: boolean;
  foods: FoodItem[];
  confidence: number;
  message?: string;
}

// =============================================================================
// TYPE GUARDS AND VALIDATION HELPERS
// =============================================================================

/**
 * Type guard for checking if value is a valid DietaryType
 */
export const isDietaryType = (value: any): value is DietaryType => {
  return Object.values(DietaryType).includes(value);
};

/**
 * Type guard for checking if value is a valid FoodSuitability
 */
export const isFoodSuitability = (value: any): value is FoodSuitability => {
  return Object.values(FoodSuitability).includes(value);
};

/**
 * Type guard for checking if response is an error
 */
export const isAPIError = (response: any): response is APIErrorResponse => {
  return response && response.success === false;
};

/**
 * Type guard for checking if error is a NetworkError
 */
export const isNetworkError = (error: AppError): error is NetworkError => {
  return 'statusCode' in error || 'url' in error;
};

/**
 * Type guard for checking if error is a ValidationError
 */
export const isValidationError = (error: AppError): error is ValidationError => {
  return 'field' in error && 'rule' in error;
};
// =============================================================================
// MULTIMODAL API TYPES
// =============================================================================

/**
 * Input content types for multimodal requests
 */
export enum ContentType {
  TEXT = 'text',
  IMAGE = 'image'
}

/**
 * Multimodal content part for Gemini requests
 */
export interface MultimodalContentPart {
  /** Type of content */
  type: ContentType;
  /** Content data - text string or image data */
  data: string;
}

/**
 * Multimodal AI request structure
 */
export interface MultimodalAIRequest {
  /** User's dietary preferences */
  dietaryPreferences: UserPreferences;
  /** Multimodal content parts (text + images) */
  contentParts: MultimodalContentPart[];
  /** Additional context or instructions */
  context?: string;
  /** Request ID for tracking */
  requestId: string;
}

/**
 * Image data structure for multimodal requests
 */
export interface ImageData {
  /** Base64 encoded image data */
  base64Data: string;
  /** MIME type of the image */
  mimeType: string;
  /** Image dimensions */
  dimensions?: {
    width: number;
    height: number;
  };
}
