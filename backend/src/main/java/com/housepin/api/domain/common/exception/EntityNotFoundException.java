package com.housepin.api.domain.common.exception;

/**
 * 도메인 엔티티를 찾을 수 없을 때 발생하는 예외.
 */
public class EntityNotFoundException extends RuntimeException {

    public EntityNotFoundException(String entity, Object id) {
        super(entity + " not found: " + id);
    }
}
