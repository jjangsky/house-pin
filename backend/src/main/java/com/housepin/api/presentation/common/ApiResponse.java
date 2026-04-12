package com.housepin.api.presentation.common;

import java.util.Map;

/**
 * 공통 API 응답 래퍼.
 *
 * @param success 성공 여부
 * @param data    응답 데이터
 * @param message 에러 메시지 (성공 시 null)
 * @param meta    페이징 등 부가 정보
 */
public record ApiResponse<T>(
        boolean success,
        T data,
        String message,
        Map<String, Object> meta
) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null, null);
    }

    public static <T> ApiResponse<T> ok(T data, Map<String, Object> meta) {
        return new ApiResponse<>(true, data, null, meta);
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, null, message, null);
    }

    public static <T> ApiResponse<T> error(String message, Map<String, Object> meta) {
        return new ApiResponse<>(false, null, message, meta);
    }
}
