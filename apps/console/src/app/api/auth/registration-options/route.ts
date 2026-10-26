import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { csrfHeader } from '@repo/dally/auth'
import { getCSRFCookie } from '@/lib/auth/utils/set-csrf-cookie'

export async function POST(request: Request) {
  const session = await auth()
  const token = session?.user?.accessToken

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const bodyData = await request.json()
  const cookies = request.headers.get('cookie')

  const headers: HeadersInit = {
    'content-type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  if (cookies) {
    headers['cookie'] = cookies
  }

  const csrfToken = await getCSRFCookie(cookies)
  if (csrfToken) {
    headers[csrfHeader] = csrfToken
  }

  const fData = await fetch(`${process.env.API_REST_URL}/registration/options`, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyData),
    credentials: 'include',
  })

  const data = await fData.json()

  if (fData.ok) {
    return NextResponse.json(data, { status: 200 })
  }

  if (fData.status !== 201) {
    return NextResponse.json(data, { status: fData.status })
  }
}
