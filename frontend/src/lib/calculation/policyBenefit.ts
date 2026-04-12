import type {
  PolicyBenefitInput,
  PolicyBenefit,
  PolicyBenefitResult,
} from '@/types/policyBenefit';
import { calculateMonthlyPayment } from './dsr';

/** 시중 평균 금리 (%) — 정책대출 대비 절약액 산출 기준 */
const DEFAULT_MARKET_RATE = 4.0;

/** 정책대출 월 절약액 산출 시 기본 대출 기간 (년) */
const DEFAULT_LOAN_TERM_YEARS = 30;

// ──────────────────────────────────────────────
// 개별 정책 체크 함수
// ──────────────────────────────────────────────

function checkFirstTimeBuyerSpecial(input: PolicyBenefitInput): PolicyBenefit {
  const result: PolicyBenefit = {
    name: '생애최초 특례 대출',
    eligible: false,
    reason: '',
    maxLoanAmount: 50000,
    interestRate: { min: 1.7, max: 3.3 },
    category: 'loan',
  };

  if (input.transactionType !== 'buy') {
    result.reason = '매매 거래만 신청 가능합니다';
    return result;
  }

  if (input.numberOfHomes > 0) {
    result.reason = '무주택자만 신청 가능합니다';
    return result;
  }

  if (!input.isFirstTimeBuyer) {
    result.reason = '생애최초 주택 구입자만 신청 가능합니다';
    return result;
  }

  if (input.annualIncome > 9000) {
    result.reason = '연소득 9,000만 원 이하만 가능합니다';
    return result;
  }

  result.eligible = true;
  result.reason = '생애최초 무주택자 조건 충족';
  return result;
}

function checkNewbornSpecial(input: PolicyBenefitInput): PolicyBenefit {
  const result: PolicyBenefit = {
    name: '신생아 특례 대출',
    eligible: false,
    reason: '',
    maxLoanAmount: 50000,
    interestRate: { min: 1.6, max: 3.3 },
    category: 'loan',
  };

  if (input.transactionType !== 'buy') {
    result.reason = '매매 거래만 신청 가능합니다';
    return result;
  }

  if (!input.hasChildren) {
    result.reason = '자녀가 있어야 신청 가능합니다';
    return result;
  }

  if (input.childAge === undefined || input.childAge > 2) {
    result.reason = '만 2세 이하 자녀가 있어야 신청 가능합니다';
    return result;
  }

  if (input.annualIncome > 13000) {
    result.reason = '연소득 1억 3,000만 원 이하만 가능합니다';
    return result;
  }

  result.eligible = true;
  result.reason = '만 2세 이하 자녀 보유 조건 충족';
  return result;
}

function checkDidimdolBenefit(input: PolicyBenefitInput): PolicyBenefit {
  const result: PolicyBenefit = {
    name: '디딤돌 대출',
    eligible: false,
    reason: '',
    maxLoanAmount: 40000,
    interestRate: { min: 2.15, max: 3.0 },
    category: 'loan',
  };

  if (input.transactionType !== 'buy') {
    result.reason = '매매 거래만 신청 가능합니다';
    return result;
  }

  if (input.numberOfHomes > 0) {
    result.reason = '무주택자만 신청 가능합니다';
    return result;
  }

  const incomeLimit = input.isFirstTimeBuyer ? 7000 : 6000;

  if (input.annualIncome > incomeLimit) {
    result.reason = `연소득 ${incomeLimit.toLocaleString('ko-KR')}만 원 이하만 가능합니다`;
    return result;
  }

  if (input.purchasePrice > 50000) {
    result.reason = '매매가 5억 원 이하만 가능합니다';
    return result;
  }

  result.eligible = true;
  result.reason = '무주택 · 소득 · 매매가 조건 충족';
  return result;
}

function checkBogeumjariBenefit(input: PolicyBenefitInput): PolicyBenefit {
  const maxLoan = input.isFirstTimeBuyer ? 42000 : 36000;
  const result: PolicyBenefit = {
    name: '보금자리론',
    eligible: false,
    reason: '',
    maxLoanAmount: maxLoan,
    interestRate: { min: 3.25, max: 4.15 },
    category: 'loan',
  };

  if (input.transactionType !== 'buy') {
    result.reason = '매매 거래만 신청 가능합니다';
    return result;
  }

  if (input.numberOfHomes >= 2) {
    result.reason = '2주택 이상 보유자는 신청 불가합니다';
    return result;
  }

  if (input.annualIncome > 7000) {
    result.reason = '연소득 7,000만 원 이하만 가능합니다';
    return result;
  }

  if (input.purchasePrice > 60000) {
    result.reason = '매매가 6억 원 이하만 가능합니다';
    return result;
  }

  result.eligible = true;
  result.reason = input.numberOfHomes === 1
    ? '1주택 처분 조건부 자격 충족'
    : '무주택 · 소득 · 매매가 조건 충족';
  return result;
}

