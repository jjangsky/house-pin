// =============================================================================
// 부동산 세금/수수료 계산
// 취득세, 재산세, 중개수수료, 등기비용 등 부동산 거래 시 발생하는 세금 계산
// 모든 금액 단위: 만원
// =============================================================================

import type { RegionType } from '@/constants/policy';
import {
  ACQUISITION_TAX_TIERS,
  MULTI_HOME_RATES,
  RURAL_TAX_RATE,
  ACQ_LOCAL_EDUCATION_TAX_RATE,
  PUBLIC_PRICE_RATIO,
  FAIR_MARKET_VALUE_RATIO,
  PROPERTY_TAX_BRACKETS,
  URBAN_TAX_RATE,
  PROP_LOCAL_EDUCATION_TAX_RATE,
  BROKERAGE_FEE_TABLE,
  REGISTRATION_TAX_RATE,
  REG_LOCAL_EDUCATION_TAX_RATE,
  STAMP_TAX_TABLE,
  ESTIMATED_LAWYER_FEE,
} from '@/constants/tax';
import type {
  AcquisitionTaxResult,
  PropertyTaxResult,
  BrokerageFeeResult,
  RegistrationCostResult,
  TotalInitialCost,
} from '@/types/tax';

// =============================================================================
// 취득세 계산
// =============================================================================

/**
 * 취득세를 계산한다.
 *
 * - 1주택: 6억 이하 1%, 6~9억 선형보간, 9억 초과 3%
 * - 2주택(조정지역): 8%, 2주택(비조정): 1주택과 동일
 * - 3주택 이상: 12%
 */
export function calculateAcquisitionTax(input: {
  purchasePrice: number;
  numberOfHomes: number;
  regionType: RegionType;
}): AcquisitionTaxResult {
  const { purchasePrice, numberOfHomes, regionType } = input;

  const { baseRate, homeCategory } = resolveAcquisitionRate(
    purchasePrice,
    numberOfHomes,
    regionType,
  );

  const baseTax = Math.round(purchasePrice * baseRate);
  const ruralTax = Math.round(baseTax * RURAL_TAX_RATE);
  const localEducationTax = Math.round(baseTax * ACQ_LOCAL_EDUCATION_TAX_RATE);
  const totalAcquisitionTax = baseTax + ruralTax + localEducationTax;

  return {
    purchasePrice,
    baseRate,
    baseTax,
    ruralTax,
    localEducationTax,
    totalAcquisitionTax,
    homeCategory,
  };
}

function resolveAcquisitionRate(
  price: number,
  numberOfHomes: number,
  regionType: RegionType,
): {
  baseRate: number;
  homeCategory: AcquisitionTaxResult['homeCategory'];
} {
  // 3주택 이상
  if (numberOfHomes >= 3) {
    return { baseRate: MULTI_HOME_RATES.THREE_OR_MORE, homeCategory: '3주택이상' };
  }

  // 2주택
  if (numberOfHomes === 2) {
    if (regionType === 'speculative' || regionType === 'regulated') {
      return {
        baseRate: MULTI_HOME_RATES.TWO_HOMES_REGULATED,
        homeCategory: '2주택_조정',
      };
    }
    return {
      baseRate: getSingleHomeRate(price),
      homeCategory: '2주택_비조정',
    };
  }

  // 1주택 (numberOfHomes <= 1)
  return { baseRate: getSingleHomeRate(price), homeCategory: '1주택' };
}

function getSingleHomeRate(price: number): number {
  if (price <= ACQUISITION_TAX_TIERS.TIER_1_MAX) {
    return ACQUISITION_TAX_TIERS.TIER_1_RATE;
  }
  if (price <= ACQUISITION_TAX_TIERS.TIER_2_MAX) {
    // 선형보간: rate = (2/3) * price/10000 - 3 을 %로 환산
    // 공식: rate = 2/3 - 30000/price (비율)
    // 참고: 6억에서 1%, 9억에서 3%로 선형 보간
    return 2 / 3 - 30000 / price;
  }
  return ACQUISITION_TAX_TIERS.TIER_3_RATE;
}

// =============================================================================
// 재산세 계산
// =============================================================================

/**
 * 연간 재산세(보유세)를 계산한다.
 *
 * 공시가격 추정 → 과세표준 산출 → 구간별 세율 적용
 */
