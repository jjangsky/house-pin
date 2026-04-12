package com.housepin.api.domain.region;

import com.housepin.api.domain.common.RegionCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RegionRepository extends JpaRepository<Region, RegionCode> {

    List<Region> findByIsActiveTrue();

    Optional<Region> findByCode(RegionCode code);
}
