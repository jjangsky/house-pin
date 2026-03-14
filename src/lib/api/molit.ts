// =============================================================================
// 국토교통부 실거래가 API 클라이언트
// 아파트/연립다세대/오피스텔 실거래 데이터 조회
// =============================================================================

import { XMLParser } from 'fast-xml-parser';

import { API_CONFIG } from './config';
import { MOCK_APT_TRADE } from './mockMolitData';

// =============================================================================
// 타입 정의
// =============================================================================

export interface RealEstateTransaction {
  dealAmount: number;
  buildYear: number;
  dealYear: number;
  dealMonth: number;
  dealDay: number;
  dong: string;
  aptName: string;
  area: number;
  floor: number;
  jibun: string;
  regionCode: string;
  cancelDealType: string;
  dealType: string;
}

// =============================================================================
// 내부 유틸
// =============================================================================

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
});

/** 한글 필드명 -> 영문 필드명 매핑 */
interface RawItem {
  거래금액?: string;
  건축년도?: number;
  년?: number;
  월?: number;
  일?: number;
  법정동?: string;
  아파트?: string;
  연립다세대?: string;
  단지?: string;
  전용면적?: number;
  층?: number;
  지번?: string;
  지역코드?: string;
  해제여부?: string;
  거래유형?: string;
}

/**
 * 거래금액 문자열을 숫자로 변환
 * "    80,000" -> 80000
 */
function parseDealAmount(raw: string | undefined): number {
  if (!raw) return 0;
  return Number(String(raw).replace(/[,\s]/g, ''));
}

/**
 * 국토부 API 원본(raw) 응답 아이템을 RealEstateTransaction으로 변환
 */
function mapRawItem(item: RawItem, fallbackRegionCode: string): RealEstateTransaction {
  return {
    dealAmount: parseDealAmount(item.거래금액),
    buildYear: Number(item.건축년도) || 0,
    dealYear: Number(item.년) || 0,
    dealMonth: Number(item.월) || 0,
    dealDay: Number(item.일) || 0,
    dong: String(item.법정동 ?? '').trim(),
    aptName: String(item.아파트 ?? item.연립다세대 ?? item.단지 ?? '').trim(),
    area: Number(item.전용면적) || 0,
    floor: Number(item.층) || 0,
    jibun: String(item.지번 ?? '').trim(),
    regionCode: String(item.지역코드 ?? fallbackRegionCode).trim(),
    cancelDealType: String(item.해제여부 ?? '').trim(),
    dealType: String(item.거래유형 ?? '').trim(),
  };
}

/**
 * XML 응답을 파싱하여 RealEstateTransaction 배열로 변환
 */
function parseXmlResponse(
  xml: string,
  regionCode: string,
): RealEstateTransaction[] {
  const parsed = xmlParser.parse(xml);
  const body = parsed?.response?.body;

  if (!body || !body.items) {
    return [];
  }

  const items = body.items.item;

  // 단일 아이템일 경우 배열로 감싸기
  const itemArray: RawItem[] = Array.isArray(items) ? items : [items];

  return itemArray.map((item) => mapRawItem(item, regionCode));
}

/**
 * 국토부 API를 호출하여 실거래 데이터를 가져온다.
 */
async function fetchMolitData(
  endpoint: string,
  regionCode: string,
  dealYM: string,
): Promise<RealEstateTransaction[]> {
  const apiKey = process.env.DATA_GO_KR_API_KEY;

  if (!apiKey) {
    console.warn(
      '[house-pin] DATA_GO_KR_API_KEY 미설정 -- 목업 데이터를 반환합니다.',
    );
    return MOCK_APT_TRADE;
  }

  const baseUrl = `${API_CONFIG.MOLIT.BASE_URL}${endpoint}`;
  const url = new URL(baseUrl);
  url.searchParams.set('serviceKey', encodeURIComponent(apiKey));
  url.searchParams.set('LAWD_CD', regionCode);
  url.searchParams.set('DEAL_YMD', dealYM);

  const response = await fetch(url.toString(), {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(
      `국토부 API 요청 실패: ${response.status} ${response.statusText}`,
    );
  }

  const xml = await response.text();
  return parseXmlResponse(xml, regionCode);
}

// =============================================================================
// Public API
// =============================================================================

/**
 * 아파트 매매 실거래 조회
 */
export async function fetchAptTrade(
  regionCode: string,
  dealYM: string,
): Promise<RealEstateTransaction[]> {
  return fetchMolitData(
    API_CONFIG.MOLIT.ENDPOINTS.APT_TRADE,
    regionCode,
    dealYM,
  );
}

/**
 * 아파트 전월세 조회
 */
export async function fetchAptRent(
  regionCode: string,
  dealYM: string,
): Promise<RealEstateTransaction[]> {
  return fetchMolitData(
    API_CONFIG.MOLIT.ENDPOINTS.APT_RENT,
    regionCode,
    dealYM,
  );
}

/**
 * 연립다세대 매매 조회
 */
export async function fetchVillaTrade(
  regionCode: string,
  dealYM: string,
): Promise<RealEstateTransaction[]> {
  return fetchMolitData(
    API_CONFIG.MOLIT.ENDPOINTS.MULTI_HOUSE_TRADE,
    regionCode,
    dealYM,
  );
}

/**
 * 오피스텔 매매 조회
 */
export async function fetchOfficeTrade(
  regionCode: string,
  dealYM: string,
): Promise<RealEstateTransaction[]> {
  return fetchMolitData(
    API_CONFIG.MOLIT.ENDPOINTS.OFFICETEL_TRADE,
    regionCode,
    dealYM,
  );
}
