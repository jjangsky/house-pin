// =============================================================================
// 매물 일괄 조회 API Route
// 클라이언트에서 1회 호출 → 서버에서 전체 병렬 처리
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { fetchPropertiesBatch } from '@/lib/api/batchProperties';

interface BatchRequestBody {
  regionCodes: string[];
  types: ('apt' | 'villa' | 'officetel')[];
  months: number;
  maxPrice: number;
}

const VALID_TYPES = new Set(['apt', 'villa', 'officetel']);

export async function POST(request: NextRequest) {
  let body: BatchRequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: '유효한 JSON 본문이 필요합니다.' },
      { status: 400 },
    );
  }

  const { regionCodes, types, months, maxPrice } = body;

  // 유효성 검증
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

  if (!Array.isArray(types) || types.length === 0 || types.some((t) => !VALID_TYPES.has(t))) {
    return NextResponse.json(
      { error: 'types는 apt, villa, officetel 중 하나여야 합니다.' },
      { status: 400 },
    );
  }

  if (typeof months !== 'number' || months < 1 || months > 12) {
    return NextResponse.json(
      { error: 'months는 1~12 사이 숫자여야 합니다.' },
      { status: 400 },
    );
  }

  if (typeof maxPrice !== 'number' || maxPrice <= 0) {
    return NextResponse.json(
      { error: 'maxPrice는 양수여야 합니다.' },
      { status: 400 },
    );
  }

  try {
    const result = await fetchPropertiesBatch({
      regionCodes,
      types,
      monthCount: months,
      maxPrice,
    });

    return NextResponse.json({
      data: result.properties,
      meta: result.meta,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : '매물 일괄 조회 중 오류가 발생했습니다.';

    console.error('[batch-route] 오류:', message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
