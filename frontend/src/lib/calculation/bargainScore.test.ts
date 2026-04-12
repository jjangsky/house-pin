import { describe, it, expect } from 'vitest';

import type { Property } from '@/types';
import type { LiveListing } from '@/types/listing';

import { calculateBargainScore } from './bargainScore';

// =============================================================================
// 테스트 데이터 팩토리
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
    listingId: 'listing-1',
    name: '래미안대치팰리스',
    dongName: '대치동',
    roomTitle: '급매',
    roomDesc: '15층, 84.99m²',
    propertyType: 'apartment',
    askingPrice: 80000,
    priceDisplay: '8억',
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
// Hot deal: 호가가 실거래가 대비 10% 이상 저렴 → score >= 80
// =============================================================================

describe('급매 (Hot deal)', () => {
  it('호가가 실거래가 대비 10%+ 저렴하고 단지 최저가이면 score >= 80', () => {
    const listing = makeListing({ askingPrice: 70000 }); // 80000 대비 -12.5%
    const txs = [makeTx({ dealAmount: 80000 })];

    const result = calculateBargainScore(listing, txs, [listing]);

    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.grade).toBe('hot');
  });

  it('hot 등급에 적절한 요약 생성', () => {
    const listing = makeListing({ askingPrice: 70000 });
    const txs = [makeTx({ dealAmount: 80000 })];

    const result = calculateBargainScore(listing, txs, [listing]);

    expect(result.summary).toContain('저렴');
    expect(result.priceGapPercent).toBeLessThan(0);
  });
});

// =============================================================================
// Good deal: 호가가 5-10% 저렴 → score 60-79
// =============================================================================

describe('좋은 가격 (Good deal)', () => {
  it('호가가 실거래가 대비 5-10% 저렴하면 score 60-79', () => {
    // -7.5% 가격차 → 30점 + 단지최저가 30점 = 60+
    const listing = makeListing({ askingPrice: 74000 }); // 80000 대비 -7.5%
    const txs = [makeTx({ dealAmount: 80000 })];

    const result = calculateBargainScore(listing, txs, [listing]);

    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.score).toBeLessThan(80);
    expect(result.grade).toBe('good');
  });
});

// =============================================================================
// Normal: 시세 수준 → score 40-59
// =============================================================================

describe('적정가 (Normal)', () => {
  it('호가가 시세 수준이면 score 40-59', () => {
    // -3% 가격차 → 20점 + 단지 2위 → 15점 + 시장 하위25% → 10점 = 45
    const listing = makeListing({ askingPrice: 77600 }); // 80000 대비 -3%
    const txs = [makeTx({ dealAmount: 80000 })];
    const cheaperListing = makeListing({
      listingId: 'listing-cheap',
      askingPrice: 76000,
    });
    const expensiveListing1 = makeListing({
      listingId: 'listing-exp1',
      askingPrice: 82000,
    });
    const expensiveListing2 = makeListing({
      listingId: 'listing-exp2',
      askingPrice: 85000,
    });
    const allListings = [cheaperListing, listing, expensiveListing1, expensiveListing2];

    const result = calculateBargainScore(listing, txs, allListings);

    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(result.score).toBeLessThan(60);
    expect(result.grade).toBe('normal');
  });
});

// =============================================================================
// Overpriced: 호가가 5%+ 높음 → score < 40
// =============================================================================

describe('시세 이상 (Overpriced)', () => {
  it('호가가 실거래가 대비 5%+ 높으면 score < 40', () => {
    // +10% → 0점 가격괴리
    const listing = makeListing({
      listingId: 'listing-exp',
      askingPrice: 88000,
    }); // 80000 대비 +10%
    const txs = [makeTx({ dealAmount: 80000 })];
    // 단지 내 최저가 아님 + 시장 상위
    const cheaperListing = makeListing({
      listingId: 'listing-1',
      askingPrice: 78000,
    });
    const cheaperListing2 = makeListing({
      listingId: 'listing-2',
      askingPrice: 79000,
    });
    const cheaperListing3 = makeListing({
      listingId: 'listing-3',
      askingPrice: 80000,
    });
    const cheaperListing4 = makeListing({
      listingId: 'listing-4',
      askingPrice: 81000,
    });
    const allListings = [
      cheaperListing,
      cheaperListing2,
      cheaperListing3,
      cheaperListing4,
      listing,
    ];

    const result = calculateBargainScore(listing, txs, allListings);

    expect(result.score).toBeLessThan(40);
    expect(result.grade).toBe('overpriced');
  });
});

// =============================================================================
// 등급 매핑 정확성
// =============================================================================

