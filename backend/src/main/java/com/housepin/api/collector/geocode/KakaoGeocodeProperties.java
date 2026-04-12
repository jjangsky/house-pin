package com.housepin.api.collector.geocode;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "kakao.geocode")
public record KakaoGeocodeProperties(
        String baseUrl,
        String restApiKey,
        int timeoutSeconds,
        int batchSize,
        int concurrency,
        long requestDelayMs
) {

    public KakaoGeocodeProperties {
        if (baseUrl == null) baseUrl = "https://dapi.kakao.com";
        if (timeoutSeconds <= 0) timeoutSeconds = 5;
        if (batchSize <= 0) batchSize = 100;
        if (concurrency <= 0) concurrency = 5;
        if (requestDelayMs <= 0) requestDelayMs = 100;
    }
}
