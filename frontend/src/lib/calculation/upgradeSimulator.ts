// =============================================================================
// 갈아타기 시뮬레이터
// 현재 주택 매도 → 새 주택 구매 시뮬레이션
// 매도 정산 + 새 구매력 산출 + 경고 생성
// 모든 금액 단위: 만원
// =============================================================================

import type { UpgradeInput, UpgradeResult } from '@/types/upgrade';
import { calculateBrokerageFee } from './tax';
import { calculateCapitalGainsTax } from './capitalGainsTax';
import { calculateLoanResult } from './index';
import { calculateMonthlyPayment, calculateMonthlyPaymentEqualPrincipal } from './dsr';

/** 기본 시장 금리 (%) */
const DEFAULT_MARKET_RATE = 4.0;

/**
 * 갈아타기 시뮬레이션을 실행한다.
 *
 * 1. 매도 정산: 매도가 - 중개수수료 - 양도세 - 대출상환 = 실수령액
 * 2. 새 자기자본: 실수령액 + 추가 현금
 * 3. 새 대출 한도: LTV/DSR 기반 (기존 대출 없는 상태)
 * 4. 총 구매 가능: 자기자본 + 대출 한도
 * 5. 경고 생성: 일시적 2주택, 단기 보유 등
 */
export function simulateUpgrade(input: UpgradeInput): UpgradeResult {
  // 1. 양도세 계산
  const capitalGainsTaxDetail = calculateCapitalGainsTax({
    salePrice: input.currentHomePrice,
    purchasedPrice: input.purchasedPrice,
    holdingPeriodYears: input.holdingPeriodYears,
    isActualResidence: input.isActualResidence,
    isRegulatedArea: input.isRegulatedArea,
  });

  // 2. 중개수수료 계산
  const brokerageResult = calculateBrokerageFee(input.currentHomePrice);

  // 3. 매도 정산
  const netProceeds =
    input.currentHomePrice -
    brokerageResult.brokerageFee -
    capitalGainsTaxDetail.taxAmount -
    input.currentLoanBalance;

  const saleProceeds = {
    salePrice: input.currentHomePrice,
    brokerageFee: brokerageResult.brokerageFee,
    capitalGainsTax: capitalGainsTaxDetail.taxAmount,
    loanRepayment: input.currentLoanBalance,
    netProceeds: Math.max(0, netProceeds),
  };

  // 4. 새 자기자본
  const ownCapital = Math.max(0, netProceeds) + input.additionalCash;

  // 5. 새 대출 한도 계산 (기존 주택 매도 완료 가정 → 무주택/생애최초 아님)
  const newLoanResult = calculateLoanResult(
    {
      ownCapital,
      annualIncome: input.annualIncome,
      existingLoanBalance: 0, // 기존 대출 상환 완료
      existingLoanPayment: input.existingLoanPayment,
      isFirstTimeBuyer: false, // 갈아타기이므로 생애최초 아님
      numberOfHomes: 0, // 매도 완료 가정
      isNewlywed: false,
      householdIncome: input.annualIncome,
      loanTermYears: input.loanTermYears,
      repaymentType: input.repaymentType,
      transactionType: 'buy',
    },
    DEFAULT_MARKET_RATE,
    {
      regionType: 'nonRegulated', // 새 주택 지역은 비조정으로 기본 설정
    },
  );

  // 6. 월 상환액 계산
  const monthlyPayment =
    input.repaymentType === 'equal_principal'
      ? calculateMonthlyPaymentEqualPrincipal(
          newLoanResult.finalLoanLimit,
          DEFAULT_MARKET_RATE,
          input.loanTermYears,
        )
      : calculateMonthlyPayment(
          newLoanResult.finalLoanLimit,
          DEFAULT_MARKET_RATE,
          input.loanTermYears,
        );

  const newPurchasingPower = {
    ownCapital,
    maxLoanAmount: newLoanResult.finalLoanLimit,
    totalBudget: ownCapital + newLoanResult.finalLoanLimit,
    monthlyPayment: Math.round(monthlyPayment),
  };

  // 7. 경고 생성
  const warnings = generateWarnings(input, saleProceeds, capitalGainsTaxDetail);

  return {
    saleProceeds,
    newPurchasingPower,
    capitalGainsTaxDetail,
    warnings,
  };
}

/**
 * 갈아타기 시 주의사항을 생성한다.
 */
function generateWarnings(
  input: UpgradeInput,
  saleProceeds: UpgradeResult['saleProceeds'],
  taxDetail: UpgradeResult['capitalGainsTaxDetail'],
): string[] {
  const warnings: string[] = [];

  // 일시적 2주택 경고
  warnings.push(
    '새 주택 취득 후 3년 이내에 기존 주택을 매도해야 일시적 2주택 비과세 혜택을 받을 수 있습니다.',
  );

  // 단기 보유 경고
  if (input.holdingPeriodYears < 2) {
    warnings.push(
      `현재 주택 보유기간이 ${input.holdingPeriodYears}년으로 2년 미만입니다. 1세대 1주택 비과세 요건을 충족하지 못합니다.`,
    );
  }

  // 조정지역 실거주 경고
  if (input.isRegulatedArea && !input.isActualResidence) {
    warnings.push(
      '조정대상지역 주택은 2년 이상 실거주해야 비과세 혜택을 받을 수 있습니다.',
    );
  }

  // 양도세 부담이 큰 경우
  if (taxDetail.taxAmount > 0 && taxDetail.taxAmount > input.currentHomePrice * 0.05) {
    warnings.push(
      `양도소득세가 매도가의 ${Math.round((taxDetail.taxAmount / input.currentHomePrice) * 100)}%에 해당합니다. 매도 시기 조정을 검토해보세요.`,
    );
  }

  // 실수령액이 마이너스인 경우
  if (saleProceeds.netProceeds <= 0) {
    warnings.push(
      '매도 후 실수령액이 0원 이하입니다. 대출 잔액과 세금/수수료를 확인해주세요.',
    );
  }

  // 장기보유특별공제 안내
  if (input.holdingPeriodYears >= 2 && input.holdingPeriodYears < 3 && taxDetail.taxAmount > 0) {
    warnings.push(
      '1년만 더 보유하면 장기보유특별공제(6%)를 적용받을 수 있습니다.',
    );
  }

  return warnings;
}
