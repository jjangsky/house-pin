"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/common";
import { formatToKoreanWon } from "@/lib/utils/format";
import { compareJeonseVsBuy } from "@/lib/calculation/scenarioComparison";
import { DEFAULT_SCENARIO } from "@/constants/scenario";
import type { AssetInput, LoanResult } from "@/types";

interface ScenarioComparisonCardProps {
  assetInput: AssetInput;
  loanResult: LoanResult;
}

const YEAR_OPTIONS = [3, 5, 10] as const;

export default function ScenarioComparisonCard({
  assetInput,
  loanResult,
}: ScenarioComparisonCardProps) {
  const [comparisonYears, setComparisonYears] = useState<number>(
    DEFAULT_SCENARIO.comparisonYears,
  );
  const [priceGrowthRate, setPriceGrowthRate] = useState<number>(
    DEFAULT_SCENARIO.priceGrowthRate,
  );

  // 전세금을 구매력의 70%로 추정 (전세가율)
  const estimatedJeonse = Math.round(loanResult.affordablePrice * 0.7);
  const purchasePrice = loanResult.affordablePrice;

  const result = useMemo(
    () =>
      compareJeonseVsBuy({
        ownCapital: assetInput.ownCapital,
        annualIncome: assetInput.annualIncome,
        targetPrice: purchasePrice,
        comparisonYears,
        jeonseDeposit: estimatedJeonse,
        depositRate: DEFAULT_SCENARIO.depositRate,
        jeonseRenewalRate: DEFAULT_SCENARIO.jeonseRenewalRate,
        purchasePrice,
        loanAmount: loanResult.finalLoanLimit,
        mortgageRate: DEFAULT_SCENARIO.mortgageRate,
        loanTermYears: assetInput.loanTermYears,
        priceGrowthRate,
        numberOfHomes: assetInput.numberOfHomes + 1,
        regionType: "nonRegulated",
        area: 84, // 국민평형 기본값
      }),
    [
      assetInput,
      loanResult,
      comparisonYears,
      priceGrowthRate,
      estimatedJeonse,
      purchasePrice,
    ],
  );

  const isBuyBetter = result.comparison.betterOption === "buy";

  // 차트 최대값 계산
  const maxCumulative = Math.max(
    ...result.yearlyBreakdown.map((y) =>
      Math.max(Math.abs(y.jeonseCumulative), Math.abs(y.buyCumulative)),
    ),
    1,
  );

  return (
    <Card title="전세 vs 매매 비교">
      <div className="flex flex-col gap-5">
        {/* 결론 히어로 */}
        <div
          className={`rounded-[12px] px-4 py-5 text-center ${
            isBuyBetter ? "bg-accent-light" : "bg-success-light"
          }`}
        >
          <p
            className={`text-xs font-medium ${
              isBuyBetter ? "text-accent" : "text-success"
            }`}
          >
            {comparisonYears}년 기준 분석 결과
          </p>
          <p
            className={`mt-1 text-lg font-bold ${
              isBuyBetter ? "text-accent" : "text-success"
            }`}
          >
            {isBuyBetter ? "매매가 유리합니다" : "전세 유지가 유리합니다"}
          </p>
          <p className="mt-2 text-sm text-secondary">
            {isBuyBetter ? "매매" : "전세"} 시{" "}
            <span className="font-semibold text-primary">
              {formatToKoreanWon(result.comparison.savingsAmount)}
            </span>{" "}
            절약
          </p>
        </div>

        {/* 조건 조절 */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-secondary">비교 기간</span>
            <div className="flex gap-1.5">
              {YEAR_OPTIONS.map((y) => (
                <button
                  key={y}
                  onClick={() => setComparisonYears(y)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    comparisonYears === y
                      ? "bg-accent text-white"
                      : "bg-surface text-secondary hover:text-primary"
                  }`}
                >
                  {y}년
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-secondary">
              시세 상승률 연 {priceGrowthRate}%
            </span>
            <input
              type="range"
              min={0}
              max={10}
              step={0.5}
              value={priceGrowthRate}
              onChange={(e) => setPriceGrowthRate(Number(e.target.value))}
              className="h-1.5 w-28 cursor-pointer accent-accent"
            />
          </div>
        </div>

        <div className="border-t border-border" />

        {/* 비교 테이블 */}
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div />
          <div className="font-semibold text-success">전세 유지</div>
          <div className="font-semibold text-accent">매매 전환</div>

          <div className="text-left text-secondary">총 비용</div>
          <div className="font-medium text-primary">
            {formatToKoreanWon(result.jeonse.totalCost)}
          </div>
          <div className="font-medium text-primary">
            {formatToKoreanWon(result.buy.totalCost)}
          </div>

          <div className="text-left text-secondary">자산 형성</div>
          <div className="text-secondary">0원</div>
          <div className="font-medium text-accent">
            +{formatToKoreanWon(result.buy.assetFormed)}
          </div>

          <div className="text-left text-secondary">순비용</div>
          <div className="font-bold text-primary">
            {formatToKoreanWon(result.jeonse.netCost)}
          </div>
          <div className="font-bold text-primary">
            {formatToKoreanWon(Math.abs(result.buy.netCost))}
            {result.buy.netCost < 0 && (
              <span className="ml-1 text-xs text-success">이득</span>
            )}
          </div>
        </div>

        <div className="border-t border-border" />

        {/* 연도별 추이 바 차트 */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-primary">연도별 순비용 추이</p>
          <div className="flex flex-col gap-1.5">
            {result.yearlyBreakdown.map((row) => (
              <div key={row.year} className="flex items-center gap-2">
                <span className="w-6 text-right text-xs text-secondary">
                  {row.year}년
                </span>
                <div className="flex flex-1 flex-col gap-0.5">
                  <div className="flex h-2.5 items-center rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-success/60"
                      style={{
                        width: `${(Math.abs(row.jeonseCumulative) / maxCumulative) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="flex h-2.5 items-center rounded-full bg-surface">
                    <div
                      className={`h-full rounded-full ${
                        row.buyCumulative < 0
                          ? "bg-accent/60"
                          : "bg-accent/40"
                      }`}
                      style={{
                        width: `${(Math.abs(row.buyCumulative) / maxCumulative) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 text-[11px] text-secondary">
            <div className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-success/60" />
              전세
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-accent/60" />
              매매
            </div>
          </div>
        </div>

        {/* 손익분기점 */}
        {result.comparison.breakEvenYears !== null && (
          <>
            <div className="border-t border-border" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">손익분기점</span>
              <span className="text-sm font-semibold text-primary">
                {result.comparison.breakEvenYears}년 후
              </span>
            </div>
          </>
        )}

        {/* 월 부담 차이 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-secondary">매매 시 추가 월 부담</span>
          <span
            className={`text-sm font-semibold ${
              result.comparison.monthlyCostDiff > 0
                ? "text-danger"
                : "text-success"
            }`}
          >
            {result.comparison.monthlyCostDiff > 0 ? "+" : ""}
            {formatToKoreanWon(result.comparison.monthlyCostDiff)}/월
          </span>
        </div>

        {/* 전제 조건 */}
        <p className="text-[11px] leading-relaxed text-secondary">
          * 전세금 {formatToKoreanWon(estimatedJeonse)} (매매가 70%) 기준 ·
          예금금리 {DEFAULT_SCENARIO.depositRate}% · 전세 상승률{" "}
          {DEFAULT_SCENARIO.jeonseRenewalRate}%/년 · 대출금리{" "}
          {DEFAULT_SCENARIO.mortgageRate}% · 시세 상승률 {priceGrowthRate}%/년
        </p>
      </div>
    </Card>
  );
}
