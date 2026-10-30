import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { setPasskeyCookie } from '@/lib/auth/utils/set-passkey-cookie'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const fData = await secureFetch(`${process.env.API_REST_URL}/v1/verify?token=${encodeURIComponent(token)}`)

  const data = await fData.json()

  if (fData.ok && data.success && data.user_id) {
    await setPasskeyCookie(data.user_id)
  }

  return NextResponse.json(data, { status: fData.ok ? 200 : fData.status })
}
