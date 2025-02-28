import { getSession } from 'next-auth/react'

export const fetchGraphQL = async ({ query, variables = {} }: { query: string; variables?: any }) => {
  const session = await getSession() // Get auth session

  console.log('Sending GraphQL Request:', { query, variables })

  let headers: HeadersInit = {
    Authorization: `Bearer ${session?.user?.accessToken}`,
  }

  let body: BodyInit

  // 🟢 Check if `variables.avatarFile` exists and is a File
  if (variables.avatarFile instanceof File) {
    const file = variables.avatarFile
    variables.avatarFile = null // GraphQL spec requires setting this to null

    const formData = new FormData()
    formData.append('operations', JSON.stringify({ query, variables }))
    formData.append('map', JSON.stringify({ '1': ['variables.avatarFile'] })) // Correct mapping
    formData.append('1', file) // Key matches the mapping

    body = formData
  } else {
    // Normal GraphQL request
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify({ query, variables })
  }

  const response = await fetch(process.env.NEXT_PUBLIC_API_GQL_URL!, {
    method: 'POST',
    headers,
    body,
    credentials: 'include', // Include cookies for auth
  })

  const result = await response.json()
  if (result.errors) throw new Error(result.errors[0].message)

  return result.data
}
