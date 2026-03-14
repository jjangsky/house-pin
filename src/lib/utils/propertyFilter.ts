// =============================================================================
// 매물 필터링 및 변환 유틸리티
// 실거래 데이터를 구매력 기준으로 필터링하고 store용 타입으로 변환
// =============================================================================

import type { RealEstateTransaction } from '@/lib/api/molit';
import type { Property } from '@/types';

// =============================================================================
// 타입 정의
// =============================================================================

export interface PropertyFilterParams {
  transactions: RealEstateTransaction[];
  maxPrice: number;
  minArea?: number;
  maxArea?: number;
  propertyTypes?: string[];
}

// =============================================================================
// 필터링
// =============================================================================

/**
 * 구매력 범위 내 매물 필터링
 * maxPrice는 만원 단위 (dealAmount와 동일 단위)
 */
export function filterByAffordability(
  params: PropertyFilterParams,
): RealEstateTransaction[] {
  const { transactions, maxPrice, minArea, maxArea } = params;

  return transactions.filter((tx) => {
    // 가격 필터: 구매력 상한 이내
    if (tx.dealAmount > maxPrice) return false;

    // 최소 면적 필터
    if (minArea !== undefined && tx.area < minArea) return false;

    // 최대 면적 필터
    if (maxArea !== undefined && tx.area > maxArea) return false;

    return true;
  });
}

// =============================================================================
// 정렬
// =============================================================================

/**
 * 최신 거래순 정렬 (내림차순)
 */
export function sortByDate(
  transactions: RealEstateTransaction[],
): RealEstateTransaction[] {
  return [...transactions].sort((a, b) => {
    // 년도 비교
    if (a.dealYear !== b.dealYear) return b.dealYear - a.dealYear;
    // 월 비교
    if (a.dealMonth !== b.dealMonth) return b.dealMonth - a.dealMonth;
    // 일 비교
    return b.dealDay - a.dealDay;
  });
}

// =============================================================================
// 변환
// =============================================================================

/**
 * RealEstateTransaction -> Property 변환 (store용)
 */
export function toProperty(
  transaction: RealEstateTransaction,
  type: 'apartment' | 'villa' | 'officetel',
): Property {
  return {
    dealAmount: transaction.dealAmount,
    buildYear: transaction.buildYear,
    dealYear: transaction.dealYear,
    dealMonth: transaction.dealMonth,
    dealDay: transaction.dealDay,
    dong: transaction.dong,
    name: transaction.aptName,
    area: transaction.area,
    floor: transaction.floor,
    jibun: transaction.jibun,
    regionCode: transaction.regionCode,
    propertyType: type,
  };
}
