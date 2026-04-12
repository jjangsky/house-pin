"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";
import { Button } from "@/components/common";
import { useHousePinStore } from "@/store/useHousePinStore";
import { SIGUNGU_MAP, SIDO_LIST, MAX_REGION_COUNT } from "@/constants/regions";

const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

// 서울 중심 좌표
const SEOUL_CENTER = { lat: 37.5665, lng: 126.978 };

export default function RegionMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const kakaoMapRef = useRef<KakaoMap | null>(null);
  const rectangleRef = useRef<KakaoRectangle | null>(null);
  const drawStartRef = useRef<KakaoLatLng | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [sdkError, setSdkError] = useState(false);

  const selectedRegions = useHousePinStore((s) => s.selectedRegions);
  const addRegion = useHousePinStore((s) => s.addRegion);
  const clearRegions = useHousePinStore((s) => s.clearRegions);

  const initMap = useCallback(() => {
    const kakao = window.kakao;
    if (!mapRef.current || !kakao) return;

    kakao.maps.load(() => {
      const maps = kakao.maps;
      const center = new maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng);
      const map = new maps.Map(mapRef.current!, { center, level: 10 });
      kakaoMapRef.current = map;

      maps.event.addListener(map, "mousedown", (e: KakaoMouseEvent) => {
        drawStartRef.current = e.latLng;
        setIsDrawing(true);
      });

      maps.event.addListener(map, "mousemove", (e: KakaoMouseEvent) => {
        if (!drawStartRef.current) return;

        if (rectangleRef.current) {
          rectangleRef.current.setMap(null);
        }

        const bounds = new maps.LatLngBounds(drawStartRef.current, e.latLng);
        const rectangle = new maps.Rectangle({
          bounds,
          strokeWeight: 2,
          strokeColor: "#3182F6",
          strokeOpacity: 0.8,
          fillColor: "#3182F6",
          fillOpacity: 0.15,
        });
        rectangle.setMap(map);
        rectangleRef.current = rectangle;
      });

      maps.event.addListener(map, "mouseup", (e: KakaoMouseEvent) => {
        if (!drawStartRef.current) return;
        setIsDrawing(false);

        const geocoder = new maps.services.Geocoder();
        const sw = drawStartRef.current;
        const ne = e.latLng;

        const points = [
          { lat: sw.getLat(), lng: sw.getLng() },
          { lat: ne.getLat(), lng: ne.getLng() },
          { lat: (sw.getLat() + ne.getLat()) / 2, lng: (sw.getLng() + ne.getLng()) / 2 },
          { lat: sw.getLat(), lng: ne.getLng() },
          { lat: ne.getLat(), lng: sw.getLng() },
        ];

        const foundCodes = new Set<string>();

        points.forEach((point) => {
          geocoder.coord2RegionCode(point.lng, point.lat, (result, status) => {
            if (status !== maps.services.Status.OK) return;

            const adminRegion = result.find((r) => r.code.length >= 5);
            if (!adminRegion) return;

            const code5 = adminRegion.code.substring(0, 5);
            if (foundCodes.has(code5)) return;
            foundCodes.add(code5);

            if (selectedRegions.length + foundCodes.size > MAX_REGION_COUNT) return;

            const sidoCode = code5.substring(0, 2);
            const sido = SIDO_LIST.find((s) => s.code === sidoCode);
            const sigungu = SIGUNGU_MAP[sidoCode]?.find((s) => s.code === code5);

            if (sido && sigungu) {
              addRegion({ code: code5, sido: sido.name, sigungu: sigungu.name });
            }
          });
        });

        drawStartRef.current = null;
      });

      setSdkLoaded(true);
    });
  }, [addRegion, selectedRegions.length]);

  useEffect(() => {
    if (sdkLoaded && !kakaoMapRef.current) {
      initMap();
    }
  }, [sdkLoaded, initMap]);

  const handleReset = () => {
    if (rectangleRef.current) {
      rectangleRef.current.setMap(null);
      rectangleRef.current = null;
    }
    clearRegions();
  };

  if (!KAKAO_APP_KEY) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[16px] bg-surface px-6 py-16">
        <p className="text-base font-semibold text-primary">
          카카오맵 API 키를 설정해주세요
        </p>
        <p className="mt-2 text-sm text-secondary">
          .env.local 파일에 NEXT_PUBLIC_KAKAO_JS_KEY를 추가하세요
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&libraries=services&autoload=false`}
        onLoad={initMap}
        onError={() => setSdkError(true)}
      />

      {sdkError ? (
        <div className="flex items-center justify-center rounded-[16px] bg-surface px-6 py-16">
          <p className="text-sm text-danger">
            카카오맵 로드에 실패했습니다. API 키를 확인해주세요.
          </p>
        </div>
      ) : (
        <div className="relative">
          <div
            ref={mapRef}
            className="h-[360px] w-full rounded-[16px] bg-surface"
            aria-label="카카오맵 - 드래그하여 지역 선택"
          />
          {isDrawing && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-primary/80 px-4 py-2 text-sm text-white">
              드래그하여 영역을 선택하세요
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onClick={handleReset}>
          영역 초기화
        </Button>
      </div>
    </div>
  );
}
