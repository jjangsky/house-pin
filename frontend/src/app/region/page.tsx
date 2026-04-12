"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator, Button } from "@/components/common";
import { useHousePinStore } from "@/store/useHousePinStore";
import RegionSelector from "@/components/region/RegionSelector";

export default function RegionPage() {
  const router = useRouter();
  const selectedRegions = useHousePinStore((s) => s.selectedRegions);
  const setCurrentStep = useHousePinStore((s) => s.setCurrentStep);

  useEffect(() => {
    setCurrentStep(3);
  }, [setCurrentStep]);

  const handleNext = () => {
    router.push("/properties");
  };

  const hasRegions = selectedRegions.length > 0;

  return (
    <main className="pb-12">
      <StepIndicator currentStep={3} />

      <div className="mt-4 mb-8">
        <h1 className="text-2xl font-bold text-primary">선호 지역 선택</h1>
        <p className="mt-2 text-base text-secondary">
          관심 있는 지역을 선택하면 해당 지역의 매물을 찾아드립니다
        </p>
      </div>

      <RegionSelector />

      <div className="mt-10">
        <Button
          fullWidth
          size="lg"
          onClick={handleNext}
          disabled={!hasRegions}
        >
          매물 찾기
        </Button>
      </div>
    </main>
  );
}
