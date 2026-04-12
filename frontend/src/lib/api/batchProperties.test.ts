import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { RealEstateTransaction } from '@/lib/api/molit';

// 모킹
vi.mock('@/lib/api/molit', () => ({
  fetchAptTrade: vi.fn(),
  fetchVillaTrade: vi.fn(),
  fetchOfficeTrade: vi.fn(),
}));

vi.mock('@/lib/api/kakao', () => ({
  batchGeocode: vi.fn().mockResolvedValue(new Map()),
  buildAddress: vi.fn(
    (sigungu: string, dong: string, jibun: string) =>
      `${sigungu} ${dong} ${jibun}`,
  ),
}));

vi.mock('@/constants/regions', () => ({
  getRegionBySigunguCode: vi.fn().mockReturnValue({
    sido: '서울특별시',
    sigungu: '강남구',
  }),
}));

import { fetchAptTrade, fetchVillaTrade, fetchOfficeTrade } from '@/lib/api/molit';
import { fetchPropertiesBatch } from './batchProperties';

// =============================================================================
// 테스트 데이터
// =============================================================================

function makeTx(overrides: Partial<RealEstateTransaction> = {}): RealEstateTransaction {
  return {
    dealAmount: 80000,
    buildYear: 2020,
    dealYear: 2026,
    dealMonth: 3,
    dealDay: 10,
    dong: '역삼동',
    aptName: '테스트아파트',
    area: 59.9,
    floor: 5,
    jibun: '725',
    regionCode: '11680',
    cancelDealType: '',
    dealType: '중개거래',
    ...overrides,
  };
}

// =============================================================================
// 테스트
// =============================================================================

