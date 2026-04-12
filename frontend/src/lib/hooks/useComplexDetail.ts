'use client';

// =============================================================================
// 단지 상세 정보 클라이언트 훅
// 내부 API Route를 통해 단지 상세 데이터를 조회하고 캐싱
// =============================================================================

import { useState, useEffect } from 'react';
import type { ComplexDetail } from '@/types/listing';

// 클라이언트 메모리 캐시 (같은 complexId 재요청 방지)
const cache = new Map<string, ComplexDetail>();

interface UseComplexDetailResult {
  data: ComplexDetail | null;
  isLoading: boolean;
  error: string | null;
}

export function useComplexDetail(
  complexId: string | null,
): UseComplexDetailResult {
  const [data, setData] = useState<ComplexDetail | null>(
    complexId ? (cache.get(complexId) ?? null) : null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!complexId) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // 캐시 히트 시 fetch 생략
    const cached = cache.get(complexId);
    if (cached) {
      setData(cached);
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();

    async function fetchDetail() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/real-estate/complex/${encodeURIComponent(complexId!)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(
            body?.error ?? `요청 실패 (${response.status})`,
          );
        }

        const detail: ComplexDetail = await response.json();
        cache.set(complexId!, detail);
        setData(detail);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        const message =
          err instanceof Error
            ? err.message
            : '단지 정보를 불러오는 데 실패했습니다.';
        setError(message);
        setData(null);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    fetchDetail();

    return () => {
      controller.abort();
    };
  }, [complexId]);

  return { data, isLoading, error };
}
