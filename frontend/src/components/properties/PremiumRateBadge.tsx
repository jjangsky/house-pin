import type { PriceComparison } from "@/lib/calculation/priceComparison";

interface PremiumRateBadgeProps {
  comparison: PriceComparison;
}

function getPremiumLabel(rate: number): { label: string; className: string } {
  if (rate < -5) return { label: "급매 가능성", className: "text-success" };
  if (rate <= 5) return { label: "시세 수준", className: "text-secondary" };
  if (rate <= 15) return { label: "소폭 높음", className: "text-warning" };
  return { label: "높은 호가", className: "text-danger" };
}

export default function PremiumRateBadge({
  comparison,
}: PremiumRateBadgeProps) {
  if (comparison.premiumRate === null || comparison.matchConfidence === "none") {
    return null;
  }

  const { label, className } = getPremiumLabel(comparison.premiumRate);
  const sign = comparison.premiumRate >= 0 ? "+" : "";

  return (
    <span className={`text-xs font-medium ${className}`}>
      호가율 {sign}
      {comparison.premiumRate}% · {label}
    </span>
  );
}
