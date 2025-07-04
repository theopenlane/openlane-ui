import { getSession } from 'next-auth/react'
import { ensureAuth } from './auth/utils/tokenValidator'
import { appendCookie, fetchCSRFToken, secureFetch } from './auth/utils/secure-fetch'
import { csrfCookieName, csrfHeader } from '@repo/dally/auth'
import { getCookie } from './auth/utils/getCookie'

export const fetchGraphQLWithUpload = async ({ query, variables = {} }: { query: string; variables?: Record<string, any> }) => {
  const session = await getSession()

  const accessToken = await ensureAuth(session)
  if (!accessToken) {
    throw new Error('Unauthenticated: no valid token')
  }

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

  let body: BodyInit
  const formData = new FormData()
  const updatedVariables = { ...variables }

  let hasFile = false
  const fileMap: Record<string, string[]> = {}
  let fileIndex = 0

  // Process variables and detect files
  Object.entries(variables).forEach(([key, value]) => {
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
    Object.entries(variables).forEach(([key, value]) => {
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
    body = JSON.stringify({ query, variables })
  }

  const response = await fetch(process.env.NEXT_PUBLIC_API_GQL_URL!, {
    method: 'POST',
    headers,
    body,
    credentials: 'include',
  })

  const result = await response.json()
  if (result.errors) throw new Error(result.errors[0].message)

  return result.data
}
