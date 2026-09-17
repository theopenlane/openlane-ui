import type { JWT } from '@auth/core/jwt'
import { fetchNewAccessToken, type RefreshResult } from './refresh-token'
import { ACCESS_REFRESH_FALLBACK_BUFFER_MS, CLOCK_SKEW_MS, decodeTimeClaims, type TimeClaims } from './token-claims'

const inFlightRefreshes = new Map<string, Promise<RefreshResult>>()

const refreshOnce = (refreshToken: string): Promise<RefreshResult> => {
  const existing = inFlightRefreshes.get(refreshToken)

  if (existing) {
    return existing
  }

  const request = fetchNewAccessToken(refreshToken).finally(() => {
    inFlightRefreshes.delete(refreshToken)
  })

  inFlightRefreshes.set(refreshToken, request)

  return request
}

const isRefreshDue = (access: TimeClaims, refresh: TimeClaims, now: number): boolean => {
  if (refresh.nbf) {
    return now >= refresh.nbf * 1000 + CLOCK_SKEW_MS
  }

  return !!access.exp && now >= access.exp * 1000 - ACCESS_REFRESH_FALLBACK_BUFFER_MS
}

// refreshSessionToken keeps the session token pair current, returning null once the refresh token is spent
export const refreshSessionToken = async (token: JWT): Promise<JWT | null> => {
  const { accessToken, refreshToken } = token

  if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
    return token
  }

  const access = decodeTimeClaims(accessToken)
  const refresh = decodeTimeClaims(refreshToken)

  if (!access || !refresh) {
    return token
  }

  const now = Date.now()

  if (refresh.exp && now >= refresh.exp * 1000) {
    const pending = inFlightRefreshes.get(refreshToken)

    if (!pending) {
      return null
    }

    const pendingResult = await pending

    return pendingResult.status === 'ok' ? { ...token, accessToken: pendingResult.tokens.accessToken, refreshToken: pendingResult.tokens.refreshToken } : null
  }

  if (!isRefreshDue(access, refresh, now)) {
    return token
  }

  const result = await refreshOnce(refreshToken)

  switch (result.status) {
    case 'ok':
      return { ...token, accessToken: result.tokens.accessToken, refreshToken: result.tokens.refreshToken }
    case 'rejected':
      return null
    default:
      return token
  }
}
