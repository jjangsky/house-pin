import { describe, it, expect } from 'vitest';

import { compareJeonseVsBuy, calculateRemainingBalance } from './scenarioComparison';
import type { ScenarioInput } from '@/types/scenario';

// =============================================================================
// 테스트 헬퍼
// =============================================================================

/** 기본 시나리오 입력값 (서울 아파트 5억 매매 vs 3억 전세, 5년 비교) */
function createDefaultInput(overrides?: Partial<ScenarioInput>): ScenarioInput {
  return {
    ownCapital: 20000,        // 2억
    annualIncome: 5000,       // 5천만원
    targetPrice: 50000,       // 5억
    comparisonYears: 5,

    jeonseDeposit: 30000,     // 3억
    depositRate: 3.5,         // 예금 금리 3.5%
    jeonseRenewalRate: 3.0,   // 전세금 상승률 3%

    purchasePrice: 50000,     // 5억
    loanAmount: 30000,        // 3억 대출
    mortgageRate: 4.0,        // 대출 금리 4%
    loanTermYears: 30,        // 30년 상환
    priceGrowthRate: 3.0,     // 시세 상승률 3%
    numberOfHomes: 1,

    regionType: 'nonRegulated',
    area: 84,                 // 국민평형 84㎡
    ...overrides,
  };
}

// =============================================================================
// 전세 비용 계산
// =============================================================================

describe('전세 비용 계산', () => {
  it('기회비용이 올바르게 계산된다', () => {
    const input = createDefaultInput({ comparisonYears: 1, jeonseRenewalRate: 0 });
    const result = compareJeonseVsBuy(input);

    // 3억 * 3.5% = 1,050만원
    expect(result.jeonse.opportunityCost).toBe(1050);
  });

  it('전세금 상승이 없으면 갱신 증가분이 0이다', () => {
    const input = createDefaultInput({ jeonseRenewalRate: 0 });
    const result = compareJeonseVsBuy(input);

    expect(result.jeonse.renewalCostIncrease).toBe(0);
  });

  it('2년 갱신 주기로 전세금이 상승한다', () => {
    const input = createDefaultInput({ comparisonYears: 3 });
    const result = compareJeonseVsBuy(input);

    // 2년차 말 갱신: 30000 * (1.03)^2 = 31827
    // 상승분 = 31827 - 30000 = 1827
    expect(result.jeonse.renewalCostIncrease).toBe(1827);
  });

  it('자산 형성은 항상 0이다', () => {
    const input = createDefaultInput();
    const result = compareJeonseVsBuy(input);

    expect(result.jeonse.assetFormed).toBe(0);
  });

  it('순비용은 총비용과 동일하다 (자산형성 없음)', () => {
    const input = createDefaultInput();
    const result = compareJeonseVsBuy(input);

    expect(result.jeonse.netCost).toBe(result.jeonse.totalCost);
  });
});

// =============================================================================
// 매매 비용 계산
// =============================================================================

describe('매매 비용 계산', () => {
  it('1회성 비용이 양수이다', () => {
    const input = createDefaultInput();
    const result = compareJeonseVsBuy(input);

    expect(result.buy.oneTimeCost).toBeGreaterThan(0);
  });

  it('대출 이자 총액이 양수이다', () => {
    const input = createDefaultInput();
    const result = compareJeonseVsBuy(input);

    expect(result.buy.loanInterestTotal).toBeGreaterThan(0);
  });

  it('보유세 총액이 기간에 비례한다', () => {
    const input5 = createDefaultInput({ comparisonYears: 5 });
    const input10 = createDefaultInput({ comparisonYears: 10 });
    const result5 = compareJeonseVsBuy(input5);
    const result10 = compareJeonseVsBuy(input10);

    // 10년 보유세는 5년의 2배
    expect(result10.buy.holdingTaxTotal).toBe(result5.buy.holdingTaxTotal * 2);
  });

  it('관리비 총액이 기간에 비례한다', () => {
    const input5 = createDefaultInput({ comparisonYears: 5 });
    const input10 = createDefaultInput({ comparisonYears: 10 });
    const result5 = compareJeonseVsBuy(input5);
    const result10 = compareJeonseVsBuy(input10);

    expect(result10.buy.maintenanceTotal).toBe(result5.buy.maintenanceTotal * 2);
  });

  it('시세 상승률 반영한 자산 가치가 올바르다', () => {
    const input = createDefaultInput({ priceGrowthRate: 3.0, comparisonYears: 5 });
    const result = compareJeonseVsBuy(input);

    // 50000 * (1.03)^5 = 57964
    expect(result.buy.assetValue).toBe(57964);
  });

  it('순 자산 형성 = 자산가치 - 잔여대출', () => {
    const input = createDefaultInput();
    const result = compareJeonseVsBuy(input);

    const remainingBalance = calculateRemainingBalance(30000, 4.0, 30, 5);
    expect(result.buy.assetFormed).toBe(Math.round(result.buy.assetValue - remainingBalance));
  });

  it('총비용 = 1회성 + 대출이자 + 보유세 + 관리비', () => {
    const input = createDefaultInput();
    const result = compareJeonseVsBuy(input);

    const expectedTotal =
      result.buy.oneTimeCost +
      result.buy.loanInterestTotal +
      result.buy.holdingTaxTotal +
      result.buy.maintenanceTotal;

    expect(result.buy.totalCost).toBe(expectedTotal);
  });

  it('순비용 = 총비용 - 자산형성', () => {
    const input = createDefaultInput();
    const result = compareJeonseVsBuy(input);

    expect(result.buy.netCost).toBe(result.buy.totalCost - result.buy.assetFormed);
  });
});

