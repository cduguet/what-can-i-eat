/**
 * Offline Cache Service for "What Can I Eat" Application
 * 
 * Provides local SQLite-based caching for menu analysis results to enable
 * offline functionality. This service stores analysis results locally and
 * manages cache expiration and synchronization.
 * 
 * Features:
 * - SQLite database for persistent local storage
 * - Cache expiration management
 * - Automatic cleanup of expired entries
 * - Cache statistics and management
 * - Synchronization with remote cache
 */

import * as SQLite from 'expo-sqlite';
import { GeminiRequest, GeminiResponse, MenuItem, UserPreferences } from '../../types';

/**
 * Cache entry interface for database storage
 */
interface CacheEntry {
  id?: number;
  cache_key: string;
  dietary_type: string;
  menu_hash: string;
  analysis_result: string; // JSON stringified GeminiResponse
  created_at: number;
  expires_at: number;
  access_count: number;
  last_accessed: number;
}

/**
 * Cache statistics interface
 */
export interface CacheStats {
  totalEntries: number;
  totalSize: number; // Approximate size in bytes
  hitRate: number; // Percentage of cache hits
  oldestEntry: number; // Timestamp
  newestEntry: number; // Timestamp
  expiredEntries: number;
}

/**
 * Cache configuration interface
 */
interface CacheConfig {
  maxEntries: number;
  defaultTTL: number; // Time to live in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
  maxSize: number; // Maximum cache size in bytes
}

/**
 * Offline Cache Service Class
 * 
 * Manages local SQLite database for caching menu analysis results.
 * Provides offline functionality and improves app performance.
 */
export class OfflineCache {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;
  private cleanupTimer: NodeJS.Timeout | null = null;
  
  private config: CacheConfig = {
    maxEntries: 1000,
    defaultTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
    cleanupInterval: 60 * 60 * 1000, // 1 hour
    maxSize: 50 * 1024 * 1024, // 50MB
  };

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the SQLite database and create tables
   */
  private async initialize(): Promise<void> {
    try {
      console.log('Initializing offline cache database...');
      
      // Open database
      this.db = await SQLite.openDatabaseAsync('whatcanieat_cache.db');
      
      // Create tables
      await this.createTables();
      
      // Start cleanup timer
      this.startCleanupTimer();
      
      this.isInitialized = true;
      console.log('Offline cache initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize offline cache:', error);
      throw error;
    }
  }

