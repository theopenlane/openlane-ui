import { type NextRequest, NextResponse } from 'next/server'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { parseAndSetResponseCookies, supportOnlyCookies } from '@/lib/auth/utils/parse-response-cookies'

interface SupportLoginRequest {
  email: string
  password: string
  target_organization_id: string
  reason: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SupportLoginRequest = await request.json()

    if (!body.email || !body.password || !body.target_organization_id || !body.reason) {
      return NextResponse.json({ success: false, message: 'email, password, target_organization_id, and reason are required' }, { status: 400 })
    }

    const loginData = await secureFetch(`${process.env.API_REST_URL}/v1/login`, {
      method: 'POST',
      body: JSON.stringify({
        username: body.email,
        password: body.password,
        target_organization_id: body.target_organization_id,
        reason: body.reason,
      }),
    })

    const fetchedData = await loginData.json()

    if (loginData.ok && fetchedData.success && fetchedData.redirect_uri) {
      const response = NextResponse.json(fetchedData, { status: loginData.status })

      const responseCookies = loginData.headers.get('set-cookie')
      if (responseCookies) {
        parseAndSetResponseCookies(response, responseCookies, supportOnlyCookies)
      }

      return response
    }

    return NextResponse.json(
      {
        success: false,
        message: fetchedData.error || 'Support login failed',
      },
      { status: loginData.ok ? 400 : loginData.status },
    )
  } catch (error) {
    console.error('Support login error:', error)
    return NextResponse.json({ success: false, message: 'Could not start support login' }, { status: 500 })
  }
}
