"use client";

import { useState } from "react";
import { useHousePinStore } from "@/store/useHousePinStore";
import RegionDropdown from "./RegionDropdown";
import RegionMap from "./RegionMap";

type SelectionMode = "list" | "map";

const TABS: { value: SelectionMode; label: string }[] = [
  { value: "list", label: "목록으로 선택" },
  { value: "map", label: "지도로 선택" },
];

export default function RegionSelector() {
  const [mode, setMode] = useState<SelectionMode>("list");
  const selectedRegions = useHousePinStore((s) => s.selectedRegions);

  return (
    <div className="flex flex-col gap-6">
      {/* 탭 전환 */}
      <div className="relative flex border-b border-border" role="tablist">
        {TABS.map((tab) => {
          const isActive = mode === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setMode(tab.value)}
              className={`
                relative flex-1 pb-3 pt-1 text-center text-sm font-semibold
                transition-colors duration-200
                ${isActive ? "text-accent" : "text-secondary hover:text-primary"}
              `}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 h-[2px] w-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>

      {/* 선택 모드 콘텐츠 */}
      <div role="tabpanel">
        {mode === "list" ? <RegionDropdown /> : <RegionMap />}
      </div>

      {/* 선택된 지역 수 */}
      {selectedRegions.length > 0 && (
        <p className="text-center text-sm text-secondary">
          <span className="font-semibold text-accent">
            {selectedRegions.length}개
          </span>{" "}
          지역 선택됨
        </p>
      )}
    </div>
  );
}
