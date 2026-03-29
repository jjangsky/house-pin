// =============================================================================
// 부동산 세금/수수료 상수
// =============================================================================

/** 1주택 취득세율 구간 (만원 단위) */
export const ACQUISITION_TAX_TIERS = {
  TIER_1_MAX: 60000,   // 6억 이하: 1%
  TIER_1_RATE: 0.01,
  TIER_2_MIN: 60000,   // 6억~9억: 선형 보간 1~3%
  TIER_2_MAX: 90000,
  TIER_3_MIN: 90000,   // 9억 초과: 3%
  TIER_3_RATE: 0.03,
} as const;

/** 다주택 취득세율 */
export const MULTI_HOME_RATES = {
  TWO_HOMES_REGULATED: 0.08,
  THREE_OR_MORE: 0.12,
} as const;

/** 농어촌특별세율 (취득세의 10%) */
export const RURAL_TAX_RATE = 0.10;

/** 취득세 지방교육세율 (취득세의 10%) */
export const ACQ_LOCAL_EDUCATION_TAX_RATE = 0.10;

/** 공시가격 추정 비율 */
export const PUBLIC_PRICE_RATIO = 0.69;

/** 공정시장가액비율 */
export const FAIR_MARKET_VALUE_RATIO = 0.60;

/** 재산세율 구간 (만원 단위) */
export const PROPERTY_TAX_BRACKETS = [
  { maxBase: 6000, rate: 0.001, deduction: 0 },
  { maxBase: 15000, rate: 0.0015, deduction: 3 },
  { maxBase: 30000, rate: 0.0025, deduction: 18 },
  { maxBase: Infinity, rate: 0.004, deduction: 63 },
] as const;

/** 도시지역분 세율 */
export const URBAN_TAX_RATE = 0.0014;

/** 재산세 지방교육세율 (재산세의 20%) */
export const PROP_LOCAL_EDUCATION_TAX_RATE = 0.20;

/** 중개수수료 요율표 (매매 기준, 만원 단위) */
export const BROKERAGE_FEE_TABLE = [
  { maxPrice: 5000, rate: 0.006, maxFee: 25 },
  { maxPrice: 20000, rate: 0.005, maxFee: 80 },
  { maxPrice: 60000, rate: 0.004, maxFee: null },
  { maxPrice: 90000, rate: 0.005, maxFee: null },
  { maxPrice: Infinity, rate: 0.009, maxFee: null },
] as const;

/** 등록면허세율 */
export const REGISTRATION_TAX_RATE = 0.02;

/** 등록면허세 지방교육세율 (등록면허세의 20%) */
export const REG_LOCAL_EDUCATION_TAX_RATE = 0.20;

/** 인지세 구간 (만원 단위) */
export const STAMP_TAX_TABLE = [
  { maxPrice: 10000, tax: 0 },
  { maxPrice: 100000, tax: 15 },
  { maxPrice: Infinity, tax: 35 },
] as const;

/** 법무사 수수료 추정 (만원) */
export const ESTIMATED_LAWYER_FEE = 50;

// =============================================================================
// TCO 관련 상수
// =============================================================================

/** 이사비용 추정 구간 (전용면적 ㎡ 기준, 만원) */
export const MOVING_COST_TABLE = [
  { maxArea: 40, cost: 60 },     // ~12평: 원룸~소형
  { maxArea: 60, cost: 90 },     // ~18평: 소형 아파트
  { maxArea: 85, cost: 130 },    // ~25평: 중형 아파트 (국민평형)
  { maxArea: 115, cost: 170 },   // ~35평: 중대형
  { maxArea: 150, cost: 220 },   // ~45평: 대형
  { maxArea: Infinity, cost: 280 }, // 45평 초과
] as const;

/** 월 관리비 추정 단가 (만원/㎡) - 아파트 평균 기준 */
export const MAINTENANCE_FEE_PER_SQM = 0.3;

// =============================================================================
// 양도소득세 관련 상수
// =============================================================================

/** 1세대 1주택 비과세 기준 매도가 (만원) - 12억 */
export const CAPITAL_GAINS_EXEMPT_LIMIT = 120000;

/** 1세대 1주택 비과세 최소 보유기간 (년) */
export const EXEMPT_MIN_HOLDING_YEARS = 2;

/** 양도소득세 누진세율 구간 (만원 기준) */
export const CAPITAL_GAINS_TAX_BRACKETS = [
  { maxGain: 1400, rate: 0.06, deduction: 0 },
  { maxGain: 5000, rate: 0.15, deduction: 126 },
  { maxGain: 8800, rate: 0.24, deduction: 576 },
  { maxGain: 15000, rate: 0.35, deduction: 1544 },
  { maxGain: 30000, rate: 0.38, deduction: 1994 },
  { maxGain: 50000, rate: 0.40, deduction: 2594 },
  { maxGain: 100000, rate: 0.42, deduction: 3594 },
  { maxGain: Infinity, rate: 0.45, deduction: 6594 },
] as const;

/**
 * 장기보유특별공제율 (보유기간별)
 * 3년 이상부터 적용, 연 2%씩 (일반), 10년 이상 최대 30%
 */
export const LONG_TERM_HOLDING_DEDUCTION: Record<number, number> = {
  3: 0.06,
  4: 0.08,
  5: 0.10,
  6: 0.12,
  7: 0.14,
  8: 0.16,
  9: 0.18,
  10: 0.20,
  11: 0.22,
  12: 0.24,
  13: 0.26,
  14: 0.28,
  15: 0.30,
};

/** 지방소득세율 (양도세의 10%) */
export const LOCAL_INCOME_TAX_RATE = 0.10;