describe('fetchPropertiesBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 기본: 모든 API가 빈 배열 반환
    vi.mocked(fetchAptTrade).mockResolvedValue([]);
    vi.mocked(fetchVillaTrade).mockResolvedValue([]);
    vi.mocked(fetchOfficeTrade).mockResolvedValue([]);
  });

  it('구매력 범위 내 매물만 반환한다', async () => {
    vi.mocked(fetchAptTrade).mockResolvedValue([
      makeTx({ dealAmount: 50000, aptName: '저렴한매물' }),
      makeTx({ dealAmount: 150000, aptName: '비싼매물' }),
    ]);

    const result = await fetchPropertiesBatch({
      regionCodes: ['11680'],
      types: ['apt'],
      monthCount: 1,
      maxPrice: 100000,
    });

    expect(result.properties).toHaveLength(1);
    expect(result.properties[0].name).toBe('저렴한매물');
  });

  it('거래 취소 건을 제외한다', async () => {
    vi.mocked(fetchAptTrade).mockResolvedValue([
      makeTx({ aptName: '정상거래' }),
      makeTx({ aptName: '취소거래', cancelDealType: 'O' }),
    ]);

    const result = await fetchPropertiesBatch({
      regionCodes: ['11680'],
      types: ['apt'],
      monthCount: 1,
      maxPrice: 999999,
    });

    expect(result.properties).toHaveLength(1);
    expect(result.properties[0].name).toBe('정상거래');
  });

  it('여러 지역을 동시에 처리한다', async () => {
    vi.mocked(fetchAptTrade).mockResolvedValue([makeTx()]);

    const result = await fetchPropertiesBatch({
      regionCodes: ['11680', '11650'],
      types: ['apt'],
      monthCount: 1,
      maxPrice: 999999,
    });

    // 2지역 × 1유형 × 1개월 = 2회 호출
    expect(fetchAptTrade).toHaveBeenCalledTimes(2);
    expect(result.properties).toHaveLength(2);
  });

  it('여러 유형을 동시에 처리한다', async () => {
    vi.mocked(fetchAptTrade).mockResolvedValue([makeTx({ aptName: '아파트' })]);
    vi.mocked(fetchVillaTrade).mockResolvedValue([makeTx({ aptName: '빌라' })]);
    vi.mocked(fetchOfficeTrade).mockResolvedValue([makeTx({ aptName: '오피스텔' })]);

    const result = await fetchPropertiesBatch({
      regionCodes: ['11680'],
      types: ['apt', 'villa', 'officetel'],
      monthCount: 1,
      maxPrice: 999999,
    });

    expect(result.properties).toHaveLength(3);
    const types = result.properties.map((p) => p.propertyType);
    expect(types).toContain('apartment');
    expect(types).toContain('villa');
    expect(types).toContain('officetel');
  });

  it('API 호출 실패 시 다른 결과는 유지한다', async () => {
    vi.mocked(fetchAptTrade).mockResolvedValue([makeTx({ aptName: '성공매물' })]);
    vi.mocked(fetchVillaTrade).mockRejectedValue(new Error('API 오류'));
    vi.mocked(fetchOfficeTrade).mockResolvedValue([]);

    const result = await fetchPropertiesBatch({
      regionCodes: ['11680'],
      types: ['apt', 'villa', 'officetel'],
      monthCount: 1,
      maxPrice: 999999,
    });

    expect(result.properties).toHaveLength(1);
    expect(result.properties[0].name).toBe('성공매물');
    expect(result.meta.failedCalls).toBe(1);
  });

  it('최신순으로 정렬된 결과를 반환한다', async () => {
    vi.mocked(fetchAptTrade).mockResolvedValue([
      makeTx({ aptName: '오래된매물', dealYear: 2025, dealMonth: 12, dealDay: 1 }),
      makeTx({ aptName: '최신매물', dealYear: 2026, dealMonth: 3, dealDay: 15 }),
      makeTx({ aptName: '중간매물', dealYear: 2026, dealMonth: 1, dealDay: 20 }),
    ]);

    const result = await fetchPropertiesBatch({
      regionCodes: ['11680'],
      types: ['apt'],
      monthCount: 1,
      maxPrice: 999999,
    });

    expect(result.properties[0].name).toBe('최신매물');
    expect(result.properties[1].name).toBe('중간매물');
    expect(result.properties[2].name).toBe('오래된매물');
  });

  it('cancelDealType Y도 제외한다', async () => {
    vi.mocked(fetchAptTrade).mockResolvedValue([
      makeTx({ aptName: '정상', cancelDealType: '' }),
      makeTx({ aptName: '취소Y', cancelDealType: 'Y' }),
    ]);

    const result = await fetchPropertiesBatch({
      regionCodes: ['11680'],
      types: ['apt'],
      monthCount: 1,
      maxPrice: 999999,
    });

    expect(result.properties).toHaveLength(1);
    expect(result.properties[0].name).toBe('정상');
  });

  it('모든 API 호출이 실패해도 빈 결과를 반환한다', async () => {
    vi.mocked(fetchAptTrade).mockRejectedValue(new Error('실패'));
    vi.mocked(fetchVillaTrade).mockRejectedValue(new Error('실패'));
    vi.mocked(fetchOfficeTrade).mockRejectedValue(new Error('실패'));

    const result = await fetchPropertiesBatch({
      regionCodes: ['11680'],
      types: ['apt', 'villa', 'officetel'],
      monthCount: 1,
      maxPrice: 999999,
    });

    expect(result.properties).toHaveLength(0);
    expect(result.meta.failedCalls).toBe(3);
  });

  it('meta 정보를 정확히 반환한다', async () => {
    vi.mocked(fetchAptTrade).mockResolvedValue([
      makeTx({ dealAmount: 50000 }),
      makeTx({ dealAmount: 150000 }),
    ]);

    const result = await fetchPropertiesBatch({
      regionCodes: ['11680'],
      types: ['apt'],
      monthCount: 1,
      maxPrice: 100000,
    });

    expect(result.meta.totalFetched).toBe(2);
    expect(result.meta.totalFiltered).toBe(1);
    expect(result.meta.failedCalls).toBe(0);
  });
});
