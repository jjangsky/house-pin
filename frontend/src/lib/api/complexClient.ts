// =============================================================================
// 단지 상세 API 클라이언트
// 외부 매물 데이터 소스에서 아파트 단지 상세 정보를 조회
// =============================================================================

import { sqmToPyeong } from '@/lib/utils/format';
import type { ComplexDetail } from '@/types/listing';

// =============================================================================
// 설정
// =============================================================================

function getBaseUrl(): string {
  return process.env.LISTING_API_BASE_URL ?? '';
}

function buildHeaders(): Record<string, string> {
  const baseUrl = getBaseUrl();
  return {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'ko-KR',
    'd-api-version': '5.0.0',
    'd-call-type': 'web',
    'd-app-version': '1',
    'csrf': 'token',
    'referer': baseUrl,
    'user-agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  };
}

// =============================================================================
// 응답 변환
// =============================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

function parseImages(complex: any): ComplexDetail['images'] {
  if (!Array.isArray(complex?.images)) return [];
  return complex.images.map((img: any) => ({
    url: img.image ?? '',
    title: img.imageTitle ?? '',
  }));
}

function parseSpaces(spaces: any[]): ComplexDetail['spaces'] {
  if (!Array.isArray(spaces)) return [];
  return spaces.map((s: any) => ({
    pyeongType: s.pyeongType ?? '',
    bedsNum: s.bedsNum ?? 0,
    bathNum: s.bathNum ?? 0,
    roomSpace: s.roomSpace ? sqmToPyeong(s.roomSpace) : 0,
    supplySpace: s.supplySpace ? sqmToPyeong(s.supplySpace) : 0,
    layoutImage: s.layoutImage ?? null,
  }));
}

function parseSchools(
  schools: any[],
): { name: string; distance: number; avgStudents: string }[] {
  if (!Array.isArray(schools)) return [];
  return schools.map((s: any) => ({
    name: s.name ?? '',
    distance: s.distance ?? 0,
    avgStudents: s.avgStudentsPerClass ?? '',
  }));
}

function parseEducation(education: any): ComplexDetail['education'] {
  const empty = { elementary: [], middle: [], high: [] };
  if (!education) return empty;

  return {
    elementary: [
      ...parseSchools(education.nurserySchool),
      ...parseSchools(education.elementarySchool),
    ],
    middle: parseSchools(education.middleSchool),
    high: parseSchools(education.highSchool),
  };
}

function parsePriceComparison(
  areaAveragePrice: any,
): ComplexDetail['priceComparison'] {
  if (!Array.isArray(areaAveragePrice)) return [];
  return areaAveragePrice.map((item: any) => ({
    scope: item.scope ?? '',
    tradePyeongPrice: item.tradePyeongPrice ?? 0,
    leasePyeongPrice: item.leasePyeongPrice ?? 0,
  }));
}

function parseNearComplexes(
  nearComplexes: any,
): ComplexDetail['nearComplexes'] {
  const trade = nearComplexes?.trade;
  if (!Array.isArray(trade)) return [];
  return trade.map((item: any) => ({
    complexId: String(item.complexId ?? ''),
    name: item.name ?? '',
    desc: item.description ?? '',
    avgPyeongPrice: item.avgPyeongPrice ?? 0,
  }));
}

function transformResponse(result: any): ComplexDetail {
  const complex = result.complex ?? {};

  return {
    complexId: String(complex.complexId ?? ''),
    name: complex.name ?? '',
    typeName: complex.typeName ?? '',
    address: complex.address ?? '',
    jibunAddress: complex.jibunAddress ?? '',
    roadAddress: complex.roadAddress ?? '',
    location: {
      lat: complex.lat ?? 0,
      lng: complex.lng ?? 0,
    },
    householdNum: complex.householdNum ?? 0,
    buildingNum: complex.buildingNum ?? 0,
    parkingAverage: complex.parkingAverage ?? 0,
    providerName: complex.providerName ?? '',
    heatTypeName: complex.heatTypeName ?? '',
    fuelTypeName: complex.fuelTypeName ?? '',
    useApprovalYear: complex.useApprovalYear ?? '',
    images: parseImages(complex),
    spaces: parseSpaces(result.spaces),
    education: parseEducation(result.education),
    priceComparison: parsePriceComparison(result.areaAveragePrice),
    nearComplexes: parseNearComplexes(result.nearComplexes),
    roomCount: result.roomCount ?? 0,
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// =============================================================================
// 단지 상세 조회
// =============================================================================

export async function fetchComplexDetail(
  complexId: string,
): Promise<ComplexDetail> {
  const baseUrl = getBaseUrl();

  const fallback: ComplexDetail = {
    complexId,
    name: '',
    typeName: '',
    address: '',
    jibunAddress: '',
    roadAddress: '',
    location: { lat: 0, lng: 0 },
    householdNum: 0,
    buildingNum: 0,
    parkingAverage: 0,
    providerName: '',
    heatTypeName: '',
    fuelTypeName: '',
    useApprovalYear: '',
    images: [],
    spaces: [],
    education: { elementary: [], middle: [], high: [] },
    priceComparison: [],
    nearComplexes: [],
    roomCount: 0,
  };

  if (!baseUrl) {
    console.warn('[complex] LISTING_API_BASE_URL 미설정');
    return fallback;
  }

  try {
    const url = `${baseUrl}/api/v5/complex/${complexId}`;
    const response = await fetch(url, { headers: buildHeaders() });

    if (!response.ok) {
      console.warn(
        `[complex] API 요청 실패: status=${response.status}, complexId=${complexId}`,
      );
      return fallback;
    }

    const json = await response.json();

    if (!json.result) {
      console.warn(`[complex] API 응답에 result 없음: complexId=${complexId}`);
      return fallback;
    }

    return transformResponse(json.result);
  } catch (err) {
    console.error(`[complex] 단지 상세 조회 실패: complexId=${complexId}`, err);
    return fallback;
  }
}
