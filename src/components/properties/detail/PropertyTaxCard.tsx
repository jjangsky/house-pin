"use client";

import { useMemo } from "react";
import { Card } from "@/components/common";
import { formatToKoreanWon } from "@/lib/utils/format";
import { calculatePropertyTax } from "@/lib/calculation/tax";

interface PropertyTaxCardProps {
  purchasePrice: number;
}

export default function PropertyTaxCard({
  purchasePrice,
}: PropertyTaxCardProps) {
  const result = useMemo(
    () => calculatePropertyTax(purchasePrice),
    [purchasePrice],
  );

  return (
    <Card title="예상 보유세 (연간)">
      <div className="flex flex-col gap-4">
        {/* 히어로 */}
        <p className="text-primary">
          <span className="text-xl font-bold">
            연간 약 {formatToKoreanWon(Math.round(result.totalAnnualHoldingTax))}
          </span>
          <span className="mx-2 text-border">·</span>
          <span className="text-base text-secondary">
            월 약 {formatToKoreanWon(Math.round(result.monthlyPropertyTax))}
          </span>
        </p>

        {/* 항목별 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-secondary">재산세</span>
            <span className="text-sm font-semibold text-primary">
              {formatToKoreanWon(Math.round(result.annualPropertyTax))}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-secondary">도시지역분</span>
            <span className="text-sm font-semibold text-primary">
              {formatToKoreanWon(Math.round(result.urbanTax))}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-secondary">지방교육세</span>
            <span className="text-sm font-semibold text-primary">
              {formatToKoreanWon(Math.round(result.localEducationTax))}
            </span>
          </div>
        </div>

        {/* 안내 */}
        <p className="text-xs text-secondary">
          공시가격 추정치 기반 (실제와 다를 수 있음)
        </p>
      </div>
    </Card>
  );
}
