import { FoodAnalysisResult, FoodSuitability } from '@/types';

export const summarizeResults = (results: FoodAnalysisResult[]) => {
  return results.reduce(
    (acc, r) => {
      if (r.suitability === FoodSuitability.GOOD) acc.good += 1;
      else if (r.suitability === FoodSuitability.CAREFUL) acc.careful += 1;
      else if (r.suitability === FoodSuitability.AVOID) acc.avoid += 1;
      return acc;
    },
    { good: 0, careful: 0, avoid: 0 }
  );
};

export const getTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
  if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }
  if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
};

