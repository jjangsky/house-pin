package com.housepin.api.domain.property;

import com.housepin.api.domain.common.*;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "property_trade", uniqueConstraints = {
        @UniqueConstraint(
                name = "uq_property_trade",
                columnNames = {"region_code", "property_type", "trade_type", "name", "dong",
                        "area", "floor", "deal_date"}
        )
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PropertyTrade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "region_code", length = 5, nullable = false)
    private String regionCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "property_type", length = 20, nullable = false)
    private PropertyType propertyType;

    @Enumerated(EnumType.STRING)
    @Column(name = "trade_type", length = 20, nullable = false)
    private TradeType tradeType;

    @Column(name = "name", length = 100, nullable = false)
    private String name;

    @Column(name = "dong", length = 100)
    private String dong;

    @Column(name = "jibun", length = 20)
    private String jibun;

    @Embedded
    @AttributeOverride(name = "amount", column = @Column(name = "deal_amount", nullable = false))
    private Money dealAmount;

    @Column(name = "area", precision = 10, scale = 2)
    private BigDecimal area;

    @Column(name = "floor")
    private Short floor;

    @Column(name = "build_year")
    private Short buildYear;

    @Column(name = "deal_date", nullable = false)
    private LocalDate dealDate;

    @Column(name = "deal_year", nullable = false)
    private short dealYear;

    @Column(name = "deal_month", nullable = false)
    private short dealMonth;

    @Column(name = "is_canceled", nullable = false)
    private boolean isCanceled;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "lat", column = @Column(name = "lat", precision = 10, scale = 7)),
            @AttributeOverride(name = "lng", column = @Column(name = "lng", precision = 10, scale = 7))
    })
    private Coordinates coordinates;

    @Enumerated(EnumType.STRING)
    @Column(name = "geocode_status", length = 20, nullable = false)
    private GeocodeStatus geocodeStatus;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_data", columnDefinition = "jsonb")
    private String rawData;

    @Column(name = "collected_at", nullable = false)
    private LocalDateTime collectedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static PropertyTrade create(String regionCode, PropertyType propertyType,
                                       TradeType tradeType, String name, String dong,
                                       String jibun, int dealAmountManWon,
                                       BigDecimal area, Short floor, Short buildYear,
                                       LocalDate dealDate, String rawData) {
        PropertyTrade trade = new PropertyTrade();
        trade.regionCode = regionCode;
        trade.propertyType = propertyType;
        trade.tradeType = tradeType;
        trade.name = name;
        trade.dong = dong;
        trade.jibun = jibun;
        trade.dealAmount = Money.of(dealAmountManWon);
        trade.area = area;
        trade.floor = floor;
        trade.buildYear = buildYear;
        trade.dealDate = dealDate;
        trade.dealYear = (short) dealDate.getYear();
        trade.dealMonth = (short) dealDate.getMonthValue();
        trade.isCanceled = false;
        trade.geocodeStatus = GeocodeStatus.PENDING;
        trade.rawData = rawData;
        trade.collectedAt = LocalDateTime.now();
        return trade;
    }

    /**
     * 주어진 예산 이내인지 확인한다.
     */
    public boolean isAffordable(Money budget) {
        return this.dealAmount.isLessThanOrEqual(budget);
    }

    /**
     * 지오코딩 좌표를 업데이트한다.
     */
    public void updateGeocode(Coordinates coords) {
        this.coordinates = coords;
        this.geocodeStatus = GeocodeStatus.SUCCESS;
    }

    /**
     * 지오코딩 실패를 기록한다.
     */
    public void markGeocodeFailed() {
        this.geocodeStatus = GeocodeStatus.FAILED;
    }

    /**
     * 거래를 취소 처리한다.
     */
    public void cancel() {
        this.isCanceled = true;
    }

    /**
     * 전용면적을 평 단위로 변환한다.
     */
    public int getPyeong() {
        if (area == null) {
            return 0;
        }
        return (int) Math.round(area.doubleValue() / 3.305785);
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