// =============================================================================
// 잔여 대출 원금 계산
// =============================================================================

describe('calculateRemainingBalance', () => {
  it('대출금이 0이면 잔여가 0이다', () => {
    expect(calculateRemainingBalance(0, 4.0, 30, 5)).toBe(0);
  });

  it('기간이 0이면 잔여가 0이다', () => {
    expect(calculateRemainingBalance(30000, 4.0, 0, 0)).toBe(0);
  });

  it('경과 기간이 총 기간 이상이면 잔여가 0이다', () => {
    expect(calculateRemainingBalance(30000, 4.0, 30, 30)).toBe(0);
    expect(calculateRemainingBalance(30000, 4.0, 30, 35)).toBe(0);
  });

  it('0% 금리에서 균등 상환된다', () => {
    // 30000 대출, 30년, 5년 경과 → 30000 * (1 - 60/360) = 25000
    expect(calculateRemainingBalance(30000, 0, 30, 5)).toBe(25000);
  });

  it('5년 후 잔여 원금이 원금보다 적다', () => {
    const remaining = calculateRemainingBalance(30000, 4.0, 30, 5);
    expect(remaining).toBeLessThan(30000);
    expect(remaining).toBeGreaterThan(0);
  });

  it('경과 기간이 길수록 잔여 원금이 줄어든다', () => {
    const after5 = calculateRemainingBalance(30000, 4.0, 30, 5);
    const after10 = calculateRemainingBalance(30000, 4.0, 30, 10);
    const after20 = calculateRemainingBalance(30000, 4.0, 30, 20);

    expect(after10).toBeLessThan(after5);
    expect(after20).toBeLessThan(after10);
  });
});

// =============================================================================
// 비교 결과
// =============================================================================

describe('비교 결과', () => {
  it('순비용이 낮은 쪽이 betterOption이다', () => {
    const input = createDefaultInput();
    const result = compareJeonseVsBuy(input);

    if (result.buy.netCost <= result.jeonse.netCost) {
      expect(result.comparison.betterOption).toBe('buy');
    } else {
      expect(result.comparison.betterOption).toBe('jeonse');
    }
  });

  it('절약 금액은 두 순비용의 차이 절대값이다', () => {
    const input = createDefaultInput();
    const result = compareJeonseVsBuy(input);

    expect(result.comparison.savingsAmount).toBe(
      Math.round(Math.abs(result.jeonse.netCost - result.buy.netCost)),
    );
  });

  it('높은 시세 상승률은 매매를 유리하게 만든다', () => {
    const highGrowth = createDefaultInput({ priceGrowthRate: 10.0 });
    const result = compareJeonseVsBuy(highGrowth);

    expect(result.comparison.betterOption).toBe('buy');
  });

  it('시세 하락 + 높은 레버리지에서 전세가 유리하다', () => {
    // 고레버리지(대출 비중 높음) + 시세 하락 → 자산가치 하락이 비용보다 큼
    const jeonseWins = createDefaultInput({
      priceGrowthRate: -10.0,
      mortgageRate: 6.0,
      loanAmount: 45000,        // 90% 레버리지
      ownCapital: 5000,
      depositRate: 1.0,
      jeonseRenewalRate: 0,
      comparisonYears: 5,
    });
    const result = compareJeonseVsBuy(jeonseWins);

    expect(result.comparison.betterOption).toBe('jeonse');
  });

  it('월 부담 차이가 반환된다', () => {
    const input = createDefaultInput();
    const result = compareJeonseVsBuy(input);

    expect(typeof result.comparison.monthlyCostDiff).toBe('number');
  });
});

// =============================================================================
// 손익분기점
// =============================================================================

