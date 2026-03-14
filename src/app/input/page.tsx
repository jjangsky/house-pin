"use client";

import { useState, useMemo } from "react";

import { StepIndicator, Button } from "@/components/common";
import AssetForm from "@/components/input/AssetForm";
import QualificationForm from "@/components/input/QualificationForm";
import LoanPreferenceForm from "@/components/input/LoanPreferenceForm";
import InputSummary from "@/components/input/InputSummary";
import { validateAssetInput } from "@/lib/utils/validation";
import { useHousePinStore } from "@/store/useHousePinStore";

export default function InputPage() {
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const assetInput = useHousePinStore((state) => state.assetInput);

  const validationResult = useMemo(
    () => validateAssetInput(assetInput),
    [assetInput]
  );

  return (
    <main className="pb-12">
      <StepIndicator currentStep={1} />

      <div className="mt-4 mb-10">
        <h1 className="text-2xl font-bold text-primary">
          내 자산 정보 입력
        </h1>
        <p className="mt-2 text-base text-secondary">
          정확한 구매력 산출을 위해 자산 정보를 입력해주세요
        </p>
      </div>

      <div id="asset-form-section" className="flex flex-col gap-10">
        <AssetForm />

        <hr className="border-border" />

        <QualificationForm />

        <hr className="border-border" />

        <LoanPreferenceForm />
      </div>

      <div className="mt-10">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => setIsSummaryOpen(true)}
          disabled={!validationResult.isValid}
        >
          확인하기
        </Button>
        {!validationResult.isValid && Object.values(validationResult.errors).length > 0 && (
          <p className="mt-3 text-center text-sm text-danger">
            {Object.values(validationResult.errors)[0]}
          </p>
        )}
      </div>

      <InputSummary
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
      />
    </main>
  );
}
