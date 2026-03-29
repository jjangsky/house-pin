// =============================================================================
// 급매 탐지 엔진
// 실거래 데이터와 매물 호가를 비교하여 급매 점수를 산출
// =============================================================================

import type { Property } from '@/types';
import type { LiveListing } from '@/types/listing';
import type { BargainScore, BargainFactor } from '@/types/bargain';
import { comparePrices, normalizeComplexName } from './priceComparison';

// =============================================================================
// 점수 기준 상수
// =============================================================================

const MAX_PRICE_GAP_SCORE = 40;
const MAX_LOWEST_SCORE = 30;
const MAX_MARKET_SCORE = 30;

// =============================================================================
// 등급 매핑
// =============================================================================

function assignGrade(score: number): BargainScore['grade'] {
  if (score >= 80) return 'hot';
  if (score >= 60) return 'good';
  if (score >= 40) return 'normal';
  return 'overpriced';
}

// =============================================================================
// 요소별 점수 계산
// =============================================================================

/**
 * 가격 괴리율 점수 (40점 만점)
 * 호가가 실거래가 대비 얼마나 저렴한지 평가
 */
function scorePriceGap(gapPercent: number): number {
  if (gapPercent <= -10) return MAX_PRICE_GAP_SCORE;
  if (gapPercent <= -5) return 30;
  if (gapPercent <= 0) return 20;
  if (gapPercent <= 5) return 10;
  return 0;
}

/**
 * 같은 단지 내 최저가 점수 (30점 만점)
 * 동일 단지 매물 중 가격 순위 평가
 */
function scoreLowestInComplex(
  listing: LiveListing,
  allListings: LiveListing[],
): { score: number; rank: number; totalInComplex: number } {
  const normalizedName = normalizeComplexName(listing.name);

  const complexListings = allListings
    .filter(
      (l) =>
        normalizeComplexName(l.name) === normalizedName &&
        l.dongName === listing.dongName,
    )
    .sort((a, b) => a.askingPrice - b.askingPrice);

  const totalInComplex = complexListings.length;

  if (totalInComplex <= 1) {
    // 단지 내 유일한 매물이면 최저가로 간주
    return { score: MAX_LOWEST_SCORE, rank: 1, totalInComplex };
  }

  const rank =
    complexListings.findIndex((l) => l.listingId === listing.listingId) + 1;

  if (rank === 1) return { score: MAX_LOWEST_SCORE, rank, totalInComplex };
  if (rank <= 3) return { score: 15, rank, totalInComplex };
  return { score: 0, rank, totalInComplex };
}

/**
 * 시장 평균 대비 점수 (30점 만점)
 * 동일 지역/면적 매물 대비 가격 위치 평가
 */
function scoreMarketPosition(
  listing: LiveListing,
  allListings: LiveListing[],
): { score: number; percentile: number; totalComparable: number } {
  // 같은 동 + 유사 면적(±10m²) 매물 필터
  const comparable = allListings.filter((l) => {
    if (l.dongName !== listing.dongName) return false;
    if (listing.area == null || l.area == null) return l.dongName === listing.dongName;
    return Math.abs(l.area - listing.area) <= 10;
  });

  const totalComparable = comparable.length;

  if (totalComparable <= 1) {
    return { score: 10, percentile: 50, totalComparable };
  }

  const sorted = [...comparable].sort((a, b) => a.askingPrice - b.askingPrice);
  const position = sorted.findIndex((l) => l.listingId === listing.listingId);
  const percentile = ((position + 1) / totalComparable) * 100;

  if (percentile <= 10) return { score: MAX_MARKET_SCORE, percentile, totalComparable };
  if (percentile <= 25) return { score: 20, percentile, totalComparable };
  if (percentile <= 50) return { score: 10, percentile, totalComparable };
  return { score: 0, percentile, totalComparable };
}

// =============================================================================
// 요약 생성
// =============================================================================

