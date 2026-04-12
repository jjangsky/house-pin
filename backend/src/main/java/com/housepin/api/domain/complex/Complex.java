package com.housepin.api.domain.complex;

import com.housepin.api.domain.common.Coordinates;
import com.housepin.api.domain.common.PropertyType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "complex", uniqueConstraints = {
        @UniqueConstraint(
                name = "uq_complex",
                columnNames = {"region_code", "name", "dong", "property_type"}
        )
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Complex {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "region_code", length = 5, nullable = false)
    private String regionCode;

    @Column(name = "name", length = 100, nullable = false)
    private String name;

    @Column(name = "dong", length = 100)
    private String dong;

    @Column(name = "jibun", length = 20)
    private String jibun;

    @Enumerated(EnumType.STRING)
    @Column(name = "property_type", length = 20, nullable = false)
    private PropertyType propertyType;

    @Column(name = "build_year")
    private Short buildYear;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "lat", column = @Column(name = "lat", precision = 10, scale = 7)),
            @AttributeOverride(name = "lng", column = @Column(name = "lng", precision = 10, scale = 7))
    })
    private Coordinates coordinates;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static Complex create(String regionCode, String name, String dong,
                                 String jibun, PropertyType propertyType,
                                 Short buildYear) {
        Complex complex = new Complex();
        complex.regionCode = regionCode;
        complex.name = name;
        complex.dong = dong;
        complex.jibun = jibun;
        complex.propertyType = propertyType;
        complex.buildYear = buildYear;
        return complex;
    }

    /**
     * 좌표를 업데이트한다.
     */
    public void updateCoordinates(Coordinates coords) {
        this.coordinates = coords;
    }

    /**
     * 좌표와 함께 단지 정보를 생성한다.
     */
    public static Complex createWithCoordinates(String regionCode, String name, String dong,
                                                String jibun, PropertyType propertyType,
                                                Short buildYear,
                                                BigDecimal lat, BigDecimal lng) {
        Complex complex = create(regionCode, name, dong, jibun, propertyType, buildYear);
        complex.coordinates = Coordinates.of(lat, lng);
        return complex;
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
