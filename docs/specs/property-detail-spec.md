# 매물 상세 페이지 기능 명세서

## 1. 개요

매물 추천 리스트(`/properties`)에서 개별 매물을 선택하면 진입하는 상세 페이지.
사용자의 대출 맥락(Zustand store의 `AssetInput` + `LoanResult`)과 해당 매물의 실거래 데이터를 결합하여
**"이 매물을 내가 살 수 있는가"**에 대한 구체적 분석을 제공한다.

---

## 2. 라우팅 및 네비게이션

### 2.1 URL 구조

```
/properties/[id]
```

- `id` 형식: `{regionCode}-{name}-{dealAmount}-{area}-{floor}`
  - 예: `11680-래미안블레스티지-82000-84.99-15`
  - MOLIT API에는 고유 식별자가 없으므로, 복합 키를 URL slug로 사용
  - `encodeURIComponent`로 인코딩하여 한글 처리

**대안 검토**: 현재 DB가 없으므로 서버 사이드에서 매물을 ID로 조회할 수 없다.
따라서 클라이언트 사이드 접근 방식을 채택한다.

### 2.2 데이터 전달 방식

Zustand store의 `properties` 배열에서 URL 파라미터 조합으로 매칭하여 매물을 찾는다.

```
진입 흐름:
PropertyCard 클릭 → router.push(`/properties/${generateSlug(property)}`) → 상세 페이지
```

**`generateSlug` 함수** (신규, `src/lib/utils/property.ts`):
```typescript
function generatePropertySlug(p: Property): string
function parsePropertySlug(slug: string): { regionCode, name, dealAmount, area, floor }
function findPropertyBySlug(properties: Property[], slug: string): Property | null
```

### 2.3 네비게이션

| 요소 | 동작 |
|------|------|
| 뒤로가기 (Header 좌측 화살표) | `router.back()` - 매물 리스트로 복귀 |
| 브라우저 뒤로가기 | 동일 |
| 직접 URL 접근 (store 비어있을 때) | fallback UI 표시 후 `/input`으로 유도 |

### 2.4 가드 조건

- `loanResult`가 null이면: "자산 정보를 먼저 입력해주세요" 안내 + `/input` 이동 버튼
- `properties` 배열이 비어있으면: "매물 데이터가 없습니다" 안내 + `/properties` 이동 버튼
- slug로 매칭되는 매물이 없으면: "매물을 찾을 수 없습니다" 안내 + `/properties` 이동 버튼

---

## 3. 페이지 레이아웃

### 3.1 전체 구조

```
[Header - 뒤로가기 + "매물 상세"]
[Section 1: 매물 기본 정보]
[Section 2: 위치 정보 (카카오맵)]
[Section 3: 이 매물을 사려면]
[Section 4: 추천 대출 상품]
[Section 5: 월 상환 시뮬레이션]
[Section 6: 비슷한 매물]
[Footer CTA: 매물 리스트로 돌아가기]
```

### 3.2 반응형 규칙

| 구분 | 모바일 (<640px) | 데스크톱 (>=640px) |
|------|----------------|-------------------|
| 전체 너비 | 100%, px-5 | max-w-lg, mx-auto |
| 섹션 간격 | gap-6 | gap-8 |
| 지도 높이 | 240px | 400px |
| 대출 상품 | 카드 리스트 | 테이블 형태 |
| 비슷한 매물 | 세로 스크롤 | 가로 스크롤 또는 그리드 |

---

## 4. 섹션별 상세 명세

### 4.1 매물 기본 정보

**컴포넌트명**: `PropertyDetailHeader`
**위치**: `src/components/properties/detail/PropertyDetailHeader.tsx`

#### 표시 데이터

