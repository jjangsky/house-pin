"use client";

import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/common";
import { formatToKoreanWon, sqmToPyeong } from "@/lib/utils/format";
import { generatePropertySlug } from "@/lib/utils/property";
import type { Property } from "@/types";

interface PropertyCardProps {
  property: Property;
  affordablePrice: number;
}

export default function PropertyCard({
  property,
  affordablePrice,
}: PropertyCardProps) {
  const router = useRouter();
  const {
    name,
    dealAmount,
    area,
    floor,
    dealYear,
    dealMonth,
    dealDay,
    dong,
    propertyType,
  } = property;

  const propertyTypeConfig: Record<string, { label: string; className: string }> = {
    apartment: { label: "아파트", className: "bg-accent-light text-accent" },
    villa: { label: "빌라", className: "bg-warning-light text-warning" },
    officetel: { label: "오피스텔", className: "bg-[#F3EEFF] text-[#7B61FF]" },
  };

  const typeConfig = propertyTypeConfig[propertyType] ?? {
    label: propertyType,
    className: "bg-surface text-secondary",
  };

  const diff = affordablePrice - dealAmount;
  const isAffordable = diff >= 0;
  const pyeong = sqmToPyeong(area);
  const dealDate = `${dealYear}.${String(dealMonth).padStart(2, "0")}.${String(dealDay).padStart(2, "0")}`;

  const handleClick = () => {
    router.push(`/properties/${generatePropertySlug(property)}`);
  };

  return (
    <Card
      className="flex cursor-pointer flex-col gap-3 transition-transform duration-150 active:scale-[0.98]"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-primary leading-snug">
            {name}
          </h3>
          <span className={`shrink-0 rounded-[6px] px-2 py-0.5 text-xs font-semibold ${typeConfig.className}`}>
            {typeConfig.label}
          </span>
        </div>
        <Badge variant={isAffordable ? "success" : "danger"}>
          {isAffordable ? "여유" : "부족"} {formatToKoreanWon(Math.abs(diff))}
        </Badge>
      </div>

      <p className="text-lg font-semibold text-accent">
        {formatToKoreanWon(dealAmount)}
      </p>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-secondary">
        <span>
          {area}m<sup>2</sup> ({pyeong}평)
        </span>
        <span>{floor}층</span>
        <span>{dealDate}</span>
      </div>

      <p className="text-sm text-secondary">{dong}</p>
    </Card>
  );
}
