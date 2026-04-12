package com.housepin.api.collector.molit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class MolitXmlParserTest {

    private MolitXmlParser parser;

    @BeforeEach
    void setUp() {
        parser = new MolitXmlParser();
    }

    // ============================================================
    // parseDealAmount 단위 테스트
    // ============================================================

    @Nested
    @DisplayName("parseDealAmount - 거래금액 문자열을 만원 정수로 변환")
    class ParseDealAmountTest {

        @Test
        @DisplayName("공백과 콤마가 포함된 금액 문자열을 정수로 변환한다")
        void parseDealAmount_whitespaceAndComma_parsesCorrectly() {
            // Given
            String raw = "    80,000";

            // When
            int result = MolitXmlParser.parseDealAmount(raw);

            // Then
            assertThat(result).isEqualTo(80000);
        }

        @Test
        @DisplayName("콤마만 포함된 금액 문자열을 정수로 변환한다")
        void parseDealAmount_commaOnly_parsesCorrectly() {
            // Given
            String raw = "12,500";

            // When
            int result = MolitXmlParser.parseDealAmount(raw);

            // Then
            assertThat(result).isEqualTo(12500);
        }

        @Test
        @DisplayName("포맷 없는 깨끗한 숫자를 그대로 변환한다")
        void parseDealAmount_cleanNumber_parsesCorrectly() {
            // Given
            String raw = "5000";

            // When
            int result = MolitXmlParser.parseDealAmount(raw);

            // Then
            assertThat(result).isEqualTo(5000);
        }

        @Test
        @DisplayName("빈 문자열은 0을 반환한다")
        void parseDealAmount_emptyString_returnsZero() {
            // Given
            String raw = "";

            // When
            int result = MolitXmlParser.parseDealAmount(raw);

            // Then
            assertThat(result).isEqualTo(0);
        }

        @Test
        @DisplayName("null은 0을 반환한다")
        void parseDealAmount_null_returnsZero() {
            // When
            int result = MolitXmlParser.parseDealAmount(null);

            // Then
            assertThat(result).isEqualTo(0);
        }

        @Test
        @DisplayName("공백만 있는 문자열은 0을 반환한다")
        void parseDealAmount_whitespaceOnly_returnsZero() {
            // Given
            String raw = "    ";

            // When
            int result = MolitXmlParser.parseDealAmount(raw);

            // Then
            assertThat(result).isEqualTo(0);
        }
    }

    // ============================================================
    // parse - XML 응답 파싱 테스트
    // ============================================================

    @Nested
    @DisplayName("parse - XML 응답을 MolitTradeItem 리스트로 변환")
    class ParseXmlTest {

        @Test
        @DisplayName("아파트 매매 정상 응답 - 복수 항목을 올바르게 파싱한다")
        void parse_normalAptTradeResponse_parsesMultipleItems() {
            // Given
            String xml = """
                    <?xml version="1.0" encoding="UTF-8"?>
                    <response>
                      <header><resultCode>00</resultCode><resultMsg>NORMAL SERVICE</resultMsg></header>
                      <body>
                        <items>
                          <item>
                            <dealAmount>    80,000</dealAmount>
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
                            <cdealType></cdealType>
                            <dealingGbn>중개거래</dealingGbn>
                          </item>
                          <item>
                            <dealAmount>    42,000</dealAmount>
                            <buildYear>2008</buildYear>
                            <dealYear>2024</dealYear>
                            <dealMonth>3</dealMonth>
                            <dealDay>20</dealDay>
                            <umdNm>서초동</umdNm>
                            <aptNm>반포자이</aptNm>
                            <excluUseAr>59.96</excluUseAr>
                            <floor>5</floor>
                            <jibun>456</jibun>
                            <sggCd>11650</sggCd>
                            <cdealType></cdealType>
                            <dealingGbn>직거래</dealingGbn>
                          </item>
                        </items>
                        <numOfRows>1000</numOfRows>
                        <pageNo>1</pageNo>
                        <totalCount>2</totalCount>
                      </body>
                    </response>
                    """;

            // When
            List<MolitTradeItem> items = parser.parse(xml, "11680");

            // Then
            assertThat(items).hasSize(2);

            MolitTradeItem first = items.get(0);
            assertThat(first.dealAmount()).isEqualTo(80000);
            assertThat(first.name()).isEqualTo("래미안");
            assertThat(first.area()).isEqualByComparingTo(new BigDecimal("84.97"));
            assertThat(first.dong()).isEqualTo("역삼동");
            assertThat(first.buildYear()).isEqualTo(2015);
            assertThat(first.dealYear()).isEqualTo(2024);
            assertThat(first.dealMonth()).isEqualTo(3);
            assertThat(first.dealDay()).isEqualTo(15);
            assertThat(first.floor()).isEqualTo(12);
            assertThat(first.jibun()).isEqualTo("123");
            assertThat(first.regionCode()).isEqualTo("11680");
            assertThat(first.isCanceled()).isFalse();

            MolitTradeItem second = items.get(1);
            assertThat(second.dealAmount()).isEqualTo(42000);
            assertThat(second.name()).isEqualTo("반포자이");
            assertThat(second.area()).isEqualByComparingTo(new BigDecimal("59.96"));
            assertThat(second.dong()).isEqualTo("서초동");
            assertThat(second.floor()).isEqualTo(5);
            assertThat(second.regionCode()).isEqualTo("11650");
        }

        @Test
        @DisplayName("단일 항목 응답 - 배열이 아닌 단일 item도 정상 파싱한다")
        void parse_singleItemResponse_parsesSingleItem() {
            // Given
            String xml = """
                    <response>
                      <header><resultCode>00</resultCode></header>
                      <body>
                        <items>
                          <item>
                            <dealAmount>30,000</dealAmount>
                            <buildYear>2020</buildYear>
                            <dealYear>2024</dealYear>
                            <dealMonth>1</dealMonth>
                            <dealDay>5</dealDay>
                            <umdNm>삼성동</umdNm>
                            <aptNm>아이파크</aptNm>
                            <excluUseAr>45.12</excluUseAr>
                            <floor>3</floor>
                            <jibun>789</jibun>
                            <sggCd>11680</sggCd>
                          </item>
                        </items>
                      </body>
                    </response>
                    """;

            // When
            List<MolitTradeItem> items = parser.parse(xml, "11680");

            // Then
            assertThat(items).hasSize(1);

            MolitTradeItem item = items.get(0);
            assertThat(item.dealAmount()).isEqualTo(30000);
            assertThat(item.name()).isEqualTo("아이파크");
            assertThat(item.area()).isEqualByComparingTo(new BigDecimal("45.12"));
            assertThat(item.dong()).isEqualTo("삼성동");
            assertThat(item.buildYear()).isEqualTo(2020);
            assertThat(item.dealYear()).isEqualTo(2024);
            assertThat(item.dealMonth()).isEqualTo(1);
            assertThat(item.dealDay()).isEqualTo(5);
            assertThat(item.floor()).isEqualTo(3);
        }

        @Test
        @DisplayName("한글 필드명(구 API) 응답을 영문 필드 폴백으로 파싱한다")
        void parse_koreanFieldNames_parsesWithFallback() {
            // Given
            String xml = """
                    <response>
                      <header><resultCode>00</resultCode></header>
                      <body>
                        <items>
                          <item>
                            <거래금액>    55,000</거래금액>
                            <건축년도>2010</건축년도>
                            <년>2024</년>
                            <월>2</월>
                            <일>10</일>
                            <법정동>대치동</법정동>
                            <아파트>은마아파트</아파트>
                            <전용면적>76.79</전용면적>
                            <층>8</층>
                            <지번>123-4</지번>
                            <지역코드>11680</지역코드>
                          </item>
                        </items>
                      </body>
                    </response>
                    """;

            // When
            List<MolitTradeItem> items = parser.parse(xml, "11680");

            // Then
            assertThat(items).hasSize(1);

            MolitTradeItem item = items.get(0);
            assertThat(item.dealAmount()).isEqualTo(55000);
            assertThat(item.name()).isEqualTo("은마아파트");
            assertThat(item.area()).isEqualByComparingTo(new BigDecimal("76.79"));
            assertThat(item.dong()).isEqualTo("대치동");
            assertThat(item.buildYear()).isEqualTo(2010);
            assertThat(item.dealYear()).isEqualTo(2024);
            assertThat(item.dealMonth()).isEqualTo(2);
            assertThat(item.dealDay()).isEqualTo(10);
            assertThat(item.floor()).isEqualTo(8);
            assertThat(item.jibun()).isEqualTo("123-4");
            assertThat(item.regionCode()).isEqualTo("11680");
        }

        @Test
        @DisplayName("해제 거래(cdealType 비어있지 않음)는 결과에서 제외한다")
        void parse_canceledDeal_filteredOut() {
            // Given
            String xml = """
                    <response>
                      <header><resultCode>00</resultCode></header>
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
                            <cdealType>O</cdealType>
                          </item>
                          <item>
                            <dealAmount>42,000</dealAmount>
                            <buildYear>2008</buildYear>
                            <dealYear>2024</dealYear>
                            <dealMonth>3</dealMonth>
                            <dealDay>20</dealDay>
                            <umdNm>서초동</umdNm>
                            <aptNm>반포자이</aptNm>
                            <excluUseAr>59.96</excluUseAr>
                            <floor>5</floor>
                            <jibun>456</jibun>
                            <sggCd>11650</sggCd>
                            <cdealType></cdealType>
                          </item>
                        </items>
                      </body>
                    </response>
                    """;

            // When
            List<MolitTradeItem> items = parser.parse(xml, "11680");

            // Then - 해제 거래(래미안)는 제외되고 반포자이만 남아야 한다
            assertThat(items).hasSize(1);
            assertThat(items.get(0).name()).isEqualTo("반포자이");
            assertThat(items.get(0).isCanceled()).isFalse();
        }

        @Test
        @DisplayName("빈 items 응답은 빈 리스트를 반환한다")
        void parse_emptyItems_returnsEmptyList() {
            // Given
            String xml = """
                    <response>
                      <header><resultCode>00</resultCode></header>
                      <body>
                        <items/>
                        <totalCount>0</totalCount>
                      </body>
                    </response>
                    """;

            // When
            List<MolitTradeItem> items = parser.parse(xml, "11680");

            // Then
            assertThat(items).isEmpty();
        }

        @Test
        @DisplayName("오류 응답(resultCode != 00)은 빈 리스트를 반환한다")
        void parse_errorResponse_returnsEmptyList() {
            // Given
            String xml = """
                    <response>
                      <header><resultCode>99</resultCode><resultMsg>SERVICE ERROR</resultMsg></header>
                    </response>
                    """;

            // When
            List<MolitTradeItem> items = parser.parse(xml, "11680");

            // Then
            assertThat(items).isEmpty();
        }

        @Test
        @DisplayName("빌라 응답 - mhouseNm 필드에서 이름을 추출한다")
        void parse_villaResponse_usesMultiHouseNameField() {
            // Given
            String xml = """
                    <response>
                      <header><resultCode>00</resultCode></header>
                      <body>
                        <items>
                          <item>
                            <dealAmount>15,000</dealAmount>
                            <buildYear>2005</buildYear>
                            <dealYear>2024</dealYear>
                            <dealMonth>4</dealMonth>
                            <dealDay>10</dealDay>
                            <umdNm>신림동</umdNm>
                            <mhouseNm>행복빌라</mhouseNm>
                            <excluUseAr>38.50</excluUseAr>
                            <floor>2</floor>
                            <jibun>55-3</jibun>
                            <sggCd>11620</sggCd>
                            <cdealType></cdealType>
                          </item>
                        </items>
                      </body>
                    </response>
                    """;

            // When
            List<MolitTradeItem> items = parser.parse(xml, "11620");

            // Then
            assertThat(items).hasSize(1);
            assertThat(items.get(0).name()).isEqualTo("행복빌라");
            assertThat(items.get(0).area()).isEqualByComparingTo(new BigDecimal("38.50"));
        }

        @Test
        @DisplayName("오피스텔 응답 - offiNm 필드에서 이름을 추출한다")
        void parse_officetelResponse_usesOfficetelNameField() {
            // Given
            String xml = """
                    <response>
                      <header><resultCode>00</resultCode></header>
                      <body>
                        <items>
                          <item>
                            <dealAmount>25,000</dealAmount>
                            <buildYear>2018</buildYear>
                            <dealYear>2024</dealYear>
                            <dealMonth>5</dealMonth>
                            <dealDay>1</dealDay>
                            <umdNm>구로동</umdNm>
                            <offiNm>디큐브시티</offiNm>
                            <excluUseAr>28.76</excluUseAr>
                            <floor>7</floor>
                            <jibun>102</jibun>
                            <sggCd>11530</sggCd>
                            <cdealType></cdealType>
                          </item>
                        </items>
                      </body>
                    </response>
                    """;

            // When
            List<MolitTradeItem> items = parser.parse(xml, "11530");

            // Then
            assertThat(items).hasSize(1);
            assertThat(items.get(0).name()).isEqualTo("디큐브시티");
            assertThat(items.get(0).area()).isEqualByComparingTo(new BigDecimal("28.76"));
        }

        @Test
        @DisplayName("null XML 입력은 빈 리스트를 반환한다")
        void parse_nullXml_returnsEmptyList() {
            // When
            List<MolitTradeItem> items = parser.parse(null, "11680");

            // Then
            assertThat(items).isEmpty();
        }

        @Test
        @DisplayName("빈 문자열 XML 입력은 빈 리스트를 반환한다")
        void parse_emptyXml_returnsEmptyList() {
            // When
            List<MolitTradeItem> items = parser.parse("", "11680");

            // Then
            assertThat(items).isEmpty();
        }

        @Test
        @DisplayName("잘못된 XML 형식은 빈 리스트를 반환한다")
        void parse_malformedXml_returnsEmptyList() {
            // Given
            String xml = "<response><broken><<invalid";

            // When
            List<MolitTradeItem> items = parser.parse(xml, "11680");

            // Then
            assertThat(items).isEmpty();
        }

        @Test
        @DisplayName("XML에 지역코드가 없으면 fallbackRegionCode를 사용한다")
        void parse_missingRegionCode_usesFallback() {
            // Given
            String xml = """
                    <response>
                      <header><resultCode>00</resultCode></header>
                      <body>
                        <items>
                          <item>
                            <dealAmount>30,000</dealAmount>
                            <buildYear>2020</buildYear>
                            <dealYear>2024</dealYear>
                            <dealMonth>6</dealMonth>
                            <dealDay>1</dealDay>
                            <umdNm>강남동</umdNm>
                            <aptNm>테스트아파트</aptNm>
                            <excluUseAr>60.00</excluUseAr>
                            <floor>5</floor>
                            <jibun>100</jibun>
                          </item>
                        </items>
                      </body>
                    </response>
                    """;

            // When
            List<MolitTradeItem> items = parser.parse(xml, "99999");

            // Then
            assertThat(items).hasSize(1);
            assertThat(items.get(0).regionCode()).isEqualTo("99999");
        }

        @Test
        @DisplayName("모든 거래가 해제된 경우 빈 리스트를 반환한다")
        void parse_allCanceled_returnsEmptyList() {
            // Given
            String xml = """
                    <response>
                      <header><resultCode>00</resultCode></header>
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
                            <cdealType>O</cdealType>
                          </item>
                        </items>
                      </body>
                    </response>
                    """;

            // When
            List<MolitTradeItem> items = parser.parse(xml, "11680");

            // Then
            assertThat(items).isEmpty();
        }
    }
}
