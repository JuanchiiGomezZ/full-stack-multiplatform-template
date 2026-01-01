/**
 * Async utility functions
 * Generic async helpers for any project
 */

/**
 * Sleep/delay for specified milliseconds
 * @example await sleep(1000) // Wait 1 second
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async operation with exponential backoff
 * @example await retry(() => fetchData(), { attempts: 3, delay: 1000 })
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    attempts?: number;
    delay?: number;
    backoff?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {},
): Promise<T> {
  const { attempts = 3, delay = 1000, backoff = 2, onRetry } = options;

  let lastError: Error = new Error('Unknown error');

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === attempts) {
        throw lastError;
      }

      onRetry?.(lastError, attempt);
      await sleep(delay * Math.pow(backoff, attempt - 1));
    }
  }

  throw lastError;
}

/**
 * Wrap a promise with a timeout
 * Rejects if the promise doesn't resolve within the specified time
 * @example await timeout(fetchData(), 5000) // 5 second timeout
 */
export async function timeout<T>(
  promise: Promise<T>,
  ms: number,
  message = 'Operation timed out',
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

/**
 * Split array into chunks for batch processing
 * @example chunk([1,2,3,4,5], 2) => [[1,2], [3,4], [5]]
 */
export function chunk<T>(array: T[], size: number): T[][] {
  if (size <= 0) throw new Error('Chunk size must be greater than 0');

  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Process items in parallel with concurrency limit
 * @example await parallelLimit(items, 5, async (item) => process(item))
 */
export async function parallelLimit<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let currentIndex = 0;

  async function worker(): Promise<void> {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      results[index] = await fn(items[index], index);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  );

  await Promise.all(workers);
  return results;
}

/**
 * Execute promises sequentially
 * @example await sequential([() => task1(), () => task2()])
 */
export async function sequential<T>(tasks: (() => Promise<T>)[]): Promise<T[]> {
  const results: T[] = [];
  for (const task of tasks) {
    results.push(await task());
  }
  return results;
}

/**
 * Debounce async function - only execute after delay with no new calls
 */
export function debounceAsync<
  T extends (...args: unknown[]) => Promise<unknown>,
>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingPromise: Promise<Awaited<ReturnType<T>>> | null = null;
  let resolve: ((value: Awaited<ReturnType<T>>) => void) | null = null;
  let reject: ((error: Error) => void) | null = null;

  return (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (!pendingPromise) {
      pendingPromise = new Promise<Awaited<ReturnType<T>>>((res, rej) => {
        resolve = res;
        reject = rej;
      });
    }

    timeoutId = setTimeout(() => {
      void (async () => {
        try {
          const result = await fn(...args);
          resolve?.(result as Awaited<ReturnType<T>>);
        } catch (error) {
          reject?.(error instanceof Error ? error : new Error(String(error)));
        } finally {
          pendingPromise = null;
          resolve = null;
          reject = null;
        }
      })();
    }, delay);

    return pendingPromise;
  };
}

/**
 * Memoize async function results
 */
export function memoizeAsync<T extends (...args: string[]) => Promise<unknown>>(
  fn: T,
  ttl?: number,
): T {
  const cache = new Map<string, { value: unknown; expires: number }>();

  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);

    if (cached && (!ttl || cached.expires > Date.now())) {
      return cached.value as ReturnType<T>;
    }

    const result = await fn(...args);
    cache.set(key, {
      value: result,
      expires: ttl ? Date.now() + ttl : Infinity,
    });

    return result as ReturnType<T>;
  }) as T;
}
