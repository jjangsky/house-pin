package com.housepin.api.collector.molit;

import java.math.BigDecimal;

/**
 * 국토부 실거래가 API 파싱 결과 DTO.
 * 금액 단위: 만원, 면적 단위: m²
 */
public record MolitTradeItem(
        int dealAmount,
        int buildYear,
        int dealYear,
        int dealMonth,
        int dealDay,
        String dong,
        String name,
        BigDecimal area,
        int floor,
        String jibun,
        String regionCode,
        boolean isCanceled,
        String rawXml
) {
}
