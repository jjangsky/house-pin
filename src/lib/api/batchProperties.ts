// =============================================================================
// 매물 일괄 조회 로직
// 여러 지역/유형/월을 서버에서 병렬로 처리
// =============================================================================

import {
  fetchAptTrade,
  fetchVillaTrade,
  fetchOfficeTrade,
} from '@/lib/api/molit';
import type { RealEstateTransaction } from '@/lib/api/molit';
import { batchGeocode, buildAddress } from '@/lib/api/kakao';
import { getRegionBySigunguCode } from '@/constants/regions';
import { getRecentMonths } from '@/lib/utils/format';
import { filterByAffordability, toProperty } from '@/lib/utils/propertyFilter';
import { parallelLimit } from '@/lib/utils/concurrency';
import type { Property } from '@/types';

// =============================================================================
// 타입 정의
// =============================================================================

type TradeType = 'apt' | 'villa' | 'officetel';
type PropertyType = 'apartment' | 'villa' | 'officetel';

const TRADE_TYPE_MAP: Record<TradeType, PropertyType> = {
  apt: 'apartment',
  villa: 'villa',
  officetel: 'officetel',
};

const FETCH_FN_MAP: Record<
  TradeType,
  (regionCode: string, dealYM: string) => Promise<RealEstateTransaction[]>
> = {
  apt: fetchAptTrade,
  villa: fetchVillaTrade,
  officetel: fetchOfficeTrade,
};

export interface BatchFetchParams {
  regionCodes: string[];
  types: TradeType[];
  monthCount: number;
  maxPrice: number;
}

export interface BatchFetchResult {
  properties: Property[];
  meta: {
    totalFetched: number;
    totalFiltered: number;
    failedCalls: number;
  };
}

// =============================================================================
// 메인 함수
// =============================================================================

const CONCURRENCY_LIMIT = 10;

export async function fetchPropertiesBatch(
  params: BatchFetchParams,
): Promise<BatchFetchResult> {
  const { regionCodes, types, monthCount, maxPrice } = params;
  const months = getRecentMonths(monthCount);

  // 모든 조합을 태스크 배열로 생성
  const tasks: (() => Promise<{
    transactions: RealEstateTransaction[];
    type: TradeType;
  }>)[] = [];

  for (const regionCode of regionCodes) {
    for (const type of types) {
      for (const dealYM of months) {
        const fetchFn = FETCH_FN_MAP[type];
        tasks.push(async () => ({
          transactions: await fetchFn(regionCode, dealYM),
          type,
        }));
      }
    }
  }

  console.log(`[batch] ${tasks.length}개 API 호출 시작 (concurrency=${CONCURRENCY_LIMIT})`);

  // 병렬 실행 (동시성 제한)
  const results = await parallelLimit(tasks, CONCURRENCY_LIMIT);

  // 결과 집계
  let totalFetched = 0;
  let failedCalls = 0;
  const allTransactions: { tx: RealEstateTransaction; type: TradeType }[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { transactions, type } = result.value;
      // 거래 취소 건 제외
      const valid = transactions.filter(
        (tx) => tx.cancelDealType !== 'O' && tx.cancelDealType !== 'Y',
      );
      totalFetched += valid.length;
      for (const tx of valid) {
        allTransactions.push({ tx, type });
      }
    } else {
      failedCalls++;
      console.warn('[batch] API 호출 실패:', result.reason);
    }
  }

  // 구매력 필터링
  const filtered = filterByAffordability({
    transactions: allTransactions.map((item) => item.tx),
    maxPrice,
  });

  // 필터링된 거래의 타입 매핑 유지 (인덱스 기반)
  const filteredSet = new Set(filtered);
  const filteredWithType = allTransactions.filter((item) =>
    filteredSet.has(item.tx),
  );

  // 지오코딩
  const geocodeTargets = filteredWithType.map((item) => {
    const regionInfo = getRegionBySigunguCode(item.tx.regionCode);
    const sigunguName = regionInfo
      ? `${regionInfo.sido} ${regionInfo.sigungu}`
      : '';
    return {
      address: buildAddress(sigunguName, item.tx.dong, item.tx.jibun),
    };
  });

  let coordsMap: Map<string, { lat: number; lng: number }>;
  try {
    coordsMap = await batchGeocode(geocodeTargets);
  } catch (err) {
    console.warn('[batch] 지오코딩 실패, 좌표 없이 진행:', err);
    coordsMap = new Map();
  }

  // Property 변환 + 좌표 매핑
  const properties: Property[] = filteredWithType.map((item) => {
    const regionInfo = getRegionBySigunguCode(item.tx.regionCode);
    const sigunguName = regionInfo
      ? `${regionInfo.sido} ${regionInfo.sigungu}`
      : '';
    const address = buildAddress(sigunguName, item.tx.dong, item.tx.jibun);
    const coords = coordsMap.get(address);
    const propertyType = TRADE_TYPE_MAP[item.type];

    const txWithCoords = coords
      ? { ...item.tx, lat: coords.lat, lng: coords.lng }
      : item.tx;

    return toProperty(txWithCoords, propertyType);
  });

  // 최신순 정렬
  properties.sort((a, b) => {
    if (a.dealYear !== b.dealYear) return b.dealYear - a.dealYear;
    if (a.dealMonth !== b.dealMonth) return b.dealMonth - a.dealMonth;
    return b.dealDay - a.dealDay;
  });

  console.log(
    `[batch] 완료: ${totalFetched}건 조회 → ${properties.length}건 필터링, 실패 ${failedCalls}건`,
  );

  return {
    properties,
    meta: {
      totalFetched,
      totalFiltered: properties.length,
      failedCalls,
    },
  };
}
