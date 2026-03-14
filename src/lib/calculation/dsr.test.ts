import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyPayment,
  calculateMonthlyPaymentEqualPrincipal,
  getDsrBasedLimit,
} from './dsr';

describe('calculateMonthlyPayment (원리금균등)', () => {
  it('일반적인 대출 계산', () => {
    // 3억(30000만원), 3.5%, 30년
    const result = calculateMonthlyPayment(30000, 3.5, 30);
    // 약 134.7만원
    expect(result).toBeGreaterThan(134);
    expect(result).toBeLessThan(136);
  });

  it('금리 0% -> 단순 균등분할', () => {
    // 36000만원, 0%, 30년 -> 36000 / 360 = 100만원
    const result = calculateMonthlyPayment(36000, 0, 30);
    expect(result).toBe(100);
  });

  it('원금 0 -> 0', () => {
    expect(calculateMonthlyPayment(0, 3.5, 30)).toBe(0);
  });

  it('기간 0 -> 0', () => {
    expect(calculateMonthlyPayment(30000, 3.5, 0)).toBe(0);
  });

  it('음수 원금 -> 0', () => {
    expect(calculateMonthlyPayment(-1000, 3.5, 30)).toBe(0);
  });

  it('높은 금리에서도 정상 계산', () => {
    const result = calculateMonthlyPayment(10000, 10, 20);
    expect(result).toBeGreaterThan(0);
    expect(Number.isFinite(result)).toBe(true);
  });
});

describe('calculateMonthlyPaymentEqualPrincipal (원금균등)', () => {
  it('첫 달 상환액 계산 (원금분할 + 전체 원금 이자)', () => {
    // 36000만원, 3.6%, 30년
    // 월 원금: 36000/360 = 100만원
    // 첫달 이자: 36000 * 0.036/12 = 108만원
    // 합계: 208만원
    const result = calculateMonthlyPaymentEqualPrincipal(36000, 3.6, 30);
    expect(result).toBeCloseTo(208, 0);
  });

  it('금리 0% -> 원금균등분할만', () => {
    const result = calculateMonthlyPaymentEqualPrincipal(36000, 0, 30);
    expect(result).toBe(100);
  });

  it('원금 0 -> 0', () => {
    expect(calculateMonthlyPaymentEqualPrincipal(0, 3.5, 30)).toBe(0);
  });

  it('기간 0 -> 0', () => {
    expect(calculateMonthlyPaymentEqualPrincipal(30000, 3.5, 0)).toBe(0);
  });
});

describe('getDsrBasedLimit (DSR 역산)', () => {
  it('기존 대출 없는 경우', () => {
    // 연소득 5000만, 기존대출 0, 금리 3.5%, 30년, DSR 40%
    const result = getDsrBasedLimit({
      annualIncome: 5000,
      existingLoanPayment: 0,
      interestRate: 3.5,
      termYears: 30,
    });
    // DSR 40%: 연간 2000만 허용 -> 월 166.7만
    // 역산하면 약 37,000만원 정도
    expect(result).toBeGreaterThan(35000);
    expect(result).toBeLessThan(40000);
  });

  it('기존 대출이 있는 경우 한도 감소', () => {
    const withoutLoan = getDsrBasedLimit({
      annualIncome: 5000,
      existingLoanPayment: 0,
      interestRate: 3.5,
      termYears: 30,
    });

    const withLoan = getDsrBasedLimit({
      annualIncome: 5000,
      existingLoanPayment: 50, // 월 50만원 기존 상환
      interestRate: 3.5,
      termYears: 30,
    });

    expect(withLoan).toBeLessThan(withoutLoan);
    expect(withLoan).toBeGreaterThan(0);
  });

  it('기존 상환액이 DSR 한도를 초과하면 0', () => {
    // 연소득 3000만, DSR 40% -> 연 1200만 허용 -> 월 100만
    // 기존 월상환 120만 -> 초과
    const result = getDsrBasedLimit({
      annualIncome: 3000,
      existingLoanPayment: 120,
      interestRate: 3.5,
      termYears: 30,
    });
    expect(result).toBe(0);
  });

  it('금리 0% -> 단순 역산', () => {
    // 연소득 6000만, DSR 40% -> 연 2400만 -> 월 200만
    // 30년 = 360개월, 200 * 360 = 72000만원
    const result = getDsrBasedLimit({
      annualIncome: 6000,
      existingLoanPayment: 0,
      interestRate: 0,
      termYears: 30,
    });
    expect(result).toBe(72000);
  });

  it('연소득 0 -> 0', () => {
    expect(
      getDsrBasedLimit({
        annualIncome: 0,
        existingLoanPayment: 0,
        interestRate: 3.5,
        termYears: 30,
      }),
    ).toBe(0);
  });

  it('기간 0 -> 0', () => {
    expect(
      getDsrBasedLimit({
        annualIncome: 5000,
        existingLoanPayment: 0,
        interestRate: 3.5,
        termYears: 0,
      }),
    ).toBe(0);
  });

  it('커스텀 DSR 한도 적용', () => {
    const bank = getDsrBasedLimit({
      annualIncome: 5000,
      existingLoanPayment: 0,
      interestRate: 3.5,
      termYears: 30,
      dsrLimit: 0.40,
    });

    const nonBank = getDsrBasedLimit({
      annualIncome: 5000,
      existingLoanPayment: 0,
      interestRate: 3.5,
      termYears: 30,
      dsrLimit: 0.50,
    });

    expect(nonBank).toBeGreaterThan(bank);
  });
});
