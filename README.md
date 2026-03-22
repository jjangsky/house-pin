<p align="center">
  <img src="public/images/readme-banner.png" alt="하우스핀 배너" width="720" />
</p>

<h1 align="center">하우스핀 (house-pin)</h1>

<p align="center">
  <strong>내 자산으로 살 수 있는 집을 찾아주는 서비스</strong>
</p>

<p align="center">
  자산 입력 → 대출 분석 → 지역 선택 → 매물 추천까지,<br/>
  복잡한 부동산 구매력 분석을 3분 만에.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Zustand-5-orange" alt="Zustand" />
  <img src="https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel" alt="Vercel" />
</p>

---

## 이런 문제를 해결합니다

집을 사고 싶지만 이런 고민이 있으신가요?

- "내 소득으로 대출이 얼마나 나올까?"
- "DSR, LTV가 뭔지 모르겠는데 어떻게 계산하지?"
- "은행마다 금리가 다른데 어디가 가장 좋을까?"
- "내 예산으로 어느 동네에 집을 살 수 있을까?"
- "지금 시장에 나와있는 매물 중 내가 살 수 있는 건?"

**하우스핀**은 자산 정보만 입력하면 대출 한도부터 매물 추천까지 한 번에 해결합니다.

---

## 서비스 플로우

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  1. 자산 입력 │ →  │ 2. 대출 분석   │ →  │ 3. 지역 선택  │ →  │ 4. 매물 추천  │
│             │    │             │    │             │    │             │
│ 연소득        │    │ LTV/DSR 계산 │    │ 시·구·동 선택  │    │ 실거래 + 현재 │
│ 보유자산      │    │ 은행별 금리    │    │ 지도 or 목록   │    │ 시세 비교     │
│ 기존대출      │    │ 정책대출 자격   │    │ 최대 5곳      │    │ 매물 상세     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Step 1. 자산 정보 입력
연소득, 보유 현금, 기존 대출 잔액을 입력합니다. 생애최초 여부, 대출 기간, 상환 방식 등 선호 조건도 설정할 수 있습니다.

### Step 2. 대출 한도 분석
LTV(담보인정비율)와 DSR(총부채원리금상환비율) 규제를 반영해 실제 대출 가능 금액을 계산합니다. 금융감독원 공시 데이터 기반으로 15개 이상 은행의 주담대 금리를 비교하고, 디딤돌·보금자리론·버팀목 등 정책대출 자격도 자동 판별합니다.

### Step 3. 선호 지역 선택
살고 싶은 지역을 드롭다운 또는 카카오 지도에서 선택합니다. 최대 5개 지역을 동시에 선택할 수 있습니다.

### Step 4. 맞춤 매물 추천

두 가지 데이터 소스를 탭으로 제공합니다:

- **실거래 내역**: 국토교통부 실거래가 데이터에서 내 구매력 범위 내 최근 3개월 거래 내역
- **현재 매물**: 지금 시장에 나와있는 실시간 매물 (이미지 포함)

매물을 선택하면 상세 페이지에서 **구매 가능성 분석**, **추천 대출 상품**, **월 상환 시뮬레이션**, **시세 비교(호가율)** 등을 확인할 수 있습니다.

---

## 주요 기능

### 매물 추천 + 실시간 매물
- 서버 일괄 조회 (병렬 API 처리, 동시성 제한)
- 실거래 내역 / 현재 매물 탭 분리
- 건물 유형별 필터 (아파트/빌라/오피스텔)
- 리스트 뷰 + 카카오 지도 뷰

### 매물 상세
- 구매 가능성 분석 (자기자본/대출한도 과부족 종합 판정)
- 추천 대출 상품 Top 5 (필요 대출금 기준 월상환액 계산)
- 월 상환 시뮬레이션 (금리 슬라이더 + 상환방식 토글 + 소득 대비 부담률)
- 시세 비교 (호가 vs 실거래, 호가율 자동 계산)
- 이미지 갤러리 (현재 매물)
- 비슷한 매물 추천 (유사도 기반)

### 대출 분석
- LTV/DSR 기반 대출 한도 계산
- 15개+ 은행 주담대 금리 비교 (금감원 공시 데이터)
- 정책대출 자격 자동 판별 (디딤돌/보금자리론/버팀목)

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS 4 |
| **State** | Zustand 5 |
| **Test** | Vitest |
| **Package** | pnpm |
| **Deploy** | Vercel |
| **Font** | Pretendard Variable |

---

## 외부 API 연동

| API | 제공처 | 용도 |
|-----|--------|------|
| **실거래가 API** | 국토교통부 (공공데이터포털) | 아파트·빌라·오피스텔 실거래 데이터 |
| **금융상품 비교공시 API** | 금융감독원 | 은행별 주담대·전세대출 금리 |
| **Kakao Maps JS SDK** | 카카오 | 지역 선택 지도, 매물 위치 시각화 |
| **Kakao 주소 검색 API** | 카카오 | 좌표-주소 변환 |
| **실시간 매물 API** | 외부 서비스 | 현재 시장에 나와있는 매물 조회 |

