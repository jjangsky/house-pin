"use client";

import { useMemo } from "react";
import { Card, DataRow } from "@/components/common";
import { formatWon } from "@/lib/utils/format";
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
            연간 약 {formatWon(result.totalAnnualHoldingTax)}
          </span>
          <span className="mx-2 text-border">·</span>
          <span className="text-base text-secondary">
            월 약 {formatWon(result.monthlyPropertyTax)}
          </span>
        </p>

        {/* 항목별 */}
        <div className="flex flex-col gap-2">
          <DataRow label="재산세" value={result.annualPropertyTax} />
          <DataRow label="도시지역분" value={result.urbanTax} />
          <DataRow label="지방교육세" value={result.localEducationTax} />
        </div>

        {/* 안내 */}
        <p className="text-xs text-secondary">
          공시가격 추정치 기반 (실제와 다를 수 있음)
        </p>
      </div>
    </Card>
  );
}
