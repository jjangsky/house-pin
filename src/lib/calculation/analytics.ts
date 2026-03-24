import type { Property } from '@/types';
import type { LiveListing } from '@/types/listing';
import type {
  PriceBucket,
  DongPriceSummary,
  AskingVsDealComparison,
  RegionalAnalytics,
} from '@/types/analytics';

// =============================================================================
// 가격 분포 (Price Distribution)
// =============================================================================

function determineBucketStep(range: number): number {
  if (range < 30000) return 5000; // 3억 미만 → 5천만 단위
  if (range < 100000) return 10000; // 10억 미만 → 1억 단위
  return 20000; // 10억 이상 → 2억 단위
}

function formatBucketLabel(min: number, max: number, step: number): string {
  if (step === 5000) {
    const formatVal = (v: number): string => {
      if (v >= 10000) {
        const eok = Math.floor(v / 10000);
        const man = v % 10000;
        return man > 0 ? `${eok}억${man.toLocaleString('ko-KR')}만` : `${eok}억`;
      }
      return `${v.toLocaleString('ko-KR')}만`;
    };
    return `${formatVal(min)}~${formatVal(max)}`;
  }

  const formatEok = (v: number): string => {
    const eok = Math.floor(v / 10000);
    const man = v % 10000;
    if (man > 0) return `${eok}억${man.toLocaleString('ko-KR')}만`;
    return `${eok}억`;
  };
  return `${formatEok(min)}~${formatEok(max)}`;
}

export function buildPriceDistribution(
  properties: Property[],
  liveListings: LiveListing[],
): PriceBucket[] {
  const allPrices = [
    ...properties.map((p) => p.dealAmount),
    ...liveListings.map((l) => l.askingPrice),
  ];

  if (allPrices.length === 0) return [];

  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const range = maxPrice - minPrice;
  const step = determineBucketStep(range);

  const bucketStart = Math.floor(minPrice / step) * step;
  const bucketEnd = Math.ceil(maxPrice / step) * step;

  const buckets: PriceBucket[] = [];
  const total = allPrices.length;

  for (let min = bucketStart; min < bucketEnd; min += step) {
    const max = min + step;
    const count = allPrices.filter((p) => p >= min && p < max).length;

    // 마지막 버킷은 상한 포함
    const adjustedCount =
      min + step >= bucketEnd
        ? allPrices.filter((p) => p >= min && p <= max).length
        : count;

    if (adjustedCount > 0) {
      buckets.push({
        min,
        max,
        label: formatBucketLabel(min, max, step),
        count: adjustedCount,
        ratio: Math.round((adjustedCount / total) * 1000) / 1000,
      });
    }
  }

  return buckets;
}

// =============================================================================
// 동별 가격 요약 (Dong Price Summaries)
// =============================================================================

export function buildDongSummaries(
  properties: Property[],
  liveListings: LiveListing[],
): DongPriceSummary[] {
  const dongMap = new Map<
    string,
    { dealPrices: number[]; askingPrices: number[] }
  >();

  for (const p of properties) {
    if (!dongMap.has(p.dong)) {
      dongMap.set(p.dong, { dealPrices: [], askingPrices: [] });
    }
    dongMap.get(p.dong)!.dealPrices.push(p.dealAmount);
  }

  for (const l of liveListings) {
    if (!dongMap.has(l.dongName)) {
      dongMap.set(l.dongName, { dealPrices: [], askingPrices: [] });
    }
    dongMap.get(l.dongName)!.askingPrices.push(l.askingPrice);
  }

  const summaries: DongPriceSummary[] = [];

  for (const [dongName, data] of dongMap) {
    const avgDealPrice =
      data.dealPrices.length > 0
        ? Math.round(
            data.dealPrices.reduce((a, b) => a + b, 0) / data.dealPrices.length,
          )
        : 0;

    const avgAskingPrice =
      data.askingPrices.length > 0
        ? Math.round(
            data.askingPrices.reduce((a, b) => a + b, 0) /
              data.askingPrices.length,
          )
        : null;

    summaries.push({
      dongName,
      avgDealPrice,
      avgAskingPrice,
      dealCount: data.dealPrices.length,
      listingCount: data.askingPrices.length,
    });
  }

  return summaries.sort((a, b) => b.dealCount - a.dealCount);
}

// =============================================================================
// 호가 vs 실거래가 비교 (Asking vs Deal Comparison)
// =============================================================================

export function buildAskingVsDealComparison(
  properties: Property[],
  liveListings: LiveListing[],
): AskingVsDealComparison | null {
  if (liveListings.length === 0) return null;
  if (properties.length === 0) return null;

  const avgDealPrice = Math.round(
    properties.reduce((sum, p) => sum + p.dealAmount, 0) / properties.length,
  );

  const avgAskingPrice = Math.round(
    liveListings.reduce((sum, l) => sum + l.askingPrice, 0) /
      liveListings.length,
  );

  const premiumRate =
    Math.round(((avgAskingPrice - avgDealPrice) / avgDealPrice) * 1000) / 10;

  // 동별 비교: 실거래와 호가 모두 있는 동만 포함
  const dealByDong = new Map<string, number[]>();
  for (const p of properties) {
    if (!dealByDong.has(p.dong)) dealByDong.set(p.dong, []);
    dealByDong.get(p.dong)!.push(p.dealAmount);
  }

  const askingByDong = new Map<string, number[]>();
  for (const l of liveListings) {
    if (!askingByDong.has(l.dongName)) askingByDong.set(l.dongName, []);
    askingByDong.get(l.dongName)!.push(l.askingPrice);
  }

  const byDong: AskingVsDealComparison['byDong'] = [];
  for (const [dongName, dealPrices] of dealByDong) {
    const askingPrices = askingByDong.get(dongName);
    if (!askingPrices || askingPrices.length === 0) continue;

    const avgDeal = Math.round(
      dealPrices.reduce((a, b) => a + b, 0) / dealPrices.length,
    );
    const avgAsking = Math.round(
      askingPrices.reduce((a, b) => a + b, 0) / askingPrices.length,
    );
    const dongPremium =
      Math.round(((avgAsking - avgDeal) / avgDeal) * 1000) / 10;

    byDong.push({
      dongName,
      avgDeal,
      avgAsking,
      premiumRate: dongPremium,
    });
  }

  return {
    avgDealPrice,
    avgAskingPrice,
    premiumRate,
    byDong,
  };
}

// =============================================================================
// 지역 분석 통합 (Regional Analytics)
// =============================================================================

export function buildRegionalAnalytics(
  properties: Property[],
  liveListings: LiveListing[],
): RegionalAnalytics {
  const allPrices = [
    ...properties.map((p) => p.dealAmount),
    ...liveListings.map((l) => l.askingPrice),
  ].sort((a, b) => a - b);

  const medianPrice =
    allPrices.length > 0
      ? allPrices.length % 2 === 1
        ? allPrices[Math.floor(allPrices.length / 2)]
        : Math.round(
            (allPrices[allPrices.length / 2 - 1] +
              allPrices[allPrices.length / 2]) /
              2,
          )
      : 0;

  return {
    priceDistribution: buildPriceDistribution(properties, liveListings),
    dongSummaries: buildDongSummaries(properties, liveListings),
    askingVsDeal: buildAskingVsDealComparison(properties, liveListings),
    summary: {
      totalDeals: properties.length,
      totalListings: liveListings.length,
      medianPrice,
      minPrice: allPrices.length > 0 ? allPrices[0] : 0,
      maxPrice: allPrices.length > 0 ? allPrices[allPrices.length - 1] : 0,
    },
  };
}
