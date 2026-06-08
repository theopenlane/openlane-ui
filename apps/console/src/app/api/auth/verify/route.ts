import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const fData = await secureFetch(`${process.env.API_REST_URL}/v1/verify?token=${encodeURIComponent(token)}`)

  if (fData.ok) {
    return NextResponse.json(await fData.json(), { status: 200 })
  }

  if (fData.status !== 200) {
    return NextResponse.json(await fData.json(), { status: fData.status })
  }
}
