"use client";

import useScrollAnimation from "@/hooks/useScrollAnimation";
import useCountUp from "@/hooks/useCountUp";

const values = [
  {
    title: "실제 자산 기반 분석",
    description:
      "단순 시세 조회가 아닌, 보유 자산과 소득을 기반으로 실질적으로 구매 가능한 금액을 계산합니다.",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="3"
          y="6"
          width="22"
          height="16"
          rx="3"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="14" cy="14" r="4" stroke="currentColor" strokeWidth="2" />
        <line
          x1="3"
          y1="10"
          x2="25"
          y2="10"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    title: "은행별 금리 비교",
    description:
      "금융감독원 공시 데이터를 활용해 주요 은행의 주담대 금리를 한눈에 비교할 수 있습니다.",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="3"
          y="16"
          width="5"
          height="8"
          rx="1"
          stroke="currentColor"
          strokeWidth="2"
        />
        <rect
          x="11.5"
          y="10"
          width="5"
          height="14"
          rx="1"
          stroke="currentColor"
          strokeWidth="2"
        />
        <rect
          x="20"
          y="4"
          width="5"
          height="20"
          rx="1"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
  },
  {
    title: "실거래가 기반 추천",
    description:
      "국토교통부 실거래가 데이터를 기반으로 내 예산에 맞는 실제 거래된 매물 정보를 제공합니다.",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 14l10-10 10 10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7 12v10a2 2 0 002 2h10a2 2 0 002-2V12"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M11 24v-6h6v6" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
];

function StatCounter({
  target,
  suffix,
  label,
}: {
  target: number;
  suffix: string;
  label: string;
}) {
  const { count, ref } = useCountUp(target, 1800);

  return (
    <div ref={ref} className="text-center">
      <div className="text-[32px] font-bold text-accent sm:text-[40px]">
        {count.toLocaleString()}
        <span className="text-[24px] sm:text-[28px]">{suffix}</span>
      </div>
      <p className="mt-1 text-sm text-secondary">{label}</p>
    </div>
  );
}

export default function ValueSection() {
  const sectionRef = useScrollAnimation();

  return (
    <section className="landing-full-width py-20 sm:py-28" ref={sectionRef}>
      <div className="mx-auto max-w-[640px] px-4">
        <div className="scroll-hidden mb-12 text-center">
          <p className="mb-2 text-sm font-medium text-accent">
            왜 하우스핀인가요?
          </p>
          <h2 className="text-2xl font-bold text-primary sm:text-[28px]">
            데이터로 검증된 내 집 찾기
          </h2>
        </div>

        {/* Stats counter */}
        <div className="scroll-hidden mb-12 flex items-center justify-around rounded-[16px] bg-surface p-6 sm:p-8">
          <StatCounter target={15} suffix="개+" label="은행 금리 비교" />
          <div className="h-10 w-px bg-border" />
          <StatCounter target={100} suffix="만+" label="실거래 데이터" />
          <div className="h-10 w-px bg-border" />
          <StatCounter target={3} suffix="분" label="소요 시간" />
        </div>

        <div className="flex flex-col gap-4">
          {values.map((value, index) => (
            <div
              key={value.title}
              className="scroll-hidden group cursor-default rounded-[16px] border border-border bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5"
              style={{ transitionDelay: `${index * 120}ms` }}
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[12px] bg-accent-light text-accent transition-transform duration-300 group-hover:scale-110">
                {value.icon}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-primary">
                {value.title}
              </h3>
              <p className="text-sm leading-relaxed text-secondary">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
