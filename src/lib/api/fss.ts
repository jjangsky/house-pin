// =============================================================================
// 금감원 금융상품비교공시 API 클라이언트
// 주택담보대출 / 전세자금대출 금리 비교 데이터 조회
// =============================================================================

import { API_CONFIG } from './config';
import { MOCK_MORTGAGE_PRODUCTS, MOCK_RENT_PRODUCTS } from './mockFssData';

// =============================================================================
// 금감원 API 원본(raw) 응답 타입
// =============================================================================

interface FssLoanProduct {
  fin_co_no: string;
  fin_prdt_cd: string;
  kor_co_nm: string;
  fin_prdt_nm: string;
  join_way: string;
  loan_inci_expn: string;
  erly_rpay_fee: string;
  dly_rate: string;
  loan_lmt: string;
  dcls_month: string;
}

interface FssLoanOption {
  fin_co_no: string;
  fin_prdt_cd: string;
  mrtg_type: string;
  mrtg_type_nm: string;
  rpay_type: string;
  rpay_type_nm: string;
  lend_rate_type: string;
  lend_rate_type_nm: string;
  lend_rate_min: number;
  lend_rate_max: number;
  lend_rate_avg: number;
}

interface FssApiResponse {
  result: {
    total_count: number;
    max_page_no: number;
    now_page_no: number;
    err_cd: string;
    err_msg: string;
    baseList: FssLoanProduct[];
    optionList: FssLoanOption[];
  };
}

// =============================================================================
// 가공 후 타입
// =============================================================================

export interface BankLoanProduct {
  bankName: string;
  productName: string;
  rateType: 'fixed' | 'variable' | 'mixed';
  rateTypeName: string;
  minRate: number;
  maxRate: number;
  avgRate: number;
  repaymentType: string;
  mortgageType: string;
  loanLimit: string;
  earlyRepayFee: string;
}

export interface BankLoanSummary {
  bankName: string;
  products: BankLoanProduct[];
  lowestRate: number;
  highestRate: number;
  productCount: number;
}

// =============================================================================
// 내부 유틸
// =============================================================================

const RATE_TYPE_MAP: Record<string, BankLoanProduct['rateType']> = {
  F: 'fixed',
  C: 'variable',
  H: 'mixed',
};

/** 은행 금융권역 코드 */
const BANK_TOP_FIN_GRP_NO = '020000';

function mapRateType(code: string): BankLoanProduct['rateType'] {
  return RATE_TYPE_MAP[code] ?? 'variable';
}

/**
 * 금감원 API 원본 응답을 BankLoanProduct 배열로 변환한다.
 * baseList(상품 정보)와 optionList(금리 옵션)를 조인하여 가공.
 */
function transformFssResponse(data: FssApiResponse): BankLoanProduct[] {
  const { baseList, optionList } = data.result;

  // baseList를 key(fin_co_no + fin_prdt_cd)로 매핑
  const productMap = new Map<string, FssLoanProduct>();
  for (const product of baseList) {
    const key = `${product.fin_co_no}_${product.fin_prdt_cd}`;
    productMap.set(key, product);
  }

  // optionList 기준으로 가공 (하나의 상품에 여러 금리 옵션이 있을 수 있음)
  return optionList
    .map((option): BankLoanProduct | null => {
      const key = `${option.fin_co_no}_${option.fin_prdt_cd}`;
      const base = productMap.get(key);

      if (!base) return null;

      return {
        bankName: base.kor_co_nm,
        productName: base.fin_prdt_nm,
        rateType: mapRateType(option.lend_rate_type),
        rateTypeName: option.lend_rate_type_nm,
        minRate: option.lend_rate_min,
        maxRate: option.lend_rate_max,
        avgRate: option.lend_rate_avg,
        repaymentType: option.rpay_type_nm,
        mortgageType: option.mrtg_type_nm,
        loanLimit: base.loan_lmt ?? '',
        earlyRepayFee: base.erly_rpay_fee ?? '',
      };
    })
    .filter((item): item is BankLoanProduct => item !== null);
}

