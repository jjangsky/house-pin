"use client";

import { useCallback } from "react";

import { Input } from "@/components/common";
import { formatToKoreanWon } from "@/lib/utils/format";
import { useHousePinStore } from "@/store/useHousePinStore";

interface FieldConfig {
  key: "ownCapital" | "annualIncome" | "existingLoanBalance" | "existingLoanPayment";
  label: string;
  placeholder: string;
  required: boolean;
}

const FIELDS: FieldConfig[] = [
  {
    key: "ownCapital",
    label: "보유 자산 (현금/예금)",
    placeholder: "예: 5,000",
    required: true,
  },
  {
    key: "annualIncome",
    label: "연소득",
    placeholder: "예: 4,000",
    required: true,
  },
  {
    key: "existingLoanBalance",
    label: "기존 대출 잔액",
    placeholder: "0",
    required: false,
  },
  {
    key: "existingLoanPayment",
    label: "기존 대출 월 상환액",
    placeholder: "0",
    required: false,
  },
];

export default function AssetForm() {
  const assetInput = useHousePinStore((state) => state.assetInput);
  const setAssetInput = useHousePinStore((state) => state.setAssetInput);

  const handleValueChange = useCallback(
    (key: FieldConfig["key"]) => (raw: string) => {
      const numericValue = raw === "" ? 0 : Number(raw);
      setAssetInput({ [key]: numericValue });
    },
    [setAssetInput]
  );

  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold text-primary">
        보유 자산 정보
      </h2>

      {FIELDS.map((field) => {
        const value = assetInput[field.key];

        return (
          <div key={field.key} className="flex flex-col gap-1">
            <Input
              label={field.label}
              type="number"
              suffix="만원"
              placeholder={field.placeholder}
              value={String(value || "")}
              onValueChange={handleValueChange(field.key)}
              name={field.key}
            />
            {value > 0 && (
              <p className="text-sm text-secondary pl-1">
                {formatToKoreanWon(value)}
              </p>
            )}
          </div>
        );
      })}
    </section>
  );
}
