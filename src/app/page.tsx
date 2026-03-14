import Link from "next/link";

import { Button } from "@/components/common";

export default function Home() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center py-20">
      <h1 className="text-center text-2xl font-bold leading-snug text-primary sm:text-[32px] sm:leading-tight">
        내 자산으로 살 수 있는 집,
        <br />
        <span className="text-accent">하우스핀</span>이 찾아드립니다
      </h1>
      <p className="mt-4 text-center text-base text-secondary">
        자산과 대출 가능 금액을 분석해 맞춤 매물을 추천합니다.
      </p>
      <Link href="/input" className="mt-10">
        <Button size="lg">시작하기</Button>
      </Link>
    </section>
  );
}
