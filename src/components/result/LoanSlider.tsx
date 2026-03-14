"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Card } from "@/components/common";
import { formatToKoreanWon } from "@/lib/utils/format";
import { calculateMonthlyPayment } from "@/lib/calculation";
import { useHousePinStore } from "@/store/useHousePinStore";

interface LoanSliderProps {
  onLoanAmountChange: (amount: number) => void;
}

export default function LoanSlider({ onLoanAmountChange }: LoanSliderProps) {
  const loanResult = useHousePinStore((s) => s.loanResult);
  const assetInput = useHousePinStore((s) => s.assetInput);

  const maxLoan = loanResult?.finalLoanLimit ?? 0;
  const [loanAmount, setLoanAmount] = useState(maxLoan);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // maxLoan이 바뀌면 슬라이더도 리셋
  useEffect(() => {
    setLoanAmount(maxLoan);
  }, [maxLoan]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = Number(e.target.value);
      // 100만원 단위로 스냅
      const snapped = Math.round(raw / 100) * 100;
      setLoanAmount(snapped);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onLoanAmountChange(snapped);
      }, 300);
    },
    [onLoanAmountChange],
  );

  // 정리
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (!loanResult || maxLoan <= 0) return null;

  const monthlyPayment = Math.round(
    calculateMonthlyPayment(loanAmount, 4.0, assetInput.loanTermYears),
  );

  // 슬라이더 진행률
  const progress = maxLoan > 0 ? (loanAmount / maxLoan) * 100 : 0;

  return (
    <Card>
      <h3 className="mb-1 text-lg font-semibold text-primary">
        대출 금액 조절
      </h3>
      <p className="mb-6 text-sm text-secondary">
        원하는 대출 금액을 조절해보세요
      </p>

      {/* 현재 금액 표시 */}
      <div className="mb-4 text-center">
        <p className="text-[28px] font-bold text-accent">
          {formatToKoreanWon(loanAmount)}
        </p>
      </div>

      {/* 슬라이더 */}
      <div className="relative mb-6 px-1">
        <input
          type="range"
          min={0}
          max={maxLoan}
          step={100}
          value={loanAmount}
          onChange={handleChange}
          aria-label="대출 금액 조절 슬라이더"
          aria-valuemin={0}
          aria-valuemax={maxLoan}
          aria-valuenow={loanAmount}
          aria-valuetext={formatToKoreanWon(loanAmount)}
          className="slider-input w-full"
          style={
            {
              "--progress": `${progress}%`,
            } as React.CSSProperties
          }
        />
        <div className="mt-2 flex justify-between text-xs text-secondary">
          <span>0원</span>
          <span>{formatToKoreanWon(maxLoan)}</span>
        </div>
      </div>

      {/* 월 상환액 */}
      <div className="rounded-[12px] bg-surface p-4 text-center">
        <p className="mb-1 text-sm text-secondary">예상 월 상환액</p>
        <p className="text-xl font-bold text-primary">
          {formatToKoreanWon(monthlyPayment)}
        </p>
      </div>
    </Card>
  );
}
