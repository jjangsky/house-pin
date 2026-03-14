"use client";

import { Select } from "@/components/common";
import { useHousePinStore } from "@/store/useHousePinStore";
import type { AssetInput } from "@/types";

const TRANSACTION_OPTIONS = [
  { value: "buy", label: "매매" },
  { value: "jeonse", label: "전세" },
];

const BUY_LOAN_TERM_OPTIONS = [
  { value: "10", label: "10년" },
  { value: "15", label: "15년" },
  { value: "20", label: "20년" },
  { value: "30", label: "30년" },
  { value: "40", label: "40년" },
];

const JEONSE_LOAN_TERM_OPTIONS = [
  { value: "2", label: "2년 (연장 가능)" },
];

const REPAYMENT_OPTIONS = [
  { value: "equal_payment", label: "원리금균등상환" },
  { value: "equal_principal", label: "원금균등상환" },
];

const REPAYMENT_DESCRIPTIONS: Record<string, string> = {
  equal_payment: "매달 같은 금액을 상환합니다",
  equal_principal: "초기 상환액이 크고 점점 줄어듭니다",
};

export default function LoanPreferenceForm() {
  const assetInput = useHousePinStore((state) => state.assetInput);
  const setAssetInput = useHousePinStore((state) => state.setAssetInput);

  const isBuy = assetInput.transactionType === "buy";
  const loanTermOptions = isBuy ? BUY_LOAN_TERM_OPTIONS : JEONSE_LOAN_TERM_OPTIONS;

  const handleTransactionChange = (value: string) => {
    const transactionType = value as AssetInput["transactionType"];
    const updates: Partial<AssetInput> = { transactionType };

    if (transactionType === "jeonse") {
      updates.loanTermYears = 2;
      updates.repaymentType = "equal_payment";
    } else {
      updates.loanTermYears = 30;
      updates.repaymentType = "equal_payment";
    }

    setAssetInput(updates);
  };

  const handleLoanTermChange = (value: string) => {
    setAssetInput({ loanTermYears: Number(value) });
  };

  const handleRepaymentChange = (value: string) => {
    setAssetInput({
      repaymentType: value as AssetInput["repaymentType"],
    });
  };

  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold text-primary">대출 조건</h2>

      <div className="flex flex-col gap-5">
        <Select
          label="거래 유형"
          options={TRANSACTION_OPTIONS}
          value={assetInput.transactionType}
          onValueChange={handleTransactionChange}
        />

        <Select
          label="대출 기간"
          options={loanTermOptions}
          value={String(assetInput.loanTermYears)}
          onValueChange={handleLoanTermChange}
        />

        <div
          className={`grid transition-all duration-300 ease-in-out ${
            isBuy
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <Select
              label="상환 방식"
              options={REPAYMENT_OPTIONS}
              value={assetInput.repaymentType}
              onValueChange={handleRepaymentChange}
              disabled={!isBuy}
            />
            <p className="mt-2 text-sm text-secondary">
              {REPAYMENT_DESCRIPTIONS[assetInput.repaymentType]}
            </p>
          </div>
        </div>

        {!isBuy && (
          <p className="text-sm text-secondary">
            전세 대출은 만기일시상환으로 진행됩니다
          </p>
        )}
      </div>
    </section>
  );
}
