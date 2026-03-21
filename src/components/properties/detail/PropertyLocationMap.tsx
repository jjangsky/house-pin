"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/common";
import type { Property } from "@/types";

const REGION_CENTER_COORDS: Record<string, { lat: number; lng: number }> = {
  "11110": { lat: 37.5735, lng: 126.979 },
  "11140": { lat: 37.5641, lng: 126.9979 },
  "11170": { lat: 37.5326, lng: 126.991 },
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
  "11470": { lat: 37.517, lng: 126.8667 },
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
};

const SEOUL_CENTER = { lat: 37.5665, lng: 126.978 };

interface PropertyLocationMapProps {
  property: Property;
}

export default function PropertyLocationMap({
  property,
}: PropertyLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

  const coords =
    property.lat != null && property.lng != null
      ? { lat: property.lat, lng: property.lng }
      : REGION_CENTER_COORDS[property.regionCode] ?? SEOUL_CENTER;

  useEffect(() => {
    if (!kakaoKey || !mapRef.current) return;

    // SDK 이미 로드됨
    if (window.kakao?.maps) {
      window.kakao.maps.load(() => initMap());
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao?.maps.load(() => initMap());
    };
    script.onerror = () => setHasError(true);
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kakaoKey, coords.lat, coords.lng]);

  function initMap() {
    if (!mapRef.current || !window.kakao) return;

    try {
      const maps = window.kakao.maps;
      const center = new maps.LatLng(coords.lat, coords.lng);
      const map = new maps.Map(mapRef.current, {
        center,
        level: 4,
      });

      const marker = new maps.Marker({ position: center, map });

      const escapedName = property.name
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
      const infoWindow = new maps.InfoWindow({
        content: `<div style="padding:8px 12px;font-size:13px;font-weight:600;white-space:nowrap;">${escapedName}</div>`,
      });
      infoWindow.open(map, marker);

      setIsLoaded(true);
    } catch {
      setHasError(true);
    }
  }

  const address = [property.dong, property.jibun].filter(Boolean).join(" ");

  // 카카오맵 키 없거나 에러
  if (!kakaoKey || hasError) {
    return (
      <Card title="위치">
        <div className="flex h-[200px] items-center justify-center rounded-[12px] bg-border/30">
          <p className="text-sm text-secondary">
            {!kakaoKey
              ? "지도를 표시하려면 카카오맵 키가 필요합니다"
              : "지도를 불러올 수 없습니다"}
          </p>
        </div>
        {address && (
          <p className="mt-3 text-sm text-secondary">{address}</p>
        )}
      </Card>
    );
  }

  return (
    <Card title="위치">
      <div className="relative overflow-hidden rounded-[12px]">
        <div
          ref={mapRef}
          className="h-[240px] w-full sm:h-[400px]"
          aria-label="매물 위치 지도"
        />
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
          </div>
        )}
      </div>
      {address && (
        <p className="mt-3 text-sm text-secondary">{address}</p>
      )}
    </Card>
  );
}
