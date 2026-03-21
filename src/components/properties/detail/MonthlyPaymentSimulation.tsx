"use client";

import { useState, useMemo } from "react";
import { Card, Toggle } from "@/components/common";
import { formatToKoreanWon } from "@/lib/utils/format";
import {
  calculateMonthlyPayment,
  calculateMonthlyPaymentEqualPrincipal,
} from "@/lib/calculation";

interface MonthlyPaymentSimulationProps {
  requiredLoan: number;
  loanTermYears: number;
  annualIncome: number;
  defaultRate?: number;
  defaultRepaymentType?: "equal_payment" | "equal_principal";
}

export default function MonthlyPaymentSimulation({
  requiredLoan,
  loanTermYears,
  annualIncome,
  defaultRate = 4.0,
  defaultRepaymentType = "equal_payment",
}: MonthlyPaymentSimulationProps) {
  const [rate, setRate] = useState(defaultRate);
  const [isEqualPrincipal, setIsEqualPrincipal] = useState(
    defaultRepaymentType === "equal_principal",
  );

  const simulation = useMemo(() => {
    const totalMonths = loanTermYears * 12;
    const monthlyRate = rate / 100 / 12;

    let monthlyPayment: number;
    let totalInterest: number;

    if (isEqualPrincipal) {
      // 원금균등: 첫 달 상환액 (표시용), 총이자는 정확 계산
      monthlyPayment = calculateMonthlyPaymentEqualPrincipal(
        requiredLoan,
        rate,
        loanTermYears,
      );
      // 원금균등 총이자 = 월이자율 × 원금 × (총개월수 + 1) / 2
      totalInterest =
        rate === 0
          ? 0
          : Math.round(monthlyRate * requiredLoan * (totalMonths + 1) / 2);
    } else {
      monthlyPayment = calculateMonthlyPayment(
        requiredLoan,
        rate,
        loanTermYears,
      );
      totalInterest = Math.round(monthlyPayment * totalMonths - requiredLoan);
    }

    const totalPayment = requiredLoan + totalInterest;
    const incomeRatio =
      annualIncome > 0
        ? Math.round((monthlyPayment * 12 * 100) / annualIncome)
        : 0;

    return {
      monthlyPayment: Math.round(monthlyPayment),
      totalPayment,
      totalInterest,
      incomeRatio,
    };
  }, [requiredLoan, rate, loanTermYears, isEqualPrincipal, annualIncome]);

  const incomeBarColor =
    simulation.incomeRatio <= 40
      ? "bg-success"
      : simulation.incomeRatio <= 50
        ? "bg-warning"
        : "bg-danger";

  return (
    <Card title="월 상환 시뮬레이션">
      <div className="flex flex-col gap-5">
        <p className="text-sm text-secondary">
          대출 원금:{" "}
          <span className="font-semibold text-primary">
            {formatToKoreanWon(requiredLoan)}
          </span>
        </p>

        {/* 금리 슬라이더 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-secondary">금리</span>
            <span className="text-xl font-bold text-accent">
              {rate.toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min="2.0"
            max="8.0"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-accent [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-md"
            aria-label="금리 조절"
          />
          <div className="flex justify-between text-xs text-secondary">
            <span>2.0%</span>
            <span>8.0%</span>
          </div>
        </div>

        {/* 상환 방식 토글 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-secondary">상환 방식</span>
          <div className="flex items-center gap-2">
            <span
              className={`text-sm ${!isEqualPrincipal ? "font-semibold text-primary" : "text-secondary"}`}
            >
              원리금균등
            </span>
            <Toggle
              checked={isEqualPrincipal}
              onChange={setIsEqualPrincipal}
            />
            <span
              className={`text-sm ${isEqualPrincipal ? "font-semibold text-primary" : "text-secondary"}`}
            >
              원금균등
            </span>
          </div>
        </div>

        {/* 결과 */}
        <div className="rounded-[12px] bg-surface p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-base text-secondary">월 상환액</span>
              <span className="text-2xl font-bold text-primary">
                {formatToKoreanWon(simulation.monthlyPayment)}
              </span>
            </div>
            <div className="border-t border-border" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">총 상환액</span>
              <span className="text-sm font-semibold text-primary">
                {formatToKoreanWon(simulation.totalPayment)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">총 이자</span>
              <span className="text-sm font-semibold text-warning">
                {formatToKoreanWon(simulation.totalInterest)}
              </span>
            </div>
          </div>
        </div>

        {/* 소득 대비 부담률 */}
        {annualIncome > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">소득 대비 부담률</span>
              <span
                className={`text-sm font-semibold ${
                  simulation.incomeRatio <= 40
                    ? "text-success"
                    : simulation.incomeRatio <= 50
                      ? "text-warning"
                      : "text-danger"
                }`}
              >
                {simulation.incomeRatio}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-border/50">
              <div
                className={`h-full rounded-full transition-all duration-300 ${incomeBarColor}`}
                style={{
                  width: `${Math.min(simulation.incomeRatio, 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-secondary">
              ※ 40% 이하 권장
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
