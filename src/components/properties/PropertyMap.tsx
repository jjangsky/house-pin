"use client";

import { useEffect, useRef, useState } from "react";
import { formatToKoreanWon, sqmToPyeong } from "@/lib/utils/format";
import type { Property } from "@/types";

const REGION_CENTER_COORDS: Record<string, { lat: number; lng: number }> = {
  "11680": { lat: 37.5172, lng: 127.0473 },
  "11650": { lat: 37.4837, lng: 127.0324 },
  "11710": { lat: 37.5145, lng: 127.1059 },
  "11440": { lat: 37.5663, lng: 126.9014 },
  "11500": { lat: 37.5509, lng: 126.8495 },
  "41135": { lat: 37.3825, lng: 127.1199 },
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

export default function PropertyMap({ properties, affordablePrice }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [hasKakaoKey, setHasKakaoKey] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

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
    if (properties.length === 0) return;

    const maps = kakao.maps;
    const firstCoords = getPropertyCoords(properties[0]);
    const center = new maps.LatLng(firstCoords.lat, firstCoords.lng);
    const map = new maps.Map(mapRef.current, { center, level: 6 });

    let openInfoWindow: KakaoInfoWindow | null = null;

    properties.forEach((property) => {
      const coords = getPropertyCoords(property);
      const position = new maps.LatLng(coords.lat, coords.lng);
      const marker = new maps.Marker({ map, position });

      const pyeong = sqmToPyeong(property.area);
      const diff = affordablePrice - property.dealAmount;
      const diffLabel = diff >= 0 ? "여유" : "부족";
      const diffColor = diff >= 0 ? "#00C471" : "#FF4545";

      const content = `
        <div style="padding:12px 14px;font-size:13px;line-height:1.5;min-width:180px;font-family:Pretendard,sans-serif;">
          <p style="font-weight:700;font-size:14px;margin:0 0 4px;">${property.name}</p>
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
  }, [isLoaded, properties, affordablePrice]);

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

  return (
    <div
      ref={mapRef}
      className="h-[480px] w-full rounded-[16px] overflow-hidden bg-surface"
      aria-label="매물 지도"
    />
  );
}
