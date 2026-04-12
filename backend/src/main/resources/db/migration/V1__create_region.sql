CREATE TABLE region (
    code        VARCHAR(5)      PRIMARY KEY,
    sido_code   VARCHAR(2)      NOT NULL,
    sido        VARCHAR(20)     NOT NULL,
    sigungu     VARCHAR(20)     NOT NULL,
    center_lat  NUMERIC(10, 7),
    center_lng  NUMERIC(10, 7),
    region_type VARCHAR(20)     NOT NULL DEFAULT 'NON_REGULATED',
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE region IS '지역(시군구) 마스터 테이블';
COMMENT ON COLUMN region.code IS '법정동코드 앞 5자리';
COMMENT ON COLUMN region.sido_code IS '시도 코드 (앞 2자리)';
COMMENT ON COLUMN region.region_type IS '규제 유형: SPECULATIVE, REGULATED, NON_REGULATED';
