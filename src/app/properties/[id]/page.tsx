"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/common";
import { useHousePinStore } from "@/store/useHousePinStore";
import { findPropertyBySlug } from "@/lib/utils/property";
import PropertyDetailHeader from "@/components/properties/detail/PropertyDetailHeader";

export default function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const loanResult = useHousePinStore((s) => s.loanResult);
  const properties = useHousePinStore((s) => s.properties);
  const affordablePrice = loanResult?.affordablePrice ?? 0;

  // 가드: 대출 계산 결과 없음
  if (!loanResult) {
    return (
      <main className="flex flex-col items-center justify-center py-24">
        <p className="text-lg font-semibold text-primary">
          자산 정보를 먼저 입력해주세요
        </p>
        <p className="mt-2 text-sm text-secondary">
          매물 상세를 보려면 자산 입력이 필요합니다
        </p>
        <Button
          variant="primary"
          size="md"
          className="mt-6"
          onClick={() => router.push("/input")}
        >
          자산 입력하기
        </Button>
      </main>
    );
  }

  // 가드: 매물 데이터 없음
  if (properties.length === 0) {
    return (
      <main className="flex flex-col items-center justify-center py-24">
        <p className="text-lg font-semibold text-primary">
          매물 데이터가 없습니다
        </p>
        <p className="mt-2 text-sm text-secondary">
          매물을 먼저 검색해주세요
        </p>
        <Button
          variant="primary"
          size="md"
          className="mt-6"
          onClick={() => router.push("/properties")}
        >
          매물 검색하기
        </Button>
      </main>
    );
  }

  // slug로 매물 찾기
  const property = findPropertyBySlug(properties, id);

  if (!property) {
    return (
      <main className="flex flex-col items-center justify-center py-24">
        <p className="text-lg font-semibold text-primary">
          매물을 찾을 수 없습니다
        </p>
        <p className="mt-2 text-sm text-secondary">
          매물 목록에서 다시 선택해주세요
        </p>
        <Button
          variant="primary"
          size="md"
          className="mt-6"
          onClick={() => router.push("/properties")}
        >
          매물 목록으로
        </Button>
      </main>
    );
  }

  return (
    <main className="pb-12">
      {/* 헤더: 뒤로가기 */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-[10px] text-secondary transition-colors hover:bg-surface active:bg-border"
          aria-label="뒤로가기"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12.5 15L7.5 10L12.5 5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-primary">매물 상세</h2>
      </div>

      {/* 섹션들 */}
      <div className="flex flex-col gap-6">
        {/* Section 1: 매물 기본 정보 */}
        <PropertyDetailHeader
          property={property}
          affordablePrice={affordablePrice}
        />

        {/* Section 2~6: 후속 커밋에서 추가 */}
      </div>

      {/* 하단 CTA */}
      <div className="mt-10">
        <Button
          variant="ghost"
          fullWidth
          size="md"
          onClick={() => router.push("/properties")}
        >
          매물 리스트로 돌아가기
        </Button>
      </div>
    </main>
  );
}
