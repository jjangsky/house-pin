package com.housepin.api.domain.common;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RegionType {

    SPECULATIVE("투기과열"),
    REGULATED("조정대상"),
    NON_REGULATED("비규제");

    private final String label;
}
