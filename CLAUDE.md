# house-pin 프로젝트 규칙

## 프로젝트 개요
"내 자산으로 살 수 있는 집을 찾아주는" 자산 기반 부동산 매물 추천 서비스.
Next.js 풀스택 MVP. DB 없이 API 직접 호출 + 클라이언트 상태 관리.

## 기술 스택
- **Framework**: Next.js 16 (App Router, `src/app/`)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **State**: Zustand
- **Test**: Vitest
- **Package Manager**: pnpm
- **Deploy**: Vercel

## 디자인 원칙

### 토스 스타일 가이드
- **깔끔하고 여백이 넉넉한** 레이아웃. 요소 간 충분한 spacing.
- **한 화면에 하나의 액션**. 사용자를 압도하지 않는다.
- **큰 타이포그래피**. 핵심 숫자(금액)는 크고 굵게.
- **부드러운 라운드**. border-radius 최소 12px, 카드는 16px.
- **미니멀 색상**. 주요 액션만 컬러, 나머지는 회색 톤.
- **마이크로 인터랙션**. hover/focus 시 subtle한 전환.
- AI가 만든 느낌(그라데이션 남용, 과도한 그림자, 무지개색 등) 절대 금지.

### 색상 팔레트
```
Primary:    #191F28 (거의 검정, 주요 텍스트)
Secondary:  #8B95A1 (보조 텍스트)
Accent:     #3182F6 (토스 블루, CTA 버튼)
Success:    #00C471 (긍정, 가능)
Warning:    #FF9500 (주의)
Danger:     #FF4545 (위험, 불가)
Background: #FFFFFF (기본 배경)
Surface:    #F2F4F6 (카드/섹션 배경)
Border:     #E5E8EB (구분선)
```

### 타이포그래피
```
Hero:      32px / bold (금액 강조)
Title:     24px / bold (페이지 타이틀)
Subtitle:  18px / semibold (섹션 타이틀)
Body:      16px / regular (본문)
Caption:   14px / regular (보조 텍스트)
Small:     12px / regular (법적 고지 등)
```

### 컴포넌트 규칙
- 모든 UI는 `src/components/common/` 공통 컴포넌트를 조합하여 구성.
- 공통 컴포넌트 없이 직접 HTML 태그에 스타일 넣지 않는다.
- 컴포넌트는 단일 책임. 하나의 컴포넌트가 너무 많은 일을 하지 않는다.
- Props는 명확한 타입 정의. `any` 사용 금지.
- `"use client"` 디렉티브는 필요한 컴포넌트에만 최소한으로.

## 코드 규칙

### 파일/폴더 구조
```
src/
├── app/                    # 라우트 (페이지)
│   ├── api/                # API Routes
│   ├── input/              # 자산 입력
│   ├── result/             # 대출 계산 결과
│   ├── region/             # 지역 선택
│   └── properties/         # 매물 추천
├── components/
│   ├── common/             # 공통 UI (Button, Input, Card 등)
│   ├── input/              # 자산 입력 도메인
│   ├── result/             # 대출 결과 도메인
│   ├── region/             # 지역 선택 도메인
│   └── properties/         # 매물 추천 도메인
├── lib/
│   ├── api/                # API 클라이언트
│   ├── calculation/        # 대출 계산 로직
│   └── utils/              # 유틸 함수
├── types/                  # 타입 정의
├── constants/              # 상수
└── store/                  # Zustand store
```

### 네이밍
- 컴포넌트 파일: PascalCase (`Button.tsx`, `LoanCard.tsx`)
- 유틸/훅: camelCase (`formatCurrency.ts`, `useLoanCalculation.ts`)
- 상수: UPPER_SNAKE_CASE (`MAX_LOAN_AMOUNT`)
- 타입/인터페이스: PascalCase, `I` 접두사 없음 (`LoanResult`, not `ILoanResult`)

### Import 순서
1. React/Next.js
2. 외부 라이브러리
3. `@/components`
4. `@/lib`
5. `@/types`
6. `@/constants`
7. 상대 경로

### 금액 표시 규칙
- 내부 데이터: 만원 단위 (API 원본 유지)
- 화면 표시: 억/만원 변환 ("4억 2,000만 원")
- 입력: 만원 단위 + 콤마 포맷팅
- 변환 함수는 `src/lib/utils/format.ts`에서 관리

## 테스트 규칙
- 계산 로직(`src/lib/calculation/`)은 반드시 단위 테스트 작성
- 테스트 파일: 소스 파일과 같은 위치에 `.test.ts` 확장자
- 테스트 프레임워크: Vitest
- 커버리지 목표: 계산 로직 90% 이상

## 커밋 규칙
- 한글 커밋 메시지
- 이슈 번호 연결: `[Step 1-1] 폴더 구조 설계 (#1)`
- 서브 챕터별로 커밋 분리

## MVP 플로우
```
[자산 입력] → [대출 가능액 계산 + 은행별 금리/이자 비교] → [구매력 산출] → [선호 지역 선택 (드롭다운 | 지도 드래그)] → [매물 추천]
```
