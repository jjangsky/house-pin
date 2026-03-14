import type { AssetInput, LoanResult } from '@/types';
import type { RegionType } from '@/constants/policy';
import { getLTV } from './ltv';
import { getDsrBasedLimit, calculateMonthlyPayment, calculateMonthlyPaymentEqualPrincipal } from './dsr';
import { checkAllPolicyLoans } from './policyLoan';

export { getLTV } from './ltv';
export {
  getDsrBasedLimit,
  calculateMonthlyPayment,
  calculateMonthlyPaymentEqualPrincipal,
} from './dsr';
export {
  checkDidimdol,
  checkBogeumjari,
  checkBatimok,
  checkAllPolicyLoans,
} from './policyLoan';
export type { PolicyLoanResult } from './policyLoan';

interface CalculateLoanResultOptions {
  regionType?: RegionType;
  isSeoul?: boolean;
}

/**
 * 통합 대출 계산 결과를 산출한다.
 *
 * 1. LTV 기반 한도: 매입 희망가 * LTV 비율
 * 2. DSR 기반 한도: 소득 대비 상환 가능액에서 역산
 * 3. 최종 한도: MIN(LTV, DSR)
 * 4. 매입가능금액: 자기자본 + 최종 한도
 * 5. 전세가능금액: 자기자본 + 전세대출 한도
 * 6. 정책대출 자격 판별
 *
 * @param input 사용자 자산 입력 정보
 * @param marketRate 시장 금리 (%, 예: 3.5)
 * @param options 지역 유형 등 추가 옵션
 */
export function calculateLoanResult(
  input: AssetInput,
  marketRate: number,
  options: CalculateLoanResultOptions = {},
): LoanResult {
  const { regionType = 'nonRegulated', isSeoul = false } = options;

  // 매입가능금액 산출 시 사용할 기준가격 (자기자본 기반 추정)
  // LTV를 통해 대출 가능 비율을 먼저 결정
  const ltv = getLTV({
    numberOfHomes: input.numberOfHomes,
    regionType,
    isFirstTimeBuyer: input.isFirstTimeBuyer,
    propertyPrice: input.ownCapital * 2, // 초기 추정: 자기자본의 2배
    householdIncome: input.householdIncome || input.annualIncome,
  });

  // LTV 기반 한도: 자기자본 / (1 - LTV) * LTV
  // 자기자본 = 매매가 * (1 - LTV) 에서 역산
  // 매매가 = 자기자본 / (1 - LTV)
  // 대출 한도 = 매매가 * LTV = 자기자본 * LTV / (1 - LTV)
  let ltvBasedLimit: number;
  if (ltv <= 0) {
    ltvBasedLimit = 0;
  } else if (ltv >= 1) {
    // 이론적으로 LTV 100%는 없지만 안전 처리
    ltvBasedLimit = 0;
  } else {
    ltvBasedLimit = Math.floor((input.ownCapital * ltv) / (1 - ltv));
  }

  // DSR 기반 한도
  const dsrBasedLimit = getDsrBasedLimit({
    annualIncome: input.annualIncome,
    existingLoanPayment: input.existingLoanPayment,
    interestRate: marketRate,
    termYears: input.loanTermYears,
  });

  // 최종 한도: 둘 중 작은 값
  const finalLoanLimit = Math.min(ltvBasedLimit, dsrBasedLimit);
  const limitingFactor: 'ltv' | 'dsr' =
    ltvBasedLimit <= dsrBasedLimit ? 'ltv' : 'dsr';

  // 매입가능금액 = 자기자본 + 최종 대출 한도
  const affordablePrice = input.ownCapital + finalLoanLimit;

  // 월 상환액 계산
  const monthlyPayment =
    input.repaymentType === 'equal_principal'
      ? calculateMonthlyPaymentEqualPrincipal(
          finalLoanLimit,
          marketRate,
          input.loanTermYears,
        )
      : calculateMonthlyPayment(
          finalLoanLimit,
          marketRate,
          input.loanTermYears,
        );

  // 정책대출 자격 판별
  const policyLoanResults = checkAllPolicyLoans({
    propertyPrice: affordablePrice,
    annualIncome: input.annualIncome,
    numberOfHomes: input.numberOfHomes,
    isFirstTimeBuyer: input.isFirstTimeBuyer,
    isNewlywed: input.isNewlywed,
    isSeoul,
    transactionType: input.transactionType,
  });

  // 전세가능금액: 자기자본 + 전세대출 한도 (버팀목 기준)
  const batimokResult = policyLoanResults[2]; // checkBatimok는 3번째
  const jeonseLimit = batimokResult.eligible ? batimokResult.maxLoan : 0;
  const jeonseAffordable = input.ownCapital + jeonseLimit;

  return {
    ltv,
    ltvBasedLimit,
    dsrBasedLimit,
    finalLoanLimit,
    affordablePrice,
    jeonseAffordable,
    monthlyPayment: Math.round(monthlyPayment),
    limitingFactor,
    policyLoans: {
      didimdol: policyLoanResults[0].eligible,
      bogeumjari: policyLoanResults[1].eligible,
      batimok: policyLoanResults[2].eligible,
    },
    bankComparisons: [], // Step 5에서 은행 API 연동 시 채움
  };
}
