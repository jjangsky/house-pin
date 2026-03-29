import { describe, it, expect } from 'vitest';

import { calculateCapitalGainsTax, getLongTermDeductionRate } from './capitalGainsTax';

// =============================================================================
// calculateCapitalGainsTax (양도소득세)
// =============================================================================

describe('calculateCapitalGainsTax', () => {
  // ---------------------------------------------------------------------------
  // 비과세 케이스
  // ---------------------------------------------------------------------------

  describe('비과세', () => {
    it('양도차익 없음 (손실) → 세금 0', () => {
      const result = calculateCapitalGainsTax({
        salePrice: 40000,
        purchasedPrice: 50000,
        holdingPeriodYears: 5,
        isActualResidence: true,
        isRegulatedArea: false,
      });

      expect(result.isExempt).toBe(true);
      expect(result.gain).toBe(-10000);
      expect(result.taxAmount).toBe(0);
      expect(result.exemptReason).toContain('손실');
    });

    it('1주택 비과세 - 비조정지역 2년 보유, 12억 이하', () => {
      const result = calculateCapitalGainsTax({
        salePrice: 80000, // 8억
        purchasedPrice: 60000, // 6억
        holdingPeriodYears: 3,
        isActualResidence: false,
        isRegulatedArea: false,
      });

      expect(result.isExempt).toBe(true);
      expect(result.gain).toBe(20000);
      expect(result.taxAmount).toBe(0);
      expect(result.exemptReason).toContain('비과세');
    });

    it('1주택 비과세 - 조정지역 2년 보유 + 실거주, 12억 이하', () => {
      const result = calculateCapitalGainsTax({
        salePrice: 100000, // 10억
        purchasedPrice: 70000,
        holdingPeriodYears: 3,
        isActualResidence: true,
        isRegulatedArea: true,
      });

      expect(result.isExempt).toBe(true);
      expect(result.taxAmount).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 과세 케이스 - 비과세 요건 미충족
  // ---------------------------------------------------------------------------

  describe('비과세 요건 미충족', () => {
    it('보유기간 1년 → 비과세 불가', () => {
      const result = calculateCapitalGainsTax({
        salePrice: 80000,
        purchasedPrice: 60000,
        holdingPeriodYears: 1,
        isActualResidence: false,
        isRegulatedArea: false,
      });

      expect(result.isExempt).toBe(false);
      expect(result.taxAmount).toBeGreaterThan(0);
      expect(result.exemptReason).toContain('보유기간');
    });

    it('조정지역 실거주 미충족 → 비과세 불가', () => {
      const result = calculateCapitalGainsTax({
        salePrice: 80000,
        purchasedPrice: 60000,
        holdingPeriodYears: 3,
        isActualResidence: false,
        isRegulatedArea: true,
      });

      expect(result.isExempt).toBe(false);
      expect(result.taxAmount).toBeGreaterThan(0);
      expect(result.exemptReason).toContain('실거주');
    });
  });

  // ---------------------------------------------------------------------------
  // 12억 초과 부분과세
  // ---------------------------------------------------------------------------

  describe('12억 초과 부분과세', () => {
    it('매도가 15억 → 초과분(3억)에 비례하여 과세', () => {
      const result = calculateCapitalGainsTax({
        salePrice: 150000, // 15억
        purchasedPrice: 100000, // 10억
        holdingPeriodYears: 5,
        isActualResidence: true,
        isRegulatedArea: true,
      });

      // 비과세 요건 충족하지만 12억 초과
      expect(result.isExempt).toBe(false);
      expect(result.exemptReason).toContain('12억 초과분 과세');

      // 양도차익 5억, 과세비율 = (15억 - 12억) / 15억 = 1/5
      // 과세대상 양도차익 = 5억 * 0.2 = 1억
      const expectedTaxableBeforeDeduction = Math.round(50000 * (30000 / 150000));
      expect(expectedTaxableBeforeDeduction).toBe(10000); // 1억

      expect(result.taxAmount).toBeGreaterThan(0);
      expect(result.gain).toBe(50000);
    });

    it('매도가 정확히 12억 → 비과세', () => {
      const result = calculateCapitalGainsTax({
        salePrice: 120000,
        purchasedPrice: 80000,
        holdingPeriodYears: 3,
        isActualResidence: false,
        isRegulatedArea: false,
      });

      expect(result.isExempt).toBe(true);
      expect(result.taxAmount).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 장기보유특별공제
  // ---------------------------------------------------------------------------

  describe('장기보유특별공제', () => {
    it('보유 3년 → 6% 공제', () => {
      const result = calculateCapitalGainsTax({
        salePrice: 80000,
        purchasedPrice: 60000,
        holdingPeriodYears: 3,
        isActualResidence: false,
        isRegulatedArea: true, // 실거주 미충족으로 과세
      });

      expect(result.longTermDeductionRate).toBe(0.06);
      expect(result.longTermDeduction).toBe(Math.round(20000 * 0.06));
    });

    it('보유 10년 → 20% 공제', () => {
      const result = calculateCapitalGainsTax({
        salePrice: 80000,
        purchasedPrice: 60000,
        holdingPeriodYears: 10,
        isActualResidence: false,
        isRegulatedArea: true,
      });

      expect(result.longTermDeductionRate).toBe(0.20);
    });

    it('보유 15년 이상 → 30% 공제 (최대)', () => {
      const result = calculateCapitalGainsTax({
        salePrice: 80000,
        purchasedPrice: 60000,
        holdingPeriodYears: 20,
        isActualResidence: false,
        isRegulatedArea: true,
      });

      expect(result.longTermDeductionRate).toBe(0.30);
    });

    it('보유 2년 → 공제 없음', () => {
      const result = calculateCapitalGainsTax({
        salePrice: 80000,
        purchasedPrice: 60000,
        holdingPeriodYears: 1,
        isActualResidence: false,
        isRegulatedArea: false,
      });

      expect(result.longTermDeductionRate).toBe(0);
      expect(result.longTermDeduction).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 누진세율 적용
  // ---------------------------------------------------------------------------

  describe('누진세율', () => {
    it('양도차익 1000만 (과세표준) → 6% 적용', () => {
      // 보유 1년, 비조정, 양도차익 = 1000만 + 250(기본공제) = 1250만
      const result = calculateCapitalGainsTax({
        salePrice: 61250, // 양도차익 = 1250만원
        purchasedPrice: 60000,
        holdingPeriodYears: 1,
        isActualResidence: false,
        isRegulatedArea: false,
      });

      // 과세표준 = 1250 - 250(기본공제) = 1000만
      expect(result.taxableGain).toBe(1000);
      // 세금 = 1000 * 6% = 60만
      // 지방소득세 = 60 * 10% = 6만
      expect(result.taxAmount).toBe(66);
    });
  });
});

// =============================================================================
// getLongTermDeductionRate
// =============================================================================

describe('getLongTermDeductionRate', () => {
  it('3년 미만 → 0%', () => {
    expect(getLongTermDeductionRate(0)).toBe(0);
    expect(getLongTermDeductionRate(1)).toBe(0);
    expect(getLongTermDeductionRate(2)).toBe(0);
  });

  it('3년 → 6%', () => {
    expect(getLongTermDeductionRate(3)).toBe(0.06);
  });

  it('5년 → 10%', () => {
    expect(getLongTermDeductionRate(5)).toBe(0.10);
  });

  it('15년 이상 → 30% (최대)', () => {
    expect(getLongTermDeductionRate(15)).toBe(0.30);
    expect(getLongTermDeductionRate(20)).toBe(0.30);
  });
});