| 항목 | 데이터 소스 | 표시 형식 | 스타일 |
|------|-----------|----------|--------|
| 건물명 | `property.name` | 그대로 | 24px bold, text-primary |
| 건물 타입 | `property.propertyType` | 아파트/빌라/오피스텔 뱃지 | 기존 PropertyCard의 typeConfig 재사용 |
| 거래금액 | `property.dealAmount` | `formatToKoreanWon()` | 32px bold, text-accent |
| 전용면적 | `property.area` | `{area}m2 ({sqmToPyeong(area)}평)` | 16px, text-secondary |
| 층수 | `property.floor` | `{floor}층` | 16px, text-secondary |
| 건축년도 | `property.buildYear` | `{buildYear}년 (경과 {currentYear - buildYear}년)` | 16px, text-secondary |
| 거래일 | `dealYear/Month/Day` | `YYYY.MM.DD` | 14px, text-secondary |
| 주소 | `property.dong` + `property.jibun` | `{dong} {jibun}` | 14px, text-secondary |
| 구매 가능 여부 | `affordablePrice - dealAmount` | Badge: "여유 X만 원" / "부족 X만 원" | 기존 Badge 컴포넌트 (success/danger) |

#### 레이아웃

```
┌─────────────────────────────────────────┐
│ [아파트]  래미안블레스티지               │
│                                         │
│ 8억 2,000만 원            [여유 3,000만 원] │
│                                         │
│ 84.99m2 (25.7평) · 15층 · 2018년 (8년)  │
│ 2026.02.15 거래                         │
│ 서초동 1234                              │
└─────────────────────────────────────────┘
```

- 최상단 Card 컴포넌트 사용, variant="default"
- 건물명과 타입 뱃지는 한 줄, flex 정렬
- 금액은 hero 타이포 (32px bold)
- 면적/층/건축년도는 가운데 점(·)으로 구분하여 한 줄
- Badge는 금액 오른쪽에 위치 (모바일에서는 금액 아래로 래핑 허용)

#### 신규 계산

- `buildingAge`: `new Date().getFullYear() - property.buildYear` (순수 산술, 유틸 불필요)

---

### 4.2 위치 정보

**컴포넌트명**: `PropertyLocationMap`
**위치**: `src/components/properties/detail/PropertyLocationMap.tsx`

#### 표시 데이터

| 항목 | 데이터 소스 | 설명 |
|------|-----------|------|
| 지도 | 카카오맵 SDK | 매물 좌표 중심, 단일 마커 |
| 주소 | `dong` + `jibun` | 지도 하단에 텍스트로 표시 |

#### 동작

- 매물의 `lat`/`lng`가 있으면 해당 좌표 사용
- 없으면 기존 `REGION_CENTER_COORDS`에서 `regionCode`로 fallback
- 줌 레벨: 4 (리스트 지도의 6보다 확대)
- 마커: 기존 `createMarkerImage` 함수 재사용, 매물 타입별 색상
- 지도 위 InfoWindow: 건물명 + 금액 표시 (기본 열린 상태)

#### 레이아웃

```
┌─────────────────────────────────────────┐
│ 위치                                    │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │         [카카오맵 - 240/400px]       │ │
│ │              📍                      │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 서초구 서초동 1234                       │
└─────────────────────────────────────────┘
```

- Card 컴포넌트, title="위치"
- 지도 영역: rounded-[12px], overflow-hidden
- 카카오맵 키 없을 때: 기존 PropertyMap의 fallback UI 패턴 재사용
- 지도 아래에 전체 주소 텍스트 (14px, text-secondary)

#### 기존 코드 재사용

- `PropertyMap.tsx`의 카카오맵 초기화 로직을 커스텀 훅 `useKakaoMap`으로 추출하여 공유
- `getPropertyCoords`, `createMarkerImage`, `REGION_CENTER_COORDS` 유틸로 분리

---

### 4.3 이 매물을 사려면

**컴포넌트명**: `AffordabilityAnalysis`
**위치**: `src/components/properties/detail/AffordabilityAnalysis.tsx`

#### 표시 데이터

이 섹션의 핵심은 **사용자의 구매력과 이 매물 가격의 차이 분석**이다.

