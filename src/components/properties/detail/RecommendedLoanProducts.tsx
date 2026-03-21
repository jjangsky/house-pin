"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, Badge, Button } from "@/components/common";
import { formatToKoreanWon } from "@/lib/utils/format";
import { calculateMonthlyPayment } from "@/lib/calculation";
import type { LoanResult, AssetInput } from "@/types";

interface BankLoanProduct {
  bankName: string;
  productName: string;
  rateType: "fixed" | "variable" | "mixed";
  minRate: number;
  maxRate: number;
}

interface BankSummary {
  bankName: string;
  lowestRate: number;
  highestRate: number;
  productCount: number;
  products: BankLoanProduct[];
}

interface RecommendedLoanProductsProps {
  requiredLoan: number;
  loanResult: LoanResult;
  assetInput: AssetInput;
}

const RATE_TYPE_LABEL: Record<string, string> = {
  fixed: "고정",
  variable: "변동",
  mixed: "혼합",
};

const RATE_TYPE_VARIANT: Record<string, "info" | "success" | "warning"> = {
  fixed: "info",
  variable: "warning",
  mixed: "success",
};

export default function RecommendedLoanProducts({
  requiredLoan,
  loanResult,
  assetInput,
}: RecommendedLoanProductsProps) {
  const [banks, setBanks] = useState<BankSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const type = assetInput.transactionType === "jeonse" ? "rent" : "mortgage";

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/loan-products?type=${type}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        setBanks(data.banks ?? []);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("[detail] 대출 상품 로드 실패:", err);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [type]);

  const topProducts = useMemo(() => {
    return [...banks]
      .sort((a, b) => a.lowestRate - b.lowestRate)
      .slice(0, 5)
      .map((bank) => {
        const bestProduct = bank.products?.[0];
        const rateType = bestProduct?.rateType ?? "variable";
        const monthlyPayment = calculateMonthlyPayment(
          requiredLoan,
          bank.lowestRate,
          assetInput.loanTermYears,
        );
        const totalInterest =
          monthlyPayment * assetInput.loanTermYears * 12 - requiredLoan;

        return {
          bankName: bank.bankName,
          productName: bestProduct?.productName ?? "",
          rateType,
          minRate: bank.lowestRate,
          maxRate: bank.highestRate,
          monthlyPayment,
          totalInterest,
        };
      });
  }, [banks, requiredLoan, assetInput.loanTermYears]);

  // 정책대출 표시
  const policyLoans = loanResult.policyLoans;
  const hasPolicyLoan =
    policyLoans.didimdol || policyLoans.bogeumjari || policyLoans.batimok;

  if (loading) {
    return (
      <Card title="추천 대출 상품">
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
        </div>
      </Card>
    );
  }

  return (
    <Card title="추천 대출 상품">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-secondary">
          필요 대출금{" "}
          <span className="font-semibold text-primary">
            {formatToKoreanWon(requiredLoan)}
          </span>{" "}
          기준
        </p>

        {/* 정책대출 */}
        {hasPolicyLoan && (
          <div className="rounded-[12px] border border-accent/20 bg-accent/5 p-4">
            <p className="mb-2 text-sm font-semibold text-accent">
              정책대출 자격 충족
            </p>
            <div className="flex flex-wrap gap-2">
              {policyLoans.didimdol && (
                <Badge variant="info">디딤돌</Badge>
              )}
              {policyLoans.bogeumjari && (
                <Badge variant="info">보금자리론</Badge>
              )}
              {policyLoans.batimok && (
                <Badge variant="info">버팀목</Badge>
              )}
            </div>
          </div>
        )}

        {/* 은행 상품 목록 */}
        {topProducts.length === 0 ? (
          <p className="py-4 text-center text-sm text-secondary">
            조회된 대출 상품이 없습니다
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {topProducts.map((product, i) => (
              <div key={`${product.bankName}-${i}`} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-primary">
                        {product.bankName}
                      </span>
                      <Badge
                        variant={RATE_TYPE_VARIANT[product.rateType] ?? "info"}
                      >
                        {RATE_TYPE_LABEL[product.rateType] ?? product.rateType}
                      </Badge>
                    </div>
                    <p className="text-xs text-secondary">
                      {product.productName}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-base font-bold text-accent">
                      {product.minRate.toFixed(2)}%
                    </span>
                    <span className="text-xs text-secondary">
                      월 {formatToKoreanWon(Math.round(product.monthlyPayment))}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {banks.length > 5 && (
          <Button
            variant="ghost"
            size="sm"
            fullWidth
          >
            전체 {banks.length}개 상품 보기
          </Button>
        )}
      </div>
    </Card>
  );
}
