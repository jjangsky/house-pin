"use client";

import { useState } from "react";
import { Card } from "@/components/common";
import { formatToKoreanWon } from "@/lib/utils/format";
import type { DongPriceSummary } from "@/types/analytics";

interface DongPriceTableProps {
  summaries: DongPriceSummary[];
  affordablePrice: number;
}

type SortKey = "price" | "count";

export default function DongPriceTable({
  summaries,
  affordablePrice,
}: DongPriceTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("count");

  if (summaries.length === 0) return null;

  const sorted = [...summaries].sort((a, b) =>
    sortKey === "price"
      ? b.avgDealPrice - a.avgDealPrice
      : b.dealCount - a.dealCount,
  );

  return (
    <Card title="동별 평균 시세">
      <div className="flex flex-col gap-3">
        {/* 정렬 토글 */}
        <div className="flex gap-2">
          <button
            onClick={() => setSortKey("count")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              sortKey === "count"
                ? "bg-primary text-white"
                : "bg-surface text-secondary"
            }`}
          >
            건수순
          </button>
          <button
            onClick={() => setSortKey("price")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              sortKey === "price"
                ? "bg-primary text-white"
                : "bg-surface text-secondary"
            }`}
          >
            가격순
          </button>
        </div>

        {/* 테이블 */}
        <div className="flex flex-col divide-y divide-border">
          {sorted.map((dong) => {
            const isAffordable = dong.avgDealPrice <= affordablePrice;
            return (
              <div
                key={dong.dongName}
                className="flex items-center justify-between py-2.5"
              >
                <div className="flex flex-col gap-0.5">
                  <span
                    className={`text-sm font-semibold ${isAffordable ? "text-accent" : "text-primary"}`}
                  >
                    {dong.dongName}
                  </span>
                  <span className="text-xs text-secondary">
                    {dong.dealCount}건
                    {dong.listingCount > 0 && ` · 매물 ${dong.listingCount}건`}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-sm font-semibold text-primary">
                    {formatToKoreanWon(dong.avgDealPrice)}
                  </span>
                  {dong.avgAskingPrice && (
                    <span className="text-xs text-secondary">
                      호가 {formatToKoreanWon(dong.avgAskingPrice)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
