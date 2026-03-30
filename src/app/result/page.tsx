"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  StepIndicator,
  Button,
  CollapsibleCard,
} from "@/components/common";
import { useHousePinStore, useHasHydrated } from "@/store/useHousePinStore";
import { calculateLoanResult } from "@/lib/calculation";
import AffordabilityCard from "@/components/result/AffordabilityCard";
import PolicyCard from "@/components/result/PolicyCard";
import LoanExplorer from "@/components/result/LoanExplorer";
import ScenarioComparisonCard from "@/components/result/ScenarioComparisonCard";
import UpgradeSimulatorCard from "@/components/result/UpgradeSimulatorCard";

/** 기본 시장 금리 (시중 평균) */
const DEFAULT_MARKET_RATE = 4.0;

export default function ResultPage() {
  const router = useRouter();
  const assetInput = useHousePinStore((s) => s.assetInput);
  const loanResult = useHousePinStore((s) => s.loanResult);
  const setLoanResult = useHousePinStore((s) => s.setLoanResult);
  const setCurrentStep = useHousePinStore((s) => s.setCurrentStep);

  const hasHydrated = useHasHydrated();

  // 대출 계산 실행
  useEffect(() => {
    if (!hasHydrated) return;

    // 자산 정보가 없으면 입력 페이지로 리다이렉트
    if (assetInput.annualIncome <= 0 && assetInput.ownCapital <= 0) {
      router.replace("/input");
      return;
    }

    const result = calculateLoanResult(assetInput, DEFAULT_MARKET_RATE);
    setLoanResult(result);
    setCurrentStep(2);
  }, [hasHydrated, assetInput, setLoanResult, setCurrentStep, router]);

  const handleNext = () => {
    router.push("/region");
  };

  // loanResult가 아직 계산되지 않았으면 로딩 상태
  if (!loanResult) {
    return (
      <main className="pb-12">
        <StepIndicator currentStep={2} />
        <div className="flex items-center justify-center py-20">
          <p className="text-secondary">계산 중...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-5 pb-12">
      <StepIndicator currentStep={2} />

      <div className="mt-4 mb-8">
        <h1 className="text-2xl font-bold text-primary">
          대출 가능액 계산 결과
        </h1>
        <p className="mt-2 text-base text-secondary">
          입력하신 자산 기반으로 산출한 결과예요
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <AffordabilityCard />

        <PolicyCard />

        <LoanExplorer />

        <CollapsibleCard
          title="전세 vs 매매 비교"
          defaultOpen={false}
          preview="전세 유지 vs 매매 전환"
        >
          <ScenarioComparisonCard
            assetInput={assetInput}
            loanResult={loanResult}
          />
        </CollapsibleCard>

        <CollapsibleCard
          title="갈아타기 시뮬레이터"
          defaultOpen={false}
          preview="1주택 갈아타기"
        >
          <UpgradeSimulatorCard />
        </CollapsibleCard>
      </div>

      <div className="mt-10">
        <Button fullWidth size="lg" onClick={handleNext}>
          다음 단계
        </Button>
      </div>
    </main>
  );
}
