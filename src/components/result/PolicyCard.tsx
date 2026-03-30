"use client";

import { useState } from "react";
import { Card } from "@/components/common";
import PolicyLoanContent from "./PolicyLoanContent";
import PolicyBenefitContent from "./PolicyBenefitContent";

type TabKey = "loan" | "benefit";

interface Tab {
  key: TabKey;
  label: string;
}

const TABS: Tab[] = [
  { key: "loan", label: "정책 대출" },
  { key: "benefit", label: "정책 혜택" },
];

export default function PolicyCard() {
  const [activeTab, setActiveTab] = useState<TabKey>("loan");

  return (
    <Card>
      <h3 className="mb-3 text-lg font-semibold text-primary">정책 지원</h3>

      {/* 탭 바 */}
      <div className="mb-4 flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-accent text-white"
                : "bg-surface text-secondary hover:text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === "loan" ? <PolicyLoanContent /> : <PolicyBenefitContent />}
    </Card>
  );
}
