"use client";

import { useState, useCallback } from "react";
import { Select } from "@/components/common";
import { useHousePinStore } from "@/store/useHousePinStore";
import { SIDO_LIST, SIGUNGU_MAP, MAX_REGION_COUNT } from "@/constants/regions";

export default function RegionDropdown() {
  const [selectedSido, setSelectedSido] = useState("");
  const selectedRegions = useHousePinStore((s) => s.selectedRegions);
  const addRegion = useHousePinStore((s) => s.addRegion);
  const removeRegion = useHousePinStore((s) => s.removeRegion);

  const sidoOptions = SIDO_LIST.map((s) => ({
    value: s.code,
    label: s.name,
  }));

  const sigunguOptions = selectedSido
    ? (SIGUNGU_MAP[selectedSido] ?? []).map((s) => ({
        value: s.code,
        label: s.name,
      }))
    : [];

  const handleSidoChange = useCallback((value: string) => {
    setSelectedSido(value);
  }, []);

  const handleSigunguChange = useCallback(
    (value: string) => {
      if (selectedRegions.length >= MAX_REGION_COUNT) return;

      const sidoName =
        SIDO_LIST.find((s) => s.code === selectedSido)?.name ?? "";
      const sigunguName =
        SIGUNGU_MAP[selectedSido]?.find((s) => s.code === value)?.name ?? "";

      addRegion({
        code: value,
        sido: sidoName,
        sigungu: sigunguName,
      });
    },
    [selectedSido, selectedRegions.length, addRegion]
  );

  const isMaxReached = selectedRegions.length >= MAX_REGION_COUNT;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-3">
        <div className="flex-1">
          <Select
            label="시/도"
            options={sidoOptions}
            value={selectedSido}
            placeholder="시/도 선택"
            onValueChange={handleSidoChange}
            disabled={isMaxReached}
          />
        </div>
        <div className="flex-1">
          <Select
            label="구/군"
            options={sigunguOptions}
            value=""
            placeholder="구/군 선택"
            onValueChange={handleSigunguChange}
            disabled={!selectedSido || isMaxReached}
          />
        </div>
      </div>

      {isMaxReached && (
        <p className="text-sm text-warning">
          최대 {MAX_REGION_COUNT}개 지역까지 선택할 수 있습니다
        </p>
      )}

      {selectedRegions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedRegions.map((region) => (
            <button
              key={region.code}
              type="button"
              onClick={() => removeRegion(region.code)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-primary transition-colors duration-200 hover:border-accent hover:text-accent"
              aria-label={`${region.sido} ${region.sigungu} 삭제`}
            >
              <span>
                {region.sido} {region.sigungu}
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 4L10 10M10 4L4 10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
