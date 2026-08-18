// Map over items with a fixed number of workers, preserving input order. Keeps
// a fan-out from opening an unbounded number of connections at once
export const mapWithConcurrency = async <T, R>(items: T[], limit: number, run: (item: T) => Promise<R>): Promise<R[]> => {
  const results: R[] = new Array(items.length)
  let cursor = 0
  const workerCount = items.length === 0 ? 0 : Math.max(1, Math.min(Math.floor(limit), items.length))
  const workers = Array.from({ length: workerCount }, async () => {
    for (let index = cursor++; index < items.length; index = cursor++) {
      results[index] = await run(items[index])
    }
  })
  await Promise.all(workers)
  return results
}
