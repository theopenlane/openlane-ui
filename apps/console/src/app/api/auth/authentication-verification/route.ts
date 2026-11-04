import { getCSRFCookie } from '@/lib/auth/utils/set-csrf-cookie'
import { parseAndSetResponseCookies } from '@/lib/auth/utils/parse-response-cookies'
import { TFA_PENDING_COOKIE_NAME } from '@/lib/auth/utils/constants'
import { csrfHeader } from '@repo/dally/auth'

import { NextResponse } from 'next/server'

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

  const fData = await fetch(`${process.env.API_REST_URL}/authentication/verification`, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyData),
    credentials: 'include',
  })

  if (fData.ok) {
    const data = await fData.json()
    const response = NextResponse.json(data, { status: 200 })
    if (data.tfa_enabled && !data.access_token) {
      const responseCookies = fData.headers.get('set-cookie')
      if (responseCookies) {
        parseAndSetResponseCookies(response, responseCookies, new Set([TFA_PENDING_COOKIE_NAME]), 300)
      }
    }
    return response
  }

  if (fData.status !== 201) {
    return NextResponse.json(await fData.json(), { status: fData.status })
  }
}
