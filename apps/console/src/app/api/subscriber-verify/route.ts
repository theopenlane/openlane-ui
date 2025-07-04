import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const token = url.searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const verificationResponse = await secureFetch(`${process.env.API_REST_URL}/v1/subscribe/verify?token=${token}`, {
      method: 'GET',
    })

    const data = await verificationResponse.json()

    if (!verificationResponse.ok) {
      return NextResponse.json(data, { status: verificationResponse.status })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
