// =============================================================================
// 단지 상세 UI 전용 타입 정의
// ComplexDetail 원본은 listing.ts에 정의, 여기는 UI 표시용 파생 타입
// =============================================================================

/** 학교 정보 (교육 환경 표시용) */
export interface SchoolInfo {
  name: string;
  type: '초등학교' | '중학교' | '고등학교';
  distance: number; // 미터
  walkMinutes: number;
  avgStudentsPerClass: number;
}

/** 평당가 비교 항목 (시세 비교 UI용) */
export interface PriceComparisonItem {
  scope: string;
  tradePyeongPrice: number; // 만원
  leasePyeongPrice: number; // 만원
}

/** 인근 단지 항목 (주변 단지 비교 UI용) */
export interface NearComplexItem {
  complexId: string;
  name: string;
  description: string;
  avgPyeongPrice: number; // 만원
}

/** 평면도 정보 (세대 타입별 면적/구조 표시용) */
export interface FloorPlanInfo {
  pyeongType: string;
  bedsNum: number;
  bathNum: number;
  roomSpaceSqm: number;
  roomSpacePyeong: number;
  supplySpaceSqm: number;
  supplySpacePyeong: number;
  layoutImageUrl: string | null;
}
