import { fetchCSRFToken, invalidateCSRFToken, isCSRFRejection } from './auth/utils/secure-fetch'
import { csrfCookieName, csrfHeader } from '@repo/dally/auth'
import { getCookie } from './auth/utils/getCookie'
import { clearSSOReauthRequired, getIsSessionInvalid, reportSSORequirementFromResponse } from './auth/utils/session-status'
import { currentAccessToken } from './graphqlClient'
import { buildGraphQLRequestBody } from '@repo/dally/graphql-body'

export const fetchGraphQLWithUpload = async <TVariables extends object>({ query, variables }: { query: string; variables?: TVariables }) => {
  if (getIsSessionInvalid()) {
    throw new Error('Session expired')
  }

  const accessToken = await currentAccessToken()

  const headers: HeadersInit = {
    Authorization: `Bearer ${accessToken}`,
  }

  let csrfToken = getCookie(csrfCookieName)
  if (!csrfToken) {
    // If CSRF token is not found in cookies, fetch a new one
    csrfToken = await fetchCSRFToken()
  }

  headers[csrfHeader] = csrfToken // Ensure CSRF token is in the headers
  headers['cookie'] = `${csrfCookieName}=${csrfToken}`

  const { body, isMultipart } = buildGraphQLRequestBody(query, variables)
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json'
  }

  const endpoint = process.env.NEXT_PUBLIC_API_GQL_URL ?? ''

  const post = async () =>
    await fetch(endpoint, {
      method: 'POST',
      headers,
      body,
      credentials: 'include',
    })

  let response = await post()

  if (await isCSRFRejection(response)) {
    invalidateCSRFToken()
    const freshCSRFToken = await fetchCSRFToken()
    headers[csrfHeader] = freshCSRFToken
    headers['cookie'] = `${csrfCookieName}=${freshCSRFToken}`
    response = await post()
  }

  if (response.ok) {
    clearSSOReauthRequired()
  } else if (await reportSSORequirementFromResponse(response)) {
    throw new Error('SSO re-authentication required')
  }

  const result = await response.json()
  if (result.errors) throw result.errors
  return result.data
}
