"use client";

import { useState, useMemo } from "react";
import { Button, Select } from "@/components/common";
import type { LiveListing } from "@/types/listing";
import LivePropertyCard from "./LivePropertyCard";

type SortKey = "price_asc" | "price_desc" | "area_desc";
type PropertyTypeFilter = "all" | "apartment" | "villa" | "officetel";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "price_asc", label: "가격낮은순" },
  { value: "price_desc", label: "가격높은순" },
  { value: "area_desc", label: "면적넓은순" },
];

const TYPE_TABS: { value: PropertyTypeFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "apartment", label: "아파트" },
  { value: "villa", label: "연립" },
  { value: "officetel", label: "오피스텔" },
];

const PAGE_SIZE = 20;

interface LivePropertyListProps {
  listings: LiveListing[];
  affordablePrice: number;
}

function sortListings(items: LiveListing[], key: SortKey): LiveListing[] {
  const sorted = [...items];
  switch (key) {
    case "price_asc":
      return sorted.sort((a, b) => a.askingPrice - b.askingPrice);
    case "price_desc":
      return sorted.sort((a, b) => b.askingPrice - a.askingPrice);
    case "area_desc":
      return sorted.sort((a, b) => (b.area ?? 0) - (a.area ?? 0));
    default:
      return sorted;
  }
}

export default function LivePropertyList({
  listings,
  affordablePrice,
}: LivePropertyListProps) {
  const [sortKey, setSortKey] = useState<SortKey>("price_asc");
  const [typeFilter, setTypeFilter] = useState<PropertyTypeFilter>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const byType =
      typeFilter === "all"
        ? listings
        : listings.filter((l) => l.propertyType === typeFilter);
    return sortListings(byType, sortKey);
  }, [listings, typeFilter, sortKey]);

  const visibleItems = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-base font-semibold text-primary">
          현재 매물이 없습니다
        </p>
        <p className="mt-1 text-sm text-secondary">
          선택한 지역에 구매 가능한 매물이 없거나 서비스가 일시적으로 제한되었습니다
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 필터 + 정렬 */}
      <div className="flex flex-col gap-3">
        {/* 타입 필터 탭 */}
        <div className="flex gap-2">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setTypeFilter(tab.value);
                setVisibleCount(PAGE_SIZE);
              }}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                typeFilter === tab.value
                  ? "bg-primary text-white"
                  : "bg-surface text-secondary hover:bg-border"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 정렬 + 카운트 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-secondary">
            {filtered.length}건
          </span>
          <Select
            size="xs"
            options={SORT_OPTIONS}
            value={sortKey}
            onValueChange={(v) => setSortKey(v as SortKey)}
          />
        </div>
      </div>

      {/* 매물 리스트 */}
      <div className="flex flex-col gap-3">
        {visibleItems.map((listing) => (
          <LivePropertyCard
            key={listing.listingSeq}
            listing={listing}
            affordablePrice={affordablePrice}
          />
        ))}
      </div>

      {/* 더보기 */}
      {hasMore && (
        <Button
          variant="secondary"
          fullWidth
          size="md"
          onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
        >
          더보기 ({filtered.length - visibleCount}건 남음)
        </Button>
      )}
    </div>
  );
}
