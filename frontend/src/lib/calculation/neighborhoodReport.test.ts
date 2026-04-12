import { describe, it, expect } from 'vitest';
import { generateNeighborhoodReport } from './neighborhoodReport';
import type { Property } from '@/types';

// =============================================================================
// 테스트 헬퍼
// =============================================================================

function makeProperty(overrides: Partial<Property> = {}): Property {
  return {
    dealAmount: 50000,
    buildYear: 2020,
    dealYear: 2026,
    dealMonth: 3,
    dealDay: 15,
    dong: '역삼동',
    name: '래미안',
    area: 84,
    floor: 10,
    jibun: '123-4',
    regionCode: '11680',
    propertyType: 'apartment',
    ...overrides,
  };
}

function makeProperties(count: number, overrides: Partial<Property> = {}): Property[] {
  return Array.from({ length: count }, (_, i) =>
    makeProperty({
      dealAmount: 50000 + i * 1000,
      name: `단지${Math.floor(i / 3) + 1}`,
      dealDay: (i % 28) + 1,
      ...overrides,
    }),
  );
}

// =============================================================================
// 시세 동향 (Price Trend)
// =============================================================================

describe('시세 동향', () => {
  it('평균가, 최고가, 최저가를 정확히 계산한다', () => {
    const properties = [
      makeProperty({ dealAmount: 30000 }),
      makeProperty({ dealAmount: 50000 }),
      makeProperty({ dealAmount: 70000 }),
    ];

    const report = generateNeighborhoodReport(properties, '11680', '강남구');

    expect(report.priceTrend.averagePrice).toBe(50000);
    expect(report.priceTrend.highestDeal).toBe(70000);
    expect(report.priceTrend.lowestDeal).toBe(30000);
    expect(report.priceTrend.recentDeals).toBe(3);
  });

  it('최근 3개월 vs 이전 3개월 변동률을 계산한다 (상승)', () => {
    const recent = [
      makeProperty({ dealAmount: 60000, dealYear: 2026, dealMonth: 3 }),
      makeProperty({ dealAmount: 62000, dealYear: 2026, dealMonth: 2 }),
    ];
    const prior = [
      makeProperty({ dealAmount: 50000, dealYear: 2025, dealMonth: 11 }),
      makeProperty({ dealAmount: 52000, dealYear: 2025, dealMonth: 10 }),
    ];

    const report = generateNeighborhoodReport([...recent, ...prior], '11680', '강남구');

    expect(report.priceTrend.priceChangeDirection).toBe('up');
    expect(report.priceTrend.priceChangePercent).toBeGreaterThan(1);
  });

  it('변동률이 +-1% 이내면 stable로 판정한다', () => {
    const recent = [
      makeProperty({ dealAmount: 50000, dealYear: 2026, dealMonth: 3 }),
    ];
    const prior = [
      makeProperty({ dealAmount: 50100, dealYear: 2025, dealMonth: 11 }),
    ];

    const report = generateNeighborhoodReport([...recent, ...prior], '11680', '강남구');

    expect(report.priceTrend.priceChangeDirection).toBe('stable');
  });

  it('하락 추세를 감지한다', () => {
    const recent = [
      makeProperty({ dealAmount: 40000, dealYear: 2026, dealMonth: 3 }),
    ];
    const prior = [
      makeProperty({ dealAmount: 50000, dealYear: 2025, dealMonth: 11 }),
    ];

    const report = generateNeighborhoodReport([...recent, ...prior], '11680', '강남구');

    expect(report.priceTrend.priceChangeDirection).toBe('down');
    expect(report.priceTrend.priceChangePercent).toBeLessThan(-1);
  });
});

// =============================================================================
// 면적별 분석 (Size Analysis)
// =============================================================================

describe('면적별 분석', () => {
  it('면적 구간별로 그룹화하고 평당가를 계산한다', () => {
    const properties = [
      makeProperty({ area: 50, dealAmount: 30000 }),
      makeProperty({ area: 59, dealAmount: 35000 }),
      makeProperty({ area: 75, dealAmount: 50000 }),
      makeProperty({ area: 84, dealAmount: 60000 }),
      makeProperty({ area: 100, dealAmount: 80000 }),
    ];

    const report = generateNeighborhoodReport(properties, '11680', '강남구');
    const sizes = report.sizeAnalysis;

    // 60㎡ 이하: 2건
    const small = sizes.find((s) => s.sizeRange === '60㎡ 이하');
    expect(small).toBeDefined();
    expect(small!.dealCount).toBe(2);

    // 60~85㎡: 2건
    const medium = sizes.find((s) => s.sizeRange === '60~85㎡');
    expect(medium).toBeDefined();
    expect(medium!.dealCount).toBe(2);

    // 85㎡ 초과: 1건
    const large = sizes.find((s) => s.sizeRange === '85㎡ 초과');
    expect(large).toBeDefined();
    expect(large!.dealCount).toBe(1);

    // 평당가가 0보다 커야 함
    expect(small!.pricePerPyeong).toBeGreaterThan(0);
    expect(medium!.pricePerPyeong).toBeGreaterThan(0);
    expect(large!.pricePerPyeong).toBeGreaterThan(0);
  });

  it('빈 구간은 결과에서 제외한다', () => {
    const properties = [
      makeProperty({ area: 84, dealAmount: 50000 }),
    ];

    const report = generateNeighborhoodReport(properties, '11680', '강남구');

    // 60~85㎡ 구간만 존재해야 함
    expect(report.sizeAnalysis.length).toBe(1);
    expect(report.sizeAnalysis[0].sizeRange).toBe('60~85㎡');
  });
});

