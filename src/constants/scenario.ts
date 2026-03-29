// =============================================================================
// 전세 vs 매매 시나리오 비교 기본값
// =============================================================================

export const DEFAULT_SCENARIO = {
  comparisonYears: 5,
  depositRate: 3.5,       // 예금 금리 (%)
  jeonseRenewalRate: 3.0, // 전세금 상승률 (%)
  mortgageRate: 4.0,      // 대출 금리 (%)
  priceGrowthRate: 3.0,   // 시세 상승률 (%)
} as const;
