CREATE TABLE collection_log (
    id              BIGSERIAL       PRIMARY KEY,
    region_code     VARCHAR(5)      NOT NULL REFERENCES region(code),
    property_type   VARCHAR(20)     NOT NULL,
    trade_type      VARCHAR(20)     NOT NULL,
    deal_ym         VARCHAR(6)      NOT NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'PARTIAL',
    total_count     INTEGER         NOT NULL DEFAULT 0,
    new_count       INTEGER         NOT NULL DEFAULT 0,
    error_message   VARCHAR(500),
    started_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    finished_at     TIMESTAMP,

    CONSTRAINT chk_deal_ym_format CHECK (deal_ym ~ '^\d{6}$')
);

COMMENT ON TABLE collection_log IS '데이터 수집 이력 로그';
COMMENT ON COLUMN collection_log.deal_ym IS '수집 대상 연월 (YYYYMM)';
COMMENT ON COLUMN collection_log.status IS 'SUCCESS, FAILED, PARTIAL';
