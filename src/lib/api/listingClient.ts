// =============================================================================
// 실시간 매물 API 클라이언트
// 외부 매물 데이터 소스에서 현재 시장에 나와있는 매물을 조회
// =============================================================================

import { REGION_CENTER_COORDS } from '@/constants/regionCoords';
import { transformRawToListing } from '@/lib/utils/listingParser';
import { getCached, setCache, generateCacheKey } from './listingCache';
import type { ListingRoomRaw, LiveListing, LiveBatchRequest, LiveBatchResponse } from '@/types/listing';

// =============================================================================
// 설정
// =============================================================================

const REQUEST_DELAY = 500; // ms
const MAX_CALLS_PER_REQUEST = 8;

function getBaseUrl(): string {
  return process.env.LISTING_API_BASE_URL ?? '';
}

// =============================================================================
// BBox 변환
// =============================================================================

interface BBox {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
}

const BBOX_OFFSET = {
  lat: 0.025,
  lng: 0.03,
};

export function regionCodeToBbox(regionCode: string): BBox | null {
  const center = REGION_CENTER_COORDS[regionCode];
  if (!center) return null;

  return {
    sw: { lat: center.lat - BBOX_OFFSET.lat, lng: center.lng - BBOX_OFFSET.lng },
    ne: { lat: center.lat + BBOX_OFFSET.lat, lng: center.lng + BBOX_OFFSET.lng },
  };
}

// =============================================================================
// 필터 생성
// =============================================================================

function buildFilters(maxPrice: number): Record<string, unknown> {
  return {
    sellingTypeList: ['SELL'],
    isShortLease: false,
    isIncludeMaintenance: false,
    depositRange: { min: 0, max: 999999 },
    priceRange: { min: 0, max: 999999 },
    tradeRange: { min: 0, max: maxPrice },
    pyeongRange: { min: 0, max: 999999 },
    useApprovalDateRange: { min: 0, max: 999999 },
    householdNumRange: { min: 0, max: 999999 },
    parkingNumRange: { min: 0, max: 999999 },
    hasTakeTenant: false,
    dealTypeList: ['AGENT'],
  };
}

function buildHeaders(category: string): Record<string, string> {
  return {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'ko-KR',
    'd-api-version': '5.0.0',
    'd-call-type': 'web',
    'd-app-version': '1',
    'csrf': 'token',
    'referer': `${getBaseUrl()}/map/${category}`,
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  };
}

// =============================================================================
// 단일 카테고리 + bbox 호출
// =============================================================================

async function fetchListingsForBbox(
  bbox: BBox,
  category: string,
  maxPrice: number,
): Promise<ListingRoomRaw[]> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) return [];

  const filters = buildFilters(maxPrice);
  const bboxStr = JSON.stringify(bbox);
  const filtersStr = JSON.stringify(filters);

  // 캐시 확인
  const cacheKey = generateCacheKey(bboxStr, category, filtersStr);
  const cached = getCached<ListingRoomRaw[]>(cacheKey);
  if (cached) return cached;

  const url = new URL(`${baseUrl}/api/v5/room-list/category/${category}/bbox`);
  url.searchParams.set('bbox', bboxStr);
  url.searchParams.set('zoom', '14');
  url.searchParams.set('useMap', 'naver');
  url.searchParams.set('page', '1');
  url.searchParams.set('filters', filtersStr);

  const response = await fetch(url.toString(), {
    headers: buildHeaders(category),
  });

  if (!response.ok) {
    console.warn(`[listing] API 요청 실패: status=${response.status}, category=${category}`);
    return [];
  }

  const json = await response.json();

  if (json.code !== 200 || !json.result?.roomList) {
    console.warn(`[listing] API 응답 오류: code=${json.code}`);
    return [];
  }

  const rooms: ListingRoomRaw[] = json.result.roomList;

  // 캐시 저장
  setCache(cacheKey, rooms);

  return rooms;
}

// =============================================================================
// 딜레이 유틸
// =============================================================================

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// 일괄 조회 (메인 함수)
// =============================================================================

export async function fetchLiveListingsBatch(
  params: LiveBatchRequest,
): Promise<LiveBatchResponse> {
  const { regionCodes, categories, maxPrice } = params;

  const allListings: LiveListing[] = [];
  const failedRegions: string[] = [];
  let totalFetched = 0;
  let rateLimited = false;
  let callCount = 0;

  // 지역 수에 따라 카테고리 자동 축소
  const effectiveCategories =
    regionCodes.length <= 2
      ? categories
      : regionCodes.length <= 4
        ? categories.slice(0, 2)
        : categories.slice(0, 1);

  for (const regionCode of regionCodes) {
    const bbox = regionCodeToBbox(regionCode);
    if (!bbox) {
      failedRegions.push(regionCode);
      continue;
    }

    for (const category of effectiveCategories) {
      if (callCount >= MAX_CALLS_PER_REQUEST) {
        rateLimited = true;
        break;
      }

      try {
        if (callCount > 0) await delay(REQUEST_DELAY);

        const rooms = await fetchListingsForBbox(bbox, category, maxPrice);
        callCount++;
        totalFetched += rooms.length;

        const listings = rooms
          .map(transformRawToListing)
          .filter((l) => l.askingPrice > 0 && l.askingPrice <= maxPrice);

        allListings.push(...listings);
      } catch (err) {
        console.warn(`[listing] 조회 실패: region=${regionCode}, category=${category}`, err);
        failedRegions.push(regionCode);
      }
    }

    if (rateLimited) break;
  }

  // 가격순 정렬
  allListings.sort((a, b) => a.askingPrice - b.askingPrice);

  // 중복 제거 (같은 seq)
  const seen = new Set<number>();
  const unique = allListings.filter((l) => {
    if (seen.has(l.listingSeq)) return false;
    seen.add(l.listingSeq);
    return true;
  });

  console.log(
    `[listing] 완료: ${totalFetched}건 조회 → ${unique.length}건 필터링, 실패 ${failedRegions.length}건`,
  );

  return {
    listings: unique,
    meta: {
      totalFetched,
      totalFiltered: unique.length,
      failedRegions: [...new Set(failedRegions)],
      rateLimited,
    },
  };
}