  /**
   * Create database tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS menu_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cache_key TEXT UNIQUE NOT NULL,
        dietary_type TEXT NOT NULL,
        menu_hash TEXT NOT NULL,
        analysis_result TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        access_count INTEGER DEFAULT 0,
        last_accessed INTEGER NOT NULL
      );
    `;

    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_cache_key ON menu_cache(cache_key);
      CREATE INDEX IF NOT EXISTS idx_expires_at ON menu_cache(expires_at);
      CREATE INDEX IF NOT EXISTS idx_dietary_type ON menu_cache(dietary_type);
      CREATE INDEX IF NOT EXISTS idx_menu_hash ON menu_cache(menu_hash);
    `;

    await this.db.execAsync(createTableSQL);
    await this.db.execAsync(createIndexSQL);
  }

  /**
   * Generate cache key for a request
   * 
   * @param request - The analysis request
   * @returns Cache key string
   */
  private generateCacheKey(request: GeminiRequest): string {
    const content = JSON.stringify({
      dietaryType: request.dietaryPreferences.dietaryType,
      customRestrictions: request.dietaryPreferences.customRestrictions,
      menuItems: request.menuItems.map(item => ({
        name: item.name.toLowerCase().trim(),
        description: item.description?.toLowerCase().trim(),
        ingredients: item.ingredients?.map(ing => ing.toLowerCase().trim()).sort(),
      })),
    });

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Generate menu hash for grouping similar menus
   * 
   * @param menuItems - Menu items to hash
   * @returns Menu hash string
   */
  private generateMenuHash(menuItems: MenuItem[]): string {
    const menuContent = menuItems
      .map(item => item.name.toLowerCase().trim())
      .sort()
      .join('|');

    let hash = 0;
    for (let i = 0; i < menuContent.length; i++) {
      const char = menuContent.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Store analysis result in cache
   * 
   * @param request - The original request
   * @param response - The analysis response
   * @param ttl - Time to live in milliseconds (optional)
   */
  async store(request: GeminiRequest, response: GeminiResponse, ttl?: number): Promise<void> {
    if (!this.isInitialized || !this.db) {
      await this.initialize();
    }

    try {
      const cacheKey = this.generateCacheKey(request);
      const menuHash = this.generateMenuHash(request.menuItems);
      const now = Date.now();
      const expiresAt = now + (ttl || this.config.defaultTTL);

      const entry: CacheEntry = {
        cache_key: cacheKey,
        dietary_type: request.dietaryPreferences.dietaryType,
        menu_hash: menuHash,
        analysis_result: JSON.stringify(response),
        created_at: now,
        expires_at: expiresAt,
        access_count: 0,
        last_accessed: now,
      };

      // Insert or replace entry
      await this.db!.runAsync(
        `INSERT OR REPLACE INTO menu_cache 
         (cache_key, dietary_type, menu_hash, analysis_result, created_at, expires_at, access_count, last_accessed)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          entry.cache_key,
          entry.dietary_type,
          entry.menu_hash,
          entry.analysis_result,
          entry.created_at,
          entry.expires_at,
          entry.access_count,
          entry.last_accessed,
        ]
      );

      console.log(`Cached analysis result with key: ${cacheKey}`);
      
      // Check if we need to cleanup
      await this.checkCacheLimits();
      
    } catch (error) {
      console.error('Error storing cache entry:', error);
    }
  }

  /**
   * Retrieve analysis result from cache
   * 
   * @param request - The analysis request
   * @returns Cached response or null
   */
  async retrieve(request: GeminiRequest): Promise<GeminiResponse | null> {
    if (!this.isInitialized || !this.db) {
      await this.initialize();
    }

    try {
      const cacheKey = this.generateCacheKey(request);
      const now = Date.now();

      // Get cache entry
      const result = await this.db!.getFirstAsync<CacheEntry>(
        `SELECT * FROM menu_cache WHERE cache_key = ? AND expires_at > ?`,
        [cacheKey, now]
      );

      if (!result || !result.id) {
        return null;
      }

      // Update access statistics
      await this.db!.runAsync(
        `UPDATE menu_cache SET access_count = access_count + 1, last_accessed = ? WHERE id = ?`,
        [now, result.id]
      );

      // Parse and return response
      const response: GeminiResponse = JSON.parse(result.analysis_result);
      
      console.log(`Cache hit for key: ${cacheKey}`);
      return response;
      
    } catch (error) {
      console.error('Error retrieving cache entry:', error);
      return null;
    }
  }

  /**
   * Check if a request has cached results
   * 
   * @param request - The analysis request
   * @returns True if cached result exists
   */
  async has(request: GeminiRequest): Promise<boolean> {
    if (!this.isInitialized || !this.db) {
      await this.initialize();
    }

    try {
      const cacheKey = this.generateCacheKey(request);
      const now = Date.now();

      const result = await this.db!.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM menu_cache WHERE cache_key = ? AND expires_at > ?`,
        [cacheKey, now]
      );

      return (result?.count || 0) > 0;
      
    } catch (error) {
      console.error('Error checking cache entry:', error);
      return false;
    }
  }

  /**
   * Get similar cached results for a menu
   * 
   * @param menuItems - Menu items to find similar results for
   * @param dietaryType - Dietary type to match
   * @param limit - Maximum number of results
   * @returns Array of similar cached responses
   */
  async getSimilar(
    menuItems: MenuItem[],
    dietaryType: string,
    limit: number = 5
  ): Promise<GeminiResponse[]> {
    if (!this.isInitialized || !this.db) {
      await this.initialize();
    }

    try {
      const menuHash = this.generateMenuHash(menuItems);
      const now = Date.now();

      const results = await this.db!.getAllAsync<CacheEntry>(
        `SELECT * FROM menu_cache 
         WHERE menu_hash = ? AND dietary_type = ? AND expires_at > ?
         ORDER BY last_accessed DESC
         LIMIT ?`,
        [menuHash, dietaryType, now, limit]
      );

      return results.map(entry => JSON.parse(entry.analysis_result));
      
    } catch (error) {
      console.error('Error getting similar cache entries:', error);
      return [];
    }
  }

  /**
   * Clear expired cache entries
   */
  async clearExpired(): Promise<number> {
    if (!this.isInitialized || !this.db) {
      await this.initialize();
    }

    try {
      const now = Date.now();
      
      const result = await this.db!.runAsync(
        `DELETE FROM menu_cache WHERE expires_at <= ?`,
        [now]
      );

      const deletedCount = result.changes || 0;
      
      if (deletedCount > 0) {
        console.log(`Cleared ${deletedCount} expired cache entries`);
      }
      
      return deletedCount;
      
    } catch (error) {
      console.error('Error clearing expired cache entries:', error);
      return 0;
    }
  }

  /**
   * Clear all cache entries
   */
  async clearAll(): Promise<void> {
    if (!this.isInitialized || !this.db) {
      await this.initialize();
    }

    try {
      await this.db!.runAsync(`DELETE FROM menu_cache`);
      console.log('Cleared all cache entries');
      
    } catch (error) {
      console.error('Error clearing all cache entries:', error);
    }
  }

  /**
   * Get cache statistics
   * 
   * @returns Cache statistics
   */
  async getStats(): Promise<CacheStats> {
    if (!this.isInitialized || !this.db) {
      await this.initialize();
    }

    try {
      const now = Date.now();
      
      // Get basic stats
      const basicStats = await this.db!.getFirstAsync<{
        total: number;
        expired: number;
        oldest: number;
        newest: number;
      }>(
        `SELECT 
           COUNT(*) as total,
           COUNT(CASE WHEN expires_at <= ? THEN 1 END) as expired,
           MIN(created_at) as oldest,
           MAX(created_at) as newest
         FROM menu_cache`,
        [now]
      );

      // Calculate approximate size
      const sizeResult = await this.db!.getFirstAsync<{ total_size: number }>(
        `SELECT SUM(LENGTH(analysis_result)) as total_size FROM menu_cache`
      );

      // Calculate hit rate (simplified)
      const accessStats = await this.db!.getFirstAsync<{ total_access: number }>(
        `SELECT SUM(access_count) as total_access FROM menu_cache`
      );

      const totalEntries = basicStats?.total || 0;
      const totalAccess = accessStats?.total_access || 0;
      const hitRate = totalEntries > 0 ? (totalAccess / totalEntries) * 100 : 0;

      return {
        totalEntries,
        totalSize: sizeResult?.total_size || 0,
        hitRate: Math.round(hitRate * 100) / 100,
        oldestEntry: basicStats?.oldest || 0,
        newestEntry: basicStats?.newest || 0,
        expiredEntries: basicStats?.expired || 0,
      };
      
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalEntries: 0,
        totalSize: 0,
        hitRate: 0,
        oldestEntry: 0,
        newestEntry: 0,
        expiredEntries: 0,
      };
    }
  }

  /**
   * Check cache limits and cleanup if necessary
   */
  private async checkCacheLimits(): Promise<void> {
    try {
      const stats = await this.getStats();
      
      // Check entry limit
      if (stats.totalEntries > this.config.maxEntries) {
        await this.cleanupOldEntries();
      }
      
      // Check size limit
      if (stats.totalSize > this.config.maxSize) {
        await this.cleanupLargeEntries();
      }
      
    } catch (error) {
      console.error('Error checking cache limits:', error);
    }
  }

  /**
   * Cleanup old cache entries
   */
  private async cleanupOldEntries(): Promise<void> {
    if (!this.db) return;

    try {
      const entriesToKeep = Math.floor(this.config.maxEntries * 0.8); // Keep 80%
      
      await this.db.runAsync(
        `DELETE FROM menu_cache 
         WHERE id NOT IN (
           SELECT id FROM menu_cache 
           ORDER BY last_accessed DESC 
           LIMIT ?
         )`,
        [entriesToKeep]
      );
      
      console.log('Cleaned up old cache entries');
      
    } catch (error) {
      console.error('Error cleaning up old entries:', error);
    }
  }

  /**
   * Cleanup large cache entries
   */
  private async cleanupLargeEntries(): Promise<void> {
    if (!this.db) return;

    try {
      // Remove entries with large analysis results first
      await this.db.runAsync(
        `DELETE FROM menu_cache 
         WHERE LENGTH(analysis_result) > ?
         ORDER BY LENGTH(analysis_result) DESC
         LIMIT 100`,
        [10000] // Remove entries larger than 10KB
      );
      
      console.log('Cleaned up large cache entries');
      
    } catch (error) {
      console.error('Error cleaning up large entries:', error);
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(async () => {
      try {
        await this.clearExpired();
        await this.checkCacheLimits();
      } catch (error) {
        console.error('Error in automatic cleanup:', error);
      }
    }, this.config.cleanupInterval);
  }

  /**
   * Stop automatic cleanup timer
   */
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Close database connection and cleanup
   */
  async close(): Promise<void> {
    this.stopCleanupTimer();
    
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
    
    this.isInitialized = false;
    console.log('Offline cache closed');
  }
}

// Export singleton instance
export const offlineCache = new OfflineCache();

// Export default
export default offlineCache;