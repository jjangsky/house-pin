import { Card } from "@/components/common";
import type { ComplexDetail } from "@/types/listing";

interface ComplexInfoCardProps {
  complex: ComplexDetail;
}

const INFO_ITEMS: {
  label: string;
  getValue: (c: ComplexDetail) => string;
}[] = [
  { label: "사용승인", getValue: (c) => c.useApprovalYear ? `${c.useApprovalYear}년` : "-" },
  { label: "세대수", getValue: (c) => c.householdNum ? `${c.householdNum}세대` : "-" },
  { label: "주차", getValue: (c) => c.parkingAverage ? `${c.parkingAverage}대/세대` : "-" },
  { label: "시공사", getValue: (c) => c.providerName || "-" },
  { label: "난방", getValue: (c) => c.heatTypeName || "-" },
  { label: "연료", getValue: (c) => c.fuelTypeName || "-" },
];

export default function ComplexInfoCard({ complex }: ComplexInfoCardProps) {
  return (
    <Card title="단지 정보">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          {INFO_ITEMS.map((item) => (
            <div key={item.label} className="rounded-[10px] bg-surface px-3 py-2.5">
              <p className="text-xs text-secondary">{item.label}</p>
              <p className="mt-0.5 text-sm font-semibold text-primary">
                {item.getValue(complex)}
              </p>
            </div>
          ))}
        </div>
        {complex.roadAddress && (
          <p className="text-sm text-secondary">{complex.roadAddress}</p>
        )}
      </div>
    </Card>
  );
}
