/**
 * 만원 단위 숫자를 한글 금액 표현으로 변환
 * @param amount 만원 단위 금액 (예: 42000 = 4억 2,000만 원)
 */
export function formatToKoreanWon(amount: number): string {
  if (amount === 0) return '0원';

  const eok = Math.floor(amount / 10000);
  const man = amount % 10000;

  const parts: string[] = [];

  if (eok > 0) {
    parts.push(`${eok}억`);
  }

  if (man > 0) {
    parts.push(`${man.toLocaleString('ko-KR')}만`);
  }

  return `${parts.join(' ')} 원`;
}

/**
 * 만원 단위 숫자를 반올림 후 한글 금액 표현으로 변환 (편의 래퍼)
 * @param amount 만원 단위 금액
 */
export function formatWon(amount: number): string {
  return formatToKoreanWon(Math.round(amount));
}

/**
 * 숫자를 콤마 포맷팅
 */
export function formatWithComma(value: number): string {
  return value.toLocaleString('ko-KR');
}

/**
 * m² → 평 변환 (1평 = 3.3058m²)
 * 소수 첫째자리까지 반올림
 */
export function sqmToPyeong(sqm: number): number {
  return Math.round((sqm / 3.3058) * 10) / 10;
}

/**
 * 현재 날짜 기준 최근 N개월 YYYYMM 목록 생성
 * 예: getRecentMonths(6) → ['202603', '202602', '202601', '202512', '202511', '202510']
 */
export function getRecentMonths(count: number): string[] {
  const now = new Date();
  const months: string[] = [];

  for (let i = 0; i < count; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    months.push(`${year}${month}`);
  }

  return months;
}
