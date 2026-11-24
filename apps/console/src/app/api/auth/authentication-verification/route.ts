import { forwardTfaPendingCookie } from '@/lib/auth/utils/tfa-pending-cookie'

import { NextResponse } from 'next/server'
import { serverSecureFetch } from '@/lib/server/core-fetch'

export async function POST(request: Request) {
  try {
    const bodyData = await request.json()
    const cookies = request.headers.get('cookie')

    const fData = await serverSecureFetch(`${process.env.API_REST_URL}/authentication/verification`, {
      method: 'POST',
      headers: cookies ? { cookie: cookies } : {},
      body: JSON.stringify(bodyData),
    })

    if (!fData.ok) {
      return NextResponse.json(await fData.json(), { status: fData.status })
    }

    const data = await fData.json()
    const response = NextResponse.json(data, { status: 200 })
    if (data.tfa_required || (data.tfa_enabled && !data.access_token)) {
      forwardTfaPendingCookie(response.cookies, fData.headers, data.tfa_required ? data.access_token : undefined)
    }
    return response
  } catch (error) {
    console.error('passkey verification error:', error)
    return NextResponse.json({ success: false, error: 'Unable to verify your passkey. Please try again later.' }, { status: 502 })
  }
}
