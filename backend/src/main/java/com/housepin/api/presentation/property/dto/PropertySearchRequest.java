package com.housepin.api.presentation.property.dto;

import com.housepin.api.domain.common.PropertyType;
import com.housepin.api.domain.common.TradeType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

/**
 * 매물 검색 요청 DTO.
 *
 * @param regionCode   법정동코드 앞 5자리 (필수)
 * @param propertyType 매물 유형 (null = 전체)
 * @param tradeType    거래 유형 (null = 전체)
 * @param minPrice     최소 가격 (만원)
 * @param maxPrice     최대 가격 (만원)
 * @param minArea      최소 면적 (m2)
 * @param maxArea      최대 면적 (m2)
 * @param minFloor     최소 층수
 * @param maxFloor     최대 층수
 * @param minBuildYear 최소 건축년도
 * @param page         페이지 번호 (0부터)
 * @param size         페이지 크기
 */
public record PropertySearchRequest(
        @NotBlank String regionCode,
        PropertyType propertyType,
        TradeType tradeType,
        Integer minPrice,
        Integer maxPrice,
        BigDecimal minArea,
        BigDecimal maxArea,
        Integer minFloor,
        Integer maxFloor,
        Integer minBuildYear,
        @Min(0) int page,
        @Min(1) @Max(100) int size
) {

    public PropertySearchRequest {
        if (page < 0) page = 0;
        if (size <= 0) size = 20;
    }
}
