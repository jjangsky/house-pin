package com.housepin.api.collector.molit;

import com.housepin.api.domain.common.PropertyType;
import com.housepin.api.domain.common.TradeType;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MolitEndpoint {

    APT_TRADE(
            "/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade",
            PropertyType.APARTMENT,
            TradeType.TRADE
    ),
    APT_RENT(
            "/RTMSDataSvcAptRent/getRTMSDataSvcAptRent",
            PropertyType.APARTMENT,
            TradeType.RENT
    ),
    VILLA_TRADE(
            "/RTMSDataSvcRHTrade/getRTMSDataSvcRHTrade",
            PropertyType.VILLA,
            TradeType.TRADE
    ),
    OFFICETEL_TRADE(
            "/RTMSDataSvcOffiTrade/getRTMSDataSvcOffiTrade",
            PropertyType.OFFICETEL,
            TradeType.TRADE
    ),
    OFFICETEL_RENT(
            "/RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent",
            PropertyType.OFFICETEL,
            TradeType.RENT
    );

    private final String path;
    private final PropertyType propertyType;
    private final TradeType tradeType;
}
