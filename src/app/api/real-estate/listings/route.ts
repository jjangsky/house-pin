// =============================================================================
// 실시간 매물 일괄 조회 API Route
// 클라이언트에서 1회 호출 → 서버에서 외부 API 병렬 처리
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveListingsBatch } from '@/lib/api/listingClient';

const VALID_CATEGORIES = new Set(['apt', 'officetel', 'house']);

export async function POST(request: NextRequest) {
  let body: { regionCodes: string[]; categories: string[]; maxPrice: number };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: '유효한 JSON 본문이 필요합니다.' },
      { status: 400 },
    );
  }

  const { regionCodes, categories, maxPrice } = body;

  if (!Array.isArray(regionCodes) || regionCodes.length === 0) {
    return NextResponse.json(
      { error: 'regionCodes 배열이 필요합니다.' },
      { status: 400 },
    );
  }

  if (regionCodes.length > 10) {
    return NextResponse.json(
      { error: 'regionCodes는 최대 10개까지 지원합니다.' },
      { status: 400 },
    );
  }

  if (regionCodes.some((code) => !/^\d{5}$/.test(code))) {
    return NextResponse.json(
      { error: 'regionCode는 5자리 숫자여야 합니다.' },
      { status: 400 },
    );
  }

  if (
    !Array.isArray(categories) ||
    categories.length === 0 ||
    categories.some((c) => !VALID_CATEGORIES.has(c))
  ) {
    return NextResponse.json(
      { error: 'categories는 apt, officetel, house 중 하나여야 합니다.' },
      { status: 400 },
    );
  }

  if (typeof maxPrice !== 'number' || maxPrice <= 0) {
    return NextResponse.json(
      { error: 'maxPrice는 양수여야 합니다.' },
      { status: 400 },
    );
  }

  // 환경변수 체크
  if (!process.env.LISTING_API_BASE_URL) {
    return NextResponse.json({
      listings: [],
      meta: {
        totalFetched: 0,
        totalFiltered: 0,
        failedRegions: regionCodes,
        rateLimited: false,
      },
    });
  }

  try {
    const result = await fetchLiveListingsBatch({
      regionCodes,
      categories: categories as ('apt' | 'officetel' | 'house')[],
      maxPrice,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : '실시간 매물 조회 중 오류가 발생했습니다.';

    console.error('[listings-route] 오류:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
