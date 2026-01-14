import { auth } from '@/lib/auth/auth'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { isDevelopment } from '@repo/dally/auth'
import { NextRequest, NextResponse } from 'next/server'

type StartBody = {
  provider?: string
  scopes?: string[]
  redirect_uri?: string
}

export async function POST(req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_OPENLANE_URL
  const session = await auth()
  const token = session?.user?.accessToken

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json().catch(() => ({}))) as StartBody

  const provider = body.provider
  const scopes = body.scopes
  const redirect_uri = `${base}/v1/integrations/oauth/callback`

  const res = await secureFetch(`${base}/v1/integrations/oauth/start`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ provider, scopes, redirect_uri }),
  })

  // get cookies so they can be set for the call-back
  const cookieHeader = res.headers.get('set-cookie')
  const oauthCookies = await getOauthCookies(cookieHeader)

  let response: NextResponse

  if (!res.ok) {
    const msg = await res.text()
    response = NextResponse.json({ error: msg || 'Failed to start OAuth' }, { status: res.status })
  } else {
    const json = await res.json()
    response = NextResponse.json(json)
  }

  await setOauthCookies(oauthCookies, response)

  return response
}

export const getOauthCookies = async (cookies: string | null): Promise<Map<string, string>[] | undefined> => {
  if (!cookies) return undefined

  const cookieArray = cookies.split(', ')
  const oauthCookies: Map<string, string>[] = []
  for (const cookie of cookieArray) {
    if (cookie.startsWith(`oauth_`)) {
      const key = cookie.split('=')[0]
      const value = cookie.split(key + '=')[1]

      oauthCookies.push(new Map([[key, value]]))
    }
  }

  return oauthCookies.length > 0 ? oauthCookies : undefined
}
export const setOauthCookies = async (cookies: Map<string, string>[] | undefined = [], response: NextResponse<unknown>) => {
  if (!cookies) {
    return
  }

  let sameSite = 'Lax'
  let secure = false

  if (!isDevelopment) {
    secure = true
    sameSite = 'None'
  }

  // Set the cookie using the raw Set-Cookie header to avoid encoding
  for (const cookie of cookies) {
    for (const [key, value] of cookie.entries()) {
      response.headers.append('Set-Cookie', `${key}=${value}; Path=/; SameSite=${sameSite}; Secure=${secure}`)
    }
  }
}
