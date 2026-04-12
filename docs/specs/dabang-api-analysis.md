# 다방 비공식 API 분석 문서

> 작성일: 2026-03-22
> 상태: 비공식 API, 언제든 변경 가능

## 1. 개요

다방(Dabang)은 공식 API를 제공하지 않으나, 웹 프론트엔드가 사용하는 REST API 엔드포인트를 직접 호출할 수 있다.
인증 불필요(API 키 없음), 바운딩박스 기반 지역 검색.

---

## 2. 공통 요청 헤더

모든 API 호출에 필요한 헤더:

```
accept: application/json, text/plain, */*
d-api-version: 5.0.0
d-call-type: web
d-app-version: 1
csrf: token              ← 고정 문자열 (동적 토큰 아님)
referer: https://www.dabangapp.com/map/apt
user-agent: Mozilla/5.0 (Macintosh; ...) AppleWebKit/537.36 ...
```

---

## 3. 확인된 엔드포인트

### 3.1 매물 리스트 (핵심)

```
GET /api/v5/room-list/category/{category}/bbox
```

| 카테고리 | 경로 | 매매(SELL) | 전세/월세 |
|---------|------|:----------:|:---------:|
| `apt` | `/category/apt/bbox` | ✅ 확인됨 | ❌ 400 에러 |
| `officetel` | `/category/officetel/bbox` | ✅ 확인됨 | 미확인 |
| `house` | `/category/house/bbox` | ✅ 확인됨 | 미확인 |
| `one-two` | `/category/one-two/bbox` | ❌ | 별도 필터 구조 |

**쿼리 파라미터:**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `bbox` | JSON string | `{"sw":{"lat":N,"lng":N},"ne":{"lat":N,"lng":N}}` |
| `zoom` | number | 지도 줌 레벨 (14=동 수준, 11=구 수준) |
| `useMap` | string | `"naver"` 고정 |
| `page` | number | 페이지 (1부터, 24건/페이지) |
| `filters` | JSON string | 필터 객체 (아래 참조) |

**필수 필터 객체 (매매):**

```json
{
  "sellingTypeList": ["SELL"],
  "isShortLease": false,
  "isIncludeMaintenance": false,
  "depositRange": {"min": 0, "max": 999999},
  "priceRange": {"min": 0, "max": 999999},
  "tradeRange": {"min": 0, "max": 999999},
  "pyeongRange": {"min": 0, "max": 999999},
  "useApprovalDateRange": {"min": 0, "max": 999999},
  "householdNumRange": {"min": 0, "max": 999999},
  "parkingNumRange": {"min": 0, "max": 999999},
  "hasTakeTenant": false,
  "dealTypeList": ["AGENT"]
}
```

- `tradeRange`: 매매가 범위 (만원 단위). min:30000 = 3억, max:90000 = 9억
- `pyeongRange`: 면적 범위 (평)
- 필터 필드 하나라도 빠지면 400 에러

**응답 (roomList 항목):**

```typescript
{
  seq: number;              // 매물 고유 번호
  id: string;               // MongoDB ObjectId (상세 조회용)
  roomTypeName: string;     // "아파트" | "오피스텔" | "빌라" 등
  randomLocation: {         // 좌표 (약간 랜덤화됨, 정확하지 않음)
    lat: number;
    lng: number;
  };
  complexName: string;      // 단지/건물명 (예: "대치우정에쉐르2(주상복합)")
  roomTitle: string;        // 매물 제목 (중개사 작성)
  roomDesc: string;         // "9층, 82.58m², 관리비 20만"
  priceTypeName: string;    // "매매" | "전세" | "월세"
  priceTitle: string;       // "9억000" (사람이 읽는 형식)
  imgUrlList: string[];     // 이미지 URL 배열 (CDN)
  dongName: string;         // "역삼동", "대치동" 등
  gid: number;              // 다방 내부 지역 ID
  isQuick: boolean;         // 빠른 매물 여부
  isPano: boolean;          // 파노라마(VR) 여부
  isOwnerAuth: boolean;     // 집주인 인증
  isNaverVerify: boolean;   // 네이버 검증
}
```

**페이징:** 24건/페이지, `total` 필드로 전체 건수 확인

---

### 3.2 매물 상세

```
GET /api/3/new-room/detail?room_id={id}&api_version=3.0.1&call_type=web&version=1
```

- v3 API (v5 아님)
- 현재 403/HTML 응답으로 **불안정** — 추가 쿠키나 세션 필요할 수 있음
- 리스트 API에서 충분한 정보를 제공하므로 상세 API 없이도 기본 기능 구현 가능