| 항목 | 계산 | 표시 형식 |
|------|------|----------|
| 매물 가격 | `property.dealAmount` | `formatToKoreanWon()` |
| 내 구매 가능 금액 | `loanResult.affordablePrice` | `formatToKoreanWon()` |
| 차액 | `affordablePrice - dealAmount` | 양수면 "여유", 음수면 "부족" |
| 필요 자기자본 | 아래 신규 계산 참조 | `formatToKoreanWon()` |
| 필요 대출금 | 아래 신규 계산 참조 | `formatToKoreanWon()` |
| 현재 자기자본 | `assetInput.ownCapital` | `formatToKoreanWon()` |
| 자기자본 과부족 | `ownCapital - requiredOwnCapital` | 색상으로 구분 |

#### 신규 계산 함수

`src/lib/calculation/affordability.ts` (신규 파일):

```typescript
interface PropertyAffordability {
  dealAmount: number;           // 매물가
  requiredOwnCapital: number;   // 필요 자기자본 = dealAmount * (1 - ltv)
  requiredLoan: number;         // 필요 대출금 = dealAmount * ltv
  ownCapitalDiff: number;       // 자기자본 과부족 = ownCapital - requiredOwnCapital
  totalDiff: number;            // 총 과부족 = affordablePrice - dealAmount
  isAffordable: boolean;        // totalDiff >= 0
  limitingReason: string;       // "자기자본 부족" | "대출 한도 초과" | "구매 가능"
}

function calculatePropertyAffordability(
  property: Property,
  assetInput: AssetInput,
  loanResult: LoanResult,
): PropertyAffordability
```

핵심 로직:
- `requiredOwnCapital = dealAmount * (1 - loanResult.ltv)` (LTV 비율 적용)
- `requiredLoan = dealAmount - requiredOwnCapital`
- 대출 필요금이 `finalLoanLimit`을 초과하면 대출 한도 초과
- 자기자본이 `requiredOwnCapital`보다 부족하면 자기자본 부족

#### 레이아웃

