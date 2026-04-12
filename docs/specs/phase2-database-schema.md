# Phase 2: 데이터베이스 스키마 설계

> 작성일: 2026-04-05
> DB: PostgreSQL
> 마이그레이션: Flyway

---

## 목차

1. [스키마 전체 구조](#1-스키마-전체-구조)
2. [Phase 2 테이블 (즉시 구현)](#2-phase-2-테이블)
3. [Phase 3 테이블 (커뮤니티 확장)](#3-phase-3-테이블)
4. [인덱스 전략](#4-인덱스-전략)
5. [Flyway 마이그레이션 스크립트](#5-flyway-마이그레이션-스크립트)
6. [JPA Entity 매핑 가이드](#6-jpa-entity-매핑-가이드)

---

## 1. 스키마 전체 구조

```
Phase 2 (즉시)                          Phase 3 (커뮤니티 확장)
──────────────                          ────────────────────

┌──────────┐                            ┌──────────┐
│  region  │◄─────────────────────┐     │   user   │
└────┬─────┘                      │     └────┬─────┘
     │1                           │          │1
     │                            │          │
     │N                           │          ├───────────┬──────────────┐
┌────┴──────────┐                 │          │N          │N             │N
│ property_trade│                 │     ┌────┴─────┐ ┌──┴────────┐ ┌──┴──────┐
└────┬──────────┘                 │     │ favorite │ │   post    │ │ review  │
     │                            │     └──────────┘ └──┬────────┘ └─────────┘
     │                            │                     │1
┌────┴──────────┐                 │                     │N
│ collection_log│                 │               ┌─────┴────┐
└───────────────┘                 │               │ comment  │
                                  │               └──────────┘
┌───────────────┐                 │
│    complex    │─────────────────┘
└───────────────┘
```

---

## 2. Phase 2 테이블

### 2.1 region (지역 마스터)

현재 `constants/regions.ts` + `constants/regionCoords.ts`를 통합.

```sql
CREATE TABLE region (
    code            VARCHAR(5)      PRIMARY KEY,        -- 법정동코드 앞5자리 (예: '11680')
    sido_code       VARCHAR(2)      NOT NULL,           -- 시도코드 (예: '11')
    sido            VARCHAR(20)     NOT NULL,           -- 시도명 (예: '서울특별시')
    sigungu         VARCHAR(30)     NOT NULL,           -- 시군구명 (예: '강남구')
    center_lat      DECIMAL(10,7),                      -- 중심 위도
    center_lng      DECIMAL(10,7),                      -- 중심 경도
    region_type     VARCHAR(20)     DEFAULT 'non_regulated',  -- speculative / regulated / non_regulated
    is_active       BOOLEAN         DEFAULT true,       -- 서비스 대상 지역 여부
    created_at      TIMESTAMP       DEFAULT NOW(),
    updated_at      TIMESTAMP       DEFAULT NOW()
);

COMMENT ON TABLE region IS '시군구 단위 지역 마스터 데이터';
COMMENT ON COLUMN region.code IS '법정동코드 앞 5자리. 국토부 API의 LAWD_CD 파라미터와 동일';
COMMENT ON COLUMN region.region_type IS '부동산 규제지역 분류. LTV 비율 산정에 사용';
```

**데이터 규모**: ~250행 (고정)

---

### 2.2 property_trade (실거래 데이터)

현재 국토부 API에서 실시간 호출하던 데이터를 DB에 저장.

```sql
CREATE TABLE property_trade (
    id              BIGSERIAL       PRIMARY KEY,
    region_code     VARCHAR(5)      NOT NULL REFERENCES region(code),

    -- 매물 식별
    property_type   VARCHAR(20)     NOT NULL,           -- apartment / villa / officetel
    trade_type      VARCHAR(10)     NOT NULL,           -- trade(매매) / rent(전월세)
    name            VARCHAR(100)    NOT NULL,           -- 단지명/건물명
    dong            VARCHAR(50)     NOT NULL,           -- 법정동
    jibun           VARCHAR(30)     DEFAULT '',         -- 지번

    -- 매물 스펙
    area            DECIMAL(8,2)    NOT NULL,           -- 전용면적 (m²)
    floor           SMALLINT        NOT NULL DEFAULT 0, -- 층
    build_year      SMALLINT        DEFAULT 0,          -- 건축년도

    -- 거래 정보
    deal_amount     INTEGER         NOT NULL,           -- 거래금액 (만원). 전세의 경우 보증금
    deal_date       DATE            NOT NULL,           -- 거래일
    deal_year       SMALLINT        NOT NULL,           -- 거래년도 (파티셔닝/조회 편의)
    deal_month      SMALLINT        NOT NULL,           -- 거래월

    -- 거래 상태
    is_canceled     BOOLEAN         DEFAULT false,      -- 취소 거래 여부

    -- 좌표 (카카오 지오코딩 결과)
    lat             DECIMAL(10,7),
    lng             DECIMAL(10,7),
    geocode_status  VARCHAR(10)     DEFAULT 'pending',  -- pending / success / failed

    -- 원본 보존
    raw_data        JSONB,                              -- 국토부 API 원본 응답

    -- 메타
    collected_at    TIMESTAMP       NOT NULL DEFAULT NOW(),  -- 수집 시각
    created_at      TIMESTAMP       DEFAULT NOW(),
    updated_at      TIMESTAMP       DEFAULT NOW(),

    -- 중복 방지 (같은 거래를 두 번 적재하지 않음)
    CONSTRAINT uq_property_trade UNIQUE (
        region_code, property_type, trade_type,
        name, dong, jibun, area, floor,
        deal_date, deal_amount
    )
);

COMMENT ON TABLE property_trade IS '부동산 실거래 이력. 국토부 공공API에서 수집';
COMMENT ON COLUMN property_trade.deal_amount IS '만원 단위. 매매: 거래가, 전세: 보증금';
COMMENT ON COLUMN property_trade.raw_data IS '국토부 API 원본 JSON. 디버깅/재파싱용';
```

**데이터 규모**: 초기 ~200만 행, 연 ~70만 행 증가

---

### 2.3 complex (단지 마스터)

같은 단지명이 property_trade에 반복 저장되므로, 단지 단위 정보를 분리.
Phase 2에서는 수집 과정에서 자동 생성. Phase 3에서 리뷰/즐겨찾기의 대상.

```sql
CREATE TABLE complex (
    id              BIGSERIAL       PRIMARY KEY,
    region_code     VARCHAR(5)      NOT NULL REFERENCES region(code),
    name            VARCHAR(100)    NOT NULL,           -- 단지명
    dong            VARCHAR(50)     NOT NULL,           -- 법정동
    jibun           VARCHAR(30)     DEFAULT '',         -- 대표 지번
    property_type   VARCHAR(20)     NOT NULL,           -- apartment / villa / officetel
    build_year      SMALLINT,                           -- 건축년도
    lat             DECIMAL(10,7),                      -- 대표 좌표
    lng             DECIMAL(10,7),
    created_at      TIMESTAMP       DEFAULT NOW(),
    updated_at      TIMESTAMP       DEFAULT NOW(),

    CONSTRAINT uq_complex UNIQUE (region_code, name, dong, property_type)
);

COMMENT ON TABLE complex IS '단지/건물 마스터. property_trade 적재 시 자동 생성(upsert)';
```

**데이터 규모**: ~5만 행 (단지 수)

---

### 2.4 collection_log (수집 이력)

수집 파이프라인의 진행 상황 추적, 실패 재시도, 중단 후 재개에 사용.

```sql
CREATE TABLE collection_log (
    id              BIGSERIAL       PRIMARY KEY,
    region_code     VARCHAR(5)      NOT NULL,
    property_type   VARCHAR(20)     NOT NULL,           -- apartment / villa / officetel
    trade_type      VARCHAR(10)     NOT NULL,           -- trade / rent
    deal_ym         VARCHAR(6)      NOT NULL,           -- 수집 대상 월 (YYYYMM)
    status          VARCHAR(10)     NOT NULL,           -- success / failed / partial
    total_count     INTEGER         DEFAULT 0,          -- API 응답 건수
    new_count       INTEGER         DEFAULT 0,          -- 신규 적재 건수
    error_message   TEXT,
    started_at      TIMESTAMP       NOT NULL,
    finished_at     TIMESTAMP,

    CONSTRAINT uq_collection UNIQUE (region_code, property_type, trade_type, deal_ym)
);

COMMENT ON TABLE collection_log IS '국토부 API 수집 이력. 중복 수집 방지 및 실패 재시도 판단용';
```

**활용 예시**:
```sql
-- 아직 수집 안 된 조합 찾기 (초기 적재 이어받기)
SELECT r.code, t.type, t.trade, m.ym
FROM region r
CROSS JOIN (VALUES ('apartment','trade'), ('villa','trade'), ('officetel','trade'),
                   ('apartment','rent'), ('officetel','rent')) AS t(type, trade)
CROSS JOIN generate_series(...) AS m(ym)
WHERE NOT EXISTS (
    SELECT 1 FROM collection_log cl
    WHERE cl.region_code = r.code
      AND cl.property_type = t.type
      AND cl.trade_type = t.trade
      AND cl.deal_ym = m.ym
      AND cl.status = 'success'
);
```

---

## 3. Phase 3 테이블 (커뮤니티 확장)

> Phase 2에서는 생성하지 않음. 스키마 설계만 미리 해두고, 나중에 Flyway로 추가.

### 3.1 users (회원)

```sql
CREATE TABLE users (
    id              BIGSERIAL       PRIMARY KEY,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    nickname        VARCHAR(30)     NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,
    profile_image   VARCHAR(500),
    role            VARCHAR(20)     DEFAULT 'USER',     -- USER / ADMIN
    is_active       BOOLEAN         DEFAULT true,
    last_login_at   TIMESTAMP,
    created_at      TIMESTAMP       DEFAULT NOW(),
    updated_at      TIMESTAMP       DEFAULT NOW()
);
```

### 3.2 favorite (관심 매물/단지)

```sql
CREATE TABLE favorite (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type     VARCHAR(20)     NOT NULL,           -- complex / region
    complex_id      BIGINT          REFERENCES complex(id) ON DELETE CASCADE,
    region_code     VARCHAR(5)      REFERENCES region(code),
    memo            VARCHAR(200),
    created_at      TIMESTAMP       DEFAULT NOW(),

    CONSTRAINT uq_favorite UNIQUE (user_id, target_type, complex_id, region_code)
);

COMMENT ON TABLE favorite IS '사용자 관심 단지/지역. target_type으로 구분';
```

### 3.3 post (커뮤니티 게시글)

```sql
CREATE TABLE post (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    region_code     VARCHAR(5)      REFERENCES region(code),      -- 지역 태그 (선택)
    complex_id      BIGINT          REFERENCES complex(id),       -- 단지 태그 (선택)
    category        VARCHAR(30)     NOT NULL,           -- free / question / review / info
    title           VARCHAR(200)    NOT NULL,
    content         TEXT            NOT NULL,
    view_count      INTEGER         DEFAULT 0,
    like_count      INTEGER         DEFAULT 0,
    comment_count   INTEGER         DEFAULT 0,          -- 비정규화 (조회 성능)
    is_deleted      BOOLEAN         DEFAULT false,      -- soft delete
    created_at      TIMESTAMP       DEFAULT NOW(),
    updated_at      TIMESTAMP       DEFAULT NOW()
);
```

### 3.4 comment (댓글)

```sql
CREATE TABLE comment (
    id              BIGSERIAL       PRIMARY KEY,
    post_id         BIGINT          NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    parent_id       BIGINT          REFERENCES comment(id),       -- 대댓글
    content         TEXT            NOT NULL,
    like_count      INTEGER         DEFAULT 0,
    is_deleted      BOOLEAN         DEFAULT false,
    created_at      TIMESTAMP       DEFAULT NOW(),
    updated_at      TIMESTAMP       DEFAULT NOW()
);
```

### 3.5 review (단지 리뷰)

```sql
CREATE TABLE review (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    complex_id      BIGINT          NOT NULL REFERENCES complex(id),

    -- 평점 (1~5)
    rating_overall      SMALLINT    NOT NULL CHECK (rating_overall BETWEEN 1 AND 5),
    rating_transport    SMALLINT    CHECK (rating_transport BETWEEN 1 AND 5),
    rating_environment  SMALLINT    CHECK (rating_environment BETWEEN 1 AND 5),
    rating_education    SMALLINT    CHECK (rating_education BETWEEN 1 AND 5),
    rating_facility     SMALLINT    CHECK (rating_facility BETWEEN 1 AND 5),

    content         TEXT,
    pros            VARCHAR(500),                       -- 장점
    cons            VARCHAR(500),                       -- 단점
    is_resident     BOOLEAN         DEFAULT false,      -- 실거주자 여부 (자가 인증)
    is_deleted      BOOLEAN         DEFAULT false,
    created_at      TIMESTAMP       DEFAULT NOW(),
    updated_at      TIMESTAMP       DEFAULT NOW(),

    CONSTRAINT uq_review UNIQUE (user_id, complex_id)   -- 1인 1리뷰
);

COMMENT ON TABLE review IS '단지 리뷰. complex 테이블이 Phase 2에서 이미 존재하므로 바로 연결 가능';
```

---

## 4. 인덱스 전략

### Phase 2 인덱스

```sql
-- ============================================================
-- property_trade 인덱스
-- ============================================================

-- [핵심] 매물 검색: 지역 + 가격 + 기간 (프론트 메인 쿼리)
CREATE INDEX idx_pt_search
    ON property_trade (region_code, deal_amount, deal_date DESC)
    WHERE is_canceled = false;

-- [핵심] 동별 집계: 지역 시세 분석, 동네 리포트
CREATE INDEX idx_pt_dong_stats
    ON property_trade (region_code, dong, deal_year, deal_month)
    WHERE is_canceled = false;

-- [핵심] 단지별 이력: 유사 매물, 호가 vs 실거래 비교
CREATE INDEX idx_pt_complex
    ON property_trade (region_code, name, dong, deal_date DESC)
    WHERE is_canceled = false;

-- 유형별 필터
CREATE INDEX idx_pt_type
    ON property_trade (region_code, property_type, trade_type);

-- 지오코딩 미완료 건 조회 (배치 처리용)
CREATE INDEX idx_pt_geocode_pending
    ON property_trade (geocode_status)
    WHERE geocode_status = 'pending';

-- ============================================================
-- complex 인덱스
-- ============================================================

CREATE INDEX idx_complex_region
    ON complex (region_code, property_type);

-- ============================================================
-- collection_log 인덱스
-- ============================================================

-- 수집 상태 조회 (미수집/실패 건 찾기)
CREATE INDEX idx_cl_status
    ON collection_log (status, region_code);
```

### Phase 3 인덱스 (커뮤니티 추가 시)

```sql
CREATE INDEX idx_favorite_user    ON favorite (user_id, target_type);
CREATE INDEX idx_post_region      ON post (region_code, created_at DESC) WHERE NOT is_deleted;
CREATE INDEX idx_post_complex     ON post (complex_id, created_at DESC) WHERE NOT is_deleted;
CREATE INDEX idx_post_category    ON post (category, created_at DESC) WHERE NOT is_deleted;
CREATE INDEX idx_comment_post     ON comment (post_id, created_at) WHERE NOT is_deleted;
CREATE INDEX idx_review_complex   ON review (complex_id, rating_overall DESC) WHERE NOT is_deleted;
```

---

## 5. Flyway 마이그레이션 스크립트

### 파일 구조

```
src/main/resources/db/migration/
├── V1__create_region.sql
├── V2__create_property_trade.sql
├── V3__create_complex.sql
├── V4__create_collection_log.sql
├── V5__create_indexes.sql
├── V6__seed_region_data.sql          ← regions.ts + regionCoords.ts 데이터
│
│  (Phase 3)
├── V10__create_users.sql
├── V11__create_favorite.sql
├── V12__create_post_comment.sql
├── V13__create_review.sql
└── V14__create_community_indexes.sql
```

### V6 시딩 예시

```sql
-- V6__seed_region_data.sql
-- 현재 constants/regions.ts + regionCoords.ts에서 변환

INSERT INTO region (code, sido_code, sido, sigungu, center_lat, center_lng, region_type) VALUES
-- 서울특별시
('11110', '11', '서울특별시', '종로구',     37.5735000, 126.9790000, 'regulated'),
('11140', '11', '서울특별시', '중구',       37.5641000, 126.9979000, 'regulated'),
('11170', '11', '서울특별시', '용산구',     37.5326000, 126.9910000, 'speculative'),
('11200', '11', '서울특별시', '성동구',     37.5634000, 127.0369000, 'regulated'),
('11680', '11', '서울특별시', '강남구',     37.5172000, 127.0473000, 'speculative'),
('11650', '11', '서울특별시', '서초구',     37.4837000, 127.0324000, 'speculative'),
('11710', '11', '서울특별시', '송파구',     37.5146000, 127.1060000, 'speculative'),
-- ... 나머지 지역
;
```

---

## 6. JPA Entity 매핑 가이드

### PropertyTrade Entity

```java
@Entity
@Table(name = "property_trade")
public class PropertyTrade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "region_code", nullable = false, length = 5)
    private String regionCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "property_type", nullable = false, length = 20)
    private PropertyType propertyType;  // APARTMENT, VILLA, OFFICETEL

    @Enumerated(EnumType.STRING)
    @Column(name = "trade_type", nullable = false, length = 10)
    private TradeType tradeType;  // TRADE, RENT

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 50)
    private String dong;

    @Column(length = 30)
    private String jibun;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal area;

    @Column(nullable = false)
    private Short floor;

    private Short buildYear;

    @Column(name = "deal_amount", nullable = false)
    private Integer dealAmount;         // 만원

    @Column(name = "deal_date", nullable = false)
    private LocalDate dealDate;

    @Column(name = "deal_year", nullable = false)
    private Short dealYear;

    @Column(name = "deal_month", nullable = false)
    private Short dealMonth;

    @Column(name = "is_canceled")
    private Boolean isCanceled = false;

    private BigDecimal lat;
    private BigDecimal lng;

    @Enumerated(EnumType.STRING)
    @Column(name = "geocode_status", length = 10)
    private GeocodeStatus geocodeStatus = GeocodeStatus.PENDING;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_data", columnDefinition = "jsonb")
    private String rawData;

    @Column(name = "collected_at", nullable = false)
    private LocalDateTime collectedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (collectedAt == null) collectedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

### 프론트엔드 Property 타입과의 매핑

```
프론트 (TypeScript)          →    DB (property_trade)
─────────────────────────         ──────────────────────
Property.dealAmount          →    deal_amount
Property.buildYear           →    build_year
Property.dealYear/Month/Day  →    deal_date + deal_year + deal_month
Property.dong                →    dong
Property.name                →    name
Property.area                →    area
Property.floor               →    floor
Property.jibun               →    jibun
Property.regionCode          →    region_code
Property.lat / lng           →    lat / lng
Property.propertyType        →    property_type
(없음)                       →    trade_type (신규: 매매/전세 구분)
(없음)                       →    is_canceled (신규: 취소 거래)
(없음)                       →    raw_data (신규: 원본 보존)
```

### API 응답 DTO

```java
public record PropertyResponse(
    Long id,
    String regionCode,
    String propertyType,
    String tradeType,
    String name,
    String dong,
    String jibun,
    double area,
    int floor,
    int buildYear,
    int dealAmount,
    String dealDate,
    Double lat,
    Double lng
) {
    public static PropertyResponse from(PropertyTrade entity) {
        return new PropertyResponse(
            entity.getId(),
            entity.getRegionCode(),
            entity.getPropertyType().name().toLowerCase(),
            entity.getTradeType().name().toLowerCase(),
            entity.getName(),
            entity.getDong(),
            entity.getJibun(),
            entity.getArea().doubleValue(),
            entity.getFloor(),
            entity.getBuildYear(),
            entity.getDealAmount(),
            entity.getDealDate().toString(),
            entity.getLat() != null ? entity.getLat().doubleValue() : null,
            entity.getLng() != null ? entity.getLng().doubleValue() : null
        );
    }
}
```

---

## 부록: 주요 쿼리 패턴

### A. 매물 검색 (메인 쿼리)

```sql
-- 프론트 /properties 페이지 진입 시
SELECT * FROM property_trade
WHERE region_code IN ('11680', '11650')
  AND is_canceled = false
  AND deal_amount <= 120000
  AND deal_date >= CURRENT_DATE - INTERVAL '3 months'
ORDER BY deal_date DESC, deal_amount ASC
LIMIT 50 OFFSET 0;
```

### B. 동별 통계 (지역 시세 분석)

```sql
-- 프론트 /analytics 페이지
SELECT
    dong,
    COUNT(*) AS deal_count,
    ROUND(AVG(deal_amount)) AS avg_price,
    ROUND(AVG(deal_amount / (area / 3.3058))) AS avg_price_per_pyeong
FROM property_trade
WHERE region_code = '11680'
  AND is_canceled = false
  AND deal_date >= CURRENT_DATE - INTERVAL '3 months'
GROUP BY dong
ORDER BY avg_price DESC;
```

### C. 단지 이력 (호가 vs 실거래 비교)

```sql
-- 실시간 매물의 과거 실거래가 조회
SELECT deal_amount, area, floor, deal_date
FROM property_trade
WHERE region_code = '11680'
  AND name = '래미안아파트'
  AND dong = '역삼동'
  AND is_canceled = false
ORDER BY deal_date DESC
LIMIT 20;
```

### D. 가격 분포 (히스토그램)

```sql
SELECT
    width_bucket(deal_amount, 0, 200000, 20) AS bucket,
    MIN(deal_amount) AS min_price,
    MAX(deal_amount) AS max_price,
    COUNT(*) AS count
FROM property_trade
WHERE region_code IN ('11680', '11650')
  AND is_canceled = false
  AND deal_date >= CURRENT_DATE - INTERVAL '3 months'
GROUP BY bucket
ORDER BY bucket;
```
