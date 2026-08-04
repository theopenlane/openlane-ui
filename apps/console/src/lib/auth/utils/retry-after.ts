// Delay used when the server sends no usable Retry-After, and the floor of every parsed value:
// a backend that just rate-limited us asking to be hit again in 1s is the storm we are avoiding.
const DEFAULT_RETRY_MS = 5_000
// Upper bound, so `Retry-After: 3600` cannot park the app for an hour. Also normalizes the
// HTTP-date branch, where `timestamp - Date.now()` may be negative or enormous.
const MAX_RETRY_MS = 60_000

const clampRetry = (ms: number) => Math.min(Math.max(ms, DEFAULT_RETRY_MS), MAX_RETRY_MS)

export const parseRetryAfter = (value: string | null): number => {
  if (!value) {
    return DEFAULT_RETRY_MS
  }

  const seconds = Number(value)
  if (Number.isFinite(seconds)) {
    return clampRetry(seconds * 1000)
  }

  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? DEFAULT_RETRY_MS : clampRetry(timestamp - Date.now())
}
