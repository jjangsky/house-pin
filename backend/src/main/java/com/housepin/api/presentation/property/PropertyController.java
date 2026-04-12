package com.housepin.api.presentation.property;

import com.housepin.api.domain.common.PropertyType;
import com.housepin.api.presentation.common.ApiResponse;
import com.housepin.api.presentation.property.dto.PropertyResponse;
import com.housepin.api.presentation.property.dto.PropertySearchRequest;
import com.housepin.api.presentation.property.dto.PropertyStatsResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/properties")
@RequiredArgsConstructor
public class PropertyController {

    @GetMapping
    public ApiResponse<Page<PropertyResponse>> search(@Valid PropertySearchRequest request) {
        // TODO: Phase 2-6 - PropertyService 연동
        return ApiResponse.ok(Page.empty());
    }

    @GetMapping("/stats")
    public ApiResponse<PropertyStatsResponse> stats(
            @RequestParam String regionCode,
            @RequestParam(required = false) PropertyType propertyType) {
        // TODO: Phase 2-7 - PropertyStatsService 연동
        return ApiResponse.ok(null);
    }
}
