package com.housepin.api.domain.collection;

import com.housepin.api.domain.common.CollectionStatus;
import com.housepin.api.domain.common.PropertyType;
import com.housepin.api.domain.common.TradeType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "collection_log")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CollectionLog {

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

    @Column(name = "deal_ym", length = 6, nullable = false)
    private String dealYm;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private CollectionStatus status;

    @Column(name = "total_count", nullable = false)
    private int totalCount;

    @Column(name = "new_count", nullable = false)
    private int newCount;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    /**
     * 수집 시작 로그를 생성한다.
     */
    public static CollectionLog start(String regionCode, PropertyType propertyType,
                                      TradeType tradeType, String dealYm) {
        CollectionLog log = new CollectionLog();
        log.regionCode = regionCode;
        log.propertyType = propertyType;
        log.tradeType = tradeType;
        log.dealYm = dealYm;
        log.status = CollectionStatus.PARTIAL;
        log.totalCount = 0;
        log.newCount = 0;
        log.startedAt = LocalDateTime.now();
        return log;
    }

    /**
     * 수집 완료를 기록한다.
     */
    public void complete(int totalCount, int newCount) {
        this.status = CollectionStatus.SUCCESS;
        this.totalCount = totalCount;
        this.newCount = newCount;
        this.finishedAt = LocalDateTime.now();
    }

    /**
     * 수집 실패를 기록한다.
     */
    public void fail(String errorMessage) {
        this.status = CollectionStatus.FAILED;
        this.errorMessage = errorMessage;
        this.finishedAt = LocalDateTime.now();
    }
}
