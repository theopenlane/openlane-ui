import { type NextRequest, NextResponse } from 'next/server'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'

interface SSOCallbackRequest {
  code: string
  state: string
  organization_id: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SSOCallbackRequest = await request.json()

    if (!body.code || !body.state || !body.organization_id) {
      return NextResponse.json({ success: false, message: 'Code, state, and organization_id are required' }, { status: 400 })
    }

    const cookies = request.headers.get('cookie')

    // unlike authorize route, it is fine to pass in the cookies here because :
    // 1. state, nonce, token id and organization_id are stored in cookies
    // 2. all other cookies are already removed with parseAndSetResponseCookies from the authorize route so
    // secureFetch uses a fresh csrf one
    const headers: HeadersInit = {
      ...(cookies ? { cookie: cookies } : {}),
    }

    const ssoCallbackData = await secureFetch(`${process.env.API_REST_URL}/v1/sso/callback`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        code: body.code,
        state: body.state,
        organization_id: body.organization_id,
      }),
    })

    const callbackResponse = await ssoCallbackData.json()

    if (ssoCallbackData.ok && callbackResponse.success) {
      try {
        return NextResponse.json(
          {
            success: true,
            ...callbackResponse,
          },
          { status: 200 },
        )
      } catch (error) {
        console.error('error processing SSO authentication:', error)
        return NextResponse.json(
          {
            success: false,
            message: 'Failed to complete SSO authentication',
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: callbackResponse.error || 'SSO callback failed',
      },
      { status: ssoCallbackData.status },
    )
  } catch (error) {
    console.error('SSO callback API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error during SSO callback' }, { status: 500 })
  }
}
