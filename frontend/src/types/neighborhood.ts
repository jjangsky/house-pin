export interface NeighborhoodReport {
  regionCode: string;
  regionName: string;

  /** 시세 동향 */
  priceTrend: {
    averagePrice: number; // 현재 평균 시세 (만원)
    priceChangePercent: number; // 최근 변동률 (%)
    priceChangeDirection: 'up' | 'down' | 'stable';
    recentDeals: number; // 최근 거래 건수
    highestDeal: number; // 최고가 (만원)
    lowestDeal: number; // 최저가 (만원)
  };

  /** 전세가율 */
  jeonseRatio: {
    ratio: number; // 전세가율 (%)
    assessment: 'low' | 'normal' | 'high';
  } | null;

  /** 면적별 분석 */
  sizeAnalysis: Array<{
    sizeRange: string; // "60㎡ 이하", "60~85㎡", "85㎡ 초과"
    averagePrice: number;
    dealCount: number;
    pricePerPyeong: number; // 평당가 (만원)
  }>;

  /** 단지 랭킹 */
  complexRanking: Array<{
    name: string;
    averagePrice: number;
    dealCount: number;
    latestDealDate: string; // "2025.03"
  }>;

  /** 종합 점수 */
  scores: {
    activity: number; // 거래 활발도 (1-5)
    stability: number; // 가격 안정성 (1-5)
    value: number; // 가성비 (1-5)
    overall: number; // 종합 (1-5)
  };
}
