package com.housepin.api.collector.molit;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 국토부 실거래가 XML 응답 파서.
 * 영문 필드명(새 API)과 한글 필드명(구 API)을 모두 지원한다.
 */
@Component
@Slf4j
public class MolitXmlParser {

    private final XmlMapper xmlMapper;

    public MolitXmlParser() {
        this.xmlMapper = new XmlMapper();
        this.xmlMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    /**
     * XML 응답 문자열을 파싱하여 MolitTradeItem 목록으로 변환한다.
     *
     * @param xml                원본 XML 응답
     * @param fallbackRegionCode XML에 지역코드가 없을 때 사용할 기본값
     * @return 파싱된 거래 항목 목록 (해제 거래 제외)
     */
    public List<MolitTradeItem> parse(String xml, String fallbackRegionCode) {
        if (xml == null || xml.isBlank()) {
            return Collections.emptyList();
        }

        try {
            JsonNode root = xmlMapper.readTree(xml.getBytes());
            JsonNode body = root.path("body");
            JsonNode items = body.path("items").path("item");

            if (items.isMissingNode() || items.isNull()) {
                log.debug("응답에 item 노드가 없습니다.");
                return Collections.emptyList();
            }

            List<JsonNode> itemList;
            if (items.isArray()) {
                itemList = new ArrayList<>();
                items.forEach(itemList::add);
            } else {
                // 단일 item인 경우 배열로 감싸기
                itemList = List.of(items);
            }

            List<MolitTradeItem> result = new ArrayList<>();
            for (JsonNode node : itemList) {
                MolitTradeItem item = mapToTradeItem(node, fallbackRegionCode);
                if (!item.isCanceled()) {
                    result.add(item);
                }
            }

            log.debug("XML 파싱 완료: 전체 {}건, 유효 {}건", itemList.size(), result.size());
            return result;

        } catch (Exception e) {
            log.error("XML 파싱 실패: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    /**
     * 거래금액 문자열을 정수(만원)로 변환한다.
     * "    80,000" -> 80000
     */
    public static int parseDealAmount(String raw) {
        if (raw == null || raw.isBlank()) {
            return 0;
        }
        return Integer.parseInt(raw.replaceAll("[,\\s]", ""));
    }

    private MolitTradeItem mapToTradeItem(JsonNode node, String fallbackRegionCode) {
        String cancelDealType = textOrEmpty(node, "cdealType", "해제여부");
        boolean isCanceled = !cancelDealType.isBlank();

        String name = firstNonEmpty(node,
                "aptNm", "아파트",
                "mhouseNm", "연립다세대",
                "offiNm", "오피스텔"
        );

        return new MolitTradeItem(
                parseDealAmount(textOrEmpty(node, "dealAmount", "거래금액")),
                intOrZero(node, "buildYear", "건축년도"),
                intOrZero(node, "dealYear", "년"),
                intOrZero(node, "dealMonth", "월"),
                intOrZero(node, "dealDay", "일"),
                textOrEmpty(node, "umdNm", "법정동").trim(),
                name.trim(),
                decimalOrZero(node, "excluUseAr", "전용면적"),
                intOrZero(node, "floor", "층"),
                textOrEmpty(node, "jibun", "지번").trim(),
                regionCodeOrFallback(node, fallbackRegionCode),
                isCanceled,
                node.toString()
        );
    }

    /**
     * 영문 필드 -> 한글 필드 순서로 텍스트 값을 찾는다.
     */
    private String textOrEmpty(JsonNode node, String engField, String korField) {
        JsonNode value = node.get(engField);
        if (value != null && !value.isNull()) {
            return value.asText("");
        }
        value = node.get(korField);
        if (value != null && !value.isNull()) {
            return value.asText("");
        }
        return "";
    }

    /**
     * 영문 필드 -> 한글 필드 순서로 정수 값을 찾는다.
     */
    private int intOrZero(JsonNode node, String engField, String korField) {
        JsonNode value = node.get(engField);
        if (value != null && !value.isNull()) {
            return value.asInt(0);
        }
        value = node.get(korField);
        if (value != null && !value.isNull()) {
            return value.asInt(0);
        }
        return 0;
    }

    /**
     * 영문 필드 -> 한글 필드 순서로 BigDecimal 값을 찾는다.
     */
    private BigDecimal decimalOrZero(JsonNode node, String engField, String korField) {
        JsonNode value = node.get(engField);
        if (value != null && !value.isNull()) {
            return new BigDecimal(value.asText("0"));
        }
        value = node.get(korField);
        if (value != null && !value.isNull()) {
            return new BigDecimal(value.asText("0"));
        }
        return BigDecimal.ZERO;
    }

    /**
     * 여러 후보 필드명 중 비어있지 않은 첫 번째 값을 반환한다.
     * 필드명은 (영문, 한글) 쌍으로 전달한다.
     */
    private String firstNonEmpty(JsonNode node, String... fieldPairs) {
        for (int i = 0; i < fieldPairs.length - 1; i += 2) {
            String eng = fieldPairs[i];
            String kor = fieldPairs[i + 1];
            String value = textOrEmpty(node, eng, kor);
            if (!value.isBlank()) {
                return value;
            }
        }
        return "";
    }

    private String regionCodeOrFallback(JsonNode node, String fallbackRegionCode) {
        String code = textOrEmpty(node, "sggCd", "지역코드").trim();
        return code.isBlank() ? fallbackRegionCode : code;
    }
}
