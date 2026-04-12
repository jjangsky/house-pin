// =============================================================================
// 양도소득세 계산
// 1세대 1주택 비과세, 12억 초과분 과세, 장기보유특별공제, 누진세율 적용
// 모든 금액 단위: 만원
// =============================================================================

import {
  CAPITAL_GAINS_EXEMPT_LIMIT,
  EXEMPT_MIN_HOLDING_YEARS,
  CAPITAL_GAINS_TAX_BRACKETS,
  LONG_TERM_HOLDING_DEDUCTION,
  LOCAL_INCOME_TAX_RATE,
} from '@/constants/tax';
import type { CapitalGainsTaxDetail } from '@/types/upgrade';

interface CapitalGainsTaxInput {
  /** 매도가 (만원) */
  salePrice: number;
  /** 매입가 (만원) */
  purchasedPrice: number;
  /** 보유 기간 (년) */
  holdingPeriodYears: number;
  /** 실거주 여부 (2년 이상) */
  isActualResidence: boolean;
  /** 조정지역 여부 */
  isRegulatedArea: boolean;
}

/**
 * 양도소득세를 계산한다.
 *
 * 1세대 1주택 비과세 요건:
 * - 2년 이상 보유 (비조정지역) 또는 2년 보유 + 2년 거주 (조정지역)
 * - 매도가 12억 이하 → 전액 비과세
 * - 매도가 12억 초과 → 초과분 비례 과세
 *
 * 과세 시:
 * - 장기보유특별공제 적용 (3년 이상 보유)
 * - 양도소득 기본공제 250만원
 * - 누진세율 적용
 * - 지방소득세 10% 추가
 */
export function calculateCapitalGainsTax(
  input: CapitalGainsTaxInput,
): CapitalGainsTaxDetail {
  const {
    salePrice,
    purchasedPrice,
    holdingPeriodYears,
    isActualResidence,
    isRegulatedArea,
  } = input;

  const gain = salePrice - purchasedPrice;

  // 양도차익이 없거나 손실이면 세금 없음
  if (gain <= 0) {
    return {
      gain,
      isExempt: true,
      exemptReason: '양도차익 없음 (손실)',
      taxRate: 0,
      taxAmount: 0,
      longTermDeductionRate: 0,
      longTermDeduction: 0,
      taxableGain: 0,
    };
  }

  // 1세대 1주택 비과세 요건 확인
  const exemptCheck = checkExemption(holdingPeriodYears, isActualResidence, isRegulatedArea);

  if (exemptCheck.isExempt) {
    // 매도가 12억 이하 → 전액 비과세
    if (salePrice <= CAPITAL_GAINS_EXEMPT_LIMIT) {
      return {
        gain,
        isExempt: true,
        exemptReason: exemptCheck.reason,
        taxRate: 0,
        taxAmount: 0,
        longTermDeductionRate: 0,
        longTermDeduction: 0,
        taxableGain: 0,
      };
    }

    // 매도가 12억 초과 → 초과분만 비례 과세
    // 과세 양도차익 = 양도차익 * (매도가 - 12억) / 매도가
    const excessRatio = (salePrice - CAPITAL_GAINS_EXEMPT_LIMIT) / salePrice;
    const taxableGainBeforeDeduction = Math.round(gain * excessRatio);

    return calculateTaxOnGain(taxableGainBeforeDeduction, holdingPeriodYears, gain, exemptCheck.reason + ' (12억 초과분 과세)');
  }

  // 비과세 요건 미충족 → 전액 과세
  return calculateTaxOnGain(gain, holdingPeriodYears, gain, exemptCheck.reason);
}

/**
 * 비과세 요건을 확인한다.
 */
function checkExemption(
  holdingPeriodYears: number,
  isActualResidence: boolean,
  isRegulatedArea: boolean,
): { isExempt: boolean; reason: string } {
  if (holdingPeriodYears < EXEMPT_MIN_HOLDING_YEARS) {
    return {
      isExempt: false,
      reason: `보유기간 ${holdingPeriodYears}년 - 최소 ${EXEMPT_MIN_HOLDING_YEARS}년 보유 필요`,
    };
  }

  if (isRegulatedArea && !isActualResidence) {
    return {
      isExempt: false,
      reason: '조정지역은 2년 이상 실거주 필요',
    };
  }

  return {
    isExempt: true,
    reason: isRegulatedArea
      ? '1세대 1주택 비과세 (2년 보유 + 실거주)'
      : '1세대 1주택 비과세 (2년 보유)',
  };
}

/**
 * 과세 대상 양도차익에 대해 세금을 계산한다.
 * 장기보유특별공제 → 기본공제(250만원) → 누진세율 → 지방소득세
 */
function calculateTaxOnGain(
  taxableGainBeforeDeduction: number,
  holdingPeriodYears: number,
  totalGain: number,
  reason: string,
): CapitalGainsTaxDetail {
  // 장기보유특별공제
  const longTermDeductionRate = getLongTermDeductionRate(holdingPeriodYears);
  const longTermDeduction = Math.round(taxableGainBeforeDeduction * longTermDeductionRate);
  const afterLongTermDeduction = taxableGainBeforeDeduction - longTermDeduction;

  // 기본공제 250만원
  const basicDeduction = 250;
  const taxableGain = Math.max(0, afterLongTermDeduction - basicDeduction);

  if (taxableGain <= 0) {
    return {
      gain: totalGain,
      isExempt: false,
      exemptReason: reason,
      taxRate: 0,
      taxAmount: 0,
      longTermDeductionRate,
      longTermDeduction,
      taxableGain: 0,
    };
  }

  // 누진세율 적용
  const { tax, effectiveRate } = applyProgressiveTax(taxableGain);

  // 지방소득세 추가
  const localIncomeTax = Math.round(tax * LOCAL_INCOME_TAX_RATE);
  const totalTax = tax + localIncomeTax;

  return {
    gain: totalGain,
    isExempt: false,
    exemptReason: reason,
    taxRate: Math.round(effectiveRate * 10000) / 100, // 소수점 2자리 %
    taxAmount: totalTax,
    longTermDeductionRate,
    longTermDeduction,
    taxableGain,
  };
}

/**
 * 장기보유특별공제율을 반환한다.
 * 3년 미만은 0%, 15년 이상은 30%
 */
export function getLongTermDeductionRate(holdingPeriodYears: number): number {
  if (holdingPeriodYears < 3) return 0;

  const years = Math.min(holdingPeriodYears, 15);
  return LONG_TERM_HOLDING_DEDUCTION[years] ?? 0.30;
}

/**
 * 누진세율을 적용하여 양도세를 계산한다.
 */
function applyProgressiveTax(taxableGain: number): {
  tax: number;
  effectiveRate: number;
} {
  const bracket = CAPITAL_GAINS_TAX_BRACKETS.find(
    (b) => taxableGain <= b.maxGain,
  );

  if (!bracket) {
    const last = CAPITAL_GAINS_TAX_BRACKETS[CAPITAL_GAINS_TAX_BRACKETS.length - 1];
    const tax = Math.round(taxableGain * last.rate - last.deduction);
    return { tax, effectiveRate: tax / taxableGain };
  }

  const tax = Math.round(taxableGain * bracket.rate - bracket.deduction);
  const effectiveRate = tax / taxableGain;
  return { tax, effectiveRate };
}
