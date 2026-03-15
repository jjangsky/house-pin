"use client";

import { useEffect, useRef, useState } from "react";
import { formatToKoreanWon, sqmToPyeong } from "@/lib/utils/format";
import type { Property } from "@/types";

type PropertyTypeFilter = "all" | "apartment" | "villa" | "officetel";

const TYPE_CONFIG: Record<
  string,
  { label: string; color: string; className: string }
> = {
  apartment: {
    label: "아파트",
    color: "#3182F6",
    className: "bg-accent-light text-accent",
  },
  villa: {
    label: "빌라",
    color: "#FF9500",
    className: "bg-warning-light text-warning",
  },
  officetel: {
    label: "오피스텔",
    color: "#7B61FF",
    className: "bg-[#F3EEFF] text-[#7B61FF]",
  },
};

const REGION_CENTER_COORDS: Record<string, { lat: number; lng: number }> = {
  // 서울특별시
  "11110": { lat: 37.5735, lng: 126.9790 },
  "11140": { lat: 37.5641, lng: 126.9979 },
  "11170": { lat: 37.5326, lng: 126.9910 },
  "11200": { lat: 37.5634, lng: 127.0369 },
  "11215": { lat: 37.5385, lng: 127.0824 },
  "11230": { lat: 37.5744, lng: 127.0396 },
  "11260": { lat: 37.6066, lng: 127.0928 },
  "11290": { lat: 37.5894, lng: 127.0167 },
  "11305": { lat: 37.6398, lng: 127.0255 },
  "11320": { lat: 37.6688, lng: 127.0472 },
  "11350": { lat: 37.6542, lng: 127.0568 },
  "11380": { lat: 37.6027, lng: 126.9291 },
  "11410": { lat: 37.5791, lng: 126.9368 },
  "11440": { lat: 37.5663, lng: 126.9014 },
  "11470": { lat: 37.5170, lng: 126.8667 },
  "11500": { lat: 37.5509, lng: 126.8495 },
  "11530": { lat: 37.4955, lng: 126.8878 },
  "11545": { lat: 37.4569, lng: 126.8955 },
  "11560": { lat: 37.5264, lng: 126.8963 },
  "11590": { lat: 37.5124, lng: 126.9394 },
  "11620": { lat: 37.4784, lng: 126.9516 },
  "11650": { lat: 37.4837, lng: 127.0324 },
  "11680": { lat: 37.5172, lng: 127.0473 },
  "11710": { lat: 37.5145, lng: 127.1059 },
  "11740": { lat: 37.5301, lng: 127.1238 },
  // 경기도 주요 지역
  "41111": { lat: 37.2994, lng: 127.0085 },
  "41113": { lat: 37.2573, lng: 126.9716 },
  "41115": { lat: 37.2851, lng: 127.0195 },
  "41117": { lat: 37.2596, lng: 127.0464 },
  "41131": { lat: 37.4500, lng: 127.1457 },
  "41133": { lat: 37.4318, lng: 127.1384 },
  "41135": { lat: 37.3825, lng: 127.1199 },
  "41150": { lat: 37.7381, lng: 127.0337 },
  "41171": { lat: 37.3866, lng: 126.9200 },
  "41173": { lat: 37.3943, lng: 126.9514 },
  "41190": { lat: 37.5034, lng: 126.7660 },
  "41210": { lat: 37.4787, lng: 126.8643 },
  "41220": { lat: 36.9922, lng: 127.1130 },
  "41271": { lat: 37.3000, lng: 126.8469 },
  "41273": { lat: 37.3185, lng: 126.7944 },
  "41281": { lat: 37.6373, lng: 126.8322 },
  "41285": { lat: 37.6586, lng: 126.7743 },
  "41287": { lat: 37.6794, lng: 126.7509 },
  "41290": { lat: 37.4292, lng: 126.9876 },
  "41310": { lat: 37.5943, lng: 127.1295 },
  "41360": { lat: 37.6360, lng: 127.2165 },
  "41390": { lat: 37.3800, lng: 126.8028 },
  "41410": { lat: 37.3617, lng: 126.9352 },
  "41430": { lat: 37.3445, lng: 126.9686 },
  "41450": { lat: 37.5393, lng: 127.2141 },
  "41461": { lat: 37.2341, lng: 127.2009 },
  "41463": { lat: 37.2800, lng: 127.1150 },
  "41465": { lat: 37.3222, lng: 127.0988 },
  "41480": { lat: 37.7600, lng: 126.7800 },
  "41570": { lat: 37.6152, lng: 126.7157 },
  "41590": { lat: 37.2000, lng: 126.8311 },
  "41610": { lat: 37.4095, lng: 127.2573 },
  // 인천광역시
  "28110": { lat: 37.4737, lng: 126.6216 },
  "28140": { lat: 37.4736, lng: 126.6432 },
  "28177": { lat: 37.4464, lng: 126.6503 },
  "28185": { lat: 37.4101, lng: 126.6783 },
  "28200": { lat: 37.4488, lng: 126.7316 },
  "28237": { lat: 37.5075, lng: 126.7219 },
  "28245": { lat: 37.5376, lng: 126.7377 },
  "28260": { lat: 37.5449, lng: 126.6760 },
  // 부산광역시
  "26110": { lat: 35.1064, lng: 129.0326 },
  "26230": { lat: 35.1629, lng: 129.0533 },
  "26260": { lat: 35.1959, lng: 129.0845 },
  "26290": { lat: 35.1368, lng: 129.0849 },
  "26350": { lat: 35.1631, lng: 129.1636 },
  "26380": { lat: 35.1046, lng: 128.9747 },
  "26410": { lat: 35.2432, lng: 129.0914 },
  "26500": { lat: 35.1456, lng: 129.1131 },
  "26530": { lat: 35.1525, lng: 128.9913 },
  // 대구광역시
  "27110": { lat: 35.8690, lng: 128.6063 },
  "27140": { lat: 35.8863, lng: 128.6359 },
  "27230": { lat: 35.8857, lng: 128.5829 },
  "27260": { lat: 35.8583, lng: 128.6321 },
  "27290": { lat: 35.8500, lng: 128.5327 },
  // 대전광역시
  "30110": { lat: 36.3120, lng: 127.4550 },
  "30140": { lat: 36.3255, lng: 127.4210 },
  "30170": { lat: 36.3553, lng: 127.3836 },
  "30200": { lat: 36.3622, lng: 127.3561 },
  "30230": { lat: 36.3466, lng: 127.4155 },
  // 광주광역시
  "29110": { lat: 35.1460, lng: 126.9231 },
  "29140": { lat: 35.1518, lng: 126.8895 },
  "29155": { lat: 35.1328, lng: 126.9025 },
  "29170": { lat: 35.1746, lng: 126.9120 },
  "29200": { lat: 35.1395, lng: 126.7937 },
  // 세종특별자치시
  "36110": { lat: 36.4801, lng: 127.2590 },
  // 제주특별자치도
  "50110": { lat: 33.4996, lng: 126.5312 },
  "50130": { lat: 33.2541, lng: 126.5600 },
};

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

