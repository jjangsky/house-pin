"use client";

import { useState, useMemo } from "react";
import { useHousePinStore } from "@/store/useHousePinStore";
import { Badge } from "@/components/common";
import { checkAllPolicyBenefits } from "@/lib/calculation/policyBenefit";
import { formatWon, formatToKoreanWon } from "@/lib/utils/format";
import type { PolicyBenefit, PolicyBenefitInput } from "@/types/policyBenefit";

export default function PolicyBenefitContent() {
  const assetInput = useHousePinStore((s) => s.assetInput);
  const loanResult = useHousePinStore((s) => s.loanResult);
  const [showIneligible, setShowIneligible] = useState(false);

  const benefitResult = useMemo(() => {
    if (!loanResult) return null;

    const input: PolicyBenefitInput = {
      annualIncome: assetInput.annualIncome,
      numberOfHomes: assetInput.numberOfHomes,
      isFirstTimeBuyer: assetInput.isFirstTimeBuyer,
      isNewlywed: assetInput.isNewlywed,
      hasChildren: false,
      age: 30,
      purchasePrice: loanResult.affordablePrice,
      transactionType: assetInput.transactionType,
    };

    return checkAllPolicyBenefits(input);
  }, [assetInput, loanResult]);

  if (!benefitResult) return null;

  const { eligible, ineligible, totalMonthlySavings, bestLoan } = benefitResult;

  return (
    <>
      {/* 요약 */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-secondary">받을 수 있는 혜택</span>
          {eligible.length > 0 && (
            <Badge variant="success">{eligible.length}개</Badge>
          )}
        </div>
        {totalMonthlySavings > 0 && (
          <p className="mt-1 text-sm text-secondary">
            최대{" "}
            <span className="font-semibold text-success">
              월 {formatWon(totalMonthlySavings)}
            </span>{" "}
            절약 가능
          </p>
        )}
      </div>

      {/* 자격 충족 혜택 목록 */}
      {eligible.length > 0 ? (
        <div className="flex flex-col gap-3">
          {eligible.map((benefit) => (
            <BenefitItem
              key={benefit.name}
              benefit={benefit}
              isBest={bestLoan?.name === benefit.name}
            />
          ))}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-secondary">
          현재 조건으로 해당하는 정책 혜택이 없어요
        </p>
      )}

      {/* 미자격 혜택 접기/펼치기 */}
      {ineligible.length > 0 && (
        <div className="mt-5">
          <button
            type="button"
            className="w-full text-center text-sm text-secondary hover:text-primary transition-colors"
            onClick={() => setShowIneligible(!showIneligible)}
          >
            {showIneligible
              ? "미자격 혜택 접기"
              : `미자격 혜택 ${ineligible.length}개 보기`}
          </button>

          {showIneligible && (
            <div className="mt-3 flex flex-col gap-2">
              {ineligible.map((benefit) => (
                <div
                  key={benefit.name}
                  className="rounded-[12px] border border-border bg-white p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary">
                      {benefit.name}
                    </span>
                    <Badge variant="danger">미자격</Badge>
                  </div>
                  <p className="mt-1 text-xs text-secondary">{benefit.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ──────────────────────────────────────────────
// 개별 혜택 아이템
// ──────────────────────────────────────────────

interface BenefitItemProps {
  benefit: PolicyBenefit;
  isBest: boolean;
}

function BenefitItem({ benefit, isBest }: BenefitItemProps) {
  const isLoan = benefit.category === "loan";

  return (
    <div
      className={`rounded-[12px] border p-4 ${
        isBest ? "border-accent bg-accent-light" : "border-border"
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="text-base font-semibold text-primary">
          {benefit.name}
        </span>
        {isBest && <Badge variant="info">최적</Badge>}
        {benefit.category === "tax" && <Badge variant="warning">세금 감면</Badge>}
      </div>

      <p className="mb-3 text-xs text-secondary">{benefit.reason}</p>

      {isLoan && benefit.maxLoanAmount > 0 && (
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span className="text-secondary">금리</span>
            <span className="font-semibold text-primary">
              {benefit.interestRate.min}% ~ {benefit.interestRate.max}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary">최대 한도</span>
            <span className="font-semibold text-primary">
              {formatToKoreanWon(benefit.maxLoanAmount)}
            </span>
          </div>
        </div>
      )}

      {(benefit.monthlySavings ?? 0) > 0 && (
        <p className="mt-3 text-xs text-success">
          {isLoan
            ? `시중 금리 대비 월 약 ${formatWon(benefit.monthlySavings!)} 절약`
            : `최대 ${formatToKoreanWon(benefit.monthlySavings!)} 감면`}
        </p>
      )}
    </div>
  );
}
