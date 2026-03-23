// =============================================================================
// 매물별 구매 가능성 분석
// 사용자 대출 조건과 특정 매물 가격을 비교하여 구매 가능 여부 판정
// =============================================================================

import type { AssetInput, LoanResult, Property } from '@/types';

// =============================================================================
// 타입 정의
// =============================================================================

export interface PropertyAffordability {
  /** 매물 가격 (만원) */
  dealAmount: number;
  /** 필요 자기자본 = dealAmount * (1 - ltv) */
  requiredOwnCapital: number;
  /** 필요 대출금 = dealAmount * ltv */
  requiredLoan: number;
  /** 자기자본 과부족 = ownCapital - requiredOwnCapital */
  ownCapitalDiff: number;
  /** 대출 한도 과부족 = finalLoanLimit - requiredLoan */
  loanLimitDiff: number;
  /** 총 과부족 = affordablePrice - dealAmount */
  totalDiff: number;
  /** 구매 가능 여부 */
  isAffordable: boolean;
  /** 판정 사유 */
  limitingReason: LimitingReason;
}

export type LimitingReason =
  | 'affordable'
  | 'own_capital_short'
  | 'loan_limit_exceeded'
  | 'both_short';

// =============================================================================
// 계산 함수
// =============================================================================

/**
 * 특정 매물에 대한 구매 가능성을 분석한다.
 */
export function calculatePropertyAffordability(
  property: Property,
  assetInput: AssetInput,
  loanResult: LoanResult,
): PropertyAffordability {
  const { dealAmount } = property;
  const { ownCapital } = assetInput;
  const { ltv, finalLoanLimit, affordablePrice } = loanResult;

  // ltv는 이미 소수 비율 (0.70 = 70%)
  const requiredOwnCapital = Math.round(dealAmount * (1 - ltv));
  const requiredLoan = dealAmount - requiredOwnCapital;

  const ownCapitalDiff = ownCapital - requiredOwnCapital;
  const loanLimitDiff = finalLoanLimit - requiredLoan;
  const totalDiff = affordablePrice - dealAmount;

  const isOwnCapitalShort = ownCapitalDiff < 0;
  const isLoanExceeded = loanLimitDiff < 0;

  let limitingReason: LimitingReason;
  if (isOwnCapitalShort && isLoanExceeded) {
    limitingReason = 'both_short';
  } else if (isOwnCapitalShort) {
    limitingReason = 'own_capital_short';
  } else if (isLoanExceeded) {
    limitingReason = 'loan_limit_exceeded';
  } else {
    limitingReason = 'affordable';
  }

  return {
    dealAmount,
    requiredOwnCapital,
    requiredLoan,
    ownCapitalDiff,
    loanLimitDiff,
    totalDiff,
    isAffordable: !isOwnCapitalShort && !isLoanExceeded,
    limitingReason,
  };
}

// =============================================================================
// 판정 메시지
// =============================================================================

/**
 * 구매 가능성 판정 결과를 한글 메시지로 변환
 */
export function getAffordabilityMessage(result: PropertyAffordability): string {
  switch (result.limitingReason) {
    case 'affordable':
      return '현재 조건으로 구매 가능합니다';
    case 'own_capital_short':
      return `자기자본이 ${Math.abs(result.ownCapitalDiff).toLocaleString()}만 원 부족합니다`;
    case 'loan_limit_exceeded':
      return `대출 한도가 ${Math.abs(result.loanLimitDiff).toLocaleString()}만 원 부족합니다`;
    case 'both_short':
      return `자기자본 ${Math.abs(result.ownCapitalDiff).toLocaleString()}만 원, 대출 한도 ${Math.abs(result.loanLimitDiff).toLocaleString()}만 원이 부족합니다`;
  }
}
