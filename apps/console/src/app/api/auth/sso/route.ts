import { type NextRequest, NextResponse } from 'next/server'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'

interface SSOLoginRequest {
  organization_id: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SSOLoginRequest = await request.json()

    if (!body.organization_id) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 })
    }

    const ssoData = await secureFetch(`${process.env.API_REST_URL}/v1/sso/login`, {
      method: 'POST',
      body: JSON.stringify({
        organization_id: body.organization_id,
      }),
    })

    const fetchedData = await ssoData.json()

    if (ssoData.ok && fetchedData.success) {
      const response = NextResponse.json(fetchedData, { status: ssoData.status })

      const responseCookies = ssoData.headers.get('set-cookie')
      if (responseCookies) {
        const cookieStrings = responseCookies.split(/,(?=\s*[a-zA-Z0-9_-]+=)/)

        for (const cookieString of cookieStrings) {
          const cookieParts = cookieString.trim().split(';')[0]?.split('=')
          if (cookieParts && cookieParts.length === 2) {
            const [name, value] = cookieParts
            response.cookies.set(name, value, {
              httpOnly: true,
              secure: true,
              sameSite: 'lax',
              path: '/',
              maxAge: 60,
            })
          }
        }
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
