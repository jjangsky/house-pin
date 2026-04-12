import { describe, it, expect } from 'vitest';

import {
  calculateAcquisitionTax,
  calculatePropertyTax,
  calculateBrokerageFee,
  calculateRegistrationCost,
  calculateTotalInitialCost,
} from './tax';

// =============================================================================
// calculateAcquisitionTax (취득세)
// =============================================================================

describe('calculateAcquisitionTax', () => {
  it('1주택 6억 이하 → 1% 적용', () => {
    const result = calculateAcquisitionTax({
      purchasePrice: 30000, // 3억
      numberOfHomes: 1,
      regionType: 'nonRegulated',
    });

    expect(result.baseRate).toBe(0.01);
    expect(result.baseTax).toBe(300); // 3억 * 1%
    expect(result.ruralTax).toBe(30); // 300 * 10%
    expect(result.localEducationTax).toBe(30); // 300 * 10%
    expect(result.totalAcquisitionTax).toBe(360);
    expect(result.homeCategory).toBe('1주택');
  });

  it('1주택 6~9억 → 선형보간 적용 (7억)', () => {
    const result = calculateAcquisitionTax({
      purchasePrice: 70000, // 7억
      numberOfHomes: 1,
      regionType: 'nonRegulated',
    });

    // rate = 2/3 - 30000/70000 ≈ 0.6667 - 0.4286 ≈ 0.2381
    const expectedRate = 2 / 3 - 30000 / 70000;
    expect(result.baseRate).toBeCloseTo(expectedRate, 6);
    expect(result.baseTax).toBe(Math.round(70000 * expectedRate));
    expect(result.homeCategory).toBe('1주택');
  });

  it('1주택 9억 초과 → 3% 적용 (10억)', () => {
    const result = calculateAcquisitionTax({
      purchasePrice: 100000, // 10억
      numberOfHomes: 1,
      regionType: 'nonRegulated',
    });

    expect(result.baseRate).toBe(0.03);
    expect(result.baseTax).toBe(3000); // 10억 * 3%
    expect(result.totalAcquisitionTax).toBe(3600); // 3000 + 300 + 300
    expect(result.homeCategory).toBe('1주택');
  });

  it('2주택 조정지역 → 8% 적용', () => {
    const result = calculateAcquisitionTax({
      purchasePrice: 70000, // 7억
      numberOfHomes: 2,
      regionType: 'regulated',
    });

    expect(result.baseRate).toBe(0.08);
    expect(result.baseTax).toBe(5600); // 7억 * 8%
    expect(result.homeCategory).toBe('2주택_조정');
  });

  it('2주택 투기지역도 조정 세율 적용', () => {
    const result = calculateAcquisitionTax({
      purchasePrice: 70000,
      numberOfHomes: 2,
      regionType: 'speculative',
    });

    expect(result.baseRate).toBe(0.08);
    expect(result.homeCategory).toBe('2주택_조정');
  });

  it('2주택 비조정지역 → 1주택 세율과 동일', () => {
    const result = calculateAcquisitionTax({
      purchasePrice: 30000, // 3억
      numberOfHomes: 2,
      regionType: 'nonRegulated',
    });

    expect(result.baseRate).toBe(0.01);
    expect(result.homeCategory).toBe('2주택_비조정');
  });

  it('3주택 이상 → 12% 적용', () => {
    const result = calculateAcquisitionTax({
      purchasePrice: 70000, // 7억
      numberOfHomes: 3,
      regionType: 'nonRegulated',
    });

    expect(result.baseRate).toBe(0.12);
    expect(result.baseTax).toBe(8400); // 7억 * 12%
    expect(result.totalAcquisitionTax).toBe(10080); // 8400 + 840 + 840
    expect(result.homeCategory).toBe('3주택이상');
  });

  it('6억 정확히 → 1% 경계값', () => {
    const result = calculateAcquisitionTax({
      purchasePrice: 60000,
      numberOfHomes: 1,
      regionType: 'nonRegulated',
    });

    expect(result.baseRate).toBe(0.01);
    expect(result.baseTax).toBe(600);
  });

  it('9억 정확히 → 선형보간 상한 경계', () => {
    const result = calculateAcquisitionTax({
      purchasePrice: 90000,
      numberOfHomes: 1,
      regionType: 'nonRegulated',
    });

    // rate = 2/3 - 30000/90000 = 2/3 - 1/3 = 1/3 ≈ 0.3333
    const expectedRate = 2 / 3 - 30000 / 90000;
    expect(result.baseRate).toBeCloseTo(1 / 3, 6);
    expect(result.baseTax).toBe(Math.round(90000 * expectedRate));
  });
});

// =============================================================================
// calculatePropertyTax (재산세)
// =============================================================================

