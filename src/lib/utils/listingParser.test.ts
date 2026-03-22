import { describe, it, expect } from 'vitest';

import type { ListingRoomRaw } from '@/types/listing';

import {
  parsePriceTitle,
  parseRoomDesc,
  mapRoomType,
  transformRawToListing,
} from './listingParser';

// =============================================================================
// parsePriceTitle
// =============================================================================

describe('parsePriceTitle', () => {
  it('"9억000" → 90000', () => {
    expect(parsePriceTitle('9억000')).toBe(90000);
  });

  it('"4억2,000" → 42000', () => {
    expect(parsePriceTitle('4억2,000')).toBe(42000);
  });

  it('"8,500" → 8500', () => {
    expect(parsePriceTitle('8,500')).toBe(8500);
  });

  it('"12억5,000" → 125000', () => {
    expect(parsePriceTitle('12억5,000')).toBe(125000);
  });

  it('"1억" → 10000', () => {
    expect(parsePriceTitle('1억')).toBe(10000);
  });

  it('"3억5000" → 35000', () => {
    expect(parsePriceTitle('3억5000')).toBe(35000);
  });

  it('"24억5,000" → 245000', () => {
    expect(parsePriceTitle('24억5,000')).toBe(245000);
  });

  it('빈 문자열 → 0', () => {
    expect(parsePriceTitle('')).toBe(0);
  });

  it('"0" → 0', () => {
    expect(parsePriceTitle('0')).toBe(0);
  });
});

// =============================================================================
// parseRoomDesc
// =============================================================================

describe('parseRoomDesc', () => {
  it('"9층, 82.58m², 관리비 20만" → { area: 82.58, floor: 9 }', () => {
    const result = parseRoomDesc('9층, 82.58m², 관리비 20만');
    expect(result.area).toBe(82.58);
    expect(result.floor).toBe(9);
  });

  it('"6층, 38.21m², 관리비 16만" 파싱', () => {
    const result = parseRoomDesc('6층, 38.21m², 관리비 16만');
    expect(result.area).toBe(38.21);
    expect(result.floor).toBe(6);
  });

  it('면적만 있는 경우', () => {
    const result = parseRoomDesc('59.9m²');
    expect(result.area).toBe(59.9);
    expect(result.floor).toBeNull();
  });

  it('층수만 있는 경우', () => {
    const result = parseRoomDesc('15층');
    expect(result.area).toBeNull();
    expect(result.floor).toBe(15);
  });

  it('파싱 불가 문자열', () => {
    const result = parseRoomDesc('정보 없음');
    expect(result.area).toBeNull();
    expect(result.floor).toBeNull();
  });

  it('빈 문자열', () => {
    const result = parseRoomDesc('');
    expect(result.area).toBeNull();
    expect(result.floor).toBeNull();
  });
});

// =============================================================================
// mapRoomType
// =============================================================================

describe('mapRoomType', () => {
  it('"아파트" → apartment', () => {
    expect(mapRoomType('아파트')).toBe('apartment');
  });

  it('"오피스텔" → officetel', () => {
    expect(mapRoomType('오피스텔')).toBe('officetel');
  });

  it('"빌라/연립" → villa', () => {
    expect(mapRoomType('빌라/연립')).toBe('villa');
  });

  it('"주택" → villa (기본값)', () => {
    expect(mapRoomType('주택')).toBe('villa');
  });
});

// =============================================================================
// transformRawToListing
// =============================================================================

describe('transformRawToListing', () => {
  const RAW: ListingRoomRaw = {
    seq: 55760823,
    id: '69a29b2b75f4f510da3f1e8d',
    roomTypeName: '아파트',
    randomLocation: { lat: 37.504308, lng: 127.052611 },
    complexName: '대치우정에쉐르2(주상복합)',
    roomTitle: '대치동 아파트 급매',
    roomDesc: '9층, 82.58m², 관리비 20만',
    priceTypeName: '매매',
    priceTitle: '9억000',
    imgUrlList: ['https://cdn.example.com/img1.jpg', 'https://cdn.example.com/img2.jpg'],
    dongName: '대치동',
    gid: 10269,
    isQuick: true,
    isPano: false,
    isOwnerAuth: false,
    isNaverVerify: false,
  };

  it('기본 필드를 올바르게 변환한다', () => {
    const listing = transformRawToListing(RAW);

    expect(listing.listingSeq).toBe(55760823);
    expect(listing.listingId).toBe('69a29b2b75f4f510da3f1e8d');
    expect(listing.name).toBe('대치우정에쉐르2(주상복합)');
    expect(listing.dongName).toBe('대치동');
    expect(listing.propertyType).toBe('apartment');
    expect(listing.source).toBe('live');
  });

  it('가격을 올바르게 파싱한다', () => {
    const listing = transformRawToListing(RAW);
    expect(listing.askingPrice).toBe(90000);
    expect(listing.priceDisplay).toBe('9억000');
  });

  it('roomDesc에서 면적과 층수를 파싱한다', () => {
    const listing = transformRawToListing(RAW);
    expect(listing.area).toBe(82.58);
    expect(listing.floor).toBe(9);
  });

  it('좌표를 매핑한다', () => {
    const listing = transformRawToListing(RAW);
    expect(listing.lat).toBe(37.504308);
    expect(listing.lng).toBe(127.052611);
  });

  it('이미지 URL을 매핑한다', () => {
    const listing = transformRawToListing(RAW);
    expect(listing.imgUrlList).toHaveLength(2);
    expect(listing.thumbnailUrl).toBe('https://cdn.example.com/img1.jpg');
  });

  it('이미지 없을 때 thumbnailUrl이 null이다', () => {
    const raw = { ...RAW, imgUrlList: [] };
    const listing = transformRawToListing(raw);
    expect(listing.thumbnailUrl).toBeNull();
  });
});
