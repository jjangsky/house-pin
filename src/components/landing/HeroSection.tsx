"use client";

import Image from "next/image";

import useTypingAnimation from "@/hooks/useTypingAnimation";

export default function HeroSection() {
  const typedText = useTypingAnimation(
    ["아파트", "오피스텔", "빌라", "내 첫 집"],
    100,
    50,
    2200
  );

  const scrollToNext = () => {
    const el = document.getElementById("how-it-works");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="landing-full-width relative flex min-h-[calc(100vh-56px)] flex-col items-center justify-center py-16">
      <div className="mx-auto max-w-[640px] px-4 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent-light px-4 py-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
          <span className="text-sm font-medium text-accent">
            자산 기반 부동산 매물 추천
          </span>
        </div>

        <h1 className="text-[28px] font-bold leading-snug text-primary sm:text-[40px] sm:leading-tight">
          내 자산으로 살 수 있는
          <br />
          <span className="inline-block min-w-[120px] text-accent">
            {typedText}
            <span className="animate-blink">|</span>
          </span>
          <br />
          <span className="text-primary">찾아보세요</span>
        </h1>

        <p className="mt-5 text-base leading-relaxed text-secondary sm:text-lg">
          보유 자산과 대출 가능액을 분석해
          <br className="sm:hidden" />
          {" "}맞춤 매물을 추천합니다
        </p>

        {/* Hero illustration */}
        <div className="mx-auto mt-10 max-w-[480px]">
          <Image
            src="/images/hero-illustration.png"
            alt="하우스핀 서비스 일러스트레이션"
            width={960}
            height={540}
            className="rounded-[16px]"
            priority
          />
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-secondary">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1l2.5 5 5.5.8-4 3.9.9 5.3L8 13.3 3.1 16l.9-5.3-4-3.9L5.5 6z"
                fill="#3182F6"
              />
            </svg>
            <span>금감원 공시 데이터</span>
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1l2.5 5 5.5.8-4 3.9.9 5.3L8 13.3 3.1 16l.9-5.3-4-3.9L5.5 6z"
                fill="#3182F6"
              />
            </svg>
            <span>국토부 실거래가</span>
          </div>
        </div>
      </div>

      <button
        onClick={scrollToNext}
        className="group absolute right-5 top-1/2 -translate-y-1/2 sm:right-10"
        aria-label="아래로 스크롤"
      >
        <div className="flex flex-col items-center gap-4">
          <span className="text-[11px] font-medium tracking-[0.15em] text-secondary/60 transition-colors group-hover:text-accent [writing-mode:vertical-rl]">
            SCROLL
          </span>
          <div className="relative h-12 w-px overflow-hidden bg-border/50">
            <div className="scroll-line-anim absolute left-0 top-0 h-5 w-px bg-accent" />
          </div>
        </div>
      </button>
    </section>
  );
}
