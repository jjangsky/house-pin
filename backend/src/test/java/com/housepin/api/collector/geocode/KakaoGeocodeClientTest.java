package com.housepin.api.collector.geocode;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.housepin.api.domain.common.Coordinates;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.function.Function;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KakaoGeocodeClientTest {

    @Mock
    private RestClient restClient;

    @Mock
    private RestClient.RequestHeadersUriSpec<?> requestHeadersUriSpec;

    @Mock
    private RestClient.RequestHeadersSpec<?> requestHeadersSpec;

    @Mock
    private RestClient.ResponseSpec responseSpec;

    private KakaoGeocodeClient client;

    private static final String SUCCESS_RESPONSE = """
            {
              "documents": [
                {
                  "address_name": "서울 강남구 역삼동 123",
                  "x": "127.0473248",
                  "y": "37.5172363"
                }
              ]
            }
            """;

    private static final String EMPTY_DOCUMENTS_RESPONSE = """
            {
              "documents": []
            }
            """;

    private static final String MULTIPLE_DOCUMENTS_RESPONSE = """
            {
              "documents": [
                {
                  "address_name": "서울 강남구 역삼동 123",
                  "x": "127.0473248",
                  "y": "37.5172363"
                },
                {
                  "address_name": "서울 강남구 역삼동 456",
                  "x": "127.0500000",
                  "y": "37.5200000"
                }
              ]
            }
            """;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        client = new KakaoGeocodeClient(restClient, new ObjectMapper());

        when(restClient.get()).thenReturn((RestClient.RequestHeadersUriSpec) requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(any(Function.class))).thenReturn((RestClient.RequestHeadersSpec) requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
    }

    @Test
    @DisplayName("정상 응답 시 첫 번째 문서의 좌표를 반환한다")
    void searchAddress_successResponse_returnsCoordinates() {
        // Given
        when(responseSpec.body(String.class)).thenReturn(SUCCESS_RESPONSE);

        // When
        Coordinates result = client.searchAddress("서울 강남구 역삼동 123");

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getLat()).isEqualByComparingTo(new BigDecimal("37.5172363"));
        assertThat(result.getLng()).isEqualByComparingTo(new BigDecimal("127.0473248"));
    }

    @Test
    @DisplayName("검색 결과가 없으면 null을 반환한다")
    void searchAddress_emptyDocuments_returnsNull() {
        // Given
        when(responseSpec.body(String.class)).thenReturn(EMPTY_DOCUMENTS_RESPONSE);

        // When
        Coordinates result = client.searchAddress("존재하지 않는 주소");

        // Then
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("API 호출 중 예외 발생 시 null을 반환한다")
    void searchAddress_apiError_returnsNull() {
        // Given
        when(responseSpec.body(String.class))
                .thenThrow(new ResourceAccessException("Connection refused"));

        // When
        Coordinates result = client.searchAddress("서울 강남구 역삼동 123");

        // Then
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("여러 문서가 반환되면 첫 번째 문서의 좌표만 사용한다")
    void searchAddress_multipleDocuments_usesFirstDocumentOnly() {
        // Given
        when(responseSpec.body(String.class)).thenReturn(MULTIPLE_DOCUMENTS_RESPONSE);

        // When
        Coordinates result = client.searchAddress("서울 강남구 역삼동");

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getLat()).isEqualByComparingTo(new BigDecimal("37.5172363"));
        assertThat(result.getLng()).isEqualByComparingTo(new BigDecimal("127.0473248"));
    }
}
