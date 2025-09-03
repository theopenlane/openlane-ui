import { getCSRFCookie } from '@/lib/auth/utils/set-csrf-cookie'
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

  const fData = await fetch(`${process.env.API_REST_URL}/registration/verification`, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyData),
    credentials: 'include',
  })

  if (fData.ok) {
    return NextResponse.json(await fData.json(), { status: 200 })
  }

  if (fData.status !== 201) {
    return NextResponse.json(await fData.json(), { status: fData.status })
  }
}
