import { Card } from "@/components/common";
import type { ComplexDetail } from "@/types/listing";

interface SchoolInfoCardProps {
  education: ComplexDetail["education"];
}

interface SchoolRow {
  name: string;
  distance: number;
  walkMinutes: number;
  avgStudents: string;
}

function toRows(
  schools: { name: string; distance: number; avgStudents: string }[],
  max = 3,
): SchoolRow[] {
  return schools
    .sort((a, b) => a.distance - b.distance)
    .slice(0, max)
    .map((s) => ({
      ...s,
      walkMinutes: Math.ceil(s.distance / 80),
    }));
}

function SchoolSection({
  title,
  rows,
}: {
  title: string;
  rows: SchoolRow[];
}) {
  if (rows.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-primary">{title}</p>
      {rows.map((school) => (
        <div
          key={school.name}
          className="flex items-center justify-between pl-2"
        >
          <span className="text-sm text-primary">{school.name}</span>
          <span className="text-xs text-secondary">
            도보 {school.walkMinutes}분 ({school.distance}m)
            {school.avgStudents && (
              <span className="ml-2">{school.avgStudents}/반</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function SchoolInfoCard({ education }: SchoolInfoCardProps) {
  const elementary = toRows(education.elementary);
  const middle = toRows(education.middle);
  const high = toRows(education.high);

  if (elementary.length === 0 && middle.length === 0 && high.length === 0) {
    return null;
  }

  return (
    <Card title="주변 학교">
      <div className="flex flex-col gap-4">
        <SchoolSection title="초등학교" rows={elementary} />
        <SchoolSection title="중학교" rows={middle} />
        <SchoolSection title="고등학교" rows={high} />
      </div>
    </Card>
  );
}
