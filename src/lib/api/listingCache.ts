// =============================================================================
// 실시간 매물 API 응답 메모리 캐시
// =============================================================================

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 5 * 60 * 1000; // 5분
const MAX_CACHE_SIZE = 50;

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache<T>(key: string, data: T): void {
  // LRU: 최대 크기 초과 시 가장 오래된 항목 제거
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

export function generateCacheKey(
  bbox: string,
  category: string,
  filters: string,
): string {
  return `${category}:${bbox}:${filters}`;
}
