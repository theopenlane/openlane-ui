import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { parseAndSetResponseCookies } from '@/lib/auth/utils/parse-response-cookies'
import { TFA_PENDING_COOKIE_NAME } from '@/lib/auth/utils/constants'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const bodyData = await request.json()

    const fData = await secureFetch(`${process.env.API_REST_URL}/v1/login/2fa/validate`, {
      method: 'POST',
      // we need to pass the cookies
      headers: { cookie: request.headers.get('cookie') ?? '' },
      body: JSON.stringify(bodyData),
    })

    const data = await fData.json()

    if (fData.ok && data.success) {
      const response = NextResponse.json(data, { status: fData.status })

      const responseCookies = fData.headers.get('set-cookie')
      if (responseCookies) {
        parseAndSetResponseCookies(response, responseCookies, new Set([TFA_PENDING_COOKIE_NAME]), 0)
      }

      return response
    }

    if (fData.ok && !data.success) {
      return NextResponse.json(
        {
          success: false,
          message: data.error || 'OTP verification failed',
        },
        { status: 400 },
      )
    }

    return NextResponse.json(data, { status: fData.status })
  } catch (error) {
    console.error('error verifying login TOTP:', error)
    return NextResponse.json({ success: false, message: 'Unable to verify code' }, { status: 500 })
  }
}