```
┌─────────────────────────────────────────┐
│ 이 매물을 사려면                         │
│                                         │
│  매물 가격              8억 2,000만 원   │
│  ─────────────────────────────────       │
│  필요 자기자본          2억 4,600만 원   │
│  내 자기자본            2억 원     [부족] │
│  자기자본 부족분        ▲ 4,600만 원     │
│  ─────────────────────────────────       │
│  필요 대출금            5억 7,400만 원   │
│  내 대출 한도           6억 원     [여유] │
│  ─────────────────────────────────       │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 종합 판정                           │ │
│ │ 자기자본이 4,600만 원 부족합니다      │ │
│ │ [자기자본을 더 모으면 구매 가능해요]   │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

- Card variant="highlighted" (구매 가능 시) 또는 "default" (불가 시)
- 각 행은 `flex justify-between` 레이아웃
- 구분선: `border-b border-border`
- 종합 판정 영역: 하단에 bg-surface rounded-[12px] p-4
- 판정 텍스트 색상: 구매 가능이면 `text-success`, 불가면 `text-danger`

#### 종합 판정 메시지 규칙

| 상태 | 메시지 |
|------|--------|
| 자기자본 + 대출 모두 충분 | "현재 조건으로 구매 가능합니다" |
| 자기자본 부족, 대출 여유 | "자기자본이 {X}만 원 부족합니다" |
| 자기자본 여유, 대출 초과 | "대출 한도가 {X}만 원 부족합니다" |
| 둘 다 부족 | "자기자본 {X}만 원, 대출 한도 {Y}만 원이 부족합니다" |

---

### 4.4 추천 대출 상품

**컴포넌트명**: `RecommendedLoanProducts`
**위치**: `src/components/properties/detail/RecommendedLoanProducts.tsx`

#### 데이터 소스

기존 `/api/loan-products` API에서 가져온 `BankLoanProduct[]`를 **이 매물의 가격 기준**으로 재계산.

#### 표시 로직

1. 이 매물의 `requiredLoan` (필요 대출금)을 기준으로 월상환액 재계산
2. `minRate` 기준 오름차순 정렬
3. 상위 5개만 표시
4. 정책대출 자격(`loanResult.policyLoans`)에 해당하는 상품이 있으면 최상단에 별도 표시

#### 표시 데이터 (상품별)

| 항목 | 계산 | 스타일 |
|------|------|--------|
| 은행명 | `product.bankName` | font-semibold |
| 상품명 | `product.productName` | text-secondary |
| 금리 | `product.minRate ~ product.maxRate` | text-accent, bold |
| 금리유형 | `product.rateType` | Badge (기존 스타일) |
| 이 매물 기준 월상환액 | `calculateMonthlyPayment(requiredLoan, minRate, termYears)` | 18px bold |
| 총 이자 비용 | `(monthlyPayment * termYears * 12) - requiredLoan` | text-secondary |

#### 레이아웃

```
┌─────────────────────────────────────────┐
│ 추천 대출 상품                           │
│ 필요 대출금 5억 7,400만 원 기준           │
│                                         │
│ ┌─ 정책대출 (자격 충족) ───────────────┐ │
│ │ 보금자리론                           │ │
│ │ 2.95% (고정)     월 240만 원         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ① 우리은행 · 주택담보대출            │ │
│ │ [고정] 3.12% ~ 4.55%               │ │
│ │ 월 상환액  247만 원                  │ │
│ │ 총 이자    3,100만 원                │ │
│ ├─────────────────────────────────────┤ │
│ │ ② KB국민은행 · KB주택담보대출        │ │
│ │ [변동] 3.25% ~ 4.80%               │ │
│ │ 월 상환액  252만 원                  │ │
│ │ 총 이자    3,320만 원                │ │
│ └─────────────────────────────────────┘ │
│                                         │
│      [전체 상품 보기] (ghost 버튼)        │
└─────────────────────────────────────────┘
```

- 정책대출 섹션: Card variant="highlighted"로 시각 구분
- 일반 상품: 번호 매기기, 구분선으로 분리
- "전체 상품 보기" 버튼: Modal로 기존 `BankComparisonTable` 재사용
  - Modal 내에서 `loanAmount`를 `requiredLoan`으로 전달

#### 기존 코드 재사용

- `BankComparisonTable` 컴포넌트: Modal 내에서 `loanAmount={requiredLoan}` prop으로 재사용
- `calculateMonthlyPayment` 함수: 그대로 사용
- Badge 컴포넌트의 `rateTypeBadgeVariant` 로직: 공유 유틸로 추출

---

### 4.5 월 상환 시뮬레이션

**컴포넌트명**: `MonthlyPaymentSimulation`
**위치**: `src/components/properties/detail/MonthlyPaymentSimulation.tsx`

#### 핵심 차이 (기존 LoanSlider와의 차별점)

기존 `LoanSlider`는 **대출 금액**을 조절하는 슬라이더.
이 시뮬레이션은 **금리**를 조절하여 월 상환액 변화를 확인하는 인터랙션.

#### 조절 가능 파라미터

| 파라미터 | 입력 방식 | 범위 | 기본값 | 단위 |
|---------|----------|------|--------|------|
| 금리 | 슬라이더 (range input) | 2.0% ~ 8.0% | 추천 상품 중 최저금리 또는 4.0% | 0.1% |
| 상환 방식 | Toggle | 원리금균등 / 원금균등 | `assetInput.repaymentType` | - |

#### 표시 데이터

| 항목 | 계산 | 스타일 |
|------|------|--------|
| 대출 원금 | `requiredLoan` (고정, 조절 불가) | 16px, text-secondary |
| 적용 금리 | 슬라이더 값 | 28px bold, text-accent |
| 월 상환액 | `calculateMonthlyPayment` 또는 `calculateMonthlyPaymentEqualPrincipal` | 28px bold, text-primary |
| 총 상환액 | `monthlyPayment * termYears * 12` | 16px, text-secondary |
| 총 이자 | `totalPayment - requiredLoan` | 16px, text-warning |
| 소득 대비 비율 | `(monthlyPayment * 12) / annualIncome * 100` | 진행 바 + 퍼센트 |

#### 레이아웃

```
┌─────────────────────────────────────────┐
│ 월 상환 시뮬레이션                       │
│ 대출 원금: 5억 7,400만 원                │
│                                         │
│ 금리                                    │
│ ────●──────────────────── 3.5%          │
│ 2.0%                              8.0%  │
│                                         │
│ 상환 방식                               │
│ [원리금균등 ○─── 원금균등]               │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 월 상환액           256만 원        │ │
│ │ ─────────────────────────────────── │ │
│ │ 총 상환액      9억 2,160만 원       │ │
│ │ 총 이자        3억 4,760만 원       │ │
│ ├─────────────────────────────────────┤ │
│ │ 소득 대비 부담률                    │ │
│ │ ████████████░░░░░░░░░░ 42%         │ │
│ │ ※ 40% 이하 권장                     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

