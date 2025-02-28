// fetchGraphQLWithUpload.ts
import { getSession } from 'next-auth/react'
import { ensureAuth } from './auth/utils/tokenValidator'

export const fetchGraphQLWithUpload = async ({ query, variables = {} }: { query: string; variables?: Record<string, any> }) => {
  const session = await getSession()

  const accessToken = await ensureAuth(session)
  if (!accessToken) {
    throw new Error('Unauthenticated: no valid token')
  }

  const headers: HeadersInit = {
    Authorization: `Bearer ${accessToken}`,
  }

  const hasFile = Object.values(variables).some((val) => val instanceof File)
  let body: BodyInit

  if (hasFile) {
    const formData = new FormData()
    const updatedVariables = { ...variables }
    Object.keys(updatedVariables).forEach((key) => {
      if (updatedVariables[key] instanceof File) {
        updatedVariables[key] = null
      }
    })

    formData.append('operations', JSON.stringify({ query, variables: updatedVariables }))

    const fileMap: Record<string, string[]> = {}
    let fileIndex = 0
    Object.entries(variables).forEach(([key, value]) => {
      if (value instanceof File) {
        fileMap[fileIndex] = [`variables.${key}`]
        fileIndex++
      }
    })
    formData.append('map', JSON.stringify(fileMap))

    fileIndex = 0
    Object.entries(variables).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(fileIndex.toString(), value)
        fileIndex++
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
