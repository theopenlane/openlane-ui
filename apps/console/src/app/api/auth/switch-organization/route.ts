import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { setSessionCookie } from '@/lib/auth/utils/set-session-cookie'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'

export async function POST(request: Request) {
  const bodyData = await request.json()
  const cookies = request.headers.get('cookie')
  const session = await auth()
  const token = session?.user?.accessToken

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
  }

  if (cookies) {
    headers['cookie'] = cookies
  }

  const fData = await secureFetch(`${process.env.API_REST_URL}/v1/switch`, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyData),
    credentials: 'include',
  })

  const fetchedData = await fData.json()

  if (fData.ok) {
    setSessionCookie(fetchedData.session)
    return NextResponse.json(fetchedData, { status: 200 })
  }

  if (fData.status !== 201) {
    return NextResponse.json(fetchedData, { status: fData.status })
  }
}
