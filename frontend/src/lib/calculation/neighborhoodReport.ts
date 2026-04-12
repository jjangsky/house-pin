import type { Property } from '@/types';
import type { NeighborhoodReport } from '@/types/neighborhood';
import { sqmToPyeong } from '@/lib/utils/format';

// =============================================================================
// 헬퍼 함수
// =============================================================================

/** 표준편차 계산 */
function stdDev(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map((v) => (v - mean) ** 2);
  return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length);
}

/** 값을 1~5 범위로 클램프 후 반올림 */
function clampScore(value: number): number {
  return Math.round(Math.min(5, Math.max(1, value)) * 10) / 10;
}

// =============================================================================
// 시세 동향 (Price Trend)
// =============================================================================

function buildPriceTrend(properties: Property[]): NeighborhoodReport['priceTrend'] {
  if (properties.length === 0) {
    return {
      averagePrice: 0,
      priceChangePercent: 0,
      priceChangeDirection: 'stable',
      recentDeals: 0,
      highestDeal: 0,
      lowestDeal: 0,
    };
  }

  const prices = properties.map((p) => p.dealAmount);
  const averagePrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const highestDeal = Math.max(...prices);
  const lowestDeal = Math.min(...prices);

  // 최근 3개월 vs 이전 3개월 비교
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  const recent: number[] = [];
  const prior: number[] = [];

  for (const p of properties) {
    const dealDate = new Date(p.dealYear, p.dealMonth - 1, p.dealDay);
    if (dealDate >= threeMonthsAgo) {
      recent.push(p.dealAmount);
    } else {
      prior.push(p.dealAmount);
    }
  }

  let priceChangePercent = 0;
  let priceChangeDirection: 'up' | 'down' | 'stable' = 'stable';

  if (recent.length > 0 && prior.length > 0) {
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const priorAvg = prior.reduce((a, b) => a + b, 0) / prior.length;
    priceChangePercent = Math.round(((recentAvg - priorAvg) / priorAvg) * 1000) / 10;

    if (priceChangePercent > 1) priceChangeDirection = 'up';
    else if (priceChangePercent < -1) priceChangeDirection = 'down';
    else priceChangeDirection = 'stable';
  }

  return {
    averagePrice,
    priceChangePercent,
    priceChangeDirection,
    recentDeals: properties.length,
    highestDeal,
    lowestDeal,
  };
}

// =============================================================================
// 면적별 분석 (Size Analysis)
// =============================================================================

interface SizeBucket {
  label: string;
  min: number;
  max: number;
}

const SIZE_BUCKETS: SizeBucket[] = [
  { label: '60㎡ 이하', min: 0, max: 60 },
  { label: '60~85㎡', min: 60, max: 85 },
  { label: '85㎡ 초과', min: 85, max: Infinity },
];

function buildSizeAnalysis(
  properties: Property[],
): NeighborhoodReport['sizeAnalysis'] {
  return SIZE_BUCKETS.map((bucket) => {
    const group = properties.filter(
      (p) => p.area > bucket.min && p.area <= bucket.max,
    );

    // 첫 번째 구간은 0 초과가 아니라 0 이상
    const adjustedGroup =
      bucket.min === 0
        ? properties.filter((p) => p.area <= bucket.max)
        : group;

    if (adjustedGroup.length === 0) {
      return {
        sizeRange: bucket.label,
        averagePrice: 0,
        dealCount: 0,
        pricePerPyeong: 0,
      };
    }

    const totalPrice = adjustedGroup.reduce((sum, p) => sum + p.dealAmount, 0);
    const totalPyeong = adjustedGroup.reduce(
      (sum, p) => sum + sqmToPyeong(p.area),
      0,
    );
    const averagePrice = Math.round(totalPrice / adjustedGroup.length);
    const pricePerPyeong =
      totalPyeong > 0 ? Math.round(totalPrice / totalPyeong) : 0;

    return {
      sizeRange: bucket.label,
      averagePrice,
      dealCount: adjustedGroup.length,
      pricePerPyeong,
    };
  }).filter((s) => s.dealCount > 0);
}

