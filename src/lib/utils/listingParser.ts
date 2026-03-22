// =============================================================================
// 실시간 매물 데이터 파서
// 외부 API 응답을 앱 내부 타입으로 변환
// =============================================================================

import type { ListingRoomRaw, LiveListing } from '@/types/listing';

// =============================================================================
// 가격 파싱
// =============================================================================

/**
 * 가격 문자열 → 만원 단위 숫자 변환
 *
 * "9억000"     → 90000
 * "4억2,000"   → 42000
 * "8,500"      → 8500
 * "12억5,000"  → 125000
 * "1억"        → 10000
 * ""           → 0
 */
export function parsePriceTitle(priceTitle: string): number {
  if (!priceTitle) return 0;

  const cleaned = priceTitle.replace(/,/g, '').trim();

  let total = 0;

  const eokMatch = cleaned.match(/(\d+)억/);
  if (eokMatch) {
    total += parseInt(eokMatch[1], 10) * 10000;
  }

  // 억 뒤의 숫자 또는 억 없이 숫자만
  const afterEok = cleaned.split('억')[1];
  if (afterEok) {
    const manValue = afterEok.replace(/[^\d]/g, '');
    if (manValue) {
      total += parseInt(manValue, 10);
    }
  } else if (!eokMatch) {
    // 억 없이 숫자만 ("8500")
    const numOnly = cleaned.replace(/[^\d]/g, '');
    if (numOnly) {
      total += parseInt(numOnly, 10);
    }
  }

  return total;
}

// =============================================================================
// roomDesc 파싱
// =============================================================================

/**
 * roomDesc → 면적(m²)과 층수 파싱
 *
 * "9층, 82.58m², 관리비 20만" → { area: 82.58, floor: 9 }
 * "파싱 불가 문자열" → { area: null, floor: null }
 */
export function parseRoomDesc(roomDesc: string): {
  area: number | null;
  floor: number | null;
} {
  const areaMatch = roomDesc.match(/([\d.]+)\s*m[²2]/);
  const floorMatch = roomDesc.match(/(\d+)층/);

  return {
    area: areaMatch ? parseFloat(areaMatch[1]) : null,
    floor: floorMatch ? parseInt(floorMatch[1], 10) : null,
  };
}

// =============================================================================
// 매물 타입 매핑
// =============================================================================

/** roomTypeName → 내부 propertyType 변환 */
export function mapRoomType(
  roomTypeName: string,
): 'apartment' | 'villa' | 'officetel' {
  if (roomTypeName.includes('아파트')) return 'apartment';
  if (roomTypeName.includes('오피스텔')) return 'officetel';
  return 'villa';
}

// =============================================================================
// Raw → LiveListing 변환
// =============================================================================

/** 외부 API 원본 → 정제된 LiveListing 변환 */
export function transformRawToListing(raw: ListingRoomRaw): LiveListing {
  const { area, floor } = parseRoomDesc(raw.roomDesc);

  return {
    listingSeq: raw.seq,
    listingId: raw.id,
    name: raw.complexName,
    dongName: raw.dongName ?? '',
    roomTitle: raw.roomTitle,
    roomDesc: raw.roomDesc,
    propertyType: mapRoomType(raw.roomTypeName),
    askingPrice: parsePriceTitle(raw.priceTitle),
    priceDisplay: raw.priceTitle,
    lat: raw.randomLocation.lat,
    lng: raw.randomLocation.lng,
    area,
    floor,
    imgUrlList: raw.imgUrlList ?? [],
    thumbnailUrl: raw.imgUrlList?.[0] ?? null,
    isPano: raw.isPano ?? false,
    isOwnerAuth: raw.isOwnerAuth ?? false,
    isNaverVerify: raw.isNaverVerify ?? false,
    isQuick: raw.isQuick ?? false,
    source: 'live',
  };
}
