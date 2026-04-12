package com.housepin.api.presentation.property.dto;

import com.housepin.api.domain.property.PropertyTrade;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 매물 거래 응답 DTO.
 *
 * @param id           거래 ID
 * @param regionCode   법정동코드 앞 5자리
 * @param propertyType 매물 유형
 * @param tradeType    거래 유형
 * @param name         단지/건물명
 * @param dong         동
 * @param jibun        지번
 * @param dealAmount   거래 금액 (만원)
 * @param area         전용면적 (m2)
 * @param floor        층
 * @param buildYear    건축년도
 * @param dealDate     거래일
 * @param isCanceled   취소 여부
 * @param lat          위도
 * @param lng          경도
 */
public record PropertyResponse(
        Long id,
        String regionCode,
        String propertyType,
        String tradeType,
        String name,
        String dong,
        String jibun,
        int dealAmount,
        BigDecimal area,
        int floor,
        int buildYear,
        LocalDate dealDate,
        boolean isCanceled,
        BigDecimal lat,
        BigDecimal lng
) {

    public static PropertyResponse from(PropertyTrade trade) {
        return new PropertyResponse(
                trade.getId(),
                trade.getRegionCode(),
                trade.getPropertyType().name(),
                trade.getTradeType().name(),
                trade.getName(),
                trade.getDong(),
                trade.getJibun(),
                trade.getDealAmount().getAmount(),
                trade.getArea(),
                trade.getFloor(),
                trade.getBuildYear(),
                trade.getDealDate(),
                trade.isCanceled(),
                trade.getCoordinates() != null ? trade.getCoordinates().getLat() : null,
                trade.getCoordinates() != null ? trade.getCoordinates().getLng() : null
        );
    }
}
