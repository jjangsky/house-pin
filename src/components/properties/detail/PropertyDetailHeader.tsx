import { Card, Badge } from "@/components/common";
import { formatToKoreanWon, sqmToPyeong } from "@/lib/utils/format";
import type { Property } from "@/types";

interface PropertyDetailHeaderProps {
  property: Property;
  affordablePrice: number;
}

const PROPERTY_TYPE_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  apartment: { label: "아파트", className: "bg-accent-light text-accent" },
  villa: { label: "빌라", className: "bg-warning-light text-warning" },
  officetel: {
    label: "오피스텔",
    className: "bg-[#F3EEFF] text-[#7B61FF]",
  },
};

export default function PropertyDetailHeader({
  property,
  affordablePrice,
}: PropertyDetailHeaderProps) {
  const {
    name,
    dealAmount,
    area,
    floor,
    buildYear,
    dealYear,
    dealMonth,
    dealDay,
    dong,
    jibun,
    propertyType,
  } = property;

  const typeConfig = PROPERTY_TYPE_CONFIG[propertyType] ?? {
    label: propertyType,
    className: "bg-surface text-secondary",
  };

  const diff = affordablePrice - dealAmount;
  const isAffordable = diff >= 0;
  const pyeong = sqmToPyeong(area);
  const currentYear = new Date().getFullYear();
  const buildingAge = currentYear - buildYear;
  const dealDate = `${dealYear}.${String(dealMonth).padStart(2, "0")}.${String(dealDay).padStart(2, "0")}`;

  return (
    <Card>
      <div className="flex flex-col gap-4">
        {/* 건물명 + 타입 뱃지 */}
        <div className="flex items-center gap-2.5">
          <span
            className={`shrink-0 rounded-[6px] px-2 py-0.5 text-xs font-semibold ${typeConfig.className}`}
          >
            {typeConfig.label}
          </span>
          <h1 className="text-2xl font-bold leading-tight text-primary">
            {name}
          </h1>
        </div>

        {/* 거래 금액 + 구매 가능 뱃지 */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-[32px] font-bold leading-none text-accent">
            {formatToKoreanWon(dealAmount)}
          </p>
          <Badge variant={isAffordable ? "success" : "danger"}>
            {isAffordable ? "여유" : "부족"}{" "}
            {formatToKoreanWon(Math.abs(diff))}
          </Badge>
        </div>

        {/* 구분선 */}
        <div className="border-t border-border" />

        {/* 상세 정보 */}
        <div className="flex flex-col gap-2">
          <p className="text-base text-secondary">
            {area}m<sup>2</sup> ({pyeong}평)
            <span className="mx-1.5 text-border">·</span>
            {floor}층
            <span className="mx-1.5 text-border">·</span>
            {buildYear}년
            <span className="ml-1 text-xs text-secondary/60">
              (경과 {buildingAge}년)
            </span>
          </p>
          <p className="text-sm text-secondary">{dealDate} 거래</p>
          <p className="text-sm text-secondary">
            {dong} {jibun}
          </p>
        </div>
      </div>
    </Card>
  );
}
