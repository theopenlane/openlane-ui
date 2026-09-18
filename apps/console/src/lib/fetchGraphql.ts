import { fetchCSRFToken, invalidateCSRFToken, isCSRFRejection } from './auth/utils/secure-fetch'
import { csrfCookieName, csrfHeader } from '@repo/dally/auth'
import { getCookie } from './auth/utils/getCookie'
import { clearSSOReauthRequired, getIsSessionInvalid, reportSSORequirementFromResponse } from './auth/utils/session-status'
import { currentAccessToken } from './graphqlClient'

const isFileArray = (value: unknown): value is File[] => Array.isArray(value) && value.length > 0 && value.every((item) => item instanceof File)

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
    } else if (isFileArray(value)) {
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
      } else if (isFileArray(value)) {
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
