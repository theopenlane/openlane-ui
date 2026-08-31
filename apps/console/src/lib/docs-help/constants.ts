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
export const DEFAULT_RETRIEVAL_TOP_K = 8

// public representation drafting: how much of each source field reaches the model,
// and how far a draft may run past the length of the control it describes
export const MAX_REQUIREMENT_CHARS = 4000
export const MAX_IMPLEMENTATION_CHARS = 1500
export const MAX_EXISTING_CHARS = 2000
export const MAX_SUGGESTION_SOURCES = 20
export const DEFAULT_REPRESENTATION_TARGET = 800
export const REPRESENTATION_LENGTH_MULTIPLIER = 2
export const MAX_REPRESENTATION_TOKENS = 600

export const SECTION_CACHE_MAX = 500
export const SECTION_CACHE_TTL_MS = 60 * 60 * 1000
