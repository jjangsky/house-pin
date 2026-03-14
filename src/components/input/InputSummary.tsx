"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { Card, Badge, Button } from "@/components/common";
import { formatToKoreanWon } from "@/lib/utils/format";
import { validateAssetInput } from "@/lib/utils/validation";
import { useHousePinStore } from "@/store/useHousePinStore";

const REPAYMENT_TYPE_LABEL: Record<string, string> = {
  equal_payment: "원리금균등",
  equal_principal: "원금균등",
};

const TRANSACTION_TYPE_LABEL: Record<string, string> = {
  buy: "매매",
  jeonse: "전세",
};

interface SummaryRow {
  label: string;
  value: string;
}

export default function InputSummary() {
  const router = useRouter();
  const assetInput = useHousePinStore((state) => state.assetInput);

  const validationResult = useMemo(
    () => validateAssetInput(assetInput),
    [assetInput]
  );

  const errorMessages = Object.values(validationResult.errors);

  const rows: SummaryRow[] = useMemo(() => {
    const items: SummaryRow[] = [
      {
        label: "보유 자산",
        value:
          assetInput.ownCapital > 0
            ? formatToKoreanWon(assetInput.ownCapital)
            : "0원",
      },
      {
        label: "연소득",
        value:
          assetInput.annualIncome > 0
            ? formatToKoreanWon(assetInput.annualIncome)
            : "0원",
      },
      {
        label: "기존 대출",
        value:
          assetInput.existingLoanBalance > 0
            ? `잔액 ${formatToKoreanWon(assetInput.existingLoanBalance)} / 월 ${formatToKoreanWon(assetInput.existingLoanPayment)}`
            : "없음",
      },
      {
        label: "생애최초",
        value: assetInput.isFirstTimeBuyer ? "예" : "아니오",
      },
      {
        label: "주택 수",
        value: `${assetInput.numberOfHomes}주택`,
      },
      {
        label: "거래 유형",
        value: TRANSACTION_TYPE_LABEL[assetInput.transactionType] ?? "매매",
      },
      {
        label: "대출 기간",
        value: `${assetInput.loanTermYears}년`,
      },
      {
        label: "상환 방식",
        value:
          assetInput.transactionType === "jeonse"
            ? "만기일시상환"
            : REPAYMENT_TYPE_LABEL[assetInput.repaymentType] ?? "원리금균등",
      },
    ];

    if (assetInput.isNewlywed) {
      items.splice(3, 0, {
        label: "세대 합산 소득",
        value:
          assetInput.householdIncome > 0
            ? formatToKoreanWon(assetInput.householdIncome)
            : "0원",
      });
    }

    return items;
  }, [assetInput]);

  const handleEdit = () => {
    const section = document.getElementById("asset-form-section");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCalculate = () => {
    router.push("/result");
  };

  return (
    <section aria-label="입력 요약" className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-primary">입력 요약</h2>

      <Card>
        <dl className="flex flex-col gap-4">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between"
            >
              <dt className="text-sm text-secondary">{row.label}</dt>
              <dd className="text-base font-bold text-primary">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      {errorMessages.length > 0 && (
        <div className="flex flex-col gap-2" role="alert">
          {errorMessages.map((error) => (
            <Badge key={error} variant="danger">
              {error}
            </Badge>
          ))}
        </div>
      )}

      {validationResult.warnings.length > 0 && (
        <div className="flex flex-col gap-2" role="alert">
          {validationResult.warnings.map((warning) => (
            <Badge key={warning} variant="warning">
              {warning}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex gap-3 mt-2">
        <Button variant="secondary" size="lg" onClick={handleEdit}>
          수정하기
        </Button>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleCalculate}
          disabled={!validationResult.isValid}
        >
          계산하기
        </Button>
      </div>
    </section>
  );
}
