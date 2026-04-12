package com.housepin.api.domain.common.exception;

/**
 * 외부 데이터 수집 실패 시 발생하는 예외.
 */
public class CollectionFailedException extends RuntimeException {

    public CollectionFailedException(String regionCode, String reason) {
        super("Data collection failed for region " + regionCode + ": " + reason);
    }
}
