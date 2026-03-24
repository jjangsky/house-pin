"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge, Button } from "@/components/common";
import { formatToKoreanWon, sqmToPyeong } from "@/lib/utils/format";
import { useHousePinStore } from "@/store/useHousePinStore";
import { liveListingToProperty } from "@/lib/utils/listingAdapter";
import { calculatePropertyAffordability } from "@/lib/calculation/affordability";
import { comparePrices } from "@/lib/calculation/priceComparison";
import type { LiveListing } from "@/types/listing";

import ImageGallery from "./ImageGallery";
import AffordabilityAnalysis from "./AffordabilityAnalysis";
import TaxBreakdownCard from "./TaxBreakdownCard";
import PropertyTaxCard from "./PropertyTaxCard";
import RecommendedLoanProducts from "./RecommendedLoanProducts";
import MonthlyPaymentSimulation from "./MonthlyPaymentSimulation";
import ComplexInfoCard from "./ComplexInfoCard";
import FloorPlanViewer from "./FloorPlanViewer";
import SchoolInfoCard from "./SchoolInfoCard";
import AreaPriceComparisonCard from "./AreaPriceComparisonCard";
import PremiumRateBadge from "../PremiumRateBadge";
import { useComplexDetail } from "@/lib/hooks/useComplexDetail";

const PROPERTY_TYPE_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  apartment: { label: "아파트", className: "bg-accent-light text-accent" },
  villa: { label: "빌라", className: "bg-warning-light text-warning" },
  officetel: { label: "오피스텔", className: "bg-[#F3EEFF] text-[#7B61FF]" },
};

interface LiveDetailViewProps {
  listing: LiveListing;
}

export default function LiveDetailView({ listing }: LiveDetailViewProps) {
  const router = useRouter();
  const loanResult = useHousePinStore((s) => s.loanResult);
  const assetInput = useHousePinStore((s) => s.assetInput);
  const properties = useHousePinStore((s) => s.properties);

  const affordablePrice = loanResult?.affordablePrice ?? 0;

  // 단지 상세 (complexId가 있을 때만 fetch)
  const { data: complexDetail } = useComplexDetail(listing.complexId ?? null);

  const propertyLike = useMemo(
    () => liveListingToProperty(listing),
    [listing],
  );

  const affordability = useMemo(() => {
    if (!loanResult) return null;
    return calculatePropertyAffordability(propertyLike, assetInput, loanResult);
  }, [propertyLike, assetInput, loanResult]);

  const priceComparison = useMemo(
    () => comparePrices(listing, properties),
    [listing, properties],
  );

  const typeConfig = PROPERTY_TYPE_CONFIG[listing.propertyType] ?? {
    label: listing.propertyType,
    className: "bg-surface text-secondary",
  };

  const diff = affordablePrice - listing.askingPrice;
  const isAffordable = diff >= 0;

  return (
    <div className="flex flex-col gap-6">
      {/* 이미지 갤러리 */}
      {listing.imgUrlList.length > 0 && (
        <ImageGallery
          images={listing.imgUrlList}
          altText={listing.name}
        />
      )}

      {/* 기본 정보 헤더 */}
      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-[6px] bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
              현재 매물
            </span>
            <span
              className={`rounded-[6px] px-2 py-0.5 text-xs font-semibold ${typeConfig.className}`}
            >
              {typeConfig.label}
            </span>
            {listing.isOwnerAuth && (
              <span className="rounded-[6px] bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                집주인
              </span>
            )}
            {listing.isPano && (
              <span className="rounded-[6px] bg-surface px-2 py-0.5 text-xs font-semibold text-secondary">
                VR
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold leading-tight text-primary">
            {listing.name}
          </h1>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="text-sm text-secondary">호가</span>
              <p className="text-[32px] font-bold leading-none text-accent">
                {formatToKoreanWon(listing.askingPrice)}
              </p>
            </div>
            <Badge variant={isAffordable ? "success" : "danger"}>
              {isAffordable ? "여유" : "부족"}{" "}
              {formatToKoreanWon(Math.abs(diff))}
            </Badge>
          </div>

          {/* 시세 비교 */}
          {priceComparison.recentDealPrice && (
            <div className="flex items-center gap-2 text-sm text-secondary">
              <span>
                최근 실거래 {formatToKoreanWon(priceComparison.recentDealPrice)}
              </span>
              <PremiumRateBadge comparison={priceComparison} />
            </div>
          )}

          <div className="border-t border-border" />

          <div className="flex flex-col gap-2">
            {(listing.area != null || listing.floor != null) && (
              <p className="text-base text-secondary">
                {listing.area != null && (
                  <>
                    {listing.area}m<sup>2</sup> ({sqmToPyeong(listing.area)}평)
                  </>
                )}
                {listing.area != null && listing.floor != null && (
                  <span className="mx-1.5 text-border">·</span>
                )}
                {listing.floor != null && <>{listing.floor}층</>}
              </p>
            )}
            <p className="text-sm text-secondary">{listing.dongName}</p>
            {listing.roomTitle && (
              <p className="text-sm text-secondary/70">{listing.roomTitle}</p>
            )}
          </div>
        </div>
      </Card>

      {/* 구매 가능성 분석 */}
      {loanResult && affordability && (
        <AffordabilityAnalysis
          property={propertyLike}
          assetInput={assetInput}
          loanResult={loanResult}
        />
      )}

      {/* 세금/부대비용 */}
      <TaxBreakdownCard
        purchasePrice={listing.askingPrice}
        numberOfHomes={assetInput.numberOfHomes}
      />
      <PropertyTaxCard purchasePrice={listing.askingPrice} />

      {/* 단지 상세 (complexId 있을 때만) */}
      {complexDetail && (
        <>
          <ComplexInfoCard complex={complexDetail} />
          {complexDetail.spaces.length > 0 && (
            <FloorPlanViewer spaces={complexDetail.spaces} />
          )}
          {(complexDetail.education.elementary.length > 0 ||
            complexDetail.education.middle.length > 0 ||
            complexDetail.education.high.length > 0) && (
            <SchoolInfoCard education={complexDetail.education} />
          )}
          {complexDetail.priceComparison.length > 0 && (
            <AreaPriceComparisonCard
              priceComparison={complexDetail.priceComparison}
              nearComplexes={complexDetail.nearComplexes}
            />
          )}
        </>
      )}

      {/* 추천 대출 상품 */}
      {loanResult && affordability && (
        <RecommendedLoanProducts
          requiredLoan={affordability.requiredLoan}
          loanResult={loanResult}
          assetInput={assetInput}
        />
      )}

      {/* 월 상환 시뮬레이션 */}
      {loanResult && affordability && (
        <MonthlyPaymentSimulation
          requiredLoan={affordability.requiredLoan}
          loanTermYears={assetInput.loanTermYears}
          annualIncome={assetInput.annualIncome}
          defaultRepaymentType={assetInput.repaymentType}
        />
      )}

      {/* 하단 CTA */}
      <Button
        variant="ghost"
        fullWidth
        size="md"
        onClick={() => router.push("/properties")}
      >
        매물 리스트로 돌아가기
      </Button>
    </div>
  );
}
