"use client";

import { BackButton } from "@/components/common";
import UpgradeSimulatorCard from "@/components/result/UpgradeSimulatorCard";

export default function UpgradePage() {
  return (
    <main className="mx-auto max-w-lg px-5 pb-12">
      {/* Back + title */}
      <div className="mt-4 mb-6 flex items-center gap-3">
        <BackButton />
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
