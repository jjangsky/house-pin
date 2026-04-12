# Phase 2: 백엔드 분리 기획서

> 작성일: 2026-04-05
> 상태: 기획 중

---

## 목차

1. [배경 및 목표](#1-배경-및-목표)
2. [현재 아키텍처 분석](#2-현재-아키텍처-분석)
3. [목표 아키텍처](#3-목표-아키텍처)
4. [Spring Boot 백엔드 설계](#4-spring-boot-백엔드-설계)
5. [DB 설계: 매물 실거래 데이터](#5-db-설계-매물-실거래-데이터)
6. [데이터 수집 파이프라인](#6-데이터-수집-파이프라인)
7. [API 설계](#7-api-설계)
8. [프론트엔드 변경사항](#8-프론트엔드-변경사항)
9. [마이그레이션 전략](#9-마이그레이션-전략)
10. [리스크 및 고려사항](#10-리스크-및-고려사항)

---

## 1. 배경 및 목표

### 1.1 현재 문제

| 문제 | 상세 |
|------|------|
| **공공API 속도/한도** | 국토부 실거래 API는 요청당 1000건, 일일 한도 20,000회. 지역 3개 × 매물유형 3개 × 3개월 = 27회 API 호출 필요. 응답 2~5초/건. 사용자 요청마다 호출하면 한도 소진 위험 |
| **사용자 대기시간** | 매물 추천 페이지 진입 시 실거래 + 지오코딩 직렬 처리로 10~30초 소요 |
| **데이터 재활용 불가** | 같은 지역을 다른 사용자가 조회해도 매번 공공API 재호출 |
| **서버 로직 혼재** | Next.js API Route에 외부 API 호출, XML 파싱, 지오코딩, 필터링 로직이 모두 혼합 |
| **스케일 한계** | Vercel serverless 환경에서 장시간 배치 처리 불가 (10초 타임아웃) |

### 1.2 Phase 2 목표

1. **매물 실거래 히스토리를 자체 DB에 저장** — 공공API 의존도 제거, 즉시 응답
2. **Spring Boot 백엔드 분리** — 데이터 수집/가공/API 서빙 전담
3. **프론트엔드 경량화** — Next.js는 UI 렌더링 + BFF(Backend For Frontend) 역할만
4. **은행 금리는 현행 유지** — FSS 공공API 직접 조회 (데이터량 적고, 24시간 캐시 충분)

### 1.3 범위 밖 (Phase 2에서 하지 않는 것)

- 사용자 인증/회원 시스템
- 실시간 매물(Live Listing) DB 저장 (외부 소스 직접 호출 유지)
- 계산 로직 백엔드 이관 (프론트엔드 유지 — 순수 계산이므로 서버 부하 불필요)

---

## 2. 현재 아키텍처 분석

### 2.1 현재 구조

```
[사용자 브라우저]
    │
    ▼
[Next.js (Vercel)]
    ├── 페이지 렌더링 (SSR/CSR)
    ├── API Routes (서버 로직)
    │   ├── /api/real-estate/batch    → 국토부 API × N회 → XML 파싱 → 지오코딩 → 필터링
    │   ├── /api/real-estate/listings → 외부 매물 API → 파싱 → 캐시(5분)
    │   ├── /api/real-estate/complex  → 외부 단지 API
    │   └── /api/loan-products        → 금감원 API → 파싱
    ├── 계산 로직 (lib/calculation/)
    └── Zustand Store (sessionStorage)
```

### 2.2 현재 외부 API 의존도

| 외부 API | 용도 | 호출 빈도 | 속도 | 유지 방식 |
|----------|------|-----------|------|-----------|
| 국토부 실거래 | 아파트/빌라/오피스텔 매매/전세 이력 | 매 조회시 27+회 | 2~5초/건 | → **DB 저장으로 전환** |
| 카카오 지오코딩 | 주소→좌표 변환 | 매물 건수만큼 | 0.3초/건 | → **DB에 좌표 포함 저장** |
| 금감원 (FSS) | 은행 대출 금리 | 1일 1~2회 | 1~2초 | → **현행 유지** (mock 폴백 있음) |
| 외부 매물 API | 실시간 매물 리스트 | 매 조회시 | 0.5~1초/건 | → **현행 유지** (실시간 특성) |
| 외부 단지 API | 단지 상세 정보 | 상세 진입시 | 1초 | → **현행 유지** (1시간 캐시) |

### 2.3 현재 데이터 플로우

```
[/api/real-estate/batch] POST
  ├── Input:  regionCodes[], types[], months, maxPrice
  ├── Tasks:  regionCodes × types × months = N개 조합
  ├── 처리:
  │   1. parallelLimit(N, concurrency=10)로 국토부 API 병렬 호출
  │   2. XML → JSON 변환 (fast-xml-parser)
  │   3. 취소 거래 제외 (cancelDealType)
  │   4. Property 타입으로 변환
  │   5. batchGeocode()로 좌표 추가 (카카오 API)
  │   6. filterByAffordability()로 구매력 범위 필터
  │   7. 날짜순 정렬
  └── Output: Property[]
```

---

## 3. 목표 아키텍처

### 3.1 Phase 2 구조

```
[사용자 브라우저]
    │
    ▼
[Next.js (Vercel)] ─── UI 렌더링 + BFF
    ├── 페이지 렌더링
    ├── 계산 로직 (lib/calculation/) ← 그대로 유지
    ├── Zustand Store
    └── BFF API Routes
        ├── /api/properties/*     → Spring Boot API 호출 (프록시)
        ├── /api/loan-products    → 금감원 API 직접 호출 (현행 유지)
        └── /api/real-estate/listings → 외부 매물 API 직접 호출 (현행 유지)

                    │
                    ▼
[Spring Boot 백엔드] ─── 데이터 서빙 + 수집
    ├── REST API
    │   ├── GET /api/v1/properties        → DB 조회 (즉시 응답)
    │   ├── GET /api/v1/properties/stats  → 통계/분석 (DB 집계)
    │   └── GET /api/v1/regions           → 지역 마스터
    ├── 데이터 수집 스케줄러
    │   ├── 국토부 실거래 → DB 적재 (일 1회)
    │   └── 카카오 지오코딩 → 좌표 보강 (적재 시)
    └── DB (PostgreSQL / MySQL)
```

### 3.2 책임 분리

| 레이어 | 담당 | 기술 |
|--------|------|------|
| **프론트엔드** | UI, 계산 로직, 사용자 상태, 실시간 매물 조회 | Next.js + Zustand |
| **BFF** | Spring Boot 프록시, FSS/외부매물 API 중계 | Next.js API Routes |
| **백엔드** | 실거래 데이터 서빙, 수집/적재, 지역 마스터 | Spring Boot |
| **DB** | 실거래 이력, 좌표, 지역 정보 | PostgreSQL |

### 3.3 모노레포 디렉토리 구조

프론트엔드와 백엔드를 같은 레포에서 관리한다.
- 1인 개발 환경에서 PR/이슈 관리 편의
- 타입/상수 변경 시 양쪽을 한 커밋에서 확인 가능
- 배포는 각각 독립 (Vercel + 별도 서버)

```
house-pin/
├── frontend/                    # Next.js (기존 루트 파일들 이동)
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── store/
│   │   ├── types/
│   │   └── constants/
│   ├── public/
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── vitest.config.ts
│
├── backend/                     # Spring Boot (신규)
│   ├── src/
│   │   ├── main/java/com/housepin/api/
│   │   │   ├── domain/
│   │   │   ├── collector/
│   │   │   └── common/
│   │   ├── main/resources/
│   │   │   ├── application.yml
│   │   │   └── db/migration/
│   │   └── test/java/
│   ├── build.gradle
│   └── settings.gradle
│
├── docs/                        # 기획/설계 문서
│   ├── phase2-backend-separation.md
│   └── phase2-database-schema.md
│
├── docker-compose.yml           # 로컬 개발용 PostgreSQL
├── .gitignore
├── CLAUDE.md
└── README.md
```

**Vercel 배포 설정 변경:**
- Settings → General → Root Directory: `frontend`
- Build Command: `pnpm build` (변경 없음)

**`.gitignore` 추가:**
```
# Backend
backend/build/
backend/.gradle/
backend/out/
```

### 3.4 왜 계산 로직은 프론트엔드에 남기는가

현재 계산 모듈 15개는 **전부 순수 함수**(외부 API 의존 없음).

- LTV/DSR/구매력: 사용자 입력만으로 계산
- 세금/TCO: 상수 테이블 기반
- 시나리오 비교/갈아타기: 위 계산의 조합

서버로 옮기면 네트워크 왕복만 추가되고 이점 없음. 슬라이더 조작 등 실시간 UI 반응에도 불리.

---

## 4. Spring Boot 백엔드 설계

### 4.0 아키텍처 패턴: CQRS

읽기/쓰기 패턴이 명확히 다르므로 **CQRS(Command Query Responsibility Segregation)** 적용.

```
쓰기 (Command): Scheduler → CollectorService → CommandService → JPA Repository (save/saveAll)
읽기 (Query):   Controller → QueryService → QueryRepository (QueryDSL + Native SQL)
```

| | 쓰기 (수집 파이프라인) | 읽기 (API 서빙) |
|---|---|---|
| 빈도 | 하루 1회 배치 | 사용자 요청마다 |
| 특성 | 단순 INSERT/UPDATE | 다중 필터 + 집계 + 페이지네이션 |
| 기술 | JPA Repository | QueryDSL + @Query(nativeQuery) |
| 트랜잭션 | @Transactional | @Transactional(readOnly = true) |

**MyBatis 대신 QueryDSL을 선택한 이유:**
- JPA 생태계 안에서 해결 → Entity 하나로 쓰기/읽기 모두 커버
- MyBatis 사용 시 Entity + XML Mapper 이중 유지보수 발생
- 동적 쿼리가 타입 세이프 (컴파일 타임 검증)
- 복잡한 집계(히스토그램, 중위가)는 `@Query(nativeQuery=true)`로 PostgreSQL 함수 직접 활용

### 4.1 프로젝트 구조

```
house-pin-api/
├── src/main/java/com/housepin/api/
│   ├── HousePinApiApplication.java
│   │
│   ├── domain/
│   │   ├── property/
│   │   │   ├── entity/
│   │   │   │   ├── PropertyTrade.java          # 실거래 엔티티
│   │   │   │   └── Complex.java                # 단지 엔티티
│   │   │   ├── repository/
│   │   │   │   ├── PropertyTradeRepository.java       # JPA (쓰기)
│   │   │   │   ├── PropertyTradeQueryRepository.java   # QueryDSL (읽기)
│   │   │   │   └── PropertyStatsQueryRepository.java   # 통계 집계 (읽기)
│   │   │   ├── service/
│   │   │   │   ├── PropertyCommandService.java         # 쓰기 전용
│   │   │   │   ├── PropertyQueryService.java           # 읽기 전용
│   │   │   │   └── PropertyStatsQueryService.java      # 통계 읽기 전용
│   │   │   ├── dto/
│   │   │   │   ├── PropertyResponse.java
│   │   │   │   ├── PropertySearchRequest.java
│   │   │   │   └── PropertyStatsResponse.java
│   │   │   └── controller/
│   │   │       ├── PropertyController.java
│   │   │       └── PropertyStatsController.java
│   │   │
│   │   └── region/
│   │       ├── entity/
│   │       │   └── Region.java                 # 지역 마스터
│   │       ├── repository/
│   │       │   └── RegionRepository.java
│   │       └── controller/
│   │           └── RegionController.java
│   │
│   ├── collector/                              # 데이터 수집
│   │   ├── molit/
│   │   │   ├── MolitApiClient.java             # 국토부 API 클라이언트
│   │   │   ├── MolitXmlParser.java             # XML 파싱
│   │   │   └── MolitCollectorService.java      # 수집 오케스트레이션
│   │   ├── geocode/
│   │   │   ├── KakaoGeocodeClient.java         # 카카오 지오코딩
│   │   │   └── GeocodeService.java             # 좌표 보강 서비스
│   │   └── scheduler/
│   │       └── DataCollectionScheduler.java    # @Scheduled 스케줄러
│   │
│   └── common/
│       ├── config/
│       │   ├── WebConfig.java                  # CORS
│       │   ├── QueryDslConfig.java             # JPAQueryFactory Bean
│       │   ├── CacheConfig.java                # Caffeine 설정
│       │   └── SchedulerConfig.java
│       ├── exception/
│       │   └── GlobalExceptionHandler.java
│       └── dto/
│           └── ApiResponse.java                # 공통 응답 래퍼
│
├── src/main/resources/
│   ├── application.yml
│   ├── application-local.yml
│   ├── application-prod.yml
│   └── db/migration/                           # Flyway 마이그레이션
│       ├── V1__create_region.sql
│       ├── V2__create_property_trade.sql
│       ├── V3__create_complex.sql
│       ├── V4__create_collection_log.sql
│       ├── V5__create_indexes.sql
│       └── V6__seed_region_data.sql
│
└── build.gradle
```

### 4.2 기술 스택

| 항목 | 기술 | 이유 |
|------|------|------|
| Framework | Spring Boot 3.x (Java 21) | Java 21, Phase 3 커뮤니티(Spring Security) 대비 |
| 패턴 | CQRS | 읽기(QueryDSL) / 쓰기(JPA) 분리. 수집 배치 vs API 서빙 특성이 다름 |
| 쓰기 | Spring Data JPA | Entity 단위 저장, 배치 INSERT, 트랜잭션 관리 |
| 읽기 | QueryDSL + Native SQL | 동적 필터 타입세이프 조합 + PostgreSQL 집계 함수 직접 활용 |
| DB | PostgreSQL | `width_bucket()` 히스토그램, `percentile_cont()` 중위가, JSONB 인덱싱, PostGIS 확장성 |
| Migration | Flyway | 스키마 버전 관리 |
| HTTP Client | RestClient (Spring 6.1) | 국토부/카카오 API 호출 |
| XML Parser | Jackson XML | 국토부 XML 응답 파싱 |
| Scheduler | Spring @Scheduled | 데이터 수집 크론 |
| Cache | Spring Cache + Caffeine | 로컬 캐시. 스케일아웃 시 Redis 전환은 설정만 변경 |
| Docs | SpringDoc OpenAPI | API 문서 자동 생성 |

### 4.3 핵심 의존성 (build.gradle)

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.springframework.boot:spring-boot-starter-cache'

    // DB
    runtimeOnly 'org.postgresql:postgresql'
    implementation 'org.flywaydb:flyway-core'

    // QueryDSL
    implementation 'com.querydsl:querydsl-jpa:5.x:jakarta'
    annotationProcessor 'com.querydsl:querydsl-apt:5.x:jakarta'

    // XML 파싱 (국토부 API)
    implementation 'com.fasterxml.jackson.dataformat:jackson-dataformat-xml'

    // API 문서
    implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:2.x'

    // 캐시
    implementation 'com.github.ben-manes.caffeine:caffeine'
}
```

---

## 5. DB 설계: 매물 실거래 데이터

### 5.1 ERD

```
┌─────────────────────────────────┐
│           region                │
├─────────────────────────────────┤
│ code         VARCHAR(5) PK      │  ← 법정동코드 앞 5자리
│ sido         VARCHAR(20)        │
│ sigungu      VARCHAR(30)        │
│ center_lat   DECIMAL(10,7)      │  ← 지역 중심 좌표
│ center_lng   DECIMAL(10,7)      │
│ bbox_sw_lat  DECIMAL(10,7)      │  ← 바운딩박스 (매물 조회용)
│ bbox_sw_lng  DECIMAL(10,7)      │
│ bbox_ne_lat  DECIMAL(10,7)      │
│ bbox_ne_lng  DECIMAL(10,7)      │
│ region_type  VARCHAR(20)        │  ← 투기/조정/비조정
│ created_at   TIMESTAMP          │
│ updated_at   TIMESTAMP          │
└─────────────────────────────────┘
          │ 1
          │
          │ N
┌─────────────────────────────────┐
│         property_trade          │
├─────────────────────────────────┤
│ id           BIGINT PK (AUTO)   │
│ region_code  VARCHAR(5) FK      │  → region.code
│ property_type VARCHAR(20)       │  ← apartment / villa / officetel
│ trade_type   VARCHAR(10)        │  ← trade(매매) / rent(전세)
│ name         VARCHAR(100)       │  ← 단지명/건물명
│ dong         VARCHAR(50)        │  ← 법정동
│ jibun        VARCHAR(30)        │  ← 지번
│ area         DECIMAL(8,2)       │  ← 전용면적 (m²)
│ floor        SMALLINT           │  ← 층
│ build_year   SMALLINT           │  ← 건축년도
│ deal_amount  INTEGER            │  ← 거래금액 (만원)
│ deal_date    DATE               │  ← 거래일 (YYYY-MM-DD)
│ deal_year    SMALLINT           │  ← 인덱스용 분리
│ deal_month   SMALLINT           │
│ is_canceled  BOOLEAN DEFAULT F  │  ← 취소 거래 여부
│ lat          DECIMAL(10,7)      │  ← 지오코딩 결과
│ lng          DECIMAL(10,7)      │
│ geocode_status VARCHAR(10)      │  ← success / failed / pending
│ raw_data     JSONB              │  ← 원본 API 응답 보존
│ collected_at TIMESTAMP          │  ← 수집 시각
│ created_at   TIMESTAMP          │
│ updated_at   TIMESTAMP          │
│                                 │
│ UNIQUE(region_code, name, dong, │  ← 중복 적재 방지
│   jibun, area, floor, deal_date,│
│   deal_amount, trade_type)      │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│     collection_log              │
├─────────────────────────────────┤
│ id           BIGINT PK (AUTO)   │
│ region_code  VARCHAR(5)         │
│ property_type VARCHAR(20)       │
│ trade_type   VARCHAR(10)        │
│ deal_ym      VARCHAR(6)         │  ← 수집 대상 월 (YYYYMM)
│ status       VARCHAR(10)        │  ← success / failed / partial
│ total_count  INTEGER            │  ← 수집 건수
│ new_count    INTEGER            │  ← 신규 적재 건수
│ error_msg    TEXT                │
│ started_at   TIMESTAMP          │
│ finished_at  TIMESTAMP          │
└─────────────────────────────────┘
```

### 5.2 인덱스 전략

```sql
-- 핵심 조회: 지역 + 가격 범위 + 기간
CREATE INDEX idx_property_search
  ON property_trade (region_code, deal_amount, deal_date DESC)
  WHERE is_canceled = false;

-- 동별 집계
CREATE INDEX idx_property_dong
  ON property_trade (region_code, dong, deal_amount)
  WHERE is_canceled = false;

-- 단지별 조회 (유사 매물, 가격 비교)
CREATE INDEX idx_property_complex
  ON property_trade (region_code, name, dong, deal_date DESC)
  WHERE is_canceled = false;

-- 유형별 조회
CREATE INDEX idx_property_type
  ON property_trade (region_code, property_type, trade_type)
  WHERE is_canceled = false;

-- 수집 로그 조회
CREATE INDEX idx_collection_log_lookup
  ON collection_log (region_code, deal_ym, property_type, trade_type);
```

### 5.3 데이터 규모 추정

| 항목 | 수치 |
|------|------|
| 대상 지역 | 수도권 + 광역시 주요 구 (~100개 시군구) |
| 월 평균 거래량 | ~6만 건 (전국 아파트 기준) |
| 수집 기간 | 최근 3년 (36개월) |
| 예상 초기 데이터 | ~200만 건 |
| 연간 증가 | ~70만 건 |
| 행 크기 | ~500 bytes + JSONB ~1KB |
| 예상 DB 크기 | ~3GB (초기), ~1GB/년 증가 |

PostgreSQL로 충분히 단일 서버에서 커버 가능한 규모.

---

## 6. 데이터 수집 파이프라인

### 6.1 수집 전략

```
                    ┌─────────────────────────────┐
                    │   DataCollectionScheduler    │
                    │   @Scheduled(cron)           │
                    └─────────┬───────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │  일일 수집    │ │  초기 적재    │ │  좌표 보강    │
    │  (당월 데이터)│ │  (과거 3년)  │ │  (배치)       │
    └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
           │                │                │
           ▼                ▼                ▼
    ┌──────────────────────────────────────────────┐
    │              MolitCollectorService            │
    │  1. 대상 조합 생성 (지역 × 유형 × 월)          │
    │  2. API 호출 (rate limit 준수)                 │
    │  3. XML 파싱 → Entity 변환                     │
    │  4. 중복 검사 후 INSERT (ON CONFLICT SKIP)      │
    │  5. collection_log 기록                        │
    └──────────────────────────────────────────────┘
           │
           ▼
    ┌──────────────────────────────────────────────┐
    │              GeocodeService                   │
    │  1. geocode_status = 'pending' 건 조회         │
    │  2. 배치 지오코딩 (카카오 API, 동시 5건)        │
    │  3. 좌표 업데이트                               │
    │  4. 실패 건 재시도 (최대 3회)                   │
    └──────────────────────────────────────────────┘
```

### 6.2 스케줄 설계

| 작업 | 크론 | 설명 |
|------|------|------|
| **일일 수집** | `0 0 6 * * *` (매일 06:00) | 당월 + 전월 데이터 수집 (국토부는 1~2개월 지연 반영) |
| **좌표 보강** | `0 30 6 * * *` (매일 06:30) | 일일 수집 후 미지오코딩 건 처리 |
| **초기 적재** | 수동 트리거 | 서비스 최초 배포 시 과거 3년 데이터 일괄 수집 |
| **정합성 검사** | `0 0 3 * * SUN` (일요일 03:00) | 누락 월 체크 및 재수집 |

### 6.3 국토부 API Rate Limit 관리

```java
// 수집 시 지켜야 할 제약
public class MolitRateLimiter {
    private static final int MAX_DAILY_REQUESTS = 20_000;  // 일일 한도
    private static final int REQUEST_INTERVAL_MS = 200;    // 요청 간격
    private static final int CONCURRENT_REQUESTS = 5;      // 동시 요청 수
}
```

**초기 적재 전략** (3년 × 100개 지역 × 3유형 × 2거래유형 = 21,600회 호출):
- 일일 한도 20,000회 → **2일이면 완료** (넉넉한 여유)
- 진���률 추적: collection_log로 이어받기 가능 (중단 → 재개)

**일일 수집 호출량:**
```
100개 지역 × 3유형 × 2거래유형 × 2개월(당월+전월) = 1,200회/일
→ 일일 한도 20,000회 대비 6% 사용. 여유분 18,800회 (재시도/보강용)
```

### 6.4 중복 처리

```sql
INSERT INTO property_trade (
  region_code, property_type, trade_type, name, dong, jibun,
  area, floor, build_year, deal_amount, deal_date, deal_year, deal_month,
  is_canceled, raw_data, collected_at
)
VALUES (...)
ON CONFLICT (region_code, name, dong, jibun, area, floor, deal_date, deal_amount, trade_type)
DO UPDATE SET
  is_canceled = EXCLUDED.is_canceled,  -- 취소 상태만 업데이트
  updated_at = NOW();
```

매일 같은 월 데이터를 재수집하되, 신규 건만 INSERT하고 기존 건은 취소 상태만 갱신.

---

## 7. API 설계

### 7.1 엔드포인트 목록

#### 매물 실거래 조회

```
GET /api/v1/properties
```

현재 `/api/real-estate/batch` (POST)를 대체. DB에서 즉시 응답.

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `regionCodes` | string (콤마 구분) | O | 법정동 코드 (최대 10개) |
| `types` | string (콤마 구분) | X | apartment,villa,officetel (기본: 전체) |
| `tradeType` | string | X | trade/rent (기본: trade) |
| `maxPrice` | integer | X | 최대 금액 (만원) |
| `minPrice` | integer | X | 최소 금액 (만원) |
| `minArea` | number | X | 최소 면적 (m²) |
| `maxArea` | number | X | 최대 면적 (m²) |
| `months` | integer | X | 최근 N개월 (기본: 3, 최대: 36) |
| `page` | integer | X | 페이지 번호 (기본: 0) |
| `size` | integer | X | 페이지 크기 (기본: 50, 최대: 200) |
| `sort` | string | X | dealDate,desc / dealAmount,asc 등 |

**Response:**

```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 12345,
        "regionCode": "11680",
        "propertyType": "apartment",
        "tradeType": "trade",
        "name": "래미안아파트",
        "dong": "역삼동",
        "jibun": "123-4",
        "area": 84.95,
        "floor": 12,
        "buildYear": 2005,
        "dealAmount": 125000,
        "dealDate": "2026-02-15",
        "lat": 37.500234,
        "lng": 127.036456
      }
    ],
    "page": 0,
    "size": 50,
    "totalElements": 1234,
    "totalPages": 25
  },
  "meta": {
    "dataAsOf": "2026-04-05T06:00:00",
    "regionCount": 2
  }
}
```

**현재 대비 개선점:**
- 실시간 API 호출 → DB 쿼리 (응답 50ms 이내)
- 면적/가격 범위 필터 추가
- 페이지네이션 지원
- `dataAsOf`로 데이터 기준일 명시

---

#### 지역별 통계

```
GET /api/v1/properties/stats
```

현재 프론트엔드에서 `buildRegionalAnalytics()`, `generateNeighborhoodReport()`로 계산하던 것 중 **집계 쿼리는 DB에서 처리**.

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `regionCode` | string | O | 단일 지역코드 |
| `months` | integer | X | 최근 N개월 (기본: 3) |

**Response:**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalDeals": 456,
      "medianPrice": 85000,
      "minPrice": 32000,
      "maxPrice": 198000,
      "avgPricePerPyeong": 4200
    },
    "dongSummaries": [
      {
        "dongName": "역삼동",
        "avgDealPrice": 95000,
        "dealCount": 52,
        "avgPricePerPyeong": 4800
      }
    ],
    "priceDistribution": [
      { "min": 30000, "max": 40000, "label": "3~4억", "count": 23 }
    ],
    "priceTrend": {
      "recentAvg": 88000,
      "priorAvg": 85000,
      "changePercent": 3.5,
      "direction": "up"
    }
  }
}
```

---

#### 단지별 거래 이력

```
GET /api/v1/properties/complex-history
```

유사 매물 비교, 호가 vs 실거래가 매칭에 사용.

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `regionCode` | string | O | 지역코드 |
| `name` | string | O | 단지명 |
| `dong` | string | X | 법정동 |
| `months` | integer | X | 최근 N개월 (기본: 12) |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "name": "래미안아파트",
      "dong": "역삼동",
      "area": 84.95,
      "floor": 12,
      "dealAmount": 125000,
      "dealDate": "2026-02-15"
    }
  ]
}
```

---

#### 지역 마스터

```
GET /api/v1/regions
GET /api/v1/regions/{code}
```

현재 프론트엔드 `constants/regions.ts`를 대체.

---

### 7.2 응답 시간 목표

| 엔드포인트 | 현재 | 목표 |
|------------|------|------|
| 매물 조회 (3개 지역) | 10~30초 | **< 200ms** |
| 지역 통계 | 프론트 계산 3~5초 | **< 100ms** |
| 단지 이력 | 국토부 API 2~5초 | **< 50ms** |

---

## 8. 프론트엔드 변경사항

### 8.1 변경 범위

```
삭제 대상 (Spring Boot로 이관):
  ├── src/app/api/real-estate/route.ts          → 삭제
  ├── src/app/api/real-estate/batch/route.ts    → 삭제
  ├── src/lib/api/molit.ts                      → 삭제
  ├── src/lib/api/batchProperties.ts            → 삭제
  ├── src/lib/api/mockMolitData.ts              → 삭제
  └── src/constants/regionCoords.ts             → 삭제 (DB로 이관)

수정 대상 (Spring Boot API 호출로 교체):
  ├── src/app/properties/page.tsx               → fetch URL 변경
  ├── src/app/analytics/page.tsx                → 통계 API 활용
  └── src/lib/api/config.ts                     → SPRING_BOOT_API_URL 추가

유지 (변경 없음):
  ├── src/app/api/loan-products/route.ts        → FSS API 직접 호출 유지
  ├── src/app/api/real-estate/listings/route.ts → 실시간 매물 직접 호출 유지
  ├── src/app/api/real-estate/complex/*/route.ts → 단지 상세 직접 호출 유지
  ├── src/lib/api/listingClient.ts              → 유지
  ├── src/lib/api/complexClient.ts              → 유지
  ├── src/lib/api/fss.ts                        → 유지
  ├── src/lib/api/kakao.ts                      → 유지 (프론트 지도용)
  └── src/lib/calculation/**                    → 전부 유지
```

### 8.2 프론트엔드 API 클라이언트 (신규)

```typescript
// src/lib/api/housepinApi.ts (신규)

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function fetchProperties(params: {
  regionCodes: string[];
  types?: string[];
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  months?: number;
  page?: number;
  size?: number;
}) {
  const searchParams = new URLSearchParams();
  searchParams.set('regionCodes', params.regionCodes.join(','));
  if (params.types) searchParams.set('types', params.types.join(','));
  if (params.maxPrice) searchParams.set('maxPrice', String(params.maxPrice));
  if (params.months) searchParams.set('months', String(params.months));
  if (params.page) searchParams.set('page', String(params.page));
  if (params.size) searchParams.set('size', String(params.size));

  const res = await fetch(`${BASE_URL}/api/v1/properties?${searchParams}`);
  if (!res.ok) throw new Error('매물 데이터 조회 실패');
  return res.json();
}

export async function fetchPropertyStats(regionCode: string, months?: number) {
  const params = new URLSearchParams({ regionCode });
  if (months) params.set('months', String(months));

  const res = await fetch(`${BASE_URL}/api/v1/properties/stats?${params}`);
  if (!res.ok) throw new Error('통계 조회 실패');
  return res.json();
}
```

### 8.3 매물 추천 페이지 변경 (Before → After)

**Before** (현재):
```
페이지 진입 → POST /api/real-estate/batch (10~30초) → 전체 데이터 한번에 수신 → 화면 표시
```

**After** (Phase 2):
```
페이지 진입 → GET /api/v1/properties (200ms) → 첫 페이지 즉시 표시
            → 스크롤/페이지네이션으로 추가 로드
            → 필터 변경 시 즉시 재조회
```

### 8.4 Zustand Store 변경

```typescript
// partialize 확장: 선택 지역도 보존
partialize: (state) => ({
  assetInput: state.assetInput,
  loanResult: state.loanResult,
  selectedRegions: state.selectedRegions,   // 추가
}),
```

properties/liveListings는 API에서 즉시 조회 가능하므로 store 캐시 불필요해짐.

---

## 9. 마이그레이션 전략

### 9.1 단계별 진행

```
Phase 2-1: 인프라 구축 (1주)
─────────────────────────────
  ✦ Spring Boot 프로젝트 셋업
  ✦ PostgreSQL DB 셋업 + 스키마 생성
  ✦ Flyway 마이그레이션 적용
  ✦ 지역 마스터 데이터 시딩
  ✦ CORS 설정 + API 공통 응답 형식
      │
      ▼
Phase 2-2: 데이터 수집 파이프라인 (2주)
─────────────────────────────
  ✦ MolitApiClient 구현 (XML 호출 + 파싱)
  ✦ 중복 방지 INSERT 로직
  ✦ collection_log 기록
  ✦ 초기 적재 실행 (과거 3년, 주요 지역부터)
  ✦ KakaoGeocodeClient + 좌표 보강 배치
  ✦ 스케줄러 설정 (일일 수집)
      │
      ▼
Phase 2-3: API 서빙 (1주)
─────────────────────────────
  ✦ PropertyController + 검색/필터 API
  ✦ 통계 집계 API (동별 평균, 가격 분포 등)
  ✦ 단지 이력 API
  ✦ Caffeine 캐시 적용
  ✦ API 문서 (SpringDoc)
      │
      ▼
Phase 2-4: 프론트엔드 연동 (1주)
─────────────────────────────
  ✦ housepinApi.ts 클라이언트 작성
  ✦ properties/page.tsx → Spring Boot API 연동
  ✦ analytics/page.tsx → 통계 API 활용
  ✦ molit/batchProperties 관련 코드 제거
  ✦ 필터/정렬/페이지네이션 UI 추가
      │
      ▼
Phase 2-5: 검증 + 배포 (1주)
─────────────────────────────
  ✦ 데이터 정합성 검증 (기존 API vs DB)
  ✦ 성능 테스트 (응답 시간, 동시 접속)
  ✦ Spring Boot 서버 배포 (EC2 or Railway or Fly.io)
  ✦ 환경변수 세팅 + HTTPS
  ✦ Next.js에서 Spring Boot URL 환경변수 연결
```

### 9.2 병행 운영 기간

Phase 2-4에서 **기존 API Route와 새 API를 동시 유지**:

```typescript
// 환경변수로 전환 제어
const USE_BACKEND = process.env.NEXT_PUBLIC_USE_BACKEND === 'true';

// properties/page.tsx
const loadProperties = USE_BACKEND
  ? () => fetchProperties({ regionCodes, maxPrice })           // Spring Boot
  : () => fetch('/api/real-estate/batch', { method: 'POST' }); // 기존
```

안정성 확인 후 기존 API Route 제거.

---

## 10. 리스크 및 고려사항

### 10.1 기술 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 초기 적재 2일 소요 | 서비스 런칭 대기 | 주요 10개 지역 우선 적재 (수 시간) → 나머지 백그라운드 |
| 국토부 API 응답 지연 | 수집 시간 증가 (응답 2~5초/건) | 동시 5건 병렬 처리 + 새벽 시간대 수집 |
| 지오코딩 실패율 | 일부 매물 좌표 없음 | 실패 건 재시도 + 동 중심 좌표 폴백 |
| DB 비용 | 운영 비용 증가 | 초기 PostgreSQL on EC2 free tier 또는 Supabase 무료 플랜 |

### 10.2 데이터 일관성

- 국토부 실거래는 **1~2개월 지연 반영** → `dataAsOf` 필드로 사용자에게 명시
- 거래 취소 반영: 매일 재수집 시 `is_canceled` 플래그 업데이트
- 중복 방지: Unique 제약조건 + ON CONFLICT 처리

### 10.3 배포 옵션

| 옵션 | 비용 | 장점 | 단점 |
|------|------|------|------|
| AWS EC2 (t3.micro) + RDS | ~$15/월 | 안정적, 스케일 가능 | 설정 복잡 |
| Railway | ~$5~10/월 | 간편 배포, PostgreSQL 포함 | 리소스 제한 |
| Fly.io | ~$5/월 | 글로벌, 간편 | DB 별도 |
| Supabase (DB only) + EC2 | ~$5/월 | PostgreSQL 무료, 대시보드 | API 서버 별도 필요 |

**추천**: 초기에는 **Railway** (Spring Boot + PostgreSQL 올인원, 배포 간편), 트래픽 증가 시 AWS 이관.

---

## 부록: 현재 → Phase 2 API 매핑표

| 현재 (Next.js API Route) | Phase 2 (Spring Boot) | 비고 |
|--------------------------|----------------------|------|
| `POST /api/real-estate/batch` | `GET /api/v1/properties` | DB 조회로 전환 |
| `GET /api/real-estate?regionCode&dealYM&type` | `GET /api/v1/properties` | 통합 |
| (프론트 계산) `buildRegionalAnalytics()` | `GET /api/v1/properties/stats` | DB 집계로 이관 |
| (프론트 계산) `generateNeighborhoodReport()` | `GET /api/v1/properties/stats` | DB 집계로 이관 |
| `GET /api/loan-products` | 변경 없음 (Next.js 유지) | FSS 직접 호출 |
| `POST /api/real-estate/listings` | 변경 없음 (Next.js 유지) | 실시간 매물 |
| `GET /api/real-estate/complex/[id]` | 변경 없음 (Next.js 유지) | 단지 상세 |

---

## 11. 백엔드 분리 후 프론트엔드 고도화

> 백엔드 분리(#69~#78) 완료 후 진행. Spring Boot API가 안정적으로 서빙되는 상태를 전제로 한다.

### 11.1 UX/플로우 개선

#### 입력 페이지 위저드 UX
- **대상**: `src/app/input/page.tsx`
- 현재 3개 섹션(AssetForm, QualificationForm, LoanPreferenceForm)이 한 화면에 노출
- 토스 스타일 가이드("한 화면에 하나의 액션")에 맞게 **단계별 진행**으로 변경
- `inputStep` 상태 (1: 자산 → 2: 자격 → 3: 대출 조건)
- CSS `translate-x` + `opacity` 트랜지션 슬라이드 효과
- 상단 미니 프로그레스 바 (3단계 중 현재 위치)
- 마지막 단계에서 "확인하기" → InputSummary 모달

#### 상태 영속성 확대
- **대상**: `src/store/useHousePinStore.ts`
- `partialize`에 `selectedRegions` 추가 (새로고침 시 지역 유지)
- `favorites`, `compareList` 추가 (아래 기능에서 사용)
- `liveListings`, `properties`는 제외 (데이터 크기 문제, 지역 유지되면 자동 재조회 가능)

#### 결과 페이지 로딩 경험
- **대상**: `src/app/result/page.tsx`
- 현재 "계산 중..." 텍스트 → Skeleton UI로 개선
- AffordabilityCard/PolicyCard/LoanExplorer 자리에 스켈레톤 배치, 완료 시 fade-in

#### 매물 페이지 로딩 개선
- **대상**: `src/app/properties/page.tsx`, `LoadingProgress.tsx`
- Spring Boot API 응답이 빨라지므로 로딩 UX도 그에 맞게 조정
- 실거래 + 실시간 매물 병렬 로딩 상태 분리 표시
- 먼저 완료된 데이터부터 표시 (점진적 렌더링)

### 11.2 기능 고도화

#### 매물 고급 필터
- **신규**: `src/components/properties/PropertyFilter.tsx`, `src/types/filter.ts`
- 현재 유형 필터 + 정렬만 존재 → 가격/면적/층수/건축년도 범위 필터 추가
- 접었다 펼 수 있는 필터 패널
- PropertyList, LivePropertyList 양쪽에 적용

```typescript
interface PropertyFilterState {
  priceRange: [number, number];
  areaRange: [number, number];
  minFloor: number | null;
  maxFloor: number | null;
  minBuildYear: number | null;
  propertyTypes: ('apartment' | 'villa' | 'officetel')[];
}
```

#### 즐겨찾기 기능
- **신규**: `src/components/properties/FavoriteButton.tsx`
- Store에 `favorites: string[]` (property slug 배열)
- `addFavorite`, `removeFavorite`, `isFavorite` 액션
- PropertyCard / LivePropertyCard에 하트 아이콘 토글
- "즐겨찾기만 보기" 필터 토글

#### 매물 비교 기능
- **신규**: `src/components/properties/ComparePanel.tsx`, `CompareDrawer.tsx`
- Store에 `compareList: string[]` (최대 3개)
- PropertyCard에 "비교하기" 체크 버튼
- 하단 고정 ComparePanel → CompareDrawer 모달로 나란히 비교
- 기존 `calculatePropertyAffordability` 재사용

#### 결과 공유 카드
- **신규**: `src/components/result/ShareCard.tsx`
- Canvas API로 결과 요약 이미지 생성 (구매력, 대출 한도, 월 상환액)
- Web Share API 또는 이미지 다운로드
- 민감 정보(소득 등) 미포함, 구매력 결과만

### 11.3 데이터/계산 정밀화

#### 시장 금리 동적 반영
- **대상**: `src/lib/calculation/index.ts`, **신규**: `src/app/api/market-rate/route.ts`
- 현재 `DEFAULT_MARKET_RATE = 4.0` 하드코딩 → FSS API 평균금리로 대체
- `/api/market-rate` API Route: FSS 조회 → 평균금리 계산 → 24시간 캐싱
- fallback: API 실패 시 기존 4.0% 유지

#### bankComparisons 정리
- **대상**: `src/lib/calculation/index.ts`, `src/types/index.ts`
- 현재 `bankComparisons: []` 항상 빈 배열 → LoanExplorer가 별도 FSS 호출로 동작 중
- LoanResult 타입에서 bankComparisons를 optional로 변경, 불필요한 빈 배열 제거

#### 정책대출 조건 세분화
- **대상**: `src/constants/policy.ts`, `src/lib/calculation/policyLoan.ts`
- 디딤돌: 생애최초(-0.1%p), 신혼부부(-0.2%p), 다자녀 우대금리 추가
- 보금자리: 생애최초 한도 상향(4억→4.2억), 신혼부부 특례
- **신생아특례대출 추가** (2024년 신설): 출산 2년 이내, 소득 1.3억 이하, 매매가 9억 이하
- PolicyLoanResult에 `benefits: string[]` 필드 추가 (우대 조건 Badge 표시)

#### 실거래가 추이 차트
- **신규**: `src/components/properties/detail/PriceTrendChart.tsx`
- 같은 단지의 과거 거래가를 시계열 차트로 표시
- Spring Boot DB에 실거래 히스토리가 쌓인 뒤 의미 있음
- CSS-only 바 차트 또는 SVG 라인 차트 (외부 라이브러리 없이)
- 최근 거래와 평균 가격 대비 현재 매물 위치 표시

### 11.4 구현 순서

백엔드 분리 완료 후 아래 순서로 진행:

1. **UX 기반** (11.1): Store 영속성 → 입력 위저드 → 스켈레톤 로딩 → 매물 로딩 개선
2. **기능 추가** (11.2): 고급 필터 → 즐겨찾기 → 비교 → 공유 카드
3. **데이터 정밀화** (11.3): 시장금리 → bankComparisons 정리 → 정책대출 세분화 → 실거래가 차트
