import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeminiResponse, MenuInputType } from '@/types';

export type AnalysisCacheMeta = {
  inputType: MenuInputType;
  source?: string; // image uri, url, or snippet
};

export type AnalysisCacheEntry = {
  key: string;
  data: GeminiResponse;
  timestamp: number;
  expiresAt: number;
  meta?: AnalysisCacheMeta;
};

const PREFIX = 'wcie_cache_';
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function saveAnalysisToCache(
  response: GeminiResponse,
  meta: AnalysisCacheMeta
): Promise<string> {
  const ts = Date.now();
  const key = `${PREFIX}${response.requestId || 'req'}_${ts}`;
  const entry: AnalysisCacheEntry = {
    key,
    data: response,
    timestamp: ts,
    expiresAt: ts + TTL_MS,
    meta,
  };
  await AsyncStorage.setItem(key, JSON.stringify(entry));
  return key;
}

