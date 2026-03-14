"use client";

import { useState } from "react";
import type { Property } from "@/types";
import PropertyList from "./PropertyList";
import PropertyMap from "./PropertyMap";

type ViewMode = "list" | "map";

interface PropertyViewProps {
  properties: Property[];
  affordablePrice: number;
}

export default function PropertyView({
  properties,
  affordablePrice,
}: PropertyViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  return (
    <div className="flex flex-col gap-5">
      {/* 뷰 토글 + 매물 수 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-secondary">
          매물{" "}
          <span className="font-semibold text-primary">
            {properties.length}
          </span>
          건
        </p>
        <div
          className="flex rounded-[10px] bg-surface p-1"
          role="tablist"
          aria-label="보기 방식"
        >
          <button
            role="tab"
            aria-selected={viewMode === "list"}
            onClick={() => setViewMode("list")}
            className={`
              rounded-[8px] px-4 py-1.5 text-sm font-medium transition-colors duration-200
              ${
                viewMode === "list"
                  ? "bg-white text-primary shadow-sm"
                  : "text-secondary hover:text-primary"
              }
            `.trim()}
          >
            리스트
          </button>
          <button
            role="tab"
            aria-selected={viewMode === "map"}
            onClick={() => setViewMode("map")}
            className={`
              rounded-[8px] px-4 py-1.5 text-sm font-medium transition-colors duration-200
              ${
                viewMode === "map"
                  ? "bg-white text-primary shadow-sm"
                  : "text-secondary hover:text-primary"
              }
            `.trim()}
          >
            지도
          </button>
        </div>
      </div>

      {/* 컨텐츠 */}
      {viewMode === "list" ? (
        <PropertyList
          properties={properties}
          affordablePrice={affordablePrice}
        />
      ) : (
        <PropertyMap
          properties={properties}
          affordablePrice={affordablePrice}
        />
      )}
    </div>
  );
}
