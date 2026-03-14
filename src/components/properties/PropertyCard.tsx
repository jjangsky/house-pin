import { Card, Badge } from "@/components/common";
import { formatToKoreanWon, sqmToPyeong } from "@/lib/utils/format";
import type { Property } from "@/types";

interface PropertyCardProps {
  property: Property;
  affordablePrice: number;
}

export default function PropertyCard({
  property,
  affordablePrice,
}: PropertyCardProps) {
  const {
    name,
    dealAmount,
    area,
    floor,
    dealYear,
    dealMonth,
    dealDay,
    dong,
  } = property;

  const diff = affordablePrice - dealAmount;
  const isAffordable = diff >= 0;
  const pyeong = sqmToPyeong(area);
  const dealDate = `${dealYear}.${String(dealMonth).padStart(2, "0")}.${String(dealDay).padStart(2, "0")}`;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-bold text-primary leading-snug">
          {name}
        </h3>
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
