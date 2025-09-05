import { summarizeResults, getTimeAgo } from '../recentActivityUtils';
import { FoodSuitability, FoodAnalysisResult } from '@/types';

describe('recentActivityUtils', () => {
  describe('summarizeResults', () => {
    it('counts suitability categories correctly', () => {
      const results: FoodAnalysisResult[] = [
        { itemId: '1', itemName: 'A', suitability: FoodSuitability.GOOD, explanation: '', confidence: 0.9 },
        { itemId: '2', itemName: 'B', suitability: FoodSuitability.CAREFUL, explanation: '', confidence: 0.8 },
        { itemId: '3', itemName: 'C', suitability: FoodSuitability.CAREFUL, explanation: '', confidence: 0.7 },
        { itemId: '4', itemName: 'D', suitability: FoodSuitability.AVOID, explanation: '', confidence: 0.6 },
        { itemId: '5', itemName: 'E', suitability: FoodSuitability.GOOD, explanation: '', confidence: 0.95 },
      ];

      expect(summarizeResults(results)).toEqual({ good: 2, careful: 2, avoid: 1 });
    });

    it('handles empty results', () => {
      expect(summarizeResults([])).toEqual({ good: 0, careful: 0, avoid: 0 });
    });
  });

  describe('getTimeAgo', () => {
    it('returns Just now for current timestamps', () => {
      const nowIso = new Date().toISOString();
      expect(getTimeAgo(nowIso)).toBe('Just now');
    });

    it('returns minutes for recent times', () => {
      const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      expect(getTimeAgo(twoMinAgo)).toMatch(/2 minute/);
    });

    it('returns hours for older times', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      expect(getTimeAgo(threeHoursAgo)).toMatch(/3 hour/);
    });

    it('returns days for day-old timestamps', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      expect(getTimeAgo(twoDaysAgo)).toMatch(/2 day/);
    });
  });
});

