package com.housepin.api.collector.molit;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "molit.api")
public record MolitApiProperties(
        String baseUrl,
        String serviceKey,
        int numOfRows,
        int timeoutSeconds,
        int maxRetries,
        long requestDelayMs
) {

    public MolitApiProperties {
        if (baseUrl == null) baseUrl = "https://apis.data.go.kr/1613000";
        if (numOfRows <= 0) numOfRows = 1000;
        if (timeoutSeconds <= 0) timeoutSeconds = 10;
        if (maxRetries <= 0) maxRetries = 3;
        if (requestDelayMs <= 0) requestDelayMs = 200;
    }
}
