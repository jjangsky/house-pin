import { describe, it, expect } from 'vitest';

import { estimateMovingCost, estimateMaintenanceFee, calculateTco } from './tco';

// =============================================================================
// estimateMovingCost (이사비용 추정)
// =============================================================================

describe('estimateMovingCost', () => {
  it('소형 (40㎡ 이하) → 60만원', () => {
    const result = estimateMovingCost(33);
    expect(result.movingCost).toBe(60);
    expect(result.area).toBe(33);
  });

  it('국민평형 (85㎡) → 130만원', () => {
    const result = estimateMovingCost(85);
    expect(result.movingCost).toBe(130);
  });

  it('중대형 (100㎡) → 170만원', () => {
    const result = estimateMovingCost(100);
    expect(result.movingCost).toBe(170);
  });

  it('대형 (140㎡) → 220만원', () => {
    const result = estimateMovingCost(140);
    expect(result.movingCost).toBe(220);
  });

  it('초대형 (200㎡) → 280만원', () => {
    const result = estimateMovingCost(200);
    expect(result.movingCost).toBe(280);
  });

  it('경계값 (60㎡) → 90만원', () => {
    const result = estimateMovingCost(60);
    expect(result.movingCost).toBe(90);
  });
});

// =============================================================================
// estimateMaintenanceFee (관리비 추정)
// =============================================================================

describe('estimateMaintenanceFee', () => {
  it('국민평형 84㎡ → 월 약 25만원', () => {
    const result = estimateMaintenanceFee(84);
    // 84 * 0.3 = 25.2 → 반올림 25
    expect(result.monthlyFee).toBe(25);
    expect(result.annualFee).toBe(300); // 25 * 12
    expect(result.area).toBe(84);
  });

  it('소형 33㎡ → 월 약 10만원', () => {
    const result = estimateMaintenanceFee(33);
    // 33 * 0.3 = 9.9 → 반올림 10
    expect(result.monthlyFee).toBe(10);
    expect(result.annualFee).toBe(120);
  });

  it('대형 132㎡ → 월 약 40만원', () => {
    const result = estimateMaintenanceFee(132);
    // 132 * 0.3 = 39.6 → 반올림 40
    expect(result.monthlyFee).toBe(40);
    expect(result.annualFee).toBe(480);
  });
});

// =============================================================================
// calculateTco (TCO 통합 계산)
// =============================================================================

describe('calculateTco', () => {
  const baseInput = {
    purchasePrice: 50000, // 5억
    numberOfHomes: 0,
    regionType: 'non_regulated' as const,
    area: 84, // 국민평형
    monthlyLoanPayment: 150, // 월 150만원
    annualLoanInterest: 1200, // 연 이자 1,200만원
  };

  it('1회성 비용을 정확히 합산한다', () => {
    const result = calculateTco(baseInput);

    // 취득세: 5억 * 1% = 500 + 부가세
    expect(result.oneTimeCosts.acquisitionTax).toBeGreaterThan(0);
    // 등기비용: 2% + 부가세 + 인지세 + 법무사
    expect(result.oneTimeCosts.registrationCost).toBeGreaterThan(0);
    // 중개수수료: 5억 * 0.4%
    expect(result.oneTimeCosts.brokerageFee).toBe(200); // 50000 * 0.004
    // 이사비: 84㎡ → 130만원
    expect(result.oneTimeCosts.movingCost).toBe(130);
    // total = 합계
    expect(result.oneTimeCosts.total).toBe(
      result.oneTimeCosts.acquisitionTax +
        result.oneTimeCosts.registrationCost +
        result.oneTimeCosts.brokerageFee +
        result.oneTimeCosts.movingCost,
    );
  });

  it('연간 반복 비용을 정확히 합산한다', () => {
    const result = calculateTco(baseInput);

    expect(result.annualRecurringCosts.holdingTax).toBeGreaterThan(0);
    expect(result.annualRecurringCosts.maintenanceFee).toBe(300); // 25 * 12
    expect(result.annualRecurringCosts.loanInterest).toBe(1200);
    expect(result.annualRecurringCosts.total).toBe(
      result.annualRecurringCosts.holdingTax +
        result.annualRecurringCosts.maintenanceFee +
        result.annualRecurringCosts.loanInterest,
    );
  });

  it('월 환산 비용을 정확히 계산한다', () => {
    const result = calculateTco(baseInput);

    expect(result.monthlyCosts.maintenanceFee).toBe(25);
    expect(result.monthlyCosts.loanPayment).toBe(150);
    expect(result.monthlyCosts.holdingTax).toBeGreaterThan(0);
    expect(result.monthlyCosts.total).toBe(
      result.monthlyCosts.holdingTax +
        result.monthlyCosts.maintenanceFee +
        result.monthlyCosts.loanPayment,
    );
  });

  it('첫 해 총 비용 = 1회성 + 연간 반복', () => {
    const result = calculateTco(baseInput);

    expect(result.firstYearTotal).toBe(
      result.oneTimeCosts.total + result.annualRecurringCosts.total,
    );
  });

  it('월 반복 비용 = monthlyCosts.total', () => {
    const result = calculateTco(baseInput);
    expect(result.monthlyRecurringTotal).toBe(result.monthlyCosts.total);
  });

  it('5억 국민평형 TCO 스냅샷', () => {
    const result = calculateTco(baseInput);

    // 5억 1주택 기준 TCO가 합리적인 범위에 있는지 확인
    // 1회성: ~1,900만 (취득세600 + 등기1100 + 중개200 + 이사130)
    expect(result.oneTimeCosts.total).toBeGreaterThan(1500);
    expect(result.oneTimeCosts.total).toBeLessThan(2500);

    // 연간 반복: ~1,500만+ (보유세 + 관리비300 + 대출이자1200)
    expect(result.annualRecurringCosts.total).toBeGreaterThan(1500);

    // 첫 해 총: 3,000만 ~ 5,000만 범위
    expect(result.firstYearTotal).toBeGreaterThan(3000);
    expect(result.firstYearTotal).toBeLessThan(5000);
  });

  it('대출 없는 경우 (현금 구매)', () => {
    const result = calculateTco({
      ...baseInput,
      monthlyLoanPayment: 0,
      annualLoanInterest: 0,
    });

    expect(result.annualRecurringCosts.loanInterest).toBe(0);
    expect(result.monthlyCosts.loanPayment).toBe(0);
    expect(result.firstYearTotal).toBeLessThan(
      calculateTco(baseInput).firstYearTotal,
    );
  });
});
