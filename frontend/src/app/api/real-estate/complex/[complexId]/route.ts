// =============================================================================
// 단지 상세 조회 API Route
// GET /api/real-estate/complex/:complexId
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { fetchComplexDetail } from '@/lib/api/complexClient';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ complexId: string }> },
) {
  const { complexId } = await params;

  // 파라미터 검증
  if (!complexId || typeof complexId !== 'string' || complexId.trim() === '') {
    return NextResponse.json(
      { error: 'complexId가 필요합니다.' },
      { status: 400 },
    );
  }

  // 환경변수 체크
  if (!process.env.LISTING_API_BASE_URL) {
    return NextResponse.json(
      { error: '매물 API가 설정되지 않았습니다.' },
      { status: 503 },
    );
  }

  try {
    const detail = await fetchComplexDetail(complexId);

    // 이름이 비어있으면 단지를 찾지 못한 것으로 판단
    if (!detail.name) {
      return NextResponse.json(
        { error: '해당 단지를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    return NextResponse.json(detail, {
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : '단지 상세 조회 중 오류가 발생했습니다.';

    console.error('[complex-route] 오류:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
