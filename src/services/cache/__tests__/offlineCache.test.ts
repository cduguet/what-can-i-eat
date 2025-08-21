/**
 * Offline Cache Service Tests
 * 
 * Comprehensive test suite for the OfflineCache class covering:
 * - SQLite database operations
 * - Cache storage and retrieval
 * - Cache expiration and cleanup
 * - Statistics and management
 * - Error handling
 */

import { OfflineCache, CacheStats } from '../offlineCache';
import { GeminiRequest, GeminiResponse, DietaryType } from '../../../types';
import * as SQLite from 'expo-sqlite';

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

const mockOpenDatabaseAsync = SQLite.openDatabaseAsync as jest.MockedFunction<typeof SQLite.openDatabaseAsync>;

describe('OfflineCache', () => {
  let offlineCache: OfflineCache;
  let mockDatabase: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock database methods
    mockDatabase = {
      execAsync: jest.fn(),
      runAsync: jest.fn(),
      getFirstAsync: jest.fn(),
      getAllAsync: jest.fn(),
      closeAsync: jest.fn(),
    };

    mockOpenDatabaseAsync.mockResolvedValue(mockDatabase);

    // Create fresh cache instance
    offlineCache = new OfflineCache();

    // Clear any existing timers
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockRequest: GeminiRequest = {
    dietaryPreferences: {
      dietaryType: DietaryType.VEGAN,
      lastUpdated: '2023-01-01T00:00:00Z',
      onboardingCompleted: true,
    },
    menuItems: [
      {
        id: '1',
        name: 'Grilled Vegetables',
        rawText: 'Grilled Vegetables - Fresh seasonal vegetables',
      },
      {
        id: '2',
        name: 'Quinoa Salad',
        rawText: 'Quinoa Salad with mixed greens',
      },
    ],
    requestId: 'test-request-123',
  };

  const mockResponse: GeminiResponse = {
    success: true,
    results: [
      {
        itemId: '1',
        itemName: 'Grilled Vegetables',
        suitability: 'good' as any,
        explanation: 'Suitable for vegan diet',
        confidence: 0.9,
      },
      {
        itemId: '2',
        itemName: 'Quinoa Salad',
        suitability: 'good' as any,
        explanation: 'Plant-based ingredients',
        confidence: 0.85,
      },
    ],
    confidence: 0.875,
    message: 'Analysis completed',
    requestId: 'test-request-123',
    processingTime: 1500,
  };

  describe('initialization', () => {
    it('should initialize database and create tables', async () => {
      // Wait for initialization to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockOpenDatabaseAsync).toHaveBeenCalledWith('whatcanieat_cache.db');
      expect(mockDatabase.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS menu_cache')
      );
      expect(mockDatabase.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE INDEX IF NOT EXISTS')
      );
    });

    it('should handle initialization errors', async () => {
      const mockError = new Error('Database initialization failed');
      mockOpenDatabaseAsync.mockRejectedValue(mockError);

      // Should throw during initialization
      await expect(async () => {
        new OfflineCache();
        await new Promise(resolve => setTimeout(resolve, 100));
      }).rejects.toThrow('Database initialization failed');
    });
  });

  describe('store', () => {
    beforeEach(async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should store cache entry successfully', async () => {
      mockDatabase.runAsync.mockResolvedValue({ changes: 1 });

      await offlineCache.store(mockRequest, mockResponse);

      expect(mockDatabase.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO menu_cache'),
        expect.arrayContaining([
          expect.any(String), // cache_key
          DietaryType.VEGAN, // dietary_type
          expect.any(String), // menu_hash
          JSON.stringify(mockResponse), // analysis_result
          expect.any(Number), // created_at
          expect.any(Number), // expires_at
          0, // access_count
          expect.any(Number), // last_accessed
        ])
      );
    });

    it('should store with custom TTL', async () => {
      const customTTL = 3600000; // 1 hour
      mockDatabase.runAsync.mockResolvedValue({ changes: 1 });

      await offlineCache.store(mockRequest, mockResponse, customTTL);

      const runCall = mockDatabase.runAsync.mock.calls[0];
      const params = runCall[1];
      const expiresAt = params[5];
      const createdAt = params[4];

      expect(expiresAt - createdAt).toBe(customTTL);
    });

    it('should handle storage errors gracefully', async () => {
      mockDatabase.runAsync.mockRejectedValue(new Error('Storage failed'));

      // Should not throw
      await expect(offlineCache.store(mockRequest, mockResponse)).resolves.toBeUndefined();
    });
  });

  describe('retrieve', () => {
    beforeEach(async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should retrieve cached entry successfully', async () => {
      const mockCacheEntry = {
        id: 1,
        cache_key: 'test-key',
        dietary_type: DietaryType.VEGAN,
        menu_hash: 'menu-hash',
        analysis_result: JSON.stringify(mockResponse),
        created_at: Date.now() - 3600000,
        expires_at: Date.now() + 3600000,
        access_count: 0,
        last_accessed: Date.now() - 3600000,
      };

      mockDatabase.getFirstAsync.mockResolvedValue(mockCacheEntry);
      mockDatabase.runAsync.mockResolvedValue({ changes: 1 });

      const result = await offlineCache.retrieve(mockRequest);

      expect(result).toEqual(mockResponse);
      expect(mockDatabase.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM menu_cache WHERE cache_key = ? AND expires_at > ?'),
        expect.arrayContaining([expect.any(String), expect.any(Number)])
      );
      expect(mockDatabase.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE menu_cache SET access_count = access_count + 1'),
        expect.arrayContaining([expect.any(Number), mockCacheEntry.id])
      );
    });

    it('should return null for cache miss', async () => {
      mockDatabase.getFirstAsync.mockResolvedValue(null);

      const result = await offlineCache.retrieve(mockRequest);

      expect(result).toBeNull();
    });

    it('should return null for expired entries', async () => {
      const expiredEntry = {
        id: 1,
        cache_key: 'test-key',
        analysis_result: JSON.stringify(mockResponse),
        expires_at: Date.now() - 3600000, // Expired 1 hour ago
      };

      mockDatabase.getFirstAsync.mockResolvedValue(expiredEntry);

      const result = await offlineCache.retrieve(mockRequest);

      expect(result).toBeNull();
    });

    it('should handle retrieval errors gracefully', async () => {
      mockDatabase.getFirstAsync.mockRejectedValue(new Error('Retrieval failed'));

      const result = await offlineCache.retrieve(mockRequest);

      expect(result).toBeNull();
    });
  });

  describe('has', () => {
    beforeEach(async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should return true for existing non-expired entry', async () => {
      mockDatabase.getFirstAsync.mockResolvedValue({ count: 1 });

      const result = await offlineCache.has(mockRequest);

      expect(result).toBe(true);
      expect(mockDatabase.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count FROM menu_cache WHERE cache_key = ? AND expires_at > ?'),
        expect.arrayContaining([expect.any(String), expect.any(Number)])
      );
    });

    it('should return false for non-existing entry', async () => {
      mockDatabase.getFirstAsync.mockResolvedValue({ count: 0 });

      const result = await offlineCache.has(mockRequest);

      expect(result).toBe(false);
    });

    it('should handle check errors gracefully', async () => {
      mockDatabase.getFirstAsync.mockRejectedValue(new Error('Check failed'));

      const result = await offlineCache.has(mockRequest);

      expect(result).toBe(false);
    });
  });

  describe('getSimilar', () => {
    beforeEach(async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should return similar cached results', async () => {
      const similarEntries = [
        {
          analysis_result: JSON.stringify(mockResponse),
        },
        {
          analysis_result: JSON.stringify({
            ...mockResponse,
            confidence: 0.8,
          }),
        },
      ];

      mockDatabase.getAllAsync.mockResolvedValue(similarEntries);

      const result = await offlineCache.getSimilar(mockRequest.menuItems, DietaryType.VEGAN, 5);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockResponse);
      expect(mockDatabase.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM menu_cache WHERE menu_hash = ? AND dietary_type = ? AND expires_at > ?'),
        expect.arrayContaining([expect.any(String), DietaryType.VEGAN, expect.any(Number), 5])
      );
    });

    it('should handle getSimilar errors gracefully', async () => {
      mockDatabase.getAllAsync.mockRejectedValue(new Error('Query failed'));

      const result = await offlineCache.getSimilar(mockRequest.menuItems, DietaryType.VEGAN);

      expect(result).toEqual([]);
    });
  });

  describe('clearExpired', () => {
    beforeEach(async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should clear expired entries and return count', async () => {
      mockDatabase.runAsync.mockResolvedValue({ changes: 5 });

      const result = await offlineCache.clearExpired();

      expect(result).toBe(5);
      expect(mockDatabase.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM menu_cache WHERE expires_at <= ?'),
        expect.arrayContaining([expect.any(Number)])
      );
    });

    it('should handle clearExpired errors gracefully', async () => {
      mockDatabase.runAsync.mockRejectedValue(new Error('Clear failed'));

      const result = await offlineCache.clearExpired();

      expect(result).toBe(0);
    });
  });

  describe('clearAll', () => {
    beforeEach(async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should clear all cache entries', async () => {
      mockDatabase.runAsync.mockResolvedValue({ changes: 10 });

      await offlineCache.clearAll();

      expect(mockDatabase.runAsync).toHaveBeenCalledWith('DELETE FROM menu_cache');
    });

    it('should handle clearAll errors gracefully', async () => {
      mockDatabase.runAsync.mockRejectedValue(new Error('Clear all failed'));

      // Should not throw
      await expect(offlineCache.clearAll()).resolves.toBeUndefined();
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should return cache statistics', async () => {
      const mockBasicStats = {
        total: 100,
        expired: 10,
        oldest: Date.now() - 86400000,
        newest: Date.now(),
      };

      const mockSizeStats = {
        total_size: 1024000,
      };

      const mockAccessStats = {
        total_access: 500,
      };

      mockDatabase.getFirstAsync
        .mockResolvedValueOnce(mockBasicStats)
        .mockResolvedValueOnce(mockSizeStats)
        .mockResolvedValueOnce(mockAccessStats);

      const result = await offlineCache.getStats();

      const expectedStats: CacheStats = {
        totalEntries: 100,
        totalSize: 1024000,
        hitRate: 5, // (500 / 100) * 100 = 500, but capped calculation
        oldestEntry: mockBasicStats.oldest,
        newestEntry: mockBasicStats.newest,
        expiredEntries: 10,
      };

      expect(result.totalEntries).toBe(expectedStats.totalEntries);
      expect(result.totalSize).toBe(expectedStats.totalSize);
      expect(result.expiredEntries).toBe(expectedStats.expiredEntries);
      expect(typeof result.hitRate).toBe('number');
    });

    it('should handle getStats errors gracefully', async () => {
      mockDatabase.getFirstAsync.mockRejectedValue(new Error('Stats failed'));

      const result = await offlineCache.getStats();

      expect(result).toEqual({
        totalEntries: 0,
        totalSize: 0,
        hitRate: 0,
        oldestEntry: 0,
        newestEntry: 0,
        expiredEntries: 0,
      });
    });
  });

  describe('cache key generation', () => {
    beforeEach(async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should generate consistent cache keys for identical requests', async () => {
      const request1 = { ...mockRequest };
      const request2 = { ...mockRequest, requestId: 'different-id' };

      mockDatabase.runAsync.mockResolvedValue({ changes: 1 });

      await offlineCache.store(request1, mockResponse);
      await offlineCache.store(request2, mockResponse);

      // Both calls should use the same cache key (ignoring requestId)
      const calls = mockDatabase.runAsync.mock.calls;
      expect(calls).toHaveLength(2);
      
      const cacheKey1 = calls[0][1][0];
      const cacheKey2 = calls[1][1][0];
      expect(cacheKey1).toBe(cacheKey2);
    });

    it('should generate different cache keys for different menu items', async () => {
      const request1 = { ...mockRequest };
      const request2 = {
        ...mockRequest,
        menuItems: [
          {
            id: '3',
            name: 'Different Item',
            rawText: 'Different Item - Something else',
          },
        ],
      };

      mockDatabase.runAsync.mockResolvedValue({ changes: 1 });

      await offlineCache.store(request1, mockResponse);
      await offlineCache.store(request2, mockResponse);

      const calls = mockDatabase.runAsync.mock.calls;
      const cacheKey1 = calls[0][1][0];
      const cacheKey2 = calls[1][1][0];
      expect(cacheKey1).not.toBe(cacheKey2);
    });
  });

  describe('automatic cleanup', () => {
    beforeEach(async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should run automatic cleanup on timer', async () => {
      mockDatabase.runAsync.mockResolvedValue({ changes: 3 });
      mockDatabase.getFirstAsync.mockResolvedValue({
        total: 50,
        expired: 3,
        oldest: Date.now() - 86400000,
        newest: Date.now(),
      });

      // Fast-forward time to trigger cleanup
      jest.advanceTimersByTime(60 * 60 * 1000); // 1 hour

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockDatabase.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM menu_cache WHERE expires_at <= ?'),
        expect.any(Array)
      );
    });
  });

  describe('close', () => {
    beforeEach(async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should close database connection and cleanup timers', async () => {
      await offlineCache.close();

      expect(mockDatabase.closeAsync).toHaveBeenCalled();
    });

    it('should handle close errors gracefully', async () => {
      mockDatabase.closeAsync.mockRejectedValue(new Error('Close failed'));

      // Should not throw
      await expect(offlineCache.close()).resolves.toBeUndefined();
    });
  });
});