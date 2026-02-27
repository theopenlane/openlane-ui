import { auth } from '@/lib/auth/auth'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { isDevelopment, openlaneAPIUrl } from '@repo/dally/auth'
import { NextRequest, NextResponse } from 'next/server'

type AuthType = 'oauth2' | 'oidc' | 'githubapp' | string

type StartBody = {
  provider?: string
  authType?: AuthType
  startPath?: string
  callbackPath?: string
  scopes?: string[]
  redirectUri?: string
  appSlug?: string
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const token = session?.user?.accessToken

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json().catch(() => ({}))) as StartBody

    const provider = body.provider?.trim()
    const authType = body.authType
    const scopes = body.scopes ?? []
    const startPath = body.startPath?.trim()
    const callbackPath = body.callbackPath?.trim()

    if (!startPath) {
      return NextResponse.json({ error: 'Missing provider auth start path' }, { status: 400 })
    }

    const redirectUri = resolveRedirectURI(callbackPath, body.redirectUri)
    const startPayload = buildStartPayload({
      provider,
      authType,
      scopes,
      redirectUri,
      appSlug: body.appSlug,
    })

    const res = await secureFetch(`${openlaneAPIUrl}${startPath}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(startPayload),
    })

    // get cookies so they can be set for the call-back
    const cookieHeader = res.headers.get('set-cookie')
    const flowCookies = getIntegrationFlowCookies(cookieHeader)

    let response: NextResponse

    if (!res.ok) {
      const json = await res.json().catch(async () => {
        const text = await res.text().catch(() => '')
        return { error: text || 'Failed to initialize integration auth flow' }
      })
      response = NextResponse.json(json, { status: res.status })
    } else {
      const json = await res.json()
      response = NextResponse.json(json)
    }

    setIntegrationFlowCookies(flowCookies, response)

    return response
  } catch (error) {
    console.error('Error starting integration auth flow:', error)
    return NextResponse.json({ error: 'An error occurred while starting integration auth flow' }, { status: 500 })
  }
}

type StartPayloadParams = {
  provider?: string
  authType?: AuthType
  scopes?: string[]
  redirectUri?: string
  appSlug?: string
}

function buildStartPayload({ provider, authType, scopes = [], redirectUri, appSlug }: StartPayloadParams): Record<string, unknown> {
  if (authType === 'oauth2' || authType === 'oidc') {
    const payload: Record<string, unknown> = {
      provider,
      scopes,
    }
    if (redirectUri) {
      payload.redirectUri = redirectUri
    }
    return payload
  }

  if (authType === 'githubapp') {
    const payload: Record<string, unknown> = {}
    if (appSlug) {
      payload.appSlug = appSlug
    }
    if (redirectUri) {
      payload.redirectUri = redirectUri
    }
    return payload
  }

  return {}
}

function resolveRedirectURI(callbackPath?: string, explicitRedirectURI?: string): string | undefined {
  if (explicitRedirectURI?.trim()) {
    return explicitRedirectURI.trim()
  }

  if (callbackPath) {
    return `${openlaneAPIUrl}${callbackPath}`
  }

  return undefined
}

function getIntegrationFlowCookies(cookies: string | null): Map<string, string>[] | undefined {
  if (!cookies) return undefined

  const cookieArray = cookies.split(', ')
  const flowCookies: Map<string, string>[] = []
  for (const cookie of cookieArray) {
    if (cookie.startsWith(`oauth_`) || cookie.startsWith(`githubapp_`)) {
      const key = cookie.split('=')[0]
      const value = cookie.split(key + '=')[1]

      flowCookies.push(new Map([[key, value]]))
    }
  }

  return flowCookies.length > 0 ? flowCookies : undefined
}

function setIntegrationFlowCookies(cookies: Map<string, string>[] | undefined = [], response: NextResponse<unknown>) {
  if (!cookies) {
    return
  }

  let sameSite = 'Lax'
  let secure = false

  if (!isDevelopment) {
    secure = true
    sameSite = 'None'
  }

  const securePart = secure ? '; Secure' : ''

  // Set the cookie using the raw Set-Cookie header to avoid encoding
  for (const cookie of cookies) {
    for (const [key, value] of cookie.entries()) {
      response.headers.append('Set-Cookie', `${key}=${value}; Path=/; SameSite=${sameSite}${securePart}`)
    }
  }
}
