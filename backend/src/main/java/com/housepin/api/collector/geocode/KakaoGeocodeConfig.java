package com.housepin.api.collector.geocode;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(KakaoGeocodeProperties.class)
public class KakaoGeocodeConfig {

    @Bean("kakaoRestClient")
    public RestClient kakaoRestClient(KakaoGeocodeProperties properties) {
        return RestClient.builder()
                .baseUrl(properties.baseUrl())
                .defaultHeader("Authorization", "KakaoAK " + properties.restApiKey())
                .requestFactory(clientHttpRequestFactory(properties))
                .build();
    }

    private SimpleClientHttpRequestFactory clientHttpRequestFactory(KakaoGeocodeProperties properties) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(properties.timeoutSeconds() * 1000);
        factory.setReadTimeout(properties.timeoutSeconds() * 1000);
        return factory;
    }
}
