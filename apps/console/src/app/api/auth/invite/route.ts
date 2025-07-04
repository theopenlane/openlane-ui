import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { setSessionCookie } from '@/lib/auth/utils/set-session-cookie'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'

export async function GET(request: NextRequest) {
  const cookies = request.headers.get('cookie')
  const session = await auth()
  const accessToken = session?.user?.accessToken

  const headers: HeadersInit = {
    Authorization: `Bearer ${accessToken}`,
  }

  if (cookies) {
    headers['cookie'] = cookies
  }

  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  const fData = await secureFetch(`${process.env.API_REST_URL}/v1/invite?token=${token}`, {
    method: 'GET',
    headers,
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