---

## 핵심 계산 로직

### LTV (담보인정비율)
주택 가격 대비 최대 대출 비율. 지역(투기과열·조정·비규제), 주택 보유 수, 생애최초 여부에 따라 0~80%까지 차등 적용.

### DSR (총부채원리금상환비율)
연소득 대비 모든 대출의 연간 원리금 상환액 비율. 은행권 40% 한도 내에서 신규 대출 가능액을 역산.

### 호가율 (시세 비교)
현재 호가와 최근 실거래가의 차이 비율. 급매 가능성(-5% 이하), 시세 수준(±5%), 높은 호가(+15% 이상)를 자동 판별.

### 정책대출 자격 판별
| 프로그램 | 대상 | 소득 한도 | 금리 |
|----------|------|-----------|------|
| 디딤돌 | 무주택 세대주 | 6,000만 원 | 2.15~3.00% |
| 보금자리론 | 1주택 이하 | 7,000만 원 | 3.25~4.15% |
| 버팀목 (전세) | 무주택 세대주 | 5,000만 원 | 1.80~2.90% |

---

## 프로젝트 구조

```
src/
├── app/                       # 라우트 & API
│   ├── api/
│   │   ├── loan-products/     # 금감원 API 래퍼
│   │   └── real-estate/
│   │       ├── batch/         # 실거래 일괄 조회
│   │       └── listings/      # 실시간 매물 조회
│   ├── input/                 # Step 1: 자산 입력
│   ├── result/                # Step 2: 대출 분석 결과
│   ├── region/                # Step 3: 지역 선택
│   └── properties/
│       ├── page.tsx           # Step 4: 매물 추천
│       └── [id]/              # 매물 상세 페이지
├── components/
│   ├── common/                # Button, Card, Input, Modal 등
│   ├── landing/               # 랜딩 페이지 섹션
│   ├── input/                 # 자산 입력 폼
│   ├── result/                # 대출 결과 표시
│   ├── region/                # 지역 선택 UI
│   └── properties/
│       ├── PropertyCard.tsx   # 실거래 매물 카드
│       ├── LivePropertyCard.tsx # 현재 매물 카드 (이미지)
│       ├── PropertyView.tsx   # 실거래/현재매물 탭 + 리스트/지도 토글
│       └── detail/            # 상세 페이지 섹션들
├── lib/
│   ├── api/                   # 외부 API 클라이언트
│   ├── calculation/           # 대출 계산, 구매 가능성, 시세 비교
│   └── utils/                 # 포맷팅, 파서, 필터링
├── store/                     # Zustand 상태 관리
├── types/                     # TypeScript 타입 정의
├── constants/                 # 정책 금리, 지역 코드, 좌표
└── hooks/                     # 커스텀 훅
```

---

## 시작하기

### 사전 요구사항

- Node.js 18+
- pnpm

### 설치

```bash
git clone https://github.com/jjangsky/house-pin.git
cd house-pin
pnpm install
```

### 환경 변수

`.env.example`을 `.env.local`로 복사하고 API 키를 설정합니다.

```bash
cp .env.example .env.local
```

```env
# 필수
DATA_GO_KR_API_KEY=<공공데이터포털 API 키>
FSS_API_KEY=<금감원 API 키>
KAKAO_REST_API_KEY=<카카오 REST API 키>
NEXT_PUBLIC_KAKAO_JS_KEY=<카카오 JS SDK 키>

# 선택 (실시간 매물 기능)
LISTING_API_BASE_URL=<실시간 매물 API 주소>
```

> API 키가 없어도 Mock 데이터로 동작합니다.

### 실행

```bash
pnpm dev          # 개발 서버 (http://localhost:3000)
pnpm build        # 프로덕션 빌드
pnpm test         # 테스트 실행
```

---

## 테스트

Vitest 기반 단위 테스트. 대출 계산, 매물 필터링, 가격 파싱, 시세 비교 등 핵심 로직을 검증합니다.

```bash
pnpm test         # 전체 테스트
pnpm test:watch   # 파일 변경 감지 모드
```

---

## 디자인 원칙

[토스(Toss)](https://toss.im) 스타일 가이드를 따릅니다.

- 깔끔하고 여백이 넉넉한 레이아웃
- 한 화면에 하나의 액션
- 핵심 숫자(금액)는 크고 굵게
- 부드러운 라운드 (border-radius 12px+)
- 미니멀 색상 — 주요 액션만 블루(#3182F6), 나머지는 회색 톤

---

## 라이선스

이 프로젝트는 개인 학습 및 포트폴리오 목적으로 제작되었습니다.

---

<p align="center">
  <sub>데이터 출처: 국토교통부 실거래가, 금융감독원 금융상품비교공시</sub>
</p>
