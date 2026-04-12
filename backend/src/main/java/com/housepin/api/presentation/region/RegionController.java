package com.housepin.api.presentation.region;

import com.housepin.api.domain.region.RegionRepository;
import com.housepin.api.presentation.common.ApiResponse;
import com.housepin.api.presentation.region.dto.RegionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/regions")
@RequiredArgsConstructor
public class RegionController {

    private final RegionRepository regionRepository;

    @GetMapping
    public ApiResponse<List<RegionResponse>> getActiveRegions() {
        List<RegionResponse> regions = regionRepository.findByIsActiveTrue()
                .stream()
                .map(RegionResponse::from)
                .toList();
        return ApiResponse.ok(regions);
    }
}
