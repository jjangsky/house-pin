"use client";

import { useHousePinStore } from "@/store/useHousePinStore";
import { Badge } from "@/components/common";
import { POLICY_LOANS } from "@/constants/policy";
import { formatToKoreanWon } from "@/lib/utils/format";

interface PolicyLoanInfo {
  key: "didimdol" | "bogeumjari" | "batimok";
  name: string;
  rates: { min: number; max: number };
  maxLoan: number;
}

const POLICY_LOAN_LIST: PolicyLoanInfo[] = [
  {
    key: "didimdol",
    name: POLICY_LOANS.didimdol.name,
    rates: POLICY_LOANS.didimdol.rates,
    maxLoan: POLICY_LOANS.didimdol.maxLoan,
  },
  {
    key: "bogeumjari",
    name: POLICY_LOANS.bogeumjari.name,
    rates: POLICY_LOANS.bogeumjari.rates,
    maxLoan: POLICY_LOANS.bogeumjari.maxLoan,
  },
  {
    key: "batimok",
    name: POLICY_LOANS.batimok.name,
    rates: POLICY_LOANS.batimok.rates,
    maxLoan: POLICY_LOANS.batimok.maxLoanSeoul,
  },
];

/** 시중 평균 금리 기준 (은행 금리 대비 정책대출 금리 차이 산출용) */
const MARKET_AVG_RATE = 4.2;

export default function PolicyLoanContent() {
  const loanResult = useHousePinStore((s) => s.loanResult);

  if (!loanResult) return null;

  const eligibleLoans = POLICY_LOAN_LIST.filter(
    (loan) => loanResult.policyLoans[loan.key],
  );

  if (eligibleLoans.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-secondary">
        현재 조건으로 해당하는 정책 대출이 없어요
      </p>
    );
  }

  return (
    <>
      <p className="mb-4 text-sm text-secondary">
        자격 조건에 해당하는 정책대출이 있어요
      </p>

      <div className="flex flex-col gap-4">
        {eligibleLoans.map((loan) => {
          const rateDiff = MARKET_AVG_RATE - loan.rates.min;
          const rateDiffText =
            rateDiff > 0
              ? `시중 금리 대비 약 ${rateDiff.toFixed(1)}%p 낮음`
              : null;

          return (
            <div
              key={loan.key}
              className="rounded-[12px] border border-border p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="text-base font-semibold text-primary">
                  {loan.name}
                </span>
                <Badge variant="success">자격 해당</Badge>
              </div>

              <div className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary">예상 금리</span>
                  <span className="font-semibold text-primary">
                    {loan.rates.min}% ~ {loan.rates.max}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">최대 한도</span>
                  <span className="font-semibold text-primary">
                    {formatToKoreanWon(loan.maxLoan)}
                  </span>
                </div>
              </div>

              {rateDiffText && (
                <p className="mt-3 text-xs text-success">{rateDiffText}</p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
