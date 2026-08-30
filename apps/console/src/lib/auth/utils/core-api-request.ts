import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { csrfCookieName, openlaneAPIUrl } from '@repo/dally/auth'
import { auth } from '../auth'
import { secureFetch } from './secure-fetch'

export const HTTP_METHODS = {
  GET: 'GET',
  PUT: 'PUT',
  POST: 'POST',
  DELETE: 'DELETE',
} as const

type HttpMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS]

const MAX_LOGGED_BODY_CHARS = 500

const readBodyForLog = async (response: Response): Promise<string> => {
  try {
    const text = await response.text()
    return text.length > MAX_LOGGED_BODY_CHARS ? `${text.slice(0, MAX_LOGGED_BODY_CHARS)}…` : text
  } catch {
    return '<unreadable>'
  }
}

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

  const csrfToken = (await cookies()).get(csrfCookieName)?.value

  const upstreamUrl = `${openlaneAPIUrl}${route}`
  const startedAt = Date.now()

  let response: Response

  try {
    response = await secureFetch(
      upstreamUrl,
      {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        ...(payload !== undefined && { body: JSON.stringify(payload) }),
      },
      { token: csrfToken },
    )
  } catch (error) {
    console.error(
      '[coreAPIRequest] upstream request failed',
      JSON.stringify({
        upstreamUrl,
        method,
        userId: session.user.userId,
        durationMs: Date.now() - startedAt,
        hasCsrfToken: !!csrfToken,
        error: error instanceof Error ? error.message : String(error),
      }),
    )

    throw error
  }

  if (!response.ok) {
    console.error(
      '[coreAPIRequest] upstream error response',
      JSON.stringify({
        upstreamUrl,
        method,
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        upstreamRequestId: response.headers.get('x-request-id'),
        cfRay: response.headers.get('cf-ray'),
        userId: session.user.userId,
        durationMs: Date.now() - startedAt,
        hasCsrfToken: !!csrfToken,
        body: await readBodyForLog(response),
      }),
    )

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