describe('calculatePropertyTax', () => {
  it('5억 매물 → 재산세 계산', () => {
    const result = calculatePropertyTax(50000);

    // 공시가격: 50000 * 0.69 = 34500
    expect(result.estimatedPublicPrice).toBe(34500);
    // 과세표준: 34500 * 0.60 = 20700
    expect(result.taxBase).toBe(20700);

    // 20700은 15000~30000 구간 → rate: 0.0025, 공제: 18
    // 재산세 = 20700 * 0.0025 - 18 = 51.75 - 18 = 33.75 → 34
    expect(result.annualPropertyTax).toBe(34);
    expect(result.monthlyPropertyTax).toBe(Math.round(34 / 12));

    // 도시지역분: 20700 * 0.0014 = 28.98 → 29
    expect(result.urbanTax).toBe(29);
    // 지방교육세: 34 * 0.20 = 6.8 → 7
    expect(result.localEducationTax).toBe(7);
    // 총 보유세: 34 + 29 + 7 = 70
    expect(result.totalAnnualHoldingTax).toBe(70);
  });

  it('10억 매물 → 재산세 계산', () => {
    const result = calculatePropertyTax(100000);

    // 공시가격: 100000 * 0.69 = 69000
    expect(result.estimatedPublicPrice).toBe(69000);
    // 과세표준: 69000 * 0.60 = 41400
    expect(result.taxBase).toBe(41400);

    // 41400은 30000 초과 구간 → rate: 0.004, 공제: 63
    // 재산세 = 41400 * 0.004 - 63 = 165.6 - 63 = 102.6 → 103
    expect(result.annualPropertyTax).toBe(103);
  });

  it('1억 매물 → 낮은 구간 재산세', () => {
    const result = calculatePropertyTax(10000);

    // 공시가격: 10000 * 0.69 = 6900
    expect(result.estimatedPublicPrice).toBe(6900);
    // 과세표준: 6900 * 0.60 = 4140
    expect(result.taxBase).toBe(4140);

    // 4140은 6000 이하 구간 → rate: 0.001, 공제: 0
    // 재산세 = 4140 * 0.001 = 4.14 → 4
    expect(result.annualPropertyTax).toBe(4);
  });
});

// =============================================================================
// calculateBrokerageFee (중개수수료)
// =============================================================================

describe('calculateBrokerageFee', () => {
  it('1억 → 0.5% 상한 80만원', () => {
    const result = calculateBrokerageFee(10000);

    // 10000 * 0.005 = 50 (80 이하이므로 50)
    expect(result.feeRate).toBe(0.005);
    expect(result.brokerageFee).toBe(50);
  });

  it('5억 → 0.4% 적용', () => {
    const result = calculateBrokerageFee(50000);

    // 50000 * 0.004 = 200
    expect(result.feeRate).toBe(0.004);
    expect(result.brokerageFee).toBe(200);
  });

  it('10억 → 0.9% 적용', () => {
    const result = calculateBrokerageFee(100000);

    // 100000 * 0.009 = 900
    expect(result.feeRate).toBe(0.009);
    expect(result.brokerageFee).toBe(900);
  });

  it('3000만원 → 0.6% 상한 25만원', () => {
    const result = calculateBrokerageFee(3000);

    // 3000 * 0.006 = 18 (25 이하이므로 18)
    expect(result.feeRate).toBe(0.006);
    expect(result.brokerageFee).toBe(18);
  });

  it('2억 → 0.5% 상한 80만원 도달', () => {
    const result = calculateBrokerageFee(20000);

    // 20000 * 0.005 = 100 → 상한 80 적용
    expect(result.feeRate).toBe(0.005);
    expect(result.brokerageFee).toBe(80);
  });
});

// =============================================================================
// calculateRegistrationCost (등기비용)
// =============================================================================

describe('calculateRegistrationCost', () => {
  it('5억 → 등록면허세 2%, 인지세 15만, 법무사 50만', () => {
    const result = calculateRegistrationCost(50000);

    // 등록면허세: 50000 * 0.02 = 1000
    expect(result.registrationTax).toBe(1000);
    // 지방교육세: 1000 * 0.20 = 200
    expect(result.localEducationTax).toBe(200);
    // 인지세: 10000 < 50000 <= 100000 → 15
    expect(result.stampTax).toBe(15);
    // 법무사: 50
    expect(result.lawyerFee).toBe(50);
    // 총합: 1000 + 200 + 15 + 50 = 1265
    expect(result.totalRegistrationCost).toBe(1265);
  });

  it('1억 이하 → 인지세 0', () => {
    const result = calculateRegistrationCost(8000);

    expect(result.stampTax).toBe(0);
  });

  it('10억 초과 → 인지세 35만', () => {
    const result = calculateRegistrationCost(120000);

    expect(result.stampTax).toBe(35);
    expect(result.registrationTax).toBe(2400); // 12억 * 2%
  });
});

// =============================================================================
// calculateTotalInitialCost (통합 초기비용)
// =============================================================================

describe('calculateTotalInitialCost', () => {
  it('5억 1주택 비조정 → 총 초기비용 계산', () => {
    const result = calculateTotalInitialCost({
      purchasePrice: 50000,
      numberOfHomes: 1,
      regionType: 'nonRegulated',
    });

    // 취득세: 50000 * 1% = 500, 부가세 = 500*0.1 + 500*0.1 = 100 → 총 600
    expect(result.acquisitionTax.totalAcquisitionTax).toBe(600);

    // 등기비용: 1000 + 200 + 15 + 50 = 1265
    expect(result.registrationCost.totalRegistrationCost).toBe(1265);

    // 중개수수료: 50000 * 0.004 = 200
    expect(result.brokerageFee.brokerageFee).toBe(200);

    // totalUpfront = 600 + 1265 + 200 = 2065
    expect(result.totalUpfront).toBe(2065);

    // totalRequired = 50000 + 2065 = 52065
    expect(result.totalRequired).toBe(52065);

    // 재산세도 포함되어 있음 (참조용)
    expect(result.propertyTax.totalAnnualHoldingTax).toBeGreaterThan(0);
  });

  it('10억 3주택 → 높은 세율 통합 계산', () => {
    const result = calculateTotalInitialCost({
      purchasePrice: 100000,
      numberOfHomes: 3,
      regionType: 'regulated',
    });

    // 취득세 12%: 12000 + 1200 + 1200 = 14400
    expect(result.acquisitionTax.totalAcquisitionTax).toBe(14400);
    expect(result.totalUpfront).toBeGreaterThan(14400);
    expect(result.totalRequired).toBe(100000 + result.totalUpfront);
  });
});
