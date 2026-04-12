// =============================================================================
// 전세 vs 매매 시나리오 비교 엔진
// 동일 기간 동안 전세 유지 vs 매매 시 순비용을 비교하여 의사결정 지원
// 모든 금액 단위: 만원
// =============================================================================

import type { ScenarioInput, ScenarioResult } from '@/types/scenario';
import { calculateTotalInitialCost, calculatePropertyTax } from './tax';
import { calculateMonthlyPayment } from './dsr';
import { estimateMaintenanceFee } from './tco';

// =============================================================================
// 전세 비용 계산
// =============================================================================

/**
 * 전세 시나리오의 기간 내 총 비용을 계산한다.
 *
 * - 기회비용: 전세 보증금을 예금에 넣었을 때 받을 수 있는 이자 합계
 * - 갱신 상승분: 2년마다 전세금 갱신 시 증가하는 보증금의 기회비용 추가분
 *
 * 전세금은 2년 단위 갱신을 가정하며, 갱신 시마다 연간 상승률이 복리로 적용된다.
 */
function calculateJeonseCost(input: ScenarioInput): {
  totalCost: number;
  opportunityCost: number;
  renewalCostIncrease: number;
} {
  const { jeonseDeposit, depositRate, jeonseRenewalRate, comparisonYears } = input;

  let totalOpportunityCost = 0;
  let currentDeposit = jeonseDeposit;
  const rateDecimal = depositRate / 100;
  const renewalDecimal = jeonseRenewalRate / 100;

  for (let year = 1; year <= comparisonYears; year++) {
    // 매년 현재 보증금에 대한 기회비용 누적
    totalOpportunityCost += currentDeposit * rateDecimal;

    // 2년마다 전세 갱신: 보증금 상승 (2년차 말, 4년차 말, ...)
    if (year % 2 === 0 && year < comparisonYears) {
      currentDeposit = Math.round(currentDeposit * Math.pow(1 + renewalDecimal, 2));
    }
  }

  const opportunityCost = Math.round(totalOpportunityCost);
  const renewalCostIncrease = Math.round(currentDeposit - jeonseDeposit);
  const totalCost = opportunityCost;

  return { totalCost, opportunityCost, renewalCostIncrease };
}

// =============================================================================
// 매매 비용 계산
// =============================================================================

/**
 * 매매 시나리오의 기간 내 총 비용과 자산 형성을 계산한다.
 *
 * 비용 항목:
 * - 1회성: 취득세 + 등기비용 + 중개수수료
 * - 반복: 대출이자 + 보유세 + 관리비
 *
 * 자산 형성:
 * - 시세 반영 자산 가치 - 잔여 대출 원금
 */
function calculateBuyCost(input: ScenarioInput): {
  totalCost: number;
  oneTimeCost: number;
  loanInterestTotal: number;
  holdingTaxTotal: number;
  maintenanceTotal: number;
  assetValue: number;
  assetFormed: number;
} {
  const {
    purchasePrice,
    loanAmount,
    mortgageRate,
    loanTermYears,
    priceGrowthRate,
    numberOfHomes,
    regionType,
    area,
    comparisonYears,
  } = input;

  // 1회성 비용 (취득세 + 등기 + 중개)
  const initialCost = calculateTotalInitialCost({
    purchasePrice,
    numberOfHomes,
    regionType,
  });
  const oneTimeCost = initialCost.totalUpfront;

  // 대출이자 총액 (기간 내)
  const monthlyPayment = calculateMonthlyPayment(loanAmount, mortgageRate, loanTermYears);
  const totalPayments = Math.round(monthlyPayment * 12 * comparisonYears);
  const remainingBalance = calculateRemainingBalance(
    loanAmount,
    mortgageRate,
    loanTermYears,
    comparisonYears,
  );
  // 기간 내 상환한 원금 = 원래 대출금 - 잔여 대출금
  const principalPaid = Math.round(loanAmount - remainingBalance);
  const loanInterestTotal = Math.round(totalPayments - principalPaid);

  // 보유세 총액 (기간 내, 매년 동일하다고 가정)
  const propertyTax = calculatePropertyTax(purchasePrice);
  const holdingTaxTotal = Math.round(propertyTax.totalAnnualHoldingTax * comparisonYears);

  // 관리비 총액 (기간 내)
  const maintenance = estimateMaintenanceFee(area);
  const maintenanceTotal = Math.round(maintenance.annualFee * comparisonYears);

  // 총 비용
  const totalCost = oneTimeCost + loanInterestTotal + holdingTaxTotal + maintenanceTotal;

  // 자산 가치 (시세 상승 반영)
  const growthDecimal = priceGrowthRate / 100;
  const assetValue = Math.round(purchasePrice * Math.pow(1 + growthDecimal, comparisonYears));

  // 순 자산 형성 = 자산 가치 - 잔여 대출
  const assetFormed = Math.round(assetValue - remainingBalance);

  return {
    totalCost,
    oneTimeCost,
    loanInterestTotal,
    holdingTaxTotal,
    maintenanceTotal,
    assetValue,
    assetFormed,
  };
}

// =============================================================================
// 잔여 대출 원금 계산
// =============================================================================

/**
 * 원리금균등 상환 시 특정 기간 후 잔여 대출 원금을 계산한다.
 *
 * 잔여 원금 = P * [(1+r)^N - (1+r)^n] / [(1+r)^N - 1]
 * P: 대출 원금, r: 월 이율, N: 총 개월, n: 경과 개월
 */
