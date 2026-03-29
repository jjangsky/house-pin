"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/common";
import BargainBadge from "@/components/properties/BargainBadge";
import { formatToKoreanWon, sqmToPyeong } from "@/lib/utils/format";
import { generateLiveSlug } from "@/lib/utils/listingAdapter";
import type { LiveListing } from "@/types/listing";
import type { BargainScore } from "@/types/bargain";

interface LivePropertyCardProps {
  listing: LiveListing;
  affordablePrice: number;
  bargainScore?: BargainScore;
  onClick?: () => void;
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

export default function LivePropertyCard({
  listing,
  affordablePrice,
  bargainScore,
  onClick,
}: LivePropertyCardProps) {
  const router = useRouter();

  const handleClick = onClick ?? (() => {
    router.push(`/properties/${generateLiveSlug(listing)}`);
  });
  const {
    name,
    askingPrice,
    area,
    floor,
    dongName,
    propertyType,
    thumbnailUrl,
    isPano,
    isOwnerAuth,
  } = listing;

  const typeConfig = PROPERTY_TYPE_CONFIG[propertyType] ?? {
    label: propertyType,
    className: "bg-surface text-secondary",
  };

  const diff = affordablePrice - askingPrice;
  const isAffordable = diff >= 0;

  return (
    <Card
      className="relative flex cursor-pointer gap-4 transition-transform duration-150 active:scale-[0.98]"
      onClick={handleClick}
    >
      {/* 급매 뱃지 */}
      {bargainScore && bargainScore.grade !== 'overpriced' && (
        <div className="absolute right-3 top-3 z-10">
          <BargainBadge score={bargainScore} />
        </div>
      )}

      {/* 썸네일 */}
      <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[10px] bg-border/30">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={name}
            fill
            sizes="72px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              className="text-secondary/40"
            >
              <path
                d="M3 21V7l9-4 9 4v14H3z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M9 21v-6h6v6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
        {isPano && (
          <div className="absolute bottom-1 left-1 rounded-[4px] bg-black/60 px-1 py-0.5 text-[10px] font-medium text-white">
            VR
          </div>
        )}
      </div>

      {/* 정보 영역 */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* 뱃지 라인 */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="shrink-0 rounded-[6px] bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
            현재 매물
          </span>
          <span
            className={`shrink-0 rounded-[6px] px-2 py-0.5 text-[11px] font-semibold ${typeConfig.className}`}
          >
            {typeConfig.label}
          </span>
          {isOwnerAuth && (
            <span className="shrink-0 rounded-[6px] bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
              집주인
            </span>
          )}
        </div>

        {/* 단지명 */}
        <h3 className="truncate text-[15px] font-bold leading-snug text-primary">
          {name}
        </h3>

        {/* 호가 */}
        <p className="text-base font-bold text-accent">
          <span className="mr-1 text-sm font-medium text-secondary">호가</span>
          {formatToKoreanWon(askingPrice)}
        </p>

        {/* 면적/층/동 */}
        <div className="flex flex-wrap items-center gap-x-1.5 text-[13px] text-secondary">
          {area != null && (
            <>
              <span>
                {area}m<sup>2</sup> ({sqmToPyeong(area)}평)
              </span>
              <span className="text-border">·</span>
            </>
          )}
          {floor != null && (
            <>
              <span>{floor}층</span>
              <span className="text-border">·</span>
            </>
          )}
          <span>{dongName}</span>
        </div>

        {/* 여유/부족 */}
        <div className="mt-0.5">
          <Badge variant={isAffordable ? "success" : "danger"}>
            {isAffordable ? "여유" : "부족"}{" "}
            {formatToKoreanWon(Math.abs(diff))}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
