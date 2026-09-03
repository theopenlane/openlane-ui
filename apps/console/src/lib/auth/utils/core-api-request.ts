import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { csrfCookieName, openlaneAPIUrl } from '@repo/dally/auth'
import { auth } from '../auth'
import { secureFetch } from './secure-fetch'
import { parseSSORequirement, type SSOUnauthorizedBody } from './sso-required'
import { describeToken, sameToken } from './token-claims'

export const HTTP_METHODS = {
  GET: 'GET',
  PUT: 'PUT',
  POST: 'POST',
  DELETE: 'DELETE',
} as const

type HttpMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS]

const MAX_LOGGED_BODY_CHARS = 500

const readBody = async (response: Response): Promise<string> => {
  try {
    return await response.text()
  } catch {
    return '<unreadable>'
  }
}

const truncateForLog = (body: string): string => (body.length > MAX_LOGGED_BODY_CHARS ? `${body.slice(0, MAX_LOGGED_BODY_CHARS)}…` : body)

const parseUnauthorizedBody = (body: string): SSOUnauthorizedBody | null => {
  try {
    const parsed: SSOUnauthorizedBody = JSON.parse(body)
    return parsed
  } catch {
    return null
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
  // This route authenticates with the token from the NextAuth cookie, NOT the one the caller
  // sent. When those differ the caller is usually ahead of us, which is what a stale-session
  // 401 looks like — so record both.
  const callerBearer = req?.headers.get('authorization')?.replace(/^Bearer /i, '')
  const credential = {
    used: describeToken(accessToken),
    callerSentBearer: !!callerBearer,
    callerBearerMatches: sameToken(callerBearer, accessToken),
    callerBearer: callerBearer && !sameToken(callerBearer, accessToken) ? describeToken(callerBearer) : undefined,
  }
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
        redirect: 'manual',
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

  if (response.status >= 300 && response.status < 400) {
    console.error(
      '[coreAPIRequest] upstream redirect not followed',
      JSON.stringify({
        upstreamUrl,
        method,
        status: response.status,
        location: response.headers.get('location'),
        upstreamRequestId: response.headers.get('x-request-id'),
        cfRay: response.headers.get('cf-ray'),
        userId: session.user.userId,
        durationMs: Date.now() - startedAt,
      }),
    )

    return NextResponse.json({ error: errorMsg ?? 'Failed to fetch' }, { status: 502 })
  }

  if (!response.ok) {
    const upstreamBody = await readBody(response)

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
        credential,
        body: truncateForLog(upstreamBody),
      }),
    )

    if (response.status === 401 && credential.used?.expired && credential.callerBearer && !credential.callerBearer.expired) {
      console.error(
        '[coreAPIRequest] the NextAuth session is behind the browser',
        JSON.stringify({
          upstreamUrl,
          sessionToken: credential.used,
          callerToken: credential.callerBearer,
          note: 'the caller had a valid token but this route uses the one in the session cookie, so the write-back from the last refresh did not land',
        }),
      )
    }

    const unauthorizedBody = response.status === 401 ? parseUnauthorizedBody(upstreamBody) : null

    if (unauthorizedBody && parseSSORequirement(unauthorizedBody)) {
      return NextResponse.json(unauthorizedBody, { status: 401 })
    }

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
