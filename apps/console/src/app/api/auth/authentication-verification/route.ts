import { getCSRFCookie } from '@/lib/auth/utils/set-csrf-cookie'
import { forwardTfaPendingCookie } from '@/lib/auth/utils/tfa-pending-cookie'
import { csrfHeader } from '@repo/dally/auth'

import { NextResponse } from 'next/server'
import { coreFetch } from '@/lib/server/core-fetch'

export async function POST(request: Request) {
  const bodyData = await request.json()
  const cookies = request.headers.get('cookie')

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (cookies) {
    headers['cookie'] = cookies

    const csrfToken = await getCSRFCookie(cookies)
    if (csrfToken) {
      headers[csrfHeader] = csrfToken
    }
  }

  const fData = await coreFetch(`${process.env.API_REST_URL}/authentication/verification`, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyData),
    credentials: 'include',
  })

  if (fData.ok) {
    const data = await fData.json()
    const response = NextResponse.json(data, { status: 200 })
    if (data.tfa_enabled && !data.access_token) {
      forwardTfaPendingCookie(response.cookies, fData.headers)
    }
    return response
  }

  if (fData.status !== 201) {
    return NextResponse.json(await fData.json(), { status: fData.status })
  }
}
