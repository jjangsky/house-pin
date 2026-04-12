package com.housepin.api.domain.common;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 위경도 Value Object.
 */
@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EqualsAndHashCode
public class Coordinates {

    @Column(precision = 10, scale = 7)
    private BigDecimal lat;

    @Column(precision = 10, scale = 7)
    private BigDecimal lng;

    private Coordinates(BigDecimal lat, BigDecimal lng) {
        this.lat = lat;
        this.lng = lng;
    }

    public static Coordinates of(BigDecimal lat, BigDecimal lng) {
        if (lat == null || lng == null) {
            throw new IllegalArgumentException("위도와 경도는 null일 수 없습니다.");
        }
        return new Coordinates(lat, lng);
    }

    /**
     * 좌표가 비어 있는지 확인한다.
     */
    public boolean isEmpty() {
        return lat == null || lng == null;
    }

    @Override
    public String toString() {
        return "(" + lat + ", " + lng + ")";
    }
}
