package com.housepin.api.domain.region;

import com.housepin.api.domain.common.Coordinates;
import com.housepin.api.domain.common.RegionCode;
import com.housepin.api.domain.common.RegionType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "region")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Region {

    @EmbeddedId
    private RegionCode code;

    @Column(name = "sido_code", length = 2, nullable = false)
    private String sidoCode;

    @Column(name = "sido", length = 20, nullable = false)
    private String sido;

    @Column(name = "sigungu", length = 20, nullable = false)
    private String sigungu;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "lat", column = @Column(name = "center_lat", precision = 10, scale = 7)),
            @AttributeOverride(name = "lng", column = @Column(name = "center_lng", precision = 10, scale = 7))
    })
    private Coordinates center;

    @Enumerated(EnumType.STRING)
    @Column(name = "region_type", length = 20, nullable = false)
    private RegionType regionType;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static Region create(String code, String sido, String sigungu,
                                BigDecimal centerLat, BigDecimal centerLng,
                                RegionType regionType) {
        Region region = new Region();
        RegionCode regionCode = RegionCode.of(code);
        region.code = regionCode;
        region.sidoCode = regionCode.getSidoCode();
        region.sido = sido;
        region.sigungu = sigungu;
        region.center = Coordinates.of(centerLat, centerLng);
        region.regionType = regionType;
        region.isActive = true;
        return region;
    }

    /**
     * 규제 지역(투기과열 또는 조정대상)인지 확인한다.
     */
    public boolean isRegulated() {
        return regionType == RegionType.SPECULATIVE || regionType == RegionType.REGULATED;
    }

    public void deactivate() {
        this.isActive = false;
    }

    public void activate() {
        this.isActive = true;
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
