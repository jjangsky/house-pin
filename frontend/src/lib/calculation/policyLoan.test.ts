import { describe, it, expect } from 'vitest';
import {
  checkDidimdol,
  checkBogeumjari,
  checkBatimok,
  checkAllPolicyLoans,
} from './policyLoan';

const baseParams = {
  propertyPrice: 40000,
  annualIncome: 5000,
  numberOfHomes: 0,
  isFirstTimeBuyer: false,
  isNewlywed: false,
  isSeoul: false,
  transactionType: 'buy' as const,
  jeonseDeposit: 0,
};

describe('checkDidimdol (디딤돌 대출)', () => {
  it('자격 충족 시 eligible = true', () => {
    const result = checkDidimdol(baseParams);
    expect(result.eligible).toBe(true);
    expect(result.name).toBe('디딤돌 대출');
    expect(result.maxLoan).toBe(40000);
  });

  it('1주택 이상 -> 미자격', () => {
    const result = checkDidimdol({ ...baseParams, numberOfHomes: 1 });
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('무주택자');
  });

  it('매매가 5억 초과 -> 미자격', () => {
    const result = checkDidimdol({ ...baseParams, propertyPrice: 50001 });
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('5억');
  });

  it('소득 6,000만 초과 -> 미자격', () => {
    const result = checkDidimdol({ ...baseParams, annualIncome: 6001 });
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('6,000만');
  });

  it('생애최초 시 소득 기준 7,000만까지 허용', () => {
    const result = checkDidimdol({
      ...baseParams,
      isFirstTimeBuyer: true,
      annualIncome: 7000,
    });
    expect(result.eligible).toBe(true);
  });

  it('생애최초 시 소득 7,000만 초과 -> 미자격', () => {
    const result = checkDidimdol({
      ...baseParams,
      isFirstTimeBuyer: true,
      annualIncome: 7001,
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('7,000만');
  });
});

describe('checkBogeumjari (보금자리론)', () => {
  it('자격 충족 시 eligible = true', () => {
    const result = checkBogeumjari(baseParams);
    expect(result.eligible).toBe(true);
    expect(result.name).toBe('보금자리론');
  });

  it('2주택 이상 -> 미자격', () => {
    const result = checkBogeumjari({ ...baseParams, numberOfHomes: 2 });
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('2주택');
  });

  it('1주택도 자격 있음 (처분 조건)', () => {
    const result = checkBogeumjari({ ...baseParams, numberOfHomes: 1 });
    expect(result.eligible).toBe(true);
  });

  it('매매가 6억 초과 -> 미자격', () => {
    const result = checkBogeumjari({ ...baseParams, propertyPrice: 60001 });
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('6억');
  });

  it('소득 7,000만 초과 -> 미자격', () => {
    const result = checkBogeumjari({ ...baseParams, annualIncome: 7001 });
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('7,000만');
  });

  it('생애최초 시 maxLoan 4.2억 적용', () => {
    const result = checkBogeumjari({ ...baseParams, isFirstTimeBuyer: true });
    expect(result.maxLoan).toBe(42000);
  });

  it('비생애최초 시 maxLoan 3.6억', () => {
    const result = checkBogeumjari(baseParams);
    expect(result.maxLoan).toBe(36000);
  });
});

describe('checkBatimok (버팀목 전세대출)', () => {
  it('자격 충족 시 eligible = true', () => {
    const result = checkBatimok(baseParams);
    expect(result.eligible).toBe(true);
    expect(result.name).toBe('버팀목 전세대출');
  });

  it('1주택 이상 -> 미자격', () => {
    const result = checkBatimok({ ...baseParams, numberOfHomes: 1 });
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('무주택자');
  });

  it('소득 5,000만 초과 -> 미자격', () => {
    const result = checkBatimok({ ...baseParams, annualIncome: 5001 });
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('5,000만');
  });

  it('서울 -> maxLoan 1.2억', () => {
    const result = checkBatimok({ ...baseParams, isSeoul: true });
    expect(result.maxLoan).toBe(12000);
  });

  it('서울 외 -> maxLoan 8,000만', () => {
    const result = checkBatimok({ ...baseParams, isSeoul: false });
    expect(result.maxLoan).toBe(8000);
  });

  it('서울 전세보증금 3억 초과 -> 미자격', () => {
    const result = checkBatimok({
      ...baseParams,
      isSeoul: true,
      jeonseDeposit: 30001,
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('3억');
  });

  it('서울 외 전세보증금 2억 초과 -> 미자격', () => {
    const result = checkBatimok({
      ...baseParams,
      isSeoul: false,
      jeonseDeposit: 20001,
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('2억');
  });
});

describe('checkAllPolicyLoans', () => {
  it('모든 정책대출 결과를 배열로 반환', () => {
    const results = checkAllPolicyLoans(baseParams);
    expect(results).toHaveLength(3);
    expect(results[0].name).toBe('디딤돌 대출');
    expect(results[1].name).toBe('보금자리론');
    expect(results[2].name).toBe('버팀목 전세대출');
  });

  it('자격 충족 시 모두 eligible', () => {
    const results = checkAllPolicyLoans(baseParams);
    expect(results.every((r) => r.eligible)).toBe(true);
  });

  it('다주택자 -> 디딤돌, 버팀목 미자격', () => {
    const results = checkAllPolicyLoans({ ...baseParams, numberOfHomes: 2 });
    expect(results[0].eligible).toBe(false); // 디딤돌
    expect(results[1].eligible).toBe(false); // 보금자리
    expect(results[2].eligible).toBe(false); // 버팀목
  });
});
