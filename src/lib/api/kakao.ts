// =============================================================================
// 카카오 주소 검색 API 클라이언트
// 법정동 + 지번 주소를 좌표(lat/lng)로 변환
// =============================================================================

import { API_CONFIG } from './config';

// =============================================================================
// 타입 정의
// =============================================================================

interface KakaoAddressDocument {
  x: string; // lng
  y: string; // lat
}

interface KakaoAddressResponse {
  documents: KakaoAddressDocument[];
}

export interface GeocodingResult {
  lat: number;
  lng: number;
}

// =============================================================================
// 주소 → 좌표 변환
// =============================================================================

/**
 * 카카오 주소 검색 API로 좌표를 조회한다.
 * 결과가 없으면 null을 반환한다.
 */
async function searchAddress(
  query: string,
  apiKey: string,
): Promise<GeocodingResult | null> {
  const url = new URL(
    `${API_CONFIG.KAKAO.REST_BASE_URL}${API_CONFIG.KAKAO.ENDPOINTS.ADDRESS_SEARCH}`,
  );
  url.searchParams.set('query', query);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `KakaoAK ${apiKey}`,
    },
  });

  if (!response.ok) {
    console.warn(
      `[kakao] 주소 검색 실패: status=${response.status}, query="${query}"`,
    );
    return null;
  }

  const data: KakaoAddressResponse = await response.json();

  if (data.documents.length === 0) {
    return null;
  }

  const doc = data.documents[0];
  return {
    lat: Number(doc.y),
    lng: Number(doc.x),
  };
}

// =============================================================================
// 배치 지오코딩 (캐싱 + 동시성 제한)
// =============================================================================

interface GeocodingTarget {
  /** 지오코딩에 사용할 주소 문자열 */
  address: string;
}

/**
 * 주소 목록에 대해 좌표를 일괄 조회한다.
 * 동일 주소는 캐싱하여 API 호출 횟수를 줄인다.
 *
 * @param targets - 주소가 포함된 대상 배열
 * @param concurrency - 동시 API 호출 수 (기본 5)
 * @returns 주소를 키로 하는 좌표 맵
 */
export async function batchGeocode(
  targets: GeocodingTarget[],
  concurrency = 5,
): Promise<Map<string, GeocodingResult>> {
  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    console.warn('[kakao] KAKAO_REST_API_KEY 미설정 -- 지오코딩을 건너뜁니다.');
    return new Map();
  }

  // 유니크 주소 추출
  const uniqueAddresses = [...new Set(targets.map((t) => t.address))].filter(
    (addr) => addr.trim().length > 0,
  );

  const cache = new Map<string, GeocodingResult>();

  // 동시성 제한하며 배치 처리
  for (let i = 0; i < uniqueAddresses.length; i += concurrency) {
    const batch = uniqueAddresses.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(async (address) => {
        const result = await searchAddress(address, apiKey);
        return { address, result };
      }),
    );

    for (const { address, result } of results) {
      if (result) {
        cache.set(address, result);
      }
    }
  }

  console.log(
    `[kakao] 지오코딩 완료: ${cache.size}/${uniqueAddresses.length}건 성공`,
  );

  return cache;
}

/**
 * 시군구 이름 + 법정동 + 지번으로 주소 문자열을 생성한다.
 */
export function buildAddress(
  sigunguName: string,
  dong: string,
  jibun: string,
): string {
  const parts = [sigunguName, dong, jibun].filter((p) => p.trim().length > 0);
  return parts.join(' ');
}
