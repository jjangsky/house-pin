import { describe, it, expect } from 'vitest';

import { parallelLimit } from './concurrency';

describe('parallelLimit', () => {
  it('모든 태스크의 결과를 반환한다', async () => {
    const tasks = [
      () => Promise.resolve(1),
      () => Promise.resolve(2),
      () => Promise.resolve(3),
    ];

    const results = await parallelLimit(tasks, 2);

    expect(results).toHaveLength(3);
    expect(results.map((r) => (r as PromiseFulfilledResult<number>).value)).toEqual([1, 2, 3]);
  });

  it('빈 태스크 배열을 처리한다', async () => {
    const results = await parallelLimit([], 5);
    expect(results).toEqual([]);
  });

  it('실패한 태스크를 rejected로 반환한다', async () => {
    const tasks = [
      () => Promise.resolve('ok'),
      () => Promise.reject(new Error('fail')),
      () => Promise.resolve('ok2'),
    ];

    const results = await parallelLimit(tasks, 3);

    expect(results[0].status).toBe('fulfilled');
    expect(results[1].status).toBe('rejected');
    expect(results[2].status).toBe('fulfilled');
  });

  it('동시성 제한을 준수한다', async () => {
    let concurrent = 0;
    let maxConcurrent = 0;

    const makeTask = () => async () => {
      concurrent++;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await new Promise((r) => setTimeout(r, 10));
      concurrent--;
      return true;
    };

    const tasks = Array.from({ length: 6 }, makeTask);
    await parallelLimit(tasks, 2);

    expect(maxConcurrent).toBeLessThanOrEqual(2);
  });

  it('limit가 0 이하이면 에러를 던진다', async () => {
    const tasks = [() => Promise.resolve(1)];
    await expect(parallelLimit(tasks, 0)).rejects.toThrow('limit must be >= 1');
    await expect(parallelLimit(tasks, -1)).rejects.toThrow('limit must be >= 1');
  });

  it('limit가 태스크 수보다 큰 경우 정상 동작한다', async () => {
    const tasks = [() => Promise.resolve(1), () => Promise.resolve(2)];
    const results = await parallelLimit(tasks, 100);

    expect(results).toHaveLength(2);
  });

  it('결과 순서가 태스크 순서와 일치한다', async () => {
    const tasks = [
      () => new Promise<string>((r) => setTimeout(() => r('slow'), 30)),
      () => new Promise<string>((r) => setTimeout(() => r('fast'), 5)),
    ];

    const results = await parallelLimit(tasks, 2);

    expect((results[0] as PromiseFulfilledResult<string>).value).toBe('slow');
    expect((results[1] as PromiseFulfilledResult<string>).value).toBe('fast');
  });
});
