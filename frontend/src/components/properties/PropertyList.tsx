"use client";

import { useState, useMemo } from "react";
import { Button, Select } from "@/components/common";
import type { Property } from "@/types";
import PropertyCard from "./PropertyCard";

type SortKey = "latest" | "price_asc" | "price_desc" | "area_desc";
type PropertyTypeFilter = "all" | "apartment" | "villa" | "officetel";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "latest", label: "최신순" },
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

interface PropertyListProps {
  properties: Property[];
  affordablePrice: number;
}

function sortProperties(items: Property[], key: SortKey): Property[] {
  const sorted = [...items];

  switch (key) {
    case "latest":
      return sorted.sort((a, b) => {
        if (a.dealYear !== b.dealYear) return b.dealYear - a.dealYear;
        if (a.dealMonth !== b.dealMonth) return b.dealMonth - a.dealMonth;
        return b.dealDay - a.dealDay;
      });
    case "price_asc":
      return sorted.sort((a, b) => a.dealAmount - b.dealAmount);
    case "price_desc":
      return sorted.sort((a, b) => b.dealAmount - a.dealAmount);
    case "area_desc":
      return sorted.sort((a, b) => b.area - a.area);
    default:
      return sorted;
  }
}

export default function PropertyList({
  properties,
  affordablePrice,
}: PropertyListProps) {
  const [sortKey, setSortKey] = useState<SortKey>("latest");
  const [typeFilter, setTypeFilter] = useState<PropertyTypeFilter>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const byType =
      typeFilter === "all"
        ? properties
        : properties.filter((p) => p.propertyType === typeFilter);

    return sortProperties(byType, sortKey);
  }, [properties, typeFilter, sortKey]);

  const visibleItems = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 필터 탭 */}
      <div className="flex gap-2" role="tablist" aria-label="매물 유형 필터">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={typeFilter === tab.value}
            onClick={() => {
              setTypeFilter(tab.value);
              setVisibleCount(PAGE_SIZE);
            }}
            className={`
              rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200
              ${
                typeFilter === tab.value
                  ? "bg-primary text-white"
                  : "bg-surface text-secondary hover:text-primary"
              }
            `.trim()}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 정렬 + 건수 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-secondary">
          총 <span className="font-semibold text-primary">{filtered.length}</span>건
        </p>
        <div className="w-[130px]">
          <Select
            size="sm"
            options={SORT_OPTIONS}
            value={sortKey}
            onValueChange={(v) => setSortKey(v as SortKey)}
          />
        </div>
      </div>

      {/* 매물 리스트 또는 빈 상태 */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            aria-hidden="true"
            className="mb-4 text-border"
          >
            <rect
              x="6"
              y="10"
              width="36"
              height="28"
              rx="4"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M6 18h36M18 18v20"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle cx="30" cy="28" r="4" stroke="currentColor" strokeWidth="2" />
            <path d="M33 31l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p className="text-base font-semibold text-primary">
            조건에 맞는 거래 내역이 없습니다
          </p>
          <p className="mt-1 text-sm text-secondary">
            지역을 추가하거나 조건을 변경해보세요
          </p>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-3" aria-label="매물 목록">
            {visibleItems.map((property, index) => (
              <li key={`${property.regionCode}-${property.name}-${property.floor}-${property.dealYear}${property.dealMonth}${property.dealDay}-${index}`}>
                <PropertyCard
                  property={property}
                  affordablePrice={affordablePrice}
                />
              </li>
            ))}
          </ul>

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={handleShowMore}
              >
                더 보기 ({filtered.length - visibleCount}건 남음)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
