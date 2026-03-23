import { describe, it, expect } from 'vitest';

import {
  buildPriceDistribution,
  buildDongSummaries,
  buildAskingVsDealComparison,
  buildRegionalAnalytics,
} from './analytics';
import type { Property } from '@/types';
import type { LiveListing } from '@/types/listing';

// =============================================================================
// 테스트 헬퍼
// =============================================================================

function makeTx(dong: string, dealAmount: number): Property {
  return {
    dealAmount,
    buildYear: 2020,
    dealYear: 2025,
    dealMonth: 3,
    dealDay: 1,
    dong,
    name: `${dong}아파트`,
    area: 84,
    floor: 10,
    jibun: '123-4',
    regionCode: '11110',
    propertyType: 'apartment',
  };
}

function makeListing(dongName: string, askingPrice: number): LiveListing {
  return {
    listingSeq: 1,
    listingId: `listing-${dongName}-${askingPrice}`,
    name: `${dongName}매물`,
    dongName,
    roomTitle: '매물',
    roomDesc: '84m²',
    propertyType: 'apartment',
    askingPrice,
    priceDisplay: `${askingPrice}만`,
    lat: 37.5,
    lng: 127.0,
    area: 84,
    floor: 10,
    imgUrlList: [],
    thumbnailUrl: null,
    isPano: false,
    isOwnerAuth: false,
    isNaverVerify: false,
    isQuick: false,
    source: 'live',
  };
}

// =============================================================================
// buildPriceDistribution (가격 분포)
// =============================================================================

describe('buildPriceDistribution', () => {
  it('빈 데이터 → 빈 배열 반환', () => {
    const result = buildPriceDistribution([], []);
    expect(result).toEqual([]);
  });

  it('단일 가격 범위 → 하나의 버킷 생성', () => {
    const properties = [makeTx('역삼동', 50000), makeTx('역삼동', 52000)];
    const result = buildPriceDistribution(properties, []);

    expect(result.length).toBeGreaterThanOrEqual(1);
    const totalCount = result.reduce((sum, b) => sum + b.count, 0);
    expect(totalCount).toBe(2);
  });

  it('3억 미만 범위 → 5천만 단위 스텝', () => {
    const properties = [
      makeTx('역삼동', 10000), // 1억
      makeTx('역삼동', 15000), // 1.5억
      makeTx('역삼동', 20000), // 2억
    ];
    const result = buildPriceDistribution(properties, []);

    // range = 10000 < 30000 → step 5000
    for (const bucket of result) {
      expect(bucket.max - bucket.min).toBe(5000);
    }
  });

  it('3억~10억 범위 → 1억 단위 스텝', () => {
    const properties = [
      makeTx('역삼동', 30000), // 3억
      makeTx('역삼동', 60000), // 6억
    ];
    const result = buildPriceDistribution(properties, []);

    // range = 30000 → step 10000
    for (const bucket of result) {
      expect(bucket.max - bucket.min).toBe(10000);
    }
  });

  it('10억 이상 범위 → 2억 단위 스텝', () => {
    const properties = [
      makeTx('역삼동', 50000), // 5억
      makeTx('역삼동', 200000), // 20억
    ];
    const result = buildPriceDistribution(properties, []);

    // range = 150000 > 100000 → step 20000
    for (const bucket of result) {
      expect(bucket.max - bucket.min).toBe(20000);
    }
  });

  it('ratio 합이 1 이하 (반올림 허용)', () => {
    const properties = [
      makeTx('역삼동', 30000),
      makeTx('삼성동', 40000),
      makeTx('대치동', 50000),
    ];
    const result = buildPriceDistribution(properties, []);
    const totalRatio = result.reduce((sum, b) => sum + b.ratio, 0);

    expect(totalRatio).toBeCloseTo(1, 1);
  });

  it('실거래 + 호가 가격 모두 포함', () => {
    const properties = [makeTx('역삼동', 40000)];
    const listings = [makeListing('역삼동', 45000)];
    const result = buildPriceDistribution(properties, listings);

    const totalCount = result.reduce((sum, b) => sum + b.count, 0);
    expect(totalCount).toBe(2);
  });
});

