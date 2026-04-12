-- property_trade indexes
CREATE INDEX idx_property_trade_region_type_date
    ON property_trade (region_code, property_type, deal_date);

CREATE INDEX idx_property_trade_region_year_month
    ON property_trade (region_code, deal_year, deal_month);

CREATE INDEX idx_property_trade_name_dong
    ON property_trade (name, dong);

CREATE INDEX idx_property_trade_geocode_status
    ON property_trade (geocode_status);

CREATE INDEX idx_property_trade_dedup
    ON property_trade (region_code, property_type, trade_type, name, dong, area);

-- complex indexes
CREATE INDEX idx_complex_region_code
    ON complex (region_code);

CREATE INDEX idx_complex_name
    ON complex (name);

-- collection_log indexes
CREATE INDEX idx_collection_log_lookup
    ON collection_log (region_code, property_type, trade_type, deal_ym);
