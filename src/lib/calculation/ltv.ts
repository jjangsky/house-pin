import { LTV_RATES, type RegionType } from '@/constants/policy';

interface GetLTVParams {
  numberOfHomes: number;
  regionType: RegionType;
  isFirstTimeBuyer: boolean;
  propertyPrice: number;
  householdIncome: number;
}

/**
 * LTV 비율을 결정한다.
 *
 * 우선순위:
 * 1. 생애최초 주택 구입: 80% (매매가 9억 이하, 소득 1억 이하, 무주택)
 * 2. 다주택자: 규제지역 0%, 비규제 60%
 * 3. 1주택: 투기과열 40%, 조정 50%, 비규제 60%
 * 4. 무주택: 투기과열 50%, 조정 60%, 비규제 70%
 */
export function getLTV(params: GetLTVParams): number {
  const {
    numberOfHomes,
    regionType,
    isFirstTimeBuyer,
    propertyPrice,
    householdIncome,
  } = params;

  // 생애최초 주택 구입자 우대
  if (isFirstTimeBuyer && numberOfHomes === 0) {
    const { rate, priceLimit, incomeLimit } = LTV_RATES.firstTimeBuyer;
    if (propertyPrice <= priceLimit && householdIncome <= incomeLimit) {
      return rate;
    }
  }

  const regionRates = LTV_RATES[regionType];

  // 다주택자 (2주택 이상)
  if (numberOfHomes >= 2) {
    return regionRates.multiHome;
  }

  // 1주택자
  if (numberOfHomes === 1) {
    return regionRates.oneHome;
  }

  // 무주택자
  return regionRates.noHome;
}
