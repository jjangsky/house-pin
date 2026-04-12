package com.housepin.api.presentation.property.dto;

import java.util.Map;

/**
 * 매물 통계 응답 DTO.
 *
 * @param regionCode        법정동코드 앞 5자리
 * @param sigungu           시군구명
 * @param totalCount        총 거래 건수
 * @param avgPrice          평균 가격 (만원)
 * @param medianPrice       중앙값 가격 (만원)
 * @param minPrice          최저 가격 (만원)
 * @param maxPrice          최고 가격 (만원)
 * @param priceDistribution 가격 구간별 거래 건수
 * @param dongAvgPrices     동별 평균 가격
 */
public record PropertyStatsResponse(
        String regionCode,
        String sigungu,
        int totalCount,
        int avgPrice,
        int medianPrice,
        int minPrice,
        int maxPrice,
        Map<String, Integer> priceDistribution,
        Map<String, Double> dongAvgPrices
) {
}
