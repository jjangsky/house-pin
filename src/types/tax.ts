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
