import { serverSecureFetch } from '@/lib/server/core-fetch'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const bodyData = await request.json()

  const fData = await serverSecureFetch(`${process.env.API_REST_URL}/authentication/options`, {
    method: 'POST',
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
