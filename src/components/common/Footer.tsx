export default function Footer() {
  return (
    <footer className="border-t border-border px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-[640px]">
        <div className="flex flex-col gap-1 text-center text-xs leading-relaxed text-secondary">
          <p>
            본 서비스의 계산 결과는 참고용이며, 실제 대출 심사 결과와 다를 수
            있습니다.
          </p>
          <p>정확한 대출 조건은 해당 금융기관에 직접 문의하세요.</p>
          <p className="mt-2 text-secondary/70">
            데이터 출처: 국토교통부 실거래가, 금융감독원 금융상품비교공시
          </p>
        </div>
      </div>
    </footer>
  );
}