**상세 API에서 추가로 얻을 수 있는 정보 (동작 시):**
- 정확한 주소 (full_jibun_address_str, full_road_address_str)
- 정확한 좌표 (location, 랜덤화 안 됨)
- 전용/공급 면적 (room_size, provision_size)
- 중개사 정보 (agent name, tel)
- 주변 학군 (education)
- 단지 정보 (complex)
- 이미지 전체 목록

---

### 3.3 마커 (지도 핀) ✅ 동작 확인

```
GET /api/v5/markers/category/{category}
```

리스트와 동일한 파라미터. **줌 레벨에 따라 반환 단위가 달라짐:**

| 줌 레벨 | 반환 단위 | 데이터 |
|---------|----------|--------|
| 11~14 | `dongList` (동) | 동 이름, 위치, geojson URL |
| 15~17+ | `complexList` (단지) | 단지별 상세 정보 (아래 참조) |

**dongList 응답 예시:**
```json
{
  "gid": 10133,
  "code": "11680108",
  "name": "논현동",
  "geojson": "https://d2pi55cyzoqmrc.cloudfront.net/geojson/region/11680108",
  "location": {"lat": 37.511, "lng": 127.028}
}
```

**complexList 응답 예시 (핵심 데이터):**
```json
{
  "id": "58291f85bd298673a07612e4d885",
  "location": {"lat": 37.505663, "lng": 127.054222},
  "dongName": "대치동",
  "hasRoom": true,
  "formatPyeong": "14평",
  "formatSellingType": "매",
  "formatAveragePrice": "4.2억",
  "realTimeWatchCount": 0,
  "contents": {
    "pyeongPrice": 2964,          // 평당가 (만원)
    "gapPrice": 7500,             // 매매-전세 갭 (만원)
    "leasePriceRate": 81.9,       // 전세가율 (%)
    "floorAreaRatio": 49,         // 용적률
    "buildingCoverageRatio": 1096,// 건폐율
    "useApprovalYear": "2004",    // 사용승인년도
    "householdNum": 371           // 세대수
  }
}
```

---

### 3.4 단지 상세 ✅ 동작 확인 (핵심 API)

```
GET /api/v5/complex/{complexId}
```

마커 API의 `complexList[].id`를 사용하여 호출. **매우 풍부한 데이터 제공.**

**응답 구조:**

```typescript
{
  result: {
    complex: {                    // 단지 기본 정보
      complexId: string;
      complexName: string;        // "테헤란로대우아이빌(주상복합)"
      complexTypeName: string;    // "아파트"
      householdNum: number;       // 세대수 (371)
      buildingNum: number;        // 동수
      parkingNum: number;         // 주차대수
      parkingAverage: number;     // 세대당 주차 (0.75)
      manageTel: string;          // 관리실 전화 ("02-562-6736")
      complexLowestFloor: string; // 최저층 ("25")
      complexHighestFloor: string;// 최고층 ("26")
      providerName: string;       // 시공사 ("(주)대우건설")
      heatTypeName: string;       // "개별난방"
      fuelTypeName: string;       // "도시가스"
      address: string;            // "서울특별시 강남구 대치동"
      jibunAddress: string;       // "서울시 강남구 대치동 891-6"
      roadAddress: string;        // "서울시 강남구 테헤란로 428"
      location: { lat, lng };     // 정확한 좌표 (랜덤화 아님!)
      images: [{                  // 단지 사진
        image: string;            // CDN URL
        imageTitle: string;       // "단지주변"
      }];
    };

    spaces: [{                    // 평형별 정보
      spaceSeq: number;
      pyeongType: string;         // "11A"
      pyeongSizeType: string;     // "38A"
      bedsNum: number;            // 방 수
      bathNum: number;            // 욕실 수
      roomSpace: number;          // 전용면적 (m², 29.02)
      supplySpace: number;        // 공급면적 (m², 38.72)
      layoutImage: string;        // 평면도 이미지 URL
    }];

    education: {                  // 학군 정보
      nurserySchool: [{           // 어린이집
        name, distance, childPerTeacher
      }];
      elementarySchool: [{        // 초등학교
        name, distance, avgStudentsPerClass, establishDivide
      }];
      middleSchool: [{            // 중학교
        name, distance, avgStudentsPerClass
      }];
      highSchool: [{              // 고등학교
        name, distance, avgStudentsPerClass
      }];
    };

    areaAveragePrice: [{          // 지역 시세 비교
      scope: string;              // "해당 단지" | "대치동" | "강남구"
      tradeAveragePyeongPrice: number;  // 매매 평당가 (만원)
      leaseAveragePyeongPrice: number;  // 전세 평당가 (만원)
    }];

    nearComplexes: {              // 인근 단지
      trade: [{                   // 매매 기준
        complexId, complexName, complexDesc, averagePyeongPrice
      }];
      lease: [{                   // 전세 기준
        complexId, complexName, complexDesc, averagePyeongPrice
      }];
    };

    roomCount: number;            // 현재 등록된 매물 수
    region: { gid, code, name, fullName };
  }
}
```

