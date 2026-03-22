import { describe, it, expect } from 'vitest';

import type { Property } from '@/types';
import type { LiveListing } from '@/types/listing';

import {
  normalizeComplexName,
  calculatePremiumRate,
  comparePrices,
} from './priceComparison';

// =============================================================================
// 테스트 데이터
// =============================================================================

function makeTx(overrides: Partial<Property> = {}): Property {
  return {
    dealAmount: 80000,
    buildYear: 2020,
    dealYear: 2026,
    dealMonth: 3,
    dealDay: 10,
    dong: '대치동',
    name: '래미안대치팰리스',
    area: 84.99,
    floor: 15,
    jibun: '316',
    regionCode: '11680',
    propertyType: 'apartment',
    ...overrides,
  };
}

function makeListing(overrides: Partial<LiveListing> = {}): LiveListing {
  return {
    listingSeq: 1,
    listingId: 'abc123',
    name: '래미안대치팰리스',
    dongName: '대치동',
    roomTitle: '급매',
    roomDesc: '15층, 84.99m²',
    propertyType: 'apartment',
    askingPrice: 85000,
    priceDisplay: '8억5000',
    lat: 37.5,
    lng: 127.0,
    area: 84.99,
    floor: 15,
    imgUrlList: [],
    thumbnailUrl: null,
    isPano: false,
    isOwnerAuth: false,
    isNaverVerify: false,
    isQuick: false,
    source: 'live',
    ...overrides,
  };
}

// =============================================================================
// normalizeComplexName
// =============================================================================

describe('normalizeComplexName', () => {
  it('괄호 내용을 제거한다', () => {
    expect(normalizeComplexName('래미안대치팰리스(주상복합)')).toBe('래미안대치팰리스');
  });

  it('공백을 제거한다', () => {
    expect(normalizeComplexName('래미안 대치 팰리스')).toBe('래미안대치팰리스');
  });

  it('끝의 차수를 제거한다', () => {
    expect(normalizeComplexName('우정에쉐르2차')).toBe('우정에쉐르');
    expect(normalizeComplexName('힐스테이트3')).toBe('힐스테이트');
  });

  it('복합 케이스를 처리한다', () => {
    expect(normalizeComplexName('대치 우정에쉐르2(주상복합)')).toBe('대치우정에쉐르');
  });
});

// =============================================================================
// calculatePremiumRate
// =============================================================================

describe('calculatePremiumRate', () => {
  it('호가가 높으면 양수를 반환한다', () => {
    expect(calculatePremiumRate(110000, 100000)).toBe(10);
  });

  it('호가가 낮으면 음수를 반환한다 (급매)', () => {
    expect(calculatePremiumRate(95000, 100000)).toBe(-5);
  });

  it('동일하면 0을 반환한다', () => {
    expect(calculatePremiumRate(100000, 100000)).toBe(0);
  });

  it('실거래가 0이면 0을 반환한다', () => {
    expect(calculatePremiumRate(100000, 0)).toBe(0);
  });

  it('소수점 1자리까지 반환한다', () => {
    expect(calculatePremiumRate(106500, 100000)).toBe(6.5);
  });
});

// =============================================================================
// comparePrices
// =============================================================================

describe('comparePrices', () => {
  it('정확 매칭 시 high confidence', () => {
    const listing = makeListing();
    const txs = [makeTx()];

    const result = comparePrices(listing, txs);

    expect(result.matchConfidence).toBe('high');
    expect(result.recentDealPrice).toBe(80000);
    expect(result.premiumRate).not.toBeNull();
  });

  it('정규화 매칭 시 medium confidence', () => {
    const listing = makeListing({ name: '래미안대치팰리스(주상복합)' });
    const txs = [makeTx({ name: '래미안대치팰리스' })];

    const result = comparePrices(listing, txs);

    expect(result.matchConfidence).toBe('medium');
  });

  it('동 + 가격대 매칭 시 low confidence', () => {
    const listing = makeListing({ name: '다른아파트', askingPrice: 80000 });
    const txs = [makeTx({ name: '래미안대치팰리스', dealAmount: 75000 })];

    const result = comparePrices(listing, txs);

    expect(result.matchConfidence).toBe('low');
  });

  it('매칭 없으면 none', () => {
    const listing = makeListing({ dongName: '역삼동' });
    const txs = [makeTx({ dong: '대치동' })];

    const result = comparePrices(listing, txs);

    expect(result.matchConfidence).toBe('none');
    expect(result.recentDealPrice).toBeNull();
    expect(result.premiumRate).toBeNull();
  });

  it('최신 거래를 recentDealPrice로 사용한다', () => {
    const listing = makeListing();
    const txs = [
      makeTx({ dealAmount: 75000, dealYear: 2025, dealMonth: 12 }),
      makeTx({ dealAmount: 82000, dealYear: 2026, dealMonth: 2 }),
    ];

    const result = comparePrices(listing, txs);

    expect(result.recentDealPrice).toBe(82000);
  });

  it('평균 거래가를 계산한다', () => {
    const listing = makeListing();
    const txs = [
      makeTx({ dealAmount: 80000 }),
      makeTx({ dealAmount: 90000 }),
    ];

    const result = comparePrices(listing, txs);

    expect(result.avgDealPrice).toBe(85000);
  });
});
