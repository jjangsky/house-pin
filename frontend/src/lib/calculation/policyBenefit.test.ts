import { describe, it, expect } from 'vitest';
import { checkAllPolicyBenefits } from './policyBenefit';
import type { PolicyBenefitInput } from '@/types/policyBenefit';

// ──────────────────────────────────────────────
// 공통 기본 입력
// ──────────────────────────────────────────────

const baseInput: PolicyBenefitInput = {
  annualIncome: 5000,
  numberOfHomes: 0,
  isFirstTimeBuyer: true,
  isNewlywed: false,
  hasChildren: false,
  age: 30,
  purchasePrice: 40000,
  transactionType: 'buy',
};

// ──────────────────────────────────────────────
// 1. 생애최초 특례 대출
// ──────────────────────────────────────────────

describe('생애최초 특례 대출', () => {
  it('무주택 + 생애최초 + 소득 9천 이하 → 자격 충족', () => {
    const result = checkAllPolicyBenefits(baseInput);
    const benefit = result.eligible.find((b) => b.name === '생애최초 특례 대출');
    expect(benefit).toBeDefined();
    expect(benefit!.eligible).toBe(true);
    expect(benefit!.maxLoanAmount).toBe(50000);
  });

  it('1주택 → 미자격', () => {
    const result = checkAllPolicyBenefits({ ...baseInput, numberOfHomes: 1 });
    const benefit = result.ineligible.find((b) => b.name === '생애최초 특례 대출');
    expect(benefit).toBeDefined();
    expect(benefit!.reason).toContain('무주택자');
  });

  it('생애최초 아님 → 미자격', () => {
    const result = checkAllPolicyBenefits({ ...baseInput, isFirstTimeBuyer: false });
    const benefit = result.ineligible.find((b) => b.name === '생애최초 특례 대출');
    expect(benefit).toBeDefined();
    expect(benefit!.reason).toContain('생애최초');
  });

  it('소득 9천 초과 → 미자격', () => {
    const result = checkAllPolicyBenefits({ ...baseInput, annualIncome: 9001 });
    const benefit = result.ineligible.find((b) => b.name === '생애최초 특례 대출');
    expect(benefit).toBeDefined();
    expect(benefit!.reason).toContain('9,000만');
  });
});

// ──────────────────────────────────────────────
// 2. 신생아 특례 대출
// ──────────────────────────────────────────────

describe('신생아 특례 대출', () => {
  const newbornInput: PolicyBenefitInput = {
    ...baseInput,
    hasChildren: true,
    childAge: 1,
    annualIncome: 10000,
  };

  it('자녀 2세 이하 + 소득 1.3억 이하 → 자격 충족', () => {
    const result = checkAllPolicyBenefits(newbornInput);
    const benefit = result.eligible.find((b) => b.name === '신생아 특례 대출');
    expect(benefit).toBeDefined();
    expect(benefit!.interestRate.min).toBe(1.6);
  });

  it('자녀 없음 → 미자격', () => {
    const result = checkAllPolicyBenefits({ ...newbornInput, hasChildren: false });
    const benefit = result.ineligible.find((b) => b.name === '신생아 특례 대출');
    expect(benefit).toBeDefined();
    expect(benefit!.reason).toContain('자녀');
  });

  it('자녀 3세 → 미자격', () => {
    const result = checkAllPolicyBenefits({ ...newbornInput, childAge: 3 });
    const benefit = result.ineligible.find((b) => b.name === '신생아 특례 대출');
    expect(benefit).toBeDefined();
    expect(benefit!.reason).toContain('2세 이하');
  });

  it('소득 1.3억 초과 → 미자격', () => {
    const result = checkAllPolicyBenefits({ ...newbornInput, annualIncome: 13001 });
    const benefit = result.ineligible.find((b) => b.name === '신생아 특례 대출');
    expect(benefit).toBeDefined();
    expect(benefit!.reason).toContain('1억 3,000만');
  });
});

// ──────────────────────────────────────────────
// 3. 디딤돌 대출
// ──────────────────────────────────────────────

describe('디딤돌 대출', () => {
  it('무주택 + 소득 6천 이하 + 매매가 5억 이하 → 자격 충족', () => {
    const result = checkAllPolicyBenefits({
      ...baseInput,
      isFirstTimeBuyer: false,
      annualIncome: 5000,
    });
    const benefit = result.eligible.find((b) => b.name === '디딤돌 대출');
    expect(benefit).toBeDefined();
    expect(benefit!.maxLoanAmount).toBe(40000);
  });

  it('생애최초 시 소득 한도 7천까지 확대', () => {
    const result = checkAllPolicyBenefits({
      ...baseInput,
      isFirstTimeBuyer: true,
      annualIncome: 6500,
    });
    const benefit = result.eligible.find((b) => b.name === '디딤돌 대출');
    expect(benefit).toBeDefined();
  });

  it('소득 6천 초과 (비생애최초) → 미자격', () => {
    const result = checkAllPolicyBenefits({
      ...baseInput,
      isFirstTimeBuyer: false,
      annualIncome: 6001,
    });
    const benefit = result.ineligible.find((b) => b.name === '디딤돌 대출');
    expect(benefit).toBeDefined();
    expect(benefit!.reason).toContain('6,000만');
  });

  it('매매가 5억 초과 → 미자격', () => {
    const result = checkAllPolicyBenefits({ ...baseInput, purchasePrice: 50001 });
    const benefit = result.ineligible.find((b) => b.name === '디딤돌 대출');
    expect(benefit).toBeDefined();
    expect(benefit!.reason).toContain('5억');
  });
});

