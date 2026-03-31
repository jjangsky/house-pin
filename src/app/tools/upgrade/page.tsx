"use client";

import { useRouter } from "next/navigation";
import UpgradeSimulatorCard from "@/components/result/UpgradeSimulatorCard";

export default function UpgradePage() {
  const router = useRouter();

  return (
    <main className="mx-auto max-w-lg px-5 pb-12">
      {/* Back + title */}
      <div className="mt-4 mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-secondary transition-colors hover:bg-border/30 hover:text-primary"
          aria-label="뒤로 가기"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M12.5 15L7.5 10L12.5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-primary">
          갈아타기 시뮬레이터
        </h1>
      </div>

      {/* Description */}
      <p className="mb-6 text-sm leading-relaxed text-secondary">
        현재 집을 매도하고 새 집으로 갈아탈 때의 실수령액과 새 구매력을
        계산합니다
      </p>

      {/* UpgradeSimulatorCard */}
      <div className="rounded-[16px] bg-background p-5 ring-1 ring-border">
        <UpgradeSimulatorCard />
      </div>
    </main>
  );
}
