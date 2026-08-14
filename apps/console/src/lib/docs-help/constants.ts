// Limits and tuning for the docs-help retrieval pipeline
export const MAX_QUERY_CHARS = 2000
export const MAX_PREFER_CHARS = 200
export const MAX_CONTEXT_CHARS = 12000
export const SUMMARY_CHUNK_LIMIT = 4
export const NO_ANSWER = 'NO_ANSWER'

// a screenful of rows; more than this and the caller should paginate
export const MAX_BATCH_ITEMS = 40
// retrievals run concurrently, but not so many that the vertex client starves
export const BATCH_CONCURRENCY = 6
// whole-page modes must reach past the default handful of chunks
export const DEEP_RETRIEVAL_TOP_K = 50

export const SECTION_CACHE_MAX = 500
export const SECTION_CACHE_TTL_MS = 60 * 60 * 1000
