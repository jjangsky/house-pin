import { describe, it, expect } from 'vitest';
import { getLTV } from './ltv';

describe('getLTV', () => {
  const baseParams = {
    numberOfHomes: 0,
    regionType: 'nonRegulated' as const,
    isFirstTimeBuyer: false,
    propertyPrice: 40000,
    householdIncome: 5000,
  };

  describe('생애최초 주택 구입자', () => {
    it('무주택 + 9억 이하 + 소득 1억 이하 -> 80%', () => {
      expect(
        getLTV({
          ...baseParams,
          isFirstTimeBuyer: true,
          propertyPrice: 90000,
          householdIncome: 10000,
        }),
      ).toBe(0.80);
    });

    it('매매가 9억 초과 -> 생애최초 미적용, 일반 LTV 적용', () => {
      expect(
        getLTV({
          ...baseParams,
          isFirstTimeBuyer: true,
          propertyPrice: 90001,
          householdIncome: 10000,
        }),
      ).toBe(0.70);
    });

    it('소득 1억 초과 -> 생애최초 미적용', () => {
      expect(
        getLTV({
          ...baseParams,
          isFirstTimeBuyer: true,
          propertyPrice: 50000,
          householdIncome: 10001,
        }),
      ).toBe(0.70);
    });

    it('1주택 보유 시 생애최초 미적용', () => {
      expect(
        getLTV({
          ...baseParams,
          numberOfHomes: 1,
          isFirstTimeBuyer: true,
          propertyPrice: 50000,
          householdIncome: 5000,
        }),
      ).toBe(0.60);
    });
  });

  describe('무주택자 (비생애최초)', () => {
    it('투기과열 -> 50%', () => {
      expect(getLTV({ ...baseParams, regionType: 'speculative' })).toBe(0.50);
    });

    it('조정대상 -> 60%', () => {
      expect(getLTV({ ...baseParams, regionType: 'regulated' })).toBe(0.60);
    });

    it('비규제 -> 70%', () => {
      expect(getLTV({ ...baseParams, regionType: 'nonRegulated' })).toBe(0.70);
    });
  });

  describe('1주택자', () => {
    it('투기과열 -> 40%', () => {
      expect(
        getLTV({ ...baseParams, numberOfHomes: 1, regionType: 'speculative' }),
      ).toBe(0.40);
    });

    it('조정대상 -> 50%', () => {
      expect(
        getLTV({ ...baseParams, numberOfHomes: 1, regionType: 'regulated' }),
      ).toBe(0.50);
    });

    it('비규제 -> 60%', () => {
      expect(
        getLTV({ ...baseParams, numberOfHomes: 1, regionType: 'nonRegulated' }),
      ).toBe(0.60);
    });
  });

  describe('다주택자 (2주택 이상)', () => {
    it('투기과열 -> 0%', () => {
      expect(
        getLTV({ ...baseParams, numberOfHomes: 2, regionType: 'speculative' }),
      ).toBe(0);
    });

    it('조정대상 -> 0%', () => {
      expect(
        getLTV({ ...baseParams, numberOfHomes: 2, regionType: 'regulated' }),
      ).toBe(0);
    });

    it('비규제 -> 60%', () => {
      expect(
        getLTV({ ...baseParams, numberOfHomes: 2, regionType: 'nonRegulated' }),
      ).toBe(0.60);
    });

    it('3주택 이상도 동일', () => {
      expect(
        getLTV({ ...baseParams, numberOfHomes: 5, regionType: 'nonRegulated' }),
      ).toBe(0.60);
    });
  });
});