// =============================================================================
// 단지 랭킹 (Complex Ranking)
// =============================================================================

function buildComplexRanking(
  properties: Property[],
): NeighborhoodReport['complexRanking'] {
  const complexMap = new Map<
    string,
    { prices: number[]; latestYear: number; latestMonth: number }
  >();

  for (const p of properties) {
    const existing = complexMap.get(p.name);
    if (existing) {
      existing.prices.push(p.dealAmount);
      if (
        p.dealYear > existing.latestYear ||
        (p.dealYear === existing.latestYear && p.dealMonth > existing.latestMonth)
      ) {
        existing.latestYear = p.dealYear;
        existing.latestMonth = p.dealMonth;
      }
    } else {
      complexMap.set(p.name, {
        prices: [p.dealAmount],
        latestYear: p.dealYear,
        latestMonth: p.dealMonth,
      });
    }
  }

  const rankings = Array.from(complexMap.entries())
    .map(([name, data]) => ({
      name,
      averagePrice: Math.round(
        data.prices.reduce((a, b) => a + b, 0) / data.prices.length,
      ),
      dealCount: data.prices.length,
      latestDealDate: `${data.latestYear}.${String(data.latestMonth).padStart(2, '0')}`,
    }))
    .sort((a, b) => b.averagePrice - a.averagePrice);

  return rankings.slice(0, 5);
}

// =============================================================================
// 점수 계산 (Scores)
// =============================================================================

function calculateScores(
  properties: Property[],
): NeighborhoodReport['scores'] {
  if (properties.length === 0) {
    return { activity: 1, stability: 1, value: 1, overall: 1 };
  }

  // Activity: 거래 건수 기반
  const dealCount = properties.length;
  let activity: number;
  if (dealCount <= 5) activity = 1;
  else if (dealCount <= 15) activity = 2;
  else if (dealCount <= 30) activity = 3;
  else if (dealCount <= 50) activity = 4;
  else activity = 5;

  // Stability: 가격 표준편차 / 평균 비율 (변동계수)
  const prices = properties.map((p) => p.dealAmount);
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const cv = mean > 0 ? stdDev(prices) / mean : 0;

  // CV가 낮을수록 안정적 → 높은 점수
  // CV 0~0.1: 5, 0.1~0.2: 4, 0.2~0.3: 3, 0.3~0.5: 2, 0.5+: 1
  let stability: number;
  if (cv <= 0.1) stability = 5;
  else if (cv <= 0.2) stability = 4;
  else if (cv <= 0.3) stability = 3;
  else if (cv <= 0.5) stability = 2;
  else stability = 1;

  // Value: 평당가 기준 (낮을수록 가성비 높음)
  const totalPyeong = properties.reduce(
    (sum, p) => sum + sqmToPyeong(p.area),
    0,
  );
  const avgPricePerPyeong =
    totalPyeong > 0
      ? properties.reduce((sum, p) => sum + p.dealAmount, 0) / totalPyeong
      : 0;

  // 평당가 기준 (서울 평균 약 3000~5000만/평 기준)
  // ≤1000: 5, ≤2000: 4, ≤3000: 3, ≤4000: 2, >4000: 1
  let value: number;
  if (avgPricePerPyeong <= 1000) value = 5;
  else if (avgPricePerPyeong <= 2000) value = 4;
  else if (avgPricePerPyeong <= 3000) value = 3;
  else if (avgPricePerPyeong <= 4000) value = 2;
  else value = 1;

  // Overall: 가중 평균
  const overall = clampScore(activity * 0.3 + stability * 0.3 + value * 0.4);

  return { activity, stability, value, overall };
}

// =============================================================================
// 메인 함수
// =============================================================================

export function generateNeighborhoodReport(
  properties: Property[],
  regionCode: string,
  regionName: string,
): NeighborhoodReport {
  return {
    regionCode,
    regionName,
    priceTrend: buildPriceTrend(properties),
    jeonseRatio: null, // 현재 매매 데이터만 사용, 전세 데이터 없음
    sizeAnalysis: buildSizeAnalysis(properties),
    complexRanking: buildComplexRanking(properties),
    scores: calculateScores(properties),
  };
}
