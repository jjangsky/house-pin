import { Card, Skeleton } from "@/components/common";

export default function Loading() {
  return (
    <div className="py-8">
      <div className="mb-8">
        <Skeleton height="28px" width="50%" />
        <Skeleton height="18px" width="70%" className="mt-3" />
      </div>

      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <div className="flex flex-col gap-3">
              <Skeleton height="20px" width="60%" />
              <Skeleton height="24px" width="40%" />
              <Skeleton height="16px" width="80%" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