/**
 * 금감원 API에서 대출 상품 목록을 가져온다.
 * 모든 페이지를 순회하여 전체 데이터를 수집한다.
 */
async function fetchFssLoanProducts(
  endpoint: string,
): Promise<BankLoanProduct[]> {
  const apiKey = process.env.FSS_API_KEY;

  if (!apiKey) {
    console.warn(
      '[house-pin] FSS_API_KEY 미설정 — 목업 데이터를 반환합니다.',
    );
    const isMortgage = endpoint.includes('mortgage');
    return isMortgage ? MOCK_MORTGAGE_PRODUCTS : MOCK_RENT_PRODUCTS;
  }

  const baseUrl = `${API_CONFIG.FSS.BASE_URL}${endpoint}`;
  const allProducts: BankLoanProduct[] = [];
  let pageNo = 1;
  let maxPageNo = 1;

  do {
    const url = new URL(baseUrl);
    url.searchParams.set('auth', apiKey);
    url.searchParams.set('topFinGrpNo', BANK_TOP_FIN_GRP_NO);
    url.searchParams.set('pageNo', String(pageNo));

    const response = await fetch(url.toString(), {
      next: { revalidate: 86400 },
      headers: { 'User-Agent': 'Mozilla/5.0 house-pin/1.0' },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '(응답 본문 읽기 실패)');
      console.error(`[fss] API 요청 실패: status=${response.status}, endpoint=${endpoint}, body=${body.substring(0, 500)}`);
      throw new Error(
        `금감원 API 요청 실패: ${response.status} ${response.statusText}`,
      );
    }

    const data: FssApiResponse = await response.json();

    if (data.result.err_cd !== '000') {
      throw new Error(
        `금감원 API 오류: [${data.result.err_cd}] ${data.result.err_msg}`,
      );
    }

    maxPageNo = data.result.max_page_no;
    const products = transformFssResponse(data);
    allProducts.push(...products);
    pageNo++;
  } while (pageNo <= maxPageNo);

  return allProducts;
}

// =============================================================================
// Public API
// =============================================================================

/**
 * 주택담보대출 상품 목록을 조회한다.
 */
export async function fetchMortgageLoanProducts(): Promise<BankLoanProduct[]> {
  return fetchFssLoanProducts(API_CONFIG.FSS.ENDPOINTS.MORTGAGE_LOAN);
}

/**
 * 전세자금대출 상품 목록을 조회한다.
 */
export async function fetchRentLoanProducts(): Promise<BankLoanProduct[]> {
  return fetchFssLoanProducts(API_CONFIG.FSS.ENDPOINTS.JEONSE_LOAN);
}

/**
 * 상품 목록을 은행별로 그룹핑하여 요약 정보를 반환한다.
 */
export function groupByBank(products: BankLoanProduct[]): BankLoanSummary[] {
  const bankMap = new Map<string, BankLoanProduct[]>();

  for (const product of products) {
    const existing = bankMap.get(product.bankName);
    if (existing) {
      existing.push(product);
    } else {
      bankMap.set(product.bankName, [product]);
    }
  }

  return Array.from(bankMap.entries()).map(
    ([bankName, bankProducts]): BankLoanSummary => {
      const rates = bankProducts.flatMap((p) => [p.minRate, p.maxRate]);

      return {
        bankName,
        products: bankProducts,
        lowestRate: Math.min(...rates),
        highestRate: Math.max(...rates),
        productCount: bankProducts.length,
      };
    },
  );
}

/**
 * 금리 유형별로 상품을 필터링한다.
 */
export function filterByRateType(
  products: BankLoanProduct[],
  type: 'fixed' | 'variable' | 'mixed',
): BankLoanProduct[] {
  return products.filter((product) => product.rateType === type);
}

/**
 * 은행 요약 목록을 최저 금리 오름차순으로 정렬한다.
 */
export function sortByLowestRate(
  summaries: BankLoanSummary[],
): BankLoanSummary[] {
  return [...summaries].sort((a, b) => a.lowestRate - b.lowestRate);
}
