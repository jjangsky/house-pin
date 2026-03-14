"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, Skeleton, Badge } from "@/components/common";
import { formatToKoreanWon } from "@/lib/utils/format";
import { calculateMonthlyPayment } from "@/lib/calculation";
import { useHousePinStore } from "@/store/useHousePinStore";
import type { BankLoanProduct } from "@/lib/api/fss";

type RateFilter = "all" | "fixed" | "variable" | "mixed";

const RATE_FILTER_LABELS: Record<RateFilter, string> = {
  all: "전체",
  fixed: "고정",
  variable: "변동",
  mixed: "혼합",
};

interface BankComparisonTableProps {
  loanAmount: number;
}

export default function BankComparisonTable({
  loanAmount,
}: BankComparisonTableProps) {
  const assetInput = useHousePinStore((s) => s.assetInput);

  const [products, setProducts] = useState<BankLoanProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rateFilter, setRateFilter] = useState<RateFilter>("all");

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      setIsLoading(true);
      setError(null);

      try {
        const type =
          assetInput.transactionType === "jeonse" ? "rent" : "mortgage";
        const res = await fetch(`/api/loan-products?type=${type}`);

        if (!res.ok) {
          throw new Error("대출 상품 데이터를 불러오지 못했습니다.");
        }

        const data = await res.json();

        if (!cancelled) {
          // banks 배열에서 products를 평탄화
          const allProducts: BankLoanProduct[] = [];
          for (const bank of data.banks ?? []) {
            for (const product of bank.products ?? []) {
              allProducts.push(product);
            }
          }
          setProducts(allProducts);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "알 수 없는 오류가 발생했습니다.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [assetInput.transactionType]);

  // 필터 + 정렬 + 월상환액 계산
  const displayProducts = useMemo(() => {
    const filtered =
      rateFilter === "all"
        ? products
        : products.filter((p) => p.rateType === rateFilter);

    const withCalculations = filtered.map((p) => {
      const monthly = Math.round(
        calculateMonthlyPayment(
          loanAmount,
          p.minRate,
          assetInput.loanTermYears,
        ),
      );

      return {
        ...p,
        calculatedLoanAmount: loanAmount,
        calculatedMonthlyPayment: monthly,
      };
    });

    // 최저금리 오름차순 정렬
    return withCalculations.sort((a, b) => a.minRate - b.minRate);
  }, [products, rateFilter, loanAmount, assetInput.loanTermYears]);

  const rateTypeBadgeVariant = (type: BankLoanProduct["rateType"]) => {
    if (type === "fixed") return "info" as const;
    if (type === "variable") return "warning" as const;
    return "success" as const;
  };

  if (isLoading) {
    return (
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-primary">
          은행별 금리 비교
        </h3>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="80px" />
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <h3 className="mb-2 text-lg font-semibold text-primary">
          은행별 금리 비교
        </h3>
        <p className="text-sm text-danger">{error}</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="mb-1 text-lg font-semibold text-primary">
        은행별 금리 비교
      </h3>
      <p className="mb-5 text-sm text-secondary">
        {formatToKoreanWon(loanAmount)} 대출 기준 비교
      </p>

      {/* 필터 탭 */}
      <div
        className="mb-5 flex gap-2"
        role="tablist"
        aria-label="금리 유형 필터"
      >
        {(Object.keys(RATE_FILTER_LABELS) as RateFilter[]).map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={rateFilter === key}
            onClick={() => setRateFilter(key)}
            className={`
              rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200
              ${
                rateFilter === key
                  ? "bg-accent text-white"
                  : "bg-surface text-secondary hover:text-primary"
              }
            `.trim()}
          >
            {RATE_FILTER_LABELS[key]}
          </button>
        ))}
      </div>

      {displayProducts.length === 0 ? (
        <p className="py-8 text-center text-sm text-secondary">
          해당 조건에 맞는 상품이 없습니다.
        </p>
      ) : (
        <>
          {/* 데스크톱 테이블 */}
          <div className="hidden sm:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-secondary">
                  <th className="pb-3 font-medium">은행명</th>
                  <th className="pb-3 font-medium">상품명</th>
                  <th className="pb-3 font-medium">금리유형</th>
                  <th className="pb-3 text-right font-medium">최저금리</th>
                  <th className="pb-3 text-right font-medium">대출가능액</th>
                  <th className="pb-3 text-right font-medium">월상환액</th>
                </tr>
              </thead>
              <tbody>
                {displayProducts.map((p, idx) => (
                  <tr
                    key={`${p.bankName}-${p.productName}-${p.rateType}-${idx}`}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="py-4 font-semibold text-primary">
                      {p.bankName}
                    </td>
                    <td className="py-4 text-primary">{p.productName}</td>
                    <td className="py-4">
                      <Badge variant={rateTypeBadgeVariant(p.rateType)}>
                        {p.rateTypeName}
                      </Badge>
                    </td>
                    <td className="py-4 text-right font-semibold text-accent">
                      {p.minRate.toFixed(2)}%
                    </td>
                    <td className="py-4 text-right text-primary">
                      {formatToKoreanWon(p.calculatedLoanAmount)}
                    </td>
                    <td className="py-4 text-right font-semibold text-primary">
                      {formatToKoreanWon(p.calculatedMonthlyPayment)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일 카드 리스트 */}
          <div className="flex flex-col gap-3 sm:hidden">
            {displayProducts.map((p, idx) => (
              <div
                key={`mobile-${p.bankName}-${p.productName}-${p.rateType}-${idx}`}
                className="rounded-[12px] border border-border p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold text-primary">
                    {p.bankName}
                  </span>
                  <Badge variant={rateTypeBadgeVariant(p.rateType)}>
                    {p.rateTypeName}
                  </Badge>
                </div>
                <p className="mb-3 text-sm text-secondary">{p.productName}</p>

                <div className="flex flex-col gap-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary">최저금리</span>
                    <span className="font-semibold text-accent">
                      {p.minRate.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">대출가능액</span>
                    <span className="text-primary">
                      {formatToKoreanWon(p.calculatedLoanAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">월상환액</span>
                    <span className="font-semibold text-primary">
                      {formatToKoreanWon(p.calculatedMonthlyPayment)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
