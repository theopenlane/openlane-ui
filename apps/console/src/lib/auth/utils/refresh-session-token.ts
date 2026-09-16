import { jwtDecode } from 'jwt-decode'
import type { JWT } from '@auth/core/jwt'
import { fetchNewAccessToken } from './refresh-token'

const ACCESS_REFRESH_BUFFER_MS = 60_000
const CLOCK_SKEW_MS = 30_000

interface TimeClaims {
  exp?: number
  nbf?: number
}

const decodeTimeClaims = (token: string): TimeClaims | null => {
  try {
    return jwtDecode<TimeClaims>(token)
  } catch {
    return null
  }
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
    return null
  }

  if (!access.exp || now < access.exp * 1000 - ACCESS_REFRESH_BUFFER_MS) {
    return token
  }

  if (refresh.nbf && now < refresh.nbf * 1000 + CLOCK_SKEW_MS) {
    return token
  }

  const result = await fetchNewAccessToken(refreshToken)

  switch (result.status) {
    case 'ok':
      return { ...token, accessToken: result.tokens.accessToken, refreshToken: result.tokens.refreshToken }
    case 'rejected':
      return null
    default:
      return token
  }
}
