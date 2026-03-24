"use client";

import { useState } from "react";
import { Card } from "@/components/common";
import { formatToKoreanWon } from "@/lib/utils/format";
import type { ComplexDetail } from "@/types/listing";

interface AreaPriceComparisonCardProps {
  priceComparison: ComplexDetail["priceComparison"];
  nearComplexes: ComplexDetail["nearComplexes"];
}

type PriceType = "trade" | "lease";

export default function AreaPriceComparisonCard({
  priceComparison,
  nearComplexes,
}: AreaPriceComparisonCardProps) {
  const [priceType, setPriceType] = useState<PriceType>("trade");

  if (priceComparison.length === 0) return null;

  const maxPrice = Math.max(
    ...priceComparison.map((p) =>
      priceType === "trade" ? p.tradePyeongPrice : p.leasePyeongPrice,
    ),
  );

  return (
    <Card title="시세 비교 (평당가)">
      <div className="flex flex-col gap-4">
        {/* 매매/전세 토글 */}
        <div className="flex gap-2">
          <button
            onClick={() => setPriceType("trade")}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              priceType === "trade"
                ? "bg-primary text-white"
                : "bg-surface text-secondary"
            }`}
          >
            매매
          </button>
          <button
            onClick={() => setPriceType("lease")}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              priceType === "lease"
                ? "bg-primary text-white"
                : "bg-surface text-secondary"
            }`}
          >
            전세
          </button>
        </div>

        {/* 막대 그래프 */}
        <div className="flex flex-col gap-3">
          {priceComparison.map((item) => {
            const value =
              priceType === "trade"
                ? item.tradePyeongPrice
                : item.leasePyeongPrice;
            const width = maxPrice > 0 ? (value / maxPrice) * 100 : 0;

            return (
              <div key={item.scope} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary">{item.scope}</span>
                  <span className="text-sm font-semibold text-primary">
                    {formatToKoreanWon(value)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-300"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* 인근 단지 비교 */}
        {nearComplexes.length > 0 && (
          <>
            <div className="border-t border-border" />
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-primary">인근 단지</p>
              {nearComplexes.slice(0, 5).map((nc) => (
                <div
                  key={nc.complexId}
                  className="flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="text-sm text-primary">{nc.name}</span>
                    <span className="text-xs text-secondary">{nc.desc}</span>
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    {formatToKoreanWon(nc.avgPyeongPrice)}/평
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
