import { describe, it, expect } from 'vitest';

import type { AssetInput, LoanResult, Property } from '@/types';

import {
  calculatePropertyAffordability,
  getAffordabilityMessage,
} from './affordability';

// =============================================================================
// 테스트 데이터
// =============================================================================

const BASE_ASSET_INPUT: AssetInput = {
  ownCapital: 20000, // 2억
  annualIncome: 6000,
  existingLoanBalance: 0,
  existingLoanPayment: 0,
  isFirstTimeBuyer: true,
  numberOfHomes: 0,
  isNewlywed: false,
  householdIncome: 6000,
  loanTermYears: 30,
  repaymentType: 'equal_payment',
  transactionType: 'buy',
};

const BASE_LOAN_RESULT: LoanResult = {
  ltv: 70,
  ltvBasedLimit: 46667,
  dsrBasedLimit: 50000,
  finalLoanLimit: 46667, // 약 4.67억
  affordablePrice: 66667, // 약 6.67억
  jeonseAffordable: 0,
  monthlyPayment: 200,
  limitingFactor: 'ltv',
  policyLoans: { didimdol: true, bogeumjari: true, batimok: false },
  bankComparisons: [],
};

function makeProperty(overrides: Partial<Property> = {}): Property {
  return {
    dealAmount: 50000, // 5억
    buildYear: 2020,
    dealYear: 2026,
    dealMonth: 3,
    dealDay: 10,
    dong: '서초동',
    name: '래미안',
    area: 59.9,
    floor: 10,
    jibun: '123',
    regionCode: '11650',
    propertyType: 'apartment',
    ...overrides,
  };
}

// =============================================================================
// calculatePropertyAffordability
// =============================================================================

describe('calculatePropertyAffordability', () => {
  it('구매 가능한 매물을 판정한다', () => {
    const property = makeProperty({ dealAmount: 50000 }); // 5억
    const result = calculatePropertyAffordability(
      property,
      BASE_ASSET_INPUT,
      BASE_LOAN_RESULT,
    );

    expect(result.isAffordable).toBe(true);
    expect(result.limitingReason).toBe('affordable');
    expect(result.requiredOwnCapital).toBe(15000); // 5억 * 30%
    expect(result.requiredLoan).toBe(35000); // 5억 * 70%
    expect(result.ownCapitalDiff).toBe(5000); // 2억 - 1.5억
    expect(result.loanLimitDiff).toBe(11667); // 4.67억 - 3.5억
  });

  it('자기자본 부족을 판정한다', () => {
    const property = makeProperty({ dealAmount: 60000 }); // 6억
    const assetInput = { ...BASE_ASSET_INPUT, ownCapital: 10000 }; // 1억
    const result = calculatePropertyAffordability(
      property,
      assetInput,
      BASE_LOAN_RESULT,
    );

    expect(result.isAffordable).toBe(false);
    expect(result.limitingReason).toBe('own_capital_short');
    expect(result.ownCapitalDiff).toBeLessThan(0);
    expect(result.loanLimitDiff).toBeGreaterThanOrEqual(0);
  });

  it('대출 한도 초과를 판정한다', () => {
    const property = makeProperty({ dealAmount: 80000 }); // 8억
    const assetInput = { ...BASE_ASSET_INPUT, ownCapital: 30000 }; // 3억
    const result = calculatePropertyAffordability(
      property,
      assetInput,
      BASE_LOAN_RESULT,
    );

    // 필요 자기자본: 8억 * 30% = 2.4억 (3억으로 충분)
    // 필요 대출: 8억 * 70% = 5.6억 (한도 4.67억 초과)
    expect(result.isAffordable).toBe(false);
    expect(result.limitingReason).toBe('loan_limit_exceeded');
    expect(result.ownCapitalDiff).toBeGreaterThanOrEqual(0);
    expect(result.loanLimitDiff).toBeLessThan(0);
  });

  it('둘 다 부족한 경우를 판정한다', () => {
    const property = makeProperty({ dealAmount: 100000 }); // 10억
    const assetInput = { ...BASE_ASSET_INPUT, ownCapital: 10000 }; // 1억
    const result = calculatePropertyAffordability(
      property,
      assetInput,
      BASE_LOAN_RESULT,
    );

    // 필요 자기자본: 10억 * 30% = 3억 (1억으로 부족)
    // 필요 대출: 10억 * 70% = 7억 (한도 4.67억 초과)
    expect(result.isAffordable).toBe(false);
    expect(result.limitingReason).toBe('both_short');
    expect(result.ownCapitalDiff).toBeLessThan(0);
    expect(result.loanLimitDiff).toBeLessThan(0);
  });

  it('totalDiff를 정확히 계산한다', () => {
    const property = makeProperty({ dealAmount: 50000 });
    const result = calculatePropertyAffordability(
      property,
      BASE_ASSET_INPUT,
      BASE_LOAN_RESULT,
    );

    expect(result.totalDiff).toBe(
      BASE_LOAN_RESULT.affordablePrice - property.dealAmount,
    );
  });
});

// =============================================================================
// getAffordabilityMessage
// =============================================================================

describe('getAffordabilityMessage', () => {
  it('구매 가능 메시지를 반환한다', () => {
    const result = calculatePropertyAffordability(
      makeProperty({ dealAmount: 50000 }),
      BASE_ASSET_INPUT,
      BASE_LOAN_RESULT,
    );
    expect(getAffordabilityMessage(result)).toBe('현재 조건으로 구매 가능합니다');
  });

  it('자기자본 부족 메시지를 반환한다', () => {
    const result = calculatePropertyAffordability(
      makeProperty({ dealAmount: 60000 }),
      { ...BASE_ASSET_INPUT, ownCapital: 10000 },
      BASE_LOAN_RESULT,
    );
    const msg = getAffordabilityMessage(result);
    expect(msg).toContain('자기자본이');
    expect(msg).toContain('부족합니다');
  });

  it('대출 한도 부족 메시지를 반환한다', () => {
    const result = calculatePropertyAffordability(
      makeProperty({ dealAmount: 80000 }),
      { ...BASE_ASSET_INPUT, ownCapital: 30000 },
      BASE_LOAN_RESULT,
    );
    const msg = getAffordabilityMessage(result);
    expect(msg).toContain('대출 한도가');
    expect(msg).toContain('부족합니다');
  });

  it('둘 다 부족 메시지를 반환한다', () => {
    const result = calculatePropertyAffordability(
      makeProperty({ dealAmount: 100000 }),
      { ...BASE_ASSET_INPUT, ownCapital: 10000 },
      BASE_LOAN_RESULT,
    );
    const msg = getAffordabilityMessage(result);
    expect(msg).toContain('자기자본');
    expect(msg).toContain('대출 한도');
  });
});
