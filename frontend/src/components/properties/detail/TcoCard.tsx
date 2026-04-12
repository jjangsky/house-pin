"use client";

import { useMemo } from "react";
import { Card, DataRow } from "@/components/common";
import { formatWon } from "@/lib/utils/format";
import { calculateTco } from "@/lib/calculation/tco";
import type { TcoInput } from "@/types/tax";

interface TcoCardProps {
  purchasePrice: number;
  numberOfHomes: number;
  area: number;
  monthlyLoanPayment: number;
  annualLoanInterest: number;
}

export default function TcoCard({
  purchasePrice,
  numberOfHomes,
  area,
  monthlyLoanPayment,
  annualLoanInterest,
}: TcoCardProps) {
  const tco = useMemo(() => {
    const input: TcoInput = {
      purchasePrice,
      numberOfHomes: numberOfHomes + 1,
      regionType: "non_regulated",
      area,
      monthlyLoanPayment,
      annualLoanInterest,
    };
    return calculateTco(input);
  }, [purchasePrice, numberOfHomes, area, monthlyLoanPayment, annualLoanInterest]);

  return (
    <Card title="진짜 비용 (첫 해 TCO)">
      <div className="flex flex-col gap-5">
        {/* 히어로: 첫 해 총 비용 */}
        <div className="rounded-[12px] bg-accent-light px-4 py-5 text-center">
          <p className="text-xs font-medium text-accent">첫 해 총 비용</p>
          <p className="mt-1 text-2xl font-bold text-accent">
            {formatWon(tco.firstYearTotal)}
          </p>
          <p className="mt-2 text-xs text-secondary">
            월 환산{" "}
            <span className="font-semibold text-primary">
              {formatWon(tco.monthlyRecurringTotal)}
            </span>
            {" "}(반복 비용 기준)
          </p>
        </div>

        {/* 1회성 비용 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-primary">1회성 비용</p>
            <span className="text-sm font-bold text-primary">
              {formatWon(tco.oneTimeCosts.total)}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <DataRow
              label="취득세 (부가세 포함)"
              value={tco.oneTimeCosts.acquisitionTax}
              sub
            />
            <DataRow
              label="등기비용"
              value={tco.oneTimeCosts.registrationCost}
              sub
            />
            <DataRow
              label="중개수수료"
              value={tco.oneTimeCosts.brokerageFee}
              sub
            />
            <DataRow
              label="이사비용 (추정)"
              value={tco.oneTimeCosts.movingCost}
              sub
            />
          </div>
        </div>

        <div className="border-t border-border" />

        {/* 매월 반복 비용 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-primary">매월 반복 비용</p>
            <span className="text-sm font-bold text-primary">
              {formatWon(tco.monthlyCosts.total)}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <DataRow
              label="대출 상환"
              value={tco.monthlyCosts.loanPayment}
              sub
            />
            <DataRow
              label="관리비 (추정)"
              value={tco.monthlyCosts.maintenanceFee}
              sub
            />
            <DataRow
              label="보유세 (월 환산)"
              value={tco.monthlyCosts.holdingTax}
              sub
            />
          </div>
        </div>

        {/* 시각 비율 바 */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-secondary">월 비용 구성</p>
          <div className="flex h-3 overflow-hidden rounded-full">
            {tco.monthlyCosts.total > 0 && (
              <>
                <div
                  className="bg-accent"
                  style={{
                    width: `${(tco.monthlyCosts.loanPayment / tco.monthlyCosts.total) * 100}%`,
                  }}
                />
                <div
                  className="bg-warning"
                  style={{
                    width: `${(tco.monthlyCosts.maintenanceFee / tco.monthlyCosts.total) * 100}%`,
                  }}
                />
                <div
                  className="bg-secondary/40"
                  style={{
                    width: `${(tco.monthlyCosts.holdingTax / tco.monthlyCosts.total) * 100}%`,
                  }}
                />
              </>
            )}
          </div>
          <div className="flex gap-4 text-[11px] text-secondary">
            <div className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-accent" />
              대출
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-warning" />
              관리비
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-secondary/40" />
              보유세
            </div>
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-secondary">
          * 관리비·이사비는 면적 기반 추정치이며, 실제와 다를 수 있습니다.
          보유세는 공시가격 추정치 기반입니다.
        </p>
      </div>
    </Card>
  );
}
