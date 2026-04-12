// =============================================================================
// 세금 관련 타입 정의
// =============================================================================

export interface AcquisitionTaxResult {
  purchasePrice: number;
  baseRate: number;
  baseTax: number;
  ruralTax: number;
  localEducationTax: number;
  totalAcquisitionTax: number;
  homeCategory: '1주택' | '2주택_조정' | '2주택_비조정' | '3주택이상';
}

export interface PropertyTaxResult {
  estimatedPublicPrice: number;
  taxBase: number;
  annualPropertyTax: number;
  monthlyPropertyTax: number;
  urbanTax: number;
  localEducationTax: number;
  totalAnnualHoldingTax: number;
}

export interface BrokerageFeeResult {
  purchasePrice: number;
  feeRate: number;
  brokerageFee: number;
}

export interface RegistrationCostResult {
  registrationTax: number;
  localEducationTax: number;
  stampTax: number;
  lawyerFee: number;
  totalRegistrationCost: number;
}

export interface TotalInitialCost {
  acquisitionTax: AcquisitionTaxResult;
  propertyTax: PropertyTaxResult;
  brokerageFee: BrokerageFeeResult;
  registrationCost: RegistrationCostResult;
  totalUpfront: number;
  totalRequired: number;
}

// =============================================================================
// TCO (Total Cost of Ownership) 타입
// =============================================================================

/** 이사비용 추정 결과 */
export interface MovingCostEstimate {
  /** 전용면적 (㎡) */
  area: number;
  /** 이사비용 추정 (만원) */
  movingCost: number;
}

/** 관리비 추정 결과 */
export interface MaintenanceFeeEstimate {
  /** 전용면적 (㎡) */
  area: number;
  /** 월 관리비 추정 (만원) */
  monthlyFee: number;
  /** 연 관리비 (만원) */
  annualFee: number;
}

/** TCO 계산 입력 */
export interface TcoInput {
  /** 매매가 (만원) */
  purchasePrice: number;
  /** 주택 수 */
  numberOfHomes: number;
  /** 지역 유형 */
  regionType: 'speculative' | 'regulated' | 'non_regulated';
  /** 전용면적 (㎡) */
  area: number;
  /** 대출 월 상환액 (만원) */
  monthlyLoanPayment: number;
  /** 대출 연 이자 총액 (만원) */
  annualLoanInterest: number;
}

/** TCO 계산 결과 */
export interface TcoResult {
  /** 1회성 비용 (취득세+등기+중개+이사) */
  oneTimeCosts: {
    acquisitionTax: number;
    registrationCost: number;
    brokerageFee: number;
    movingCost: number;
    total: number;
  };
  /** 연간 반복 비용 (보유세+관리비+대출이자) */
  annualRecurringCosts: {
    holdingTax: number;
    maintenanceFee: number;
    loanInterest: number;
    total: number;
  };
  /** 월 환산 비용 */
  monthlyCosts: {
    holdingTax: number;
    maintenanceFee: number;
    loanPayment: number;
    total: number;
  };
  /** 첫 해 총 비용 (1회성 + 연간) */
  firstYearTotal: number;
  /** 월 환산 총 비용 (1회성 제외) */
  monthlyRecurringTotal: number;
}
