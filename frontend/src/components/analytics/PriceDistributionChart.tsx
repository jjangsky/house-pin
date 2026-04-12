"use client";

import { Card } from "@/components/common";
import { formatToKoreanWon } from "@/lib/utils/format";
import type { PriceBucket } from "@/types/analytics";

interface PriceDistributionChartProps {
  buckets: PriceBucket[];
  affordablePrice: number;
}

export default function PriceDistributionChart({
  buckets,
  affordablePrice,
}: PriceDistributionChartProps) {
  if (buckets.length === 0) return null;

  const maxCount = Math.max(...buckets.map((b) => b.count));

  // 내 구매력이 어느 구간에 있는지
  const myBucketIndex = buckets.findIndex(
    (b) => affordablePrice >= b.min && affordablePrice < b.max,
  );

  return (
    <Card title="가격대별 매물 분포">
      <div className="flex flex-col gap-4">
        {/* 히스토그램 */}
        <div className="flex items-end gap-1" style={{ height: 140 }}>
          {buckets.map((bucket, i) => {
            const height =
              maxCount > 0 ? (bucket.count / maxCount) * 100 : 0;
            const isMyBucket = i === myBucketIndex;

            return (
              <div
                key={bucket.label}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <span className="text-[10px] text-secondary">
                  {bucket.count}
                </span>
                <div
                  className={`w-full rounded-t-[4px] transition-all ${
                    isMyBucket ? "bg-accent" : "bg-accent/30"
                  }`}
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* X축 라벨 */}
        <div className="flex gap-1">
          {buckets.map((bucket) => (
            <div
              key={bucket.label}
              className="flex-1 text-center text-[10px] text-secondary"
            >
              {bucket.label}
            </div>
          ))}
        </div>

        {/* 내 구매력 위치 */}
        <div className="rounded-[10px] bg-surface px-3 py-2 text-center">
          <p className="text-sm text-secondary">
            내 구매력{" "}
            <span className="font-semibold text-accent">
              {formatToKoreanWon(affordablePrice)}
            </span>
          </p>
        </div>
      </div>
    </Card>
  );
}