describe('손익분기점', () => {
  it('높은 시세 상승률에서 손익분기점이 존재한다', () => {
    const input = createDefaultInput({ priceGrowthRate: 5.0 });
    const result = compareJeonseVsBuy(input);

    expect(result.comparison.breakEvenYears).not.toBeNull();
    expect(result.comparison.breakEvenYears).toBeGreaterThan(0);
  });

  it('매매가 항상 불리한 조건에서 손익분기점이 null이다', () => {
    // 극단적 시세 하락 + 고레버리지 → 매매가 절대 유리해지지 않음
    const input = createDefaultInput({
      priceGrowthRate: -10.0,
      mortgageRate: 8.0,
      loanAmount: 45000,
      ownCapital: 5000,
      depositRate: 0.5,
      jeonseRenewalRate: 0,
    });
    const result = compareJeonseVsBuy(input);

    expect(result.comparison.breakEvenYears).toBeNull();
  });

  it('손익분기점이 양의 정수이다', () => {
    const input = createDefaultInput({ priceGrowthRate: 5.0 });
    const result = compareJeonseVsBuy(input);

    if (result.comparison.breakEvenYears !== null) {
      expect(result.comparison.breakEvenYears).toBeGreaterThan(0);
      expect(Number.isInteger(result.comparison.breakEvenYears)).toBe(true);
    }
  });
});

// =============================================================================
// 연도별 추이
// =============================================================================

describe('연도별 추이', () => {
  it('comparisonYears 만큼의 데이터를 반환한다', () => {
    const input = createDefaultInput({ comparisonYears: 5 });
    const result = compareJeonseVsBuy(input);

    expect(result.yearlyBreakdown).toHaveLength(5);
  });

  it('연도가 1부터 순서대로 증가한다', () => {
    const input = createDefaultInput({ comparisonYears: 3 });
    const result = compareJeonseVsBuy(input);

    expect(result.yearlyBreakdown.map((y) => y.year)).toEqual([1, 2, 3]);
  });

  it('전세 누적비용이 매년 증가한다', () => {
    const input = createDefaultInput({ comparisonYears: 5 });
    const result = compareJeonseVsBuy(input);

    for (let i = 1; i < result.yearlyBreakdown.length; i++) {
      expect(result.yearlyBreakdown[i].jeonseCumulative).toBeGreaterThanOrEqual(
        result.yearlyBreakdown[i - 1].jeonseCumulative,
      );
    }
  });

  it('마지막 연도의 전세 누적비용이 최종 결과와 일치한다', () => {
    const input = createDefaultInput({ comparisonYears: 5 });
    const result = compareJeonseVsBuy(input);

    const lastYear = result.yearlyBreakdown[result.yearlyBreakdown.length - 1];
    expect(lastYear.jeonseCumulative).toBe(result.jeonse.netCost);
  });

  it('마지막 연도의 매매 누적비용이 최종 결과와 일치한다', () => {
    const input = createDefaultInput({ comparisonYears: 5 });
    const result = compareJeonseVsBuy(input);

    const lastYear = result.yearlyBreakdown[result.yearlyBreakdown.length - 1];
    expect(lastYear.buyCumulative).toBe(result.buy.netCost);
  });
});

// =============================================================================
// 엣지 케이스
// =============================================================================

describe('엣지 케이스', () => {
  it('0% 예금 금리에서 전세 기회비용이 0이다', () => {
    const input = createDefaultInput({ depositRate: 0 });
    const result = compareJeonseVsBuy(input);

    expect(result.jeonse.opportunityCost).toBe(0);
    expect(result.jeonse.totalCost).toBe(0);
  });

  it('0% 대출 금리에서 대출이자가 발생하지 않는다', () => {
    const input = createDefaultInput({ mortgageRate: 0 });
    const result = compareJeonseVsBuy(input);

    expect(result.buy.loanInterestTotal).toBe(0);
  });

  it('대출 없이 전액 현금 매매 시 대출이자가 0이다', () => {
    const input = createDefaultInput({ loanAmount: 0 });
    const result = compareJeonseVsBuy(input);

    expect(result.buy.loanInterestTotal).toBe(0);
  });

  it('1년 단기 비교가 동작한다', () => {
    const input = createDefaultInput({ comparisonYears: 1 });
    const result = compareJeonseVsBuy(input);

    expect(result.yearlyBreakdown).toHaveLength(1);
    expect(result.jeonse.totalCost).toBeGreaterThanOrEqual(0);
    expect(result.buy.totalCost).toBeGreaterThan(0);
  });

  it('10년 장기 비교가 동작한다', () => {
    const input = createDefaultInput({ comparisonYears: 10 });
    const result = compareJeonseVsBuy(input);

    expect(result.yearlyBreakdown).toHaveLength(10);
  });

  it('다주택자(3주택) 취득세가 반영된다', () => {
    const single = createDefaultInput({ numberOfHomes: 1 });
    const multi = createDefaultInput({ numberOfHomes: 3 });
    const resultSingle = compareJeonseVsBuy(single);
    const resultMulti = compareJeonseVsBuy(multi);

    // 3주택 이상은 취득세율이 높으므로 1회성 비용이 더 크다
    expect(resultMulti.buy.oneTimeCost).toBeGreaterThan(resultSingle.buy.oneTimeCost);
  });
});
