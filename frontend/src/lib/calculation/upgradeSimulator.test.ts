import { describe, it, expect } from 'vitest';

import { simulateUpgrade } from './upgradeSimulator';
import type { UpgradeInput } from '@/types/upgrade';

// =============================================================================
// 기본 입력 헬퍼
// =============================================================================

function createInput(overrides: Partial<UpgradeInput> = {}): UpgradeInput {
  return {
    currentHomePrice: 80000,   // 8억 매도
    currentLoanBalance: 20000, // 2억 대출 잔액
    holdingPeriodYears: 5,
    isActualResidence: true,
    purchasedPrice: 60000,     // 6억 매입
    isRegulatedArea: false,
    annualIncome: 8000,        // 연 8000만
    existingLoanPayment: 0,
    additionalCash: 5000,      // 5000만 추가 현금
    loanTermYears: 30,
    repaymentType: 'equal_payment' as const,
    ...overrides,
  };
}

// =============================================================================
// simulateUpgrade
// =============================================================================

describe('simulateUpgrade', () => {
  // ---------------------------------------------------------------------------
  // 매도 정산
  // ---------------------------------------------------------------------------

  describe('매도 정산', () => {
    it('비과세 케이스: 중개수수료만 차감', () => {
      const input = createInput();
      const result = simulateUpgrade(input);

      // 8억 비조정 5년 보유 실거주 → 비과세 (12억 이하)
      expect(result.capitalGainsTaxDetail.isExempt).toBe(true);
      expect(result.saleProceeds.capitalGainsTax).toBe(0);

      // 중개수수료: 8억 * 0.005 = 400만 (6~9억 구간)
      expect(result.saleProceeds.brokerageFee).toBe(400);

      // 실수령 = 80000 - 400 - 0 - 20000 = 59600
      expect(result.saleProceeds.netProceeds).toBe(59600);
    });

    it('과세 케이스: 양도세 + 중개수수료 차감', () => {
      const input = createInput({
        holdingPeriodYears: 1, // 비과세 요건 미충족
      });
      const result = simulateUpgrade(input);

      expect(result.capitalGainsTaxDetail.isExempt).toBe(false);
      expect(result.saleProceeds.capitalGainsTax).toBeGreaterThan(0);
      expect(result.saleProceeds.netProceeds).toBeLessThan(59600);
    });

    it('대출 잔액이 0이면 대출상환 없음', () => {
      const input = createInput({ currentLoanBalance: 0 });
      const result = simulateUpgrade(input);

      expect(result.saleProceeds.loanRepayment).toBe(0);
      // 실수령 = 80000 - 400(수수료) - 0(세금) - 0(대출)
      expect(result.saleProceeds.netProceeds).toBe(79600);
    });
  });

  // ---------------------------------------------------------------------------
  // 새 구매력
  // ---------------------------------------------------------------------------

  describe('새 구매력', () => {
    it('자기자본 = 실수령 + 추가현금', () => {
      const input = createInput();
      const result = simulateUpgrade(input);

      const expectedOwnCapital = result.saleProceeds.netProceeds + input.additionalCash;
      expect(result.newPurchasingPower.ownCapital).toBe(expectedOwnCapital);
    });

    it('LTV/DSR 기반 대출 한도가 적용됨', () => {
      const input = createInput();
      const result = simulateUpgrade(input);

      // 대출 한도 > 0
      expect(result.newPurchasingPower.maxLoanAmount).toBeGreaterThan(0);
      // 총 예산 = 자기자본 + 대출한도
      expect(result.newPurchasingPower.totalBudget).toBe(
        result.newPurchasingPower.ownCapital + result.newPurchasingPower.maxLoanAmount,
      );
    });

    it('월 상환액이 계산됨', () => {
      const input = createInput();
      const result = simulateUpgrade(input);

      expect(result.newPurchasingPower.monthlyPayment).toBeGreaterThan(0);
    });

    it('추가 현금 0일 때도 정상 동작', () => {
      const input = createInput({ additionalCash: 0 });
      const result = simulateUpgrade(input);

      expect(result.newPurchasingPower.ownCapital).toBe(result.saleProceeds.netProceeds);
      expect(result.newPurchasingPower.totalBudget).toBeGreaterThan(0);
    });

    it('원금균등 상환 선택 시 월 상환액 차이', () => {
      const equalPayment = simulateUpgrade(createInput({ repaymentType: 'equal_payment' }));
      const equalPrincipal = simulateUpgrade(createInput({ repaymentType: 'equal_principal' }));

      // 원금균등은 초기 상환액이 원리금균등보다 큼
      expect(equalPrincipal.newPurchasingPower.monthlyPayment).toBeGreaterThan(
        equalPayment.newPurchasingPower.monthlyPayment,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 경고
  // ---------------------------------------------------------------------------

  describe('경고', () => {
    it('일시적 2주택 경고가 항상 포함됨', () => {
      const result = simulateUpgrade(createInput());
      expect(result.warnings.some((w) => w.includes('일시적 2주택'))).toBe(true);
    });

    it('단기 보유 경고 (2년 미만)', () => {
      const result = simulateUpgrade(createInput({ holdingPeriodYears: 1 }));
      expect(result.warnings.some((w) => w.includes('2년 미만'))).toBe(true);
    });

    it('조정지역 실거주 미충족 경고', () => {
      const result = simulateUpgrade(
        createInput({ isRegulatedArea: true, isActualResidence: false }),
      );
      expect(result.warnings.some((w) => w.includes('실거주'))).toBe(true);
    });

    it('장기보유특별공제 안내 (2년 보유, 과세 대상)', () => {
      const result = simulateUpgrade(
        createInput({
          holdingPeriodYears: 2,
          isRegulatedArea: true,
          isActualResidence: false,
        }),
      );
      expect(result.warnings.some((w) => w.includes('장기보유특별공제'))).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 엣지 케이스
  // ---------------------------------------------------------------------------

  describe('엣지 케이스', () => {
    it('양도차익 없음 (매입가 = 매도가)', () => {
      const input = createInput({
        currentHomePrice: 60000,
        purchasedPrice: 60000,
      });
      const result = simulateUpgrade(input);

      expect(result.capitalGainsTaxDetail.gain).toBe(0);
      expect(result.capitalGainsTaxDetail.isExempt).toBe(true);
      expect(result.saleProceeds.capitalGainsTax).toBe(0);
    });

    it('대출 잔액이 매도가보다 큰 경우 → 실수령 0', () => {
      const input = createInput({
        currentHomePrice: 50000,
        currentLoanBalance: 60000,
        purchasedPrice: 60000,
      });
      const result = simulateUpgrade(input);

      // netProceeds = max(0, 50000 - fee - tax - 60000) = 0
      expect(result.saleProceeds.netProceeds).toBe(0);
    });

    it('실수령 0일 때 경고 포함', () => {
      const input = createInput({
        currentHomePrice: 50000,
        currentLoanBalance: 60000,
        purchasedPrice: 60000,
      });
      const result = simulateUpgrade(input);

      expect(result.warnings.some((w) => w.includes('실수령액이 0원 이하'))).toBe(true);
    });
  });
});
