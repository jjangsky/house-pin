// =============================================================================
// 매물 유틸리티 — slug 생성/파싱, 유사도 계산
// =============================================================================

import type { Property } from '@/types';

// =============================================================================
// Slug 생성 / 파싱
// =============================================================================

/**
 * Property → URL slug 변환
 * 형식: {regionCode}-{name}-{dealAmount}-{area}-{floor}
 */
export function generatePropertySlug(p: Property): string {
  const parts = [
    p.regionCode,
    p.name,
    String(p.dealAmount),
    String(p.area),
    String(p.floor),
  ];
  return parts.map(encodeURIComponent).join('-');
}

interface ParsedSlug {
  regionCode: string;
  name: string;
  dealAmount: number;
  area: number;
  floor: number;
}

/**
 * URL slug → 파싱된 매물 식별 정보
 * 실패 시 null 반환
 */
export function parsePropertySlug(slug: string): ParsedSlug | null {
  // name에 하이픈이 포함될 수 있으므로 앞뒤 고정 필드를 먼저 분리
  const decoded = decodeURIComponent(slug);
  const parts = decoded.split('-');

  // 최소 5개 파트: regionCode, name(1+), dealAmount, area, floor
  if (parts.length < 5) return null;

  const regionCode = parts[0];
  const floor = Number(parts[parts.length - 1]);
  const area = Number(parts[parts.length - 2]);
  const dealAmount = Number(parts[parts.length - 3]);
  const name = parts.slice(1, parts.length - 3).join('-');

  if (!regionCode || !name || isNaN(dealAmount) || isNaN(area) || isNaN(floor)) {
    return null;
  }

  return { regionCode, name, dealAmount, area, floor };
}

/**
 * properties 배열에서 slug와 매칭되는 매물 찾기
 */
export function findPropertyBySlug(
  properties: Property[],
  slug: string,
): Property | null {
  const parsed = parsePropertySlug(slug);
  if (!parsed) return null;

  return (
    properties.find(
      (p) =>
        p.regionCode === parsed.regionCode &&
        p.name === parsed.name &&
        p.dealAmount === parsed.dealAmount &&
        p.area === parsed.area &&
        p.floor === parsed.floor,
    ) ?? null
  );
}

// =============================================================================
// 유사도 계산
// =============================================================================

const SIMILARITY_WEIGHTS = {
  dong: 30,
  propertyType: 20,
  area: 25,
  price: 25,
} as const;

/**
 * 두 매물 간 유사도 점수 계산 (0~100)
 */
export function calculateSimilarity(
  target: Property,
  candidate: Property,
): number {
  let score = 0;

  // 같은 동: 30점
  if (target.dong === candidate.dong) {
    score += SIMILARITY_WEIGHTS.dong;
  }

  // 같은 건물 타입: 20점
  if (target.propertyType === candidate.propertyType) {
    score += SIMILARITY_WEIGHTS.propertyType;
  }

  // 면적 유사도: 10% 이내 만점, 비례 감소
  if (target.area > 0 && candidate.area > 0) {
    const areaDiff = Math.abs(target.area - candidate.area) / target.area;
    const areaScore = Math.max(0, 1 - areaDiff / 0.3); // 30% 차이에서 0점
    score += areaScore * SIMILARITY_WEIGHTS.area;
  }

  // 가격 유사도: 20% 이내 만점, 비례 감소
  if (target.dealAmount > 0 && candidate.dealAmount > 0) {
    const priceDiff =
      Math.abs(target.dealAmount - candidate.dealAmount) / target.dealAmount;
    const priceScore = Math.max(0, 1 - priceDiff / 0.5); // 50% 차이에서 0점
    score += priceScore * SIMILARITY_WEIGHTS.price;
  }

  return Math.round(score * 10) / 10;
}

/**
 * 유사 매물 상위 N개 반환 (자기 자신 제외)
 */
export function findSimilarProperties(
  target: Property,
  allProperties: Property[],
  count = 5,
): Property[] {
  return allProperties
    .filter(
      (p) =>
        !(
          p.regionCode === target.regionCode &&
          p.name === target.name &&
          p.dealAmount === target.dealAmount &&
          p.area === target.area &&
          p.floor === target.floor
        ),
    )
    .map((p) => ({ property: p, score: calculateSimilarity(target, p) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((item) => item.property);
}
