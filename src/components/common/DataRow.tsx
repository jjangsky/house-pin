import { formatWon } from "@/lib/utils/format";

interface DataRowProps {
  label: string;
  value: number;
  bold?: boolean;
  sub?: boolean;
  negative?: boolean;
  suffix?: string;
}

export default function DataRow({
  label,
  value,
  bold = false,
  sub = false,
  negative = false,
  suffix = "",
}: DataRowProps) {
  const formatted = `${negative ? "-" : ""}${formatWon(Math.abs(value))}${suffix}`;

  return (
    <div
      className={`flex items-center justify-between ${sub ? "pl-3" : ""}`}
    >
      <span className="text-sm text-secondary">
        {label}
      </span>
      <span
        className={`text-sm ${
          bold
            ? "font-bold text-primary"
            : sub
              ? "font-semibold text-secondary"
              : "font-semibold text-primary"
        }`}
      >
        {formatted}
      </span>
    </div>
  );
}
