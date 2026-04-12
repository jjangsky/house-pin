# house-pin v2 기능 명세서

> 작성일: 2026-03-23
> 상태: 설계 완료, 구현 대기

---

## 목차

1. [Feature 1: 세금 계산기 (Tax Calculator)](#feature-1-세금-계산기)
2. [Feature 2: 단지 상세 강화 (Complex Detail Enhancement)](#feature-2-단지-상세-강화)
3. [Feature 3: 지역 시세 대시보드 (Regional Price Dashboard)](#feature-3-지역-시세-대시보드)

---

## Feature 1: 세금 계산기

### 1.1 개요

매물 구매 시 발생하는 총 초기 비용(취득세 + 중개수수료 + 등기비용)과 보유 시 연간 재산세를 계산하여, 사용자가 "실제로 필요한 총 금액"을 파악할 수 있게 한다. 현재 앱은 매매가와 대출 한도만 비교하고 있어, 부대비용을 고려하지 않는 맹점이 있다.

### 1.2 위치 및 진입점

**매물 상세 페이지의 새 섹션**으로 추가한다. 별도 페이지가 아닌, 기존 상세 페이지(`/properties/[id]`) 흐름 안에서 노출.

```
PropertyDetailHeader (기존)
PropertyLocationMap (기존)
AffordabilityAnalysis (기존)
>>> TaxBreakdown (신규) <<<        ← 구매 가능성 분석 바로 아래
>>> TotalInitialCost (신규) <<<    ← 취득세 + 중개수수료 + 등기비용 합산
RecommendedLoanProducts (기존)
MonthlyPaymentSimulation (기존)
```

실시간 매물(`LiveDetailView`)에도 동일하게 추가한다.

### 1.3 입력 데이터

| 입력 항목 | 소스 | 비고 |
|-----------|------|------|
| 매매가 (만원) | `property.dealAmount` 또는 `listing.askingPrice` | 매물 데이터에서 자동 |
| 보유 주택수 | `assetInput.numberOfHomes` | store에서 자동 |
| 지역 유형 | `regionType` (조정/비조정) | store 또는 상수에서 결정 |
| 공시가격 비율 | 매매가 대비 추정 (기본 69%) | 상수로 관리, 향후 API 연동 가능 |

사용자에게 추가 입력을 요구하지 않는다. 모든 값은 기존 store와 매물 데이터에서 가져온다.

### 1.4 타입 정의

```typescript
// src/types/tax.ts

/** 취득세 계산 결과 */
export interface AcquisitionTaxResult {
  /** 매매가 (만원) */
  purchasePrice: number;
  /** 기본 취득세율 (%) */
  baseRate: number;
  /** 기본 취득세 (만원) */
  baseTax: number;
  /** 농어촌특별세 (만원) */
  ruralTax: number;
  /** 지방교육세 (만원) */
  localEducationTax: number;
  /** 취득세 총액 (만원) */
  totalAcquisitionTax: number;
  /** 적용된 주택수 구분 */
  homeCategory: '1주택' | '2주택_조정' | '2주택_비조정' | '3주택이상';
}

/** 재산세 계산 결과 */
export interface PropertyTaxResult {
  /** 공시가격 추정치 (만원) */
  estimatedPublicPrice: number;
  /** 과세표준 (만원) */
  taxBase: number;
  /** 재산세 (연간, 만원) */
  annualPropertyTax: number;
  /** 재산세 (월간, 만원) */
  monthlyPropertyTax: number;
  /** 도시지역분 (만원) */
  urbanTax: number;
  /** 지방교육세 (만원) */
  localEducationTax: number;
  /** 총 보유세 (연간, 만원) */
  totalAnnualHoldingTax: number;
}

/** 중개수수료 계산 결과 */
export interface BrokerageFeeResult {
  /** 매매가 (만원) */
  purchasePrice: number;
  /** 적용 요율 (%) */
  feeRate: number;
  /** 상한 요율 (%) */
  maxFeeRate: number;
  /** 중개수수료 (만원) */
  brokerageFee: number;
}

/** 등기비용 계산 결과 */
export interface RegistrationCostResult {
  /** 등록면허세 (만원) */
  registrationTax: number;
  /** 지방교육세 (만원) */
  localEducationTax: number;
  /** 인지세 (만원) */
  stampTax: number;
  /** 법무사 수수료 추정 (만원) */
  lawyerFee: number;
  /** 등기비용 총액 (만원) */
  totalRegistrationCost: number;
}

/** 총 초기비용 합산 */
export interface TotalInitialCost {
  acquisitionTax: AcquisitionTaxResult;
  propertyTax: PropertyTaxResult;
  brokerageFee: BrokerageFeeResult;
  registrationCost: RegistrationCostResult;
  /** 총 초기비용 = 취득세 + 중개수수료 + 등기비용 (만원) */
  totalUpfront: number;
  /** 실제 필요 총액 = 매매가 + 총 초기비용 (만원) */
  totalRequired: number;
}
```

### 1.5 상수 정의

```typescript
// src/constants/tax.ts

/** 취득세율 (1주택 기준) */
export const ACQUISITION_TAX_RATES = {
  /** 6억 이하 */
  TIER_1: { maxPrice: 60000, rate: 0.01 },
  /** 6억~9억 구간별 차등 */
  TIER_2: { minPrice: 60000, maxPrice: 90000 },
  /** 9억 초과 */
  TIER_3: { minPrice: 90000, rate: 0.03 },
} as const;

/** 다주택 취득세율 */
export const MULTI_HOME_ACQUISITION_RATES = {
  /** 2주택 조정지역 */
  TWO_HOMES_REGULATED: 0.08,
  /** 2주택 비조정지역 (6억 이하 1%, 6~9억 1~3%, 9억 초과 3%) */
  TWO_HOMES_NON_REGULATED: 'same_as_single',
  /** 3주택 이상 */
  THREE_OR_MORE: 0.12,
  /** 법인 */
  CORPORATION: 0.12,
} as const;

/** 농어촌특별세율 (취득세의 10%) */
export const RURAL_TAX_RATE = 0.10;

/** 지방교육세율 (취득세의 10%) */
export const LOCAL_EDUCATION_TAX_RATE = 0.10;

/** 공시가격 추정 비율 (매매가 대비) */
export const PUBLIC_PRICE_RATIO = 0.69;

/** 공정시장가액비율 (재산세 과세표준 산정) */
export const FAIR_MARKET_VALUE_RATIO = 0.60;

/** 재산세율 구간 */
export const PROPERTY_TAX_BRACKETS = [
  { maxBase: 6000,  rate: 0.001, deduction: 0 },      // 6천만원 이하: 0.1%
  { maxBase: 15000, rate: 0.0015, deduction: 3 },     // 1.5억 이하: 0.15% - 3만
  { maxBase: 30000, rate: 0.0025, deduction: 18 },    // 3억 이하: 0.25% - 18만
  { maxBase: Infinity, rate: 0.004, deduction: 63 },   // 3억 초과: 0.4% - 63만
] as const;

/** 도시지역분 (과세표준의 0.14%) */
export const URBAN_TAX_RATE = 0.0014;

/** 중개수수료 요율표 (매매 기준) */
export const BROKERAGE_FEE_TABLE = [
  { maxPrice: 5000,   rate: 0.006, maxFee: 25 },       // 5천만 이하: 0.6%, 상한 25만
  { maxPrice: 20000,  rate: 0.005, maxFee: 80 },       // 2억 이하: 0.5%, 상한 80만
  { maxPrice: 60000,  rate: 0.004, maxFee: null },      // 6억 이하: 0.4%
  { maxPrice: 90000,  rate: 0.005, maxFee: null },      // 9억 이하: 0.5%
  { maxPrice: Infinity, rate: 0.009, maxFee: null },    // 9억 초과: 0.5~0.9% (상한 0.9%)
] as const;

/** 등록면허세율 (매매가의 2%) */
export const REGISTRATION_TAX_RATE = 0.02;

/** 인지세 구간 */
export const STAMP_TAX_TABLE = [
  { maxPrice: 10000, tax: 0 },         // 1억 이하: 없음
  { maxPrice: 100000, tax: 15 },       // 10억 이하: 15만
  { maxPrice: Infinity, tax: 35 },     // 10억 초과: 35만
] as const;

/** 법무사 수수료 추정 (고정 50만원) */
export const ESTIMATED_LAWYER_FEE = 50;
```

### 1.6 계산 함수

```typescript
// src/lib/calculation/tax.ts

import type {
  AcquisitionTaxResult,
  PropertyTaxResult,
  BrokerageFeeResult,
  RegistrationCostResult,
  TotalInitialCost,
} from '@/types/tax';
import type { RegionType } from '@/constants/policy';

interface TaxCalculationInput {
  purchasePrice: number;          // 매매가 (만원)
  numberOfHomes: number;          // 기존 보유 주택수 (구매 후 기준)
  regionType: RegionType;         // 조정/비조정
}

/**
 * 취득세 계산
 *
 * 1주택 기준:
 *   - 6억 이하: 1%
 *   - 6억~9억: (매매가 * 2/3 - 3) / 매매가 * 100 → 실효세율 1~3% 선형 보간
 *     공식: 세율 = (purchasePrice(원) × 2/3억 - 3) / purchasePrice(원) × 100
 *     만원 단위 환산: 세율 = (price * 2/30000 - 3) / price → 간소화
 *   - 9억 초과: 3%
 *
 * 다주택:
 *   - 2주택 조정지역: 8%
 *   - 2주택 비조정: 1주택과 동일
 *   - 3주택 이상: 12%
 *
 * 부가세:
 *   - 농어촌특별세: 취득세의 10% (전용 85m2 초과 시만, 여기선 일괄 적용)
 *   - 지방교육세: 취득세의 10%
 */
export function calculateAcquisitionTax(input: TaxCalculationInput): AcquisitionTaxResult;

/**
 * 재산세 계산 (연간)
 *
 * 1. 공시가격 추정 = 매매가 × PUBLIC_PRICE_RATIO (69%)
 * 2. 과세표준 = 공시가격 × FAIR_MARKET_VALUE_RATIO (60%)
 * 3. 재산세 = 과세표준 × 구간별 세율 - 누진공제
 * 4. 도시지역분 = 과세표준 × 0.14%
 * 5. 지방교육세 = 재산세 × 20%
 * 6. 총 보유세 = 재산세 + 도시지역분 + 지방교육세
 */
export function calculatePropertyTax(purchasePrice: number): PropertyTaxResult;

/**
 * 중개수수료 계산
 *
 * 매매가 구간별 요율 적용, 상한 있으면 상한 적용
 */
export function calculateBrokerageFee(purchasePrice: number): BrokerageFeeResult;

/**
 * 등기비용 계산
 *
 * 1. 등록면허세 = 매매가 × 2%
 * 2. 지방교육세 = 등록면허세 × 20%
 * 3. 인지세 = 구간별 고정금액
 * 4. 법무사 수수료 = 50만원 추정
 */
export function calculateRegistrationCost(purchasePrice: number): RegistrationCostResult;

/**
 * 총 초기비용 통합 계산
 *
 * 매물 상세 페이지에서 한 번에 호출하는 진입점 함수.
 * totalUpfront = 취득세총액 + 중개수수료 + 등기비용총액
 * totalRequired = 매매가 + totalUpfront
 */
export function calculateTotalInitialCost(input: TaxCalculationInput): TotalInitialCost;
```

**6억~9억 구간 취득세 선형 보간 공식 상세:**

```
// 만원 단위 price에 대해
// 원 단위 환산: priceWon = price * 10000
// 세율(%) = (priceWon * 2/3 - 300000000) / priceWon * 100
// 간소화: rate = 2/3 - 30000 / price
// 예시: 7억(70000만원) → rate = 2/3 - 30000/70000 = 0.6667 - 0.4286 = 0.2381 → 약 2.38%
// 세금 = price * rate
```

### 1.7 UI 레이아웃

#### TaxBreakdownCard 컴포넌트

```
┌─────────────────────────────────────────────┐
│  매매 부대비용                                │
│                                             │
│  ┌─────────────────────────────────────────┐│
│  │ 총 초기비용                     1,247만 원 ││
│  │ (매매가 외 추가 필요금액)                   ││
│  └─────────────────────────────────────────┘│
│                                             │
│  취득세                                      │
│  ├ 기본 취득세 (1.0%)              420만 원   │
│  ├ 농어촌특별세                      42만 원   │
│  └ 지방교육세                       42만 원   │
│  소계                              504만 원   │
│                                             │
│  ── 구분선 ──                                │
│                                             │
│  중개수수료 (0.4%)                  168만 원   │
│                                             │
│  ── 구분선 ──                                │
│                                             │
│  등기비용                                    │
│  ├ 등록면허세                      840만 원   │
│  ├ 지방교육세                      168만 원   │
│  ├ 인지세                           15만 원   │
│  └ 법무사 수수료                     50만 원   │
│  소계                            1,073만 원   │
│                                             │
│  ═══════════════════════════════════════════ │
│  실제 필요 총액              4억 3,247만 원    │
│  (매매가 4억 2,000만 + 부대비용 1,247만)       │
│                                             │
│  [1주택 기준 · 비조정지역]   ← 작은 회색 텍스트  │
└─────────────────────────────────────────────┘
```

#### PropertyTaxCard 컴포넌트 (보유세)

```
┌─────────────────────────────────────────────┐
│  예상 보유세 (연간)                            │
│                                             │
│  연간 약 87만 원  ·  월 약 7.3만 원             │
│                                             │
│  재산세                              48만 원  │
│  도시지역분                           8만 원   │
│  지방교육세                          10만 원   │
│                                             │
│  ⓘ 공시가격 추정치 기반 (실제와 다를 수 있음)     │
└─────────────────────────────────────────────┘
```

### 1.8 신규 파일 목록

| 파일 경로 | 용도 |
|-----------|------|
| `src/types/tax.ts` | 세금 관련 타입 정의 |
| `src/constants/tax.ts` | 세율, 요율 상수 |
| `src/lib/calculation/tax.ts` | 세금 계산 함수 (5개) |
| `src/lib/calculation/tax.test.ts` | 세금 계산 단위 테스트 |
| `src/components/properties/detail/TaxBreakdownCard.tsx` | 취득세+중개수수료+등기비용 카드 |
| `src/components/properties/detail/PropertyTaxCard.tsx` | 연간 보유세 카드 |

### 1.9 기존 파일 수정

| 파일 경로 | 변경 내용 |
|-----------|----------|
| `src/app/properties/[id]/page.tsx` | 실거래 매물 상세에 TaxBreakdownCard, PropertyTaxCard 섹션 추가 |
| `src/components/properties/detail/LiveDetailView.tsx` | 실시간 매물 상세에 동일 섹션 추가 |
| `src/lib/calculation/index.ts` | tax 모듈 re-export 추가 |

### 1.10 데이터 흐름

```
사용자 매물 상세 진입
  → page.tsx에서 property.dealAmount (또는 listing.askingPrice) 확보
  → store에서 assetInput.numberOfHomes, regionType 확보
  → calculateTotalInitialCost({ purchasePrice, numberOfHomes, regionType }) 호출
  → TaxBreakdownCard에 결과 전달 (클라이언트 계산, API 불필요)
  → PropertyTaxCard에 재산세 결과 전달
```

### 1.11 구현 단계

| 단계 | 작업 | 예상 범위 |
|------|------|----------|
| Phase 1 | 타입 + 상수 정의 | `types/tax.ts`, `constants/tax.ts` |
| Phase 2 | 계산 함수 구현 + 테스트 | `lib/calculation/tax.ts`, `tax.test.ts` |
| Phase 3 | UI 컴포넌트 2개 | `TaxBreakdownCard`, `PropertyTaxCard` |
| Phase 4 | 상세 페이지 통합 | `page.tsx`, `LiveDetailView.tsx` 수정 |

---

## Feature 2: 단지 상세 강화

### 2.1 개요

외부 단지 상세 API(`/api/v5/complex/{complexId}`)에서 제공하는 풍부한 데이터를 활용하여, 매물 상세 페이지에 건물 정보, 평면도, 학군, 시세 비교 섹션을 추가한다. 현재 매물 상세는 가격/대출 중심이며, 물건 자체에 대한 정보가 부족하다.

### 2.2 단지 ID 확보 방법

외부 마커 API(`complexList`)의 응답에 `id`(단지 ID)가 포함되어 있다. 현재 `LiveListing` 타입에는 단지 ID가 없으므로 다음과 같이 연결한다.

**방법: 마커 API 호출 시 complexId 매핑 테이블 생성**

```
마커 API (zoom=17) 응답
  → complexList[].id + complexList[].dongName + complexList[].formatAveragePrice
  → 매물의 complexName + dongName으로 매칭
  → LiveListing에 complexId 필드 추가
```

### 2.3 타입 정의

기존 `ComplexDetail` 타입(`src/types/listing.ts` 86~133행)은 이미 정의되어 있다. 추가로 필요한 타입:

```typescript
// src/types/listing.ts 에 추가

/** 마커 API에서 얻는 단지 요약 (complexList 항목) */
export interface ComplexMarker {
  id: string;
  location: { lat: number; lng: number };
  dongName: string;
  hasRoom: boolean;
  formatPyeong: string;
  formatSellingType: string;
  formatAveragePrice: string;
  contents: {
    pyeongPrice: number;
    gapPrice: number;
    leasePriceRate: number;
    useApprovalYear: string;
    householdNum: number;
  };
}

/** LiveListing 확장 - complexId 추가 */
// LiveListing 인터페이스에 선택적 필드 추가:
//   complexId?: string;
```

```typescript
// src/types/complex.ts (신규)

/** 학교 정보 (UI용 정제) */
export interface SchoolInfo {
  name: string;
  type: '초등학교' | '중학교' | '고등학교';
  distance: number;
  walkMinutes: number;
  avgStudentsPerClass: string;
}

/** 시세 비교 항목 (UI용 정제) */
export interface PriceComparisonItem {
  scope: string;               // "해당 단지" | "OO동" | "OO구"
  tradePyeongPrice: number;    // 매매 평당가 (만원)
  leasePyeongPrice: number;    // 전세 평당가 (만원)
}

/** 인근 단지 항목 (UI용 정제) */
export interface NearComplexItem {
  complexId: string;
  name: string;
  description: string;
  avgPyeongPrice: number;      // 평당가 (만원)
}

/** 평형 정보 (UI용 정제) */
export interface FloorPlanInfo {
  pyeongType: string;          // "11A", "24B"
  bedsNum: number;
  bathNum: number;
  roomSpaceSqm: number;        // 전용면적 m2
  roomSpacePyeong: number;     // 전용면적 평
  supplySpaceSqm: number;      // 공급면적 m2
  supplySpacePyeong: number;   // 공급면적 평
  layoutImageUrl: string | null;
}
```

### 2.4 API 라우트

```typescript
// src/app/api/real-estate/complex/[complexId]/route.ts

/**
 * 단지 상세 프록시 API
 *
 * GET /api/real-estate/complex/{complexId}
 *
 * - 서버에서 LISTING_API_BASE_URL/api/v5/complex/{complexId} 호출
 * - 응답을 ComplexDetail 타입으로 변환
 * - Cache-Control: max-age=3600 (1시간 캐시)
 * - Next.js fetch cache: revalidate=3600
 *
 * 에러 처리:
 * - complexId 형식 검증 (hex string)
 * - 외부 API 실패 시 404 반환
 * - rate limit 감지 시 429 반환
 */
```

**캐싱 전략:**
- Next.js Route Handler에서 `revalidate: 3600` 설정 (1시간)
- 단지 정보는 자주 변하지 않으므로 공격적 캐싱 적합
- 응답 헤더에 `Cache-Control: public, max-age=3600, stale-while-revalidate=7200`

**외부 API 응답 → ComplexDetail 매핑:**

```typescript
// src/lib/api/complexClient.ts

/**
 * 외부 단지 API 호출 + ComplexDetail 변환
 *
 * 매핑 규칙:
 * - result.complex → 기본 필드 (name, address, householdNum 등)
 * - result.spaces → spaces[] (layoutImage URL은 CDN 프록시 불필요, 직접 참조)
 * - result.education → education (elementary/middle/high로 분류)
 * - result.areaAveragePrice → priceComparison[]
 * - result.nearComplexes.trade → nearComplexes[]
 * - result.roomCount → roomCount
 */
export async function fetchComplexDetail(complexId: string): Promise<ComplexDetail>;
```

### 2.5 UI 레이아웃

매물 상세 페이지에 다음 4개 섹션을 추가한다. 단지 ID가 있는 매물에서만 표시.

#### 2.5.1 ComplexInfoCard (건물 정보)

```
┌─────────────────────────────────────────────┐
│  단지 정보                                    │
│                                             │
│  ┌──────────────┐  ┌──────────────┐         │
│  │ 사용승인       │  │ 세대수        │         │
│  │ 2004년        │  │ 371세대       │         │
│  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐         │
│  │ 주차          │  │ 시공사        │         │
│  │ 0.75대/세대   │  │ (주)대우건설   │         │
│  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐         │
│  │ 난방          │  │ 연료         │          │
│  │ 개별난방       │  │ 도시가스      │         │
│  └──────────────┘  └──────────────┘         │
│                                             │
│  📍 서울시 강남구 테헤란로 428                   │
└─────────────────────────────────────────────┘
```

2x3 그리드, 각 항목은 라벨(caption, 14px, secondary) + 값(body, 16px, primary). 카드 하단에 도로명주소.

#### 2.5.2 FloorPlanViewer (평면도)

```
┌─────────────────────────────────────────────┐
│  평형별 정보                                  │
│                                             │
│  [11A] [24B] [32C]           ← 탭/필 선택    │
│                                             │
│  ┌─────────────────────┐                    │
│  │                     │                    │
│  │   (평면도 이미지)     │                    │
│  │                     │                    │
│  └─────────────────────┘                    │
│                                             │
│  전용 29.0m² (8.8평)  ·  공급 38.7m² (11.7평)│
│  방 1개  ·  욕실 1개                          │
│                                             │
│  ── 다른 평형도 보기 (3개) ──                   │
└─────────────────────────────────────────────┘
```

- 평면도 이미지가 없는 평형은 "평면도 없음" 표시
- 이미지 확대 기능 (클릭 시 모달 또는 pinch-zoom)
- 매물의 면적과 가장 가까운 평형을 기본 선택

#### 2.5.3 SchoolInfoCard (학군 정보)

```
┌─────────────────────────────────────────────┐
│  주변 학교                                    │
│                                             │
│  초등학교                                     │
│  ├ 대치초등학교        도보 3분 (250m)  28명/반 │
│  └ 역삼초등학교        도보 8분 (640m)  25명/반 │
│                                             │
│  중학교                                      │
│  ├ 대치중학교          도보 5분 (400m)  30명/반 │
│  └ 역삼중학교          도보 12분 (960m) 28명/반 │
│                                             │
│  고등학교                                     │
│  ├ 휘문고등학교        도보 7분 (560m)  32명/반 │
│  └ 단대부고            도보 15분 (1.2km) 30명/반│
└─────────────────────────────────────────────┘
```

- 거리순 정렬, 학교 유형별 그룹
- 도보 시간 = Math.ceil(distance / 80) (80m/분 기준)
- 각 유형별 최대 3개까지 표시

#### 2.5.4 AreaPriceComparisonCard (시세 비교)

```
┌─────────────────────────────────────────────┐
│  시세 비교 (평당가)                            │
│                                             │
│  [매매] [전세]                  ← 토글       │
│                                             │
│  해당 단지  ██████████████████  2,964만       │
│  대치동     ████████████████    2,710만       │
│  강남구     ██████████████      2,480만       │
│                                             │
│  ── 구분선 ──                                │
│                                             │
│  인근 단지 비교                               │
│  ┌─────────────────────────────────────────┐│
│  │ 래미안대치팰리스   32평 · 4,120만/평        ││
│  │ 대치아이파크       28평 · 3,890만/평        ││
│  │ 은마아파트         24평 · 3,250만/평        ││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

- 수평 막대 그래프: CSS로 구현 (외부 차트 라이브러리 불필요)
- 가장 높은 값 = 100% 너비, 나머지 비례
- 매매/전세 토글 (기본: 매매)
- 인근 단지는 평당가 내림차순, 최대 5개

### 2.6 상세 페이지 통합 구조

```
// LiveDetailView.tsx 기준 (실시간 매물)

ImageGallery (기존)
기본정보 헤더 (기존)
>>> ComplexInfoCard (신규) <<<       ← listing.complexId가 있을 때만
>>> FloorPlanViewer (신규) <<<       ← spaces 데이터가 있을 때만
AffordabilityAnalysis (기존)
TaxBreakdownCard (Feature 1)
PropertyTaxCard (Feature 1)
RecommendedLoanProducts (기존)
MonthlyPaymentSimulation (기존)
>>> SchoolInfoCard (신규) <<<        ← education 데이터가 있을 때만
>>> AreaPriceComparisonCard (신규) <<<
```

### 2.7 데이터 흐름

```
매물 상세 페이지 진입
  → listing.complexId 확인 (없으면 단지 섹션 미표시)
  → fetch('/api/real-estate/complex/{complexId}')
  → 로딩 상태: 스켈레톤 카드 4개 표시
  → 성공: ComplexDetail → 각 섹션 컴포넌트에 전달
  → 실패: 섹션 자체를 숨김 (에러 UI 불필요, 핵심 기능 아님)
```

**클라이언트 데이터 페칭 훅:**

```typescript
// src/lib/hooks/useComplexDetail.ts

/**
 * 단지 상세 데이터 페칭 훅
 *
 * - complexId가 null/undefined면 페칭 안 함
 * - 로딩/에러/데이터 상태 관리
 * - SWR 또는 단순 useEffect + useState (외부 라이브러리 미사용)
 * - 캐시: 클라이언트 Map 캐시 (세션 내 동일 단지 재요청 방지)
 */
export function useComplexDetail(complexId: string | null): {
  data: ComplexDetail | null;
  isLoading: boolean;
  error: Error | null;
};
```

### 2.8 마커 API에서 complexId 연결

현재 매물 목록 페이지에서 마커 API를 호출하여 지도 핀을 표시하고 있다. 이 응답의 `complexList`에 단지 ID가 포함되어 있으므로:

```typescript
// src/lib/api/listingClient.ts 수정

/**
 * 매물 조회 시 마커 API도 함께 호출 (zoom=17)
 * → complexList에서 complexId + complexName 매핑 테이블 생성
 * → LiveListing 변환 시 complexName 매칭으로 complexId 부여
 *
 * 매칭 로직:
 * 1. listing.name === complex.complexName → 직접 매칭
 * 2. 같은 dongName 내에서 이름 유사도 → 퍼지 매칭 (fallback)
 * 3. 매칭 실패 → complexId = undefined (단지 섹션 미표시)
 */
```

### 2.9 신규 파일 목록

| 파일 경로 | 용도 |
|-----------|------|
| `src/types/complex.ts` | 학교/시세/평형 UI용 타입 |
| `src/app/api/real-estate/complex/[complexId]/route.ts` | 단지 상세 프록시 API |
| `src/lib/api/complexClient.ts` | 외부 단지 API 호출 + 변환 |
| `src/lib/hooks/useComplexDetail.ts` | 클라이언트 데이터 페칭 훅 |
| `src/components/properties/detail/ComplexInfoCard.tsx` | 건물 정보 카드 |
| `src/components/properties/detail/FloorPlanViewer.tsx` | 평면도 뷰어 |
| `src/components/properties/detail/SchoolInfoCard.tsx` | 학군 정보 카드 |
| `src/components/properties/detail/AreaPriceComparisonCard.tsx` | 시세 비교 카드 |

### 2.10 기존 파일 수정

| 파일 경로 | 변경 내용 |
|-----------|----------|
| `src/types/listing.ts` | `LiveListing`에 `complexId?: string` 추가, `ComplexMarker` 타입 추가 |
| `src/lib/api/listingClient.ts` | 마커 API 호출 시 complexId 매핑 로직 추가 |
| `src/app/properties/[id]/page.tsx` | 단지 섹션 4개 추가 (complexId 존재 시) |
| `src/components/properties/detail/LiveDetailView.tsx` | 단지 섹션 4개 추가 |

### 2.11 구현 단계

| 단계 | 작업 | 예상 범위 |
|------|------|----------|
| Phase 1 | 타입 정의 + API 프록시 라우트 | `complex.ts`, `route.ts` |
| Phase 2 | API 클라이언트 + 페칭 훅 | `complexClient.ts`, `useComplexDetail.ts` |
| Phase 3 | ComplexInfoCard + FloorPlanViewer | UI 컴포넌트 2개 |
| Phase 4 | SchoolInfoCard + AreaPriceComparisonCard | UI 컴포넌트 2개 |
| Phase 5 | 상세 페이지 통합 + complexId 매핑 | 기존 파일 수정 |

---

## Feature 3: 지역 시세 대시보드

### 3.1 개요

사용자가 선택한 지역의 가격 분포, 동별 평균 시세, 호가 vs 실거래 비교, 합리적 단지 순위를 한눈에 볼 수 있는 분석 페이지. 현재 앱은 개별 매물 단위로만 가격을 보여주며, "이 지역이 내 예산에 맞는지"에 대한 거시적 판단 도구가 없다.

### 3.2 위치 및 진입점

**신규 라우트 `/analytics`로 생성한다.** 매물 목록 페이지(`/properties`)에서 "지역 시세 분석" 버튼으로 진입.

이유:
- 매물 목록 페이지에 넣기에는 컨텐츠 양이 많다
- 매물 검색과 시세 분석은 다른 사용자 의도이다
- 별도 페이지로 분리해야 각 페이지의 단일 책임이 유지된다

```
/properties 페이지 상단
  [실거래] [현재 매물] 탭 (기존)
  [지역 시세 분석 →] 버튼 (신규)     ← /analytics로 이동
```

### 3.3 데이터 소스

| 데이터 | 소스 | 용도 |
|--------|------|------|
| 실거래 가격 분포 | 국토부 API (기존 `properties[]`) | 히스토그램, 평균가 |
| 현재 매물 호가 분포 | 외부 매물 API (기존 `liveListings[]`) | 호가 분포, 호가 vs 실거래 |
| 단지별 평당가 | 외부 마커 API `complexList` | 단지 순위, 합리적 단지 |
| 동별 시세 | 실거래 + 매물 데이터 집계 | 동별 평균 비교 |

store에 이미 있는 `properties[]`와 `liveListings[]`를 활용하므로 추가 API 호출 없이 클라이언트에서 집계 가능하다. 단, 단지별 평당가는 마커 API 데이터가 필요하므로 store 확장이 필요하다.

### 3.4 타입 정의

```typescript
// src/types/analytics.ts

/** 가격 히스토그램 구간 */
export interface PriceBucket {
  /** 구간 시작 (만원) */
  min: number;
  /** 구간 끝 (만원) */
  max: number;
  /** 구간 라벨 ("3~4억") */
  label: string;
  /** 해당 구간 매물 수 */
  count: number;
  /** 전체 대비 비율 (0~1) */
  ratio: number;
}

/** 동별 시세 */
export interface DongPriceSummary {
  dongName: string;
  /** 실거래 평균 (만원) */
  avgDealPrice: number;
  /** 호가 평균 (만원, liveListings 기반) */
  avgAskingPrice: number | null;
  /** 매물 건수 */
  dealCount: number;
  /** 실시간 매물 건수 */
  listingCount: number;
  /** 평당가 평균 (만원) */
  avgPyeongPrice: number | null;
}

/** 호가 vs 실거래 비교 */
export interface AskingVsDealComparison {
  /** 지역 전체 실거래 평균 (만원) */
  avgDealPrice: number;
  /** 지역 전체 호가 평균 (만원) */
  avgAskingPrice: number;
  /** 호가율 = 호가평균 / 실거래평균 (%) */
  premiumRate: number;
  /** 동별 비교 */
  byDong: {
    dongName: string;
    avgDeal: number;
    avgAsking: number;
    premiumRate: number;
  }[];
}

/** 합리적 단지 항목 */
export interface AffordableComplex {
  complexName: string;
  dongName: string;
  avgPyeongPrice: number;          // 평당가 (만원)
  formatAveragePrice: string;       // "4.2억"
  useApprovalYear: string;
  householdNum: number;
  /** 내 구매력 대비 여유금 (만원) */
  affordabilityGap: number;
}

/** 지역 시세 대시보드 전체 데이터 */
export interface RegionalAnalytics {
  /** 선택된 지역명 */
  regionNames: string[];
  /** 가격 분포 (히스토그램) */
  priceDistribution: PriceBucket[];
  /** 동별 시세 */
  dongSummaries: DongPriceSummary[];
  /** 호가 vs 실거래 */
  askingVsDeal: AskingVsDealComparison | null;
  /** 합리적 단지 Top 10 */
  affordableComplexes: AffordableComplex[];
  /** 통계 요약 */
  summary: {
    totalDeals: number;
    totalListings: number;
    medianPrice: number;
    minPrice: number;
    maxPrice: number;
    avgPricePerPyeong: number | null;
  };
}
```

### 3.5 계산 함수

```typescript
// src/lib/calculation/analytics.ts

import type { Property } from '@/types';
import type { LiveListing } from '@/types/listing';
import type {
  PriceBucket,
  DongPriceSummary,
  AskingVsDealComparison,
  AffordableComplex,
  RegionalAnalytics,
} from '@/types/analytics';

/**
 * 가격대별 매물 분포 히스토그램 생성
 *
 * 알고리즘:
 * 1. 모든 매물 가격에서 min/max 추출
 * 2. 적절한 구간 크기 결정:
 *    - max - min < 30000 (3억) → 5000만원(5천만) 단위
 *    - max - min < 100000 (10억) → 10000만원(1억) 단위
 *    - 그 외 → 20000만원(2억) 단위
 * 3. 각 구간별 매물 수 카운트
 * 4. ratio = count / total
 *
 * @param properties 실거래 + 실시간 매물 통합 가격 배열
 */
export function buildPriceDistribution(
  properties: Property[],
  liveListings: LiveListing[],
): PriceBucket[];

/**
 * 동별 시세 집계
 *
 * 1. properties를 dong 기준 그룹핑
 * 2. 각 동별 평균 dealAmount 계산
 * 3. liveListings를 dongName 기준 그룹핑 → 평균 askingPrice
 * 4. 평당가 = area가 있는 매물만 대상, dealAmount / sqmToPyeong(area)
 * 5. dealCount 내림차순 정렬
 */
export function buildDongSummaries(
  properties: Property[],
  liveListings: LiveListing[],
): DongPriceSummary[];

/**
 * 호가 vs 실거래 비교
 *
 * 전제: properties(실거래)와 liveListings(호가)가 모두 있어야 함
 * liveListings가 비어있으면 null 반환
 *
 * 1. 전체 평균 계산
 * 2. premiumRate = (avgAsking - avgDeal) / avgDeal * 100
 * 3. 동별로도 동일 계산
 */
export function buildAskingVsDealComparison(
  properties: Property[],
  liveListings: LiveListing[],
): AskingVsDealComparison | null;

/**
 * 합리적 단지 Top 10
 *
 * 마커 API의 complexList 데이터 기반
 * 1. 내 구매력(affordablePrice) 이하인 단지 필터
 * 2. affordabilityGap = affordablePrice - (avgPyeongPrice * 기준평수)
 *    기준평수는 마커의 formatPyeong에서 추출
 * 3. affordabilityGap 내림차순 (여유가 많은 순)
 * 4. 상위 10개 반환
 */
export function findAffordableComplexes(
  complexMarkers: ComplexMarker[],
  affordablePrice: number,
): AffordableComplex[];

/**
 * 전체 대시보드 데이터 통합 생성
 *
 * 각 하위 함수를 호출하고 summary 통계를 생성하는 진입점
 */
export function buildRegionalAnalytics(
  properties: Property[],
  liveListings: LiveListing[],
  complexMarkers: ComplexMarker[],
  affordablePrice: number,
  regionNames: string[],
): RegionalAnalytics;
```

### 3.6 Store 확장

```typescript
// src/types/index.ts - HousePinStore 확장

export interface HousePinStore {
  // ... 기존 필드 ...

  /** 마커 API에서 가져온 단지 목록 (지역 시세 분석용) */
  complexMarkers: import('./listing').ComplexMarker[];
  setComplexMarkers: (markers: import('./listing').ComplexMarker[]) => void;
}
```

마커 API는 이미 매물 목록 페이지에서 지도 핀 표시를 위해 호출하고 있다. 이 응답의 `complexList`를 store에 저장하도록 기존 로직을 확장한다.

### 3.7 UI 레이아웃

#### 3.7.1 페이지 전체 구조

```
┌─────────────────────────────────────────────┐
│  ← 뒤로    지역 시세 분석                     │
│                                             │
│  강남구 · 서초구                    ← 선택 지역│
│  총 234건 실거래 · 87건 현재 매물               │
│                                             │
│  ┌─────────────────────────────────────────┐│
│  │  요약 카드                               ││
│  │  중간값 5억 2,000만  ·  평당 2,340만       ││
│  │  최저 1억 8,000만 ~ 최고 15억 3,000만      ││
│  └─────────────────────────────────────────┘│
│                                             │
│  [가격 분포 섹션]                              │
│  [동별 시세 섹션]                              │
│  [호가 vs 실거래 섹션]                         │
│  [합리적 단지 Top 10 섹션]                     │
└─────────────────────────────────────────────┘
```

#### 3.7.2 PriceDistributionChart (가격 분포)

```
┌─────────────────────────────────────────────┐
│  가격대별 매물 분포                            │
│                                             │
│         ██                                  │
│      █  ██  █                               │
│    █ ██ ██ ██ █                             │
│  █ ██ ██ ██ ██ ██ █                         │
│  ─────────────────────                      │
│  2억 3억 4억 5억 6억 7억 8억                  │
│                                             │
│  ▼ 내 구매력 5억 4,000만 원                   │
│    (상위에서 42% 구간)                        │
│                                             │
│  ⓘ 실거래 + 현재 매물 합산 기준                 │
└─────────────────────────────────────────────┘
```

- CSS 기반 세로 막대 차트 (외부 라이브러리 불필요)
- 내 구매력 위치를 수직선 또는 화살표로 표시
- 각 막대에 매물 수 라벨 (hover 또는 상시)

#### 3.7.3 DongPriceTable (동별 시세)

```
┌─────────────────────────────────────────────┐
│  동별 평균 시세                               │
│                                             │
│  동이름      실거래 평균    호가 평균    건수    │
│  ─────────────────────────────────────────── │
│  대치동      7억 2,000만   7억 8,000만  45건  │
│  역삼동      5억 1,000만   5억 5,000만  32건  │
│  논현동      4억 8,000만   5억 2,000만  28건  │
│  삼성동      6억 3,000만   6억 8,000만  18건  │
│  ...                                        │
│                                             │
│  정렬: [가격순 ▼] [건수순]                     │
└─────────────────────────────────────────────┘
```

- 테이블 형태, 행 클릭 시 해당 동 매물 필터링으로 이동(선택적)
- 가격순/건수순 정렬 토글
- 내 구매력 이하인 동은 accent 색상 하이라이트

#### 3.7.4 AskingVsDealChart (호가 vs 실거래)

```
┌─────────────────────────────────────────────┐
│  호가 vs 실거래                               │
│                                             │
│  전체 평균                                   │
│  실거래  ████████████████████  5억 2,000만    │
│  호가    ██████████████████████ 5억 6,000만   │
│  호가율 +7.7%                                │
│                                             │
│  동별 호가율                                  │
│  대치동  +8.3%  ███                          │
│  역삼동  +7.8%  ██                           │
│  논현동  +8.3%  ███                          │
│  삼성동  +7.9%  ██                           │
│                                             │
│  ⓘ 호가율이 낮을수록 급매 가능성               │
└─────────────────────────────────────────────┘
```

- 호가율이 5% 미만이면 success 색상(급매 가능성), 10% 초과면 warning 색상
- 간결한 수평 막대 비교

#### 3.7.5 AffordableComplexList (합리적 단지 Top 10)

```
┌─────────────────────────────────────────────┐
│  내 예산으로 살 수 있는 단지 Top 10             │
│                                             │
│  1. 래미안대치팰리스                           │
│     대치동 · 2004년 · 371세대                  │
│     평균 4억 2,000만                ← 여유 1.2억│
│                                             │
│  2. 대치현대아파트                              │
│     대치동 · 1998년 · 420세대                  │
│     평균 3억 8,000만                ← 여유 1.6억│
│                                             │
│  3. ...                                     │
│                                             │
│  ⓘ 마커 데이터 기반, 평균 호가 기준             │
└─────────────────────────────────────────────┘
```

- 여유 금액이 큰 순서로 정렬
- 각 항목 클릭 시 해당 단지 매물 상세로 이동(선택적)
- "여유" 뱃지에 success 색상 적용

### 3.8 신규 파일 목록

| 파일 경로 | 용도 |
|-----------|------|
| `src/types/analytics.ts` | 분석 관련 타입 정의 |
| `src/lib/calculation/analytics.ts` | 집계/분석 계산 함수 (5개) |
| `src/lib/calculation/analytics.test.ts` | 분석 계산 단위 테스트 |
| `src/app/analytics/page.tsx` | 시세 대시보드 페이지 |
| `src/components/analytics/PriceDistributionChart.tsx` | 가격 분포 히스토그램 |
| `src/components/analytics/DongPriceTable.tsx` | 동별 시세 테이블 |
| `src/components/analytics/AskingVsDealChart.tsx` | 호가 vs 실거래 비교 |
| `src/components/analytics/AffordableComplexList.tsx` | 합리적 단지 Top 10 |
| `src/components/analytics/AnalyticsSummaryCard.tsx` | 요약 통계 카드 |

### 3.9 기존 파일 수정

| 파일 경로 | 변경 내용 |
|-----------|----------|
| `src/types/index.ts` | `HousePinStore`에 `complexMarkers` 필드 추가 |
| `src/types/listing.ts` | `ComplexMarker` 타입 추가 |
| `src/store/useHousePinStore.ts` | `complexMarkers`, `setComplexMarkers` 추가 |
| `src/app/properties/page.tsx` (또는 관련 컴포넌트) | "지역 시세 분석" 진입 버튼 추가 |
| `src/lib/api/listingClient.ts` | 마커 API 호출 시 complexList를 store에 저장하도록 수정 |

### 3.10 데이터 흐름

```
/properties 페이지 (기존 흐름)
  → 마커 API 호출 → complexList를 store.complexMarkers에 저장 (신규)
  → "지역 시세 분석" 버튼 클릭

/analytics 페이지
  → store에서 properties, liveListings, complexMarkers, loanResult 읽기
  → 가드: 데이터 없으면 /properties로 리다이렉트
  → buildRegionalAnalytics() 호출 (클라이언트 계산)
  → useMemo로 캐싱 (입력 변경 시만 재계산)
  → 각 섹션 컴포넌트에 결과 전달
```

### 3.11 구현 단계

| 단계 | 작업 | 예상 범위 |
|------|------|----------|
| Phase 1 | 타입 정의 | `analytics.ts` |
| Phase 2 | 계산 함수 구현 + 테스트 | `analytics.ts`, `analytics.test.ts` |
| Phase 3 | Store 확장 + 마커 데이터 저장 | `index.ts`, `useHousePinStore.ts`, `listingClient.ts` |
| Phase 4 | 요약 카드 + 가격 분포 차트 | `AnalyticsSummaryCard`, `PriceDistributionChart` |
| Phase 5 | 동별 시세 + 호가 비교 | `DongPriceTable`, `AskingVsDealChart` |
| Phase 6 | 합리적 단지 + 페이지 조립 | `AffordableComplexList`, `page.tsx` |
| Phase 7 | 진입점 연결 | `/properties` 페이지에 버튼 추가 |

---

## 전체 구현 우선순위

| 순위 | 기능 | 이유 |
|------|------|------|
| 1 | 세금 계산기 | 외부 API 의존 없음, 순수 계산 로직, 독립적으로 완성 가능 |
| 2 | 단지 상세 강화 | API 프록시 1개 추가, 매물 상세의 정보 밀도를 크게 높임 |
| 3 | 지역 시세 대시보드 | Store 확장 + 신규 라우트 + 차트 컴포넌트 5개, 가장 큰 범위 |

---

## 공통 설계 원칙

### 차트 구현

외부 차트 라이브러리(Recharts, Chart.js 등)를 사용하지 않는다. 모든 시각화는 CSS(`width`, `height`, `background`) + Tailwind로 구현한다.

이유:
- 현재 `package.json`에 차트 라이브러리가 없다
- 히스토그램과 수평 막대 정도는 CSS만으로 충분하다
- 번들 사이즈 최소화
- 필요 시 향후 라이브러리 도입은 별도 결정

### 토스 스타일 준수

- 카드: `border-radius: 16px`, `padding: 24px`, surface 배경
- 숫자 강조: `32px bold` accent 색상
- 보조 텍스트: `14px regular` secondary 색상
- 구분선: `border-border` (1px)
- 여백: 섹션 간 `gap-6` (24px)
- 법적 고지/추정치 안내: `12px regular` secondary, 카드 하단

### 외부 API 접근

모든 외부 API 호출은 `LISTING_API_BASE_URL` 환경변수를 통해 접근한다. 코드에 특정 서비스 이름을 하드코딩하지 않는다.

### 에러 처리 전략

| 기능 | 에러 시 대응 |
|------|-------------|
| 세금 계산 | 에러 발생 불가 (순수 계산) |
| 단지 상세 API | 해당 섹션 숨김 (핵심 기능 아님) |
| 시세 대시보드 | 데이터 없는 섹션만 "데이터 없음" 표시 |

### 테스트 범위

| 모듈 | 테스트 종류 | 커버리지 목표 |
|------|-----------|-------------|
| `lib/calculation/tax.ts` | 단위 테스트 | 90%+ (정책 규칙이므로 정확성 필수) |
| `lib/calculation/analytics.ts` | 단위 테스트 | 80%+ |
| `lib/api/complexClient.ts` | 통합 테스트 (선택) | 응답 변환 정확성 |

---

## 신규 파일 전체 목록 (요약)

```
src/
├── types/
│   ├── tax.ts                              (Feature 1)
│   ├── complex.ts                          (Feature 2)
│   └── analytics.ts                        (Feature 3)
├── constants/
│   └── tax.ts                              (Feature 1)
├── lib/
│   ├── calculation/
│   │   ├── tax.ts                          (Feature 1)
│   │   ├── tax.test.ts                     (Feature 1)
│   │   ├── analytics.ts                    (Feature 3)
│   │   └── analytics.test.ts              (Feature 3)
│   ├── api/
│   │   └── complexClient.ts               (Feature 2)
│   └── hooks/
│       └── useComplexDetail.ts            (Feature 2)
├── app/
│   ├── api/real-estate/complex/
│   │   └── [complexId]/route.ts           (Feature 2)
│   └── analytics/
│       └── page.tsx                        (Feature 3)
└── components/
    ├── properties/detail/
    │   ├── TaxBreakdownCard.tsx            (Feature 1)
    │   ├── PropertyTaxCard.tsx             (Feature 1)
    │   ├── ComplexInfoCard.tsx             (Feature 2)
    │   ├── FloorPlanViewer.tsx             (Feature 2)
    │   ├── SchoolInfoCard.tsx              (Feature 2)
    │   └── AreaPriceComparisonCard.tsx     (Feature 2)
    └── analytics/
        ├── AnalyticsSummaryCard.tsx        (Feature 3)
        ├── PriceDistributionChart.tsx      (Feature 3)
        ├── DongPriceTable.tsx              (Feature 3)
        ├── AskingVsDealChart.tsx           (Feature 3)
        └── AffordableComplexList.tsx       (Feature 3)
```

**신규 파일 수:** 23개
**수정 파일 수:** 8개 (중복 제거)