// ──────────────────────────────────────────────
// 4. 보금자리론
// ──────────────────────────────────────────────

describe('보금자리론', () => {
  it('무주택 + 소득 7천 이하 + 매매가 6억 이하 → 자격 충족', () => {
    const result = checkAllPolicyBenefits({
      ...baseInput,
      isFirstTimeBuyer: false,
      annualIncome: 7000,
      purchasePrice: 55000,
    });
    const benefit = result.eligible.find((b) => b.name === '보금자리론');
    expect(benefit).toBeDefined();
    expect(benefit!.maxLoanAmount).toBe(36000);
  });

  it('생애최초 시 한도 4.2억', () => {
    const result = checkAllPolicyBenefits({
      ...baseInput,
      isFirstTimeBuyer: true,
      annualIncome: 7000,
      purchasePrice: 55000,
    });
    const benefit = result.eligible.find((b) => b.name === '보금자리론');
    expect(benefit).toBeDefined();
    expect(benefit!.maxLoanAmount).toBe(42000);
  });

  it('2주택 이상 → 미자격', () => {
    const result = checkAllPolicyBenefits({ ...baseInput, numberOfHomes: 2 });
    const benefit = result.ineligible.find((b) => b.name === '보금자리론');
    expect(benefit).toBeDefined();
    expect(benefit!.reason).toContain('2주택');
  });

  it('매매가 6억 초과 → 미자격', () => {
    const result = checkAllPolicyBenefits({ ...baseInput, purchasePrice: 60001 });
    const benefit = result.ineligible.find((b) => b.name === '보금자리론');
    expect(benefit).toBeDefined();
    expect(benefit!.reason).toContain('6억');
  });
});

// ──────────────────────────────────────────────
// 5. 청년 전세 보증금 반환 보증
// ──────────────────────────────────────────────

describe('청년 전세 보증금 반환 보증', () => {
  const jeonseInput: PolicyBenefitInput = {
    ...baseInput,
    transactionType: 'jeonse',
    age: 28,
    annualIncome: 4000,
  };

  it('만 19~34세 + 무주택 + 전세 + 소득 5천 이하 → 자격 충족', () => {
    const result = checkAllPolicyBenefits(jeonseInput);
    const benefit = result.eligible.find((b) => b.name === '청년 전세 보증금 반환 보증');
    expect(benefit).toBeDefined();
  });

  it('나이 35세 → 미자격', () => {
    const result = checkAllPolicyBenefits({ ...jeonseInput, age: 35 });
    const benefit = result.ineligible.find((b) => b.name === '청년 전세 보증금 반환 보증');
    expect(benefit).toBeDefined();
    expect(benefit!.reason).toContain('19~34세');
  });

  it('나이 18세 → 미자격', () => {
    const result = checkAllPolicyBenefits({ ...jeonseInput, age: 18 });
    const benefit = result.ineligible.find((b) => b.name === '청년 전세 보증금 반환 보증');
    expect(benefit).toBeDefined();
    expect(benefit!.reason).toContain('19~34세');
  });

  it('매매 거래 → 미자격', () => {
    const result = checkAllPolicyBenefits({ ...jeonseInput, transactionType: 'buy' });
    const benefit = result.ineligible.find((b) => b.name === '청년 전세 보증금 반환 보증');
    expect(benefit).toBeDefined();
    expect(benefit!.reason).toContain('전세');
  });
});

// ──────────────────────────────────────────────
// 6. 생애최초 취득세 감면
// ──────────────────────────────────────────────

