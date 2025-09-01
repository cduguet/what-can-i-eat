/**
 * ResultCard Component Tests
 * 
 * Comprehensive test suite for the ResultCard component including
 * rendering, interactions, accessibility, and different states.
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { ThemeProvider } from '@/theme/ThemeProvider';

import { ResultCard } from '../ResultCard';
import { FoodAnalysisResult, FoodSuitability } from '@/types';

// Mock Haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

// Test wrapper with Paper provider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <PaperProvider>{children}</PaperProvider>
  </ThemeProvider>
);

// Mock data
const mockGoodResult: FoodAnalysisResult = {
  itemId: '1',
  itemName: 'Grilled Vegetable Salad',
  suitability: FoodSuitability.GOOD,
  explanation: 'This salad contains only vegetables and appears to be prepared without any animal products.',
  confidence: 0.9,
  concerns: [],
};

const mockCarefulResult: FoodAnalysisResult = {
  itemId: '2',
  itemName: 'Pasta Primavera',
  suitability: FoodSuitability.CAREFUL,
  explanation: 'While this pasta dish contains vegetables, it may contain dairy products.',
  questionsToAsk: [
    'Does the sauce contain any dairy products?',
    'Is the pasta made with eggs?',
  ],
  confidence: 0.7,
  concerns: ['Potential dairy', 'Possible eggs in pasta'],
};

const mockAvoidResult: FoodAnalysisResult = {
  itemId: '3',
  itemName: 'Chicken Caesar Salad',
  suitability: FoodSuitability.AVOID,
  explanation: 'This dish contains chicken, which is not suitable for vegetarian or vegan diets.',
  confidence: 0.95,
  concerns: ['Contains chicken', 'Caesar dressing with anchovies'],
};

describe('ResultCard', () => {
  describe('Rendering', () => {
    it('renders basic card information correctly', () => {
      render(
        <TestWrapper>
          <ResultCard result={mockGoodResult} />
        </TestWrapper>
      );

      expect(screen.getByText('Grilled Vegetable Salad')).toBeTruthy();
      expect(screen.getByText('Safe to Eat')).toBeTruthy();
      expect(screen.getByText('90% confident')).toBeTruthy();
    });

    it('renders different suitability types with correct styling', () => {
      const { rerender } = render(
        <TestWrapper>
          <ResultCard result={mockGoodResult} />
        </TestWrapper>
      );

      expect(screen.getByText('Safe to Eat')).toBeTruthy();

      rerender(
        <TestWrapper>
          <ResultCard result={mockCarefulResult} />
        </TestWrapper>
      );

      expect(screen.getByText('Ask Questions')).toBeTruthy();

      rerender(
        <TestWrapper>
          <ResultCard result={mockAvoidResult} />
        </TestWrapper>
      );

      expect(screen.getByText('Avoid')).toBeTruthy();
    });

    it('hides confidence when showConfidence is false', () => {
      render(
        <TestWrapper>
          <ResultCard result={mockGoodResult} showConfidence={false} />
        </TestWrapper>
      );

      expect(screen.queryByText('90% confident')).toBeNull();
    });
  });

  describe('Expansion Behavior', () => {
    it('starts collapsed by default', () => {
      render(
        <TestWrapper>
          <ResultCard result={mockGoodResult} />
        </TestWrapper>
      );

      // Explanation should not be visible initially
      expect(screen.queryByText('Why this recommendation?')).toBeNull();
    });

    it('starts expanded when initialExpanded is true', () => {
      render(
        <TestWrapper>
          <ResultCard result={mockGoodResult} initialExpanded={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Why this recommendation?')).toBeTruthy();
      expect(screen.getByText(mockGoodResult.explanation)).toBeTruthy();
    });

    it('toggles expansion when pressed', () => {
      render(
        <TestWrapper>
          <ResultCard result={mockGoodResult} />
        </TestWrapper>
      );

      const card = screen.getByLabelText('Grilled Vegetable Salad, Safe to Eat');
      
      // Should be collapsed initially
      expect(screen.queryByText('Why this recommendation?')).toBeNull();

      // Tap to expand
      fireEvent.press(card);
      expect(screen.getByText('Why this recommendation?')).toBeTruthy();

      // Tap to collapse
      fireEvent.press(card);
      expect(screen.queryByText('Why this recommendation?')).toBeNull();
    });

    it('toggles expansion when chevron button is pressed', () => {
      render(
        <TestWrapper>
          <ResultCard result={mockGoodResult} />
        </TestWrapper>
      );

      const expandButton = screen.getByLabelText('Expand details');
      
      // Should be collapsed initially
      expect(screen.queryByText('Why this recommendation?')).toBeNull();

      // Tap chevron to expand
      fireEvent.press(expandButton);
      expect(screen.getByText('Why this recommendation?')).toBeTruthy();

      // Button label should change
      expect(screen.getByLabelText('Collapse details')).toBeTruthy();
    });
  });

  describe('Expanded Content', () => {
    it('shows explanation when expanded', () => {
      render(
        <TestWrapper>
          <ResultCard result={mockGoodResult} initialExpanded={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Why this recommendation?')).toBeTruthy();
      expect(screen.getByText(mockGoodResult.explanation)).toBeTruthy();
    });

    it('shows questions for CAREFUL items when expanded', () => {
      render(
        <TestWrapper>
          <ResultCard result={mockCarefulResult} initialExpanded={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Questions to ask the staff:')).toBeTruthy();
      expect(screen.getByText('• Does the sauce contain any dairy products?')).toBeTruthy();
      expect(screen.getByText('• Is the pasta made with eggs?')).toBeTruthy();
    });

    it('shows concerns when present and expanded', () => {
      render(
        <TestWrapper>
          <ResultCard result={mockCarefulResult} initialExpanded={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Potential concerns:')).toBeTruthy();
      expect(screen.getByText('Potential dairy')).toBeTruthy();
      expect(screen.getByText('Possible eggs in pasta')).toBeTruthy();
    });

    it('does not show questions section for non-CAREFUL items', () => {
      render(
        <TestWrapper>
          <ResultCard result={mockGoodResult} initialExpanded={true} />
        </TestWrapper>
      );

      expect(screen.queryByText('Questions to ask the staff:')).toBeNull();
    });

    it('does not show concerns section when no concerns exist', () => {
      render(
        <TestWrapper>
          <ResultCard result={mockGoodResult} initialExpanded={true} />
        </TestWrapper>
      );

      expect(screen.queryByText('Potential concerns:')).toBeNull();
    });
  });

  describe('Interactions', () => {
    it('calls onPress callback when card is pressed', () => {
      const onPressMock = jest.fn();
      
      render(
        <TestWrapper>
          <ResultCard result={mockGoodResult} onPress={onPressMock} />
        </TestWrapper>
      );

      const card = screen.getByLabelText('Grilled Vegetable Salad, Safe to Eat');
      fireEvent.press(card);

      expect(onPressMock).toHaveBeenCalledWith(mockGoodResult);
    });

    it('calls haptic feedback on interactions', () => {
      const { impactAsync } = require('expo-haptics');
      
      render(
        <TestWrapper>
          <ResultCard result={mockGoodResult} />
        </TestWrapper>
      );

      const card = screen.getByLabelText('Grilled Vegetable Salad, Safe to Eat');
      fireEvent.press(card);

      expect(impactAsync).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility labels', () => {
      render(
        <TestWrapper>
          <ResultCard result={mockGoodResult} />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Grilled Vegetable Salad, Safe to Eat')).toBeTruthy();
      expect(screen.getByLabelText('Expand details')).toBeTruthy();
    });

    it('updates accessibility labels when expanded', () => {
      render(
        <TestWrapper>
          <ResultCard result={mockGoodResult} />
        </TestWrapper>
      );

      const card = screen.getByLabelText('Grilled Vegetable Salad, Safe to Eat');
      fireEvent.press(card);

      expect(screen.getByLabelText('Collapse details')).toBeTruthy();
    });

    it('has proper accessibility hint', () => {
      render(
        <TestWrapper>
          <ResultCard result={mockGoodResult} />
        </TestWrapper>
      );

      const card = screen.getByLabelText('Grilled Vegetable Salad, Safe to Eat');
      expect(card.props.accessibilityHint).toBe('Tap to expand details');
    });
  });

  describe('Edge Cases', () => {
    it('handles missing optional fields gracefully', () => {
      const minimalResult: FoodAnalysisResult = {
        itemId: '4',
        itemName: 'Test Item',
        suitability: FoodSuitability.GOOD,
        explanation: 'Test explanation',
        confidence: 0.8,
      };

      render(
        <TestWrapper>
          <ResultCard result={minimalResult} initialExpanded={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Test Item')).toBeTruthy();
      expect(screen.getByText('Test explanation')).toBeTruthy();
      expect(screen.queryByText('Questions to ask the staff:')).toBeNull();
      expect(screen.queryByText('Potential concerns:')).toBeNull();
    });

    it('handles very long item names', () => {
      const longNameResult: FoodAnalysisResult = {
        ...mockGoodResult,
        itemName: 'This is a very long menu item name that should be handled gracefully by the component',
      };

      render(
        <TestWrapper>
          <ResultCard result={longNameResult} />
        </TestWrapper>
      );

      expect(screen.getByText(longNameResult.itemName)).toBeTruthy();
    });

    it('handles zero confidence correctly', () => {
      const zeroConfidenceResult: FoodAnalysisResult = {
        ...mockGoodResult,
        confidence: 0,
      };

      render(
        <TestWrapper>
          <ResultCard result={zeroConfidenceResult} />
        </TestWrapper>
      );

      expect(screen.getByText('0% confident')).toBeTruthy();
    });
  });
});
