export interface PolicyBenefitInput {
  /** 연소득 (만원) */
  annualIncome: number;
  /** 현재 주택수 (0, 1, 2+) */
  numberOfHomes: number;
  /** 생애최초 여부 */
  isFirstTimeBuyer: boolean;
  /** 신혼부부 여부 */
  isNewlywed: boolean;
  /** 자녀 유무 */
  hasChildren: boolean;
  /** 막내 자녀 나이 */
  childAge?: number;
  /** 신청자 나이 */
  age: number;
  /** 매매가 (만원) */
  purchasePrice: number;
  /** 거래 유형 */
  transactionType: 'buy' | 'jeonse';
}

export interface PolicyBenefit {
  /** 정책명 */
  name: string;
  /** 자격 여부 */
  eligible: boolean;
  /** 자격/미자격 이유 */
  reason: string;
  /** 최대 대출 한도 (만원) */
  maxLoanAmount: number;
  /** 금리 범위 (%) */
  interestRate: { min: number; max: number };
  /** 일반 대출 대비 월 절약액 (만원) */
  monthlySavings?: number;
  /** 대출 혜택 or 세금 감면 */
  category: 'loan' | 'tax';
}

export interface PolicyBenefitResult {
  /** 받을 수 있는 혜택 */
  eligible: PolicyBenefit[];
  /** 받을 수 없는 혜택 (이유 포함) */
  ineligible: PolicyBenefit[];
  /** 총 월 절약액 */
  totalMonthlySavings: number;
  /** 가장 유리한 대출 */
  bestLoan: PolicyBenefit | null;
}
