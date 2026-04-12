package com.housepin.api.collector.geocode;

import com.housepin.api.domain.common.*;
import com.housepin.api.domain.property.PropertyTrade;
import com.housepin.api.domain.property.PropertyTradeRepository;
import com.housepin.api.domain.region.Region;
import com.housepin.api.domain.region.RegionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GeocodeServiceTest {

    @Mock
    private KakaoGeocodeClient geocodeClient;

    @Mock
    private KakaoGeocodeProperties properties;

    @Mock
    private PropertyTradeRepository propertyTradeRepository;

    @Mock
    private RegionRepository regionRepository;

    @InjectMocks
    private GeocodeService geocodeService;

    // ============================================================
    // 헬퍼
    // ============================================================

    private PropertyTrade createTrade(String dong, String jibun) {
        return PropertyTrade.create(
                "11680", PropertyType.APARTMENT, TradeType.TRADE,
                "테스트아파트", dong, jibun,
                80000, new BigDecimal("84.97"), (short) 12, (short) 2015,
                LocalDate.of(2024, 3, 15), "{}"
        );
    }

    private void mockRegionLookup() {
        Region region = mock(Region.class);
        when(region.getSigungu()).thenReturn("강남구");
        when(regionRepository.findByCode(any(RegionCode.class))).thenReturn(Optional.of(region));
    }

    // ============================================================
    // 배치 지오코딩 테스트
    // ============================================================

    @Nested
    @DisplayName("geocodePendingProperties - 배치 지오코딩")
    class GeocodePendingPropertiesTest {

        @Test
        @DisplayName("PENDING 상태의 매물이 없으면 0을 반환하고 API를 호출하지 않는다")
        void geocode_noPending_returnsZero() {
            // given
            when(properties.batchSize()).thenReturn(100);
            when(propertyTradeRepository.findByGeocodeStatus(eq(GeocodeStatus.PENDING), any(Pageable.class)))
                    .thenReturn(List.of());

            // when
            int result = geocodeService.geocodePendingProperties();

            // then
            assertThat(result).isEqualTo(0);
            verify(geocodeClient, never()).searchAddress(anyString());
        }

        @Test
        @DisplayName("3개 매물 중 2개가 고유 주소일 때 모두 성공하면 3을 반환한다")
        void geocode_threeProperties_twoUniqueAddresses_returnsThree() {
            // given
            PropertyTrade trade1 = createTrade("역삼동", "123");
            PropertyTrade trade2 = createTrade("역삼동", "123");
            PropertyTrade trade3 = createTrade("서초동", "456");

            when(properties.batchSize()).thenReturn(100);
            when(properties.requestDelayMs()).thenReturn(0L);
            when(propertyTradeRepository.findByGeocodeStatus(eq(GeocodeStatus.PENDING), any(Pageable.class)))
                    .thenReturn(List.of(trade1, trade2, trade3));
            mockRegionLookup();

            Coordinates gangnamCoords = Coordinates.of(new BigDecimal("37.517"), new BigDecimal("127.047"));
            Coordinates seochoCoords = Coordinates.of(new BigDecimal("37.483"), new BigDecimal("127.032"));

            when(geocodeClient.searchAddress(contains("역삼동"))).thenReturn(gangnamCoords);
            when(geocodeClient.searchAddress(contains("서초동"))).thenReturn(seochoCoords);
            when(propertyTradeRepository.saveAll(anyList())).thenReturn(List.of());

            // when
            int result = geocodeService.geocodePendingProperties();

            // then
            assertThat(result).isEqualTo(3);
            assertThat(trade1.getCoordinates()).isEqualTo(gangnamCoords);
            assertThat(trade2.getCoordinates()).isEqualTo(gangnamCoords);
            assertThat(trade3.getCoordinates()).isEqualTo(seochoCoords);
        }

        @Test
        @DisplayName("첫 번째만 성공하면 1을 반환하고 두 번째는 실패 처리한다")
        void geocode_partialFailure_returnsOne() {
            // given
            PropertyTrade trade1 = createTrade("역삼동", "123");
            PropertyTrade trade2 = createTrade("서초동", "456");

            when(properties.batchSize()).thenReturn(100);
            when(properties.requestDelayMs()).thenReturn(0L);
            when(propertyTradeRepository.findByGeocodeStatus(eq(GeocodeStatus.PENDING), any(Pageable.class)))
                    .thenReturn(List.of(trade1, trade2));
            mockRegionLookup();

            when(geocodeClient.searchAddress(contains("역삼동")))
                    .thenReturn(Coordinates.of(new BigDecimal("37.517"), new BigDecimal("127.047")));
            when(geocodeClient.searchAddress(contains("서초동"))).thenReturn(null);
            when(propertyTradeRepository.saveAll(anyList())).thenReturn(List.of());

            // when
            int result = geocodeService.geocodePendingProperties();

            // then
            assertThat(result).isEqualTo(1);
            assertThat(trade2.getGeocodeStatus()).isEqualTo(GeocodeStatus.FAILED);
        }

        @Test
        @DisplayName("모든 지오코딩이 실패하면 0을 반환한다")
        void geocode_allFail_returnsZero() {
            // given
            PropertyTrade trade1 = createTrade("역삼동", "123");

            when(properties.batchSize()).thenReturn(100);
            when(properties.requestDelayMs()).thenReturn(0L);
            when(propertyTradeRepository.findByGeocodeStatus(eq(GeocodeStatus.PENDING), any(Pageable.class)))
                    .thenReturn(List.of(trade1));
            mockRegionLookup();

            when(geocodeClient.searchAddress(anyString())).thenReturn(null);
            when(propertyTradeRepository.saveAll(anyList())).thenReturn(List.of());

            // when
            int result = geocodeService.geocodePendingProperties();

            // then
            assertThat(result).isEqualTo(0);
            assertThat(trade1.getGeocodeStatus()).isEqualTo(GeocodeStatus.FAILED);
        }

        @Test
        @DisplayName("동일 주소 5개 매물은 API를 1번만 호출한다")
        void geocode_duplicateAddresses_callsApiOnce() {
            // given
            List<PropertyTrade> trades = List.of(
                    createTrade("역삼동", "123"),
                    createTrade("역삼동", "123"),
                    createTrade("역삼동", "123"),
                    createTrade("역삼동", "123"),
                    createTrade("역삼동", "123")
            );

            when(properties.batchSize()).thenReturn(100);
            when(properties.requestDelayMs()).thenReturn(0L);
            when(propertyTradeRepository.findByGeocodeStatus(eq(GeocodeStatus.PENDING), any(Pageable.class)))
                    .thenReturn(trades);
            mockRegionLookup();

            Coordinates coords = Coordinates.of(new BigDecimal("37.517"), new BigDecimal("127.047"));
            when(geocodeClient.searchAddress(anyString())).thenReturn(coords);
            when(propertyTradeRepository.saveAll(anyList())).thenReturn(List.of());

            // when
            int result = geocodeService.geocodePendingProperties();

            // then
            assertThat(result).isEqualTo(5);
            verify(geocodeClient, times(1)).searchAddress(anyString());
        }
    }

    // ============================================================
    // buildAddress 테스트
    // ============================================================

    @Nested
    @DisplayName("buildAddress - 주소 문자열 조합")
    class BuildAddressTest {

        @Test
        @DisplayName("시군구, 동, 지번이 모두 있으면 전체 주소를 반환한다")
        void buildAddress_allPresent_returnsFullAddress() {
            assertThat(geocodeService.buildAddress("강남구", "역삼동", "123"))
                    .isEqualTo("강남구 역삼동 123");
        }

        @Test
        @DisplayName("지번이 비어 있으면 시군구 동까지만 반환한다")
        void buildAddress_emptyJibun_omitsJibun() {
            assertThat(geocodeService.buildAddress("강남구", "역삼동", ""))
                    .isEqualTo("강남구 역삼동");
        }

        @Test
        @DisplayName("모든 인자가 비어 있으면 빈 문자열을 반환한다")
        void buildAddress_allEmpty_returnsEmpty() {
            assertThat(geocodeService.buildAddress("", "", "")).isEmpty();
        }

        @Test
        @DisplayName("null 지번은 빈 문자열과 동일하게 처리한다")
        void buildAddress_nullJibun_treatsAsEmpty() {
            assertThat(geocodeService.buildAddress("강남구", "역삼동", null))
                    .isEqualTo("강남구 역삼동");
        }
    }
}