**이 API로 얻을 수 있는 것:**
- 정확한 주소 + 정확한 좌표 (매물 리스트의 randomLocation 보완)
- 평면도 이미지
- 학군 정보 (거리, 학급당 학생수)
- 단지 vs 동 vs 구 시세 비교
- 인근 단지 가격 비교
- 시공사, 난방, 주차, 관리실 연락처

---

## 4. 제약 사항

| 항목 | 내용 |
|------|------|
| 인증 | 불필요 |
| Rate Limit | 약 10회 이상 연속 호출 시 400 에러 (IP 기반 추정) |
| 좌표 정확도 | `randomLocation`은 의도적으로 약간 흐려짐 |
| 전세/월세 | apt 카테고리에서 매매만 확인됨, 전세는 400 에러 |
| 페이징 한계 | 한 bbox에 최대 400건까지 반환 (초과 시 bbox 분할 필요) |
| 상세 API | 불안정 (403 빈발), 리스트 API로 대체 필요 |
| SLA | 없음 — 언제든 변경/차단 가능 |

---

## 5. house-pin 연동 시 데이터 매핑

### 리스트 API → Property 타입 매핑

| 다방 필드 | house-pin Property | 변환 |
|-----------|-------------------|------|
| `complexName` | `name` | 그대로 |
| `priceTitle` | `dealAmount` | "9억000" → 90000 (만원 파싱) |
| `roomDesc` | `area`, `floor` | "9층, 82.58m²" 파싱 |
| `randomLocation.lat/lng` | `lat`, `lng` | 그대로 (부정확) |
| `dongName` | `dong` | 그대로 |
| `roomTypeName` | `propertyType` | "아파트"→apartment 등 |
| `id` | (신규 필드) | 다방 매물 ID |
| `imgUrlList` | (신규 필드) | 이미지 URL |
| `priceTypeName` | (신규 필드) | "매매"/"전세"/"월세" |

### 부족한 필드 → 단지 상세 API로 보완 가능
- `buildYear`: 리스트에 없음 → **단지 API `useApprovalYear`로 보완** ✅
- `jibun`: 리스트에 없음 → **단지 API `jibunAddress`로 보완** ✅
- `정확한 좌표`: randomLocation 부정확 → **단지 API `location`으로 보완** ✅
- `regionCode`: 없음 (bbox 좌표에서 역산 필요)
- `dealYear/Month/Day`: 없음 (실시간 매물이므로 거래일 개념 없음)

---

## 6. 추천 연동 방식

### 6.1 아키텍처

```
사용자가 지역 선택
  → 지역 코드를 바운딩박스로 변환 (기존 REGION_CENTER_COORDS 활용)
  → Next.js API Route에서 다방 API 호출
  → 가격 범위 필터: tradeRange에 affordablePrice 적용
  → 응답을 Property 타입으로 변환
  → 기존 PropertyView/PropertyCard로 표시
```

### 6.2 기존 실거래가 데이터와 병행

| 탭 | 데이터 소스 | 설명 |
|----|-----------|------|
| 실거래 | 국토부 API (기존) | 최근 3개월 실제 거래 내역 |
| 현재 매물 | 다방 API (신규) | 지금 시장에 나와있는 매물 |

---

## 7. 추가 기능 기획 (단지 상세 API 활용)

### 7.1 단지 정보 카드
- 사용승인년도, 세대수, 동수, 주차(세대당), 시공사, 난방
- 매물 상세 페이지에서 단지 API 호출하여 표시

### 7.2 평면도 뷰어
- 단지 API의 `spaces[].layoutImage`로 평형별 평면도 표시
- 전용/공급면적, 방수/욕실수와 함께 카드 형태

### 7.3 학군 정보
- 초/중/고 학교명, 거리(m), 학급당 학생수
- 거리순 정렬, 도보 시간 환산 (80m/분)

### 7.4 지역 시세 비교
- 단지 API의 `areaAveragePrice`: 해당 단지 vs 동 vs 구 평당가
- 막대 그래프로 시각화
- 인근 10개 단지 가격 비교

### 7.5 실시간 매물 탭
- 기존 매물 추천 페이지에 "실거래 / 현재 매물" 탭 추가
- 이미지 썸네일 표시

### 7.6 시세 비교 (호가 vs 실거래)
- 같은 단지명 매칭으로 호가율 계산
- 급매 가능성 / 시세 수준 / 높은 호가 인디케이터

### 7.7 매물 상세 강화
- 매물 이미지 + 단지 이미지 갤러리
- 정확한 주소/좌표 (단지 API 보완)
- 인근 단지 가격 비교
