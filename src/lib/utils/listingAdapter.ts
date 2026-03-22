// =============================================================================
// 실시간 매물 → Property 어댑터
// 기존 컴포넌트(AffordabilityAnalysis, RecommendedLoanProducts 등)를 재사용하기 위해
// LiveListing을 Property 형태로 변환
// =============================================================================

import type { Property } from '@/types';
import type { LiveListing } from '@/types/listing';

export function liveListingToProperty(listing: LiveListing): Property {
  return {
    name: listing.name,
    dealAmount: listing.askingPrice,
    area: listing.area ?? 0,
    floor: listing.floor ?? 0,
    dong: listing.dongName,
    propertyType: listing.propertyType,
    lat: listing.lat,
    lng: listing.lng,
    buildYear: 0,
    dealYear: new Date().getFullYear(),
    dealMonth: new Date().getMonth() + 1,
    dealDay: new Date().getDate(),
    jibun: '',
    regionCode: '',
  };
}

/** LiveListing slug 생성 (live- 접두사로 기존 매물과 구분) */
export function generateLiveSlug(listing: LiveListing): string {
  return `live-${listing.listingSeq}`;
}

/** slug가 실시간 매물인지 확인 */
export function isLiveSlug(slug: string): boolean {
  return slug.startsWith('live-');
}

/** slug에서 listingSeq 추출 */
export function parseLiveSlug(slug: string): number | null {
  const match = slug.match(/^live-(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}
