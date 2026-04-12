package com.housepin.api.infrastructure.persistence;

import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

/**
 * PropertyTrade CQRS 읽기 전용 QueryDSL 저장소.
 * Phase 2-6에서 검색/필터링/통계 쿼리를 구현한다.
 */
@Repository
@RequiredArgsConstructor
public class PropertyTradeQueryRepository {

    private final JPAQueryFactory queryFactory;
}
