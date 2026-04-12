"use client";

import { useState } from "react";
import Image from "next/image";

import useScrollAnimation from "@/hooks/useScrollAnimation";

const steps = [
  {
    number: "01",
    title: "자산 정보 입력",
    description:
      "연소득, 보유 현금, 기존 대출 잔액 등을 입력하면 DSR 규제와 LTV 한도를 반영해 실제 대출 가능 금액을 자동으로 계산합니다. 복잡한 금융 용어를 몰라도 괜찮아요.",
    detail: "연소득 · 보유자산 · 기존부채 · DSR",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="6"
          y="4"
          width="20"
          height="24"
          rx="3"
          stroke="currentColor"
          strokeWidth="2"
        />
        <line
          x1="10"
          y1="10"
          x2="22"
          y2="10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="10"
          y1="15"
          x2="22"
          y2="15"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="10"
          y1="20"
          x2="17"
          y2="20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    number: "02",
    title: "대출 한도 분석",
    description:
      "금융감독원 공시 데이터를 기반으로 15개 이상 은행의 주담대 금리를 한눈에 비교합니다. 은행별 예상 월 이자와 대출 한도까지 자동으로 계산해드려요.",
    detail: "은행별 금리 · 월 이자 · 대출한도",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="2" />
        <path
          d="M16 9v7l5 3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    number: "03",
    title: "선호 지역 선택",
    description:
      "살고 싶은 지역을 시·구·동 단위로 선택하세요. 국토교통부 실거래가 데이터를 기반으로 해당 지역의 최근 거래 시세와 평균 가격대를 분석합니다.",
    detail: "시·구·동 선택 · 실거래 시세",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 4C11.58 4 8 7.58 8 12c0 6 8 16 8 16s8-10 8-16c0-4.42-3.58-8-8-8z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="16" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "맞춤 매물 추천",
    description:
      "보유 자산 + 대출 가능액으로 산출된 총 구매력을 기준으로, 선택한 지역에서 실제 거래된 매물 중 구매 가능한 매물만 필터링해서 보여드립니다.",
    detail: "구매력 매칭 · 실거래 매물 · 면적·가격",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5 16l11-11 11 11"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8 14v11a2 2 0 002 2h12a2 2 0 002-2V14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function HowItWorksSection() {
  const sectionRef = useScrollAnimation();
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <section
      id="how-it-works"
      className="landing-full-width bg-surface py-20 sm:py-28"
      ref={sectionRef}
    >
      <div className="mx-auto max-w-[640px] px-4">
        <div className="scroll-hidden mb-8 text-center">
          <p className="mb-2 text-sm font-medium text-accent">이용 방법</p>
          <h2 className="text-2xl font-bold text-primary sm:text-[28px]">
            복잡한 건 저희가 할게요
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-secondary sm:text-base">
            자산 분석부터 매물 추천까지, 입력만 하면 알아서 계산합니다
          </p>
        </div>

        {/* Steps flow illustration */}
        <div className="scroll-hidden mx-auto mb-10 max-w-[420px]">
          <Image
            src="/images/steps-flow.png"
            alt="4단계 프로세스 플로우"
            width={840}
            height={473}
            className="rounded-[12px]"
          />
        </div>

        <div className="relative flex flex-col gap-0">
          {/* Vertical connecting line */}
          <div className="absolute left-6 top-6 bottom-6 w-px bg-border sm:left-[30px]" />

          {steps.map((step, index) => (
            <div
              key={step.number}
              className="scroll-hidden relative"
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <button
                type="button"
                className="group flex w-full items-start gap-5 rounded-[16px] p-4 text-left transition-all duration-300 hover:bg-white sm:p-5"
                onClick={() =>
                  setActiveStep(activeStep === index ? null : index)
                }
              >
                {/* Step indicator dot */}
                <div
                  className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                    activeStep === index
                      ? "scale-110 bg-accent text-white shadow-lg shadow-accent/20"
                      : "bg-white text-accent ring-2 ring-accent/20 group-hover:ring-accent/40"
                  }`}
                >
                  {step.icon}
                </div>

                <div className="flex-1 pt-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`text-xs font-bold transition-colors ${
                        activeStep === index
                          ? "text-accent"
                          : "text-secondary group-hover:text-accent"
                      }`}
                    >
                      STEP {step.number}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-primary">
                    {step.title}
                  </h3>
                  <p
                    className={`overflow-hidden text-sm leading-relaxed text-secondary transition-all duration-300 ${
                      activeStep === index
                        ? "mt-2 max-h-24 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    {step.description}
                  </p>
                  <div
                    className={`mt-2 inline-flex items-center gap-1 text-xs font-medium transition-all duration-300 ${
                      activeStep === index
                        ? "text-accent"
                        : "text-secondary/60"
                    }`}
                  >
                    {step.detail}
                  </div>
                </div>

                {/* Expand indicator */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`mt-2 shrink-0 text-secondary transition-transform duration-300 ${
                    activeStep === index ? "rotate-180" : ""
                  }`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
