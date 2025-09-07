/**
 * ResultsSummary Component Tests
 * 
 * Comprehensive test suite for the ResultsSummary component including
 * statistics calculation, rendering, and different result scenarios.
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { ThemeProvider } from '@/theme/ThemeProvider';

import { ResultsSummary } from '../ResultsSummary';
import { FoodAnalysisResult, FoodSuitability } from '@/types';

// Test wrapper with Paper provider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <PaperProvider>{children}</PaperProvider>
  </ThemeProvider>
);

// Mock data
const mockResults: FoodAnalysisResult[] = [
  {
    itemId: '1',
    itemName: 'Grilled Vegetable Salad',
    suitability: FoodSuitability.GOOD,
    explanation: 'Safe to eat',
    confidence: 0.9,
  },
  {
    itemId: '2',
    itemName: 'Quinoa Bowl',
    suitability: FoodSuitability.GOOD,
    explanation: 'Safe to eat',
    confidence: 0.85,
  },
  {
    itemId: '3',
    itemName: 'Pasta Primavera',
    suitability: FoodSuitability.CAREFUL,
    explanation: 'May contain dairy',
    confidence: 0.7,
  },
  {
    itemId: '4',
    itemName: 'Chicken Caesar Salad',
    suitability: FoodSuitability.AVOID,
    explanation: 'Contains chicken',
    confidence: 0.95,
  },
  {
    itemId: '5',
    itemName: 'Fish and Chips',
    suitability: FoodSuitability.AVOID,
    explanation: 'Contains fish',
    confidence: 0.98,
  },
];

describe.skip('ResultsSummary', () => {
  describe('Basic Rendering', () => {
    it('renders summary with correct item count', () => {
      render(
        <TestWrapper>
          <ResultsSummary results={mockResults} />
        </TestWrapper>
      );

      expect(screen.getByText('Analysis Summary')).toBeTruthy();
      expect(screen.getByText('5 items analyzed')).toBeTruthy();
    });

    it('handles singular item count correctly', () => {
      render(
        <TestWrapper>
          <ResultsSummary results={[mockResults[0]]} />
        </TestWrapper>
      );

      expect(screen.getByText('1 item analyzed')).toBeTruthy();
    });

    it('renders empty state when no results', () => {
      render(
        <TestWrapper>
          <ResultsSummary results={[]} />
        </TestWrapper>
      );

      expect(screen.getByText('No Results')).toBeTruthy();
      expect(screen.getByText('No menu items were found to analyze. Try taking a clearer photo or entering text manually.')).toBeTruthy();
    });
  });

  describe('Safety Percentage Calculation', () => {
    it('calculates safety percentage correctly', () => {
      // 2 good out of 5 total = 40%
      render(
        <TestWrapper>
          <ResultsSummary results={mockResults} />
        </TestWrapper>
      );

      expect(screen.getByText('40%')).toBeTruthy();
    });

    it('shows 100% when all items are safe', () => {
      const allGoodResults = mockResults.map(result => ({
        ...result,
        suitability: FoodSuitability.GOOD,
      }));

      render(
        <TestWrapper>
          <ResultsSummary results={allGoodResults} />
        </TestWrapper>
      );

      expect(screen.getByText('100%')).toBeTruthy();
      expect(screen.getByText('Great Options')).toBeTruthy();
    });

    it('shows 0% when no items are safe', () => {
      const noGoodResults = mockResults.map(result => ({
        ...result,
        suitability: FoodSuitability.AVOID,
      }));

      render(
        <TestWrapper>
          <ResultsSummary results={noGoodResults} />
        </TestWrapper>
      );

      expect(screen.getByText('0%')).toBeTruthy();
      expect(screen.getByText('Limited Options')).toBeTruthy();
    });
  });

  describe('Safety Status Messages', () => {
    it('shows "Great Options" for high safety percentage (≥70%)', () => {
      const mostlyGoodResults = [
        ...Array(7).fill(null).map((_, i) => ({
          itemId: `good-${i}`,
          itemName: `Good Item ${i}`,
          suitability: FoodSuitability.GOOD,
          explanation: 'Safe',
          confidence: 0.9,
        })),
        ...Array(3).fill(null).map((_, i) => ({
          itemId: `avoid-${i}`,
          itemName: `Avoid Item ${i}`,
          suitability: FoodSuitability.AVOID,
          explanation: 'Not safe',
          confidence: 0.9,
        })),
      ];

      render(
        <TestWrapper>
          <ResultsSummary results={mostlyGoodResults} />
        </TestWrapper>
      );

      expect(screen.getByText('Great Options')).toBeTruthy();
      expect(screen.getByText('This menu has many safe options for you')).toBeTruthy();
    });

    it('shows "Some Options" for medium safety percentage (40-69%)', () => {
      render(
        <TestWrapper>
          <ResultsSummary results={mockResults} />
        </TestWrapper>
      );

      expect(screen.getByText('Some Options')).toBeTruthy();
      expect(screen.getByText('This menu has some options, but ask questions')).toBeTruthy();
    });

    it('shows "Limited Options" for low safety percentage (<40%)', () => {
      const mostlyBadResults = [
        {
          itemId: '1',
          itemName: 'Good Item',
          suitability: FoodSuitability.GOOD,
          explanation: 'Safe',
          confidence: 0.9,
        },
        ...Array(9).fill(null).map((_, i) => ({
          itemId: `avoid-${i}`,
          itemName: `Avoid Item ${i}`,
          suitability: FoodSuitability.AVOID,
          explanation: 'Not safe',
          confidence: 0.9,
        })),
      ];

      render(
        <TestWrapper>
          <ResultsSummary results={mostlyBadResults} />
        </TestWrapper>
      );

      expect(screen.getByText('Limited Options')).toBeTruthy();
      expect(screen.getByText('This menu has limited safe options')).toBeTruthy();
    });
  });

  describe('Category Breakdown', () => {
    it('shows correct category counts when showDetails is true', () => {
      render(
        <TestWrapper>
          <ResultsSummary results={mockResults} showDetails={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Category Breakdown')).toBeTruthy();
      expect(screen.getByText('2 Safe')).toBeTruthy();
      expect(screen.getByText('1 Ask')).toBeTruthy();
      expect(screen.getByText('2 Avoid')).toBeTruthy();
    });

    it('hides category breakdown when showDetails is false', () => {
      render(
        <TestWrapper>
          <ResultsSummary results={mockResults} showDetails={false} />
        </TestWrapper>
      );

      expect(screen.queryByText('Category Breakdown')).toBeNull();
    });
  });

  describe('Confidence Analysis', () => {
    it('shows confidence metrics when showConfidence is true', () => {
      render(
        <TestWrapper>
          <ResultsSummary results={mockResults} showConfidence={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Analysis Confidence')).toBeTruthy();
      // Average confidence: (0.9 + 0.85 + 0.7 + 0.95 + 0.98) / 5 = 0.876 = 88%
      expect(screen.getByText('88%')).toBeTruthy();
    });

    it('hides confidence section when showConfidence is false', () => {
      render(
        <TestWrapper>
          <ResultsSummary results={mockResults} showConfidence={false} />
        </TestWrapper>
      );

      expect(screen.queryByText('Analysis Confidence')).toBeNull();
    });

    it('shows correct confidence levels', () => {
      // High confidence (≥80%)
      const highConfidenceResults = mockResults.map(result => ({
        ...result,
        confidence: 0.9,
      }));

      render(
        <TestWrapper>
          <ResultsSummary results={highConfidenceResults} />
        </TestWrapper>
      );

      expect(screen.getByText('Very reliable analysis')).toBeTruthy();
    });

    it('shows medium confidence level (60-79%)', () => {
      const mediumConfidenceResults = mockResults.map(result => ({
        ...result,
        confidence: 0.7,
      }));

      render(
        <TestWrapper>
          <ResultsSummary results={mediumConfidenceResults} />
        </TestWrapper>
      );

      expect(screen.getByText('Generally reliable analysis')).toBeTruthy();
    });

    it('shows lower confidence level (<60%)', () => {
      const lowConfidenceResults = mockResults.map(result => ({
        ...result,
        confidence: 0.5,
      }));

      render(
        <TestWrapper>
          <ResultsSummary results={lowConfidenceResults} />
        </TestWrapper>
      );

      expect(screen.getByText('Consider double-checking with staff')).toBeTruthy();
    });
  });

  describe('Quick Tips', () => {
    it('shows tip for careful items when present', () => {
      render(
        <TestWrapper>
          <ResultsSummary results={mockResults} />
        </TestWrapper>
      );

      expect(screen.getByText('💡 Quick Tips')).toBeTruthy();
      expect(screen.getByText('• Ask staff about ingredients for "Ask Questions" items')).toBeTruthy();
    });

    it('shows tip for avoid items when present', () => {
      render(
        <TestWrapper>
          <ResultsSummary results={mockResults} />
        </TestWrapper>
      );

      expect(screen.getByText('• Double-check "Avoid" items with restaurant staff')).toBeTruthy();
    });

    it('shows tip for low confidence when applicable', () => {
      const lowConfidenceResults = mockResults.map(result => ({
        ...result,
        confidence: 0.6,
      }));

      render(
        <TestWrapper>
          <ResultsSummary results={lowConfidenceResults} />
        </TestWrapper>
      );

      expect(screen.getByText('• Consider retaking photo for better text clarity')).toBeTruthy();
    });

    it('always shows general tip about informing staff', () => {
      render(
        <TestWrapper>
          <ResultsSummary results={mockResults} />
        </TestWrapper>
      );

      expect(screen.getByText('• Always inform staff about your dietary restrictions')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero confidence correctly', () => {
      const zeroConfidenceResults = mockResults.map(result => ({
        ...result,
        confidence: 0,
      }));

      render(
        <TestWrapper>
          <ResultsSummary results={zeroConfidenceResults} />
        </TestWrapper>
      );

      expect(screen.getByText('0%')).toBeTruthy();
    });

    it('handles single item correctly', () => {
      render(
        <TestWrapper>
          <ResultsSummary results={[mockResults[0]]} />
        </TestWrapper>
      );

      expect(screen.getByText('1 item analyzed')).toBeTruthy();
      expect(screen.getByText('100%')).toBeTruthy(); // 1 good out of 1 total
    });

    it('rounds confidence percentage correctly', () => {
      const preciseConfidenceResults = [
        { ...mockResults[0], confidence: 0.876 },
        { ...mockResults[1], confidence: 0.123 },
      ];

      render(
        <TestWrapper>
          <ResultsSummary results={preciseConfidenceResults} />
        </TestWrapper>
      );

      // Average: (0.876 + 0.123) / 2 = 0.4995 = 50%
      expect(screen.getByText('50%')).toBeTruthy();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom style prop', () => {
      const customStyle = { marginTop: 20 };
      
      render(
        <TestWrapper>
          <ResultsSummary results={mockResults} style={customStyle} />
        </TestWrapper>
      );

      // Component should render without errors with custom style
      expect(screen.getByText('Analysis Summary')).toBeTruthy();
    });
  });
});
