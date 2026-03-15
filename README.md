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

**하우스핀**은 자산 정보만 입력하면 대출 한도부터 매물 추천까지 한 번에 해결합니다.

---

## 서비스 플로우

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  1. 자산 입력  │ →  │ 2. 대출 분석  │ →  │ 3. 지역 선택  │ →  │ 4. 매물 추천  │
│             │    │             │    │             │    │             │
│ 연소득       │    │ LTV/DSR 계산 │    │ 시·구·동 선택 │    │ 구매력 매칭   │
│ 보유자산     │    │ 은행별 금리   │    │ 지도 or 목록  │    │ 실거래 필터   │
│ 기존대출     │    │ 정책대출 자격 │    │ 최대 5곳     │    │ 리스트/지도   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Step 1. 자산 정보 입력
연소득, 보유 현금, 기존 대출 잔액을 입력합니다. 생애최초 여부, 대출 기간, 상환 방식 등 선호 조건도 설정할 수 있습니다.

### Step 2. 대출 한도 분석
LTV(담보인정비율)와 DSR(총부채원리금상환비율) 규제를 반영해 실제 대출 가능 금액을 계산합니다. 금융감독원 공시 데이터 기반으로 15개 이상 은행의 주담대 금리를 비교하고, 디딤돌·보금자리론·버팀목 등 정책대출 자격도 자동 판별합니다.

### Step 3. 선호 지역 선택
살고 싶은 지역을 드롭다운 또는 카카오 지도에서 선택합니다. 최대 5개 지역을 동시에 선택할 수 있습니다.

### Step 4. 맞춤 매물 추천
국토교통부 실거래가 데이터에서 내 구매력(보유자산 + 대출가능액) 범위 안의 매물만 필터링해서 보여줍니다. 리스트 뷰와 지도 뷰를 지원합니다.

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

---

## 핵심 계산 로직

### LTV (담보인정비율)
주택 가격 대비 최대 대출 비율. 지역(투기과열·조정·비규제), 주택 보유 수, 생애최초 여부에 따라 0~80%까지 차등 적용.

### DSR (총부채원리금상환비율)
연소득 대비 모든 대출의 연간 원리금 상환액 비율. 은행권 40% 한도 내에서 신규 대출 가능액을 역산.

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
│   │   └── real-estate/       # 국토부 API 래퍼
│   ├── input/                 # Step 1: 자산 입력
│   ├── result/                # Step 2: 대출 분석 결과
│   ├── region/                # Step 3: 지역 선택
│   └── properties/            # Step 4: 매물 추천
├── components/
│   ├── common/                # Button, Card, Input, Modal 등
│   ├── landing/               # 랜딩 페이지 섹션
│   ├── input/                 # 자산 입력 폼
│   ├── result/                # 대출 결과 표시
│   ├── region/                # 지역 선택 UI
│   └── properties/            # 매물 리스트 & 지도
├── lib/
│   ├── api/                   # 외부 API 클라이언트 (MOLIT, FSS)
│   ├── calculation/           # 대출 계산 (LTV, DSR, 정책대출)
│   └── utils/                 # 포맷팅, 유효성검사, 필터링
├── store/                     # Zustand 상태 관리
├── types/                     # TypeScript 타입 정의
├── constants/                 # 정책 금리, 지역 코드
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

`.env.local` 파일을 생성하고 아래 키를 설정합니다.

```env
# 필수
DATA_GO_KR_API_KEY=<공공데이터포털 API 키>
FSS_API_KEY=<금감원 API 키>
KAKAO_REST_API_KEY=<카카오 REST API 키>
NEXT_PUBLIC_KAKAO_JS_KEY=<카카오 JS SDK 키>
```

> API 키가 없어도 Mock 데이터로 동작합니다.

### 실행

```bash
pnpm dev          # 개발 서버 (http://localhost:3000)
pnpm build        # 프로덕션 빌드
pnpm test         # 테스트 실행
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
