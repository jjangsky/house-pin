// =============================================================================
// 전세 vs 매매 시나리오 비교 타입 정의
// 모든 금액 단위: 만원
// =============================================================================

import type { RegionType } from '@/constants/policy';

export interface ScenarioInput {
  // 공통
  ownCapital: number;          // 자기자본 (만원)
  annualIncome: number;        // 연소득 (만원)
  targetPrice: number;         // 대상 매물가 or 전세금 (만원)
  comparisonYears: number;     // 비교 기간 (3, 5, 10년)

  // 전세 시나리오
  jeonseDeposit: number;       // 전세 보증금 (만원)
  depositRate: number;         // 예금 금리 (%) - 기회비용 계산용
  jeonseRenewalRate: number;   // 전세금 연간 상승률 (%)

  // 매매 시나리오
  purchasePrice: number;       // 매매가 (만원)
  loanAmount: number;          // 대출 금액 (만원)
  mortgageRate: number;        // 대출 금리 (%)
  loanTermYears: number;       // 대출 기간
  priceGrowthRate: number;     // 매매가 연간 상승률 (%)
  numberOfHomes: number;       // 주택 수

  // 세금/비용 계산에 필요한 추가 필드
  regionType: RegionType;      // 지역 유형 (취득세 계산)
  area: number;                // 전용면적 (㎡, 관리비 추정)
}

export interface ScenarioResult {
  jeonse: {
    totalCost: number;           // 전세 총 비용 (기간 내)
    opportunityCost: number;     // 기회비용 (전세금에 대한)
    renewalCostIncrease: number; // 전세금 상승분
    assetFormed: number;         // 자산 형성: 0
    netCost: number;             // 순비용
  };
  buy: {
    totalCost: number;           // 매매 총 비용
    oneTimeCost: number;         // 1회성 (취득세+등기+중개+이사)
    loanInterestTotal: number;   // 총 대출이자 (기간 내)
    holdingTaxTotal: number;     // 총 보유세 (기간 내)
    maintenanceTotal: number;    // 총 관리비 (기간 내)
    assetValue: number;          // 기간 후 자산 가치 (시세 반영)
    assetFormed: number;         // 순 자산 형성 (자산가치 - 잔여대출)
    netCost: number;             // 순비용 (총비용 - 자산형성)
  };
  comparison: {
    betterOption: 'jeonse' | 'buy';
    savingsAmount: number;       // 더 유리한 쪽의 절약 금액
    breakEvenYears: number | null; // 매매가 유리해지는 시점 (년)
    monthlyCostDiff: number;     // 월 부담 차이
  };
  yearlyBreakdown: Array<{
    year: number;
    jeonseCumulative: number;
    buyCumulative: number;
  }>;
}
