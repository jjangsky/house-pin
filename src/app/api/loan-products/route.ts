import { NextRequest, NextResponse } from 'next/server';

import {
  fetchMortgageLoanProducts,
  fetchRentLoanProducts,
  groupByBank,
  sortByLowestRate,
} from '@/lib/api/fss';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get('type') ?? 'mortgage';

  if (type !== 'mortgage' && type !== 'rent') {
    return NextResponse.json(
      { error: 'type 파라미터는 "mortgage" 또는 "rent"만 허용됩니다.' },
      { status: 400 },
    );
  }

  try {
    const products =
      type === 'mortgage'
        ? await fetchMortgageLoanProducts()
        : await fetchRentLoanProducts();

    const summaries = sortByLowestRate(groupByBank(products));

    return NextResponse.json(
      {
        type,
        totalProducts: products.length,
        banks: summaries,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
        },
      },
    );
  } catch (error) {
    console.error('[loan-products] API 조회 실패:', error);

    const message =
      error instanceof Error
        ? error.message
        : '대출 상품 조회 중 오류가 발생했습니다.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
