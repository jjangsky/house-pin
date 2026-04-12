// =============================================================================
// 시세 비교 엔진
// 실거래 데이터와 현재 매물 호가를 매칭하여 호가율 계산
// =============================================================================

import type { Property } from '@/types';
import type { LiveListing } from '@/types/listing';

// =============================================================================
// 타입 정의
// =============================================================================

export interface PriceComparison {
  recentDealPrice: number | null;
  avgDealPrice: number | null;
  askingPrice: number;
  premiumRate: number | null;
  matchCount: number;
  matchConfidence: 'high' | 'medium' | 'low' | 'none';
}

// =============================================================================
// 이름 정규화
// =============================================================================

export function normalizeComplexName(name: string): string {
  return name
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, '')
    .replace(/[0-9]+차?$/g, '')
    .trim();
}

// =============================================================================
// 호가율 계산
// =============================================================================

/**
 * 호가율 = (호가 - 실거래가) / 실거래가 * 100
 * 양수: 호가 > 실거래 (일반적)
 * 음수: 호가 < 실거래 (급매 가능성)
 */
export function calculatePremiumRate(
  askingPrice: number,
  recentDealPrice: number,
): number {
  if (recentDealPrice === 0) return 0;
  return Math.round(((askingPrice - recentDealPrice) / recentDealPrice) * 1000) / 10;
}

// =============================================================================
// 매칭 로직
// =============================================================================

/**
 * 실시간 매물에 대해 실거래 데이터에서 매칭되는 거래를 찾고 호가율을 계산
 */
export function comparePrices(
  listing: LiveListing,
  transactions: Property[],
): PriceComparison {
  // 1단계: complexName 정확 일치 + dongName 일치
  const exactMatches = transactions.filter(
    (tx) => tx.name === listing.name && tx.dong === listing.dongName,
  );

  if (exactMatches.length > 0) {
    return buildComparison(listing.askingPrice, exactMatches, 'high');
  }

  // 2단계: 정규화된 이름 + dongName 일치
  const normalizedListingName = normalizeComplexName(listing.name);
  const normalizedMatches = transactions.filter(
    (tx) =>
      normalizeComplexName(tx.name) === normalizedListingName &&
      tx.dong === listing.dongName,
  );

  if (normalizedMatches.length > 0) {
    return buildComparison(listing.askingPrice, normalizedMatches, 'medium');
  }

  // 3단계: dongName만 일치 + 가격대 유사 (±30%)
  const dongMatches = transactions.filter((tx) => {
    if (tx.dong !== listing.dongName) return false;
    const priceDiff = Math.abs(tx.dealAmount - listing.askingPrice) / listing.askingPrice;
    return priceDiff <= 0.3;
  });

  if (dongMatches.length > 0) {
    return buildComparison(listing.askingPrice, dongMatches, 'low');
  }

  return {
    recentDealPrice: null,
    avgDealPrice: null,
    askingPrice: listing.askingPrice,
    premiumRate: null,
    matchCount: 0,
    matchConfidence: 'none',
  };
}

function buildComparison(
  askingPrice: number,
  matches: Property[],
  confidence: 'high' | 'medium' | 'low',
): PriceComparison {
  // 최신 거래 찾기
  const sorted = [...matches].sort((a, b) => {
    if (a.dealYear !== b.dealYear) return b.dealYear - a.dealYear;
    if (a.dealMonth !== b.dealMonth) return b.dealMonth - a.dealMonth;
    return b.dealDay - a.dealDay;
  });

  const recentDealPrice = sorted[0].dealAmount;
  const avgDealPrice =
    Math.round(matches.reduce((sum, tx) => sum + tx.dealAmount, 0) / matches.length);

  return {
    recentDealPrice,
    avgDealPrice,
    askingPrice,
    premiumRate: calculatePremiumRate(askingPrice, recentDealPrice),
    matchCount: matches.length,
    matchConfidence: confidence,
  };
}
