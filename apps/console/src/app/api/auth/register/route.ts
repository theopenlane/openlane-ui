import { serverSecureFetch } from '@/lib/server/core-fetch'
import { setPasskeyCookie } from '@/lib/auth/utils/set-passkey-cookie'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const bodyData = await request.json()

  const fData = await serverSecureFetch(`${process.env.API_REST_URL}/v1/register`, {
    method: 'POST',
    body: JSON.stringify(bodyData),
  })

  const data = await fData.json()

  if (fData.ok && data.success && data.user_id) {
    await setPasskeyCookie(data.user_id)
  }

  return NextResponse.json(data, { status: fData.ok ? 200 : fData.status })
}
