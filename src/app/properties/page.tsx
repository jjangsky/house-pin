"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator, Button } from "@/components/common";
import { useHousePinStore } from "@/store/useHousePinStore";
import { formatToKoreanWon } from "@/lib/utils/format";
import type { Property } from "@/types";
import PropertyView from "@/components/properties/PropertyView";
import LoadingProgress from "@/components/properties/LoadingProgress";

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
      const res = await fetch("/api/real-estate/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regionCodes: selectedRegions.map((r) => r.code),
          types: ["apt", "villa", "officetel"],
          months: 3,
          maxPrice: affordablePrice,
        }),
      });

      if (!res.ok) {
        throw new Error("매물 데이터를 불러오는 중 오류가 발생했습니다.");
      }

      const json = await res.json();
      const properties = (json.data ?? []) as Property[];

      setLocalProperties(properties);
      setProperties(properties);
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
      {loading && <LoadingProgress />}

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