// =============================================================================
// buildDongSummaries (동별 가격 요약)
// =============================================================================

describe('buildDongSummaries', () => {
  it('단일 동 → 정확한 평균 계산', () => {
    const properties = [
      makeTx('역삼동', 40000),
      makeTx('역삼동', 50000),
    ];
    const result = buildDongSummaries(properties, []);

    expect(result).toHaveLength(1);
    expect(result[0].dongName).toBe('역삼동');
    expect(result[0].avgDealPrice).toBe(45000);
    expect(result[0].avgAskingPrice).toBeNull();
    expect(result[0].dealCount).toBe(2);
    expect(result[0].listingCount).toBe(0);
  });

  it('여러 동 → dealCount 기준 내림차순 정렬', () => {
    const properties = [
      makeTx('삼성동', 60000),
      makeTx('역삼동', 40000),
      makeTx('역삼동', 50000),
      makeTx('역삼동', 45000),
    ];
    const result = buildDongSummaries(properties, []);

    expect(result[0].dongName).toBe('역삼동');
    expect(result[0].dealCount).toBe(3);
    expect(result[1].dongName).toBe('삼성동');
    expect(result[1].dealCount).toBe(1);
  });

  it('실거래만 있는 동 → avgAskingPrice null', () => {
    const properties = [makeTx('역삼동', 40000)];
    const result = buildDongSummaries(properties, []);

    expect(result[0].avgAskingPrice).toBeNull();
    expect(result[0].listingCount).toBe(0);
  });

  it('호가만 있는 동 → avgDealPrice 0, dealCount 0', () => {
    const listings = [
      makeListing('대치동', 80000),
      makeListing('대치동', 90000),
    ];
    const result = buildDongSummaries([], listings);

    expect(result).toHaveLength(1);
    expect(result[0].dongName).toBe('대치동');
    expect(result[0].avgDealPrice).toBe(0);
    expect(result[0].dealCount).toBe(0);
    expect(result[0].avgAskingPrice).toBe(85000);
    expect(result[0].listingCount).toBe(2);
  });

  it('동일 동에 실거래 + 호가 → 모두 집계', () => {
    const properties = [makeTx('역삼동', 40000)];
    const listings = [makeListing('역삼동', 45000)];
    const result = buildDongSummaries(properties, listings);

    expect(result[0].avgDealPrice).toBe(40000);
    expect(result[0].avgAskingPrice).toBe(45000);
    expect(result[0].dealCount).toBe(1);
    expect(result[0].listingCount).toBe(1);
  });
});

// =============================================================================
// buildAskingVsDealComparison (호가 vs 실거래가 비교)
// =============================================================================

