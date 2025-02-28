import { getSession } from 'next-auth/react'

export const fetchGraphQL = async ({ query, variables = {} }: { query: string; variables?: any }) => {
  const session = await getSession()

  console.log('Sending GraphQL Request:', { query, variables })

  let headers: HeadersInit = {
    Authorization: `Bearer ${session?.user?.accessToken}`,
  }

  let body: BodyInit

  const hasFile = Object.values(variables).some((value) => value instanceof File)

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
