import { jwtDecode } from 'jwt-decode'

// How early before exp we refresh, capped. The buffer is 5% of the token's lifetime so short
// tokens do not spend half their life in the refresh window, and never more than this ceiling so
// a 60-minute token does not refresh 3 minutes early. It must cover clock skew plus one refresh
// round-trip: past refreshAt, getUsableTokens stops handing the token out.
const REFRESH_BUFFER_CEILING_MS = 60_000
// Assumed lifetime when the JWT carries exp but no iat, so the real TTL cannot be derived.
// Careful: 5% of this is a 3s buffer — the tightest the formula can produce, in the case where we
// know least about the token. The 401 retry in fetchWithRetry is the net. Using
// REFRESH_BUFFER_CEILING_MS directly when iat is absent would be the more conservative read.
const FALLBACK_TOKEN_TTL_MS = 60_000
export const REFRESH_TOKEN_SKEW_MARGIN_MS = 60_000

export interface TokenState {
  accessToken: string
  refreshToken: string
  issuedAt: number
  refreshAt: number
}

let tokenState: TokenState | null = null
let generation = 0

const toTokenState = (accessToken: string, refreshToken: string): TokenState => {
  const { iat, exp } = jwtDecode<{ iat?: number; exp?: number }>(accessToken)
  const issuedAt = iat ?? 0

  if (!exp) {
    return { accessToken, refreshToken, issuedAt, refreshAt: Number.POSITIVE_INFINITY }
  }

  const ttlMs = iat ? (exp - iat) * 1000 : FALLBACK_TOKEN_TTL_MS
  return { accessToken, refreshToken, issuedAt, refreshAt: exp * 1000 - Math.min(REFRESH_BUFFER_CEILING_MS, ttlMs * 0.05) }
}

const commit = (next: TokenState | null): TokenState | null => {
  tokenState = next
  generation += 1
  return next
}

const isNewer = (candidate: TokenState, current: TokenState): boolean => candidate.issuedAt > current.issuedAt || (candidate.issuedAt === current.issuedAt && candidate.refreshAt > current.refreshAt)

const mergeRefreshToken = (current: TokenState, refreshToken: string): TokenState => {
  if (!refreshToken || refreshToken === current.refreshToken) {
    return current
  }

  return commit({ ...current, refreshToken }) as TokenState
}

export const setAuthoritativeTokens = (accessToken: string, refreshToken: string): TokenState => {
  if (tokenState?.accessToken === accessToken) {
    return mergeRefreshToken(tokenState, refreshToken)
  }

  return commit(toTokenState(accessToken, refreshToken)) as TokenState
}

export const observeSessionTokens = (accessToken: string, refreshToken: string): TokenState => {
  if (tokenState?.accessToken === accessToken) {
    return mergeRefreshToken(tokenState, refreshToken)
  }

  const candidate = toTokenState(accessToken, refreshToken)

  if (!tokenState || isNewer(candidate, tokenState)) {
    return commit(candidate) as TokenState
  }

  return tokenState
}

export const adoptSessionTokens = (accessToken: string, refreshToken: string): TokenState => {
  if (tokenState?.accessToken === accessToken) {
    return mergeRefreshToken(tokenState, refreshToken)
  }

  const candidate = toTokenState(accessToken, refreshToken)

  if (tokenState && isNewer(tokenState, candidate)) {
    return tokenState
  }

  return commit(candidate) as TokenState
}

export const clearTokens = () => {
  commit(null)
}

export const getTokenGeneration = () => generation

export const getKnownTokens = (): TokenState | null => tokenState

export const readTokenRefreshAt = (accessToken: string): number | null => {
  try {
    return toTokenState(accessToken, '').refreshAt
  } catch {
    return null
  }
}

export const isTokenUsable = (accessToken: string): boolean => {
  const refreshAt = readTokenRefreshAt(accessToken)
  return refreshAt !== null && Date.now() < refreshAt
}

export const getRefreshTokenReadyAt = (refreshToken: string): number | null => {
  try {
    const { nbf } = jwtDecode<{ nbf?: number }>(refreshToken)
    return nbf ? nbf * 1000 + REFRESH_TOKEN_SKEW_MARGIN_MS : null
  } catch {
    return null
  }
}

export const getUsableTokens = (): TokenState | null => (tokenState && Date.now() < tokenState.refreshAt ? tokenState : null)
