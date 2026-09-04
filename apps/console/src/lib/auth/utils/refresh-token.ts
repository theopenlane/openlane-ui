import { openlaneAPIUrl } from '@repo/dally/auth'
import { secureFetch } from './secure-fetch'
import { parseRetryAfter } from './retry-after'
import { readSSORequirement, type SSORequirement } from './sso-required'

export interface Tokens {
  accessToken: string
  refreshToken: string
}

export type RefreshResult = { status: 'ok'; tokens: Tokens } | { status: 'rejected' } | { status: 'sso-required'; requirement: SSORequirement } | { status: 'unavailable'; retryAfterMs: number }

export const fetchNewAccessToken = async (refreshToken: string): Promise<RefreshResult> => {
  let response: Response

  try {
    response = await secureFetch(`${openlaneAPIUrl}/v1/refresh`, {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
  } catch (error) {
    console.error('Refresh token request failed:', error)
    return { status: 'unavailable', retryAfterMs: parseRetryAfter(null) }
  }

  if (response.status === 429 || response.status >= 500) {
    console.error(`Refresh endpoint unavailable. Status: ${response.status}`)
    return { status: 'unavailable', retryAfterMs: parseRetryAfter(response.headers.get('retry-after')) }
  }

  if (!response.ok) {
    console.error(`Failed to refresh access token. Status: ${response.status}`)

    const ssoRequirement = await readSSORequirement(response)

    if (ssoRequirement) {
      return { status: 'sso-required', requirement: ssoRequirement }
    }

    return { status: 'rejected' }
  }

  try {
    const data = await response.json()

    if (!data?.access_token) {
      return { status: 'rejected' }
    }

    return { status: 'ok', tokens: { accessToken: data.access_token, refreshToken: data.refresh_token } }
  } catch (error) {
    console.error('Refresh token response was not valid JSON:', error)
    return { status: 'unavailable', retryAfterMs: parseRetryAfter(null) }
  }
}
