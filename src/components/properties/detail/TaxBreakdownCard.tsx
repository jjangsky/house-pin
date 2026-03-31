"use client";

import { useMemo } from "react";
import { Card, DataRow } from "@/components/common";
import { formatWon } from "@/lib/utils/format";
import { calculateTotalInitialCost } from "@/lib/calculation/tax";

interface TaxBreakdownCardProps {
  purchasePrice: number;
  numberOfHomes: number;
}

export default function TaxBreakdownCard({
  purchasePrice,
  numberOfHomes,
}: TaxBreakdownCardProps) {
  const result = useMemo(
    () =>
      calculateTotalInitialCost({
        purchasePrice,
        numberOfHomes: numberOfHomes + 1, // 구매 후 기준
        regionType: "nonRegulated",
      }),
    [purchasePrice, numberOfHomes],
  );

  const { acquisitionTax, brokerageFee, registrationCost } = result;

  const homeLabel =
    acquisitionTax.homeCategory === "1주택"
      ? "1주택"
      : acquisitionTax.homeCategory === "2주택_비조정"
        ? "2주택"
        : acquisitionTax.homeCategory === "2주택_조정"
          ? "2주택(조정)"
          : "3주택이상";

  return (
    <Card title="매매 부대비용">
      <div className="flex flex-col gap-4">
        {/* 총 초기비용 히어로 */}
        <div className="rounded-[12px] bg-surface px-4 py-5 text-center">
          <p className="text-2xl font-bold text-accent">
            {formatWon(result.totalUpfront)}
          </p>
          <p className="mt-1 text-xs text-secondary">
            매매가 외 추가 필요금액
          </p>
        </div>

        {/* 취득세 */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-primary">취득세</p>
          <div className="flex flex-col gap-1.5 pl-2">
            <DataRow
              label={`기본 취득세 (${(acquisitionTax.baseRate * 100).toFixed(1)}%)`}
              value={acquisitionTax.baseTax}
            />
            <DataRow label="농어촌특별세" value={acquisitionTax.ruralTax} />
            <DataRow label="지방교육세" value={acquisitionTax.localEducationTax} />
          </div>
          <div className="flex items-center justify-between pl-2">
            <span className="text-sm font-bold text-primary">소계</span>
            <span className="text-sm font-bold text-primary">
              {formatWon(acquisitionTax.totalAcquisitionTax)}
            </span>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* 중개수수료 */}
        <DataRow
          label={`중개수수료 (${(brokerageFee.feeRate * 100).toFixed(1)}%)`}
          value={brokerageFee.brokerageFee}
          bold
        />

        <div className="border-t border-border" />

        {/* 등기비용 */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-primary">등기비용</p>
          <div className="flex flex-col gap-1.5 pl-2">
            <DataRow label="등록면허세" value={registrationCost.registrationTax} />
            <DataRow
              label="지방교육세"
              value={registrationCost.localEducationTax}
            />
            <DataRow label="인지세" value={registrationCost.stampTax} />
            <DataRow label="법무사 수수료" value={registrationCost.lawyerFee} />
          </div>
          <div className="flex items-center justify-between pl-2">
            <span className="text-sm font-bold text-primary">소계</span>
            <span className="text-sm font-bold text-primary">
              {formatWon(registrationCost.totalRegistrationCost)}
            </span>
          </div>
        </div>

        {/* 실제 필요 총액 */}
        <div className="border-t-2 border-primary/10 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-primary">
              실제 필요 총액
            </span>
            <span className="text-lg font-bold text-primary">
              {formatWon(result.totalRequired)}
            </span>
          </div>
          <p className="mt-2 text-xs text-secondary">
            {homeLabel} 기준 · 비조정지역
          </p>
        </div>
      </div>
    </Card>
  );
}