function checkYouthJeonseGuarantee(input: PolicyBenefitInput): PolicyBenefit {
  const result: PolicyBenefit = {
    name: '청년 전세 보증금 반환 보증',
    eligible: false,
    reason: '',
    maxLoanAmount: 0,
    interestRate: { min: 0, max: 0 },
    category: 'loan',
  };

  if (input.transactionType !== 'jeonse') {
    result.reason = '전세 거래만 신청 가능합니다';
    return result;
  }

  if (input.age < 19 || input.age > 34) {
    result.reason = '만 19~34세만 신청 가능합니다';
    return result;
  }

  if (input.numberOfHomes > 0) {
    result.reason = '무주택자만 신청 가능합니다';
    return result;
  }

  if (input.annualIncome > 5000) {
    result.reason = '연소득 5,000만 원 이하만 가능합니다';
    return result;
  }

  result.eligible = true;
  result.reason = '청년 무주택 전세 조건 충족';
  return result;
}

function checkFirstTimeBuyerTax(input: PolicyBenefitInput): PolicyBenefit {
  const result: PolicyBenefit = {
    name: '생애최초 취득세 감면',
    eligible: false,
    reason: '',
    maxLoanAmount: 0,
    interestRate: { min: 0, max: 0 },
    monthlySavings: 0,
    category: 'tax',
  };

  if (input.transactionType !== 'buy') {
    result.reason = '매매 거래만 해당됩니다';
    return result;
  }

  if (!input.isFirstTimeBuyer) {
    result.reason = '생애최초 주택 구입자만 해당됩니다';
    return result;
  }

  if (input.purchasePrice > 120000) {
    result.reason = '매매가 12억 원 이하만 가능합니다';
    return result;
  }

  result.eligible = true;
  result.reason = '최대 200만 원 취득세 감면';
  result.monthlySavings = 200;
  return result;
}

function checkNewlywedLoan(input: PolicyBenefitInput): PolicyBenefit {
  const result: PolicyBenefit = {
    name: '신혼부부 전용 구입자금',
    eligible: false,
    reason: '',
    maxLoanAmount: 40000,
    interestRate: { min: 1.85, max: 3.0 },
    category: 'loan',
  };

  if (input.transactionType !== 'buy') {
    result.reason = '매매 거래만 신청 가능합니다';
    return result;
  }

  if (!input.isNewlywed) {
    result.reason = '신혼부부만 신청 가능합니다';
    return result;
  }

  if (input.annualIncome > 8500) {
    result.reason = '연소득 8,500만 원 이하만 가능합니다';
    return result;
  }

  if (input.purchasePrice > 90000) {
    result.reason = '매매가 9억 원 이하만 가능합니다';
    return result;
  }

  result.eligible = true;
  result.reason = '신혼부부 소득 · 매매가 조건 충족';
  return result;
}

// ──────────────────────────────────────────────
// 월 절약액 계산
// ──────────────────────────────────────────────

/**
 * 정책대출 이용 시 시중 금리 대비 월 절약액을 산출한다.
 *
 * 비교 기준: DEFAULT_MARKET_RATE(4.0%) 원리금균등 30년 상환
 * 대출 원금: 해당 정책의 maxLoanAmount
 */
function computeMonthlySavings(benefit: PolicyBenefit): number {
  if (benefit.category === 'tax') return benefit.monthlySavings ?? 0;
  if (!benefit.eligible) return 0;
  if (benefit.maxLoanAmount <= 0) return 0;

  const marketMonthly = calculateMonthlyPayment(
    benefit.maxLoanAmount,
    DEFAULT_MARKET_RATE,
    DEFAULT_LOAN_TERM_YEARS,
  );

  // 정책대출 금리 중간값 사용
  const policyRate = (benefit.interestRate.min + benefit.interestRate.max) / 2;
  const policyMonthly = calculateMonthlyPayment(
    benefit.maxLoanAmount,
    policyRate,
    DEFAULT_LOAN_TERM_YEARS,
  );

  const savings = marketMonthly - policyMonthly;
  return Math.max(0, Math.round(savings * 100) / 100);
}

// ──────────────────────────────────────────────
// 메인 함수
// ──────────────────────────────────────────────

/**
 * 모든 정책 혜택 자격을 일괄 판별하고, 월 절약액·최적 대출을 산출한다.
 */
export function checkAllPolicyBenefits(
  input: PolicyBenefitInput,
): PolicyBenefitResult {
  const checks: PolicyBenefit[] = [
    checkFirstTimeBuyerSpecial(input),
    checkNewbornSpecial(input),
    checkDidimdolBenefit(input),
    checkBogeumjariBenefit(input),
    checkYouthJeonseGuarantee(input),
    checkFirstTimeBuyerTax(input),
    checkNewlywedLoan(input),
  ];

  // 월 절약액 산출
  for (const benefit of checks) {
    if (benefit.eligible) {
      benefit.monthlySavings = computeMonthlySavings(benefit);
    }
  }

  const eligible = checks.filter((b) => b.eligible);
  const ineligible = checks.filter((b) => !b.eligible);

  // 대출 카테고리 중 월 절약액이 가장 큰 것을 bestLoan으로 선정
  const loanBenefits = eligible.filter((b) => b.category === 'loan');
  const bestLoan = loanBenefits.length > 0
    ? loanBenefits.reduce((best, curr) =>
        (curr.monthlySavings ?? 0) > (best.monthlySavings ?? 0) ? curr : best,
      )
    : null;

  const totalMonthlySavings = eligible.reduce(
    (sum, b) => sum + (b.monthlySavings ?? 0),
    0,
  );

  return {
    eligible,
    ineligible,
    totalMonthlySavings: Math.round(totalMonthlySavings * 100) / 100,
    bestLoan,
  };
}
