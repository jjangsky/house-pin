"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/common";
import { useHousePinStore } from "@/store/useHousePinStore";
import { buildRegionalAnalytics } from "@/lib/calculation/analytics";

import AnalyticsSummaryCard from "@/components/analytics/AnalyticsSummaryCard";
import PriceDistributionChart from "@/components/analytics/PriceDistributionChart";
import DongPriceTable from "@/components/analytics/DongPriceTable";
import AskingVsDealChart from "@/components/analytics/AskingVsDealChart";

export default function AnalyticsPage() {
  const router = useRouter();
  const properties = useHousePinStore((s) => s.properties);
  const liveListings = useHousePinStore((s) => s.liveListings);
  const loanResult = useHousePinStore((s) => s.loanResult);
  const selectedRegions = useHousePinStore((s) => s.selectedRegions);

  const affordablePrice = loanResult?.affordablePrice ?? 0;

  // 가드
  if (!loanResult || properties.length === 0) {
    return (
      <main className="flex flex-col items-center justify-center py-24">
        <p className="text-lg font-semibold text-primary">
          매물 데이터가 필요합니다
        </p>
        <p className="mt-2 text-sm text-secondary">
          먼저 매물을 검색해주세요
        </p>
        <Button
          variant="primary"
          size="md"
          className="mt-6"
          onClick={() => router.push("/properties")}
        >
          매물 검색하기
        </Button>
      </main>
    );
  }

  const analytics = useMemo(
    () => buildRegionalAnalytics(properties, liveListings),
    [properties, liveListings],
  );

  const regionNames = selectedRegions.map((r) => r.sigungu).join(" · ");

  return (
    <main className="pb-12">
      {/* 헤더 */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-[10px] text-secondary transition-colors hover:bg-surface active:bg-border"
          aria-label="뒤로가기"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M12.5 15L7.5 10L12.5 5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-primary">지역 시세 분석</h2>
      </div>

      {/* 지역명 */}
      {regionNames && (
        <p className="mb-6 text-sm text-secondary">{regionNames}</p>
      )}

      {/* 섹션들 */}
      <div className="flex flex-col gap-6">
        <AnalyticsSummaryCard summary={analytics.summary} />

        <PriceDistributionChart
          buckets={analytics.priceDistribution}
          affordablePrice={affordablePrice}
        />

        <DongPriceTable
          summaries={analytics.dongSummaries}
          affordablePrice={affordablePrice}
        />

        {analytics.askingVsDeal && (
          <AskingVsDealChart comparison={analytics.askingVsDeal} />
        )}
      </div>

      {/* 하단 */}
      <div className="mt-10">
        <Button
          variant="ghost"
          fullWidth
          size="md"
          onClick={() => router.push("/properties")}
        >
          매물 목록으로 돌아가기
        </Button>
      </div>
    </main>
  );
}
