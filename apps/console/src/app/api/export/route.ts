import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth.ts'

export async function POST(request: Request) {
  const bodyData = await request.json()
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

  const fData = await fetch(`${process.env.API_REST_URL}/example/csv`, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyData),
    credentials: 'include',
  })

  if (fData.ok) {
    const blob = await fData.blob()

    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${bodyData.filename}.csv"`,
      },
    })
  }

  const data = await fData.json()

  if (fData.status !== 201) {
    return NextResponse.json(data, { status: fData.status })
  }
}
