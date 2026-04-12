// =============================================================================
// 급매 탐지 타입 정의
// 매물의 급매 가능성을 점수화하는 시스템
// =============================================================================

export interface BargainScore {
  score: number; // 0-100
  grade: 'hot' | 'good' | 'normal' | 'overpriced';
  priceGapPercent: number; // 실거래가 대비 괴리율 (%)
  priceGapAmount: number; // 괴리 금액 (만원)
  recentDealPrice: number; // 비교 기준 실거래가 (만원)
  listingPrice: number; // 호가 (만원)
  factors: BargainFactor[]; // 점수 구성 요소
  summary: string; // 한줄 요약
}

export interface BargainFactor {
  name: string;
  score: number; // 이 요소의 점수 기여분
  description: string;
}