interface PropertyMapProps {
  properties: Property[];
  affordablePrice: number;
}

function getPropertyCoords(property: Property): { lat: number; lng: number } {
  if (property.lat && property.lng) {
    return { lat: property.lat, lng: property.lng };
  }
  return REGION_CENTER_COORDS[property.regionCode] ?? DEFAULT_CENTER;
}

function createMarkerImage(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40"><path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="${color}"/><circle cx="14" cy="14" r="6" fill="white"/></svg>`;
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml,${encoded}`;
}

export default function PropertyMap({ properties, affordablePrice }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [hasKakaoKey, setHasKakaoKey] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [typeFilter, setTypeFilter] = useState<PropertyTypeFilter>("all");

  const filteredProperties =
    typeFilter === "all"
      ? properties
      : properties.filter((p) => p.propertyType === typeFilter);

  // Count by type
  const typeCounts = {
    all: properties.length,
    apartment: properties.filter((p) => p.propertyType === "apartment").length,
    villa: properties.filter((p) => p.propertyType === "villa").length,
    officetel: properties.filter((p) => p.propertyType === "officetel").length,
  };

  useEffect(() => {
    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
    if (!kakaoKey) {
      setHasKakaoKey(false);
      return;
    }
    setHasKakaoKey(true);

    if (window.kakao?.maps) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao?.maps.load(() => {
        setIsLoaded(true);
      });
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    const kakao = window.kakao;
    if (!isLoaded || !mapRef.current || !kakao) return;
    if (filteredProperties.length === 0) return;

    const maps = kakao.maps;
    const firstCoords = getPropertyCoords(filteredProperties[0]);
    const center = new maps.LatLng(firstCoords.lat, firstCoords.lng);
    const map = new maps.Map(mapRef.current, { center, level: 6 });

    let openInfoWindow: KakaoInfoWindow | null = null;

    filteredProperties.forEach((property) => {
      const coords = getPropertyCoords(property);
      const position = new maps.LatLng(coords.lat, coords.lng);
      const config = TYPE_CONFIG[property.propertyType];
      const markerImageSrc = createMarkerImage(config?.color ?? "#8B95A1");
      const imageSize = new maps.Size(28, 40);
      const markerImage = new maps.MarkerImage(markerImageSrc, imageSize);

      const marker = new maps.Marker({ map, position, image: markerImage });

      const pyeong = sqmToPyeong(property.area);
      const diff = affordablePrice - property.dealAmount;
      const diffLabel = diff >= 0 ? "여유" : "부족";
      const diffColor = diff >= 0 ? "#00C471" : "#FF4545";
      const typeLabel = config?.label ?? "";
      const typeColor = config?.color ?? "#8B95A1";

      const content = `
        <div style="padding:12px 14px;font-size:13px;line-height:1.5;min-width:180px;font-family:Pretendard,sans-serif;">
          <div style="display:flex;align-items:center;gap:6px;margin:0 0 4px;">
            <span style="font-weight:700;font-size:14px;">${property.name}</span>
            <span style="font-size:11px;font-weight:600;color:${typeColor};background:${typeColor}15;padding:1px 6px;border-radius:4px;">${typeLabel}</span>
          </div>
          <p style="color:#3182F6;font-weight:600;margin:0 0 4px;">${formatToKoreanWon(property.dealAmount)}</p>
          <p style="color:#8B95A1;margin:0 0 2px;">${property.area}m² (${pyeong}평) / ${property.floor}층</p>
          <p style="color:${diffColor};font-weight:600;font-size:12px;margin:4px 0 0;">${diffLabel} ${formatToKoreanWon(Math.abs(diff))}</p>
        </div>
      `;

      const infoWindow = new maps.InfoWindow({ content, removable: true });

      maps.event.addListener(marker, "click", () => {
        if (openInfoWindow) openInfoWindow.close();
        infoWindow.open(map, marker);
        openInfoWindow = infoWindow;
      });
    });
  }, [isLoaded, filteredProperties, affordablePrice]);

  if (!hasKakaoKey) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[16px] bg-surface py-20 px-6">
        <p className="text-base font-semibold text-primary">지도를 사용할 수 없습니다</p>
        <p className="mt-1 text-sm text-secondary text-center">
          카카오맵 API 키를 환경변수(NEXT_PUBLIC_KAKAO_JS_KEY)에 설정하면
          <br />
          지도 뷰를 이용할 수 있습니다
        </p>
      </div>
    );
  }

  const filterButtons: { key: PropertyTypeFilter; label: string }[] = [
    { key: "all", label: "전체" },
    { key: "apartment", label: "아파트" },
    { key: "villa", label: "빌라" },
    { key: "officetel", label: "오피스텔" },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Type filter */}
      <div className="flex items-center gap-2">
        {filterButtons.map(({ key, label }) => {
          const isActive = typeFilter === key;
          const config = key !== "all" ? TYPE_CONFIG[key] : null;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setTypeFilter(key)}
              className={`
                flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium
                transition-colors duration-200
                ${
                  isActive
                    ? config
                      ? config.className
                      : "bg-primary text-white"
                    : "bg-surface text-secondary hover:text-primary"
                }
              `.trim()}
            >
              {key !== "all" && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: config?.color }}
                />
              )}
              {label}
              <span className="text-xs opacity-70">{typeCounts[key]}</span>
            </button>
          );
        })}
      </div>

      {/* Map */}
      <div
        ref={mapRef}
        className="h-[480px] w-full rounded-[16px] overflow-hidden bg-surface"
        aria-label="매물 지도"
      />
    </div>
  );
}
