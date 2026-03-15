/* eslint-disable @typescript-eslint/no-explicit-any */

interface KakaoLatLng {
  getLat: () => number;
  getLng: () => number;
}

interface KakaoLatLngBounds {
  getSouthWest: () => KakaoLatLng;
  getNorthEast: () => KakaoLatLng;
}

interface KakaoMap {
  setCenter: (latlng: KakaoLatLng) => void;
  setLevel: (level: number) => void;
}

interface KakaoRectangle {
  setMap: (map: KakaoMap | null) => void;
  setBounds: (bounds: KakaoLatLngBounds) => void;
}

interface KakaoMouseEvent {
  latLng: KakaoLatLng;
}

interface KakaoGeocoder {
  coord2RegionCode: (
    lng: number,
    lat: number,
    callback: (
      result: { region_1depth_name: string; region_2depth_name: string; code: string }[],
      status: string
    ) => void
  ) => void;
}

interface KakaoMarker {
  setMap: (map: any) => void;
}

interface KakaoInfoWindow {
  open: (map: any, marker: any) => void;
  close: () => void;
}

interface KakaoMaps {
  load: (callback: () => void) => void;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap;
  Size: new (width: number, height: number) => any;
  MarkerImage: new (src: string, size: any) => any;
  Marker: new (options: { map: any; position: any; image?: any }) => KakaoMarker;
  InfoWindow: new (options: { content: string; removable?: boolean }) => KakaoInfoWindow;
  Rectangle: new (options: {
    bounds: KakaoLatLngBounds;
    strokeWeight: number;
    strokeColor: string;
    strokeOpacity: number;
    fillColor: string;
    fillOpacity: number;
  }) => KakaoRectangle;
  LatLngBounds: new (sw: KakaoLatLng, ne: KakaoLatLng) => KakaoLatLngBounds;
  event: {
    addListener: (target: any, type: string, handler: (...args: any[]) => void) => void;
  };
  services: {
    Geocoder: new () => KakaoGeocoder;
    Status: { OK: string };
  };
}

interface Window {
  kakao?: {
    maps: KakaoMaps;
  };
}
