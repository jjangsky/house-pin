import Link from "next/link";

import { Button } from "@/components/common";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-20">
      <p className="text-[48px] font-bold text-secondary">404</p>
      <h2 className="mt-4 text-xl font-bold text-primary">
        페이지를 찾을 수 없습니다
      </h2>
      <p className="mt-2 text-base text-secondary">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <Link href="/" className="mt-8">
        <Button variant="primary" size="md">
          홈으로 돌아가기
        </Button>
      </Link>
    </div>
  );
}
