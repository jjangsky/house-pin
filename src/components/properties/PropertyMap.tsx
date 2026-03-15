"use client";

import { useEffect, useRef, useState } from "react";
import { formatToKoreanWon, sqmToPyeong } from "@/lib/utils/format";
import type { Property } from "@/types";

const REGION_CENTER_COORDS: Record<string, { lat: number; lng: number }> = {
  // 서울특별시
  "11110": { lat: 37.5735, lng: 126.9790 }, // 종로구
  "11140": { lat: 37.5641, lng: 126.9979 }, // 중구
  "11170": { lat: 37.5326, lng: 126.9910 }, // 용산구
  "11200": { lat: 37.5634, lng: 127.0369 }, // 성동구
  "11215": { lat: 37.5385, lng: 127.0824 }, // 광진구
  "11230": { lat: 37.5744, lng: 127.0396 }, // 동대문구
  "11260": { lat: 37.6066, lng: 127.0928 }, // 중랑구
  "11290": { lat: 37.5894, lng: 127.0167 }, // 성북구
  "11305": { lat: 37.6398, lng: 127.0255 }, // 강북구
  "11320": { lat: 37.6688, lng: 127.0472 }, // 도봉구
  "11350": { lat: 37.6542, lng: 127.0568 }, // 노원구
  "11380": { lat: 37.6027, lng: 126.9291 }, // 은평구
  "11410": { lat: 37.5791, lng: 126.9368 }, // 서대문구
  "11440": { lat: 37.5663, lng: 126.9014 }, // 마포구
  "11470": { lat: 37.5170, lng: 126.8667 }, // 양천구
  "11500": { lat: 37.5509, lng: 126.8495 }, // 강서구
  "11530": { lat: 37.4955, lng: 126.8878 }, // 구로구
  "11545": { lat: 37.4569, lng: 126.8955 }, // 금천구
  "11560": { lat: 37.5264, lng: 126.8963 }, // 영등포구
  "11590": { lat: 37.5124, lng: 126.9394 }, // 동작구
  "11620": { lat: 37.4784, lng: 126.9516 }, // 관악구
  "11650": { lat: 37.4837, lng: 127.0324 }, // 서초구
  "11680": { lat: 37.5172, lng: 127.0473 }, // 강남구
  "11710": { lat: 37.5145, lng: 127.1059 }, // 송파구
  "11740": { lat: 37.5301, lng: 127.1238 }, // 강동구
  // 경기도 주요 지역
  "41111": { lat: 37.2994, lng: 127.0085 }, // 수원시 장안구
  "41113": { lat: 37.2573, lng: 126.9716 }, // 수원시 권선구
  "41115": { lat: 37.2851, lng: 127.0195 }, // 수원시 팔달구
  "41117": { lat: 37.2596, lng: 127.0464 }, // 수원시 영통구
  "41131": { lat: 37.4500, lng: 127.1457 }, // 성남시 수정구
  "41133": { lat: 37.4318, lng: 127.1384 }, // 성남시 중원구
  "41135": { lat: 37.3825, lng: 127.1199 }, // 성남시 분당구
  "41150": { lat: 37.7381, lng: 127.0337 }, // 의정부시
  "41171": { lat: 37.3866, lng: 126.9200 }, // 안양시 만안구
  "41173": { lat: 37.3943, lng: 126.9514 }, // 안양시 동안구
  "41190": { lat: 37.5034, lng: 126.7660 }, // 부천시
  "41210": { lat: 37.4787, lng: 126.8643 }, // 광명시
  "41220": { lat: 36.9922, lng: 127.1130 }, // 평택시
  "41271": { lat: 37.3000, lng: 126.8469 }, // 안산시 상록구
  "41273": { lat: 37.3185, lng: 126.7944 }, // 안산시 단원구
  "41281": { lat: 37.6373, lng: 126.8322 }, // 고양시 덕양구
  "41285": { lat: 37.6586, lng: 126.7743 }, // 고양시 일산동구
  "41287": { lat: 37.6794, lng: 126.7509 }, // 고양시 일산서구
  "41290": { lat: 37.4292, lng: 126.9876 }, // 과천시
  "41310": { lat: 37.5943, lng: 127.1295 }, // 구리시
  "41360": { lat: 37.6360, lng: 127.2165 }, // 남양주시
  "41390": { lat: 37.3800, lng: 126.8028 }, // 시흥시
  "41410": { lat: 37.3617, lng: 126.9352 }, // 군포시
  "41430": { lat: 37.3445, lng: 126.9686 }, // 의왕시
  "41450": { lat: 37.5393, lng: 127.2141 }, // 하남시
  "41461": { lat: 37.2341, lng: 127.2009 }, // 용인시 처인구
  "41463": { lat: 37.2800, lng: 127.1150 }, // 용인시 기흥구
  "41465": { lat: 37.3222, lng: 127.0988 }, // 용인시 수지구
  "41480": { lat: 37.7600, lng: 126.7800 }, // 파주시
  "41570": { lat: 37.6152, lng: 126.7157 }, // 김포시
  "41590": { lat: 37.2000, lng: 126.8311 }, // 화성시
  "41610": { lat: 37.4095, lng: 127.2573 }, // 광주시
  // 인천광역시
  "28110": { lat: 37.4737, lng: 126.6216 }, // 중구
  "28140": { lat: 37.4736, lng: 126.6432 }, // 동구
  "28177": { lat: 37.4464, lng: 126.6503 }, // 미추홀구
  "28185": { lat: 37.4101, lng: 126.6783 }, // 연수구
  "28200": { lat: 37.4488, lng: 126.7316 }, // 남동구
  "28237": { lat: 37.5075, lng: 126.7219 }, // 부평구
  "28245": { lat: 37.5376, lng: 126.7377 }, // 계양구
  "28260": { lat: 37.5449, lng: 126.6760 }, // 서구
  // 부산광역시
  "26110": { lat: 35.1064, lng: 129.0326 }, // 중구
  "26230": { lat: 35.1629, lng: 129.0533 }, // 부산진구
  "26260": { lat: 35.1959, lng: 129.0845 }, // 동래구
  "26290": { lat: 35.1368, lng: 129.0849 }, // 남구
  "26350": { lat: 35.1631, lng: 129.1636 }, // 해운대구
  "26380": { lat: 35.1046, lng: 128.9747 }, // 사하구
  "26410": { lat: 35.2432, lng: 129.0914 }, // 금정구
  "26500": { lat: 35.1456, lng: 129.1131 }, // 수영구
  "26530": { lat: 35.1525, lng: 128.9913 }, // 사상구
  // 대구광역시
  "27110": { lat: 35.8690, lng: 128.6063 }, // 중구
  "27140": { lat: 35.8863, lng: 128.6359 }, // 동구
  "27230": { lat: 35.8857, lng: 128.5829 }, // 북구
  "27260": { lat: 35.8583, lng: 128.6321 }, // 수성구
  "27290": { lat: 35.8500, lng: 128.5327 }, // 달서구
  // 대전광역시
  "30110": { lat: 36.3120, lng: 127.4550 }, // 동구
  "30140": { lat: 36.3255, lng: 127.4210 }, // 중구
  "30170": { lat: 36.3553, lng: 127.3836 }, // 서구
  "30200": { lat: 36.3622, lng: 127.3561 }, // 유성구
  "30230": { lat: 36.3466, lng: 127.4155 }, // 대덕구
  // 광주광역시
  "29110": { lat: 35.1460, lng: 126.9231 }, // 동구
  "29140": { lat: 35.1518, lng: 126.8895 }, // 서구
  "29155": { lat: 35.1328, lng: 126.9025 }, // 남구
  "29170": { lat: 35.1746, lng: 126.9120 }, // 북구
  "29200": { lat: 35.1395, lng: 126.7937 }, // 광산구
  // 세종특별자치시
  "36110": { lat: 36.4801, lng: 127.2590 }, // 세종시
  // 제주특별자치도
  "50110": { lat: 33.4996, lng: 126.5312 }, // 제주시
  "50130": { lat: 33.2541, lng: 126.5600 }, // 서귀포시
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
