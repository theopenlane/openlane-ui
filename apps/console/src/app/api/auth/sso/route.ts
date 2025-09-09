import { type NextRequest, NextResponse } from 'next/server'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'

interface SSOLoginRequest {
  organization_id: string
  return: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SSOLoginRequest = await request.json()

    if (!body.organization_id) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 })
    }

    const cookies = request.headers.get('cookie')
    console.log('Incoming cookies for SSO login:', cookies)

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(cookies ? { cookie: cookies } : {}),
    }

    const ssoData = await secureFetch(`${process.env.API_REST_URL}/v1/sso/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        organization_id: body.organization_id,
        return: body.return,
      }),
    })

    const fetchedData = await ssoData.json()

    if (ssoData.ok && fetchedData.success) {
      return NextResponse.json(fetchedData, { status: 200 })
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
