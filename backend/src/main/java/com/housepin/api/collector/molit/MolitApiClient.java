package com.housepin.api.collector.molit;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * 국토부 실거래가 API HTTP 클라이언트.
 * XML 응답을 받아 MolitXmlParser로 파싱한다.
 */
@Component
@Slf4j
public class MolitApiClient {

    private final MolitApiProperties properties;
    private final MolitXmlParser parser;
    private final RestClient restClient;

    public MolitApiClient(
            MolitApiProperties properties,
            MolitXmlParser parser,
            @Qualifier("molitRestClient") RestClient restClient
    ) {
        this.properties = properties;
        this.parser = parser;
        this.restClient = restClient;
    }

    /**
     * 국토부 API를 호출하여 실거래 데이터를 조회한다.
     *
     * @param endpoint   API 엔드포인트 (매매/전월세 x 주택유형)
     * @param regionCode 법정동 시군구코드 (5자리)
     * @param dealYM     거래년월 (YYYYMM)
     * @return 파싱된 거래 항목 목록, 오류 시 빈 목록
     */
    public List<MolitTradeItem> fetch(MolitEndpoint endpoint, String regionCode, String dealYM) {
        String decodedKey = decodeServiceKey(properties.serviceKey());

        String uri = UriComponentsBuilder.fromPath(endpoint.getPath())
                .queryParam("serviceKey", decodedKey)
                .queryParam("LAWD_CD", regionCode)
                .queryParam("DEAL_YMD", dealYM)
                .queryParam("numOfRows", properties.numOfRows())
                .build(false)
                .toUriString();

        log.info("Molit API 요청: endpoint={}, regionCode={}, dealYM={}", endpoint.name(), regionCode, dealYM);

        try {
            String xml = restClient.get()
                    .uri(uri)
                    .retrieve()
                    .body(String.class);

            if (xml == null || xml.isBlank()) {
                log.warn("Molit API 빈 응답: endpoint={}, regionCode={}", endpoint.name(), regionCode);
                return List.of();
            }

            if (!isSuccessResponse(xml)) {
                log.error("Molit API 응답 오류: {}", xml.substring(0, Math.min(xml.length(), 500)));
                return List.of();
            }

            List<MolitTradeItem> items = parser.parse(xml, regionCode);
            log.info("Molit API 조회 완료: {}건 (endpoint={}, regionCode={}, dealYM={})",
                    items.size(), endpoint.name(), regionCode, dealYM);
            return items;

        } catch (Exception e) {
            log.error("Molit API 호출 실패: endpoint={}, regionCode={}, error={}",
                    endpoint.name(), regionCode, e.getMessage(), e);
            return List.of();
        }
    }

    /**
     * 재시도 로직이 포함된 API 호출.
     * maxRetries까지 지수 백오프로 재시도한다.
     */
    public List<MolitTradeItem> fetchWithRetry(MolitEndpoint endpoint, String regionCode, String dealYM) {
        for (int attempt = 1; attempt <= properties.maxRetries(); attempt++) {
            try {
                List<MolitTradeItem> result = fetch(endpoint, regionCode, dealYM);
                if (!result.isEmpty()) {
                    return result;
                }
                log.debug("Molit API 빈 결과, 재시도 {}/{}", attempt, properties.maxRetries());
            } catch (Exception e) {
                log.warn("Molit API 시도 {}/{} 실패: {}", attempt, properties.maxRetries(), e.getMessage());
            }

            if (attempt < properties.maxRetries()) {
                sleep(properties.requestDelayMs() * attempt);
            }
        }

        log.warn("Molit API 최대 재시도 초과: endpoint={}, regionCode={}, dealYM={}",
                endpoint.name(), regionCode, dealYM);
        return List.of();
    }

    /**
     * 공공데이터포털 API 키가 URL-encoded 상태(%2B 등)일 수 있으므로 디코딩한다.
     */
    private String decodeServiceKey(String serviceKey) {
        if (serviceKey == null || serviceKey.isBlank()) {
            return "";
        }
        try {
            return URLDecoder.decode(serviceKey, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.debug("서비스키 디코딩 실패, 원본 사용: {}", e.getMessage());
            return serviceKey;
        }
    }

    /**
     * XML 응답의 resultCode가 성공("00" 또는 "000")인지 확인한다.
     */
    private boolean isSuccessResponse(String xml) {
        if (!xml.contains("<resultCode>")) {
            // resultCode 태그가 없으면 성공으로 간주
            return true;
        }
        return xml.contains("<resultCode>00</resultCode>")
                || xml.contains("<resultCode>000</resultCode>");
    }

    private void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.debug("API 재시도 대기 중 인터럽트 발생");
        }
    }
}