describe('buildAskingVsDealComparison', () => {
  it('호가 데이터 없음 → null 반환', () => {
    const properties = [makeTx('역삼동', 40000)];
    const result = buildAskingVsDealComparison(properties, []);

    expect(result).toBeNull();
  });

  it('실거래 데이터 없음 → null 반환', () => {
    const listings = [makeListing('역삼동', 45000)];
    const result = buildAskingVsDealComparison([], listings);

    expect(result).toBeNull();
  });

  it('정상 데이터 → 올바른 premiumRate 계산', () => {
    const properties = [
      makeTx('역삼동', 40000),
      makeTx('삼성동', 60000),
    ];
    const listings = [
      makeListing('역삼동', 44000),
      makeListing('삼성동', 66000),
    ];
    const result = buildAskingVsDealComparison(properties, listings);

    expect(result).not.toBeNull();
    // avgDeal = (40000+60000)/2 = 50000
    expect(result!.avgDealPrice).toBe(50000);
    // avgAsking = (44000+66000)/2 = 55000
    expect(result!.avgAskingPrice).toBe(55000);
    // premiumRate = (55000-50000)/50000 * 100 = 10.0
    expect(result!.premiumRate).toBe(10.0);
  });

  it('급매 (호가 < 실거래가) → 음수 premiumRate', () => {
    const properties = [makeTx('역삼동', 50000)];
    const listings = [makeListing('역삼동', 45000)];
    const result = buildAskingVsDealComparison(properties, listings);

    expect(result).not.toBeNull();
    // premiumRate = (45000-50000)/50000 * 100 = -10.0
    expect(result!.premiumRate).toBe(-10.0);
  });

  it('동별 비교 → 양쪽 데이터 있는 동만 포함', () => {
    const properties = [
      makeTx('역삼동', 40000),
      makeTx('삼성동', 60000),
    ];
    const listings = [
      makeListing('역삼동', 44000),
      makeListing('대치동', 80000), // 실거래 없는 동
    ];
    const result = buildAskingVsDealComparison(properties, listings);

    expect(result).not.toBeNull();
    expect(result!.byDong).toHaveLength(1);
    expect(result!.byDong[0].dongName).toBe('역삼동');
    expect(result!.byDong[0].avgDeal).toBe(40000);
    expect(result!.byDong[0].avgAsking).toBe(44000);
    expect(result!.byDong[0].premiumRate).toBe(10.0);
  });
});

// =============================================================================
// buildRegionalAnalytics (지역 분석 통합)
// =============================================================================

describe('buildRegionalAnalytics', () => {
  it('빈 데이터 → 기본값 반환', () => {
    const result = buildRegionalAnalytics([], []);

    expect(result.priceDistribution).toEqual([]);
    expect(result.dongSummaries).toEqual([]);
    expect(result.askingVsDeal).toBeNull();
    expect(result.summary.totalDeals).toBe(0);
    expect(result.summary.totalListings).toBe(0);
    expect(result.summary.medianPrice).toBe(0);
    expect(result.summary.minPrice).toBe(0);
    expect(result.summary.maxPrice).toBe(0);
  });

  it('혼합 데이터 → 전체 통계 정확히 계산', () => {
    const properties = [
      makeTx('역삼동', 40000),
      makeTx('삼성동', 60000),
    ];
    const listings = [
      makeListing('역삼동', 45000),
      makeListing('삼성동', 65000),
    ];
    const result = buildRegionalAnalytics(properties, listings);

    expect(result.summary.totalDeals).toBe(2);
    expect(result.summary.totalListings).toBe(2);
    expect(result.summary.minPrice).toBe(40000);
    expect(result.summary.maxPrice).toBe(65000);
  });

  it('홀수 개 가격 → medianPrice 정확 계산', () => {
    const properties = [
      makeTx('역삼동', 30000),
      makeTx('삼성동', 50000),
      makeTx('대치동', 70000),
    ];
    const result = buildRegionalAnalytics(properties, []);

    // 정렬: [30000, 50000, 70000] → 중앙값 50000
    expect(result.summary.medianPrice).toBe(50000);
  });

  it('짝수 개 가격 → medianPrice 두 중앙값의 평균', () => {
    const properties = [
      makeTx('역삼동', 30000),
      makeTx('삼성동', 40000),
      makeTx('대치동', 60000),
      makeTx('서초동', 80000),
    ];
    const result = buildRegionalAnalytics(properties, []);

    // 정렬: [30000, 40000, 60000, 80000] → (40000+60000)/2 = 50000
    expect(result.summary.medianPrice).toBe(50000);
  });

  it('모든 하위 함수 결과 포함 확인', () => {
    const properties = [
      makeTx('역삼동', 40000),
      makeTx('역삼동', 50000),
    ];
    const listings = [makeListing('역삼동', 48000)];
    const result = buildRegionalAnalytics(properties, listings);

    expect(result.priceDistribution.length).toBeGreaterThan(0);
    expect(result.dongSummaries.length).toBeGreaterThan(0);
    expect(result.askingVsDeal).not.toBeNull();
    expect(result.summary.totalDeals).toBe(2);
    expect(result.summary.totalListings).toBe(1);
  });
});