describe('생애최초 취득세 감면', () => {
  it('생애최초 + 매매가 12억 이하 → 자격 충족', () => {
    const result = checkAllPolicyBenefits(baseInput);
    const benefit = result.eligible.find((b) => b.name === '생애최초 취득세 감면');
    expect(benefit).toBeDefined();
    expect(benefit!.category).toBe('tax');
    expect(benefit!.monthlySavings).toBe(200);
  });

  it('생애최초 아님 → 미자격', () => {
    const result = checkAllPolicyBenefits({ ...baseInput, isFirstTimeBuyer: false });
    const benefit = result.ineligible.find((b) => b.name === '생애최초 취득세 감면');
    expect(benefit).toBeDefined();
    expect(benefit!.reason).toContain('생애최초');
  });

  it('매매가 12억 초과 → 미자격', () => {
    const result = checkAllPolicyBenefits({ ...baseInput, purchasePrice: 120001 });
    const benefit = result.ineligible.find((b) => b.name === '생애최초 취득세 감면');
    expect(benefit).toBeDefined();
    expect(benefit!.reason).toContain('12억');
  });
});

// ──────────────────────────────────────────────
// 7. 신혼부부 전용 구입자금
// ──────────────────────────────────────────────

describe('신혼부부 전용 구입자금', () => {
  const newlywedInput: PolicyBenefitInput = {
    ...baseInput,
    isNewlywed: true,
    annualIncome: 8000,
    purchasePrice: 80000,
  };

  it('신혼부부 + 소득 8.5천 이하 + 매매가 9억 이하 → 자격 충족', () => {
    const result = checkAllPolicyBenefits(newlywedInput);
    const benefit = result.eligible.find((b) => b.name === '신혼부부 전용 구입자금');
    expect(benefit).toBeDefined();
    expect(benefit!.maxLoanAmount).toBe(40000);
  });

  it('신혼부부 아님 → 미자격', () => {
    const result = checkAllPolicyBenefits({ ...newlywedInput, isNewlywed: false });
    const benefit = result.ineligible.find((b) => b.name === '신혼부부 전용 구입자금');
    expect(benefit).toBeDefined();
    expect(benefit!.reason).toContain('신혼부부');
  });

  it('소득 8.5천 초과 → 미자격', () => {
    const result = checkAllPolicyBenefits({ ...newlywedInput, annualIncome: 8501 });
    const benefit = result.ineligible.find((b) => b.name === '신혼부부 전용 구입자금');
    expect(benefit).toBeDefined();
    expect(benefit!.reason).toContain('8,500만');
  });

  it('매매가 9억 초과 → 미자격', () => {
    const result = checkAllPolicyBenefits({ ...newlywedInput, purchasePrice: 90001 });
    const benefit = result.ineligible.find((b) => b.name === '신혼부부 전용 구입자금');
    expect(benefit).toBeDefined();
    expect(benefit!.reason).toContain('9억');
  });
});

// ──────────────────────────────────────────────
// 통합 테스트
// ──────────────────────────────────────────────

describe('통합 결과', () => {
  it('월 절약액이 양수이고 정확히 계산된다', () => {
    const result = checkAllPolicyBenefits(baseInput);
    const loanBenefits = result.eligible.filter((b) => b.category === 'loan');

    for (const benefit of loanBenefits) {
      if (benefit.maxLoanAmount > 0) {
        expect(benefit.monthlySavings).toBeGreaterThan(0);
      }
    }
  });

  it('bestLoan은 월 절약액이 가장 큰 대출이다', () => {
    const result = checkAllPolicyBenefits(baseInput);
    if (result.bestLoan) {
      const loanBenefits = result.eligible.filter((b) => b.category === 'loan');
      const maxSavings = Math.max(
        ...loanBenefits.map((b) => b.monthlySavings ?? 0),
      );
      expect(result.bestLoan.monthlySavings).toBe(maxSavings);
    }
  });

  it('totalMonthlySavings는 모든 자격 혜택 절약액 합산이다', () => {
    const result = checkAllPolicyBenefits(baseInput);
    const manualSum = result.eligible.reduce(
      (sum, b) => sum + (b.monthlySavings ?? 0),
      0,
    );
    expect(result.totalMonthlySavings).toBeCloseTo(manualSum, 1);
  });

  it('모든 정책이 미자격인 경우', () => {
    const result = checkAllPolicyBenefits({
      ...baseInput,
      numberOfHomes: 3,
      isFirstTimeBuyer: false,
      isNewlywed: false,
      hasChildren: false,
      annualIncome: 20000,
      purchasePrice: 200000,
      age: 50,
    });
    expect(result.eligible).toHaveLength(0);
    expect(result.bestLoan).toBeNull();
    expect(result.totalMonthlySavings).toBe(0);
  });

  it('소득 경계값 정확히 일치 시 자격 충족 (디딤돌 6000)', () => {
    const result = checkAllPolicyBenefits({
      ...baseInput,
      isFirstTimeBuyer: false,
      annualIncome: 6000,
    });
    const benefit = result.eligible.find((b) => b.name === '디딤돌 대출');
    expect(benefit).toBeDefined();
  });

  it('eligible + ineligible 합계가 전체 정책 수(7)와 일치', () => {
    const result = checkAllPolicyBenefits(baseInput);
    expect(result.eligible.length + result.ineligible.length).toBe(7);
  });
});