- 슬라이더: 기존 `LoanSlider`의 스타일 패턴 재사용 (slider-input CSS 클래스)
- Toggle: 기존 Toggle 컴포넌트 사용
- 소득 대비 비율 진행 바:
  - 40% 이하: `bg-success`
  - 40~50%: `bg-warning`
  - 50% 초과: `bg-danger`
- 금리 슬라이더 조작 시 debounce 300ms (기존 LoanSlider 패턴)

#### 신규 계산

기존 함수만으로 충분하다. 추가 함수 불필요.
- `calculateMonthlyPayment(requiredLoan, rate, termYears)` -- 원리금균등
- `calculateMonthlyPaymentEqualPrincipal(requiredLoan, rate, termYears)` -- 원금균등
- 소득 대비 비율: `(monthlyPayment * 12) / assetInput.annualIncome * 100` (인라인 산술)

---

### 4.6 비슷한 매물

**컴포넌트명**: `SimilarProperties`
**위치**: `src/components/properties/detail/SimilarProperties.tsx`

#### 매칭 로직

Zustand store의 `properties` 배열에서 현재 매물을 제외하고 유사도 기준 정렬.

**유사도 점수 계산** (`src/lib/utils/property.ts`에 추가):

```typescript
function calculateSimilarity(target: Property, candidate: Property): number
```

가중치:
| 기준 | 가중치 | 설명 |
|------|--------|------|
| 같은 동 | 30점 | `dong` 일치 |
| 같은 건물 타입 | 20점 | `propertyType` 일치 |
| 면적 유사 | 25점 | 면적 차이 비율 기반 (10% 이내 만점, 비례 감소) |
| 가격 유사 | 25점 | 가격 차이 비율 기반 (20% 이내 만점, 비례 감소) |

상위 5개 표시.

#### 표시 형식

기존 `PropertyCard` 컴포넌트를 그대로 재사용.
가로 스크롤 컨테이너에 배치.

#### 레이아웃

```
┌─────────────────────────────────────────┐
│ 비슷한 매물                              │
│                                         │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│ │Card 1│ │Card 2│ │Card 3│ │Card 4│ →  │
│ └──────┘ └──────┘ └──────┘ └──────┘    │
└─────────────────────────────────────────┘
```

- 가로 스크롤: `overflow-x-auto`, `flex`, `gap-4`, `snap-x snap-mandatory`
- 각 카드: `min-w-[280px]`, `snap-start`
- 카드 클릭 시: 해당 매물 상세 페이지로 이동 (`router.push`)
- 0건이면 섹션 자체를 렌더링하지 않음

---

## 5. 상태 관리

### 5.1 Store 변경 사항

Zustand store에 새로운 필드는 추가하지 않는다.
필요한 데이터는 모두 기존 `properties`, `assetInput`, `loanResult`에서 파생 가능.

