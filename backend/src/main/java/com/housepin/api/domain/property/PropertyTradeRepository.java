package com.housepin.api.domain.property;

import com.housepin.api.domain.common.GeocodeStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PropertyTradeRepository extends JpaRepository<PropertyTrade, Long> {

    List<PropertyTrade> findByGeocodeStatus(GeocodeStatus status, Pageable pageable);
}
