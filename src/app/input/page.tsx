"use client";

import { StepIndicator } from "@/components/common";
import AssetForm from "@/components/input/AssetForm";
import QualificationForm from "@/components/input/QualificationForm";
import LoanPreferenceForm from "@/components/input/LoanPreferenceForm";
import InputSummary from "@/components/input/InputSummary";

export default function InputPage() {
  return (
    <main className="mx-auto max-w-lg px-5 pb-12">
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

        <hr className="border-border" />

        <InputSummary />
      </div>
    </main>
  );
}
