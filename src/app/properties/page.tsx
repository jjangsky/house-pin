"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator, Button } from "@/components/common";
import { useHousePinStore } from "@/store/useHousePinStore";
import { formatToKoreanWon } from "@/lib/utils/format";
import type { Property } from "@/types";
import type { LiveListing } from "@/types/listing";
import PropertyView from "@/components/properties/PropertyView";
import LoadingProgress from "@/components/properties/LoadingProgress";

export default function PropertiesPage() {
  const router = useRouter();
  const selectedRegions = useHousePinStore((s) => s.selectedRegions);
  const loanResult = useHousePinStore((s) => s.loanResult);
  const storedProperties = useHousePinStore((s) => s.properties);
  const storedLiveListings = useHousePinStore((s) => s.liveListings);
  const setProperties = useHousePinStore((s) => s.setProperties);
  const setLiveListings = useHousePinStore((s) => s.setLiveListings);
  const setCurrentStep = useHousePinStore((s) => s.setCurrentStep);
  const reset = useHousePinStore((s) => s.reset);

  // Store에 캐시된 데이터가 있으면 초기값으로 사용
  const hasCachedData = storedProperties.length > 0;

  const [loading, setLoading] = useState(!hasCachedData);
  const [error, setError] = useState<string | null>(null);
  const [localProperties, setLocalProperties] = useState<Property[]>(storedProperties);

  const [liveLoading, setLiveLoading] = useState(storedLiveListings.length === 0);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [localLiveListings, setLocalLiveListings] = useState<LiveListing[]>(storedLiveListings);

  const affordablePrice = loanResult?.affordablePrice ?? 0;

  // 실거래 데이터 로드
  const loadTransactions = useCallback(async () => {
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

      if (!res.ok) throw new Error("실거래 데이터를 불러오는 중 오류가 발생했습니다.");

      const json = await res.json();
      const properties = (json.data ?? []) as Property[];

      setLocalProperties(properties);
      setProperties(properties);
    } catch (err) {
      console.error("[properties] 실거래 조회 실패:", err);
      setError("실거래 데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [loanResult, selectedRegions, affordablePrice, setProperties]);

  // 실시간 매물 로드
  const loadLiveListings = useCallback(async () => {
    if (!loanResult || selectedRegions.length === 0) return;

    setLiveLoading(true);
    setLiveError(null);

    try {
      const res = await fetch("/api/real-estate/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regionCodes: selectedRegions.map((r) => r.code),
          categories: ["apt", "officetel", "house"],
          maxPrice: affordablePrice,
        }),
      });

      if (!res.ok) throw new Error("현재 매물을 불러오는 중 오류가 발생했습니다.");

      const json = await res.json();
      const listings = (json.listings ?? []) as LiveListing[];

      setLocalLiveListings(listings);
      setLiveListings(listings);

      if (json.meta?.rateLimited) {
        setLiveError("일부 지역의 매물을 불러오지 못했습니다");
      }
    } catch (err) {
      console.error("[properties] 실시간 매물 조회 실패:", err);
      setLiveError("현재 매물을 불러올 수 없습니다");
    } finally {
      setLiveLoading(false);
    }
  }, [loanResult, selectedRegions, affordablePrice, setLiveListings]);

  useEffect(() => {
    if (!loanResult || selectedRegions.length === 0) {
      router.replace("/input");
      return;
    }

    setCurrentStep(4);

    // Store에 캐시된 데이터가 있으면 API 재호출 건너뜀
    if (storedProperties.length === 0) {
      loadTransactions();
    }
    if (storedLiveListings.length === 0) {
      loadLiveListings();
    }
  }, [loanResult, selectedRegions, router, setCurrentStep, loadTransactions, loadLiveListings]);

  const handleReset = () => {
    reset();
    router.push("/input");
  };

  if (!loanResult || selectedRegions.length === 0) {
    return null;
  }

  return (
    <main className="pb-12">
      <StepIndicator currentStep={4} />

      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-bold text-primary">매물 추천</h1>
        <p className="mt-2 text-base text-secondary">
          구매력 범위 내 매물을 확인하세요
        </p>
        <p className="mt-1 text-sm text-secondary">
          구매 가능 금액:{" "}
          <span className="font-semibold text-accent">
            {formatToKoreanWon(affordablePrice)}
          </span>
        </p>
        {!loading && !error && localProperties.length > 0 && (
          <button
            onClick={() => router.push("/analytics")}
            className="mt-3 text-sm font-medium text-accent hover:underline"
          >
            지역 시세 분석 보기 →
          </button>
        )}
      </div>

      {/* 실거래 로딩 */}
      {loading && <LoadingProgress />}

      {/* 실거래 에러 */}
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
            onClick={loadTransactions}
          >
            다시 시도
          </Button>
        </div>
      )}

      {/* 매물 결과 */}
      {!loading && !error && (
        <PropertyView
          properties={localProperties}
          liveListings={localLiveListings}
          affordablePrice={affordablePrice}
          liveLoading={liveLoading}
          liveError={liveError}
        />
      )}

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
