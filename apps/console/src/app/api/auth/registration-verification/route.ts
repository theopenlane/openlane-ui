import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const bodyData = await request.json()
  const cookies = request.headers.get('cookie')

  const headers: HeadersInit = {
    'content-type': 'application/json',
  }
  if (cookies) {
    headers['cookie'] = cookies
  }

  const fData = await fetch(`${process.env.API_REST_URL}/v1/registration/verification`, {
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
