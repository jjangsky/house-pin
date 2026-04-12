package com.housepin.api.collector.geocode;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.housepin.api.domain.common.Coordinates;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.List;

/**
 * 카카오 주소 검색 API HTTP 클라이언트.
 * 주소 문자열을 받아 위경도 좌표를 반환한다.
 */
@Component
@Slf4j
public class KakaoGeocodeClient {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public KakaoGeocodeClient(
            @Qualifier("kakaoRestClient") RestClient restClient,
            ObjectMapper objectMapper
    ) {
        this.restClient = restClient;
        this.objectMapper = objectMapper;
    }

    /**
     * 주소를 검색하여 좌표를 반환한다.
     * 결과가 없거나 오류 발생 시 null을 반환한다.
     *
     * @param query 검색할 주소 문자열 (예: "강남구 역삼동 123")
     * @return 좌표 또는 null
     */
    public Coordinates searchAddress(String query) {
        if (query == null || query.isBlank()) {
            log.debug("지오코딩 쿼리가 비어있음");
            return null;
        }

        try {
            String json = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v2/local/search/address.json")
                            .queryParam("query", query)
                            .build())
                    .retrieve()
                    .body(String.class);

            if (json == null || json.isBlank()) {
                log.warn("카카오 지오코딩 빈 응답: query={}", query);
                return null;
            }

            KakaoAddressResponse response = objectMapper.readValue(json, KakaoAddressResponse.class);

            if (response.documents() == null || response.documents().isEmpty()) {
                log.debug("카카오 지오코딩 결과 없음: query={}", query);
                return null;
            }

            KakaoDocument first = response.documents().get(0);
            BigDecimal lat = new BigDecimal(first.y());
            BigDecimal lng = new BigDecimal(first.x());

            log.debug("카카오 지오코딩 성공: query={}, lat={}, lng={}", query, lat, lng);
            return Coordinates.of(lat, lng);

        } catch (Exception e) {
            log.error("카카오 지오코딩 실패: query={}, error={}", query, e.getMessage(), e);
            return null;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record KakaoAddressResponse(List<KakaoDocument> documents) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record KakaoDocument(String x, String y, String address_name) {
    }
}
