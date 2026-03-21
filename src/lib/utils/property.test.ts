import { describe, it, expect } from 'vitest';

import type { Property } from '@/types';

import {
  generatePropertySlug,
  parsePropertySlug,
  findPropertyBySlug,
  calculateSimilarity,
  findSimilarProperties,
} from './property';

// =============================================================================
// 테스트 데이터
// =============================================================================

const SAMPLE_PROPERTY: Property = {
  dealAmount: 82000,
  buildYear: 2018,
  dealYear: 2026,
  dealMonth: 2,
  dealDay: 15,
  dong: '서초동',
  name: '래미안블레스티지',
  area: 84.99,
  floor: 15,
  jibun: '1548',
  regionCode: '11650',
  propertyType: 'apartment',
};

const SIMILAR_PROPERTIES: Property[] = [
  {
    ...SAMPLE_PROPERTY,
    name: '래미안서초에스티지',
    dealAmount: 85000,
    area: 79.5,
    floor: 10,
  },
  {
    ...SAMPLE_PROPERTY,
    name: '반포자이',
    dong: '반포동',
    dealAmount: 120000,
    area: 84.5,
    floor: 20,
    propertyType: 'apartment',
  },
  {
    ...SAMPLE_PROPERTY,
    name: '서초빌라',
    dealAmount: 30000,
    area: 55.0,
    floor: 3,
    propertyType: 'villa',
  },
  {
    ...SAMPLE_PROPERTY,
    name: '역삼오피스텔',
    dong: '역삼동',
    dealAmount: 40000,
    area: 33.0,
    floor: 8,
    regionCode: '11680',
    propertyType: 'officetel',
  },
];

// =============================================================================
// generatePropertySlug
// =============================================================================

describe('generatePropertySlug', () => {
  it('올바른 slug 형식을 생성한다', () => {
    const slug = generatePropertySlug(SAMPLE_PROPERTY);
    expect(slug).toContain('11650');
    expect(slug).toContain('82000');
    expect(slug).toContain('84.99');
    expect(slug).toContain('15');
  });

  it('한글 이름을 인코딩한다', () => {
    const slug = generatePropertySlug(SAMPLE_PROPERTY);
    expect(slug).toContain(encodeURIComponent('래미안블레스티지'));
  });
});

// =============================================================================
// parsePropertySlug
// =============================================================================

describe('parsePropertySlug', () => {
  it('slug를 올바르게 파싱한다', () => {
    const slug = generatePropertySlug(SAMPLE_PROPERTY);
    const parsed = parsePropertySlug(slug);

    expect(parsed).not.toBeNull();
    expect(parsed!.regionCode).toBe('11650');
    expect(parsed!.name).toBe('래미안블레스티지');
    expect(parsed!.dealAmount).toBe(82000);
    expect(parsed!.area).toBe(84.99);
    expect(parsed!.floor).toBe(15);
  });

  it('잘못된 slug는 null을 반환한다', () => {
    expect(parsePropertySlug('')).toBeNull();
    expect(parsePropertySlug('invalid')).toBeNull();
    expect(parsePropertySlug('a-b')).toBeNull();
  });

  it('이름에 하이픈이 포함된 경우 처리한다', () => {
    const property: Property = {
      ...SAMPLE_PROPERTY,
      name: '래미안-블레스티지',
    };
    const slug = generatePropertySlug(property);
    const parsed = parsePropertySlug(slug);

    expect(parsed).not.toBeNull();
    expect(parsed!.name).toBe('래미안-블레스티지');
  });
});

// =============================================================================
// findPropertyBySlug
// =============================================================================

describe('findPropertyBySlug', () => {
  const properties = [SAMPLE_PROPERTY, ...SIMILAR_PROPERTIES];

  it('slug로 매물을 찾는다', () => {
    const slug = generatePropertySlug(SAMPLE_PROPERTY);
    const found = findPropertyBySlug(properties, slug);

    expect(found).not.toBeNull();
    expect(found!.name).toBe('래미안블레스티지');
  });

  it('매칭되는 매물이 없으면 null을 반환한다', () => {
    const found = findPropertyBySlug(properties, '99999-없는매물-1-1-1');
    expect(found).toBeNull();
  });

  it('잘못된 slug는 null을 반환한다', () => {
    expect(findPropertyBySlug(properties, 'invalid')).toBeNull();
  });
});

// =============================================================================
// calculateSimilarity
// =============================================================================

describe('calculateSimilarity', () => {
  it('동일한 매물은 최대 점수를 반환한다', () => {
    const score = calculateSimilarity(SAMPLE_PROPERTY, { ...SAMPLE_PROPERTY });
    expect(score).toBe(100);
  });

  it('같은 동 + 같은 타입이면 높은 점수를 반환한다', () => {
    const similar = SIMILAR_PROPERTIES[0]; // 같은 동, 같은 타입, 비슷한 면적/가격
    const score = calculateSimilarity(SAMPLE_PROPERTY, similar);
    expect(score).toBeGreaterThan(70);
  });

  it('다른 동 + 다른 타입이면 낮은 점수를 반환한다', () => {
    const different = SIMILAR_PROPERTIES[3]; // 역삼동, 오피스텔
    const score = calculateSimilarity(SAMPLE_PROPERTY, different);
    expect(score).toBeLessThan(30);
  });

  it('점수는 0~100 범위이다', () => {
    for (const candidate of SIMILAR_PROPERTIES) {
      const score = calculateSimilarity(SAMPLE_PROPERTY, candidate);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });
});

// =============================================================================
// findSimilarProperties
// =============================================================================

describe('findSimilarProperties', () => {
  it('유사도 높은 순으로 반환한다', () => {
    const allProperties = [SAMPLE_PROPERTY, ...SIMILAR_PROPERTIES];
    const similar = findSimilarProperties(SAMPLE_PROPERTY, allProperties, 3);

    expect(similar.length).toBeLessThanOrEqual(3);
    // 자기 자신은 포함하지 않음
    expect(similar.every((p) => p.name !== SAMPLE_PROPERTY.name || p.floor !== SAMPLE_PROPERTY.floor)).toBe(true);
  });

  it('자기 자신을 제외한다', () => {
    const allProperties = [SAMPLE_PROPERTY, ...SIMILAR_PROPERTIES];
    const similar = findSimilarProperties(SAMPLE_PROPERTY, allProperties);

    const hasSelf = similar.some(
      (p) =>
        p.name === SAMPLE_PROPERTY.name &&
        p.floor === SAMPLE_PROPERTY.floor &&
        p.dealAmount === SAMPLE_PROPERTY.dealAmount,
    );
    expect(hasSelf).toBe(false);
  });

  it('요청한 개수만큼 반환한다', () => {
    const allProperties = [SAMPLE_PROPERTY, ...SIMILAR_PROPERTIES];
    const similar = findSimilarProperties(SAMPLE_PROPERTY, allProperties, 2);
    expect(similar).toHaveLength(2);
  });

  it('빈 배열에서는 빈 결과를 반환한다', () => {
    const similar = findSimilarProperties(SAMPLE_PROPERTY, []);
    expect(similar).toHaveLength(0);
  });
});
