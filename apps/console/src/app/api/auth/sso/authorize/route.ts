import { auth } from '@/lib/auth/auth'
import { type NextRequest, NextResponse } from 'next/server'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { parseAndSetResponseCookies } from '@/lib/auth/utils/parse-response-cookies'

interface SSOTokenAuthorizeRequest {
  organization_id: string
  token_id: string
  token_type: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SSOTokenAuthorizeRequest = await request.json()

    if (!body.organization_id || !body.token_id || !body.token_type) {
      return NextResponse.json({ error: 'organization_id, token_id, and token_type are all required' }, { status: 400 })
    }

    if (!['api', 'personal'].includes(body.token_type)) {
      return NextResponse.json({ error: 'token_type must be either "api" or "personal"' }, { status: 400 })
    }

    const cookies = request.headers.get('cookie')
    const session = await auth()
    const accessToken = session?.user?.accessToken

    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
    }

    if (cookies) {
      headers['cookie'] = cookies
    }

    const ssoData = await secureFetch(`${process.env.API_REST_URL}/v1/sso/token/authorize`, {
      headers,
      method: 'POST',
      body: JSON.stringify({
        organization_id: body.organization_id,
        token_id: body.token_id,
        token_type: body.token_type,
      }),
    })

    const fetchedData = await ssoData.json()

    if (ssoData.ok && fetchedData.success) {
      const response = NextResponse.json(fetchedData, { status: ssoData.status })

      const responseCookies = ssoData.headers.get('set-cookie')
      if (responseCookies) {
        parseAndSetResponseCookies(response, responseCookies)
      }

      return response
    }

    if (ssoData.ok && !fetchedData.success) {
      return NextResponse.json(
        {
          success: false,
          message: fetchedData.error || 'SSO token authorization failed',
        },
        { status: 400 },
      )
    }

    return NextResponse.json(fetchedData, { status: ssoData.status })
  } catch (error) {
    console.error('SSO token authorization error:', error)
    return NextResponse.json({ success: false, message: 'Could not authorize token with SSO' }, { status: 500 })
  }
}