// =============================================================================
// 단지 랭킹 (Complex Ranking)
// =============================================================================

describe('단지 랭킹', () => {
  it('평균 가격 기준 내림차순으로 최대 5개를 반환한다', () => {
    const properties = [
      makeProperty({ name: '래미안', dealAmount: 80000 }),
      makeProperty({ name: '래미안', dealAmount: 82000 }),
      makeProperty({ name: '힐스테이트', dealAmount: 70000 }),
      makeProperty({ name: '자이', dealAmount: 90000 }),
      makeProperty({ name: '푸르지오', dealAmount: 60000 }),
      makeProperty({ name: '아이파크', dealAmount: 75000 }),
      makeProperty({ name: '더샵', dealAmount: 65000 }),
    ];

    const report = generateNeighborhoodReport(properties, '11680', '강남구');
    const ranking = report.complexRanking;

    expect(ranking.length).toBe(5);
    expect(ranking[0].name).toBe('자이');
    expect(ranking[0].averagePrice).toBe(90000);

    // 래미안 평균 = (80000+82000)/2 = 81000
    const raemian = ranking.find((r) => r.name === '래미안');
    expect(raemian).toBeDefined();
    expect(raemian!.averagePrice).toBe(81000);
    expect(raemian!.dealCount).toBe(2);
  });

  it('최신 거래 날짜를 정확히 추출한다', () => {
    const properties = [
      makeProperty({ name: '래미안', dealYear: 2025, dealMonth: 11 }),
      makeProperty({ name: '래미안', dealYear: 2026, dealMonth: 2 }),
    ];

    const report = generateNeighborhoodReport(properties, '11680', '강남구');

    expect(report.complexRanking[0].latestDealDate).toBe('2026.02');
  });
});

// =============================================================================
// 점수 계산 (Scores)
// =============================================================================

describe('점수 계산', () => {
  it('거래 활발도: 건수 기반으로 1~5를 부여한다', () => {
    // 5건 → activity 1
    const few = generateNeighborhoodReport(
      makeProperties(5),
      '11680',
      '강남구',
    );
    expect(few.scores.activity).toBe(1);

    // 15건 → activity 2
    const some = generateNeighborhoodReport(
      makeProperties(15),
      '11680',
      '강남구',
    );
    expect(some.scores.activity).toBe(2);

    // 30건 → activity 3
    const moderate = generateNeighborhoodReport(
      makeProperties(30),
      '11680',
      '강남구',
    );
    expect(moderate.scores.activity).toBe(3);

    // 51건 → activity 5
    const many = generateNeighborhoodReport(
      makeProperties(51),
      '11680',
      '강남구',
    );
    expect(many.scores.activity).toBe(5);
  });

  it('가격 안정성: 변동계수(CV)가 낮으면 높은 점수', () => {
    // 모든 가격이 동일 → CV = 0 → stability 5
    const stable = generateNeighborhoodReport(
      makeProperties(10, { dealAmount: 50000 }),
      '11680',
      '강남구',
    );
    expect(stable.scores.stability).toBe(5);

    // 가격이 크게 분산 → stability 낮음
    const volatile = generateNeighborhoodReport(
      [
        makeProperty({ dealAmount: 10000 }),
        makeProperty({ dealAmount: 100000 }),
      ],
      '11680',
      '강남구',
    );
    expect(volatile.scores.stability).toBeLessThanOrEqual(2);
  });

  it('종합 점수: 가중 평균으로 계산한다', () => {
    const report = generateNeighborhoodReport(
      makeProperties(10, { dealAmount: 50000 }),
      '11680',
      '강남구',
    );

    const expected =
      report.scores.activity * 0.3 +
      report.scores.stability * 0.3 +
      report.scores.value * 0.4;

    expect(report.scores.overall).toBe(Math.round(expected * 10) / 10);
  });
});

// =============================================================================
// 엣지 케이스
// =============================================================================

describe('엣지 케이스', () => {
  it('빈 배열 → 기본값 반환', () => {
    const report = generateNeighborhoodReport([], '11680', '강남구');

    expect(report.priceTrend.averagePrice).toBe(0);
    expect(report.priceTrend.recentDeals).toBe(0);
    expect(report.sizeAnalysis.length).toBe(0);
    expect(report.complexRanking.length).toBe(0);
    expect(report.scores.overall).toBe(1);
    expect(report.jeonseRatio).toBeNull();
  });

  it('단일 매물 → 정상 작동', () => {
    const report = generateNeighborhoodReport(
      [makeProperty({ dealAmount: 50000 })],
      '11680',
      '강남구',
    );

    expect(report.priceTrend.averagePrice).toBe(50000);
    expect(report.priceTrend.highestDeal).toBe(50000);
    expect(report.priceTrend.lowestDeal).toBe(50000);
    expect(report.complexRanking.length).toBe(1);
    expect(report.scores.activity).toBe(1);
  });

  it('모두 같은 가격 → stability 최고점', () => {
    const report = generateNeighborhoodReport(
      makeProperties(20, { dealAmount: 50000 }),
      '11680',
      '강남구',
    );

    expect(report.scores.stability).toBe(5);
  });

  it('regionCode와 regionName이 정확히 전달된다', () => {
    const report = generateNeighborhoodReport([], '41135', '성남시 분당구');

    expect(report.regionCode).toBe('41135');
    expect(report.regionName).toBe('성남시 분당구');
  });
});
