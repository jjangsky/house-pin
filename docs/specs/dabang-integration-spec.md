# 다방 실시간 매물 연동 기능 명세서

> 작성일: 2026-03-22
> 상태: 설계 완료, 구현 대기

---

## 목차

1. [아키텍처 개요](#1-아키텍처-개요)
2. [Feature 1: 실거래 / 현재 매물 탭 분리](#2-feature-1-실거래--현재-매물-탭-분리)
3. [Feature 2: 시세 비교 (호가 vs 실거래)](#3-feature-2-시세-비교)
4. [Feature 3: 매물 카드 강화](#4-feature-3-매물-카드-강화)
5. [Feature 4: 매물 상세 페이지 확장](#5-feature-4-매물-상세-페이지-확장)
6. [구현 순서 및 의존성](#6-구현-순서-및-의존성)
7. [위험 요소 및 대응 전략](#7-위험-요소-및-대응-전략)

---

## 1. 아키텍처 개요

### 1.1 현재 데이터 흐름

```
사용자 자산 입력
  → 대출 가능액 계산 (affordablePrice)
  → 지역 선택 (regionCodes: string[])
  → POST /api/real-estate/batch
    → 국토부 MOLIT API (실거래가)
    → 카카오 지오코딩
    → Property[] 반환
  → PropertyView (리스트/지도 토글)
```

### 1.2 다방 연동 후 데이터 흐름

```
사용자 자산 입력
  → 대출 가능액 계산 (affordablePrice)
  → 지역 선택 (regionCodes: string[])
  → PropertiesPage에서 두 데이터 소스 병렬 호출:
    ┌─ POST /api/real-estate/batch          (기존 MOLIT, Property[])
    └─ POST /api/real-estate/dabang         (신규, DabangListing[])
  → PropertyView에 탭 추가:
    ┌─ "실거래 내역" 탭 → 기존 PropertyList (Property[])
    └─ "현재 매물" 탭 → 신규 DabangPropertyList (DabangListing[])
  → 시세 비교 엔진: complexName + dongName 기준 매칭
```

### 1.3 핵심 설계 결정

**별도 타입 사용 (DabangListing) vs Property 확장**

Property 타입을 확장하지 않고 별도 `DabangListing` 타입을 사용한다.

근거:
- 기존 `Property`는 MOLIT 실거래 데이터에 특화된 필드를 가짐 (dealYear/Month/Day, buildYear, jibun, regionCode, floor)
- 다방 데이터에는 이 필드들이 존재하지 않음 (실시간 매물이므로 거래일 개념 없음)
- 다방에만 있는 필드가 다수 존재 (imgUrlList, isPano, isOwnerAuth, roomTitle, roomDesc)
- Union 타입으로 합치면 모든 소비자 코드에서 분기 처리가 필요해 복잡도가 급증
- 별도 타입으로 분리하면 각 데이터 소스의 컴포넌트가 독립적으로 발전 가능

공통 인터페이스가 필요한 지점(지도 핀, 가격 비교)에서만 공유 인터페이스를 사용한다.

```typescript
// 지도와 가격 비교에서 공통으로 필요한 최소 인터페이스
interface Locatable {
  lat: number;
  lng: number;
  name: string;
  price: number; // 만원 단위
  propertyType: 'apartment' | 'villa' | 'officetel';
}
```

---

## 2. Feature 1: 실거래 / 현재 매물 탭 분리

### 2.1 개요

기존 PropertyView의 "리스트/지도" 토글 상위에 "실거래 내역" / "현재 매물" 데이터 소스 탭을 추가한다.

### 2.2 타입 정의

```typescript
// src/types/dabang.ts (신규 파일)

/** 다방 API 원본 응답의 매물 1건 */
export interface DabangRoomRaw {
  seq: number;
  id: string;
  roomTypeName: string;       // "아파트" | "오피스텔" | "빌라/연립" 등
  randomLocation: {
    lat: number;
    lng: number;
  };
  complexName: string;
  roomTitle: string;
  roomDesc: string;            // "9층, 82.58m², 관리비 20만"
  priceTypeName: string;       // "매매"
  priceTitle: string;          // "9억000"
  imgUrlList: string[];
  dongName: string;
  gid: number;
  isQuick: boolean;
  isPano: boolean;
  isOwnerAuth: boolean;
  isNaverVerify: boolean;
}

/** 다방 API bbox 응답 전체 */
export interface DabangBboxResponse {
  roomList: DabangRoomRaw[];
  total: number;
  hasMore: boolean;
}

/** 앱 내부에서 사용하는 정제된 다방 매물 */
export interface DabangListing {
  // 식별
  dabangSeq: number;
  dabangId: string;

  // 기본 정보
  name: string;                // complexName
  dongName: string;
  roomTitle: string;
  roomDesc: string;
  propertyType: 'apartment' | 'villa' | 'officetel';

  // 가격 (만원 단위)
  askingPrice: number;         // priceTitle 파싱 결과
  priceDisplay: string;        // 원본 priceTitle ("9억000")

  // 위치
  lat: number;
  lng: number;

  // 면적/층 (roomDesc 파싱)
  area: number | null;         // m² (파싱 실패 시 null)
  floor: number | null;        // 층 (파싱 실패 시 null)

  // 미디어
  imgUrlList: string[];
  thumbnailUrl: string | null; // imgUrlList[0] ?? null

  // 다방 전용 플래그
  isPano: boolean;
  isOwnerAuth: boolean;
  isNaverVerify: boolean;
  isQuick: boolean;

  // 메타
  source: 'dabang';            // 리터럴 타입으로 데이터 소스 식별
}

/** 다방 매물 일괄 조회 요청 */
export interface DabangBatchRequest {
  regionCodes: string[];       // 기존 5자리 시군구 코드
  categories: ('apt' | 'officetel' | 'house')[];
  maxPrice: number;            // 만원 단위 (affordablePrice)
}

/** 다방 매물 일괄 조회 응답 */
export interface DabangBatchResponse {
  listings: DabangListing[];
  meta: {
    totalFetched: number;
    totalFiltered: number;
    failedRegions: string[];   // 실패한 regionCode 목록
    rateLimited: boolean;      // rate limit 감지 여부
  };
}
```

### 2.3 API Route 설계

#### 엔드포인트: `POST /api/real-estate/dabang`

```
요청 (client → Next.js):
  POST /api/real-estate/dabang
  Body: DabangBatchRequest

Next.js API Route 처리:
  1. regionCodes → REGION_CENTER_COORDS에서 중심 좌표 조회
  2. 중심 좌표 → bbox 변환 (오프셋 적용)
  3. maxPrice → tradeRange 필터 변환
  4. categories별 다방 API 호출 (병렬, 동시성 제한)
  5. 응답 정제 → DabangListing[] 변환
  6. 가격 범위 재필터링 (다방 필터가 부정확할 수 있음)

응답 (Next.js → client):
  DabangBatchResponse
```

#### 파일: `src/app/api/real-estate/dabang/route.ts` (신규)

```typescript
// 핵심 로직만 의사코드로 표현

export async function POST(request: NextRequest) {
  const body: DabangBatchRequest = await request.json();

  // 유효성 검증 (기존 batch route와 동일 패턴)
  // ...

  const result = await fetchDabangBatch(body);
  return NextResponse.json(result);
}
```

### 2.4 Region Code → Bounding Box 변환

기존 `REGION_CENTER_COORDS` (PropertyMap.tsx에 정의)를 공유 상수로 추출하여 재사용한다.

#### 변환 전략

```typescript
// src/lib/api/dabang.ts (신규 파일)

import { REGION_CENTER_COORDS } from '@/constants/regionCoords';

/** 시군구 단위 bbox 오프셋 (위도/경도 기준 약 2~3km 범위) */
const BBOX_OFFSET = {
  lat: 0.025,  // 약 2.8km
  lng: 0.03,   // 약 2.5km (위도 37도 기준)
};

interface BBox {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
}

/** regionCode → 다방 API용 bbox 변환 */
export function regionCodeToBbox(regionCode: string): BBox | null {
  const center = REGION_CENTER_COORDS[regionCode];
  if (!center) return null;

  return {
    sw: {
      lat: center.lat - BBOX_OFFSET.lat,
      lng: center.lng - BBOX_OFFSET.lng,
    },
    ne: {
      lat: center.lat + BBOX_OFFSET.lat,
      lng: center.lng + BBOX_OFFSET.lng,
    },
  };
}
```

**한계와 대응:**
- 시군구의 실제 경계는 사각형이 아니므로 bbox가 인접 지역을 포함할 수 있음
- dongName으로 후처리 필터링하거나, 사용자에게 "인근 포함" 안내 표시
- 향후 정밀 bbox 데이터를 별도 매핑 테이블로 관리 가능

### 2.5 가격 필터 매핑

```typescript
/** affordablePrice(만원) → 다방 tradeRange 필터 */
function toTradeRange(affordablePrice: number): { min: number; max: number } {
  return {
    min: 0,
    max: affordablePrice,  // 이미 만원 단위이므로 그대로 사용
  };
}
```

### 2.6 priceTitle 파싱

```typescript
// src/lib/utils/dabangParser.ts (신규 파일)

/**
 * 다방 priceTitle → 만원 단위 숫자 변환
 *
 * 입력 예시:
 *   "9억000"     → 90000
 *   "4억2,000"   → 42000
 *   "8,500"      → 8500
 *   "12억5,000"  → 125000
 *   "1억"        → 10000
 */
export function parseDabangPrice(priceTitle: string): number {
  const cleaned = priceTitle.replace(/,/g, '').trim();

  const eokMatch = cleaned.match(/(\d+)억/);
  const manMatch = cleaned.match(/억(\d+)|^(\d+)$/);

  let total = 0;

  if (eokMatch) {
    total += parseInt(eokMatch[1], 10) * 10000;
  }

  if (manMatch) {
    const manValue = manMatch[1] ?? manMatch[2];
    if (manValue) {
      total += parseInt(manValue, 10);
    }
  }

  return total;
}

/**
 * roomDesc → 면적(m²)과 층수 파싱
 *
 * 입력 예시: "9층, 82.58m², 관리비 20만"
 */
export function parseRoomDesc(roomDesc: string): {
  area: number | null;
  floor: number | null;
} {
  const areaMatch = roomDesc.match(/([\d.]+)\s*m²/);
  const floorMatch = roomDesc.match(/(\d+)층/);

  return {
    area: areaMatch ? parseFloat(areaMatch[1]) : null,
    floor: floorMatch ? parseInt(floorMatch[1], 10) : null,
  };
}

/** roomTypeName → 내부 propertyType 변환 */
export function mapRoomType(
  roomTypeName: string,
): 'apartment' | 'villa' | 'officetel' {
  if (roomTypeName.includes('아파트')) return 'apartment';
  if (roomTypeName.includes('오피스텔')) return 'officetel';
  return 'villa'; // 빌라/연립/다세대 등
}
```

### 2.7 Rate Limit 대응 전략

다방 API는 약 10회 연속 호출 시 IP 기반 차단이 발생한다.

**서버 사이드 대응 (Next.js API Route):**

```typescript
// src/lib/api/dabang.ts

/** 다방 API 호출 간격 (ms) */
const DABANG_REQUEST_DELAY = 500;

/** 최대 동시 호출 수 */
const DABANG_CONCURRENCY = 2;

/** 최대 총 호출 수 (한 번의 사용자 요청당) */
const DABANG_MAX_CALLS_PER_REQUEST = 8;
```

**전략 1: 호출 횟수 제한**
- 사용자가 선택한 지역 최대 5개 x 카테고리 최대 3개 = 최대 15개 조합
- 15개를 모두 호출하면 rate limit 확실히 발생
- 카테고리를 apt만 기본으로 하고, 사용자가 명시적으로 선택한 카테고리만 호출
- 또는 지역 수에 따라 카테고리를 자동 축소:
  - 1~2개 지역: apt + officetel + house (3 카테고리)
  - 3~4개 지역: apt + officetel (2 카테고리)
  - 5개 지역: apt만 (1 카테고리)

**전략 2: 지연 삽입**
- 각 호출 사이에 500ms 지연
- 동시 실행을 최대 2개로 제한 (기존 parallelLimit 유틸 활용)

**전략 3: 서버 사이드 캐싱**
- 같은 bbox + 필터 조합의 응답을 5분간 메모리 캐시
- Map<string, { data: DabangRoomRaw[]; expiry: number }>
- LRU 방식으로 최대 50개 항목 유지

```typescript
// src/lib/api/dabangCache.ts (신규 파일)

const cache = new Map<string, { data: DabangBboxResponse; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5분
const MAX_CACHE_SIZE = 50;

export function getCached(key: string): DabangBboxResponse | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCache(key: string, data: DabangBboxResponse): void {
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}
```

**전략 4: 클라이언트 UX 대응**
- rate limit 감지 시 (400 응답) 부분 결과 반환 + 안내 메시지
- "일부 지역의 매물을 불러오지 못했습니다. 잠시 후 다시 시도해주세요."

### 2.8 로딩 상태 설계

두 데이터 소스의 로딩이 독립적이므로, 먼저 완료된 쪽부터 표시한다.

```typescript
// PropertiesPage 상태
const [molitLoading, setMolitLoading] = useState(true);
const [dabangLoading, setDabangLoading] = useState(true);
const [molitData, setMolitData] = useState<Property[]>([]);
const [dabangData, setDabangData] = useState<DabangListing[]>([]);
const [dabangError, setDabangError] = useState<string | null>(null);
const [activeTab, setActiveTab] = useState<'molit' | 'dabang'>('molit');
```

사용자가 "현재 매물" 탭으로 전환했을 때 다방 데이터가 아직 로딩 중이면 기존 LoadingProgress 컴포넌트를 재사용한다.

### 2.9 Store 확장

```typescript
// src/types/index.ts에 추가

export interface HousePinStore {
  // ... 기존 필드 ...

  // 다방 매물
  dabangListings: DabangListing[];
  setDabangListings: (listings: DabangListing[]) => void;
}
```

Store에 다방 데이터를 저장하는 이유: 매물 상세 페이지에서 다방 매물을 slug로 조회할 때 필요하다. 기존 properties와 동일한 패턴을 따른다.

### 2.10 신규/수정 파일 목록

| 파일 | 상태 | 설명 |
|------|------|------|
| `src/types/dabang.ts` | 신규 | DabangListing, DabangBatchRequest 등 타입 |
| `src/lib/utils/dabangParser.ts` | 신규 | priceTitle, roomDesc 파싱 |
| `src/lib/api/dabang.ts` | 신규 | 다방 API 호출 + bbox 변환 |
| `src/lib/api/dabangCache.ts` | 신규 | 서버 사이드 메모리 캐시 |
| `src/app/api/real-estate/dabang/route.ts` | 신규 | API Route 핸들러 |
| `src/constants/regionCoords.ts` | 신규 | REGION_CENTER_COORDS 공유 상수 (PropertyMap에서 추출) |
| `src/components/properties/PropertyView.tsx` | 수정 | 데이터 소스 탭 추가 |
| `src/components/properties/DabangPropertyList.tsx` | 신규 | 다방 매물 전용 리스트 |
| `src/app/properties/page.tsx` | 수정 | 다방 API 병렬 호출 + 상태 관리 |
| `src/store/useHousePinStore.ts` | 수정 | dabangListings 추가 |
| `src/types/index.ts` | 수정 | HousePinStore 확장 |
| `src/components/properties/PropertyMap.tsx` | 수정 | REGION_CENTER_COORDS import 변경 |

---

## 3. Feature 2: 시세 비교

### 3.1 개요

동일 단지(complexName)와 동(dongName) 기준으로 MOLIT 실거래 데이터와 다방 호가를 매칭하여, "최근 실거래 X억 / 현재 호가 Y억" 비교 정보를 제공한다.

### 3.2 매칭 전략

```typescript
// src/lib/calculation/priceComparison.ts (신규 파일)

interface PriceComparison {
  dabangListing: DabangListing;
  matchedTransactions: Property[];  // 매칭된 실거래 내역
  recentDealPrice: number | null;   // 가장 최근 실거래가 (만원)
  avgDealPrice: number | null;      // 평균 실거래가 (만원)
  askingPrice: number;              // 현재 호가 (만원)
  premiumRate: number | null;       // 호가율 (%) = (호가 - 실거래) / 실거래 * 100
  matchConfidence: 'high' | 'medium' | 'low';
}
```

**매칭 알고리즘:**

```
1단계 (high confidence): complexName 정확 일치 + dongName 일치
  → 같은 단지의 같은 동 거래
  → 신뢰도 높음

2단계 (medium confidence): complexName 부분 일치 + dongName 일치
  → complexName 정규화 후 비교 (괄호 내용 제거, 공백 정규화)
  → 예: "대치우정에쉐르2(주상복합)" ↔ "대치우정에쉐르2차"

3단계 (low confidence): dongName만 일치 + 가격대 유사 (±30%)
  → 같은 동 내 비슷한 가격대
  → 직접 비교보다는 "해당 동 시세 참고" 수준
```

**complexName 정규화:**

```typescript
function normalizeComplexName(name: string): string {
  return name
    .replace(/\(.*?\)/g, '')     // 괄호 내용 제거
    .replace(/\s+/g, '')         // 공백 제거
    .replace(/[0-9]+차?$/, '')   // 끝의 "2차", "3" 등 제거
    .trim();
}
```

### 3.3 호가율 계산

```typescript
/**
 * 호가율 = (현재 호가 - 최근 실거래가) / 최근 실거래가 * 100
 *
 * 양수: 호가가 실거래 대비 높음 (일반적)
 * 음수: 호가가 실거래 대비 낮음 (급매 가능성)
 * 0 근처: 시세 수준
 */
function calculatePremiumRate(
  askingPrice: number,
  recentDealPrice: number,
): number {
  if (recentDealPrice === 0) return 0;
  return Math.round(
    ((askingPrice - recentDealPrice) / recentDealPrice) * 1000,
  ) / 10; // 소수점 1자리
}
```

### 3.4 UI 표현

호가율을 시각적 인디케이터로 표시한다.

```
호가율 < -5%  : 초록색  "급매 가능성"  🟢
호가율 -5~+5% : 회색    "시세 수준"    ⚪
호가율 +5~+15%: 주황색  "소폭 높음"    🟡
호가율 > +15% : 빨간색  "높은 호가"    🔴
```

DabangPropertyCard에 표시할 때:

```
┌─────────────────────────────────────┐
│ [아파트] 래미안대치팰리스            │
│                                     │
│ 호가 24억 5,000만 원                │
│ 최근 실거래 23억 원 (2026.01)       │
│ ──────────────────                  │
│ 호가율 +6.5% · 소폭 높음    [🟡]   │
│                                     │
│ 82m² (24.8평)  ·  강남구 대치동     │
└─────────────────────────────────────┘
```

매칭된 실거래가 없는 경우: "실거래 비교 정보 없음" 으로 회색 텍스트 표시.

### 3.5 신규 파일 목록

| 파일 | 상태 | 설명 |
|------|------|------|
| `src/lib/calculation/priceComparison.ts` | 신규 | 매칭 + 호가율 계산 |
| `src/components/properties/PremiumRateBadge.tsx` | 신규 | 호가율 시각 인디케이터 |

---

## 4. Feature 3: 매물 카드 강화

### 4.1 기존 PropertyCard와의 관계

기존 PropertyCard는 MOLIT Property 전용으로 유지한다. 다방 매물은 별도의 DabangPropertyCard를 만든다.

근거:
- 표시해야 할 필드가 상당히 다름 (이미지, VR 뱃지, 호가율, 중개사 정보 vs 거래일, 건축년도, 지번)
- 하나의 컴포넌트에 조건부 렌더링을 넣으면 복잡도만 증가
- 각 카드를 독립적으로 발전시킬 수 있음

### 4.2 DabangPropertyCard 구조

```typescript
// src/components/properties/DabangPropertyCard.tsx (신규)

interface DabangPropertyCardProps {
  listing: DabangListing;
  affordablePrice: number;
  priceComparison: PriceComparison | null; // Feature 2 연동
}
```

**레이아웃:**

```
┌──────────────────────────────────────────┐
│ ┌──────┐                                 │
│ │ 이미지 │  [현재 매물] [아파트] [VR🔵]  │
│ │ 썸네일 │  래미안대치팰리스              │
│ │ 80x80 │                                │
│ └──────┘  호가 24억 5,000만 원           │
│                                          │
│           최근 실거래 23억 (호가율 +6.5%) │
│           82m² (24.8평)  ·  대치동       │
│                                          │
│           [여유 1억 5,000만 원]           │
└──────────────────────────────────────────┘
```

**구성 요소:**

1. **이미지 썸네일**: `imgUrlList[0]` 사용, 80x80 rounded-[12px]
   - 이미지 없을 때: 회색 placeholder (건물 아이콘)
   - next/image 사용, CDN URL이므로 remotePatterns에 다방 CDN 도메인 추가 필요

2. **뱃지 영역**:
   - `[현재 매물]`: accent 색상 뱃지 (기존 PropertyCard의 `[실거래]`와 구분)
   - `[아파트/빌라/오피스텔]`: 기존과 동일한 타입 뱃지
   - `[VR]`: isPano === true일 때만 표시, 파란색 뱃지
   - `[집주인]`: isOwnerAuth === true일 때만 표시

3. **가격 영역**:
   - "호가 X억 Y만 원" (기존 "거래가" 대신 "호가" 라벨)
   - Feature 2 시세 비교 결과 (있으면 표시)

4. **여유/부족 뱃지**: 기존 PropertyCard와 동일 로직 (affordablePrice - askingPrice)

### 4.3 이미지 설정

```typescript
// next.config.ts에 추가

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd1774jszgerdmk.cloudfront.net', // 다방 CDN
      },
      {
        protocol: 'https',
        hostname: '**.dabangapp.com',
      },
    ],
  },
};
```

### 4.4 클릭 동작

DabangPropertyCard 클릭 시 `/properties/dabang-{dabangSeq}` 경로로 이동.

다방 매물용 slug는 `dabang-` 접두사로 기존 MOLIT 매물과 구분한다.

```typescript
function generateDabangSlug(listing: DabangListing): string {
  return `dabang-${listing.dabangSeq}`;
}

function isDabangSlug(slug: string): boolean {
  return slug.startsWith('dabang-');
}
```

### 4.5 신규 파일 목록

| 파일 | 상태 | 설명 |
|------|------|------|
| `src/components/properties/DabangPropertyCard.tsx` | 신규 | 다방 매물 카드 |
| `src/components/properties/DabangPropertyList.tsx` | 신규 | 다방 매물 리스트 (정렬, 필터, 페이징) |
| `src/components/properties/PropertyImagePlaceholder.tsx` | 신규 | 이미지 없을 때 placeholder |

---

## 5. Feature 4: 매물 상세 페이지 확장

### 5.1 데이터 전략 변경: 단지 상세 API 활용

매물 상세 API(`/api/3/new-room/detail`)는 불안정(403)하지만, **단지 상세 API(`/v5/complex/{id}`)는 안정적으로 동작**하며 매우 풍부한 데이터를 제공한다.

매물 리스트에서 `complexId`를 추출 → 단지 상세 API 호출 → 평면도, 학군, 시세, 주소 등 보완.

### 5.2 설계 방향

기존 `properties/[id]/page.tsx`에서 slug 접두사로 데이터 소스를 분기한다.

```typescript
// src/app/properties/[id]/page.tsx (수정)

export default function PropertyDetailPage({ params }) {
  const { id } = use(params);

  if (isLiveListingSlug(id)) {
    return <LiveDetailView slug={id} />;
  }

  return <MolitDetailView slug={id} />;  // 기존 로직
}
```

### 5.3 단지 상세 API Route

```
GET /api/real-estate/complex/{complexId}
```

서버에서 외부 API 호출 → 정제 후 반환. 5분 캐시 적용.

```typescript
// 응답 타입
interface ComplexDetail {
  name: string;
  address: string;
  jibunAddress: string;
  roadAddress: string;
  location: { lat: number; lng: number };  // 정확한 좌표
  householdNum: number;
  buildingNum: number;
  parkingAverage: number;
  providerName: string;      // 시공사
  heatTypeName: string;      // 난방
  useApprovalYear: string;   // 사용승인년도
  images: { url: string; title: string }[];

  // 평형 정보
  spaces: {
    pyeongType: string;
    bedsNum: number;
    bathNum: number;
    roomSpace: number;       // 전용면적
    supplySpace: number;     // 공급면적
    layoutImage: string;     // 평면도 이미지
  }[];

  // 학군
  education: {
    elementary: { name: string; distance: number; avgStudents: string }[];
    middle: { name: string; distance: number; avgStudents: string }[];
    high: { name: string; distance: number; avgStudents: string }[];
  };

  // 시세
  priceComparison: {
    scope: string;           // "해당 단지" | "대치동" | "강남구"
    tradePyeongPrice: number;
    leasePyeongPrice: number;
  }[];

  // 인근 단지
  nearComplexes: {
    name: string;
    desc: string;
    avgPyeongPrice: number;
  }[];
}
```

### 5.4 LiveDetailView 섹션 구성

```
1. 이미지 갤러리
   - 매물 이미지 (imgUrlList) + 단지 이미지 (complex.images) 합쳐서 표시
   - 스와이프 캐러셀 또는 그리드

2. 기본 정보 헤더
   - 단지명, 타입 뱃지, 호가, 여유/부족 뱃지
   - 면적, 층수, 동 정보
   - 정확한 주소 (단지 API에서 보완)

3. 단지 정보 카드 (신규, 단지 API 활용)
   - 사용승인년도, 세대수, 동수, 주차 (세대당)
   - 시공사, 난방 방식
   - 관리실 연락처

4. 평면도 (신규, 단지 API 활용)
   - 해당 평형의 평면도 이미지 표시
   - 전용/공급면적, 방수/욕실수

5. 시세 비교
   - 호가 vs 실거래 비교 (Feature 2)
   - 단지 vs 동 vs 구 평당가 비교 (단지 API의 areaAveragePrice)
   - 인근 단지 가격 비교

6. 학군 정보 (신규, 단지 API 활용)
   - 초/중/고 학교명, 거리, 학급당 학생수
   - 거리순 정렬

7. 구매 가능성 분석
   - 기존 AffordabilityAnalysis 재사용

8. 추천 대출 상품
   - 기존 RecommendedLoanProducts 재사용

9. 월 상환 시뮬레이션
   - 기존 MonthlyPaymentSimulation 재사용

10. 위치 지도
    - 단지 API의 정확한 좌표 사용 (randomLocation 대체)
    - 기존 PropertyLocationMap 재사용

11. 비슷한 매물
    - 인근 단지 데이터 + 같은 동 매물로 구성
```

### 5.4 기존 컴포넌트 재사용을 위한 어댑터

기존 AffordabilityAnalysis, RecommendedLoanProducts 등은 Property 타입을 받는다. DabangListing을 Property-like 구조로 변환하는 어댑터 함수를 만든다.

```typescript
// src/lib/utils/dabangAdapter.ts (신규)

import type { Property } from '@/types';
import type { DabangListing } from '@/types/dabang';

/**
 * DabangListing → Property 형태로 변환 (기존 컴포넌트 재사용용)
 * 다방 데이터에 없는 필드는 기본값으로 채움
 */
export function dabangToPropertyLike(listing: DabangListing): Property {
  return {
    name: listing.name,
    dealAmount: listing.askingPrice,
    area: listing.area ?? 0,
    floor: listing.floor ?? 0,
    dong: listing.dongName,
    propertyType: listing.propertyType,
    lat: listing.lat,
    lng: listing.lng,

    // 다방에 없는 필드 - 기본값
    buildYear: 0,
    dealYear: new Date().getFullYear(),
    dealMonth: new Date().getMonth() + 1,
    dealDay: new Date().getDate(),
    jibun: '',
    regionCode: '',
  };
}
```

### 5.5 이미지 갤러리 컴포넌트

```typescript
// src/components/properties/detail/ImageGallery.tsx (신규)

interface ImageGalleryProps {
  images: string[];
  altText: string;
}

// 구현:
// - 첫 이미지 large (전체 너비, aspect-ratio 4:3)
// - 나머지 이미지 썸네일 그리드 (2열)
// - 이미지 클릭 시 라이트박스 (선택사항, MVP에서는 생략 가능)
// - 최대 6장까지만 표시
```

### 5.6 "다방에서 보기" 링크

```typescript
function getDabangRoomUrl(dabangId: string): string {
  return `https://www.dabangapp.com/room/${dabangId}`;
}
```

이 링크는 다방 상세 API의 불안정성을 보완하는 핵심 UX 요소다. 중개사 연락처, 정확한 주소, VR 투어 등 리스트 API에서 얻을 수 없는 정보를 사용자가 직접 확인할 수 있도록 한다.

### 5.7 신규/수정 파일 목록

| 파일 | 상태 | 설명 |
|------|------|------|
| `src/components/properties/detail/DabangDetailView.tsx` | 신규 | 다방 매물 상세 |
| `src/components/properties/detail/ImageGallery.tsx` | 신규 | 이미지 갤러리 |
| `src/components/properties/detail/DabangDetailHeader.tsx` | 신규 | 다방 매물 헤더 (이미지+기본정보) |
| `src/components/properties/detail/PriceComparisonCard.tsx` | 신규 | 시세 비교 카드 |
| `src/lib/utils/dabangAdapter.ts` | 신규 | DabangListing → Property 어댑터 |
| `src/app/properties/[id]/page.tsx` | 수정 | slug 분기 로직 추가 |

---

## 6. 구현 순서 및 의존성

### Phase 1: 기반 인프라 (의존성 없음)

```
1-1. 타입 정의
     신규: src/types/dabang.ts
     수정: src/types/index.ts (HousePinStore 확장)

1-2. 파서 유틸
     신규: src/lib/utils/dabangParser.ts
     테스트: src/lib/utils/dabangParser.test.ts
     ※ 파서는 순수 함수이므로 단위 테스트 필수

1-3. REGION_CENTER_COORDS 추출
     신규: src/constants/regionCoords.ts
     수정: src/components/properties/PropertyMap.tsx (import 변경)
```

### Phase 2: 서버 사이드 (Phase 1에 의존)

```
2-1. 다방 API 클라이언트
     신규: src/lib/api/dabang.ts (bbox 변환, API 호출, rate limit 제어)
     신규: src/lib/api/dabangCache.ts (메모리 캐시)

2-2. API Route
     신규: src/app/api/real-estate/dabang/route.ts
```

### Phase 3: 클라이언트 리스트 (Phase 2에 의존)

```
3-1. Store 확장
     수정: src/store/useHousePinStore.ts

3-2. DabangPropertyCard
     신규: src/components/properties/DabangPropertyCard.tsx
     신규: src/components/properties/PropertyImagePlaceholder.tsx

3-3. DabangPropertyList
     신규: src/components/properties/DabangPropertyList.tsx

3-4. PropertyView 탭 추가
     수정: src/components/properties/PropertyView.tsx

3-5. PropertiesPage 통합
     수정: src/app/properties/page.tsx
```

### Phase 4: 시세 비교 (Phase 3에 의존)

```
4-1. 매칭 엔진
     신규: src/lib/calculation/priceComparison.ts
     테스트: src/lib/calculation/priceComparison.test.ts

4-2. 호가율 뱃지
     신규: src/components/properties/PremiumRateBadge.tsx

4-3. DabangPropertyCard에 시세 비교 연동
     수정: src/components/properties/DabangPropertyCard.tsx
```

### Phase 5: 상세 페이지 (Phase 3, 4에 의존)

```
5-1. 어댑터 함수
     신규: src/lib/utils/dabangAdapter.ts

5-2. 이미지 갤러리
     신규: src/components/properties/detail/ImageGallery.tsx

5-3. 다방 상세 뷰
     신규: src/components/properties/detail/DabangDetailView.tsx
     신규: src/components/properties/detail/DabangDetailHeader.tsx
     신규: src/components/properties/detail/PriceComparisonCard.tsx

5-4. 상세 페이지 분기
     수정: src/app/properties/[id]/page.tsx

5-5. next.config.ts 이미지 도메인 추가
     수정: next.config.ts
```

### 의존성 그래프

```
Phase 1 (타입, 파서, 좌표)
    │
    ▼
Phase 2 (API 클라이언트, Route)
    │
    ▼
Phase 3 (카드, 리스트, 탭) ──────┐
    │                             │
    ▼                             ▼
Phase 4 (시세 비교)          Phase 5 (상세 페이지)
    │                             │
    └──────────► Phase 5 ◄────────┘
```

---

## 7. 위험 요소 및 대응 전략

### 7.1 다방 API 차단/변경 위험 (심각도: 높음)

비공식 API이므로 언제든 차단되거나 구조가 변경될 수 있다.

**대응:**
- 다방 API 호출을 `src/lib/api/dabang.ts` 한 곳에 격리
- 모든 다방 관련 UI에 graceful degradation 적용: API 실패 시 "현재 매물" 탭이 "서비스 점검 중" 표시로 전환
- 기존 MOLIT 실거래 기능은 다방 API와 완전히 독립적으로 동작
- 응답 스키마 검증을 추가하여 구조 변경 시 즉시 감지

```typescript
// 응답 검증 예시
function validateDabangResponse(data: unknown): data is DabangBboxResponse {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray((data as Record<string, unknown>).roomList)) return false;
  return true;
}
```

### 7.2 Rate Limit (심각도: 중간)

**대응:** 2.7절의 4가지 전략 참고. 추가로:
- 사용자에게 "현재 매물은 외부 서비스에서 가져오므로 일시적으로 조회가 제한될 수 있습니다" 안내문 표시
- 첫 로드 실패 시 자동 1회 재시도 (2초 후)

### 7.3 priceTitle 파싱 실패 (심각도: 낮음)

예상치 못한 가격 형식이 올 수 있다.

**대응:**
- 파서 테스트를 다양한 케이스로 작성
- 파싱 실패 시 해당 매물을 목록에서 제외하지 않고, 가격 0으로 처리 + "가격 정보 없음" 표시
- 파싱 실패 건수를 meta에 포함하여 모니터링 가능하게

### 7.4 좌표 부정확 (심각도: 낮음)

다방의 `randomLocation`은 의도적으로 약간 흐려진 좌표다.

**대응:**
- 지도에 표시할 때 "정확한 위치가 아닐 수 있습니다" 안내 표시
- 마커 아이콘을 기존 실거래 마커와 다른 스타일(반투명 또는 점선 원)로 표시하여 시각적으로 구분
- 매물 상세에서는 "다방에서 정확한 위치 확인" 링크 제공

### 7.5 CORS 문제 (심각도: 없음)

다방 API 호출은 Next.js API Route(서버 사이드)에서 수행하므로 CORS 문제가 발생하지 않는다. 클라이언트에서 직접 호출하지 않는다.

---

## 부록 A: 전체 신규 파일 목록

```
src/
├── types/
│   └── dabang.ts                                    (신규)
├── lib/
│   ├── api/
│   │   ├── dabang.ts                                (신규)
│   │   └── dabangCache.ts                           (신규)
│   ├── utils/
│   │   ├── dabangParser.ts                          (신규)
│   │   ├── dabangParser.test.ts                     (신규)
│   │   └── dabangAdapter.ts                         (신규)
│   └── calculation/
│       ├── priceComparison.ts                       (신규)
│       └── priceComparison.test.ts                  (신규)
├── constants/
│   └── regionCoords.ts                              (신규)
├── app/
│   └── api/
│       └── real-estate/
│           └── dabang/
│               └── route.ts                         (신규)
└── components/
    └── properties/
        ├── DabangPropertyCard.tsx                   (신규)
        ├── DabangPropertyList.tsx                   (신규)
        ├── PropertyImagePlaceholder.tsx              (신규)
        ├── PremiumRateBadge.tsx                     (신규)
        └── detail/
            ├── DabangDetailView.tsx                  (신규)
            ├── DabangDetailHeader.tsx                (신규)
            ├── ImageGallery.tsx                      (신규)
            └── PriceComparisonCard.tsx               (신규)
```

총 신규 파일: 16개
수정 파일: 7개 (types/index.ts, store, PropertyView, PropertiesPage, PropertyMap, [id]/page, next.config.ts)

## 부록 B: 필수 단위 테스트 목록

| 테스트 파일 | 테스트 케이스 |
|------------|--------------|
| `dabangParser.test.ts` | parseDabangPrice: "9억000"→90000, "4억2,000"→42000, "8,500"→8500, "1억"→10000, "12억5,000"→125000, 빈 문자열→0 |
| `dabangParser.test.ts` | parseRoomDesc: "9층, 82.58m², 관리비 20만"→{area:82.58, floor:9}, 파싱 불가→{null, null} |
| `dabangParser.test.ts` | mapRoomType: "아파트"→apartment, "오피스텔"→officetel, "빌라/연립"→villa |
| `priceComparison.test.ts` | complexName 정규화: 괄호 제거, 공백 정규화, 차수 제거 |
| `priceComparison.test.ts` | 호가율 계산: +10% 케이스, -5% 케이스, 0% 케이스, 실거래 없음 |
| `priceComparison.test.ts` | 매칭 우선순위: high > medium > low confidence |
