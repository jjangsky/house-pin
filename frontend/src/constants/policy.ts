/** LTV 비율 설정 (지역 유형별, 주택 보유 수별) */
export const LTV_RATES = {
  speculative: { noHome: 0.50, oneHome: 0.40, multiHome: 0 },
  regulated: { noHome: 0.60, oneHome: 0.50, multiHome: 0 },
  nonRegulated: { noHome: 0.70, oneHome: 0.60, multiHome: 0.60 },
  firstTimeBuyer: {
    rate: 0.80,
    priceLimit: 90000,
    incomeLimit: 10000,
    loanLimit: 60000,
  },
} as const;

/** DSR 설정 */
export const DSR_RATES = {
  bank: 0.40,
  nonBank: 0.50,
  stressRate: 0.38,
} as const;

/** 정책대출 조건 */
export const POLICY_LOANS = {
  didimdol: {
    name: '디딤돌 대출',
    maxPrice: 50000,
    maxIncome: 6000,
    maxIncomeFirstTime: 7000,
    maxLoan: 40000,
    rates: { min: 2.15, max: 3.00 },
  },
  bogeumjari: {
    name: '보금자리론',
    maxPrice: 60000,
    maxIncome: 7000,
    maxLoan: 36000,
    maxLoanFirstTime: 42000,
    rates: { min: 3.25, max: 4.15 },
  },
  batimok: {
    name: '버팀목 전세대출',
    maxIncome: 5000,
    maxLoanSeoul: 12000,
    maxLoanOther: 8000,
    maxJeonseSeoul: 30000,
    maxJeonseOther: 20000,
    rates: { min: 1.80, max: 2.90 },
  },
} as const;

/** 지역 유형 */
export type RegionType = 'speculative' | 'regulated' | 'nonRegulated';
