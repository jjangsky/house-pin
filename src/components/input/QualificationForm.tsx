"use client";

import { useHousePinStore } from "@/store/useHousePinStore";
import { Toggle, Select, Input } from "@/components/common";

const HOMES_OPTIONS = [
  { value: "0", label: "0주택" },
  { value: "1", label: "1주택" },
  { value: "2", label: "2주택 이상" },
];

export default function QualificationForm() {
  const assetInput = useHousePinStore((state) => state.assetInput);
  const setAssetInput = useHousePinStore((state) => state.setAssetInput);

  const handleFirstTimeBuyerChange = (checked: boolean) => {
    setAssetInput({ isFirstTimeBuyer: checked });
  };

  const handleNumberOfHomesChange = (value: string) => {
    setAssetInput({ numberOfHomes: Number(value) });
  };

  const handleNewlywedChange = (checked: boolean) => {
    if (!checked) {
      setAssetInput({ isNewlywed: false, householdIncome: 0 });
    } else {
      setAssetInput({ isNewlywed: true });
    }
  };

  const handleHouseholdIncomeChange = (raw: string) => {
    setAssetInput({ householdIncome: Number(raw) || 0 });
  };

  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold text-primary">자격 조건</h2>

      <div className="flex flex-col gap-7">
        {/* 생애최초 주택구매 여부 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-base text-primary">
              생애최초 주택구매 여부
            </span>
            <Toggle
              checked={assetInput.isFirstTimeBuyer}
              onChange={handleFirstTimeBuyerChange}
              id="first-time-buyer"
            />
          </div>
          <p className="text-sm text-secondary">
            본인과 배우자 모두 주택 소유 이력이 없는 경우
          </p>
        </div>

        {/* 보유 주택 수 */}
        <div className="flex flex-col gap-2">
          <Select
            label="보유 주택 수"
            options={HOMES_OPTIONS}
            value={String(assetInput.numberOfHomes)}
            onValueChange={handleNumberOfHomesChange}
            id="number-of-homes"
          />
          <p className="text-sm text-secondary">
            본인 명의 주택 수를 선택하세요
          </p>
        </div>

        {/* 신혼부부 여부 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-base text-primary">신혼부부 여부</span>
            <Toggle
              checked={assetInput.isNewlywed}
              onChange={handleNewlywedChange}
              id="newlywed"
            />
          </div>
          <p className="text-sm text-secondary">
            혼인신고일 기준 7년 이내
          </p>
        </div>

        {/* 부부합산 연소득 — 신혼부부 Y일 때만 노출 */}
        <div
          className={`
            flex flex-col gap-2
            overflow-hidden transition-all duration-300 ease-in-out
            ${assetInput.isNewlywed ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}
          `.trim()}
          aria-hidden={!assetInput.isNewlywed}
        >
          <Input
            label="부부합산 연소득"
            type="number"
            suffix="만원"
            placeholder="0"
            value={String(assetInput.householdIncome || "")}
            onValueChange={handleHouseholdIncomeChange}
            id="household-income"
            disabled={!assetInput.isNewlywed}
          />
        </div>
      </div>
    </section>
  );
}
