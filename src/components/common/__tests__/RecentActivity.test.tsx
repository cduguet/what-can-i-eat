import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider as PaperProvider } from 'react-native-paper';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { RecentActivity } from '../RecentActivity';
import { FoodSuitability, MenuInputType } from '@/types';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium' },
}));

jest.mock('@react-native-async-storage/async-storage');
const mockAsync = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <PaperProvider>{children}</PaperProvider>
  </ThemeProvider>
);

describe('RecentActivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders recent items from new cache prefix with metadata', async () => {
    const now = Date.now();
    const entry1 = {
      key: 'wcie_cache_req1',
      data: {
        success: true,
        results: [
          { itemId: '1', itemName: 'A', suitability: FoodSuitability.GOOD, explanation: '', confidence: 0.9 },
          { itemId: '2', itemName: 'B', suitability: FoodSuitability.CAREFUL, explanation: '', confidence: 0.8 },
        ],
        confidence: 0.9,
        message: 'ok',
        requestId: 'req1',
        processingTime: 100,
      },
      timestamp: now - 1000,
      expiresAt: now + 1000,
      meta: { inputType: MenuInputType.IMAGE, source: 'file://photo.jpg' },
    };
    const entry2 = {
      key: 'wcie_cache_req2',
      data: {
        success: true,
        results: [
          { itemId: '3', itemName: 'C', suitability: FoodSuitability.AVOID, explanation: '', confidence: 0.7 },
        ],
        confidence: 0.8,
        message: 'ok',
        requestId: 'req2',
        processingTime: 120,
      },
      timestamp: now - 500,
      expiresAt: now + 1000,
      meta: { inputType: MenuInputType.URL, source: 'https://example.com' },
    };

    mockAsync.getAllKeys.mockResolvedValue(['wcie_cache_req1', 'wcie_cache_req2']);
    mockAsync.multiGet.mockResolvedValue([
      ['wcie_cache_req1', JSON.stringify(entry1)],
      ['wcie_cache_req2', JSON.stringify(entry2)],
    ]);

    render(
      <Wrapper>
        <RecentActivity maxItems={3} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeTruthy();
      expect(screen.getByText('Camera Scan')).toBeTruthy();
      expect(screen.getByText('Website Menu')).toBeTruthy();
      expect(screen.getAllByText(/items analyzed/).length).toBeGreaterThanOrEqual(2);
    });
  });

  it('renders items from secure service legacy prefix without metadata', async () => {
    const now = Date.now();
    const entry = {
      key: 'menu_analysis_cache_req',
      data: {
        success: true,
        results: [
          { itemId: '1', itemName: 'A', suitability: FoodSuitability.GOOD, explanation: '', confidence: 0.9 },
        ],
        confidence: 0.9,
        message: 'ok',
        requestId: 'req',
        processingTime: 100,
      },
      timestamp: now - 1000,
      expiresAt: now + 1000,
    };

    mockAsync.getAllKeys.mockResolvedValue(['menu_analysis_cache_req']);
    mockAsync.multiGet.mockResolvedValue([
      ['menu_analysis_cache_req', JSON.stringify(entry)],
    ]);

    render(
      <Wrapper>
        <RecentActivity />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeTruthy();
      expect(screen.getByText('Menu Analysis')).toBeTruthy();
      expect(screen.getByText(/1 items analyzed|1 item analyzed/)).toBeTruthy();
    });
  });

  it('falls back to legacy cached_analyses array', async () => {
    const legacy = [
      {
        key: 'legacy-1',
        results: [
          { itemId: '1', itemName: 'X', suitability: FoodSuitability.CAREFUL, explanation: '', confidence: 0.7 },
          { itemId: '2', itemName: 'Y', suitability: FoodSuitability.AVOID, explanation: '', confidence: 0.6 },
        ],
        cachedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        menuInput: { type: MenuInputType.TEXT, data: 'abc', timestamp: new Date().toISOString() },
      },
    ];

    mockAsync.getAllKeys.mockResolvedValue([]);
    mockAsync.getItem.mockImplementation(async (key: string) => (key === 'cached_analyses' ? JSON.stringify(legacy) : null));

    render(
      <Wrapper>
        <RecentActivity />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeTruthy();
      expect(screen.getByText('Text Analysis')).toBeTruthy();
      expect(screen.getByText(/2 items analyzed/)).toBeTruthy();
    });
  });
});

