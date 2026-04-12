package com.housepin.api.domain.common;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;

/**
 * 법정동코드 앞 5자리 Value Object.
 * Region 엔티티의 @EmbeddedId로 사용된다.
 */
@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EqualsAndHashCode
public class RegionCode implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private static final java.util.regex.Pattern CODE_PATTERN =
            java.util.regex.Pattern.compile("^\\d{5}$");

    @Column(name = "code", length = 5, nullable = false)
    private String code;

    private RegionCode(String code) {
        this.code = code;
    }

    public static RegionCode of(String code) {
        if (code == null || !CODE_PATTERN.matcher(code).matches()) {
            throw new IllegalArgumentException("법정동코드는 5자리 숫자여야 합니다: " + code);
        }
        return new RegionCode(code);
    }

    /**
     * 시도 코드(앞 2자리)를 반환한다.
     */
    public String getSidoCode() {
        return code.substring(0, 2);
    }

    @Override
    public String toString() {
        return code;
    }
}
