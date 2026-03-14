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
 * 숫자를 콤마 포맷팅
 */
export function formatWithComma(value: number): string {
  return value.toLocaleString('ko-KR');
}
