import { type NextRequest, NextResponse } from 'next/server'
import { openlaneAPIUrl } from '@repo/dally/auth'
import { auth } from '../auth'
import { secureFetch } from './secure-fetch'

export const HTTP_METHODS = {
  GET: 'GET',
  PUT: 'PUT',
  POST: 'POST',
  DELETE: 'DELETE',
} as const

type HttpMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS]

// coreAPIRequest is a wrapper to make API requests to the core REST API that returns the payload
export async function coreAPIRequest(route: string, method: HttpMethod, req?: NextRequest, errorMsg?: string): Promise<NextResponse> {
  const session = await auth()

  if (!session?.user?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (route === '') {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }

  const accessToken = session.user.accessToken
  let payload: unknown
  if (method !== HTTP_METHODS.GET && req) {
    try {
      payload = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
  }

  if (!route.startsWith('/')) {
    route = '/' + route
  }

  const response = await secureFetch(`${openlaneAPIUrl}${route}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    ...(payload !== undefined && { body: JSON.stringify(payload) }),
  })

  if (!response.ok) {
    return NextResponse.json({ error: errorMsg ?? 'Failed to fetch' }, { status: response.status })
  }

  let data: unknown
  try {
    data = await response.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON response' }, { status: 500 })
  }

  return NextResponse.json(data, { status: response.status })
}
