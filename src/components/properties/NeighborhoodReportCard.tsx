"use client";

import { useMemo } from "react";
import { Card, Badge } from "@/components/common";
import { formatToKoreanWon } from "@/lib/utils/format";
import { generateNeighborhoodReport } from "@/lib/calculation/neighborhoodReport";
import type { Property } from "@/types";
import type { NeighborhoodReport } from "@/types/neighborhood";

// =============================================================================
// Props
// =============================================================================

interface NeighborhoodReportCardProps {
  properties: Property[];
  regionCode: string;
  regionName: string;
}

// =============================================================================
// 하위 컴포넌트
// =============================================================================

function StarRating({ score }: { score: number }) {
  const fullStars = Math.floor(score);
  const hasHalf = score - fullStars >= 0.5;

  return (
    <span className="inline-flex items-center gap-0.5 text-sm">
      {Array.from({ length: 5 }, (_, i) => {
        if (i < fullStars) return <span key={i} className="text-[#FFB800]">&#9733;</span>;
        if (i === fullStars && hasHalf) return <span key={i} className="text-[#FFB800]/50">&#9733;</span>;
        return <span key={i} className="text-border">&#9733;</span>;
      })}
      <span className="ml-1 text-xs font-semibold text-primary">{score}</span>
    </span>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const percentage = (score / 5) * 100;

  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-sm text-secondary">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-surface overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-6 shrink-0 text-right text-xs font-semibold text-primary">
        {score}
      </span>
    </div>
  );
}

function PriceChangeBadge({
  direction,
  percent,
}: {
  direction: NeighborhoodReport["priceTrend"]["priceChangeDirection"];
  percent: number;
}) {
  if (direction === "stable") {
    return <Badge variant="info">보합</Badge>;
  }

  if (direction === "up") {
    return (
      <Badge variant="danger">
        &#9650; {Math.abs(percent)}%
      </Badge>
    );
  }

  return (
    <Badge variant="success">
      &#9660; {Math.abs(percent)}%
    </Badge>
  );
}

// =============================================================================
// 메인 컴포넌트
// =============================================================================

export default function NeighborhoodReportCard({
  properties,
  regionCode,
  regionName,
}: NeighborhoodReportCardProps) {
  const report = useMemo(
    () => generateNeighborhoodReport(properties, regionCode, regionName),
    [properties, regionCode, regionName],
  );

  if (properties.length === 0) return null;

  const { priceTrend, sizeAnalysis, complexRanking, scores } = report;

  return (
    <Card className="mb-5">
      {/* 헤더: 지역명 + 종합 점수 */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs font-medium text-secondary">동네 가치 리포트</p>
          <h3 className="text-lg font-bold text-primary">{regionName}</h3>
        </div>
        <StarRating score={scores.overall} />
      </div>

      {/* 시세 동향 히어로 */}
      <div className="rounded-[12px] bg-white p-4 mb-4">
        <p className="text-xs text-secondary mb-1">평균 시세</p>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold text-primary">
            {formatToKoreanWon(priceTrend.averagePrice)}
          </span>
          <PriceChangeBadge
            direction={priceTrend.priceChangeDirection}
            percent={priceTrend.priceChangePercent}
          />
        </div>
        <div className="mt-2 flex gap-4 text-xs text-secondary">
          <span>
            최고 <span className="font-semibold text-primary">{formatToKoreanWon(priceTrend.highestDeal)}</span>
          </span>
          <span>
            최저 <span className="font-semibold text-primary">{formatToKoreanWon(priceTrend.lowestDeal)}</span>
          </span>
          <span>
            거래 <span className="font-semibold text-primary">{priceTrend.recentDeals}건</span>
          </span>
        </div>
      </div>

      {/* 면적별 분석 */}
      {sizeAnalysis.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-primary mb-2">면적별 시세</p>
          <div className="overflow-hidden rounded-[12px] border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface text-secondary">
                  <th className="py-2.5 px-3 text-left font-medium">면적</th>
                  <th className="py-2.5 px-3 text-right font-medium">평균가</th>
                  <th className="py-2.5 px-3 text-right font-medium">평당가</th>
                  <th className="py-2.5 px-3 text-right font-medium">건수</th>
                </tr>
              </thead>
              <tbody>
                {sizeAnalysis.map((row) => (
                  <tr key={row.sizeRange} className="border-t border-border">
                    <td className="py-2.5 px-3 text-secondary">{row.sizeRange}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-primary">
                      {formatToKoreanWon(row.averagePrice)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-secondary">
                      {formatToKoreanWon(row.pricePerPyeong)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-secondary">
                      {row.dealCount}건
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 단지 랭킹 */}
      {complexRanking.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-primary mb-2">인기 단지 TOP 5</p>
          <div className="flex flex-col gap-2">
            {complexRanking.map((complex, idx) => (
              <div
                key={complex.name}
                className="flex items-center gap-3 rounded-[12px] bg-white p-3"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold text-secondary">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary truncate">
                    {complex.name}
                  </p>
                  <p className="text-xs text-secondary">
                    {complex.dealCount}건 | {complex.latestDealDate}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-primary">
                  {formatToKoreanWon(complex.averagePrice)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 점수 breakdown */}
      <div>
        <p className="text-sm font-semibold text-primary mb-3">종합 평가</p>
        <div className="flex flex-col gap-2.5">
          <ScoreBar label="거래활발" score={scores.activity} />
          <ScoreBar label="가격안정" score={scores.stability} />
          <ScoreBar label="가성비" score={scores.value} />
        </div>
      </div>
    </Card>
  );
}
