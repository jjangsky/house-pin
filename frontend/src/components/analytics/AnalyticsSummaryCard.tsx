import { Card } from "@/components/common";
import { formatToKoreanWon } from "@/lib/utils/format";
import type { RegionalAnalytics } from "@/types/analytics";

interface AnalyticsSummaryCardProps {
  summary: RegionalAnalytics["summary"];
}

export default function AnalyticsSummaryCard({
  summary,
}: AnalyticsSummaryCardProps) {
  return (
    <Card>
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-sm text-secondary">중간값</span>
          <span className="text-2xl font-bold text-accent">
            {formatToKoreanWon(summary.medianPrice)}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-secondary">
          <span>
            최저 {formatToKoreanWon(summary.minPrice)} ~ 최고{" "}
            {formatToKoreanWon(summary.maxPrice)}
          </span>
        </div>
        <div className="flex gap-4 text-sm">
          <span className="text-secondary">
            실거래{" "}
            <span className="font-semibold text-primary">
              {summary.totalDeals}
            </span>
            건
          </span>
          <span className="text-secondary">
            현재 매물{" "}
            <span className="font-semibold text-primary">
              {summary.totalListings}
            </span>
            건
          </span>
        </div>
      </div>
    </Card>
  );
}
