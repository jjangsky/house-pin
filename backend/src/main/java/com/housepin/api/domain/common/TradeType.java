package com.housepin.api.domain.common;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum TradeType {

    TRADE("매매"),
    RENT("전월세");

    private final String label;
}