### 5.2 페이지 로컬 상태

| 상태 | 타입 | 용도 |
|------|------|------|
| `simulationRate` | `number` | 시뮬레이션 금리 슬라이더 값 |
| `simulationRepaymentType` | `'equal_payment' \| 'equal_principal'` | 상환 방식 토글 |
| `showAllProducts` | `boolean` | 전체 대출 상품 Modal 열림 여부 |
| `loanProducts` | `BankLoanProduct[]` | API에서 가져온 대출 상품 (fetch on mount) |
| `isLoadingProducts` | `boolean` | 대출 상품 로딩 상태 |

---

## 6. 신규 파일 목록

### 6.1 페이지

| 파일 | 설명 |
|------|------|
| `src/app/properties/[id]/page.tsx` | 매물 상세 페이지 (라우트) |

### 6.2 컴포넌트

| 파일 | 설명 |
|------|------|
| `src/components/properties/detail/PropertyDetailHeader.tsx` | 매물 기본 정보 |
| `src/components/properties/detail/PropertyLocationMap.tsx` | 위치 지도 |
| `src/components/properties/detail/AffordabilityAnalysis.tsx` | 구매 가능성 분석 |
| `src/components/properties/detail/RecommendedLoanProducts.tsx` | 추천 대출 상품 |
| `src/components/properties/detail/MonthlyPaymentSimulation.tsx` | 월 상환 시뮬레이션 |
| `src/components/properties/detail/SimilarProperties.tsx` | 비슷한 매물 |

### 6.3 유틸/로직

| 파일 | 설명 |
|------|------|
| `src/lib/utils/property.ts` | slug 생성/파싱, 유사도 계산 |
| `src/lib/calculation/affordability.ts` | 매물별 구매 가능성 분석 계산 |
| `src/hooks/useKakaoMap.ts` | 카카오맵 초기화 커스텀 훅 (PropertyMap에서 추출) |

### 6.4 테스트

| 파일 | 설명 |
|------|------|
| `src/lib/calculation/affordability.test.ts` | 구매 가능성 계산 단위 테스트 |
| `src/lib/utils/property.test.ts` | slug, 유사도 계산 단위 테스트 |

---

## 7. 기존 코드 수정 사항

### 7.1 PropertyCard에 링크 추가

`src/components/properties/PropertyCard.tsx`:
- `onClick` prop 추가 또는 전체를 `<Link>` 래핑
- 클릭 시 `/properties/${generatePropertySlug(property)}`로 네비게이션
- 커서 pointer, hover 시 미세한 scale transition (토스 스타일 마이크로인터랙션)

### 7.2 카카오맵 로직 추출

`src/components/properties/PropertyMap.tsx`:
- 맵 초기화 로직을 `useKakaoMap` 훅으로 추출
- `REGION_CENTER_COORDS`, `getPropertyCoords`, `createMarkerImage`를 별도 유틸 파일로 이동
- PropertyMap은 추출된 훅/유틸을 import하여 기존 동작 유지 (비파괴적 리팩터링)

### 7.3 Header 컴포넌트 확장

기존 `Header.tsx`가 뒤로가기 버튼을 지원하는지 확인 필요.
지원하지 않으면 `showBack?: boolean`, `onBack?: () => void` prop 추가.

---

## 8. 에러/빈 상태 처리

| 상태 | UI |
|------|-----|
| Store에 loanResult 없음 | 전체 화면 안내: "자산 정보를 먼저 입력해주세요" + Button("자산 입력하기" -> /input) |
| Store에 properties 비어있음 | 전체 화면 안내: "매물 데이터가 없습니다" + Button("매물 검색하기" -> /properties) |
| slug 매칭 실패 | 전체 화면 안내: "매물을 찾을 수 없습니다" + Button("매물 목록으로" -> /properties) |
| 대출 상품 API 실패 | Section 4만 에러 표시, "다시 시도" 버튼 (나머지 섹션 정상 렌더링) |
| 카카오맵 키 없음 | Section 2만 fallback UI (기존 패턴), 나머지 정상 |
| 비슷한 매물 0건 | Section 6 렌더링 생략 |

