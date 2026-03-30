"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Card, Skeleton, Badge, Button, Select } from "@/components/common";
import { formatToKoreanWon } from "@/lib/utils/format";
import { calculateMonthlyPayment } from "@/lib/calculation";
import { useHousePinStore } from "@/store/useHousePinStore";
import type { BankLoanProduct } from "@/lib/api/fss";

type RateFilter = "all" | "fixed" | "variable" | "mixed";
type SortOption =
  | "minRate-asc"
  | "minRate-desc"
  | "monthly-asc"
  | "bankName-asc";

const RATE_FILTER_LABELS: Record<RateFilter, string> = {
  all: "전체",
  fixed: "고정",
  variable: "변동",
  mixed: "혼합",
};

const SORT_LABELS: Record<SortOption, string> = {
  "minRate-asc": "최저금리 낮은순",
  "minRate-desc": "최저금리 높은순",
  "monthly-asc": "월상환액 낮은순",
  "bankName-asc": "은행명 가나다순",
};

const PAGE_SIZE = 10;

export default function LoanExplorer() {
  const loanResult = useHousePinStore((s) => s.loanResult);
  const assetInput = useHousePinStore((s) => s.assetInput);

  const maxLoan = loanResult?.finalLoanLimit ?? 0;
  const [loanAmount, setLoanAmount] = useState(maxLoan);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 은행 상품 상태
  const [products, setProducts] = useState<BankLoanProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rateFilter, setRateFilter] = useState<RateFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("minRate-asc");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // maxLoan이 바뀌면 슬라이더도 리셋
  useEffect(() => {
    setLoanAmount(maxLoan);
  }, [maxLoan]);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = Number(e.target.value);
      const snapped = Math.round(raw / 100) * 100;
      setLoanAmount(snapped);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        setLoanAmount(snapped);
      }, 300);
    },
    [],
  );

  // 디바운스 정리
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // 상품 데이터 페치
  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      setIsLoading(true);
      setError(null);
      setRateFilter("all");

      try {
        const type =
          assetInput.transactionType === "jeonse" ? "rent" : "mortgage";
        const res = await fetch(`/api/loan-products?type=${type}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error("대출 상품 데이터를 불러오지 못했습니다.");
        }

        const data = await res.json();

        const allProducts: BankLoanProduct[] = [];
        for (const bank of data.banks ?? []) {
          for (const product of bank.products ?? []) {
            allProducts.push(product);
          }
        }
        setProducts(allProducts);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(
          err instanceof Error
            ? err.message
            : "알 수 없는 오류가 발생했습니다.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    fetchProducts();

    return () => {
      controller.abort();
    };
  }, [assetInput.transactionType]);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    const type =
      assetInput.transactionType === "jeonse" ? "rent" : "mortgage";
    fetch(`/api/loan-products?type=${type}`)
      .then((res) => {
        if (!res.ok) throw new Error("대출 상품 데이터를 불러오지 못했습니다.");
        return res.json();
      })
      .then((data) => {
        const allProducts: BankLoanProduct[] = [];
        for (const bank of data.banks ?? []) {
          for (const product of bank.products ?? []) {
            allProducts.push(product);
          }
        }
        setProducts(allProducts);
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "알 수 없는 오류가 발생했습니다.",
        );
      })
      .finally(() => setIsLoading(false));
  }, [assetInput.transactionType]);

  // 필터나 정렬 변경 시 페이지네이션 초기화
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [rateFilter, sortOption]);

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
        calculatedMonthlyPayment: monthly,
      };
    });

    return withCalculations.sort((a, b) => {
      switch (sortOption) {
        case "minRate-asc":
          return a.minRate - b.minRate;
        case "minRate-desc":
          return b.minRate - a.minRate;
        case "monthly-asc":
          return a.calculatedMonthlyPayment - b.calculatedMonthlyPayment;
        case "bankName-asc":
          return a.bankName.localeCompare(b.bankName, "ko");
        default:
          return 0;
      }
    });
  }, [products, rateFilter, sortOption, loanAmount, assetInput.loanTermYears]);

  const paginatedProducts = useMemo(
    () => displayProducts.slice(0, visibleCount),
    [displayProducts, visibleCount],
  );

  const totalCount = displayProducts.length;
  const shownCount = Math.min(visibleCount, totalCount);
  const hasMore = shownCount < totalCount;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  const rateTypeBadgeVariant = (type: BankLoanProduct["rateType"]) => {
    if (type === "fixed") return "info" as const;
    if (type === "variable") return "warning" as const;
    return "success" as const;
  };

  if (!loanResult || maxLoan <= 0) return null;

  const monthlyPayment = Math.round(
    calculateMonthlyPayment(loanAmount, 4.0, assetInput.loanTermYears),
  );

  const progress = maxLoan > 0 ? (loanAmount / maxLoan) * 100 : 0;

  return (
    <Card>
      <h3 className="mb-1 text-lg font-semibold text-primary">
        대출 조건 탐색
      </h3>
      <p className="mb-6 text-sm text-secondary">
        대출 금액을 조절하고 은행별 금리를 비교해보세요
      </p>

      {/* ── 슬라이더 섹션 ── */}
      <div className="mb-4 text-center">
        <p className="text-[28px] font-bold text-accent">
          {formatToKoreanWon(loanAmount)}
        </p>
      </div>

      <div className="relative mb-6 px-1">
        <input
          type="range"
          min={0}
          max={maxLoan}
          step={100}
          value={loanAmount}
          onChange={handleSliderChange}
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

      <div className="mb-6 rounded-[12px] bg-surface p-4 text-center">
        <p className="mb-1 text-sm text-secondary">예상 월 상환액</p>
        <p className="text-xl font-bold text-primary">
          {formatToKoreanWon(monthlyPayment)}
        </p>
      </div>

      {/* ── 구분선 ── */}
      <hr className="mb-6 border-border" />

      {/* ── 은행 비교 섹션 ── */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="80px" />
          ))}
        </div>
      ) : error ? (
        <>
          <p className="mb-3 text-sm text-danger">{error}</p>
          <Button variant="secondary" size="sm" onClick={handleRetry}>
            다시 시도
          </Button>
        </>
      ) : loanAmount <= 0 ? (
        <p className="py-8 text-center text-sm text-secondary">
          대출 금액을 설정하면 은행별 금리를 비교할 수 있어요.
        </p>
      ) : (
        <>
          <h4 className="text-base font-semibold text-primary">
            은행별 금리 비교
          </h4>
          <p className="mt-1 mb-4 text-sm text-secondary">
            {formatToKoreanWon(loanAmount)} 대출 기준 비교
          </p>

          {/* 필터 탭 + 정렬 */}
          <div className="mb-5 flex flex-col gap-3">
            <div
              className="flex gap-2"
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

            <div className="w-[160px] self-end">
              <Select
                size="sm"
                options={(Object.keys(SORT_LABELS) as SortOption[]).map(
                  (key) => ({
                    value: key,
                    label: SORT_LABELS[key],
                  }),
                )}
                value={sortOption}
                onValueChange={(v) => setSortOption(v as SortOption)}
              />
            </div>
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
                      <th className="pb-3 text-right font-medium">대출한도</th>
                      <th className="pb-3 text-right font-medium">월상환액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts.map((p, idx) => (
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
                          {p.loanLimit || "-"}
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
                {paginatedProducts.map((p, idx) => (
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
                    <p className="mb-3 text-sm text-secondary">
                      {p.productName}
                    </p>

                    <div className="flex flex-col gap-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-secondary">최저금리</span>
                        <span className="font-semibold text-accent">
                          {p.minRate.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary">대출한도</span>
                        <span className="text-primary">
                          {p.loanLimit || "-"}
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

              {/* 더보기 영역 */}
              <div className="mt-5 flex flex-col items-center gap-2">
                <p className="text-sm text-secondary">
                  {shownCount} / {totalCount}개 상품
                </p>
                {hasMore && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleLoadMore}
                  >
                    더보기
                  </Button>
                )}
              </div>
            </>
          )}
        </>
      )}
    </Card>
  );
}
