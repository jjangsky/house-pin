"use client";

import { useMemo } from "react";
import { Card, Badge } from "@/components/common";
import { formatToKoreanWon } from "@/lib/utils/format";
import {
  calculatePropertyAffordability,
  getAffordabilityMessage,
} from "@/lib/calculation/affordability";
import type { AssetInput, LoanResult, Property } from "@/types";

interface AffordabilityAnalysisProps {
  property: Property;
  assetInput: AssetInput;
  loanResult: LoanResult;
}

export default function AffordabilityAnalysis({
  property,
  assetInput,
  loanResult,
}: AffordabilityAnalysisProps) {
  const result = useMemo(
    () => calculatePropertyAffordability(property, assetInput, loanResult),
    [property, assetInput, loanResult],
  );

  const message = getAffordabilityMessage(result);

  return (
    <Card title="이 매물을 사려면">
      <div className="flex flex-col gap-4">
        {/* 매물 가격 */}
        <div className="flex items-center justify-between">
          <span className="text-base text-secondary">매물 가격</span>
          <span className="text-lg font-bold text-primary">
            {formatToKoreanWon(result.dealAmount)}
          </span>
        </div>

        <div className="border-t border-border" />

        {/* 자기자본 분석 */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-secondary">필요 자기자본</span>
            <span className="text-base font-semibold text-primary">
              {formatToKoreanWon(result.requiredOwnCapital)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-secondary">내 자기자본</span>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-primary">
                {formatToKoreanWon(assetInput.ownCapital)}
              </span>
              <Badge
                variant={result.ownCapitalDiff >= 0 ? "success" : "danger"}
              >
                {result.ownCapitalDiff >= 0 ? "여유" : "부족"}
              </Badge>
            </div>
          </div>
          {result.ownCapitalDiff < 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">
                자기자본 부족분
              </span>
              <span className="text-sm font-semibold text-danger">
                ▲ {formatToKoreanWon(Math.abs(result.ownCapitalDiff))}
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-border" />

        {/* 대출 분석 */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-secondary">필요 대출금</span>
            <span className="text-base font-semibold text-primary">
              {formatToKoreanWon(result.requiredLoan)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-secondary">내 대출 한도</span>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-primary">
                {formatToKoreanWon(loanResult.finalLoanLimit)}
              </span>
              <Badge
                variant={result.loanLimitDiff >= 0 ? "success" : "danger"}
              >
                {result.loanLimitDiff >= 0 ? "여유" : "초과"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* 종합 판정 */}
        <div
          className={`rounded-[12px] p-4 ${
            result.isAffordable ? "bg-success/5" : "bg-danger/5"
          }`}
        >
          <p
            className={`text-center text-base font-semibold ${
              result.isAffordable ? "text-success" : "text-danger"
            }`}
          >
            {message}
          </p>
        </div>
      </div>
    </Card>
  );
}
