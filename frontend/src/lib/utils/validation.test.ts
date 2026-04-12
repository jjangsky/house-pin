import { describe, it, expect } from 'vitest';
import { validateAssetInput } from './validation';
import type { AssetInput } from '@/types';

const validInput: AssetInput = {
  ownCapital: 10000,
  annualIncome: 6000,
  existingLoanBalance: 0,
  existingLoanPayment: 0,
  isFirstTimeBuyer: true,
  numberOfHomes: 0,
  isNewlywed: false,
  householdIncome: 0,
  loanTermYears: 30,
  repaymentType: 'equal_payment' as const,
  transactionType: 'buy' as const,
};

function inputWith(overrides: Partial<AssetInput>): AssetInput {
  return { ...validInput, ...overrides };
}

describe('validateAssetInput', () => {
  it('유효한 입력 -> isValid: true, errors 비어있음', () => {
    const result = validateAssetInput(validInput);
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it('ownCapital 0 -> 에러', () => {
    const result = validateAssetInput(inputWith({ ownCapital: 0 }));
    expect(result.isValid).toBe(false);
    expect(result.errors.ownCapital).toBeDefined();
  });

  it('annualIncome 0 -> 에러', () => {
    const result = validateAssetInput(inputWith({ annualIncome: 0 }));
    expect(result.isValid).toBe(false);
    expect(result.errors.annualIncome).toBeDefined();
  });

  it('ownCapital 음수 -> 에러', () => {
    const result = validateAssetInput(inputWith({ ownCapital: -100 }));
    expect(result.isValid).toBe(false);
    expect(result.errors.ownCapital).toBeDefined();
  });

  it('ownCapital 1,000,001 이상 -> 에러', () => {
    const result = validateAssetInput(inputWith({ ownCapital: 1_000_001 }));
    expect(result.isValid).toBe(false);
    expect(result.errors.ownCapital).toBeDefined();
  });

  it('existingLoanBalance > 0, existingLoanPayment = 0 -> 에러', () => {
    const result = validateAssetInput(
      inputWith({ existingLoanBalance: 5000, existingLoanPayment: 0 })
    );
    expect(result.isValid).toBe(false);
    expect(result.errors.existingLoanPayment).toBeDefined();
  });

  it('월상환액 x 12 > 연소득 -> 경고', () => {
    const result = validateAssetInput(
      inputWith({
        existingLoanBalance: 10000,
        existingLoanPayment: 600,
        annualIncome: 6000,
      })
    );
    expect(result.warnings).toContain('월 상환액이 연소득을 초과합니다');
  });

  it('numberOfHomes >= 2 -> 경고 (다주택자)', () => {
    const result = validateAssetInput(inputWith({ numberOfHomes: 2 }));
    expect(result.warnings).toContain(
      '다주택자는 규제지역에서 대출이 제한될 수 있습니다'
    );
  });

  it('isNewlywed true, householdIncome 0 -> 에러', () => {
    const result = validateAssetInput(
      inputWith({ isNewlywed: true, householdIncome: 0 })
    );
    expect(result.isValid).toBe(false);
    expect(result.errors.householdIncome).toBeDefined();
  });
});
