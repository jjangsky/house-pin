"use client";

import { useEffect, useRef, useState } from "react";
import { formatToKoreanWon, sqmToPyeong } from "@/lib/utils/format";
import { REGION_CENTER_COORDS, DEFAULT_CENTER } from "@/constants/regionCoords";
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
