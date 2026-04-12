CREATE TABLE complex (
    id              BIGSERIAL       PRIMARY KEY,
    region_code     VARCHAR(5)      NOT NULL REFERENCES region(code),
    name            VARCHAR(100)    NOT NULL,
    dong            VARCHAR(100),
    jibun           VARCHAR(20),
    property_type   VARCHAR(20)     NOT NULL,
    build_year      SMALLINT,
    lat             NUMERIC(10, 7),
    lng             NUMERIC(10, 7),
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_complex UNIQUE (region_code, name, dong, property_type)
);

COMMENT ON TABLE complex IS '단지(아파트/빌라/오피스텔) 마스터 테이블';
