"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator, Button, Card, Skeleton } from "@/components/common";
import { useHousePinStore } from "@/store/useHousePinStore";
import { formatToKoreanWon, getRecentMonths } from "@/lib/utils/format";
import {
  filterByAffordability,
  toProperty,
} from "@/lib/utils/propertyFilter";
import type { RealEstateTransaction } from "@/lib/api/molit";
import type { Property } from "@/types";
import PropertyView from "@/components/properties/PropertyView";

type FetchType = "apt" | "villa" | "officetel";
type PropertyType = "apartment" | "villa" | "officetel";

const FETCH_TYPES: { type: FetchType; propertyType: PropertyType }[] = [
  { type: "apt", propertyType: "apartment" },
  { type: "villa", propertyType: "villa" },
  { type: "officetel", propertyType: "officetel" },
];

async function fetchPropertiesForRegion(
  regionCode: string,
  dealYM: string,
  fetchType: FetchType
): Promise<RealEstateTransaction[]> {
  const url = `/api/real-estate?regionCode=${regionCode}&dealYM=${dealYM}&type=${fetchType}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export default function PropertiesPage() {
  const router = useRouter();
  const selectedRegions = useHousePinStore((s) => s.selectedRegions);
  const loanResult = useHousePinStore((s) => s.loanResult);
  const setProperties = useHousePinStore((s) => s.setProperties);
  const setCurrentStep = useHousePinStore((s) => s.setCurrentStep);
  const reset = useHousePinStore((s) => s.reset);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localProperties, setLocalProperties] = useState<Property[]>([]);

  const affordablePrice = loanResult?.affordablePrice ?? 0;

  const loadProperties = useCallback(async () => {
    if (!loanResult || selectedRegions.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const months = getRecentMonths(6);
      const allProperties: Property[] = [];

      // 각 지역 + 각 월 + 각 매물 유형 조회
      for (const region of selectedRegions) {
        for (const { type, propertyType } of FETCH_TYPES) {
          const promises = months.map((dealYM) =>
            fetchPropertiesForRegion(region.code, dealYM, type)
          );
          const results = await Promise.all(promises);
          const allTransactions = results.flat();

          // 구매력 범위 필터링
          const filtered = filterByAffordability({
            transactions: allTransactions,
            maxPrice: affordablePrice,
          });

          const mapped = filtered.map((tx) => toProperty(tx, propertyType));
          allProperties.push(...mapped);
        }
      }

      // 최신순 정렬
      allProperties.sort((a, b) => {
        if (a.dealYear !== b.dealYear) return b.dealYear - a.dealYear;
        if (a.dealMonth !== b.dealMonth) return b.dealMonth - a.dealMonth;
        return b.dealDay - a.dealDay;
      });

      setLocalProperties(allProperties);
      setProperties(allProperties);
    } catch (err) {
      console.error("[properties] 매물 조회 실패:", err);
      setError("매물 데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [loanResult, selectedRegions, affordablePrice, setProperties]);

  useEffect(() => {
    // 필수 데이터 없으면 리다이렉트
    if (!loanResult || selectedRegions.length === 0) {
      router.replace("/input");
      return;
    }

    setCurrentStep(4);
    loadProperties();
  }, [loanResult, selectedRegions, router, setCurrentStep, loadProperties]);

  const handleReset = () => {
    reset();
    router.push("/input");
  };

  // 필수 데이터 없는 경우 (리다이렉트 전)
  if (!loanResult || selectedRegions.length === 0) {
    return null;
  }

  return (
    <main className="pb-12">
      <StepIndicator currentStep={4} />

      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-bold text-primary">매물 추천</h1>
        <p className="mt-2 text-base text-secondary">
          구매력 범위 내 실거래 매물입니다
        </p>
        <p className="mt-1 text-sm text-secondary">
          구매 가능 금액:{" "}
          <span className="font-semibold text-accent">
            {formatToKoreanWon(affordablePrice)}
          </span>
        </p>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <div className="flex flex-col gap-3">
                <Skeleton height="20px" width="60%" />
                <Skeleton height="24px" width="40%" />
                <Skeleton height="16px" width="80%" />
                <Skeleton height="14px" width="30%" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 에러 상태 */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-base font-semibold text-primary">{error}</p>
          <p className="mt-1 text-sm text-secondary">
            잠시 후 다시 시도해주세요
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={loadProperties}
          >
            다시 시도
          </Button>
        </div>
      )}

      {/* 매물 결과 */}
      {!loading && !error && (
        <PropertyView
          properties={localProperties}
          affordablePrice={affordablePrice}
        />
      )}

      {/* 처음부터 다시 버튼 */}
      <div className="mt-10">
        <Button
          variant="ghost"
          fullWidth
          size="md"
          onClick={handleReset}
        >
          처음부터 다시
        </Button>
      </div>
    </main>
  );
}
