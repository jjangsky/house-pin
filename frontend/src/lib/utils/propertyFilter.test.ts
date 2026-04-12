import { describe, it, expect } from 'vitest';

import type { RealEstateTransaction } from '@/lib/api/molit';

import {
  filterByAffordability,
  sortByDate,
  toProperty,
} from './propertyFilter';

// =============================================================================
// 테스트용 데이터
// =============================================================================

const SAMPLE_TRANSACTIONS: RealEstateTransaction[] = [
  {
    dealAmount: 80000,
    buildYear: 2005,
    dealYear: 2026,
    dealMonth: 1,
    dealDay: 10,
    dong: '역삼동',
    aptName: '역삼자이',
    area: 49.77,
    floor: 5,
    jibun: '725',
    regionCode: '11680',
    cancelDealType: '',
    dealType: '직거래',
  },
  {
    dealAmount: 130000,
    buildYear: 2017,
    dealYear: 2026,
    dealMonth: 2,
    dealDay: 15,
    dong: '서초동',
    aptName: '래미안서초에스티지',
    area: 59.94,
    floor: 15,
    jibun: '1548',
    regionCode: '11650',
    cancelDealType: '',
    dealType: '중개거래',
  },
  {
    dealAmount: 195000,
    buildYear: 2015,
    dealYear: 2026,
    dealMonth: 3,
    dealDay: 3,
    dong: '역삼동',
    aptName: '래미안역삼',
    area: 84.99,
    floor: 12,
    jibun: '677',
    regionCode: '11680',
    cancelDealType: '',
    dealType: '중개거래',
  },
  {
    dealAmount: 240000,
    buildYear: 2008,
    dealYear: 2026,
    dealMonth: 3,
    dealDay: 5,
    dong: '대치동',
    aptName: '래미안대치팰리스',
    area: 114.5,
    floor: 18,
    jibun: '316',
    regionCode: '11680',
    cancelDealType: '',
    dealType: '중개거래',
  },
  {
    dealAmount: 155000,
    buildYear: 2019,
    dealYear: 2025,
    dealMonth: 12,
    dealDay: 20,
    dong: '대치동',
    aptName: '힐스테이트대치',
    area: 59.96,
    floor: 8,
    jibun: '501',
    regionCode: '11680',
    cancelDealType: '',
    dealType: '직거래',
  },
];

// =============================================================================
// filterByAffordability 테스트
// =============================================================================

describe('filterByAffordability', () => {
  it('구매력 상한 이내의 매물만 반환한다', () => {
    const result = filterByAffordability({
      transactions: SAMPLE_TRANSACTIONS,
      maxPrice: 150000,
    });

    expect(result).toHaveLength(2);
    expect(result.every((tx) => tx.dealAmount <= 150000)).toBe(true);
  });

  it('모든 매물이 상한을 초과하면 빈 배열을 반환한다', () => {
    const result = filterByAffordability({
      transactions: SAMPLE_TRANSACTIONS,
      maxPrice: 50000,
    });

    expect(result).toHaveLength(0);
  });

  it('모든 매물이 상한 이내이면 전체를 반환한다', () => {
    const result = filterByAffordability({
      transactions: SAMPLE_TRANSACTIONS,
      maxPrice: 300000,
    });

    expect(result).toHaveLength(SAMPLE_TRANSACTIONS.length);
  });

  it('최소 면적 필터가 적용된다', () => {
    const result = filterByAffordability({
      transactions: SAMPLE_TRANSACTIONS,
      maxPrice: 300000,
      minArea: 60,
    });

    expect(result).toHaveLength(2);
    expect(result.every((tx) => tx.area >= 60)).toBe(true);
  });

  it('최대 면적 필터가 적용된다', () => {
    const result = filterByAffordability({
      transactions: SAMPLE_TRANSACTIONS,
      maxPrice: 300000,
      maxArea: 85,
    });

    expect(result).toHaveLength(4);
    expect(result.every((tx) => tx.area <= 85)).toBe(true);
  });

  it('가격과 면적 필터가 동시에 적용된다', () => {
    const result = filterByAffordability({
      transactions: SAMPLE_TRANSACTIONS,
      maxPrice: 200000,
      minArea: 50,
      maxArea: 90,
    });

    // 130000/59.94, 195000/84.99, 155000/59.96 -> 3건
    expect(result).toHaveLength(3);
    expect(
      result.every((tx) => tx.dealAmount <= 200000 && tx.area >= 50 && tx.area <= 90),
    ).toBe(true);
  });
});

// =============================================================================
// sortByDate 테스트
// =============================================================================

describe('sortByDate', () => {
  it('최신 거래순으로 정렬한다', () => {
    const result = sortByDate(SAMPLE_TRANSACTIONS);

    expect(result[0].aptName).toBe('래미안대치팰리스'); // 2026-03-05
    expect(result[1].aptName).toBe('래미안역삼'); // 2026-03-03
    expect(result[result.length - 1].aptName).toBe('힐스테이트대치'); // 2025-12-20
  });

  it('원본 배열을 변경하지 않는다', () => {
    const original = [...SAMPLE_TRANSACTIONS];
    sortByDate(SAMPLE_TRANSACTIONS);

    expect(SAMPLE_TRANSACTIONS).toEqual(original);
  });

  it('빈 배열을 처리한다', () => {
    const result = sortByDate([]);
    expect(result).toEqual([]);
  });
});

// =============================================================================
// toProperty 테스트
// =============================================================================

describe('toProperty', () => {
  it('RealEstateTransaction을 Property로 변환한다', () => {
    const tx = SAMPLE_TRANSACTIONS[0];
    const result = toProperty(tx, 'apartment');

    expect(result).toEqual({
      dealAmount: 80000,
      buildYear: 2005,
      dealYear: 2026,
      dealMonth: 1,
      dealDay: 10,
      dong: '역삼동',
      name: '역삼자이',
      area: 49.77,
      floor: 5,
      jibun: '725',
      regionCode: '11680',
      propertyType: 'apartment',
    });
  });

  it('aptName을 name으로 매핑한다', () => {
    const tx = SAMPLE_TRANSACTIONS[2];
    const result = toProperty(tx, 'apartment');

    expect(result.name).toBe('래미안역삼');
  });

  it('propertyType을 정확히 설정한다', () => {
    const tx = SAMPLE_TRANSACTIONS[0];

    expect(toProperty(tx, 'apartment').propertyType).toBe('apartment');
    expect(toProperty(tx, 'villa').propertyType).toBe('villa');
    expect(toProperty(tx, 'officetel').propertyType).toBe('officetel');
  });
});
