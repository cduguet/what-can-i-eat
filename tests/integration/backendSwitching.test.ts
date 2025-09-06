/**
 * Backend Mode Switching Tests
 * 
 * Tests the seamless switching between local and Supabase backend modes
 */

import { aiService } from '../../src/services/api/aiService';
import { DietaryType } from '../../src/types';

describe('Backend Mode Switching Tests', () => {
  const testRequest = {
    dietaryPreferences: {
      dietaryType: DietaryType.VEGAN,
      customRestrictions: '',
      lastUpdated: new Date().toISOString(),
      onboardingCompleted: true
    },
    menuItems: [
      {
        id: '1',
        name: 'Quinoa Bowl',
        description: 'Quinoa with vegetables and tahini dressing',
        rawText: 'Quinoa Bowl - Quinoa with vegetables and tahini dressing'
      }
    ],
    context: 'Backend switching test',
    requestId: `switching-test-${Date.now()}`
  };

  describe('Supabase Mode', () => {
    beforeAll(() => {
      // Set environment to use Supabase backend
      process.env.EXPO_PUBLIC_BACKEND_MODE = 'supabase';
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://nbworpqbjrkkfitmoggk.supabase.co';
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5id29ycHFianJra2ZpdG1vZ2drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4ODA4ODQsImV4cCI6MjA3MTQ1Njg4NH0.nmQ5_GB_-xu-r2ar5WcQUt96RB00-KdhCtl_oF-D22E';
      process.env.EXPO_PUBLIC_AI_PROVIDER = 'gemini';
      process.env.EXPO_PUBLIC_GEMINI_API_KEY = 'AIzaSyDnGdFeppcakzERBPcGBC-VUGfqe4gNAxc';
    });

    it('should use Supabase backend when configured', async () => {
      console.log('Testing Supabase backend mode...');
      
      const startTime = Date.now();
      const result = await aiService.analyzeMenu(testRequest);
      const endTime = Date.now();

      console.log('Supabase mode result:', {
        success: result.success,
        resultsCount: result.results.length,
        processingTime: endTime - startTime,
        confidence: result.confidence,
        message: result.message
      });

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.requestId).toBe(testRequest.requestId);
      
      // Supabase responses should include processing time
      expect(result.processingTime).toBeGreaterThan(0);
    }, 30000);

    it('should test connection through Supabase', async () => {
      console.log('Testing connection through Supabase...');
      
      const result = await aiService.testConnection();

      console.log('Supabase connection result:', {
        success: result.success,
        message: result.message,
        latency: result.latency
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('connection test passed');
      expect(result.latency).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Local Mode', () => {
    beforeAll(() => {
      // Set environment to use local backend
      process.env.EXPO_PUBLIC_BACKEND_MODE = 'local';
      process.env.EXPO_PUBLIC_AI_PROVIDER = 'gemini';
      process.env.EXPO_PUBLIC_GEMINI_API_KEY = 'AIzaSyDnGdFeppcakzERBPcGBC-VUGfqe4gNAxc';
    });

    it('should use local backend when configured', async () => {
      console.log('Testing local backend mode...');
      
      const startTime = Date.now();
      const result = await aiService.analyzeMenu(testRequest);
      const endTime = Date.now();

      console.log('Local mode result:', {
        success: result.success,
        resultsCount: result.results.length,
        processingTime: endTime - startTime,
        confidence: result.confidence,
        message: result.message
      });

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.requestId).toBe(testRequest.requestId);
    }, 30000);

    it('should test connection through local API', async () => {
      console.log('Testing connection through local API...');
      
      const result = await aiService.testConnection();

      console.log('Local connection result:', {
        success: result.success,
        message: result.message,
        latency: result.latency
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('GEMINI');
      expect(result.latency).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Response Format Consistency', () => {
    it('should return consistent response format across backends', async () => {
      console.log('Testing response format consistency...');
      
      // Test Supabase mode
      process.env.EXPO_PUBLIC_BACKEND_MODE = 'supabase';
      const supabaseResult = await aiService.analyzeMenu({
        ...testRequest,
        requestId: `consistency-supabase-${Date.now()}`
      });

      // Test Local mode
      process.env.EXPO_PUBLIC_BACKEND_MODE = 'local';
      const localResult = await aiService.analyzeMenu({
        ...testRequest,
        requestId: `consistency-local-${Date.now()}`
      });

      console.log('Response format comparison:', {
        supabase: {
          hasSuccess: 'success' in supabaseResult,
          hasResults: 'results' in supabaseResult,
          hasConfidence: 'confidence' in supabaseResult,
          hasMessage: 'message' in supabaseResult,
          hasRequestId: 'requestId' in supabaseResult,
          resultsStructure: supabaseResult.results[0] ? Object.keys(supabaseResult.results[0]) : []
        },
        local: {
          hasSuccess: 'success' in localResult,
          hasResults: 'results' in localResult,
          hasConfidence: 'confidence' in localResult,
          hasMessage: 'message' in localResult,
          hasRequestId: 'requestId' in localResult,
          resultsStructure: localResult.results[0] ? Object.keys(localResult.results[0]) : []
        }
      });

      // Both should have the same response structure
      expect(supabaseResult).toHaveProperty('success');
      expect(supabaseResult).toHaveProperty('results');
      expect(supabaseResult).toHaveProperty('confidence');
      expect(supabaseResult).toHaveProperty('message');
      expect(supabaseResult).toHaveProperty('requestId');

      expect(localResult).toHaveProperty('success');
      expect(localResult).toHaveProperty('results');
      expect(localResult).toHaveProperty('confidence');
      expect(localResult).toHaveProperty('message');
      expect(localResult).toHaveProperty('requestId');

      // Results should have the same structure
      if (supabaseResult.results[0] && localResult.results[0]) {
        const supabaseKeys = Object.keys(supabaseResult.results[0]).sort();
        const localKeys = Object.keys(localResult.results[0]).sort();
        expect(supabaseKeys).toEqual(localKeys);
      }
    }, 60000);
  });

  describe('Performance Comparison', () => {
    it('should compare performance between backends', async () => {
      console.log('Comparing backend performance...');
      
      const performanceTest = async (mode: string) => {
        process.env.EXPO_PUBLIC_BACKEND_MODE = mode;
        const startTime = Date.now();
        const result = await aiService.analyzeMenu({
          ...testRequest,
          requestId: `performance-${mode}-${Date.now()}`
        });
        const endTime = Date.now();
        return {
          mode,
          success: result.success,
          clientTime: endTime - startTime,
          serverTime: result.processingTime || 0,
          confidence: result.confidence
        };
      };

      const supabasePerf = await performanceTest('supabase');
      const localPerf = await performanceTest('local');

      console.log('Performance comparison:', {
        supabase: supabasePerf,
        local: localPerf,
        difference: {
          clientTime: supabasePerf.clientTime - localPerf.clientTime,
          serverTime: supabasePerf.serverTime - localPerf.serverTime
        }
      });

      expect(supabasePerf.success).toBe(true);
      expect(localPerf.success).toBe(true);
      expect(supabasePerf.confidence).toBeGreaterThan(0);
      expect(localPerf.confidence).toBeGreaterThan(0);
    }, 90000);
  });
});