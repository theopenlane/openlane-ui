import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { csrfHeader } from '@repo/dally/auth'
import { getCSRFCookie } from '@/lib/auth/utils/set-csrf-cookie'

// Ends the active Openlane support / impersonation session. It forwards the impersonation token to the
// backend, which revokes the session so the token can no longer be used before its expiry. The client
// then clears its local session via signOut.
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

  const fData = await fetch(`${process.env.API_REST_URL}/v1/impersonation/end`, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyData),
    credentials: 'include',
  })

  const fetchedData = await fData.json().catch(() => ({}))

  return NextResponse.json(fetchedData, { status: fData.status })
}
