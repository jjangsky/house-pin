CREATE TABLE property_trade (
    id              BIGSERIAL       PRIMARY KEY,
    region_code     VARCHAR(5)      NOT NULL REFERENCES region(code),
    property_type   VARCHAR(20)     NOT NULL,
    trade_type      VARCHAR(20)     NOT NULL,
    name            VARCHAR(100)    NOT NULL,
    dong            VARCHAR(100),
    jibun           VARCHAR(20),
    deal_amount     INTEGER         NOT NULL,
    area            NUMERIC(10, 2),
    floor           SMALLINT,
    build_year      SMALLINT,
    deal_date       DATE            NOT NULL,
    deal_year       SMALLINT        NOT NULL,
    deal_month      SMALLINT        NOT NULL,
    is_canceled     BOOLEAN         NOT NULL DEFAULT FALSE,
    lat             NUMERIC(10, 7),
    lng             NUMERIC(10, 7),
    geocode_status  VARCHAR(20)     NOT NULL DEFAULT 'PENDING',
    raw_data        JSONB,
    collected_at    TIMESTAMP       NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_property_trade UNIQUE (region_code, property_type, trade_type, name, dong, area, floor, deal_date)
);

COMMENT ON TABLE property_trade IS '부동산 실거래가 데이터';
COMMENT ON COLUMN property_trade.deal_amount IS '거래금액 (만원 단위)';
COMMENT ON COLUMN property_trade.area IS '전용면적 (m2)';
COMMENT ON COLUMN property_trade.geocode_status IS 'PENDING, SUCCESS, FAILED';
