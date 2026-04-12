import { DSR_RATES } from '@/constants/policy';

interface GetDsrBasedLimitParams {
  annualIncome: number;
  existingLoanPayment: number;
  interestRate: number;
  termYears: number;
  dsrLimit?: number;
}

/**
 * 원리금균등 상환 월 상환액을 계산한다.
 *
 * @param principal 대출 원금 (만원)
 * @param annualRate 연이율 (%, 예: 3.5)
 * @param termYears 대출 기간 (년)
 * @returns 월 상환액 (만원)
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termYears: number,
): number {
  if (principal <= 0) return 0;
  if (termYears <= 0) return 0;

  // 금리 0% 엣지 케이스: 단순 균등분할
  if (annualRate === 0) {
    return principal / (termYears * 12);
  }

  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = termYears * 12;
  const factor = Math.pow(1 + monthlyRate, totalMonths);

  return (principal * monthlyRate * factor) / (factor - 1);
}

/**
 * 원금균등 상환 월 상환액을 계산한다 (첫 달 기준, 최대 상환액).
 *
 * @param principal 대출 원금 (만원)
 * @param annualRate 연이율 (%, 예: 3.5)
 * @param termYears 대출 기간 (년)
 * @returns 첫 달 월 상환액 (만원)
 */
export function calculateMonthlyPaymentEqualPrincipal(
  principal: number,
  annualRate: number,
  termYears: number,
): number {
  if (principal <= 0) return 0;
  if (termYears <= 0) return 0;

  const totalMonths = termYears * 12;
  const monthlyPrincipal = principal / totalMonths;

  // 금리 0% 엣지 케이스
  if (annualRate === 0) {
    return monthlyPrincipal;
  }

  const monthlyRate = annualRate / 100 / 12;
  const firstMonthInterest = principal * monthlyRate;

  return monthlyPrincipal + firstMonthInterest;
}

/**
 * DSR 기반 대출 한도를 역산한다.
 *
 * DSR = (신규 대출 연 상환액 + 기존 대출 연 상환액) / 연소득
 * 신규 대출 연 상환액 = DSR한도 * 연소득 - 기존 대출 연 상환액
 * 해당 연 상환액에서 원리금균등 공식을 역산하여 대출 원금을 도출한다.
 *
 * @returns 대출 가능 한도 (만원), 불가 시 0
 */
export function getDsrBasedLimit(params: GetDsrBasedLimitParams): number {
  const {
    annualIncome,
    existingLoanPayment,
    interestRate,
    termYears,
    dsrLimit = DSR_RATES.bank,
  } = params;

  if (annualIncome <= 0 || termYears <= 0) return 0;

  // DSR 한도 내에서 허용 가능한 신규 대출의 연간 상환액
  const maxTotalAnnualPayment = annualIncome * dsrLimit;
  const existingAnnualPayment = existingLoanPayment * 12;
  const availableAnnualPayment = maxTotalAnnualPayment - existingAnnualPayment;

  if (availableAnnualPayment <= 0) return 0;

  const availableMonthlyPayment = availableAnnualPayment / 12;

  // 금리 0% 엣지 케이스
  if (interestRate === 0) {
    return availableMonthlyPayment * termYears * 12;
  }

  // 원리금균등 역산: P = M * (f - 1) / (r * f)
  const monthlyRate = interestRate / 100 / 12;
  const totalMonths = termYears * 12;
  const factor = Math.pow(1 + monthlyRate, totalMonths);

  const principal = (availableMonthlyPayment * (factor - 1)) / (monthlyRate * factor);

  return Math.max(0, Math.floor(principal));
}
