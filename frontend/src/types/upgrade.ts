// =============================================================================
// 갈아타기 시뮬레이터 타입 정의
// 현재 주택 매도 후 새 주택 구매 시뮬레이션
// 모든 금액 단위: 만원
// =============================================================================

/** 갈아타기 시뮬레이터 입력 */
export interface UpgradeInput {
  // 현재 보유 주택
  /** 현재 집 예상 매도가 (만원) */
  currentHomePrice: number;
  /** 현재 대출 잔액 (만원) */
  currentLoanBalance: number;
  /** 보유 기간 (년) */
  holdingPeriodYears: number;
  /** 실거주 여부 (2년 이상) */
  isActualResidence: boolean;
  /** 원래 매입가 (만원) - 양도세 계산용 */
  purchasedPrice: number;
  /** 조정지역 여부 */
  isRegulatedArea: boolean;

  // 새 주택 조건
  /** 연소득 (만원) */
  annualIncome: number;
  /** 기존 월 상환액 (만원) - 갈아타기 후 기존 대출 상환 가정이므로 0이 기본 */
  existingLoanPayment: number;
  /** 추가 투입 가능 현금 (만원) */
  additionalCash: number;
  /** 희망 대출기간 (년) */
  loanTermYears: number;
  /** 상환 방식 */
  repaymentType: 'equal_payment' | 'equal_principal';
}

/** 매도 정산 결과 */
export interface SaleProceeds {
  /** 매도가 (만원) */
  salePrice: number;
  /** 중개수수료 (만원) */
  brokerageFee: number;
  /** 양도소득세 (만원) */
  capitalGainsTax: number;
  /** 대출 상환액 (만원) */
  loanRepayment: number;
  /** 실수령액 (만원) */
  netProceeds: number;
}

/** 새 구매력 */
export interface NewPurchasingPower {
  /** 자기자본 = 실수령액 + 추가현금 (만원) */
  ownCapital: number;
  /** 새 대출 한도 (만원) - LTV/DSR 적용 */
  maxLoanAmount: number;
  /** 총 구매 가능 금액 (만원) */
  totalBudget: number;
  /** 새 월 상환액 (만원) */
  monthlyPayment: number;
}

/** 양도소득세 상세 */
export interface CapitalGainsTaxDetail {
  /** 양도차익 (만원) */
  gain: number;
  /** 비과세 여부 */
  isExempt: boolean;
  /** 비과세/과세 이유 */
  exemptReason: string;
  /** 적용 세율 (%) */
  taxRate: number;
  /** 양도세액 (만원) */
  taxAmount: number;
  /** 장기보유특별공제율 (%) */
  longTermDeductionRate: number;
  /** 장기보유특별공제액 (만원) */
  longTermDeduction: number;
  /** 과세 대상 양도차익 (만원) - 12억 초과분 비례 등 적용 후 */
  taxableGain: number;
}

/** 갈아타기 시뮬레이션 결과 */
export interface UpgradeResult {
  /** 매도 정산 */
  saleProceeds: SaleProceeds;
  /** 새 구매력 */
  newPurchasingPower: NewPurchasingPower;
  /** 양도세 상세 */
  capitalGainsTaxDetail: CapitalGainsTaxDetail;
  /** 주의사항 */
  warnings: string[];
}
