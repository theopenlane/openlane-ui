import { auth } from '@/lib/auth/auth'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { openlaneAPIUrl } from '@repo/dally/auth'
import { type NextRequest, NextResponse } from 'next/server'
import { appendSetCookieHeaders, parseProxyResponse } from './proxy-response'

type StartRequestBody = {
  startPath?: string
  body?: Record<string, unknown>
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const token = session?.user?.accessToken

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = (await request.json()) as StartRequestBody
    const startPath = payload.startPath?.trim()

    if (!startPath) {
      return NextResponse.json({ error: 'Missing integration auth start path' }, { status: 400 })
    }

    const upstreamResponse = await secureFetch(resolveIntegrationStartURL(startPath), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload.body ?? {}),
    })

    const rawBody = await upstreamResponse.text()
    const response = parseProxyResponse(rawBody, upstreamResponse.status, upstreamResponse.ok, 'Failed to initialize integration auth flow')

    appendSetCookieHeaders(upstreamResponse.headers, response)

    return response
  } catch (error) {
    console.error('Error starting integration auth flow:', error)
    return NextResponse.json({ error: 'An error occurred while starting integration auth flow' }, { status: 500 })
  }
}

function resolveIntegrationStartURL(startPath: string): string {
  try {
    return new URL(startPath).toString()
  } catch {
    return new URL(startPath, openlaneAPIUrl).toString()
  }
}
