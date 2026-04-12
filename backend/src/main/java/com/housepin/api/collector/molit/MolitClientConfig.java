package com.housepin.api.collector.molit;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(MolitApiProperties.class)
public class MolitClientConfig {

    @Bean("molitRestClient")
    public RestClient molitRestClient(MolitApiProperties properties) {
        return RestClient.builder()
                .baseUrl(properties.baseUrl())
                .defaultHeader("User-Agent", "Mozilla/5.0 (compatible; house-pin-api/1.0)")
                .requestFactory(clientHttpRequestFactory(properties))
                .build();
    }

    private SimpleClientHttpRequestFactory clientHttpRequestFactory(MolitApiProperties properties) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(properties.timeoutSeconds() * 1000);
        factory.setReadTimeout(properties.timeoutSeconds() * 1000);
        return factory;
    }
}
