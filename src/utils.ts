import type { BreaseResponse } from './types.js';
import { BreaseFetchError } from './errors.js';

/**
 * Throws BreaseFetchError on failure, returns data on success.
 * In Next.js ISR pages, this makes failed revalidations preserve the stale cache.
 */
export function ensureSuccess<T>(result: BreaseResponse<T>): T {
  if (result.success) return result.data;
  throw new BreaseFetchError(result.error, result.status, result.endpoint);
}