---

## 9. 성능 고려사항

### 9.1 렌더링 최적화

- 시뮬레이션 슬라이더의 `calculateMonthlyPayment` 호출에 debounce 300ms 적용
- 비슷한 매물 `calculateSimilarity`는 `useMemo`로 메모이제이션
- 대출 상품 API는 페이지 마운트 시 1회만 호출, AbortController로 cleanup

### 9.2 코드 분할 고려

- 카카오맵 SDK 로딩은 비동기 (기존 패턴 유지)
- 대출 상품 Modal은 `showAllProducts`가 true일 때만 렌더링

---

## 10. 접근성

| 요소 | 접근성 처리 |
|------|-----------|
| 금리 슬라이더 | `aria-label`, `aria-valuemin/max/now/text` (기존 LoanSlider 패턴) |
| 상환 방식 토글 | 기존 Toggle 컴포넌트 (role="switch", aria-checked) |
| 지도 | `aria-label="매물 위치 지도"` |
| 비슷한 매물 스크롤 | `role="list"`, 각 카드 `role="listitem"` |
| 종합 판정 | `aria-live="polite"` (슬라이더 조작 시 결과 변경 알림) |
| Modal | 기존 Modal 컴포넌트 (role="dialog", aria-modal, Escape 닫기) |

---

## 11. 구현 순서 권장

단계별로 PR을 분리하여 점진 구현을 권장한다.

| 순서 | 범위 | 의존성 |
|------|------|--------|
| 1 | 유틸: slug 생성/파싱, 유사도 계산 + 테스트 | 없음 |
| 2 | 유틸: affordability 계산 + 테스트 | 없음 |
| 3 | 리팩터링: 카카오맵 훅 추출, PropertyCard 링크 추가 | 1 |
| 4 | 페이지 라우트 + Section 1 (기본 정보) + 가드 | 1, 3 |
| 5 | Section 2 (위치 지도) | 3, 4 |
| 6 | Section 3 (구매 가능성 분석) | 2, 4 |
| 7 | Section 4 (추천 대출 상품) | 2, 4 |
| 8 | Section 5 (월 상환 시뮬레이션) | 4 |
| 9 | Section 6 (비슷한 매물) | 1, 3, 4 |

---

## 12. 미해결 결정 사항

구현 전에 확인이 필요한 항목:

1. **URL에 한글 포함 여부**: slug에 건물명(한글)을 포함할 것인가, 아니면 순수 숫자 조합으로 갈 것인가?
   - 한글 포함 시 가독성 향상, SEO에 유리하나 인코딩 복잡도 증가
   - 숫자 조합 시: `{regionCode}-{dealAmount}-{area}-{floor}` (동명이인 매물 충돌 가능)

2. **카카오맵 주변 정보 표시 여부**: 카카오맵 SDK의 Places 라이브러리를 추가 로드하면 주변 편의시설(학교, 지하철 등) 마커를 표시할 수 있다. MVP에 포함할 것인지 후속 기능으로 뺄 것인지.

3. **정책대출 상세 조건**: Section 4에서 정책대출(디딤돌, 보금자리, 버팀목) 자격 충족 시 해당 상품의 금리/한도를 어디서 가져올 것인가? 현재 FSS API에는 정책대출이 포함되지 않을 수 있으며, 하드코딩 또는 별도 데이터 소스가 필요할 수 있다.

4. **공유 기능**: 매물 상세 페이지 URL을 카카오톡/클립보드로 공유하는 기능 포함 여부. URL 직접 접근 시 store가 비어있으므로, 공유를 지원하려면 URL 파라미터에 최소한의 자산 정보를 인코딩하거나 서버 사이드 데이터 소스가 필요하다.
