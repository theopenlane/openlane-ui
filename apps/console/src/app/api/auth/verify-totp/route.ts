import { serverSecureFetch } from '@/lib/server/core-fetch'
import { clearTfaPendingCookie } from '@/lib/auth/utils/tfa-pending-cookie'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const bodyData = await request.json()

    const fData = await serverSecureFetch(`${process.env.API_REST_URL}/v1/login/2fa/validate`, {
      method: 'POST',
      // we need to pass the cookies
      headers: { cookie: request.headers.get('cookie') ?? '' },
      body: JSON.stringify(bodyData),
    })

    const data = await fData.json()

    if (fData.ok && data.success) {
      const response = NextResponse.json(data, { status: fData.status })

      // the pending login is consumed, always clear the cookie rather than relying on core's response
      clearTfaPendingCookie(response.cookies)

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
