"use client";

import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/common";
import useScrollAnimation from "@/hooks/useScrollAnimation";

export default function CtaSection() {
  const sectionRef = useScrollAnimation();

  return (
    <section
      className="landing-full-width scroll-hidden bg-surface py-20 sm:py-28"
      ref={sectionRef}
    >
      {/* Map illustration with overlay */}
      <div className="relative">
        <Image
          src="/images/cta-map.png"
          alt="지도 위 매물 위치"
          width={1280}
          height={720}
          className="h-auto w-full object-cover"
        />

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#F2F4F6] via-[#F2F4F6]/70 to-transparent" />

        {/* Pulsing center pin */}
        <div className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2">
          <div className="cta-ping absolute inset-0 rounded-full bg-accent/20" />
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-accent shadow-lg shadow-accent/30">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                fill="white"
              />
              <circle cx="12" cy="9" r="2.5" fill="#3182F6" />
            </svg>
          </div>
        </div>
      </div>

      {/* CTA content */}
      <div className="mx-auto max-w-[640px] px-4 pt-2 text-center">
        <h2 className="text-2xl font-bold leading-tight text-primary sm:text-[32px]">
          지금 바로
          <br />
          내 집을 찾아보세요
        </h2>
        <p className="mt-3 text-base leading-relaxed text-secondary sm:text-lg">
          3분이면 내 자산으로 살 수 있는 집을 확인할 수 있어요
        </p>

        <Link
          href="/input"
          className="mt-8 inline-block sm:mt-10"
          aria-label="자산 입력 시작하기"
        >
          <Button
            size="lg"
            className="cta-pulse-btn px-14 py-5 text-lg shadow-lg shadow-accent/20"
          >
            시작하기
          </Button>
        </Link>

        <p className="mt-4 text-xs text-secondary">
          회원가입 없이 바로 이용 가능
        </p>
      </div>
    </section>
  );
}