export function calculatePropertyTax(purchasePrice: number): PropertyTaxResult {
  const estimatedPublicPrice = Math.round(purchasePrice * PUBLIC_PRICE_RATIO);
  const taxBase = Math.round(estimatedPublicPrice * FAIR_MARKET_VALUE_RATIO);

  const annualPropertyTax = calculateBracketTax(taxBase);
  const monthlyPropertyTax = Math.round(annualPropertyTax / 12);
  const urbanTax = Math.round(taxBase * URBAN_TAX_RATE);
  const localEducationTax = Math.round(annualPropertyTax * PROP_LOCAL_EDUCATION_TAX_RATE);
  const totalAnnualHoldingTax = annualPropertyTax + urbanTax + localEducationTax;

  return {
    estimatedPublicPrice,
    taxBase,
    annualPropertyTax,
    monthlyPropertyTax,
    urbanTax,
    localEducationTax,
    totalAnnualHoldingTax,
  };
}

function calculateBracketTax(taxBase: number): number {
  for (const bracket of PROPERTY_TAX_BRACKETS) {
    if (taxBase <= bracket.maxBase) {
      return Math.round(taxBase * bracket.rate - bracket.deduction);
    }
  }
  // 마지막 구간 (Infinity) 에서 항상 반환되므로 여기 도달하지 않음
  const last = PROPERTY_TAX_BRACKETS[PROPERTY_TAX_BRACKETS.length - 1];
  return Math.round(taxBase * last.rate - last.deduction);
}

// =============================================================================
// 중개수수료 계산
// =============================================================================

/**
 * 중개수수료를 계산한다.
 *
 * 거래가격 구간별 요율 적용, 상한액이 있으면 상한 적용.
 */
export function calculateBrokerageFee(purchasePrice: number): BrokerageFeeResult {
  const tier = BROKERAGE_FEE_TABLE.find((t) => purchasePrice <= t.maxPrice);

  if (!tier) {
    const lastTier = BROKERAGE_FEE_TABLE[BROKERAGE_FEE_TABLE.length - 1];
    return computeBrokerage(purchasePrice, lastTier.rate, lastTier.maxFee);
  }

  return computeBrokerage(purchasePrice, tier.rate, tier.maxFee);
}

function computeBrokerage(
  purchasePrice: number,
  rate: number,
  maxFee: number | null,
): BrokerageFeeResult {
  let fee = Math.round(purchasePrice * rate);
  if (maxFee !== null && fee > maxFee) {
    fee = maxFee;
  }

  return {
    purchasePrice,
    feeRate: rate,
    brokerageFee: fee,
  };
}

// =============================================================================
// 등기비용 계산
// =============================================================================

/**
 * 등기비용(등록면허세 + 지방교육세 + 인지세 + 법무사 수수료)을 계산한다.
 */
export function calculateRegistrationCost(purchasePrice: number): RegistrationCostResult {
  const registrationTax = Math.round(purchasePrice * REGISTRATION_TAX_RATE);
  const localEducationTax = Math.round(registrationTax * REG_LOCAL_EDUCATION_TAX_RATE);

  const stampEntry = STAMP_TAX_TABLE.find((t) => purchasePrice <= t.maxPrice);
  const stampTax = stampEntry ? stampEntry.tax : STAMP_TAX_TABLE[STAMP_TAX_TABLE.length - 1].tax;

  const lawyerFee = ESTIMATED_LAWYER_FEE;
  const totalRegistrationCost = registrationTax + localEducationTax + stampTax + lawyerFee;

  return {
    registrationTax,
    localEducationTax,
    stampTax,
    lawyerFee,
    totalRegistrationCost,
  };
}

// =============================================================================
// 초기 비용 통합 계산
// =============================================================================

/**
 * 매물 구매 시 발생하는 모든 초기 비용을 통합 계산한다.
 *
 * totalUpfront = 취득세 + 등기비용 + 중개수수료
 * totalRequired = 매매가 + totalUpfront (첫해 재산세 포함하지 않음)
 */
export function calculateTotalInitialCost(input: {
  purchasePrice: number;
  numberOfHomes: number;
  regionType: RegionType;
}): TotalInitialCost {
  const { purchasePrice, numberOfHomes, regionType } = input;

  const acquisitionTax = calculateAcquisitionTax({ purchasePrice, numberOfHomes, regionType });
  const propertyTax = calculatePropertyTax(purchasePrice);
  const brokerageFee = calculateBrokerageFee(purchasePrice);
  const registrationCost = calculateRegistrationCost(purchasePrice);

  const totalUpfront =
    acquisitionTax.totalAcquisitionTax +
    registrationCost.totalRegistrationCost +
    brokerageFee.brokerageFee;

  const totalRequired = purchasePrice + totalUpfront;

  return {
    acquisitionTax,
    propertyTax,
    brokerageFee,
    registrationCost,
    totalUpfront,
    totalRequired,
  };
}
