// =============================================================================
// API Configuration — base URLs, endpoints, and environment validation
// =============================================================================

/**
 * 국토교통부 (MOLIT) OpenAPI via 공공데이터포털
 * 아파트/연립다세대/단독다가구/오피스텔 실거래가 + 건축물대장
 */
const MOLIT = {
  BASE_URL: 'https://apis.data.go.kr/1613000',
  ENDPOINTS: {
    // 아파트
    APT_TRADE: '/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade',
    APT_RENT: '/RTMSDataSvcAptRent/getRTMSDataSvcAptRent',

    // 연립다세대
    MULTI_HOUSE_TRADE: '/RTMSDataSvcRHTrade/getRTMSDataSvcRHTrade',
    MULTI_HOUSE_RENT: '/RTMSDataSvcRHRent/getRTMSDataSvcRHRent',

    // 단독/다가구
    SINGLE_HOUSE_TRADE: '/RTMSDataSvcSHTrade/getRTMSDataSvcSHTrade',
    SINGLE_HOUSE_RENT: '/RTMSDataSvcSHRent/getRTMSDataSvcSHRent',

    // 오피스텔
    OFFICETEL_TRADE: '/RTMSDataSvcOffiTrade/getRTMSDataSvcOffiTrade',
    OFFICETEL_RENT: '/RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent',

    // 건축물대장
    BUILDING_TITLE: '/BldRgstHubService/getBrTitleInfo',
    BUILDING_EXPOSE: '/BldRgstHubService/getBrExposPubuseAreaInfo',
  },
} as const;

/**
 * 금융감독원 금융상품비교공시 API
 * 주택담보대출, 전세자금대출 금리 비교
 */
const FSS = {
  BASE_URL: 'http://finlife.fss.or.kr/finlifeapi',
  ENDPOINTS: {
    MORTGAGE_LOAN: '/mortgageLoanProductsSearch.json',
    JEONSE_LOAN: '/rentHouseLoanProductsSearch.json',
    COMPANY_LIST: '/companySearch.json',
  },
} as const;

/**
 * 한국은행 경제통계시스템 (ECOS) API
 * 기준금리, 주택가격지수 등 경제 지표
 */
const ECOS = {
  BASE_URL: 'https://ecos.bok.or.kr/api',
  ENDPOINTS: {
    STAT_SEARCH: '/StatisticSearch',
    STAT_TABLE_LIST: '/StatisticTableList',
    KEY_STAT: '/KeyStatisticList',
  },
  /** 자주 사용하는 통계표 코드 */
  STAT_CODES: {
    BASE_RATE: '722Y001',       // 한국은행 기준금리
    HOUSING_PRICE_INDEX: '901Y062', // 주택매매가격지수
    CONSUMER_PRICE: '901Y009',  // 소비자물가지수
  },
} as const;

/**
 * 카카오 API
 * 지도 표시 (JS key) + 주소검색/좌표변환 (REST key)
 */
const KAKAO = {
  REST_BASE_URL: 'https://dapi.kakao.com',
  JS_SDK_URL: 'https://dapi.kakao.com/v2/maps/sdk.js',
  ENDPOINTS: {
    ADDRESS_SEARCH: '/v2/local/search/address.json',
    KEYWORD_SEARCH: '/v2/local/search/keyword.json',
    COORD_TO_ADDRESS: '/v2/local/geo/coord2address.json',
    COORD_TO_REGION: '/v2/local/geo/coord2regioncode.json',
  },
} as const;

// =============================================================================
// Aggregated config export
// =============================================================================

export const API_CONFIG = {
  MOLIT,
  FSS,
  ECOS,
  KAKAO,
} as const;

// =============================================================================
// Environment variable helpers
// =============================================================================

export type ApiEnvKey =
  | 'DATA_GO_KR_API_KEY'
  | 'FSS_API_KEY'
  | 'ECOS_API_KEY'
  | 'NEXT_PUBLIC_KAKAO_JS_KEY'
  | 'KAKAO_REST_API_KEY';

/**
 * Retrieve an environment variable with a clear error when missing.
 * Works on the server side only — client code should use NEXT_PUBLIC_ vars directly.
 */
export function getEnvVar(key: ApiEnvKey): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[house-pin] Missing required environment variable: ${key}. ` +
        'Copy .env.example to .env.local and fill in your API keys.',
    );
  }
  return value;
}

/**
 * Validate that all required server-side environment variables are present.
 * Call this once at application startup (e.g. in instrumentation.ts or a top-level layout).
 * Logs warnings instead of throwing so the app can still boot in partial-config scenarios.
 */
export function validateEnvVars(): { valid: boolean; missing: string[] } {
  // Only validate on the server — client bundles do not have access to secret vars.
  if (typeof window !== 'undefined') {
    return { valid: true, missing: [] };
  }

  const required: ApiEnvKey[] = [
    'DATA_GO_KR_API_KEY',
    'FSS_API_KEY',
    'KAKAO_REST_API_KEY',
  ];

  const optional: ApiEnvKey[] = [
    'ECOS_API_KEY',
    'NEXT_PUBLIC_KAKAO_JS_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);
  const missingOptional = optional.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn(
      `[house-pin] Missing REQUIRED env vars: ${missing.join(', ')}. ` +
        'Some features will not work. See .env.example for details.',
    );
  }

  if (missingOptional.length > 0) {
    console.warn(
      `[house-pin] Missing optional env vars: ${missingOptional.join(', ')}. ` +
        'Related features may be limited.',
    );
  }

  return { valid: missing.length === 0, missing };
}
