"use client";

import { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/common";
import { sqmToPyeong } from "@/lib/utils/format";
import type { ComplexDetail } from "@/types/listing";

interface FloorPlanViewerProps {
  spaces: ComplexDetail["spaces"];
}

export default function FloorPlanViewer({ spaces }: FloorPlanViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (spaces.length === 0) return null;

  const selected = spaces[selectedIndex];

  return (
    <Card title="평형별 정보">
      <div className="flex flex-col gap-4">
        {/* 평형 탭 */}
        <div className="flex flex-wrap gap-2">
          {spaces.map((space, i) => (
            <button
              key={space.pyeongType}
              onClick={() => setSelectedIndex(i)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                i === selectedIndex
                  ? "bg-primary text-white"
                  : "bg-surface text-secondary hover:bg-border"
              }`}
            >
              {space.pyeongType}
            </button>
          ))}
        </div>

        {/* 평면도 이미지 */}
        {selected.layoutImage ? (
          <div className="relative aspect-square w-full overflow-hidden rounded-[12px] bg-surface">
            <Image
              src={selected.layoutImage}
              alt={`${selected.pyeongType} 평면도`}
              fill
              sizes="(max-width: 640px) 100vw, 512px"
              className="object-contain"
              unoptimized
            />
          </div>
        ) : (
          <div className="flex aspect-square items-center justify-center rounded-[12px] bg-surface">
            <p className="text-sm text-secondary">평면도 없음</p>
          </div>
        )}

        {/* 면적 정보 */}
        <div className="flex flex-col gap-1.5">
          <p className="text-sm text-secondary">
            전용 {selected.roomSpace}m<sup>2</sup> ({sqmToPyeong(selected.roomSpace)}평)
            <span className="mx-1.5 text-border">·</span>
            공급 {selected.supplySpace}m<sup>2</sup> ({sqmToPyeong(selected.supplySpace)}평)
          </p>
          <p className="text-sm text-secondary">
            방 {selected.bedsNum}개
            <span className="mx-1.5 text-border">·</span>
            욕실 {selected.bathNum}개
          </p>
        </div>
      </div>
    </Card>
  );
}
