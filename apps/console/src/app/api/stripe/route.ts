import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'

export async function GET(request: Request) {
  const cookies = request.headers.get('cookie')
  const session = await auth()
  const token = session?.user?.accessToken

  const headers: HeadersInit = {
    'content-type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
  if (cookies) {
    headers['cookie'] = cookies
  }

  const fData = await fetch(`${process.env.API_REST_URL}/v1/checkout/session`, {
    method: 'GET',
    headers,
    credentials: 'include',
  })

  const fetchedData = await fData.json()

  if (fData.ok) {
    return NextResponse.json(fetchedData, { status: 200 })
  }

  if (fData.status !== 201) {
    return NextResponse.json(fetchedData, { status: fData.status })
  }
}