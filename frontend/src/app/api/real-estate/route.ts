// =============================================================================
// 실거래가 API Route
// 국토부 실거래 데이터를 조회하여 JSON으로 반환
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';

import {
  fetchAptTrade,
  fetchAptRent,
  fetchVillaTrade,
  fetchOfficeTrade,
} from '@/lib/api/molit';
import type { RealEstateTransaction } from '@/lib/api/molit';
import { batchGeocode, buildAddress } from '@/lib/api/kakao';
import { getRegionBySigunguCode } from '@/constants/regions';

type TradeType = 'apt' | 'apt-rent' | 'villa' | 'officetel';

const FETCH_MAP: Record<
  TradeType,
  (regionCode: string, dealYM: string) => Promise<RealEstateTransaction[]>
> = {
  apt: fetchAptTrade,
  'apt-rent': fetchAptRent,
  villa: fetchVillaTrade,
  officetel: fetchOfficeTrade,
};

function isValidTradeType(type: string): type is TradeType {
  return type in FETCH_MAP;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const regionCode = searchParams.get('regionCode');
  const dealYM = searchParams.get('dealYM');
  const type = searchParams.get('type') ?? 'apt';

  // 필수 파라미터 검증
  if (!regionCode || !dealYM) {
    return NextResponse.json(
      { error: 'regionCode, dealYM 파라미터가 필요합니다.' },
      { status: 400 },
    );
  }

  // regionCode 형식 검증 (5자리 숫자)
  if (!/^\d{5}$/.test(regionCode)) {
    return NextResponse.json(
      { error: 'regionCode는 5자리 숫자여야 합니다.' },
      { status: 400 },
    );
  }

  // dealYM 형식 검증 (YYYYMM, 6자리 숫자)
  if (!/^\d{6}$/.test(dealYM)) {
    return NextResponse.json(
      { error: 'dealYM은 YYYYMM 형식이어야 합니다.' },
      { status: 400 },
    );
  }

  // type 검증
  if (!isValidTradeType(type)) {
    return NextResponse.json(
      { error: `type은 ${Object.keys(FETCH_MAP).join(', ')} 중 하나여야 합니다.` },
      { status: 400 },
    );
  }

  try {
    const fetchFn = FETCH_MAP[type];
    const transactions = await fetchFn(regionCode, dealYM);

    // 거래 취소 건 제외
    const validTransactions = transactions.filter(
      (tx) => tx.cancelDealType !== 'O' && tx.cancelDealType !== 'Y',
    );

    // 지오코딩: 법정동 + 지번 주소를 좌표로 변환
    const regionInfo = getRegionBySigunguCode(regionCode);
    const sigunguName = regionInfo
      ? `${regionInfo.sido} ${regionInfo.sigungu}`
      : '';

    const geocodeTargets = validTransactions.map((tx) => ({
      address: buildAddress(sigunguName, tx.dong, tx.jibun),
    }));

    const coordsMap = await batchGeocode(geocodeTargets);

    const geocodedTransactions = validTransactions.map((tx) => {
      const address = buildAddress(sigunguName, tx.dong, tx.jibun);
      const coords = coordsMap.get(address);
      if (coords) {
        return { ...tx, lat: coords.lat, lng: coords.lng };
      }
      return tx;
    });

    return NextResponse.json({
      data: geocodedTransactions,
      meta: {
        regionCode,
        dealYM,
        type,
        totalCount: geocodedTransactions.length,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '실거래가 조회 중 오류가 발생했습니다.';
    const stack = error instanceof Error ? error.stack : undefined;

    console.error('[real-estate] API 호출 실패:', {
      message,
      stack,
      params: { regionCode, dealYM, type },
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