function buildSummary(
  gapPercent: number,
  lowestRank: number,
  totalInComplex: number,
  hasTransaction: boolean,
): string {
  const parts: string[] = [];

  if (hasTransaction) {
    if (gapPercent < 0) {
      parts.push(`실거래가 대비 ${Math.abs(Math.round(gapPercent * 10) / 10)}% 저렴`);
    } else if (gapPercent > 0) {
      parts.push(`실거래가 대비 ${Math.round(gapPercent * 10) / 10}% 높음`);
    } else {
      parts.push('실거래가 수준');
    }
  }

  if (totalInComplex > 1) {
    parts.push(`같은 단지 매물 ${totalInComplex}개 중 ${lowestRank}위`);
  }

  return parts.length > 0 ? parts.join(', ') : '비교 데이터 부족';
}

// =============================================================================
// 메인 계산 함수
// =============================================================================

/**
 * 매물의 급매 점수를 계산
 * @param listing - 평가 대상 매물
 * @param transactions - 실거래 데이터 목록
 * @param allListings - 같은 조회 결과의 전체 매물 목록 (단지/시장 비교용)
 */
export function calculateBargainScore(
  listing: LiveListing,
  transactions: Property[],
  allListings: LiveListing[] = [],
): BargainScore {
  const factors: BargainFactor[] = [];

  // 실거래 매칭
  const comparison = comparePrices(listing, transactions);
  const hasTransaction =
    comparison.recentDealPrice !== null && comparison.matchConfidence !== 'none';

  // 1. 가격 괴리율
  let gapPercent = 0;
  let gapAmount = 0;
  let recentDealPrice = 0;
  let priceGapScore = 10; // 매칭 없으면 기본 10점 (중립)

  if (hasTransaction && comparison.recentDealPrice !== null) {
    recentDealPrice = comparison.recentDealPrice;
    gapAmount = listing.askingPrice - recentDealPrice;
    gapPercent = (gapAmount / recentDealPrice) * 100;
    priceGapScore = scorePriceGap(gapPercent);
  }

  factors.push({
    name: '가격 괴리율',
    score: priceGapScore,
    description: hasTransaction
      ? `호가가 실거래가 대비 ${gapPercent >= 0 ? '+' : ''}${Math.round(gapPercent * 10) / 10}%`
      : '매칭 실거래 데이터 없음',
  });

  // 2. 같은 단지 내 최저가
  const listingsForComplex =
    allListings.length > 0 ? allListings : [listing];
  const { score: lowestScore, rank, totalInComplex } = scoreLowestInComplex(
    listing,
    listingsForComplex,
  );

  factors.push({
    name: '단지 내 최저가',
    score: lowestScore,
    description:
      totalInComplex > 1
        ? `같은 단지 ${totalInComplex}개 매물 중 ${rank}위`
        : '단지 내 유일 매물',
  });

  // 3. 시장 평균 대비
  const listingsForMarket =
    allListings.length > 0 ? allListings : [listing];
  const {
    score: marketScore,
    percentile,
    totalComparable,
  } = scoreMarketPosition(listing, listingsForMarket);

  factors.push({
    name: '시장 평균 대비',
    score: marketScore,
    description:
      totalComparable > 1
        ? `동일 지역 유사 면적 매물 중 하위 ${Math.round(percentile)}%`
        : '비교 가능 매물 부족',
  });

  const totalScore = priceGapScore + lowestScore + marketScore;
  const clampedScore = Math.max(0, Math.min(100, totalScore));

  return {
    score: clampedScore,
    grade: assignGrade(clampedScore),
    priceGapPercent: Math.round(gapPercent * 10) / 10,
    priceGapAmount: gapAmount,
    recentDealPrice,
    listingPrice: listing.askingPrice,
    factors,
    summary: buildSummary(gapPercent, rank, totalInComplex, hasTransaction),
  };
}
