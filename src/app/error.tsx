"use client";

import { Button } from "@/components/common";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-20">
      <p className="text-[40px] font-bold text-primary">!</p>
      <h2 className="mt-4 text-xl font-bold text-primary">
        문제가 발생했습니다
      </h2>
      <p className="mt-2 text-center text-base text-secondary">
        {error.message || "알 수 없는 오류가 발생했습니다."}
      </p>
      <Button
        variant="secondary"
        size="md"
        className="mt-8"
        onClick={reset}
      >
        다시 시도
      </Button>
    </div>
  );
}
