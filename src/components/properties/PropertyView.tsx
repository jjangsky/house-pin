"use client";

import { useState } from "react";
import type { Property } from "@/types";
import type { LiveListing } from "@/types/listing";
import PropertyList from "./PropertyList";
import PropertyMap from "./PropertyMap";
import LivePropertyList from "./LivePropertyList";

type DataSource = "transactions" | "live";
type ViewMode = "list" | "map";

interface PropertyViewProps {
  properties: Property[];
  liveListings: LiveListing[];
  affordablePrice: number;
  liveLoading?: boolean;
  liveError?: string | null;
}

export default function PropertyView({
  properties,
  liveListings,
  affordablePrice,
  liveLoading = false,
  liveError = null,
}: PropertyViewProps) {
  const [dataSource, setDataSource] = useState<DataSource>("transactions");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const showLive = dataSource === "live";
  const currentCount = showLive ? liveListings.length : properties.length;

  return (
    <div className="flex flex-col gap-5">
      {/* 데이터 소스 탭 */}
      <div className="flex gap-1 rounded-[12px] bg-surface p-1">
        <button
          onClick={() => setDataSource("transactions")}
          className={`flex-1 rounded-[10px] py-2.5 text-sm font-semibold transition-colors duration-200 ${
            dataSource === "transactions"
              ? "bg-white text-primary shadow-sm"
              : "text-secondary hover:text-primary"
          }`}
        >
          실거래 내역
        </button>
        <button
          onClick={() => setDataSource("live")}
          className={`flex-1 rounded-[10px] py-2.5 text-sm font-semibold transition-colors duration-200 ${
            dataSource === "live"
              ? "bg-white text-primary shadow-sm"
              : "text-secondary hover:text-primary"
          }`}
        >
          현재 매물
          {liveListings.length > 0 && (
            <span className="ml-1.5 rounded-full bg-accent/10 px-1.5 py-0.5 text-xs text-accent">
              {liveListings.length}
            </span>
          )}
        </button>
      </div>

      {/* 뷰 토글 + 매물 수 (실거래 탭에서만) */}
      {!showLive && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-secondary">
            매물{" "}
            <span className="font-semibold text-primary">
              {currentCount}
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
              className={`rounded-[8px] px-4 py-1.5 text-sm font-medium transition-colors duration-200 ${
                viewMode === "list"
                  ? "bg-white text-primary shadow-sm"
                  : "text-secondary hover:text-primary"
              }`}
            >
              리스트
            </button>
            <button
              role="tab"
              aria-selected={viewMode === "map"}
              onClick={() => setViewMode("map")}
              className={`rounded-[8px] px-4 py-1.5 text-sm font-medium transition-colors duration-200 ${
                viewMode === "map"
                  ? "bg-white text-primary shadow-sm"
                  : "text-secondary hover:text-primary"
              }`}
            >
              지도
            </button>
          </div>
        </div>
      )}

      {/* 컨텐츠 */}
      {showLive ? (
        liveLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
              <p className="text-sm text-secondary">현재 매물 검색 중...</p>
            </div>
          </div>
        ) : liveError ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-base font-semibold text-primary">
              매물을 불러올 수 없습니다
            </p>
            <p className="mt-1 text-sm text-secondary">{liveError}</p>
          </div>
        ) : (
          <LivePropertyList
            listings={liveListings}
            affordablePrice={affordablePrice}
          />
        )
      ) : viewMode === "list" ? (
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
