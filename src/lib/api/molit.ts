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

/** 새 API 영문 필드명 */
interface RawItem {
  dealAmount?: string;
  buildYear?: number;
  dealYear?: number;
  dealMonth?: number;
  dealDay?: number;
  umdNm?: string;        // 법정동
  aptNm?: string;        // 아파트명
  excluUseAr?: number;   // 전용면적
  floor?: number;
  jibun?: string;
  sggCd?: string;        // 지역코드
  cdealType?: string;    // 해제여부
  dealingGbn?: string;   // 거래유형
  // 연립다세대/오피스텔용
  mhouseNm?: string;     // 연립다세대명
  offiNm?: string;       // 오피스텔명
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
    dealAmount: parseDealAmount(item.dealAmount),
    buildYear: Number(item.buildYear) || 0,
    dealYear: Number(item.dealYear) || 0,
    dealMonth: Number(item.dealMonth) || 0,
    dealDay: Number(item.dealDay) || 0,
    dong: String(item.umdNm ?? '').trim(),
    aptName: String(item.aptNm ?? item.mhouseNm ?? item.offiNm ?? '').trim(),
    area: Number(item.excluUseAr) || 0,
    floor: Number(item.floor) || 0,
    jibun: String(item.jibun ?? '').trim(),
    regionCode: String(item.sggCd ?? fallbackRegionCode).trim(),
    cancelDealType: String(item.cdealType ?? '').trim(),
    dealType: String(item.dealingGbn ?? '').trim(),
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

  const requestUrl = `${API_CONFIG.MOLIT.BASE_URL}${endpoint}?serviceKey=${apiKey}&LAWD_CD=${regionCode}&DEAL_YMD=${dealYM}&numOfRows=1000`;

  const response = await fetch(requestUrl, {
    next: { revalidate: 3600 },
    headers: { 'User-Agent': 'Mozilla/5.0 house-pin/1.0' },
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
