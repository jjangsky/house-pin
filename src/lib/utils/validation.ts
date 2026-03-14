import type { AssetInput } from '@/types';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: string[];
}

const MAX_OWN_CAPITAL = 1_000_000; // 1,000,000만원 = 1000억

export function validateAssetInput(input: AssetInput): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  // ownCapital: 필수, 양수, 1,000,000만원 이하
  if (input.ownCapital === undefined || input.ownCapital === null) {
    errors.ownCapital = '보유 자산을 입력해주세요';
  } else if (input.ownCapital <= 0) {
    errors.ownCapital = '보유 자산은 0보다 커야 합니다';
  } else if (input.ownCapital > MAX_OWN_CAPITAL) {
    errors.ownCapital = '보유 자산은 1,000억 원 이하로 입력해주세요';
  }

  // annualIncome: 필수, 양수
  if (input.annualIncome === undefined || input.annualIncome === null) {
    errors.annualIncome = '연소득을 입력해주세요';
  } else if (input.annualIncome <= 0) {
    errors.annualIncome = '연소득은 0보다 커야 합니다';
  }

  // existingLoanBalance: 0 이상
  if (input.existingLoanBalance < 0) {
    errors.existingLoanBalance = '기존 대출 잔액은 0 이상이어야 합니다';
  }

  // existingLoanPayment: 0 이상, 잔액 > 0이면 상환액 필수
  if (input.existingLoanPayment < 0) {
    errors.existingLoanPayment = '기존 대출 월 상환액은 0 이상이어야 합니다';
  } else if (input.existingLoanBalance > 0 && input.existingLoanPayment === 0) {
    errors.existingLoanPayment = '기존 대출이 있으면 월 상환액을 입력해주세요';
  }

  // householdIncome: 신혼부부일 때 필수 (양수), 0 이상
  if (input.isNewlywed) {
    if (input.householdIncome === undefined || input.householdIncome === null) {
      errors.householdIncome = '신혼부부는 세대 합산 소득을 입력해주세요';
    } else if (input.householdIncome <= 0) {
      errors.householdIncome = '신혼부부는 세대 합산 소득을 입력해주세요';
    }
  }

  // 경고: 월상환액 x 12 > 연소득
  if (
    input.existingLoanPayment > 0 &&
    input.annualIncome > 0 &&
    input.existingLoanPayment * 12 > input.annualIncome
  ) {
    warnings.push('월 상환액이 연소득을 초과합니다');
  }

  // 경고: 다주택자
  if (input.numberOfHomes >= 2) {
    warnings.push('다주택자는 규제지역에서 대출이 제한될 수 있습니다');
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}
