import { type NextRequest, NextResponse } from 'next/server'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { parseAndSetResponseCookies } from '@/lib/auth/utils/parse-response-cookies'

interface SSOLoginRequest {
  organization_id: string
  is_test?: boolean
}

// is_test cookie is for sso being tested before enforcement
const ssoOnlyTokens = new Set(['state', 'nonce', 'is_test'])

export async function POST(request: NextRequest) {
  try {
    const body: SSOLoginRequest = await request.json()

    if (!body.organization_id) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 })
    }

    const ssoData = await secureFetch(`${process.env.API_REST_URL}/v1/sso/login`, {
      method: 'POST',
      body: JSON.stringify({
        ...body,
      }),
    })

    const fetchedData = await ssoData.json()

    if (ssoData.ok && fetchedData.success) {
      const response = NextResponse.json(fetchedData, { status: ssoData.status })

      const responseCookies = ssoData.headers.get('set-cookie')
      if (responseCookies) {
        // ignore other cookies
        // old csrf token was being stored again in csrf cookies
        // thus making secureFetch in sso/callback/route ignore fetching a new one
        parseAndSetResponseCookies(response, responseCookies, ssoOnlyTokens)
      }

      return response
    }

    if (ssoData.ok && fetchedData.success === false) {
      return NextResponse.json(
        {
          success: false,
          message: fetchedData.error || 'SSO login failed',
        },
        { status: 400 },
      )
    }

    return NextResponse.json(fetchedData, { status: ssoData.status })
  } catch (error) {
    console.error('SSO login error:', error)
    return NextResponse.json({ success: false, message: 'Could not login with SSO' }, { status: 500 })
  }
}
