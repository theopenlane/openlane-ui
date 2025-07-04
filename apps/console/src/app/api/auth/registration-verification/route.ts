import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const bodyData = await request.json()
  const cookies = request.headers.get('cookie')

  const headers: HeadersInit = {}

  if (cookies) {
    headers['cookie'] = cookies
  }

  const fData = await secureFetch(`${process.env.API_REST_URL}/registration/verification`, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyData),
  })

  if (fData.ok) {
    return NextResponse.json(await fData.json(), { status: 200 })
  }

  if (fData.status !== 201) {
    return NextResponse.json(await fData.json(), { status: fData.status })
  }
}
