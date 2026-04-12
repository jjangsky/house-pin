package com.housepin.api.collector.molit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MolitApiClientTest {

    @Mock
    private RestClient restClient;

    @Mock
    private RestClient.RequestHeadersUriSpec<?> requestHeadersUriSpec;

    @Mock
    private RestClient.RequestHeadersSpec<?> requestHeadersSpec;

    @Mock
    private RestClient.ResponseSpec responseSpec;

    @Mock
    private MolitXmlParser parser;

    private MolitApiClient client;

    private static final MolitApiProperties PROPERTIES = new MolitApiProperties(
            "https://apis.data.go.kr/1613000",
            "test-service-key",
            1000,
            10,
            3,
            10  // 짧은 딜레이로 테스트 속도 확보
    );

    private static final String VALID_XML = """
            <?xml version="1.0" encoding="UTF-8"?>
            <response>
              <header><resultCode>00</resultCode><resultMsg>NORMAL SERVICE</resultMsg></header>
              <body>
                <items>
                  <item>
                    <dealAmount>80,000</dealAmount>
                    <buildYear>2015</buildYear>
                    <dealYear>2024</dealYear>
                    <dealMonth>3</dealMonth>
                    <dealDay>15</dealDay>
                    <umdNm>역삼동</umdNm>
                    <aptNm>래미안</aptNm>
                    <excluUseAr>84.97</excluUseAr>
                    <floor>12</floor>
                    <jibun>123</jibun>
                    <sggCd>11680</sggCd>
                  </item>
                </items>
              </body>
            </response>
            """;

    private static final String ERROR_XML = """
            <response>
              <header><resultCode>99</resultCode><resultMsg>SERVICE ERROR</resultMsg></header>
            </response>
            """;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        client = new MolitApiClient(PROPERTIES, parser, restClient);

        // RestClient 호출 체인 기본 설정
        when(restClient.get()).thenReturn((RestClient.RequestHeadersUriSpec) requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(anyString())).thenReturn((RestClient.RequestHeadersSpec) requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
    }

    // ============================================================
    // fetch 테스트
    // ============================================================

    @Nested
    @DisplayName("fetch - 국토부 API 단일 호출")
    class FetchTest {

        @Test
        @DisplayName("정상 XML 응답을 파싱하여 거래 항목 리스트를 반환한다")
        void fetch_validResponse_returnsParsedItems() {
            // Given
            when(responseSpec.body(String.class)).thenReturn(VALID_XML);

            MolitTradeItem expectedItem = new MolitTradeItem(
                    80000, 2015, 2024, 3, 15,
                    "역삼동", "래미안", new java.math.BigDecimal("84.97"),
                    12, "123", "11680", false, null
            );
            when(parser.parse(eq(VALID_XML), eq("11680"))).thenReturn(List.of(expectedItem));

            // When
            List<MolitTradeItem> result = client.fetch(MolitEndpoint.APT_TRADE, "11680", "202403");

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).dealAmount()).isEqualTo(80000);
            assertThat(result.get(0).name()).isEqualTo("래미안");
            verify(parser).parse(eq(VALID_XML), eq("11680"));
        }

        @Test
        @DisplayName("API 타임아웃 발생 시 빈 리스트를 반환한다")
        void fetch_timeout_returnsEmptyList() {
            // Given
            when(responseSpec.body(String.class))
                    .thenThrow(new ResourceAccessException("Read timed out"));

            // When
            List<MolitTradeItem> result = client.fetch(MolitEndpoint.APT_TRADE, "11680", "202403");

            // Then
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("오류 응답 XML(resultCode != 00)은 빈 리스트를 반환한다")
        void fetch_errorXmlResponse_returnsEmptyList() {
            // Given
            when(responseSpec.body(String.class)).thenReturn(ERROR_XML);

            // When
            List<MolitTradeItem> result = client.fetch(MolitEndpoint.APT_TRADE, "11680", "202403");

            // Then
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("null 응답 바디는 빈 리스트를 반환한다")
        void fetch_nullBody_returnsEmptyList() {
            // Given
            when(responseSpec.body(String.class)).thenReturn(null);

            // When
            List<MolitTradeItem> result = client.fetch(MolitEndpoint.APT_TRADE, "11680", "202403");

            // Then
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("빈 문자열 응답은 빈 리스트를 반환한다")
        void fetch_emptyBody_returnsEmptyList() {
            // Given
            when(responseSpec.body(String.class)).thenReturn("");

            // When
            List<MolitTradeItem> result = client.fetch(MolitEndpoint.APT_TRADE, "11680", "202403");

            // Then
            assertThat(result).isEmpty();
        }
    }

    // ============================================================
    // fetchWithRetry 테스트
    // ============================================================

    @Nested
    @DisplayName("fetchWithRetry - 재시도 로직을 포함한 API 호출")
    class FetchWithRetryTest {

        @Test
        @DisplayName("첫 번째 호출 실패 후 두 번째 호출 성공 시 결과를 반환한다")
        void fetchWithRetry_firstFailSecondSuccess_returnsResult() {
            // Given
            MolitTradeItem expectedItem = new MolitTradeItem(
                    80000, 2015, 2024, 3, 15,
                    "역삼동", "래미안", new java.math.BigDecimal("84.97"),
                    12, "123", "11680", false, null
            );

            when(responseSpec.body(String.class))
                    .thenThrow(new ResourceAccessException("Connection refused"))
                    .thenReturn(VALID_XML);
            when(parser.parse(eq(VALID_XML), eq("11680"))).thenReturn(List.of(expectedItem));

            // When
            List<MolitTradeItem> result = client.fetchWithRetry(MolitEndpoint.APT_TRADE, "11680", "202403");

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).name()).isEqualTo("래미안");
        }

        @Test
        @DisplayName("최대 재시도 횟수 초과 시 빈 리스트를 반환한다")
        void fetchWithRetry_allRetriesFail_returnsEmptyList() {
            // Given
            when(responseSpec.body(String.class))
                    .thenThrow(new ResourceAccessException("Connection refused"));

            // When
            List<MolitTradeItem> result = client.fetchWithRetry(MolitEndpoint.APT_TRADE, "11680", "202403");

            // Then
            assertThat(result).isEmpty();
            // maxRetries=3 이므로 3번 호출
            verify(restClient, times(3)).get();
        }

        @Test
        @DisplayName("첫 호출에서 빈 결과를 받으면 재시도한다")
        void fetchWithRetry_emptyResultThenSuccess_retriesAndReturns() {
            // Given
            MolitTradeItem expectedItem = new MolitTradeItem(
                    42000, 2008, 2024, 3, 20,
                    "서초동", "반포자이", new java.math.BigDecimal("59.96"),
                    5, "456", "11650", false, null
            );

            // 첫 호출: 빈 XML 반환 → 빈 결과, 두 번째: 정상 응답
            String emptyItemsXml = """
                    <response>
                      <header><resultCode>00</resultCode></header>
                      <body><items/><totalCount>0</totalCount></body>
                    </response>
                    """;

            when(responseSpec.body(String.class))
                    .thenReturn(emptyItemsXml)
                    .thenReturn(VALID_XML);
            when(parser.parse(eq(emptyItemsXml), eq("11650"))).thenReturn(List.of());
            when(parser.parse(eq(VALID_XML), eq("11650"))).thenReturn(List.of(expectedItem));

            // When
            List<MolitTradeItem> result = client.fetchWithRetry(MolitEndpoint.APT_TRADE, "11650", "202403");

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).name()).isEqualTo("반포자이");
        }
    }
}
