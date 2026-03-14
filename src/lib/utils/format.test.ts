import { describe, it, expect } from 'vitest';
import { formatToKoreanWon, formatWithComma } from './format';

describe('formatToKoreanWon', () => {
  it('0 -> "0원"', () => {
    expect(formatToKoreanWon(0)).toBe('0원');
  });

  it('500 -> "500만 원"', () => {
    expect(formatToKoreanWon(500)).toBe('500만 원');
  });

  it('1000 -> "1,000만 원"', () => {
    expect(formatToKoreanWon(1000)).toBe('1,000만 원');
  });

  it('10000 -> "1억 원"', () => {
    expect(formatToKoreanWon(10000)).toBe('1억 원');
  });

  it('10500 -> "1억 500만 원"', () => {
    expect(formatToKoreanWon(10500)).toBe('1억 500만 원');
  });

  it('42000 -> "4억 2,000만 원"', () => {
    expect(formatToKoreanWon(42000)).toBe('4억 2,000만 원');
  });

  it('100000 -> "10억 원"', () => {
    expect(formatToKoreanWon(100000)).toBe('10억 원');
  });

  it('123456 -> "12억 3,456만 원"', () => {
    expect(formatToKoreanWon(123456)).toBe('12억 3,456만 원');
  });
});

describe('formatWithComma', () => {
  it('0 -> "0"', () => {
    expect(formatWithComma(0)).toBe('0');
  });

  it('1000 -> "1,000"', () => {
    expect(formatWithComma(1000)).toBe('1,000');
  });

  it('1234567 -> "1,234,567"', () => {
    expect(formatWithComma(1234567)).toBe('1,234,567');
  });
});
