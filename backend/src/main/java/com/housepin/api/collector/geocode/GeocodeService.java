package com.housepin.api.collector.geocode;

import com.housepin.api.domain.common.Coordinates;
import com.housepin.api.domain.common.GeocodeStatus;
import com.housepin.api.domain.common.RegionCode;
import com.housepin.api.domain.property.PropertyTrade;
import com.housepin.api.domain.property.PropertyTradeRepository;
import com.housepin.api.domain.region.Region;
import com.housepin.api.domain.region.RegionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * PENDING 상태의 매물 데이터에 좌표를 부여하는 지오코딩 서비스.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class GeocodeService {

    private final KakaoGeocodeClient geocodeClient;
    private final KakaoGeocodeProperties properties;
    private final PropertyTradeRepository propertyTradeRepository;
    private final RegionRepository regionRepository;

    /**
     * PENDING 상태의 매물 데이터에 좌표를 부여한다.
     *
     * <ol>
     *   <li>PENDING 상태 매물을 batchSize만큼 조회</li>
     *   <li>같은 주소(시군구+동+지번) 중복 제거</li>
     *   <li>유니크 주소에 대해 카카오 API 호출</li>
     *   <li>결과를 해당 매물에 일괄 적용</li>
     *   <li>실패 건은 geocode_status = FAILED로 업데이트</li>
     * </ol>
     *
     * @return 성공 건수
     */
    @Transactional
    public int geocodePendingProperties() {
        List<PropertyTrade> pending = propertyTradeRepository
                .findByGeocodeStatus(GeocodeStatus.PENDING, PageRequest.of(0, properties.batchSize()));

        if (pending.isEmpty()) {
            log.info("지오코딩 대상 없음");
            return 0;
        }

        log.info("지오코딩 시작: {}건 대상", pending.size());

        Map<String, List<PropertyTrade>> addressGroups = groupByAddress(pending);
        log.info("유니크 주소 {}건에 대해 지오코딩 수행", addressGroups.size());

        int successCount = 0;

        for (Map.Entry<String, List<PropertyTrade>> entry : addressGroups.entrySet()) {
            String address = entry.getKey();
            List<PropertyTrade> trades = entry.getValue();

            Coordinates coords = geocodeClient.searchAddress(address);

            if (coords != null) {
                trades.forEach(t -> t.updateGeocode(coords));
                successCount += trades.size();
            } else {
                trades.forEach(PropertyTrade::markGeocodeFailed);
                log.debug("지오코딩 실패: address={}, {}건", address, trades.size());
            }

            sleep(properties.requestDelayMs());
        }

        propertyTradeRepository.saveAll(pending);
        log.info("지오코딩 완료: {}/{} 건 성공", successCount, pending.size());
        return successCount;
    }

    /**
     * 주소 문자열을 생성한다.
     *
     * @param sigungu 시군구명 (예: "강남구")
     * @param dong    법정동 (예: "역삼동")
     * @param jibun   지번 (예: "123")
     * @return 조합된 주소 문자열 (예: "강남구 역삼동 123")
     */
    public String buildAddress(String sigungu, String dong, String jibun) {
        return Stream.of(sigungu, dong, jibun)
                .filter(part -> part != null && !part.isBlank())
                .collect(Collectors.joining(" "));
    }

    /**
     * 매물 목록을 주소 기준으로 그룹핑한다.
     * regionCode로 Region 테이블에서 시군구명을 조회하여 주소를 구성한다.
     */
    private Map<String, List<PropertyTrade>> groupByAddress(List<PropertyTrade> trades) {
        // regionCode별로 시군구명을 캐싱하여 중복 조회 방지
        Map<String, String> sigunguCache = new HashMap<>();

        Map<String, List<PropertyTrade>> groups = new LinkedHashMap<>();

        for (PropertyTrade trade : trades) {
            String sigungu = sigunguCache.computeIfAbsent(
                    trade.getRegionCode(),
                    code -> regionRepository.findByCode(RegionCode.of(code))
                            .map(Region::getSigungu)
                            .orElse("")
            );

            String address = buildAddress(sigungu, trade.getDong(), trade.getJibun());

            if (address.isBlank()) {
                log.warn("주소 생성 불가: tradeId={}, regionCode={}", trade.getId(), trade.getRegionCode());
                trade.markGeocodeFailed();
                continue;
            }

            groups.computeIfAbsent(address, k -> new ArrayList<>()).add(trade);
        }

        return groups;
    }

    private void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.debug("지오코딩 대기 중 인터럽트 발생");
        }
    }
}
