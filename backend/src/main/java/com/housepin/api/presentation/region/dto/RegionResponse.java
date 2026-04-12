package com.housepin.api.presentation.region.dto;

import com.housepin.api.domain.region.Region;

import java.math.BigDecimal;

/**
 * 지역 응답 DTO.
 *
 * @param code       법정동코드 앞 5자리
 * @param sido       시/도명
 * @param sigungu    시/군/구명
 * @param regionType 규제 유형
 * @param centerLat  중심 위도
 * @param centerLng  중심 경도
 */
public record RegionResponse(
        String code,
        String sido,
        String sigungu,
        String regionType,
        BigDecimal centerLat,
        BigDecimal centerLng
) {

    public static RegionResponse from(Region region) {
        return new RegionResponse(
                region.getCode().getCode(),
                region.getSido(),
                region.getSigungu(),
                region.getRegionType().name(),
                region.getCenter() != null ? region.getCenter().getLat() : null,
                region.getCenter() != null ? region.getCenter().getLng() : null
        );
    }
}
