"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/common";
import { REGION_CENTER_COORDS, DEFAULT_CENTER as SEOUL_CENTER } from "@/constants/regionCoords";
import type { Property } from "@/types";

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