describe('등급 매핑', () => {
  it('score 80+ → hot', () => {
    const listing = makeListing({ askingPrice: 68000 });
    const txs = [makeTx({ dealAmount: 80000 })];
    const result = calculateBargainScore(listing, txs, [listing]);
    expect(result.grade).toBe('hot');
  });

  it('score 60-79 → good', () => {
    const listing = makeListing({ askingPrice: 74000 });
    const txs = [makeTx({ dealAmount: 80000 })];
    const result = calculateBargainScore(listing, txs, [listing]);
    expect(result.grade).toBe('good');
  });

  it('score < 40 → overpriced', () => {
    const listing = makeListing({
      listingId: 'listing-exp',
      askingPrice: 95000,
    });
    const txs = [makeTx({ dealAmount: 80000 })];
    const cheaper = makeListing({ listingId: 'listing-1', askingPrice: 78000 });
    const cheaper2 = makeListing({ listingId: 'listing-2', askingPrice: 79000 });
    const cheaper3 = makeListing({ listingId: 'listing-3', askingPrice: 80000 });
    const cheaper4 = makeListing({ listingId: 'listing-4', askingPrice: 81000 });
    const result = calculateBargainScore(listing, txs, [
      cheaper,
      cheaper2,
      cheaper3,
      cheaper4,
      listing,
    ]);
    expect(result.grade).toBe('overpriced');
  });
});

// =============================================================================
// Factor 분해
// =============================================================================

describe('Factor 분해', () => {
  it('3개의 factor를 반환한다', () => {
    const listing = makeListing();
    const txs = [makeTx()];
    const result = calculateBargainScore(listing, txs);
    expect(result.factors).toHaveLength(3);
  });

  it('각 factor에 name, score, description이 있다', () => {
    const listing = makeListing();
    const txs = [makeTx()];
    const result = calculateBargainScore(listing, txs);

    for (const factor of result.factors) {
      expect(factor.name).toBeTruthy();
      expect(typeof factor.score).toBe('number');
      expect(factor.description).toBeTruthy();
    }
  });

  it('factor 이름이 올바르다', () => {
    const listing = makeListing();
    const txs = [makeTx()];
    const result = calculateBargainScore(listing, txs);

    const names = result.factors.map((f) => f.name);
    expect(names).toContain('가격 괴리율');
    expect(names).toContain('단지 내 최저가');
    expect(names).toContain('시장 평균 대비');
  });

  it('factor 점수 합이 전체 점수와 같다', () => {
    const listing = makeListing({ askingPrice: 74000 });
    const txs = [makeTx({ dealAmount: 80000 })];
    const result = calculateBargainScore(listing, txs, [listing]);

    const factorSum = result.factors.reduce((sum, f) => sum + f.score, 0);
    expect(factorSum).toBe(result.score);
  });
});

// =============================================================================
// 매칭 실거래 없음
// =============================================================================

describe('매칭 실거래 없음', () => {
  it('실거래 데이터 없으면 normal 이하 등급', () => {
    const listing = makeListing({ dongName: '역삼동' });
    const txs = [makeTx({ dong: '대치동' })]; // 다른 동이라 매칭 안 됨

    const result = calculateBargainScore(listing, txs, [listing]);

    // 가격괴리 10(기본) + 단지최저가 30 + 시장 10 = 50 → normal
    expect(result.grade).toBe('normal');
    expect(result.recentDealPrice).toBe(0);
  });

  it('실거래 데이터가 빈 배열이어도 동작', () => {
    const listing = makeListing();
    const result = calculateBargainScore(listing, [], [listing]);

    expect(result.grade).toBeDefined();
    expect(result.factors).toHaveLength(3);
    expect(result.summary).toContain('비교 데이터 부족');
  });
});

// =============================================================================
// 요약 텍스트 생성
// =============================================================================

describe('요약 텍스트', () => {
  it('저렴한 경우 "저렴" 포함', () => {
    const listing = makeListing({ askingPrice: 70000 });
    const txs = [makeTx({ dealAmount: 80000 })];
    const result = calculateBargainScore(listing, txs, [listing]);
    expect(result.summary).toContain('저렴');
  });

  it('비싼 경우 "높음" 포함', () => {
    const listing = makeListing({ askingPrice: 90000 });
    const txs = [makeTx({ dealAmount: 80000 })];
    const result = calculateBargainScore(listing, txs, [listing]);
    expect(result.summary).toContain('높음');
  });

  it('여러 매물이 있으면 순위 포함', () => {
    const listing1 = makeListing({ listingId: 'l1', askingPrice: 75000 });
    const listing2 = makeListing({ listingId: 'l2', askingPrice: 80000 });
    const txs = [makeTx()];
    const result = calculateBargainScore(listing2, txs, [listing1, listing2]);
    expect(result.summary).toContain('중');
  });
});

// =============================================================================
// 가격 괴리 금액/비율
// =============================================================================

describe('가격 괴리 계산', () => {
  it('priceGapAmount가 정확하다', () => {
    const listing = makeListing({ askingPrice: 75000 });
    const txs = [makeTx({ dealAmount: 80000 })];
    const result = calculateBargainScore(listing, txs);

    expect(result.priceGapAmount).toBe(-5000); // 75000 - 80000
    expect(result.listingPrice).toBe(75000);
    expect(result.recentDealPrice).toBe(80000);
  });

  it('priceGapPercent가 소수점 1자리', () => {
    const listing = makeListing({ askingPrice: 74000 });
    const txs = [makeTx({ dealAmount: 80000 })];
    const result = calculateBargainScore(listing, txs);

    expect(result.priceGapPercent).toBe(-7.5);
  });
});
