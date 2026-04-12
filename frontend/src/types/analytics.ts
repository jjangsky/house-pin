export interface PriceBucket {
  min: number; // 구간 시작 (만원)
  max: number; // 구간 끝 (만원)
  label: string; // "3~4억"
  count: number;
  ratio: number; // 0~1
}

export interface DongPriceSummary {
  dongName: string;
  avgDealPrice: number;
  avgAskingPrice: number | null;
  dealCount: number;
  listingCount: number;
}

export interface AskingVsDealComparison {
  avgDealPrice: number;
  avgAskingPrice: number;
  premiumRate: number; // (asking - deal) / deal * 100
  byDong: {
    dongName: string;
    avgDeal: number;
    avgAsking: number;
    premiumRate: number;
  }[];
}

export interface RegionalAnalytics {
  priceDistribution: PriceBucket[];
  dongSummaries: DongPriceSummary[];
  askingVsDeal: AskingVsDealComparison | null;
  summary: {
    totalDeals: number;
    totalListings: number;
    medianPrice: number;
    minPrice: number;
    maxPrice: number;
  };
}
