// =============================================================================
// TCO (Total Cost of Ownership) 계산
// 매물 구매 시 첫 해 실질 비용을 통합 산출
// 모든 금액 단위: 만원
// =============================================================================

import type { RegionType } from '@/constants/policy';
import { MOVING_COST_TABLE, MAINTENANCE_FEE_PER_SQM } from '@/constants/tax';
import type {
  TcoInput,
  TcoResult,
  MovingCostEstimate,
  MaintenanceFeeEstimate,
} from '@/types/tax';
import { calculateTotalInitialCost } from './tax';

// =============================================================================
// 이사비용 추정
// =============================================================================

/**
 * 전용면적 기준 이사비용을 추정한다.
 */
export function estimateMovingCost(area: number): MovingCostEstimate {
  const tier = MOVING_COST_TABLE.find((t) => area <= t.maxArea);
  const movingCost = tier ? tier.cost : MOVING_COST_TABLE[MOVING_COST_TABLE.length - 1].cost;

  return { area, movingCost };
}

// =============================================================================
// 관리비 추정
// =============================================================================

/**
 * 전용면적 기준 월 관리비를 추정한다.
 * 아파트 평균 단가(㎡당 약 3,000원) 기반.
 */
export function estimateMaintenanceFee(area: number): MaintenanceFeeEstimate {
  const monthlyFee = Math.round(area * MAINTENANCE_FEE_PER_SQM);
  const annualFee = monthlyFee * 12;

  return { area, monthlyFee, annualFee };
}

// =============================================================================
// TCO 통합 계산
// =============================================================================

/**
 * 매물의 첫 해 총 소유 비용(TCO)을 계산한다.
 *
 * TCO = 1회성 비용 + 연간 반복 비용
 *
 * 1회성: 취득세 + 등기비용 + 중개수수료 + 이사비용
 * 반복(연): 보유세 + 관리비 + 대출이자
 */
export function calculateTco(input: TcoInput): TcoResult {
  const { purchasePrice, numberOfHomes, regionType, area, monthlyLoanPayment, annualLoanInterest } =
    input;

  // 기존 세금/수수료 계산 재활용
  const initialCost = calculateTotalInitialCost({
    purchasePrice,
    numberOfHomes,
    regionType: regionType as RegionType,
  });

  // 추가 비용 추정
  const moving = estimateMovingCost(area);
  const maintenance = estimateMaintenanceFee(area);

  // 1회성 비용
  const oneTimeCosts = {
    acquisitionTax: initialCost.acquisitionTax.totalAcquisitionTax,
    registrationCost: initialCost.registrationCost.totalRegistrationCost,
    brokerageFee: initialCost.brokerageFee.brokerageFee,
    movingCost: moving.movingCost,
    total:
      initialCost.acquisitionTax.totalAcquisitionTax +
      initialCost.registrationCost.totalRegistrationCost +
      initialCost.brokerageFee.brokerageFee +
      moving.movingCost,
  };

  // 연간 반복 비용
  const annualRecurringCosts = {
    holdingTax: initialCost.propertyTax.totalAnnualHoldingTax,
    maintenanceFee: maintenance.annualFee,
    loanInterest: annualLoanInterest,
    total:
      initialCost.propertyTax.totalAnnualHoldingTax +
      maintenance.annualFee +
      annualLoanInterest,
  };

  // 월 환산
  const monthlyCosts = {
    holdingTax: Math.round(initialCost.propertyTax.totalAnnualHoldingTax / 12),
    maintenanceFee: maintenance.monthlyFee,
    loanPayment: monthlyLoanPayment,
    total:
      Math.round(initialCost.propertyTax.totalAnnualHoldingTax / 12) +
      maintenance.monthlyFee +
      monthlyLoanPayment,
  };

  return {
    oneTimeCosts,
    annualRecurringCosts,
    monthlyCosts,
    firstYearTotal: oneTimeCosts.total + annualRecurringCosts.total,
    monthlyRecurringTotal: monthlyCosts.total,
  };
}
