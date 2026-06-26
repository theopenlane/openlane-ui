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

  try {
    const bodyData = await request.json().catch(() => ({}))
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

    const fData = await fetch(`${process.env.API_REST_URL}/v1/impersonation/end`, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyData),
      credentials: 'include',
    })

    const fetchedData = await fData.json().catch(() => ({}))

    return NextResponse.json(fetchedData, { status: fData.status })
  } catch (error) {
    console.error('Impersonation end error:', error)
    return NextResponse.json({ success: false, message: 'Could not end impersonation session' }, { status: 500 })
  }
}
