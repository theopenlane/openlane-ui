import { cookies } from 'next/headers'
import { isTfaEnrollmentToken } from '@/lib/auth/utils/token-claims'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { clearTfaPendingCookie, forwardTfaPendingCookie } from '@/lib/auth/utils/tfa-pending-cookie'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const bodyData = await request.json()
    const accessToken = (await cookies()).get('access_token')?.value
    const enrollmentToken = isTfaEnrollmentToken(accessToken) ? accessToken : undefined
    const endpoint = enrollmentToken ? '/v1/2fa/validate' : '/v1/login/2fa/validate'

    const fData = await secureFetch(`${process.env.API_REST_URL}${endpoint}`, {
      method: 'POST',
      // we need to pass the cookies
      headers: {
        cookie: request.headers.get('cookie') ?? '',
        ...(enrollmentToken ? { Authorization: `Bearer ${enrollmentToken}` } : {}),
      },
      body: JSON.stringify(bodyData),
    })

    const data = await fData.json()

    if (fData.ok && data.success) {
      const response = NextResponse.json(data, { status: fData.status })

      // the pending login is consumed, always clear the cookie rather than relying on core's response
      clearTfaPendingCookie(response.cookies)
      if (enrollmentToken) {
        forwardTfaPendingCookie(response.cookies, fData.headers, data.access_token)
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

    const response = NextResponse.json(data, { status: fData.status })
    if (fData.status === 401) {
      clearTfaPendingCookie(response.cookies, true)
    }
    return response
  } catch (error) {
    console.error('error verifying login TOTP:', error)
    return NextResponse.json({ success: false, message: 'Unable to verify code' }, { status: 500 })
  }
}
