"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/common";

const LOADING_MESSAGES = [
  "아파트 매물 검색 중...",
  "빌라 매물 검색 중...",
  "오피스텔 매물 검색 중...",
  "가격 비교 중...",
  "거의 다 됐어요!",
];

interface LoadingProgressProps {
  className?: string;
}

export default function LoadingProgress({ className }: LoadingProgressProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) =>
        prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev
      );
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const progress = ((messageIndex + 1) / LOADING_MESSAGES.length) * 100;

  return (
    <div className={className}>
      <Card>
        <div className="flex flex-col items-center gap-5 py-8">
          {/* 스피너 */}
          <div className="relative h-10 w-10">
            <div
              className="absolute inset-0 rounded-full border-[3px] border-border"
              aria-hidden
            />
            <div
              className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-accent"
              role="status"
            />
          </div>

          {/* 메시지 */}
          <p className="text-base font-medium text-secondary transition-opacity duration-300">
            {LOADING_MESSAGES[messageIndex]}
          </p>

          {/* 프로그레스 바 */}
          <div className="h-1 w-48 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
