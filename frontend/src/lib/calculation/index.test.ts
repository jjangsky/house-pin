import { describe, it, expect } from 'vitest';
import { calculateLoanResult } from './index';
import type { AssetInput } from '@/types';

const baseInput: AssetInput = {
  ownCapital: 20000,
  annualIncome: 5000,
  existingLoanBalance: 0,
  existingLoanPayment: 0,
  isFirstTimeBuyer: false,
  numberOfHomes: 0,
  isNewlywed: false,
  householdIncome: 5000,
  loanTermYears: 30,
  repaymentType: 'equal_payment',
  transactionType: 'buy',
};

describe('calculateLoanResult (통합 계산)', () => {
  it('기본 케이스: 무주택 비규제 원리금균등', () => {
    const result = calculateLoanResult(baseInput, 3.5);

    expect(result.ltv).toBe(0.70);
    expect(result.ltvBasedLimit).toBeGreaterThan(0);
    expect(result.dsrBasedLimit).toBeGreaterThan(0);
    expect(result.finalLoanLimit).toBeGreaterThan(0);
    expect(result.affordablePrice).toBe(
      baseInput.ownCapital + result.finalLoanLimit,
    );
    expect(result.monthlyPayment).toBeGreaterThan(0);
    expect(result.limitingFactor).toMatch(/^(ltv|dsr)$/);
  });

  it('다주택 규제지역 -> LTV 0% -> 대출 불가', () => {
    const result = calculateLoanResult(
      { ...baseInput, numberOfHomes: 2 },
      3.5,
      { regionType: 'speculative' },
    );

    expect(result.ltv).toBe(0);
    expect(result.ltvBasedLimit).toBe(0);
    expect(result.finalLoanLimit).toBe(0);
    expect(result.affordablePrice).toBe(baseInput.ownCapital);
    expect(result.monthlyPayment).toBe(0);
  });

  it('finalLoanLimit = MIN(ltvBasedLimit, dsrBasedLimit)', () => {
    const result = calculateLoanResult(baseInput, 3.5);
    expect(result.finalLoanLimit).toBe(
      Math.min(result.ltvBasedLimit, result.dsrBasedLimit),
    );
  });

  it('limitingFactor가 올바르게 결정됨', () => {
    const result = calculateLoanResult(baseInput, 3.5);
    if (result.ltvBasedLimit <= result.dsrBasedLimit) {
      expect(result.limitingFactor).toBe('ltv');
    } else {
      expect(result.limitingFactor).toBe('dsr');
    }
  });

  it('원금균등 상환 시 월 상환액이 다름', () => {
    const equalPayment = calculateLoanResult(
      { ...baseInput, repaymentType: 'equal_payment' },
      3.5,
    );
    const equalPrincipal = calculateLoanResult(
      { ...baseInput, repaymentType: 'equal_principal' },
      3.5,
    );

    // 원금균등의 첫 달 상환액이 원리금균등보다 높음
    expect(equalPrincipal.monthlyPayment).toBeGreaterThan(
      equalPayment.monthlyPayment,
    );
  });

  it('금리 0% 엣지 케이스 정상 처리', () => {
    const result = calculateLoanResult(baseInput, 0);
    expect(result.finalLoanLimit).toBeGreaterThan(0);
    expect(result.monthlyPayment).toBeGreaterThan(0);
    expect(Number.isFinite(result.monthlyPayment)).toBe(true);
  });

  it('정책대출 자격이 결과에 포함됨', () => {
    const result = calculateLoanResult(baseInput, 3.5);
    expect(result.policyLoans).toBeDefined();
    expect(typeof result.policyLoans.didimdol).toBe('boolean');
    expect(typeof result.policyLoans.bogeumjari).toBe('boolean');
    expect(typeof result.policyLoans.batimok).toBe('boolean');
  });

  it('버팀목 자격 있으면 전세가능금액에 반영', () => {
    const result = calculateLoanResult(
      { ...baseInput, annualIncome: 4000 },
      3.5,
    );
    if (result.policyLoans.batimok) {
      expect(result.jeonseAffordable).toBeGreaterThan(baseInput.ownCapital);
    }
  });

  it('버팀목 미자격 시 전세가능금액 = 자기자본', () => {
    const result = calculateLoanResult(
      { ...baseInput, numberOfHomes: 1 },
      3.5,
    );
    expect(result.policyLoans.batimok).toBe(false);
    expect(result.jeonseAffordable).toBe(baseInput.ownCapital);
  });

  it('bankComparisons는 빈 배열로 초기화', () => {
    const result = calculateLoanResult(baseInput, 3.5);
    expect(result.bankComparisons).toEqual([]);
  });

  it('기존 대출이 있으면 DSR 한도 감소', () => {
    const withoutLoan = calculateLoanResult(baseInput, 3.5);
    const withLoan = calculateLoanResult(
      { ...baseInput, existingLoanPayment: 100 },
      3.5,
    );

    expect(withLoan.dsrBasedLimit).toBeLessThan(withoutLoan.dsrBasedLimit);
  });

  it('생애최초 무주택자 -> LTV 80%', () => {
    const result = calculateLoanResult(
      { ...baseInput, isFirstTimeBuyer: true, householdIncome: 5000 },
      3.5,
    );
    expect(result.ltv).toBe(0.80);
  });
});
