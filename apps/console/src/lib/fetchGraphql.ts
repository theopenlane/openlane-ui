import { fetchCSRFToken, invalidateCSRFToken, isCSRFRejection } from './auth/utils/secure-fetch'
import { csrfCookieName, csrfHeader } from '@repo/dally/auth'
import { getCookie } from './auth/utils/getCookie'
import { resolveCurrentTokens } from './auth/utils/session-refresh'
import { clearSSOReauthRequired, reportSSORequirementFromResponse } from './auth/utils/session-status'
import type { TokenState } from './auth/utils/session-tokens'
import { sendWithUnauthorizedRecovery } from './auth/utils/unauthorized-recovery'

export const fetchGraphQLWithUpload = async <TResult, TVariables extends object>({ query, variables }: { query: string; variables?: TVariables }): Promise<TResult> => {
  const tokens = await resolveCurrentTokens()

  const headers: Record<string, string> = {}

  let csrfToken = getCookie(csrfCookieName)
  if (!csrfToken) {
    // If CSRF token is not found in cookies, fetch a new one
    csrfToken = await fetchCSRFToken()
  }

  headers[csrfHeader] = csrfToken // Ensure CSRF token is in the headers
  headers['cookie'] = `${csrfCookieName}=${csrfToken}`

  const normalizedVariables = variables ? { ...variables } : {}
  let body: BodyInit
  const formData = new FormData()
  const updatedVariables: Record<string, unknown> = { ...normalizedVariables }

  let hasFile = false
  const fileMap: Record<string, string[]> = {}
  let fileIndex = 0

  // Process variables and detect files
  Object.entries(normalizedVariables).forEach(([key, value]) => {
    if (value instanceof File) {
      // Single file
      hasFile = true
      fileMap[fileIndex] = [`variables.${key}`]
      updatedVariables[key] = null // GraphQL expects null for files
      fileIndex++
    } else if (Array.isArray(value) && value.every((v) => v instanceof File)) {
      // Multiple files
      hasFile = true
      updatedVariables[key] = value.map(() => null) // Replace all files with null in variables
      value.forEach((file, index) => {
        fileMap[fileIndex] = [`variables.${key}.${index}`]
        fileIndex++
      })
    }
  })

  if (hasFile) {
    // **IMPORTANT**: Append `operations` FIRST
    formData.append('operations', JSON.stringify({ query, variables: updatedVariables }))

    // Append `map` SECOND
    formData.append('map', JSON.stringify(fileMap))

    // Append FILES LAST
    fileIndex = 0
    Object.entries(normalizedVariables).forEach(([, value]) => {
      if (value instanceof File) {
        formData.append(fileIndex.toString(), value)
        fileIndex++
      } else if (Array.isArray(value) && value.every((v) => v instanceof File)) {
        value.forEach((file) => {
          formData.append(fileIndex.toString(), file)
          fileIndex++
        })
      }
    })

    body = formData
  } else {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify({ query, variables: normalizedVariables })
  }

  const endpoint = process.env.NEXT_PUBLIC_API_GQL_URL ?? ''

  // Same layering as the GraphQL client. Before this, an upload that outlived its session
  // cookie surfaced the 401 as an unreadable JSON parse error.
  const send = async (attemptTokens: TokenState) => {
    headers['Authorization'] = `Bearer ${attemptTokens.accessToken}`

    const post = async () =>
      await fetch(endpoint, {
        method: 'POST',
        headers,
        body,
        credentials: 'include',
      })

    const attempt = await post()

    if (!(await isCSRFRejection(attempt))) {
      return attempt
    }

    invalidateCSRFToken()
    const freshCSRFToken = await fetchCSRFToken()
    headers[csrfHeader] = freshCSRFToken
    headers['cookie'] = `${csrfCookieName}=${freshCSRFToken}`

    return await post()
  }

  const response = await sendWithUnauthorizedRecovery(tokens, send)

  if (response.ok) {
    clearSSOReauthRequired()
  } else if (await reportSSORequirementFromResponse(response)) {
    throw new Error('SSO re-authentication required')
  }

  let result: { errors?: unknown; data: TResult }

  try {
    result = await response.json()
  } catch (error) {
    throw new Error(`GraphQL upload failed with status ${response.status}`, { cause: error })
  }

  if (result.errors) throw result.errors

  return result.data
}
