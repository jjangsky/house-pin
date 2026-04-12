/**
 * 동시성 제한 유틸리티
 * Promise 배열을 최대 limit개씩 병렬 실행
 */
export async function parallelLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
): Promise<PromiseSettledResult<T>[]> {
  if (limit < 1) {
    throw new Error('parallelLimit: limit must be >= 1');
  }

  const results: PromiseSettledResult<T>[] = [];

  for (let i = 0; i < tasks.length; i += limit) {
    const batch = tasks.slice(i, i + limit);
    const batchResults = await Promise.allSettled(batch.map((fn) => fn()));
    results.push(...batchResults);
  }

  return results;
}
