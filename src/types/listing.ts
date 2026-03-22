// =============================================================================
// 실시간 매물 타입 정의
// 외부 매물 API에서 가져오는 현재 시장에 나와있는 매물 데이터
// =============================================================================

/** 외부 API 원본 응답의 매물 1건 */
export interface ListingRoomRaw {
  seq: number;
  id: string;
  roomTypeName: string;
  randomLocation: {
    lat: number;
    lng: number;
  };
  complexName: string;
  roomTitle: string;
  roomDesc: string;
  priceTypeName: string;
  priceTitle: string;
  imgUrlList: string[];
  dongName: string;
  gid: number;
  isQuick: boolean;
  isPano: boolean;
  isOwnerAuth: boolean;
  isNaverVerify: boolean;
}

/** 앱 내부에서 사용하는 정제된 실시간 매물 */
export interface LiveListing {
  // 식별
  listingSeq: number;
  listingId: string;

  // 기본 정보
  name: string;
  dongName: string;
  roomTitle: string;
  roomDesc: string;
  propertyType: 'apartment' | 'villa' | 'officetel';

  // 가격 (만원 단위)
  askingPrice: number;
  priceDisplay: string;

  // 위치
  lat: number;
  lng: number;

  // 면적/층 (roomDesc 파싱)
  area: number | null;
  floor: number | null;

  // 미디어
  imgUrlList: string[];
  thumbnailUrl: string | null;

  // 플래그
  isPano: boolean;
  isOwnerAuth: boolean;
  isNaverVerify: boolean;
  isQuick: boolean;

  // 메타
  source: 'live';
}

/** 실시간 매물 일괄 조회 요청 */
export interface LiveBatchRequest {
  regionCodes: string[];
  categories: ('apt' | 'officetel' | 'house')[];
  maxPrice: number;
}

/** 실시간 매물 일괄 조회 응답 */
export interface LiveBatchResponse {
  listings: LiveListing[];
  meta: {
    totalFetched: number;
    totalFiltered: number;
    failedRegions: string[];
    rateLimited: boolean;
  };
}

/** 단지 상세 정보 */
export interface ComplexDetail {
  complexId: string;
  name: string;
  typeName: string;
  address: string;
  jibunAddress: string;
  roadAddress: string;
  location: { lat: number; lng: number };
  householdNum: number;
  buildingNum: number;
  parkingAverage: number;
  providerName: string;
  heatTypeName: string;
  fuelTypeName: string;
  useApprovalYear: string;
  images: { url: string; title: string }[];

  spaces: {
    pyeongType: string;
    bedsNum: number;
    bathNum: number;
    roomSpace: number;
    supplySpace: number;
    layoutImage: string | null;
  }[];

  education: {
    elementary: { name: string; distance: number; avgStudents: string }[];
    middle: { name: string; distance: number; avgStudents: string }[];
    high: { name: string; distance: number; avgStudents: string }[];
  };

  priceComparison: {
    scope: string;
    tradePyeongPrice: number;
    leasePyeongPrice: number;
  }[];

  nearComplexes: {
    complexId: string;
    name: string;
    desc: string;
    avgPyeongPrice: number;
  }[];

  roomCount: number;
}
