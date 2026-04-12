import { POLICY_LOANS } from '@/constants/policy';

export interface PolicyLoanResult {
  eligible: boolean;
  name: string;
  estimatedRate: { min: number; max: number };
  maxLoan: number;
  reason?: string;
}

interface PolicyLoanCheckParams {
  propertyPrice: number;
  annualIncome: number;
  numberOfHomes: number;
  isFirstTimeBuyer: boolean;
  isNewlywed: boolean;
  isSeoul?: boolean;
  transactionType: 'buy' | 'jeonse';
  jeonseDeposit?: number;
}

/**
 * 디딤돌 대출 자격을 판별한다.
 *
 * 조건: 무주택, 매매가 5억 이하, 소득 6,000만 이하 (생애최초 7,000만)
 */
export function checkDidimdol(params: PolicyLoanCheckParams): PolicyLoanResult {
  const { propertyPrice, annualIncome, numberOfHomes, isFirstTimeBuyer } = params;
  const config = POLICY_LOANS.didimdol;
  const result: PolicyLoanResult = {
    eligible: false,
    name: config.name,
    estimatedRate: { ...config.rates },
    maxLoan: config.maxLoan,
  };

  if (numberOfHomes > 0) {
    result.reason = '무주택자만 신청 가능합니다';
    return result;
  }

  if (propertyPrice > config.maxPrice) {
    result.reason = `매매가 ${config.maxPrice / 10000}억 원 이하만 가능합니다`;
    return result;
  }

  const incomeLimit = isFirstTimeBuyer
    ? config.maxIncomeFirstTime
    : config.maxIncome;

  if (annualIncome > incomeLimit) {
    result.reason = `연소득 ${incomeLimit.toLocaleString('ko-KR')}만 원 이하만 가능합니다`;
    return result;
  }

  result.eligible = true;
  return result;
}

/**
 * 보금자리론 자격을 판별한다.
 *
 * 조건: 무주택 또는 1주택 처분 조건, 매매가 6억 이하, 소득 7,000만 이하
 */
export function checkBogeumjari(params: PolicyLoanCheckParams): PolicyLoanResult {
  const { propertyPrice, annualIncome, numberOfHomes, isFirstTimeBuyer } = params;
  const config = POLICY_LOANS.bogeumjari;
  const maxLoan = isFirstTimeBuyer ? config.maxLoanFirstTime : config.maxLoan;
  const result: PolicyLoanResult = {
    eligible: false,
    name: config.name,
    estimatedRate: { ...config.rates },
    maxLoan,
  };

  if (numberOfHomes >= 2) {
    result.reason = '2주택 이상 보유자는 신청 불가합니다';
    return result;
  }

  if (propertyPrice > config.maxPrice) {
    result.reason = `매매가 ${config.maxPrice / 10000}억 원 이하만 가능합니다`;
    return result;
  }

  if (annualIncome > config.maxIncome) {
    result.reason = `연소득 ${config.maxIncome.toLocaleString('ko-KR')}만 원 이하만 가능합니다`;
    return result;
  }

  result.eligible = true;
  return result;
}

/**
 * 버팀목 전세대출 자격을 판별한다.
 *
 * 조건: 무주택, 소득 5,000만 이하, 전세금 한도 적용
 */
export function checkBatimok(params: PolicyLoanCheckParams): PolicyLoanResult {
  const { annualIncome, numberOfHomes, isSeoul = false, jeonseDeposit = 0 } = params;
  const config = POLICY_LOANS.batimok;
  const maxLoan = isSeoul ? config.maxLoanSeoul : config.maxLoanOther;
  const maxJeonse = isSeoul ? config.maxJeonseSeoul : config.maxJeonseOther;

  const result: PolicyLoanResult = {
    eligible: false,
    name: config.name,
    estimatedRate: { ...config.rates },
    maxLoan,
  };

  if (numberOfHomes > 0) {
    result.reason = '무주택자만 신청 가능합니다';
    return result;
  }

  if (annualIncome > config.maxIncome) {
    result.reason = `연소득 ${config.maxIncome.toLocaleString('ko-KR')}만 원 이하만 가능합니다`;
    return result;
  }

  if (jeonseDeposit > maxJeonse) {
    const limit = isSeoul ? '3억' : '2억';
    result.reason = `전세보증금 ${limit} 원 이하만 가능합니다`;
    return result;
  }

  result.eligible = true;
  return result;
}

/**
 * 모든 정책대출 자격을 일괄 판별한다.
 */
export function checkAllPolicyLoans(params: PolicyLoanCheckParams): PolicyLoanResult[] {
  return [
    checkDidimdol(params),
    checkBogeumjari(params),
    checkBatimok(params),
  ];
}
