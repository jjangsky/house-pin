import { Card } from "@/components/common";
import { formatToKoreanWon } from "@/lib/utils/format";
import type { AskingVsDealComparison } from "@/types/analytics";

interface AskingVsDealChartProps {
  comparison: AskingVsDealComparison;
}

function rateColor(rate: number): string {
  if (rate < 5) return "text-success";
  if (rate < 10) return "text-warning";
  return "text-danger";
}

export default function AskingVsDealChart({
  comparison,
}: AskingVsDealChartProps) {
  const maxVal = Math.max(comparison.avgDealPrice, comparison.avgAskingPrice);

  return (
    <Card title="호가 vs 실거래">
      <div className="flex flex-col gap-4">
        {/* 전체 평균 비교 */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">실거래</span>
              <span className="text-sm font-semibold text-primary">
                {formatToKoreanWon(comparison.avgDealPrice)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-accent/40"
                style={{
                  width: `${(comparison.avgDealPrice / maxVal) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">호가</span>
              <span className="text-sm font-semibold text-primary">
                {formatToKoreanWon(comparison.avgAskingPrice)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-accent"
                style={{
                  width: `${(comparison.avgAskingPrice / maxVal) * 100}%`,
                }}
              />
            </div>
          </div>
          <p className={`text-sm font-semibold ${rateColor(comparison.premiumRate)}`}>
            호가율 {comparison.premiumRate >= 0 ? "+" : ""}
            {comparison.premiumRate}%
          </p>
        </div>

        {/* 동별 호가율 */}
        {comparison.byDong.length > 0 && (
          <>
            <div className="border-t border-border" />
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-primary">동별 호가율</p>
              {comparison.byDong.map((dong) => (
                <div
                  key={dong.dongName}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-secondary">
                    {dong.dongName}
                  </span>
                  <span
                    className={`text-sm font-semibold ${rateColor(dong.premiumRate)}`}
                  >
                    {dong.premiumRate >= 0 ? "+" : ""}
                    {dong.premiumRate}%
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-secondary">
              호가율이 낮을수록 급매 가능성
            </p>
          </>
        )}
      </div>
    </Card>
  );
}
