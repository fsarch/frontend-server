/**
 * Runs `fn` for every item in `items`, allowing at most `concurrency` calls
 * to be in flight at the same time. As soon as one call finishes, the next
 * queued item starts immediately - unlike chunking into fixed-size batches,
 * slow items don't hold up unrelated fast ones that were queued after them.
 */
export default async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const worker = async (): Promise<void> => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await fn(items[index], index);
    }
  };

  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return results;
}