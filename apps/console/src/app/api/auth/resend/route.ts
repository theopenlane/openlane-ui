import { serverSecureFetch } from '@/lib/server/core-fetch'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const bodyData = await request.json()

  const fData = await serverSecureFetch(`${process.env.API_REST_URL}/v1/resend`, {
    method: 'POST',
    body: JSON.stringify(bodyData),
  })

  if (fData.ok) {
    return NextResponse.json(await fData.json(), { status: 200 })
  }

  if (fData.status !== 201) {
    return NextResponse.json(await fData.json(), { status: fData.status })
  }
}
