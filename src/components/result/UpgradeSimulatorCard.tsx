"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, Input, Toggle, Button, Badge } from "@/components/common";
import { formatToKoreanWon } from "@/lib/utils/format";
import { simulateUpgrade } from "@/lib/calculation/upgradeSimulator";
import type { UpgradeInput } from "@/types/upgrade";

const LOAN_TERM_OPTIONS = [
  { value: 20, label: "20년" },
  { value: 30, label: "30년" },
  { value: 40, label: "40년" },
] as const;

const DEFAULT_INPUT: UpgradeInput = {
  currentHomePrice: 0,
  currentLoanBalance: 0,
  holdingPeriodYears: 5,
  isActualResidence: true,
  purchasedPrice: 0,
  isRegulatedArea: false,
  annualIncome: 0,
  existingLoanPayment: 0,
  additionalCash: 0,
  loanTermYears: 30,
  repaymentType: "equal_payment",
};

export default function UpgradeSimulatorCard() {
  const [input, setInput] = useState<UpgradeInput>(DEFAULT_INPUT);
  const [isCalculated, setIsCalculated] = useState(false);

  const updateField = useCallback(
    <K extends keyof UpgradeInput>(key: K, value: UpgradeInput[K]) => {
      setInput((prev) => ({ ...prev, [key]: value }));
      setIsCalculated(false);
    },
    [],
  );

  const handleNumberChange = useCallback(
    (key: keyof UpgradeInput) => (raw: string) => {
      updateField(key, Number(raw) || 0);
    },
    [updateField],
  );

  const isInputValid =
    input.currentHomePrice > 0 &&
    input.purchasedPrice > 0 &&
    input.annualIncome > 0;

  const result = useMemo(() => {
    if (!isCalculated || !isInputValid) return null;
    return simulateUpgrade(input);
  }, [input, isCalculated, isInputValid]);

  const handleCalculate = useCallback(() => {
    if (isInputValid) {
      setIsCalculated(true);
    }
  }, [isInputValid]);

  return (
    <Card title="갈아타기 시뮬레이터">
      <div className="flex flex-col gap-5">
        <p className="text-sm text-secondary">
          현재 집을 팔고 새 집을 살 때, 실수령액과 구매력을 계산해드려요
        </p>

        {/* 현재 주택 정보 */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-primary">현재 보유 주택</p>

          <Input
            label="현재 집 예상 매도가"
            type="number"
            suffix="만원"
            placeholder="80,000"
            value={String(input.currentHomePrice || "")}
            onValueChange={handleNumberChange("currentHomePrice")}
          />

          <Input
            label="매입 당시 가격"
            type="number"
            suffix="만원"
            placeholder="60,000"
            value={String(input.purchasedPrice || "")}
            onValueChange={handleNumberChange("purchasedPrice")}
          />

          <Input
            label="현재 대출 잔액"
            type="number"
            suffix="만원"
            placeholder="20,000"
            value={String(input.currentLoanBalance || "")}
            onValueChange={handleNumberChange("currentLoanBalance")}
          />

          <Input
            label="보유 기간"
            type="number"
            suffix="년"
            placeholder="5"
            value={String(input.holdingPeriodYears || "")}
            onValueChange={handleNumberChange("holdingPeriodYears")}
          />

          <div className="flex items-center justify-between">
            <Toggle
              label="실거주 2년 이상"
              checked={input.isActualResidence}
              onChange={(checked) => updateField("isActualResidence", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Toggle
              label="조정대상지역"
              checked={input.isRegulatedArea}
              onChange={(checked) => updateField("isRegulatedArea", checked)}
            />
          </div>
        </div>

        <div className="border-t border-border" />

        {/* 새 주택 조건 */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-primary">새 주택 조건</p>

          <Input
            label="연소득"
            type="number"
            suffix="만원"
            placeholder="8,000"
            value={String(input.annualIncome || "")}
            onValueChange={handleNumberChange("annualIncome")}
          />

          <Input
            label="추가 투입 가능 현금"
            type="number"
            suffix="만원"
            placeholder="5,000"
            value={String(input.additionalCash || "")}
            onValueChange={handleNumberChange("additionalCash")}
          />

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary">대출 기간</span>
            <div className="flex gap-1.5">
              {LOAN_TERM_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateField("loanTermYears", opt.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    input.loanTermYears === opt.value
                      ? "bg-accent text-white"
                      : "bg-surface text-secondary hover:text-primary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary">상환 방식</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => updateField("repaymentType", "equal_payment")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  input.repaymentType === "equal_payment"
                    ? "bg-accent text-white"
                    : "bg-surface text-secondary hover:text-primary"
                }`}
              >
                원리금균등
              </button>
              <button
                type="button"
                onClick={() => updateField("repaymentType", "equal_principal")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  input.repaymentType === "equal_principal"
                    ? "bg-accent text-white"
                    : "bg-surface text-secondary hover:text-primary"
                }`}
              >
                원금균등
              </button>
            </div>
          </div>
        </div>

        {/* 계산 버튼 */}
        <Button
          fullWidth
          size="lg"
          onClick={handleCalculate}
          disabled={!isInputValid}
        >
          갈아타기 계산하기
        </Button>

        {/* 결과 */}
        {result && (
          <>
            <div className="border-t border-border" />

            {/* 매도 정산 */}
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-primary">매도 정산</p>

              <div className="rounded-[12px] bg-surface p-4">
                <div className="flex flex-col gap-2">
                  <ResultRow label="매도가" value={result.saleProceeds.salePrice} />
                  <ResultRow
                    label="중개수수료"
                    value={-result.saleProceeds.brokerageFee}
                    negative
                  />
                  <ResultRow
                    label="양도소득세"
                    value={-result.saleProceeds.capitalGainsTax}
                    negative
                  />
                  <ResultRow
                    label="대출 상환"
                    value={-result.saleProceeds.loanRepayment}
                    negative
                  />
                  <div className="border-t border-border pt-2">
                    <ResultRow
                      label="실수령액"
                      value={result.saleProceeds.netProceeds}
                      bold
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 양도세 상세 */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-primary">양도세 상세</p>
                <Badge
                  variant={
                    result.capitalGainsTaxDetail.isExempt ? "success" : "warning"
                  }
                >
                  {result.capitalGainsTaxDetail.isExempt ? "비과세" : "과세"}
                </Badge>
              </div>

              <div className="rounded-[12px] bg-surface p-4">
                <div className="flex flex-col gap-2">
                  <ResultRow
                    label="양도차익"
                    value={result.capitalGainsTaxDetail.gain}
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary">비과세 판정</span>
                    <span className="text-right text-xs text-secondary">
                      {result.capitalGainsTaxDetail.exemptReason}
                    </span>
                  </div>
                  {result.capitalGainsTaxDetail.longTermDeductionRate > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary">
                        장기보유공제 (
                        {Math.round(
                          result.capitalGainsTaxDetail.longTermDeductionRate * 100,
                        )}
                        %)
                      </span>
                      <span className="text-primary">
                        -
                        {formatToKoreanWon(
                          result.capitalGainsTaxDetail.longTermDeduction,
                        )}
                      </span>
                    </div>
                  )}
                  {result.capitalGainsTaxDetail.taxRate > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary">실효세율</span>
                      <span className="text-primary">
                        {result.capitalGainsTaxDetail.taxRate}%
                      </span>
                    </div>
                  )}
                  <div className="border-t border-border pt-2">
                    <ResultRow
                      label="양도세액"
                      value={result.capitalGainsTaxDetail.taxAmount}
                      bold
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 새 구매력 히어로 */}
            <div className="rounded-[12px] bg-accent-light px-4 py-5 text-center">
              <p className="text-xs font-medium text-accent">새 집 구매 가능 금액</p>
              <p className="mt-1 text-2xl font-bold text-accent">
                {formatToKoreanWon(result.newPurchasingPower.totalBudget)}
              </p>
              <div className="mt-3 flex justify-center gap-4 text-xs text-secondary">
                <span>
                  자기자본{" "}
                  {formatToKoreanWon(result.newPurchasingPower.ownCapital)}
                </span>
                <span>+</span>
                <span>
                  대출{" "}
                  {formatToKoreanWon(result.newPurchasingPower.maxLoanAmount)}
                </span>
              </div>
              <p className="mt-2 text-xs text-secondary">
                월 상환액{" "}
                <span className="font-semibold text-primary">
                  {formatToKoreanWon(result.newPurchasingPower.monthlyPayment)}
                </span>
              </p>
            </div>

            {/* 경고 */}
            {result.warnings.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-primary">참고사항</p>
                <div className="rounded-[12px] bg-warning-light p-4">
                  <ul className="flex flex-col gap-1.5">
                    {result.warnings.map((warning, i) => (
                      <li
                        key={i}
                        className="text-xs leading-relaxed text-warning"
                      >
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* 전제 조건 */}
            <p className="text-[11px] leading-relaxed text-secondary">
              * 시장금리 4.0% 기준 · LTV/DSR 규제 반영 · 양도세는 1세대 1주택
              기준 간이 계산 · 실제 세액은 세무사 상담을 권장합니다
            </p>
          </>
        )}
      </div>
    </Card>
  );
}

// =============================================================================
// 내부 컴포넌트
// =============================================================================

function ResultRow({
  label,
  value,
  negative = false,
  bold = false,
}: {
  label: string;
  value: number;
  negative?: boolean;
  bold?: boolean;
}) {
  const textColor = negative
    ? "text-danger"
    : bold
      ? "text-primary"
      : "text-primary";
  const fontWeight = bold ? "font-bold" : "font-medium";

  return (
    <div className="flex items-center justify-between text-sm">
      <span className={bold ? "font-semibold text-primary" : "text-secondary"}>
        {label}
      </span>
      <span className={`${textColor} ${fontWeight}`}>
        {negative && value !== 0 ? "-" : ""}
        {formatToKoreanWon(Math.abs(value))}
      </span>
    </div>
  );
}
