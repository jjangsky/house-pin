package com.housepin.api.domain.common;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PropertyType {

    APARTMENT("아파트"),
    VILLA("빌라"),
    OFFICETEL("오피스텔");

    private final String label;
}