export function calculateRemainingBalance(
  principal: number,
  annualRate: number,
  totalYears: number,
  elapsedYears: number,
): number {
  if (principal <= 0 || totalYears <= 0) return 0;
  if (elapsedYears >= totalYears) return 0;

  // 금리 0%: 단순 균등분할
  if (annualRate === 0) {
    const totalMonths = totalYears * 12;
    const elapsedMonths = elapsedYears * 12;
    return Math.round(principal * (1 - elapsedMonths / totalMonths));
  }

  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = totalYears * 12;
  const elapsedMonths = elapsedYears * 12;
  const factorTotal = Math.pow(1 + monthlyRate, totalMonths);
  const factorElapsed = Math.pow(1 + monthlyRate, elapsedMonths);

  return Math.round(principal * (factorTotal - factorElapsed) / (factorTotal - 1));
}

// =============================================================================
// 연도별 누적 비용 계산
// =============================================================================

/**
 * 각 연도별 전세/매매 누적 순비용을 계산한다.
 * 차트 데이터용.
 */
function calculateYearlyBreakdown(input: ScenarioInput): Array<{
  year: number;
  jeonseCumulative: number;
  buyCumulative: number;
}> {
  const breakdown: Array<{
    year: number;
    jeonseCumulative: number;
    buyCumulative: number;
  }> = [];

  for (let year = 1; year <= input.comparisonYears; year++) {
    const yearInput = { ...input, comparisonYears: year };

    const jeonseCost = calculateJeonseCost(yearInput);
    const jeonseCumulative = jeonseCost.totalCost; // 전세는 자산형성 없음

    const buyCost = calculateBuyCost(yearInput);
    const buyCumulative = buyCost.totalCost - buyCost.assetFormed;

    breakdown.push({
      year,
      jeonseCumulative: Math.round(jeonseCumulative),
      buyCumulative: Math.round(buyCumulative),
    });
  }

  return breakdown;
}

// =============================================================================
// 손익분기점 계산
// =============================================================================

/**
 * 매매가 전세보다 유리해지는 시점(년)을 찾는다.
 * 최대 30년까지 탐색하며, 찾지 못하면 null 반환.
 */
function findBreakEvenYear(input: ScenarioInput): number | null {
  const MAX_SEARCH_YEARS = 30;

  for (let year = 1; year <= MAX_SEARCH_YEARS; year++) {
    const yearInput = { ...input, comparisonYears: year };

    const jeonseCost = calculateJeonseCost(yearInput);
    const jeonseNet = jeonseCost.totalCost;

    const buyCost = calculateBuyCost(yearInput);
    const buyNet = buyCost.totalCost - buyCost.assetFormed;

    if (buyNet <= jeonseNet) {
      return year;
    }
  }

  return null;
}

// =============================================================================
// 메인 비교 함수
// =============================================================================

/**
 * 전세 vs 매매 시나리오를 비교하여 종합 결과를 반환한다.
 *
 * @param input 시나리오 입력값
 * @returns 전세/매매 비용 상세, 비교 결과, 연도별 추이
 */
export function compareJeonseVsBuy(input: ScenarioInput): ScenarioResult {
  const jeonseCost = calculateJeonseCost(input);
  const buyCost = calculateBuyCost(input);
  const yearlyBreakdown = calculateYearlyBreakdown(input);
  const breakEvenYears = findBreakEvenYear(input);

  const jeonseNet = jeonseCost.totalCost;
  const buyNet = buyCost.totalCost - buyCost.assetFormed;

  const betterOption: 'jeonse' | 'buy' = buyNet <= jeonseNet ? 'buy' : 'jeonse';
  const savingsAmount = Math.round(Math.abs(jeonseNet - buyNet));

  // 월 부담 차이: 전세는 기회비용/월, 매매는 (대출상환+보유세+관리비)/월
  const jeonseMonthly = Math.round(jeonseCost.totalCost / (input.comparisonYears * 12));
  const monthlyPayment = calculateMonthlyPayment(
    input.loanAmount,
    input.mortgageRate,
    input.loanTermYears,
  );
  const propertyTax = calculatePropertyTax(input.purchasePrice);
  const maintenance = estimateMaintenanceFee(input.area);
  const buyMonthly = Math.round(
    monthlyPayment +
    propertyTax.totalAnnualHoldingTax / 12 +
    maintenance.monthlyFee,
  );
  const monthlyCostDiff = Math.round(buyMonthly - jeonseMonthly);

  return {
    jeonse: {
      totalCost: jeonseCost.totalCost,
      opportunityCost: jeonseCost.opportunityCost,
      renewalCostIncrease: jeonseCost.renewalCostIncrease,
      assetFormed: 0,
      netCost: jeonseNet,
    },
    buy: {
      totalCost: buyCost.totalCost,
      oneTimeCost: buyCost.oneTimeCost,
      loanInterestTotal: buyCost.loanInterestTotal,
      holdingTaxTotal: buyCost.holdingTaxTotal,
      maintenanceTotal: buyCost.maintenanceTotal,
      assetValue: buyCost.assetValue,
      assetFormed: buyCost.assetFormed,
      netCost: buyNet,
    },
    comparison: {
      betterOption,
      savingsAmount,
      breakEvenYears,
      monthlyCostDiff,
    },
    yearlyBreakdown,
  };
}
